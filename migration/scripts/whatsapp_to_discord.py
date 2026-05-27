import os
import re
import json
import asyncio
import httpx
import mimetypes
import urllib.parse
from pathlib import Path
from datetime import datetime
import argparse
import tempfile
import zipfile

REPO_ROOT = Path(__file__).parent.parent

def load_env():
    env_path = REPO_ROOT / ".env.local"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key] = val.strip("'\"")

def get_initials_avatar(name):
    if not name:
        return "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/1024px-Telegram_logo.svg.png"
    parts = name.split()
    initials = ""
    if len(parts) >= 2:
        initials = parts[0][0] + parts[-1][0]
    elif parts:
        initials = parts[0][0]
    else:
        initials = "T"
    
    safe_name = urllib.parse.quote(initials)
    return f"https://ui-avatars.com/api/?name={safe_name}&background=random&color=fff&size=128"

def parse_chat_file(chat_file_path):
    messages = []
    pattern = re.compile(r'^\u200e?\[([^\]]+)\] ([^:]+):\s+(.*)$')
    msg_id = 1
    
    with open(chat_file_path, "r", encoding="utf-8") as f:
        current_msg = None
        for line in f:
            clean_line = line.lstrip('\u200e')
            match = pattern.match(clean_line)
            if match:
                if current_msg:
                    messages.append(current_msg)
                
                date_str = match.group(1).replace('\u202f', ' ')
                sender = match.group(2).strip()
                text = match.group(3)
                
                try:
                    dt = datetime.strptime(date_str, "%m/%d/%y, %I:%M:%S %p")
                except ValueError:
                    try:
                        dt = datetime.strptime(date_str, "%m/%d/%y, %I:%M %p")
                    except ValueError:
                        dt = None
                
                current_msg = {
                    "id": msg_id,
                    "datetime": dt,
                    "date_str": date_str,
                    "sender": sender,
                    "text": [text]
                }
                msg_id += 1
            else:
                if current_msg:
                    current_msg["text"].append(line)
        
        if current_msg:
            messages.append(current_msg)
            
    return messages

async def send_to_discord(client, webhook_url, payload, file_path=None, state_file=None, msg_id=None):
    url_with_wait = f"{webhook_url}?wait=true"
    
    try:
        if file_path and Path(file_path).exists():
            file_size = Path(file_path).stat().st_size
            if file_size > 10 * 1024 * 1024:
                payload["content"] = payload.get("content", "") + "\n\n*[Attachment too large (>10MB)]*"
                resp = await client.post(url_with_wait, json=payload)
            else:
                mime_type, _ = mimetypes.guess_type(file_path)
                if not mime_type:
                    mime_type = "application/octet-stream"
                
                with open(file_path, "rb") as f:
                    files = {"file": (Path(file_path).name, f, mime_type)}
                    data = {"payload_json": json.dumps(payload)}
                    resp = await client.post(url_with_wait, data=data, files=files)
        else:
            resp = await client.post(url_with_wait, json=payload)
            
        if resp.status_code in [200, 204]:
            discord_id = resp.json().get("id") if resp.status_code == 200 else None
            if state_file and discord_id and msg_id is not None:
                with open(state_file, "a") as f:
                    f.write(json.dumps({
                        "wa_msg_id": msg_id,
                        "discord_id": discord_id,
                        "webhook_url": webhook_url
                    }) + "\n")
            return True, discord_id or "SUCCESS"
        elif resp.status_code == 429:
            retry_after = resp.json().get("retry_after", 1.0)
            print(f"Rate limited! Waiting {retry_after}s...")
            await asyncio.sleep(retry_after)
            return False, "RATE_LIMIT"
        elif resp.status_code == 413:
            return False, "FILE_TOO_LARGE"
        else:
            print(f"Error {resp.status_code}: {resp.text}")
            return False, f"HTTP_{resp.status_code}"
            
    except Exception as e:
        print(f"Exception sending to discord: {e}")
        return False, str(e)

async def delete_message(client, webhook_url, discord_id):
    delete_url = f"{webhook_url}/messages/{discord_id}"
    try:
        resp = await client.delete(delete_url)
        return resp.status_code == 204
    except Exception as e:
        print(f"Error deleting {discord_id}: {e}")
        return False

