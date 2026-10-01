create extension if not exists pgcrypto;

create or replace function public.enforce_siddhartha_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is null or lower(new.email) !~ '^[^[:space:]@]+@siddhartha\.co\.in$' then
    raise exception 'Only valid @siddhartha.co.in college IDs are eligible.';
  end if;
  return new;
end;
$$;

drop trigger if exists campus_email_domain_guard on auth.users;
create trigger campus_email_domain_guard
before insert or update of email on auth.users
for each row execute function public.enforce_siddhartha_email();

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null check (lower(email) ~ '^[^[:space:]@]+@siddhartha\.co\.in$'),
  full_name text not null check (char_length(full_name) between 2 and 60),
  major text not null check (major in ('CSE', 'IT', 'ECE', 'EEE', 'Mech', 'Civil', 'Biotech', 'MBA', 'MCA')),
  grad_year integer not null check (grad_year between 2025 and 2029),
  avatar_url text not null check (avatar_url ~ '^https?://'),
  bio text not null default '' check (char_length(bio) <= 280),
  status text not null check (status in ('single', 'it_is_complicated', 'open_to_see')),
  hobbies text[] not null default '{}',
  relationship_vibes text[] not null default '{}',
  contact_type text not null check (contact_type in ('instagram', 'whatsapp')),
  contact_handle text not null,
  birth_date date not null check (birth_date <= (current_date - interval '18 years')::date),
  created_at timestamptz not null default now(),
  check (cardinality(hobbies) <= 5),
  check (hobbies <@ array['Coding', 'Gym/Fitness', 'Chai & Maggi', 'Anime', 'Photography', 'Sports', 'Hackathons', 'Gaming', 'Indie Music', 'Binge Watching']::text[]),
  check (cardinality(relationship_vibes) <= 2),
  check (relationship_vibes <@ array['Cuffing Season', 'Long Term / Serious', 'Situationship', 'Benching / Roster Dating', 'Dating & Outings', 'Study Buddy & Chill', 'Live-in / Flatmate Vibe', 'Friends First / Platonic']::text[]),
  check (
    (contact_type = 'instagram' and contact_handle ~ '^@?[A-Za-z0-9._]{1,30}$')
    or (contact_type = 'whatsapp' and contact_handle ~ '^\+[1-9][0-9]{7,14}$')
  )
);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

