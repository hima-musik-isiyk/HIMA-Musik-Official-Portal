#!/usr/bin/env python3
import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
import httpx

# === CONFIGURATION ===
# Default paths (relative to project root)
REPO_ROOT = Path(__file__).parent.parent
DEFAULT_MESSAGES_FILE = REPO_ROOT / "telegram_dump" / "messages.jsonl"
DEFAULT_STATE_FILE = REPO_ROOT / "telegram_dump" / "sent_messages.jsonl"

# Load dotenv if present to grab WEBHOOK URLs
env_path = REPO_ROOT / ".env.local"
if env_path.exists():
    # A simple manual dotenv parser to avoid requiring external python-dotenv dependency
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key] = val.strip("'\"")

# Load Webhook URLs from Environment Variables
WEBHOOKS = {
    "yapping": os.environ.get("DISCORD_WEBHOOK_YAPPING"),
    "diskusi-when-meeting-yh": os.environ.get("DISCORD_WEBHOOK_DISKUSI_WHEN_MEETING_YH"),
    "diskusi-umum-bph": os.environ.get("DISCORD_WEBHOOK_DISKUSI_UMUM_BPH"),
    "surat-arsip-ketua": os.environ.get("DISCORD_WEBHOOK_SURAT_ARSIP_KETUA"),
    "surat-keluar": os.environ.get("DISCORD_WEBHOOK_SURAT_KELUAR"),
    "notulensi-rapat": os.environ.get("DISCORD_WEBHOOK_NOTULENSI_RAPAT"),
    "diskusi-umum-pdd": os.environ.get("DISCORD_WEBHOOK_DISKUSI_UMUM_PDD"),
    "dump-ide-konten": os.environ.get("DISCORD_WEBHOOK_DUMP_IDE_KONTEN"),
    "dokumentasi-anything": os.environ.get("DISCORD_WEBHOOK_DOKUMENTASI_ANYTHING"),
    "diskusi-umum-humas": os.environ.get("DISCORD_WEBHOOK_DISKUSI_UMUM_HUMAS"),
    "info-masuk-eksternal": os.environ.get("DISCORD_WEBHOOK_INFO_MASUK_EKSTERNAL"),
    "diskusi-umum-program": os.environ.get("DISCORD_WEBHOOK_DISKUSI_UMUM_PROGRAM"),
    "ev-stuban-april": os.environ.get("DISCORD_WEBHOOK_EV_STUBAN_APRIL"),
    "ev-makrab-mei": os.environ.get("DISCORD_WEBHOOK_EV_MAKRAB_MEI"),
    "ev-pkkmb": os.environ.get("DISCORD_WEBHOOK_EV_PKKMB"),
    "ev-musikologigs": os.environ.get("DISCORD_WEBHOOK_EV_MUSIKOLOGIGS"),
    "ev-nostradamus": os.environ.get("DISCORD_WEBHOOK_EV_NOSTRADAMUS"),
    "aduan": None, 
    "pendaftaran": None,
}

# Extract the stripped chat ID for Telegram links
RAW_CHAT_ID = os.environ.get("TELEGRAM_GROUP_CHAT_ID", "-1003749076588")
STRIPPED_CHAT_ID = RAW_CHAT_ID[4:] if RAW_CHAT_ID.startswith("-100") else RAW_CHAT_ID

# Mapping Telegram topics to Discord webhooks keys
TOPIC_MAP = {
    "general": "yapping",
    "1401": "surat-keluar",
    "145": "yapping",
    "1853": "dump-ide-konten",
    "1977": "info-masuk-eksternal",
    "1981": "ev-stuban-april",
    "1985": "surat-arsip-ketua",
    "1987": "diskusi-umum-pdd",
    "2": "diskusi-umum-bph",
    "2136": "diskusi-when-meeting-yh",
    "239": "pendaftaran",
    "288": "dump-ide-konten",
    "3": "aduan",
    "3208": "notulensi-rapat",
    "560": "diskusi-umum-pdd",
    "562": "dokumentasi-anything",
}

DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/1024px-Telegram_logo.svg.png"

import urllib.parse

def get_initials_avatar(name):
    if not name:
        return f"{DEFAULT_AVATAR}"
    parts = name.split()
    initials = ""
    if len(parts) >= 2:
        # Use first and last word initials (e.g. Syaka Maheswara Suro -> SS)
        initials = parts[0][0] + parts[-1][0]
    elif parts:
        initials = parts[0][0]
    else:
        initials = "T"
    
    safe_name = urllib.parse.quote(initials)
    return f"https://ui-avatars.com/api/?name={safe_name}&background=random&color=fff&size=128"

