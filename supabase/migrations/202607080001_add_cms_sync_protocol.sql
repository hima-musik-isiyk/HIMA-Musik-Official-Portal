alter table public.cms_snapshots
  add column if not exists content_hash text,
  add column if not exists payload_bytes integer,
  add column if not exists last_sync_status text not null default 'synced',
  add column if not exists last_sync_error text;

create index if not exists cms_snapshots_content_hash_idx
  on public.cms_snapshots (content_hash);

create table if not exists public.cms_sync_events (
  event_id text primary key,
  event_type text not null,
  entity_id text,
  entity_type text,
  notion_created_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'synced', 'skipped', 'failed')),
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_sync_events_received_at_idx
  on public.cms_sync_events (received_at desc);

create index if not exists cms_sync_events_status_idx
  on public.cms_sync_events (status, received_at desc);

create or replace function public.set_cms_sync_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_cms_sync_events_updated_at
  on public.cms_sync_events;

create trigger set_cms_sync_events_updated_at
before update on public.cms_sync_events
for each row
execute function public.set_cms_sync_events_updated_at();

alter table public.cms_sync_events enable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values (
  'notion-images',
  'notion-images',
  false,
  52428800
)
on conflict (id) do nothing;
