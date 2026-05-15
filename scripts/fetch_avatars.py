#!/usr/bin/env python3
import asyncio
import json
import os
import httpx
from pathlib import Path
from telethon import TelegramClient

# API config (should be passed via environment variables)
try:
    API_ID = int(os.environ["TG_API_ID"])
    API_HASH = os.environ["TG_API_HASH"]
    PHONE = os.environ["TG_PHONE"]
except KeyError as e:
    print(f"Error: Missing environment variable {e}")
    print("Please ensure TG_API_ID, TG_API_HASH, and TG_PHONE are set in .env.local or exported.")
    exit(1)

SESSION_NAME = 'tg_hima_fetch'

async def upload_to_catbox(file_path):
    """Uploads a file to catbox.moe and returns the URL."""
    async with httpx.AsyncClient() as client:
        try:
            with open(file_path, "rb") as f:
                files = {"fileToUpload": (os.path.basename(file_path), f, "image/jpeg")}
                data = {"reqtype": "fileupload"}
                resp = await client.post("https://catbox.moe/user/api.php", data=data, files=files, timeout=30)
                if resp.status_code == 200:
                    return resp.text.strip()
        except Exception as e:
            print(f"Upload error: {e}")
    return None

async def main():
    client = TelegramClient(SESSION_NAME, API_ID, API_HASH)
    
    print("Connecting to Telegram...")
    await client.connect()
    
    if not await client.is_user_authorized():
        print("Session not authorized. You may need to run this interactively once.")
        # Attempting login with provided code if environment variable exists
        code = os.getenv("TG_CODE")
        if code:
            print(f"Attempting login with provided code: {code}")
            try:
                await client.sign_in(PHONE, code)
            except Exception as e:
                print(f"Login failed: {e}")
                return
        else:
            print("Please run with TG_CODE=xxxxx to authorize.")
            return

    # Load senders
    senders_path = Path("telegram_dump/senders.json")
    if not senders_path.exists():
        print("senders.json not found.")
        return
    
    with open(senders_path, "r") as f:
        senders = json.load(f)

    # Load existing avatars to avoid re-fetching
    avatar_cache_path = Path("telegram_dump/avatars.json")
    avatars = {}
    if avatar_cache_path.exists():
        with open(avatar_cache_path, "r") as f:
            avatars = json.load(f)

    temp_dir = Path("telegram_dump/temp_avatars")
    temp_dir.mkdir(exist_ok=True)

    print(f"Checking avatars for {len(senders)} users...")
    
    new_found = 0
    for user_id, info in senders.items():
        if user_id in avatars:
            continue
            
        try:
            name = info.get('full_name') or info.get('username') or user_id
            print(f"Fetching avatar for {name} ({user_id})...")
            
            # Download and host it (Telethon returns None if no photo)
            path = await client.download_profile_photo(int(user_id), file=str(temp_dir / f"{user_id}.jpg"))
            if path:
                print(f"-> Uploading avatar to Catbox...")
                url = await upload_to_catbox(path)
                if url:
                    avatars[user_id] = url
                    print(f"-> Done: {url}")
                    new_found += 1
                os.remove(path)
            else:
                print(f"-> No profile photo found for {user_id}")
                # Set a small marker so we don't try again soon
                avatars[user_id] = None 
        except Exception as e:
            print(f"Error for {user_id}: {e}")
        
        # Save progress frequently
        with open(avatar_cache_path, "w") as f:
            json.dump(avatars, f, indent=2)
        
        await asyncio.sleep(0.5)

    print(f"Finished. Found {new_found} new avatars.")
    # Telethon's disconnect may be synchronous in some versions; call without await
    try:
        await client.disconnect()
    except TypeError:
        try:
            client.disconnect()
        except Exception:
            pass

if __name__ == "__main__":
    asyncio.run(main())
