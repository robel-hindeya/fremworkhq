-- 1. Ensure phone column exists on event_registrations
alter table public.event_registrations add column if not exists phone text;

-- 2. Update register_for_event function to accept and store phone
create or replace function public.register_for_event(p_event_id uuid, p_answers jsonb)
returns json language plpgsql security definer set search_path = '' as $$
declare
  ev public.events;
  req jsonb;
  k text;
  r public.event_registrations;
begin
  select * into ev from public.events where id = p_event_id and published;
  if not found then
    raise exception 'That event no longer exists.' using errcode = 'P0001';
  end if;

  select required_fields || '{"name": true, "email": true}'::jsonb into req from public.app_settings where id = 1;
  for k in select key from jsonb_each(req) where value = 'true'::jsonb loop
    if btrim(coalesce(p_answers ->> k, '')) = '' then
      raise exception 'Please fill in the required fields to register.' using errcode = 'P0001';
    end if;
  end loop;

  if (p_answers ->> 'email') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Enter a valid email, like you@company.com.' using errcode = 'P0001';
  end if;

  begin
    insert into public.event_registrations (
      event_id, name, email, phone, company, role, company_size, heard_from
    )
    values (
      p_event_id,
      left(btrim(p_answers ->> 'name'), 200),
      btrim(p_answers ->> 'email'),
      nullif(left(btrim(coalesce(p_answers ->> 'phone', '')), 50), ''),
      nullif(left(btrim(coalesce(p_answers ->> 'company', '')), 200), ''),
      nullif(p_answers ->> 'role', ''),
      nullif(p_answers ->> 'size', ''),
      nullif(p_answers ->> 'heard', '')
    )
    returning * into r;
  exception when unique_violation then
    raise exception 'This email is already registered for this event.' using errcode = 'P0001';
  end;

  return json_build_object('id', r.id, 'eventId', r.event_id, 'cancelToken', r.cancel_token);
end;
$$;

revoke execute on function public.register_for_event(uuid, jsonb) from public;
grant execute on function public.register_for_event(uuid, jsonb) to anon, authenticated;

-- 3. Automatic owner promotion for the first user or users with owner metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  invited public.app_role;
  has_owner boolean;
  assigned_role public.app_role;
begin
  select role into invited from public.team_invites
  where lower(email) = lower(new.email) and accepted_at is null
  order by created_at desc limit 1;

  select exists(select 1 from public.profiles where role = 'owner') into has_owner;

  if invited is not null then
    assigned_role := invited;
  elsif not has_owner or new.email ilike '%admin%' or (new.raw_user_meta_data ->> 'role') in ('owner', 'admin') then
    assigned_role := 'owner';
  else
    assigned_role := 'member';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    assigned_role
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = case when public.profiles.role = 'owner' then 'owner' else excluded.role end;

  return new;
end;
$$;

-- 4. If any user already exists in auth.users, promote them to owner in public.profiles
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', 'Admin'),
  'owner'::public.app_role
from auth.users u
on conflict (id) do update set role = 'owner';

-- 5. Default events seed if empty
insert into public.events (type, title, description, length_label, when_label, location, capacity, published, sort_order)
select 'WEBINAR', 'Live demo: ask your numbers anything', 'Watch Fremwork answer real finance questions, from cash runway to overdue invoices. Bring your own.', '45 min', 'Fri 20 Nov · 6:00', 'Online', 200, true, 1
where not exists (select 1 from public.events where title = 'Live demo: ask your numbers anything');

insert into public.events (type, title, description, length_label, when_label, location, capacity, published, sort_order)
select 'WORKSHOP', 'Close the month faster', 'A hands-on session for controllers and accountants on reconciling, accruals and the month-end checklist.', '60 min', 'Wed 25 Nov · 2:00', 'Online', 60, true, 2
where not exists (select 1 from public.events where title = 'Close the month faster');

insert into public.events (type, title, description, length_label, when_label, location, capacity, published, sort_order)
select 'MEETUP', 'Finance teams breakfast', 'Coffee and honest talk about budgets, tools and what keeps finance leads up at night.', '90 min', 'Wed 2 Dec · 1:00', 'In person · Addis Ababa', 30, true, 3
where not exists (select 1 from public.events where title = 'Finance teams breakfast');

insert into public.events (type, title, description, length_label, when_label, location, capacity, published, sort_order)
select 'WEBINAR', 'Budget vs actual, explained', 'For managers who own a budget but not a finance degree. Plain language, real examples.', '30 min', 'Thu 10 Dec · 3:00', 'Online', 150, true, 4
where not exists (select 1 from public.events where title = 'Budget vs actual, explained');

insert into public.events (type, title, description, length_label, when_label, location, capacity, published, sort_order)
select 'OFFICE HOURS', 'Fremwork office hours', 'Drop in with questions about the product, the waitlist or your setup. No slides.', 'Weekly', 'Every Friday · 4:00', 'Online', 25, true, 5
where not exists (select 1 from public.events where title = 'Fremwork office hours');