create table public.passes (
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

create view public.matches
with (security_invoker = true)
as
select
  least(outgoing.sender_id, outgoing.receiver_id) as profile_a,
  greatest(outgoing.sender_id, outgoing.receiver_id) as profile_b,
  greatest(outgoing.created_at, incoming.created_at) as matched_at
from public.likes as outgoing
join public.likes as incoming
  on incoming.sender_id = outgoing.receiver_id
  and incoming.receiver_id = outgoing.sender_id
where outgoing.sender_id < outgoing.receiver_id;

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.passes enable row level security;

create policy "Students can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

revoke all on public.profiles, public.likes, public.passes, public.matches from anon, authenticated;
grant select (id, full_name, major, grad_year, avatar_url, bio, status, hobbies, relationship_vibes, created_at)
on public.profiles to authenticated;

create or replace function public.save_my_profile(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_id uuid := auth.uid();
  verified_email text;
  parsed_birth_date date;
begin
  if current_id is null then
    raise exception 'Sign in to finish your profile.';
  end if;

  select email into verified_email from auth.users
  where id = current_id and email_confirmed_at is not null;

  if verified_email is null or lower(verified_email) !~ '^[^[:space:]@]+@siddhartha\.co\.in$' then
    raise exception 'Verify an eligible Siddhartha college email before continuing.';
  end if;

  parsed_birth_date := (payload->>'birth_date')::date;
  if parsed_birth_date > (current_date - interval '18 years')::date then
    raise exception 'You must be at least 18 to use Campus Kin.';
  end if;

  insert into public.profiles (
    id, email, full_name, major, grad_year, avatar_url, bio, status,
    hobbies, relationship_vibes, contact_type, contact_handle, birth_date
  ) values (
    current_id,
    verified_email,
    btrim(payload->>'full_name'),
    payload->>'major',
    (payload->>'grad_year')::integer,
    payload->>'avatar_url',
    coalesce(payload->>'bio', ''),
    payload->>'status',
    array(select jsonb_array_elements_text(coalesce(payload->'hobbies', '[]'::jsonb))),
    array(select jsonb_array_elements_text(coalesce(payload->'relationship_vibes', '[]'::jsonb))),
    payload->>'contact_type',
    btrim(payload->>'contact_handle'),
    parsed_birth_date
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    major = excluded.major,
    grad_year = excluded.grad_year,
    avatar_url = excluded.avatar_url,
    bio = excluded.bio,
    status = excluded.status,
    hobbies = excluded.hobbies,
    relationship_vibes = excluded.relationship_vibes,
    contact_type = excluded.contact_type,
    contact_handle = excluded.contact_handle,
    birth_date = excluded.birth_date;
end;
$$;

create or replace function public.get_my_profile()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select to_jsonb(profile)
  from public.profiles as profile
  where profile.id = auth.uid();
$$;

create or replace function public.get_feed_profiles(p_department text default null, p_vibe text default null)
returns table (
  id uuid,
  full_name text,
  major text,
  grad_year integer,
  avatar_url text,
  bio text,
  status text,
  hobbies text[],
  relationship_vibes text[]
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select profile.id, profile.full_name, profile.major, profile.grad_year,
         profile.avatar_url, profile.bio, profile.status, profile.hobbies,
         profile.relationship_vibes
  from public.profiles as profile
  where auth.uid() is not null
    and exists (
      select 1 from auth.users as campus_user
      where campus_user.id = auth.uid()
        and campus_user.email_confirmed_at is not null
        and lower(campus_user.email) ~ '^[^[:space:]@]+@siddhartha\.co\.in$'
    )
    and exists (select 1 from public.profiles as own_profile where own_profile.id = auth.uid())
    and profile.id <> auth.uid()
    and (p_department is null or profile.major = p_department)
    and (p_vibe is null or p_vibe = any(profile.relationship_vibes))
    and not exists (
      select 1 from public.likes as liked
      where liked.sender_id = auth.uid() and liked.receiver_id = profile.id
    )
    and not exists (
      select 1 from public.passes as passed
      where passed.sender_id = auth.uid() and passed.receiver_id = profile.id
    )
  order by profile.created_at desc
  limit 40;
$$;

create or replace function public.like_profile(p_receiver_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_id uuid := auth.uid();
begin
  if current_id is null or p_receiver_id is null or current_id = p_receiver_id then
    raise exception 'That profile cannot be liked.';
  end if;
  if not exists (
    select 1 from public.profiles as own_profile
    join auth.users as campus_user on campus_user.id = own_profile.id
    where own_profile.id = current_id and campus_user.email_confirmed_at is not null
  ) then
    raise exception 'Verify your college email and finish your profile before liking students.';
  end if;
  if not exists (select 1 from public.profiles where id = p_receiver_id) then
    raise exception 'Profile not found.';
  end if;

  delete from public.passes where sender_id = current_id and receiver_id = p_receiver_id;
  insert into public.likes (sender_id, receiver_id)
  values (current_id, p_receiver_id)
  on conflict (sender_id, receiver_id) do nothing;

  return exists (
    select 1 from public.likes
    where sender_id = p_receiver_id and receiver_id = current_id
  );
end;
$$;

create or replace function public.pass_profile(p_receiver_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or p_receiver_id is null or auth.uid() = p_receiver_id then
    raise exception 'That profile cannot be passed.';
  end if;
  if not exists (
    select 1 from public.profiles as own_profile
    join auth.users as campus_user on campus_user.id = own_profile.id
    where own_profile.id = auth.uid() and campus_user.email_confirmed_at is not null
  ) then
    raise exception 'Verify your college email and finish your profile before passing students.';
  end if;
  insert into public.passes (sender_id, receiver_id)
  values (auth.uid(), p_receiver_id)
  on conflict do nothing;
end;
$$;

create or replace function public.get_my_matches()
returns table (
  profile_id uuid,
  matched_at timestamptz,
  full_name text,
  major text,
  grad_year integer,
  avatar_url text,
  bio text,
  status text,
  hobbies text[],
  relationship_vibes text[],
  contact_type text,
  contact_handle text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select other.id, match.matched_at, other.full_name, other.major,
         other.grad_year, other.avatar_url, other.bio, other.status,
         other.hobbies, other.relationship_vibes, other.contact_type,
         other.contact_handle
  from public.matches as match
  join public.profiles as other
    on other.id = case when match.profile_a = auth.uid() then match.profile_b else match.profile_a end
  where auth.uid() in (match.profile_a, match.profile_b)
  order by match.matched_at desc;
$$;

revoke all on function public.save_my_profile(jsonb) from public, anon;
revoke all on function public.get_my_profile() from public, anon;
revoke all on function public.get_feed_profiles(text, text) from public, anon;
revoke all on function public.like_profile(uuid) from public, anon;
revoke all on function public.pass_profile(uuid) from public, anon;
revoke all on function public.get_my_matches() from public, anon;
grant execute on function public.save_my_profile(jsonb) to authenticated;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.get_feed_profiles(text, text) to authenticated;
grant execute on function public.like_profile(uuid) to authenticated;
grant execute on function public.pass_profile(uuid) to authenticated;
grant execute on function public.get_my_matches() to authenticated;
