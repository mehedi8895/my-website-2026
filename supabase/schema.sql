-- =========================================================
-- GOLDEN DAWN eFC
-- Main Supabase Database Schema
-- =========================================================

create extension if not exists pgcrypto;


-- =========================================================
-- ENUMS
-- =========================================================

do $$
begin

  if not exists (
    select 1
    from pg_type
    where typname = 'member_status'
  ) then

    create type public.member_status as enum (
      'pending',
      'approved',
      'rejected'
    );

  end if;


  if not exists (
    select 1
    from pg_type
    where typname = 'member_role'
  ) then

    create type public.member_role as enum (
      'player',
      'admin',
      'owner'
    );

  end if;


  if not exists (
    select 1
    from pg_type
    where typname = 'tournament_status'
  ) then

    create type public.tournament_status as enum (
      'draft',
      'open',
      'ongoing',
      'completed',
      'cancelled'
    );

  end if;

end
$$;


-- =========================================================
-- PROFILES
-- =========================================================

create table if not exists public.profiles (

  id uuid primary key
    references auth.users(id)
    on delete cascade,

  email text not null,

  name text not null default '',

  username text not null unique,

  phone text not null default '',

  efootball_id text not null default '',

  avatar_url text,

  role public.member_role
    not null default 'player',

  status public.member_status
    not null default 'pending',

  created_at timestamptz
    not null default now()

);


-- =========================================================
-- MESSAGES
-- =========================================================

create table if not exists public.messages (

  id uuid primary key
    default gen_random_uuid(),

  sender_id uuid not null
    references public.profiles(id)
    on delete cascade,

  body text not null
    check (
      char_length(body)
      between 1 and 2000
    ),

  created_at timestamptz
    not null default now()

);


-- =========================================================
-- TOURNAMENTS
-- =========================================================

create table if not exists public.tournaments (

  id uuid primary key
    default gen_random_uuid(),

  title text not null,

  description text,

  start_at timestamptz not null,

  status public.tournament_status
    not null default 'draft',

  max_players integer
    not null default 32,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz
    not null default now(),

  constraint tournaments_max_players_check
    check (max_players > 1)

);


-- =========================================================
-- TOURNAMENT PLAYERS
-- =========================================================

create table if not exists public.tournament_players (

  tournament_id uuid not null
    references public.tournaments(id)
    on delete cascade,

  player_id uuid not null
    references public.profiles(id)
    on delete cascade,

  joined_at timestamptz
    not null default now(),

  primary key (
    tournament_id,
    player_id
  )

);


-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists profiles_status_idx
on public.profiles(status);

create index if not exists profiles_role_idx
on public.profiles(role);

create index if not exists messages_created_at_idx
on public.messages(created_at);

create index if not exists messages_sender_id_idx
on public.messages(sender_id);

create index if not exists tournaments_start_at_idx
on public.tournaments(start_at);

create index if not exists tournaments_status_idx
on public.tournaments(status);


-- =========================================================
-- NEW USER -> AUTOMATIC PROFILE
-- =========================================================

create or replace function public.handle_new_user()

returns trigger

language plpgsql

security definer

set search_path = public

as $$

declare

  base_username text;

begin

  base_username :=
    lower(
      regexp_replace(
        coalesce(
          new.raw_user_meta_data
            ->>'username',
          'player'
        ),
        '[^a-zA-Z0-9_]',
        '',
        'g'
      )
    );


  if base_username = '' then

    base_username := 'player';

  end if;


  base_username :=
    left(base_username, 24)
    || '_'
    || substr(
      replace(
        new.id::text,
        '-',
        ''
      ),
      1,
      6
    );


  insert into public.profiles (

    id,
    email,
    name,
    username,
    phone,
    efootball_id

  )

  values (

    new.id,

    new.email,

    coalesce(
      new.raw_user_meta_data
        ->>'name',
      ''
    ),

    base_username,

    coalesce(
      new.raw_user_meta_data
        ->>'phone',
      ''
    ),

    coalesce(
      new.raw_user_meta_data
        ->>'efootball_id',
      ''
    )

  );


  return new;

end;

$$;


-- =========================================================
-- AUTH TRIGGER
-- =========================================================

drop trigger if exists
on_auth_user_created
on auth.users;


create trigger
on_auth_user_created

after insert on auth.users

for each row

execute procedure
public.handle_new_user();


-- =========================================================
-- STAFF CHECK
-- =========================================================

create or replace function public.is_staff()

returns boolean

language sql

