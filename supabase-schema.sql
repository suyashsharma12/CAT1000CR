-- Run this entire script once in Supabase -> SQL Editor.
-- It creates a private-per-user attempt history for CR Arena.

create table if not exists public.cr_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id integer not null,
  set_name text not null,
  score integer not null,
  correct integer not null,
  wrong integer not null,
  blank integer not null,
  accuracy numeric(5,1) not null,
  time_seconds integer not null,
  completed_at timestamptz not null default now()
);

alter table public.cr_attempts enable row level security;

revoke all on table public.cr_attempts from anon;
grant select, insert, delete on table public.cr_attempts to authenticated;

drop policy if exists "Users can read their own CR attempts" on public.cr_attempts;
drop policy if exists "Users can create their own CR attempts" on public.cr_attempts;
drop policy if exists "Users can delete their own CR attempts" on public.cr_attempts;

create policy "Users can read their own CR attempts"
on public.cr_attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own CR attempts"
on public.cr_attempts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own CR attempts"
on public.cr_attempts
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists cr_attempts_user_id_idx
on public.cr_attempts(user_id);

create index if not exists cr_attempts_user_date_idx
on public.cr_attempts(user_id, completed_at desc);
