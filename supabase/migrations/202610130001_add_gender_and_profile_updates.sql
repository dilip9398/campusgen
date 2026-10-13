-- Add gender and interested_in columns to public.profiles
alter table public.profiles
  add column if not exists gender text not null default 'female' check (gender in ('male', 'female', 'other')),
  add column if not exists interested_in text not null default 'opposite' check (interested_in in ('opposite', 'male', 'female', 'all'));

-- Update avatar_url check constraint to allow local device uploads and data URLs
alter table public.profiles drop constraint if exists profiles_avatar_url_check;
alter table public.profiles add constraint profiles_avatar_url_check check (avatar_url ~ '^https?://|^\/uploads\/|^data:image\/');

-- Grant select on the new columns to authenticated users
grant select (gender, interested_in) on public.profiles to authenticated;

-- Update save_my_profile function to store gender and interested_in
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
    id, email, full_name, major, grad_year, avatar_url, bio, gender, interested_in, status,
    hobbies, relationship_vibes, contact_type, contact_handle, birth_date
  ) values (
    current_id,
    verified_email,
    btrim(payload->>'full_name'),
    payload->>'major',
    (payload->>'grad_year')::integer,
    payload->>'avatar_url',
    coalesce(payload->>'bio', ''),
    coalesce(payload->>'gender', 'female'),
    coalesce(payload->>'interested_in', 'opposite'),
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
    gender = excluded.gender,
    interested_in = excluded.interested_in,
    status = excluded.status,
    hobbies = excluded.hobbies,
    relationship_vibes = excluded.relationship_vibes,
    contact_type = excluded.contact_type,
    contact_handle = excluded.contact_handle,
    birth_date = excluded.birth_date;
end;
$$;

-- Update get_feed_profiles function to support gender filtering (e.g. opposite gender)
create or replace function public.get_feed_profiles(
  p_department text default null,
  p_vibe text default null,
  p_gender text default null
)
returns table (
  id uuid,
  full_name text,
  major text,
  grad_year integer,
  avatar_url text,
  bio text,
  gender text,
  status text,
  hobbies text[],
  relationship_vibes text[]
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_gender text;
  target_gender text;
begin
  -- Look up caller profile gender
  select p.gender into current_user_gender from public.profiles p where p.id = auth.uid();

  if p_gender = 'opposite' then
    if current_user_gender = 'male' then
      target_gender := 'female';
    elsif current_user_gender = 'female' then
      target_gender := 'male';
    else
      target_gender := null;
    end if;
  elsif p_gender is not null and p_gender in ('male', 'female', 'other') then
    target_gender := p_gender;
  else
    target_gender := null;
  end if;

  return query
  select profile.id, profile.full_name, profile.major, profile.grad_year,
         profile.avatar_url, profile.bio, profile.gender, profile.status, profile.hobbies,
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
    and (target_gender is null or profile.gender = target_gender)
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
end;
$$;

revoke all on function public.get_feed_profiles(text, text, text) from public, anon;
grant execute on function public.get_feed_profiles(text, text, text) to authenticated;
