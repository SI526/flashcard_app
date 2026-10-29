-- BrainHop database setup.
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Keep this file in the repo so everyone knows how the database is set up.

-- ─── Tables ─────────────────────────────────────────────────────────────

-- One row per deck. `user_id` is filled in automatically with whoever is
-- logged in (auth.uid()), so the app never has to send it.
create table if not exists public.decks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

-- One row per card. `deck_id` links it to its deck; deleting a deck deletes
-- its cards (on delete cascade). `position` keeps cards in the order they were made.
create table if not exists public.cards (
  id         uuid primary key default gen_random_uuid(),
  deck_id    uuid not null references public.decks (id) on delete cascade,
  term       text not null,
  answer     text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Access ─────────────────────────────────────────────────────────────

-- We turned off "automatically expose new tables", so logged-in users need
-- explicit permission to reach these tables at all. Logged-out visitors get none.
grant select, insert, update, delete on public.decks to authenticated;
grant select, insert, update, delete on public.cards to authenticated;

-- ─── Row level security: users only see their own data ──────────────────

alter table public.decks enable row level security;
alter table public.cards enable row level security;

-- Decks: you can only read, add, edit, or delete decks where user_id is you.
-- (drop ... if exists first, so this file can be run again safely)
drop policy if exists "Users manage their own decks" on public.decks;
create policy "Users manage their own decks"
  on public.decks
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Cards: you can only touch cards that belong to one of your decks.
drop policy if exists "Users manage cards in their own decks" on public.cards;
create policy "Users manage cards in their own decks"
  on public.cards
  for all
  to authenticated
  using (
    exists (
      select 1 from public.decks
      where decks.id = cards.deck_id
        and decks.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.decks
      where decks.id = cards.deck_id
        and decks.user_id = (select auth.uid())
    )
  );

-- Tell Supabase's API to pick up the new tables right away
-- (otherwise the app can say "Could not find the table").
notify pgrst, 'reload schema';