stable

security definer

set search_path = public

as $$

  select exists (

    select 1

    from public.profiles

    where id = auth.uid()

    and role in (
      'admin',
      'owner'
    )

  );

$$;


-- =========================================================
-- APPROVED MEMBER CHECK
-- =========================================================

create or replace function public.is_approved_member()

returns boolean

language sql

stable

security definer

set search_path = public

as $$

  select exists (

    select 1

    from public.profiles

    where id = auth.uid()

    and status = 'approved'

  );

$$;


-- =========================================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles
enable row level security;

alter table public.messages
enable row level security;

alter table public.tournaments
enable row level security;

alter table public.tournament_players
enable row level security;


-- =========================================================
-- PROFILES POLICIES
-- =========================================================

drop policy if exists
"profiles own read"
on public.profiles;


create policy
"profiles own read"

on public.profiles

for select

to authenticated

using (

  id = auth.uid()

  or public.is_staff()

);


drop policy if exists
"approved members can see approved profiles"
on public.profiles;


create policy
"approved members can see approved profiles"

on public.profiles

for select

to authenticated

using (

  status = 'approved'

  and public.is_approved_member()

);


-- =========================================================
-- OWN PROFILE UPDATE
-- =========================================================

drop policy if exists
"own profile update"
on public.profiles;


create policy
"own profile update"

on public.profiles

for update

to authenticated

using (
  id = auth.uid()
)

with check (
  id = auth.uid()
);


-- =========================================================
-- STAFF PROFILE UPDATE
-- =========================================================

drop policy if exists
"staff update profiles"
on public.profiles;


create policy
"staff update profiles"

on public.profiles

for update

to authenticated

using (
  public.is_staff()
)

with check (
  public.is_staff()
);


-- =========================================================
-- CHAT READ
-- =========================================================

drop policy if exists
"members read messages"
on public.messages;


create policy
"members read messages"

on public.messages

for select

to authenticated

using (
  public.is_approved_member()
);


-- =========================================================
-- CHAT SEND
-- =========================================================

drop policy if exists
"members send messages"
on public.messages;


create policy
"members send messages"

on public.messages

for insert

to authenticated

with check (

  sender_id = auth.uid()

  and public.is_approved_member()

);


-- =========================================================
-- TOURNAMENT READ
-- =========================================================

drop policy if exists
"members read tournaments"
on public.tournaments;


create policy
"members read tournaments"

on public.tournaments

for select

to authenticated

using (
  public.is_approved_member()
);


-- =========================================================
-- STAFF CREATE TOURNAMENT
-- =========================================================

drop policy if exists
"staff create tournaments"
on public.tournaments;


create policy
"staff create tournaments"

on public.tournaments

for insert

to authenticated

with check (
  public.is_staff()
);


-- =========================================================
-- STAFF UPDATE TOURNAMENT
-- =========================================================

drop policy if exists
"staff update tournaments"
on public.tournaments;


create policy
"staff update tournaments"

on public.tournaments

for update

to authenticated

using (
  public.is_staff()
)

with check (
  public.is_staff()
);


-- =========================================================
-- TOURNAMENT PLAYERS READ
-- =========================================================

drop policy if exists
"members read tournament players"
on public.tournament_players;


create policy
"members read tournament players"

on public.tournament_players

for select

to authenticated

using (
  public.is_approved_member()
);


-- =========================================================
-- JOIN TOURNAMENT
-- =========================================================

drop policy if exists
"members join tournament"
on public.tournament_players;


create policy
"members join tournament"

on public.tournament_players

for insert

to authenticated

with check (

  player_id = auth.uid()

  and public.is_approved_member()

  and exists (

    select 1

    from public.tournaments t

    where t.id =
      tournament_id

    and t.status = 'open'

  )

);


-- =========================================================
-- REALTIME CHAT
-- =========================================================

do $$

begin

  alter publication
    supabase_realtime
  add table
    public.messages;

exception
  when duplicate_object then
    null;

end

$$;


-- =========================================================
-- IMPORTANT
-- =========================================================
--
-- প্রথমে website থেকে নিজের account create করবে।
--
-- তারপর Supabase SQL Editor-এ নিচের query চালিয়ে
-- নিজেকে Owner করবে।
--
-- YOUR_EMAIL_HERE-এর জায়গায় নিজের email বসাবে।
--
-- =========================================================

-- update public.profiles
-- set
--   role = 'owner',
--   status = 'approved'
-- where email = 'YOUR_EMAIL_HERE';
