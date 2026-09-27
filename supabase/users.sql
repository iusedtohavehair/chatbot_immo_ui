-- Utilisateurs de la plateforme (admins et concierges).
-- Chaque ligne est liée à un compte Supabase Auth (même id).
-- À exécuter AVANT policies.sql.

create table if not exists public.users (
  id uuid not null references auth.users (id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  name text null,
  email text null,
  role text not null default 'concierge' check (role in ('admin', 'concierge')),
  active boolean not null default true,
  constraint users_pkey primary key (id)
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin' and active
  );
$$;

alter table public.users enable row level security;

drop policy if exists "admin full access" on public.users;
create policy "admin full access" on public.users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read own profile" on public.users;
create policy "read own profile" on public.users
  for select to authenticated using (id = auth.uid());

-- Les comptes Auth déjà existants (créés à la main dans le dashboard) deviennent admins.
insert into public.users (id, email, role)
select id, email, 'admin' from auth.users
on conflict (id) do nothing;