def get_discord_identity(sender, avatars=None):
    if not sender:
        return {"username": "Telegram System", "avatar_url": DEFAULT_AVATAR}
    
    user_id = str(sender.get("id"))
    username = sender.get("username")
    full_name = sender.get("full_name") or f"{sender.get('first_name', '')} {sender.get('last_name', '')}".strip()
    
    # Priority: 
    # 1. Fetched avatar from avatars.json (Catbox URL or t.me URL)
    # 2. Initials-based avatar if fetched avatar is null or missing
    # 3. Default Telegram logo if all else fails
    
    avatar_url = None
    if avatars and user_id in avatars:
        avatar_url = avatars[user_id] # May be a URL or None
    
    if not avatar_url:
        # Generate initials avatar
        avatar_url = get_initials_avatar(full_name)
    
    return {
        "username": f"@{username}" if username else full_name,
        "avatar_url": avatar_url
    }
import mimetypes

async def send_message(client, webhook_url, payload, tg_msg_id, topic_id, state_file, local_path=None):
    # Append ?wait=true to get the Discord message ID back
    url_with_wait = f"{webhook_url}?wait=true"
    try:
        resp = None
        if local_path and Path(local_path).exists():
            mime_type, _ = mimetypes.guess_type(local_path)
            if not mime_type:
                mime_type = "application/octet-stream"
            
            # Discord limits webhook files. Let's warn if > 10MB (Free Discord max without boost usually 10MB-25MB)
            # We'll try to send anyway, if it fails with 413, we catch it later.
            if Path(local_path).stat().st_size > 10 * 1024 * 1024:
                t_topic = "1" if topic_id == "general" else topic_id
                tg_link = f"https://t.me/c/{STRIPPED_CHAT_ID}/{t_topic}/{tg_msg_id}"
                payload["content"] = payload.get("content", "") + f"\n\n*[Attachment too large (>10MB). View on Telegram: {tg_link}]*"
                resp = await client.post(url_with_wait, json=payload)
            else:
                with open(local_path, "rb") as f:
                    files = {"file": (Path(local_path).name, f, mime_type)}
                    data = {"payload_json": json.dumps(payload)}
                    resp = await client.post(url_with_wait, data=data, files=files)
        else:
            resp = await client.post(url_with_wait, json=payload)

        if resp.status_code == 200:
            discord_data = resp.json()
            discord_id = discord_data.get("id")
            # Save to state file
            with open(state_file, "a") as f:
                f.write(json.dumps({
                    "tg_msg_id": tg_msg_id,
                    "discord_id": discord_id,
                    "webhook_url": webhook_url
                }) + "\n")
            return True, discord_id
        elif resp.status_code == 429:
            retry_after = resp.json().get("retry_after", 1.0)
            print(f"Rate limited! Waiting {retry_after}s...")
            await asyncio.sleep(retry_after)
            return False, "RATE_LIMIT"
        elif resp.status_code == 413:
             return False, "FILE_TOO_LARGE"
        else:
            return False, f"{resp.status_code} {resp.text}"
    except Exception as e:
        return False, f"EXCEPTION: {repr(e)}"

async def delete_message(client, webhook_url, discord_id):
    # DELETE /webhooks/{id}/{token}/messages/{message_id}
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
            await asyncio.sleep(0.1) # Rate limit protection

    # Clear state file
    state_file.unlink()
    print("Revert complete. State file removed.")

