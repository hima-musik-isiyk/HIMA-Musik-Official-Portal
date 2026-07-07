create table if not exists public.cms_snapshots (
  key text primary key,
  payload jsonb not null,
  source text not null default 'notion',
  source_updated_at timestamptz,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_snapshots_synced_at_idx
  on public.cms_snapshots (synced_at desc);

create or replace function public.set_cms_snapshots_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_cms_snapshots_updated_at
  on public.cms_snapshots;

create trigger set_cms_snapshots_updated_at
before update on public.cms_snapshots
for each row
execute function public.set_cms_snapshots_updated_at();

alter table public.cms_snapshots enable row level security;

