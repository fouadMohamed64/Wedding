-- ============================================================================
-- Wedding wishes — run this whole file once in:
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.wishes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null  check (char_length(btrim(name))    between 2 and 40),
  message     text not null  check (char_length(btrim(message)) between 3 and 500),
  is_hidden   boolean not null default false,   -- tick this in the dashboard to hide a message without deleting it
  created_at  timestamptz not null default now()
);

create index if not exists wishes_created_at_idx on public.wishes (created_at desc);

-- ---------- Row Level Security ----------
alter table public.wishes enable row level security;

drop policy if exists "Public can read visible wishes" on public.wishes;
create policy "Public can read visible wishes"
  on public.wishes for select
  to anon, authenticated
  using (is_hidden = false);

drop policy if exists "Public can send wishes" on public.wishes;
create policy "Public can send wishes"
  on public.wishes for insert
  to anon, authenticated
  with check (
    is_hidden = false
    and char_length(btrim(name))    between 2 and 40
    and char_length(btrim(message)) between 3 and 500
  );

-- No UPDATE / DELETE policies on purpose: visitors can never edit or remove messages.
-- You (the owner) moderate from the dashboard, which bypasses RLS.

revoke all on public.wishes from anon, authenticated;
grant select, insert on public.wishes to anon, authenticated;

-- ---------- Basic server-side anti-spam ----------
-- Rejects new wishes if 20+ arrived in the last minute (protects against floods).
create or replace function public.wishes_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.wishes where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Too many wishes, please try again shortly' using errcode = 'P0001';
  end if;
  new.name    := btrim(new.name);
  new.message := btrim(new.message);
  return new;
end;
$$;

drop trigger if exists wishes_rate_limit_trg on public.wishes;
create trigger wishes_rate_limit_trg
  before insert on public.wishes
  for each row execute function public.wishes_rate_limit();
