#!/usr/bin/env python3
"""Append Telegram group messages to local JSONL files.

Usage with uvx:
  TG_API_ID=... TG_API_HASH=... TG_CHAT_ID=... uvx --with telethon python scripts/telegram_dump.py

First login can also be non-interactive:
  TG_PHONE=+628... TG_CODE=12345 TG_PASSWORD=... uvx --with telethon python scripts/telegram_dump.py
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from telethon import TelegramClient
from telethon.tl.types import User


def json_default(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def write_json(path: Path, payload: Any) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, default=json_default) + "\n",
        encoding="utf-8",
    )


def append_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    with path.open("a", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, default=json_default) + "\n")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, default=json_default) + "\n")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_no, line in enumerate(handle, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise SystemExit(f"Invalid JSONL at {path}:{line_no}: {exc}") from exc
    return rows


def jsonl_by_id(path: Path, key: str) -> dict[int, dict[str, Any]]:
    rows = read_jsonl(path)
    return {int(row[key]): row for row in rows if row.get(key) is not None}


def sender_to_dict(sender: Any) -> dict[str, Any] | None:
    if sender is None:
        return None
    first_name = getattr(sender, "first_name", None)
    last_name = getattr(sender, "last_name", None)
    full_name = " ".join(part for part in [first_name, last_name] if part).strip() or None
    return {
        "id": getattr(sender, "id", None),
        "is_bot": getattr(sender, "bot", None) if isinstance(sender, User) else None,
        "username": getattr(sender, "username", None),
        "first_name": first_name,
        "last_name": last_name,
        "full_name": full_name,
        "title": getattr(sender, "title", None),
    }


def action_to_dict(action: Any) -> dict[str, Any] | None:
    if action is None:
        return None
    payload: dict[str, Any] = {"type": type(action).__name__}
    for attr in [
        "title",
        "icon_color",
        "closed",
        "hidden",
        "users",
        "user_id",
        "channel_id",
        "chat_id",
    ]:
        if hasattr(action, attr):
            payload[attr] = getattr(action, attr)
    return payload


def safe_filename(value: str) -> str:
    value = re.sub(r"[/\\:\0]", "_", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value[:180] or "attachment"


def media_meta(message: Any) -> dict[str, Any] | None:
    if not message.media:
        return None
    media_type = type(message.media).__name__
    file_obj = getattr(message, "file", None)
    return {
        "type": media_type,
        "name": getattr(file_obj, "name", None) if file_obj else None,
        "ext": getattr(file_obj, "ext", None) if file_obj else None,
        "mime_type": getattr(file_obj, "mime_type", None) if file_obj else None,
        "size": getattr(file_obj, "size", None) if file_obj else None,
        "downloadable": media_type in {"MessageMediaPhoto", "MessageMediaDocument"},
        "local_path": None,
        "download_error": None,
    }


async def download_media(message: Any, out_dir: Path, topic_id: str, timeout: int) -> str | None:
    if not message.media:
        return None
    media_type = type(message.media).__name__
    if media_type not in {"MessageMediaPhoto", "MessageMediaDocument"}:
        return None

    file_obj = getattr(message, "file", None)
    original_name = getattr(file_obj, "name", None) if file_obj else None
    ext = getattr(file_obj, "ext", None) if file_obj else None
    media_type = type(message.media).__name__

    if original_name:
        filename = f"{message.id}_{safe_filename(original_name)}"
    else:
        filename = f"{message.id}_{safe_filename(media_type)}{ext or ''}"

    media_dir = out_dir / "media" / safe_filename(str(topic_id))
    media_dir.mkdir(parents=True, exist_ok=True)
    target = media_dir / filename

    if target.exists() and target.stat().st_size > 0:
        return str(target)

    try:
        downloaded = await asyncio.wait_for(message.download_media(file=str(target)), timeout=timeout)
    except Exception:
        if target.exists():
            target.unlink()
        raise
    return downloaded


def message_topic_id(message: Any) -> str:
    if message.reply_to:
        topic_id = message.reply_to.reply_to_top_id or message.reply_to.reply_to_msg_id
        if topic_id:
            return str(topic_id)
    if message.action and type(message.action).__name__ == "MessageActionTopicCreate":
        return str(message.id)
    return "general"


async def message_to_row(
    message: Any,
    out_dir: Path,
) -> dict[str, Any]:
    sender = await message.get_sender() if message.sender_id else None
    reply_to = message.reply_to
    topic_id = message_topic_id(message)
    media = media_meta(message)
    return {
        "message_id": message.id,
        "date": message.date.isoformat() if message.date else None,
        "edit_date": message.edit_date.isoformat() if message.edit_date else None,
        "sender_id": message.sender_id,
        "sender": sender_to_dict(sender),
        "topic_id": topic_id,
        "reply_to_msg_id": reply_to.reply_to_msg_id if reply_to else None,
        "reply_to_top_id": reply_to.reply_to_top_id if reply_to else None,
        "text": message.message,
        "has_media": bool(message.media),
        "media_type": media["type"] if media else None,
        "media": media,
        "action": action_to_dict(message.action),
    }


def media_manifest_row(row: dict[str, Any], local_path: str | None, error: str | None) -> dict[str, Any]:
    media = row.get("media") or {}
    return {
        "message_id": row["message_id"],
        "topic_id": row.get("topic_id"),
        "date": row.get("date"),
        "media_type": media.get("type") or row.get("media_type"),
        "name": media.get("name"),
        "mime_type": media.get("mime_type"),
        "size": media.get("size"),
        "local_path": local_path,
        "error": error,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


async def download_media_manifest(
    client: TelegramClient,
    chat_id: int,
    out_dir: Path,
    messages: list[dict[str, Any]],
    manifest_path: Path,
    max_media_size: int,
    media_timeout: int,
) -> dict[str, Any]:
    manifest_by_id = jsonl_by_id(manifest_path, "message_id")
    candidates = [
        row
        for row in messages
        if row.get("has_media")
        and (row.get("media") or {}).get("downloadable", row.get("media_type") in {"MessageMediaPhoto", "MessageMediaDocument"})
    ]
    pending = [
        row
        for row in candidates
        if not manifest_by_id.get(row["message_id"], {}).get("local_path")
    ]

    stats = {
        "media_candidates": len(candidates),
        "media_pending_before_run": len(pending),
        "media_downloaded_this_run": 0,
        "media_errors_this_run": 0,
        "media_skipped_this_run": 0,
    }
    if not pending:
        return stats

    with manifest_path.open("a", encoding="utf-8") as manifest:
        for index, row in enumerate(pending, start=1):
            media = row.get("media") or {}
            size = media.get("size")
            local_path = None
            error = None

            if size and size > max_media_size:
                error = f"Skipped: size {size} > max {max_media_size}"
                stats["media_skipped_this_run"] += 1
            else:
                try:
                    message = await client.get_messages(chat_id, ids=row["message_id"])
                    if not message or not message.media:
                        error = "Missing media from Telegram"
                    else:
                        local_path = await download_media(
                            message,
                            out_dir,
                            str(row.get("topic_id") or "general"),
                            media_timeout,
                        )
                        if local_path:
                            stats["media_downloaded_this_run"] += 1
                        else:
                            error = "Media type not downloadable"
                except asyncio.TimeoutError:
                    error = f"Timed out after {media_timeout}s"
                except Exception as exc:
                    error = f"{type(exc).__name__}: {exc}"

            if error:
                stats["media_errors_this_run"] += 1

            manifest.write(
                json.dumps(media_manifest_row(row, local_path, error), ensure_ascii=False, default=json_default) + "\n"
            )
            manifest.flush()

            if index % 25 == 0 or index == len(pending):
                print(f"media {index}/{len(pending)} done")

    return stats


def build_indexes(messages: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    topics: dict[str, dict[str, Any]] = {
        "general": {
            "topic_id": "general",
            "name": "General",
            "message_count": 0,
            "first_message_id": None,
            "last_message_id": None,
            "first_date": None,
            "last_date": None,
        }
    }
    senders: dict[str, dict[str, Any]] = {}

    for row in sorted(messages, key=lambda item: item["message_id"]):
        topic_id = str(row.get("topic_id") or "general")
        topic = topics.setdefault(
            topic_id,
            {
                "topic_id": topic_id,
                "name": None,
                "message_count": 0,
                "first_message_id": None,
                "last_message_id": None,
                "first_date": None,
                "last_date": None,
            },
        )

        action = row.get("action") or {}
        action_type = action.get("type")
        if action_type == "MessageActionTopicCreate":
            topic["name"] = action.get("title") or topic["name"] or f"Topic {topic_id}"
            topic["created_message_id"] = row["message_id"]
            topic["created_date"] = row.get("date")
        elif action_type == "MessageActionTopicEdit":
            topic["name"] = action.get("title") or topic["name"] or f"Topic {topic_id}"
            topic["last_edit_message_id"] = row["message_id"]
            topic["last_edit_date"] = row.get("date")

        if action_type not in {"MessageActionTopicCreate", "MessageActionTopicEdit"}:
            topic["message_count"] += 1

        if topic["first_message_id"] is None:
            topic["first_message_id"] = row["message_id"]
            topic["first_date"] = row.get("date")
        topic["last_message_id"] = row["message_id"]
        topic["last_date"] = row.get("date")

        sender = row.get("sender")
        sender_id = row.get("sender_id")
        if sender and sender_id:
            senders[str(sender_id)] = sender

    for topic_id, topic in topics.items():
        if not topic.get("name"):
            topic["name"] = f"Topic {topic_id}" if topic_id != "general" else "General"

    state = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "total_messages": len(messages),
        "max_message_id": max((row["message_id"] for row in messages), default=0),
        "topic_count": len(topics),
    }
    return topics, senders, state


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Append Telegram group history to JSONL.")
    parser.add_argument("--out-dir", default="telegram_dump", help="Output dir. Default: telegram_dump")
    parser.add_argument("--session", default="tg_hima_fetch", help="Telethon session name/path")
    parser.add_argument("--limit", type=int, default=None, help="Fetch at most N messages this run")
    parser.add_argument("--full", action="store_true", help="Scan full history and append missing rows")
    parser.add_argument("--download-media", action="store_true", help="Download photo/document attachments")
    parser.add_argument("--no-backfill-media", action="store_true", help="Skip downloading media for existing rows")
    parser.add_argument("--media-timeout", type=int, default=120, help="Seconds before one media download times out")
    parser.add_argument(
        "--max-media-size",
        type=int,
        default=25 * 1024 * 1024,
        help="Largest attachment to download in bytes. Default: 25 MiB",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    api_id = int(os.environ["TG_API_ID"])
    api_hash = os.environ["TG_API_HASH"]
    chat_id = int(os.environ["TG_CHAT_ID"])

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    messages_path = out_dir / "messages.jsonl"
    topics_path = out_dir / "topics.json"
    senders_path = out_dir / "senders.json"
    state_path = out_dir / "state.json"
    media_manifest_path = out_dir / "media_manifest.jsonl"

    existing = read_jsonl(messages_path)
    existing_by_id = {row["message_id"]: row for row in existing}
    existing_ids = set(existing_by_id)
    max_existing_id = max(existing_ids, default=0)

    client = TelegramClient(args.session, api_id, api_hash)
    await client.start(
        phone=os.environ.get("TG_PHONE"),
        code_callback=(lambda: os.environ["TG_CODE"]) if os.environ.get("TG_CODE") else None,
        password=(lambda: os.environ["TG_PASSWORD"]) if os.environ.get("TG_PASSWORD") else None,
    )

    fetch_kwargs: dict[str, Any] = {"limit": args.limit}
    if existing_ids and not args.full:
        fetch_kwargs["min_id"] = max_existing_id
    else:
        fetch_kwargs["reverse"] = True

    appended: list[dict[str, Any]] = []
    download_attachments = args.download_media
    async for message in client.iter_messages(chat_id, **fetch_kwargs):
        existing_row = existing_by_id.get(message.id)
        if existing_row:
            continue
        appended.append(await message_to_row(message, out_dir))

    appended.sort(key=lambda item: item["message_id"])

    append_jsonl(messages_path, appended)
    all_messages = sorted(existing + appended, key=lambda item: item["message_id"])
    topics, senders, state = build_indexes(all_messages)
    media_state: dict[str, Any] = {}
    if download_attachments and not args.no_backfill_media:
        media_state = await download_media_manifest(
            client,
            chat_id,
            out_dir,
            all_messages,
            media_manifest_path,
            args.max_media_size,
            args.media_timeout,
        )
    state.update(
        {
            "appended_this_run": len(appended),
            "output_dir": str(out_dir),
            "messages_file": str(messages_path),
            "media_manifest_file": str(media_manifest_path),
            "mode": "full" if args.full or not existing_ids else "incremental",
            "download_media": download_attachments,
            "rewrote_messages_file": False,
            **media_state,
        }
    )
    write_json(topics_path, dict(sorted(topics.items(), key=lambda item: (item[0] != "general", item[0]))))
    write_json(senders_path, dict(sorted(senders.items(), key=lambda item: item[0])))
    write_json(state_path, state)

    print(json.dumps(state, ensure_ascii=False, indent=2))
    print("\nTopics:")
    for topic in sorted(topics.values(), key=lambda item: (item["topic_id"] != "general", item["topic_id"])):
        print(f"- {topic['topic_id']}: {topic['name']} ({topic['message_count']} messages)")


if __name__ == "__main__":
    asyncio.run(main())