async def migrate(args):
    messages_path = Path(args.messages)
    state_path = Path(args.state)
    avatar_path = Path(REPO_ROOT / "telegram_dump" / "avatars.json")
    media_manifest_path = Path(REPO_ROOT / "telegram_dump" / "media_manifest.jsonl")
    
    if args.revert:
        await revert_migration(state_path)
        return

    if not messages_path.exists():
        print(f"Error: {messages_path} not found.")
        return

    # Load avatars if they exist
    avatars = {}
    if avatar_path.exists():
        try:
            with open(avatar_path, "r") as f:
                avatars = json.load(f)
            print(f"Loaded {len(avatars)} avatar mappings.")
        except Exception as e:
            print(f"Warning: Could not load avatars: {e}")

    # Load media mappings
    media_map = {}
    if media_manifest_path.exists():
        try:
            with open(media_manifest_path, "r") as mf:
                for line in mf:
                    try:
                        data = json.loads(line)
                        if data.get("local_path"):
                            media_map[data["message_id"]] = REPO_ROOT / data["local_path"]
                    except json.JSONDecodeError:
                        continue
            print(f"Loaded {len(media_map)} media file mappings.")
        except Exception as e:
            print(f"Warning: Could not load media manifest: {e}")

    # Load already sent IDs to enable smart resume
    sent_ids = set()
    if state_path.exists():
        try:
            with open(state_path, "r") as sf:
                for line in sf:
                    try:
                        data = json.loads(line)
                        sent_ids.add(data.get("tg_msg_id"))
                    except json.JSONDecodeError:
                        continue
            print(f"Resuming: {len(sent_ids)} messages already migrated.")
        except Exception as e:
            print(f"Warning: Could not read state for resume: {e}")

    range_start = None
    range_end = None
    if hasattr(args, 'range') and args.range:
        range_start = args.range[0]
        range_end = args.range[-1]
        args.limit = float('inf')
        print(f"Starting migration for message IDs in range {range_start} to {range_end}...")
    else:
        print(f"Starting migration (Evaluating first {args.limit} messages from the dump)...")
    
    count_evaluated = 0
    count_sent = 0
    
    # Increase timeout to 60s for large file uploads
    async with httpx.AsyncClient(timeout=60.0) as client:
        with open(messages_path, "r") as f:
            for line in f:
                if count_evaluated >= args.limit:
                    break
                
                count_evaluated += 1
                
                try:
                    msg = json.loads(line)
                except json.JSONDecodeError:
                    continue
                
                tg_msg_id = msg.get("message_id")
                
                # If range is specified, skip messages outside the range
                if range_start is not None:
                    if tg_msg_id < range_start:
                        continue
                    if tg_msg_id > range_end:
                        # Assuming messages are sorted chronologically
                        continue
                
                # Skip if already migrated (Fast O(1) set lookup for gap detection)
                if tg_msg_id in sent_ids:
                    continue
                
                topic_id = str(msg.get("topic_id"))
                webhook_key = TOPIC_MAP.get(topic_id)
                webhook_url = WEBHOOKS.get(webhook_key)

                # Fallback to yapping channel if no destination mapped or url is None
                if not webhook_url:
                    webhook_key = "yapping"
                    webhook_url = WEBHOOKS.get("yapping")

                if not webhook_url:
                    continue

                local_media_path = media_map.get(tg_msg_id)

                text = msg.get("text")
                if not text:
                    action = msg.get("action")
                    if action:
                        text = f"*Action: {action.get('type')}*"
                    elif local_media_path:
                        text = "" # Discord allows empty text if media is attached
                    else:
                        text = "*[Media/Empty]*"

                identity = get_discord_identity(msg.get("sender"), avatars=avatars)
                payload = {
                    "username": identity["username"],
                    "avatar_url": identity["avatar_url"],
                    "content": text
                }

                if args.dry_run:
                    print(f"[DRY-RUN] Would send msg {tg_msg_id} to {webhook_key} (Media: {bool(local_media_path)})")
                    count_sent += 1
                else:
                    # Send with retry for rate limits AND timeouts
                    while True:
                        success, discord_msg_id = await send_message(client, webhook_url, payload, tg_msg_id, topic_id, state_path, local_media_path)
                        if success:
                            count_sent += 1
                            media_str = " + Media" if local_media_path else ""
                            print(f"[Eval {count_evaluated}/{args.limit} | Sent {count_sent}] Forwarded Telegram {tg_msg_id}{media_str} -> Discord {discord_msg_id}")
                            await asyncio.sleep(0.1) # Small delay to be safe
                            break
                        elif discord_msg_id == "RATE_LIMIT":
                            continue # Will sleep and loop again
                        elif discord_msg_id == "FILE_TOO_LARGE":
                            print(f"[Eval {count_evaluated}/{args.limit}] Failed msg {tg_msg_id}: File too large. Sending without media.")
                            t_topic = "1" if topic_id == "general" else topic_id
                            tg_link = f"https://t.me/c/{STRIPPED_CHAT_ID}/{t_topic}/{tg_msg_id}"
                            payload["content"] = payload.get("content", "") + f"\n\n*[Attachment too large for Discord. View on Telegram: {tg_link}]*"
                            local_media_path = None
                        else:
                            print(f"[Eval {count_evaluated}/{args.limit}] Failed msg {tg_msg_id}: {discord_msg_id}")
                            print("Retrying in 5 seconds to avoid skipping and breaking chronological order...")
                            await asyncio.sleep(5)
                            # Let it loop and retry!

    print(f"Migration batch complete. Evaluated {count_evaluated} messages, sent {count_sent} new messages.")

def main():
    parser = argparse.ArgumentParser(description="Migrate Telegram messages to Discord via Webhooks.")
    parser.add_argument("--messages", type=str, default=str(DEFAULT_MESSAGES_FILE), help="Path to messages.jsonl")
    parser.add_argument("--state", type=str, default=str(DEFAULT_STATE_FILE), help="Path to track sent messages")
    parser.add_argument("--limit", type=int, default=10, help="Number of messages to process")
    parser.add_argument("--revert", action="store_true", help="Delete all previously sent messages tracked in state file")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be sent without sending")
    parser.add_argument("--range", nargs="+", type=int, help="Migrate specific message IDs. E.g. --range 109 or --range 109 115")
    
    args = parser.parse_args()
    asyncio.run(migrate(args))

if __name__ == "__main__":
    main()
