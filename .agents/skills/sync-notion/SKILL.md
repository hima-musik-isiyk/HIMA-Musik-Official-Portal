---
name: sync-notion
description: Sync Notion CMS to Glossarium. Runs fetcher, reads scaffold, updates lib/glossarium constants.
---

When user ask sync Notion / update glossarium:

1. Run `pnpm fetch-notion` in terminal.
2. Wait completion. Check `scratch/notion-registry-glossary.md` + `scratch/glossarium-scaffold/`.
3. Read new schemas/properties.
4. Update `lib/glossarium/` (Layer B) w/ new hardcoded IDs/props.
5. Update React/API files (Layer C) to consume new constants.