async def revert_migration(state_file):
    if not state_file.exists():
        print("No migration state found to revert.")
        return

    sent = []
    with open(state_file, "r") as f:
        for line in f:
            try:
                sent.append(json.loads(line))
            except: continue

    if not sent:
        print("No messages to revert.")
        return

    print(f"Reverting {len(sent)} messages...")
    async with httpx.AsyncClient() as client:
        for i, item in enumerate(reversed(sent)):
            success = await delete_message(client, item["webhook_url"], item["discord_id"])
            if success:
                print(f"[{i+1}/{len(sent)}] Deleted Discord message {item['discord_id']}")
            else:
                print(f"[{i+1}/{len(sent)}] Failed to delete {item['discord_id']}")
            await asyncio.sleep(0.1)

    state_file.unlink()
    print("Revert complete. State file removed.")

def extract_attachment(text):
    match = re.search(r'<attached:\s*([^>]+)>', text)
    if match:
        return match.group(1).strip()
    return None

async def main():
    parser = argparse.ArgumentParser(description="Migrate WhatsApp zip dump to Discord via Webhooks.")
    parser.add_argument("--zip", type=str, help="Path to the WhatsApp exported ZIP file (required unless reverting)")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of messages to send (0 = no limit)")
    parser.add_argument("--range", nargs="+", type=int, help="Migrate specific message IDs. E.g. --range 109 or --range 109 115")
    parser.add_argument("--revert", action="store_true", help="Delete all previously sent messages tracked in state file")
    parser.add_argument("--target", type=str, choices=["group", "private"], default="group", help="Target webhook: 'group' or 'private' (default: group)")
    parser.add_argument("--state", type=str, help="Path to track sent messages (defaults to telegram_dump/whatsapp_sent_<target>.jsonl)")
    args = parser.parse_args()

    load_env()
    
    if args.state:
        state_path = Path(args.state)
    else:
        state_path = REPO_ROOT / "telegram_dump" / f"whatsapp_sent_{args.target}.jsonl"
    
    if args.revert:
        await revert_migration(state_path)
        return

    if not args.zip:
        print("Error: --zip is required unless --revert is used.")
        return

    if args.target == "private":
        webhook_url = os.environ.get("DISCORD_WEBHOOK_PRIVATE")
        env_name = "DISCORD_WEBHOOK_PRIVATE"
    else:
        webhook_url = os.environ.get("DISCORD_WEBHOOK_GROUP_CHAT")
        env_name = "DISCORD_WEBHOOK_GROUP_CHAT"

    if not webhook_url:
        print(f"Error: {env_name} not set in .env.local")
        return
        
    zip_path = Path(args.zip)
    if not zip_path.exists():
        print(f"Error: {zip_path} not found")
        return
        
    with tempfile.TemporaryDirectory() as tmp_dir:
        print(f"Extracting {zip_path} to temporary directory...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(tmp_dir)
            
        chat_dir = Path(tmp_dir)
        chat_files = list(chat_dir.rglob("_chat.txt"))
        if not chat_files:
            print(f"Error: _chat.txt not found anywhere in {zip_path}")
            return
            
        chat_file = chat_files[0]
        actual_chat_dir = chat_file.parent
        
        senders_file = REPO_ROOT / "telegram_dump" / "senders.json"
        avatars_file = REPO_ROOT / "telegram_dump" / "avatars.json"
        
        tg_senders = {}
        tg_avatars = {}
        
        if senders_file.exists():
            with open(senders_file, "r") as f:
                tg_senders = json.load(f)
                
        if avatars_file.exists():
            with open(avatars_file, "r") as f:
                tg_avatars = json.load(f)
                
        wa_to_tg_id = {
            "Yayayayayaya": "1108558041",
            "Moses Jovilaga": "6106251839",
            "Nuzulul Dian Maulida": "1181911631",
            "Vincent": "1257872236",
            "Harmony Aulia Keisha": "5313013623",
            "Yakobus Tosan Sejati Dinar Purnomo": "7360514157",
            "Syaka Maheswara Adi Suro": "7698035757",
            "Alexandro Hamonangan Hutasoit": "8432072316",
            "Elizabeth Ardhayu Maheswari": "7862939641",
        }
        
        sent_ids = set()
        if state_path.exists():
            with open(state_path, "r") as sf:
                for line in sf:
                    try:
                        data = json.loads(line)
                        sent_ids.add(data.get("wa_msg_id"))
                    except: continue
            print(f"Resuming: {len(sent_ids)} messages already migrated.")
        
        messages = parse_chat_file(chat_file)
        
        range_start = None
        range_end = None
        if args.range:
            range_start = args.range[0]
            range_end = args.range[-1]
            print(f"Limiting range from {range_start} to {range_end}")
            
        print(f"Parsed {len(messages)} messages total.")
        
        current_day = None
        count_sent = 0
        count_evaluated = 0
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            for msg in messages:
                if args.limit > 0 and count_sent >= args.limit:
                    break
                    
                msg_id = msg["id"]
                if range_start is not None:
                    if msg_id < range_start: continue
                    if msg_id > range_end: continue
                    
                if msg_id in sent_ids:
                    continue
                    
                count_evaluated += 1
                dt = msg["datetime"]
                
                if dt:
                    day_str = dt.strftime("%Y-%m-%d")
                    if current_day != day_str:
                        current_day = day_str
                        friendly_date = dt.strftime("%A, %B %d, %Y")
                        bridge_payload = {
                            "username": "Timeline",
                            "avatar_url": get_initials_avatar("Timeline"),
                            "content": f"**--- {friendly_date} ---**"
                        }
                        
                        while True:
                            success, res = await send_to_discord(client, webhook_url, bridge_payload, None, state_path, f"bridge_{day_str}")
                            if success:
                                break
                            elif res == "RATE_LIMIT":
                                continue
                            else:
                                break
                        print(f"Sent bridging message for {friendly_date}")
                
                sender = msg["sender"]
                full_text = "".join(msg["text"]).strip()
                
                attachment_filename = extract_attachment(full_text)
                file_path = None
                if attachment_filename:
                    file_path = actual_chat_dir / attachment_filename
                    full_text = re.sub(r'\u200e?<attached:\s*[^>]+>', '', full_text).strip()
                    if not file_path.exists():
                        print(f"Warning: Attached file {file_path} not found in zip.")
                        file_path = None
                    
                if dt:
                    time_prefix = f"[{dt.strftime('%H:%M')}]"
                    content = f"`{time_prefix}` {full_text}".strip()
                else:
                    time_prefix = ""
                    content = full_text.strip()                
                if sender == "HIMA Musik 2026/2027":
                    tg_full_name = "Group Notice"
                    avatar_url = get_initials_avatar("Group Notice")
                else:
                    tg_id = wa_to_tg_id.get(sender)
                    avatar_url = None
                    tg_full_name = sender
                    
                    if tg_id and tg_id in tg_senders:
                        tg_sender = tg_senders[tg_id]
                        tg_full_name = tg_sender.get("full_name") or tg_sender.get("first_name", sender)
                        avatar_url = tg_avatars.get(tg_id)
                        
                    if not avatar_url:
                        avatar_url = get_initials_avatar(tg_full_name)
                    
                payload = {
                    "username": tg_full_name,
                    "avatar_url": avatar_url,
                    "content": content
                }
                
                if not payload["content"] and file_path:
                    payload["content"] = f"`{time_prefix}` " if dt else " "
                    
                content_text = payload["content"]
                chunks = []
                
                if len(content_text) <= 1950:
                    chunks = [content_text]
                else:
                    curr = ""
                    for line in content_text.split('\n'):
                        if len(curr) + len(line) + 1 > 1950:
                            if curr:
                                chunks.append(curr.rstrip('\n'))
                                curr = ""
                            if len(line) > 1950:
                                for i in range(0, len(line), 1950):
                                    chunk_part = line[i:i+1950]
                                    if i + 1950 < len(line):
                                        chunks.append(chunk_part)
                                    else:
                                        curr = chunk_part + '\n'
                            else:
                                curr = line + '\n'
                        else:
                            curr += line + '\n'
                    if curr.strip():
                        chunks.append(curr.rstrip('\n'))
                        
                if not chunks and content_text:
                    chunks = [content_text]
                    
                for idx, chunk in enumerate(chunks):
                    chunk_payload = payload.copy()
                    chunk_payload["content"] = chunk
                    
                    is_last = (idx == len(chunks) - 1)
                    current_file = file_path if is_last else None
                    
                    while True:
                        success, res = await send_to_discord(client, webhook_url, chunk_payload, current_file, state_path, msg_id if is_last else None)
                        if success:
                            if is_last:
                                count_sent += 1
                                print(f"[{count_sent} sent] Sent message {msg_id} from {sender} at {time_prefix.strip()}")
                            else:
                                print(f"Sent chunk {idx+1}/{len(chunks)} of message {msg_id}")
                            await asyncio.sleep(0.5) 
                            break
                        elif res == "RATE_LIMIT":
                            continue
                        elif res == "FILE_TOO_LARGE":
                            chunk_payload["content"] += "\n\n*[Attachment too large for Discord]*"
                            current_file = None
                        else:
                            print(f"Failed to send message {msg_id} from {sender} (chunk {idx+1}): {res}")
                            await asyncio.sleep(5)
        
        print(f"Migration complete. Evaluated {count_evaluated}, Processed {count_sent} messages.")

if __name__ == "__main__":
    asyncio.run(main())
