-- Phase 1: companies, users, roles and per-company security.
-- Every business record belongs to a company. Row level security makes sure
-- a user only ever sees companies they are a member of.

create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'office', 'sales', 'engineer', 'accountant');

-- One row per login, mirrors auth.users
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

-- Buildster staff who can see and manage every company
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trading_name text,
  company_number text,
  vat_number text,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  town text,
  postcode text,
  brand_color text not null default '#f97316',
  logo_url text,
  default_vat_rate numeric(5,2) not null default 20.00,
  created_at timestamptz not null default now()
);

create table public.memberships (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'office',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);
create index on public.memberships (user_id);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  email text not null,
  role public.member_role not null default 'office',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references auth.users (id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Per-company lists used by deals and jobs (filled with trade defaults)
create table public.deal_stages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  stage_group text not null check (stage_group in ('lead', 'survey', 'order')),
  position int not null,
  is_won boolean not null default false,
  is_lost boolean not null default false
);

create table public.job_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  position int not null default 0
);

create table public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  position int not null default 0
);

-- Helper checks used by every policy -----------------------------------------

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

create or replace function public.is_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
      or exists (select 1 from memberships where company_id = cid and user_id = auth.uid());
$$;

create or replace function public.has_role(cid uuid, roles public.member_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
      or exists (select 1 from memberships where company_id = cid and user_id = auth.uid() and role = any(roles));
$$;

-- Row level security ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.companies enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;
alter table public.deal_stages enable row level security;
alter table public.job_types enable row level security;
alter table public.lead_sources enable row level security;

-- Profiles: yourself, plus people who share a company with you
create policy profiles_select on public.profiles for select using (
  id = auth.uid() or public.is_platform_admin() or exists (
    select 1 from memberships a join memberships b on a.company_id = b.company_id
    where a.user_id = auth.uid() and b.user_id = profiles.id)
);
create policy profiles_update on public.profiles for update using (id = auth.uid());

create policy platform_admins_select on public.platform_admins for select using (user_id = auth.uid());

create policy companies_select on public.companies for select using (public.is_member(id));
create policy companies_update on public.companies for update using (public.has_role(id, '{owner,admin}'));

create policy memberships_select on public.memberships for select using (public.is_member(company_id));
create policy memberships_update on public.memberships for update using (public.has_role(company_id, '{owner,admin}'));
create policy memberships_delete on public.memberships for delete using (
  public.has_role(company_id, '{owner,admin}') and user_id <> auth.uid()
);

create policy invites_select on public.invites for select using (public.has_role(company_id, '{owner,admin}'));
create policy invites_insert on public.invites for insert with check (public.has_role(company_id, '{owner,admin}'));
create policy invites_delete on public.invites for delete using (public.has_role(company_id, '{owner,admin}'));

create policy deal_stages_select on public.deal_stages for select using (public.is_member(company_id));
create policy deal_stages_write on public.deal_stages for all using (public.has_role(company_id, '{owner,admin}'))
  with check (public.has_role(company_id, '{owner,admin}'));
create policy job_types_select on public.job_types for select using (public.is_member(company_id));
create policy job_types_write on public.job_types for all using (public.has_role(company_id, '{owner,admin}'))
  with check (public.has_role(company_id, '{owner,admin}'));
create policy lead_sources_select on public.lead_sources for select using (public.is_member(company_id));
create policy lead_sources_write on public.lead_sources for all using (public.has_role(company_id, '{owner,admin}'))
  with check (public.has_role(company_id, '{owner,admin}'));

-- New login -> profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create a company, make the caller its owner, and add trade defaults
create or replace function public.create_company(company_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  insert into companies (name) values (company_name) returning id into cid;
  insert into memberships (company_id, user_id, role) values (cid, auth.uid(), 'owner');

  insert into deal_stages (company_id, name, stage_group, position, is_won, is_lost) values
    (cid, 'Lead (new)', 'lead', 1, false, false),
    (cid, 'Lead (contacted)', 'lead', 2, false, false),
    (cid, 'Lead (unsuccessful)', 'lead', 3, false, true),
    (cid, 'Survey (booked)', 'survey', 4, false, false),
    (cid, 'Survey (follow-up)', 'survey', 5, false, false),
    (cid, 'Survey (unsuccessful)', 'survey', 6, false, true),
    (cid, 'Order (placed)', 'order', 7, false, false),
    (cid, 'Order (unpaid)', 'order', 8, false, false),
    (cid, 'Order (completed)', 'order', 9, true, false);

  insert into job_types (company_id, name, position)
  select cid, n, ord from unnest(array[
    'Boiler install', 'Boiler service', 'Boiler repair', 'Hot water cylinder',
    'Heat pump', 'Plumbing', 'Bathroom', 'Roofing', 'Building work'
  ]) with ordinality as t(n, ord);

  insert into lead_sources (company_id, name, position)
  select cid, n, ord from unnest(array[
    'Website', 'Phone', 'Referral', 'Google', 'Facebook', 'Bark', 'Checkatrade', 'Repeat customer'
  ]) with ordinality as t(n, ord);

  return cid;
end;
$$;

-- Accept an invite with its token: joins the company with the invited role
create or replace function public.accept_invite(invite_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv invites%rowtype; user_email text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into inv from invites where token = invite_token and accepted_at is null;
  if not found then raise exception 'Invite not found or already used'; end if;
  select email into user_email from auth.users where id = auth.uid();
  if lower(user_email) <> lower(inv.email) then
    raise exception 'This invite was sent to a different email address';
  end if;
  insert into memberships (company_id, user_id, role) values (inv.company_id, auth.uid(), inv.role)
    on conflict (company_id, user_id) do update set role = excluded.role;
  update invites set accepted_at = now() where id = inv.id;
  return inv.company_id;
end;
$$;

-- Public lookup used by the invite page before sign-in (company name only)
create or replace function public.invite_details(invite_token text)
returns table (company_name text, email text, role public.member_role)
language sql stable security definer set search_path = public as $$
  select c.name, i.email, i.role from invites i join companies c on c.id = i.company_id
  where i.token = invite_token and i.accepted_at is null;
$$;

grant execute on function public.invite_details(text) to anon, authenticated;
