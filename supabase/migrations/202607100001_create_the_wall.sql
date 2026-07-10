create extension if not exists pgcrypto;

create table if not exists public.the_wall_boards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.the_wall_notes (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.the_wall_boards(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  author text not null default 'Anonymous' check (char_length(author) between 1 and 50),
  color text not null default 'yellow' check (
    color in ('yellow', 'blue', 'green', 'pink', 'gold')
  ),
  x double precision not null default 0,
  y double precision not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists the_wall_boards_active_idx
  on public.the_wall_boards (is_active, created_at);

create index if not exists the_wall_notes_board_created_idx
  on public.the_wall_notes (board_id, created_at);

alter table public.the_wall_boards enable row level security;
alter table public.the_wall_notes enable row level security;

drop policy if exists "Public can read wall boards" on public.the_wall_boards;
create policy "Public can read wall boards"
  on public.the_wall_boards
  for select
  using (true);

drop policy if exists "Public can read wall notes" on public.the_wall_notes;
create policy "Public can read wall notes"
  on public.the_wall_notes
  for select
  using (true);

insert into public.the_wall_boards (slug, title, is_active)
values ('main', 'The Wall', true)
on conflict (slug) do update
set title = excluded.title,
    is_active = excluded.is_active;

alter table public.the_wall_notes replica identity full;

alter publication supabase_realtime add table public.the_wall_notes;
