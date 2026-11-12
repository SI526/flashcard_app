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

-- "Star key terms": the user marked this card as important. Stars belong to the
-- card, so they show the same on the deck page and while studying.
-- (A separate statement so databases made before this column existed get it too.)
alter table public.cards add column if not exists starred boolean not null default false;

-- How far the user got studying each deck, shown as a badge in the library.
-- (alter table, so databases made before this column existed get it too)
alter table public.decks
  add column if not exists status text not null default 'not_started'
  check (status in ('not_started', 'in_progress', 'reviewed'));

-- One row per day a user studied (flipped at least one card), for the study streak.
-- `day` is the calendar date in the account's saved time zone. The primary key
-- (user_id, day) means a day can only be saved once, however much they study.
create table if not exists public.study_days (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- A study session saved partway through, so "Start studying" can resume it.
-- One row per user per deck. `remaining` is the card ids still to study, in order
-- (so a shuffled order is kept); the first one is the card they were on.
-- `card_ids` is every card in the deck when it was saved, so cards added later
-- can be told apart from cards already studied. Deleting the deck deletes this too.
create table if not exists public.study_sessions (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  deck_id    uuid not null references public.decks (id) on delete cascade,
  remaining  jsonb not null,
  card_ids   jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);

-- ─── Access ─────────────────────────────────────────────────────────────

-- We turned off "automatically expose new tables", so logged-in users need
-- explicit permission to reach these tables at all. Logged-out visitors get none.
grant select, insert, update, delete on public.decks to authenticated;
grant select, insert, update, delete on public.cards to authenticated;
-- Study days are only ever added and read, never changed or deleted by the app.
grant select, insert on public.study_days to authenticated;
-- Saved sessions are added, updated as they study, and deleted when finished.
grant select, insert, update, delete on public.study_sessions to authenticated;

-- ─── Row level security: users only see their own data ──────────────────

alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.study_days enable row level security;
alter table public.study_sessions enable row level security;

-- Saved sessions: you can only touch your own.
drop policy if exists "Users manage their own study sessions" on public.study_sessions;
create policy "Users manage their own study sessions"
  on public.study_sessions
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Study days: you can only read or add days where user_id is you.
drop policy if exists "Users manage their own study days" on public.study_days;
create policy "Users manage their own study days"
  on public.study_days
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

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
