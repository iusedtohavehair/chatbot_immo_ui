-- Sécurité : seuls les admins (table public.users, role = 'admin') ont accès aux données.
-- Sans connexion, la clé publishable ne donne accès à rien.
-- Nécessite users.sql (fonction public.is_admin). Peut être ré-exécuté sans risque.

alter table public.landlord  enable row level security;
alter table public.buildings enable row level security;
alter table public.doors     enable row level security;
alter table public.tenants   enable row level security;
alter table public.tickets   enable row level security;

drop policy if exists "authenticated full access" on public.landlord;
drop policy if exists "authenticated full access" on public.buildings;
drop policy if exists "authenticated full access" on public.doors;
drop policy if exists "authenticated full access" on public.tenants;
drop policy if exists "authenticated full access" on public.tickets;

drop policy if exists "admin full access" on public.landlord;
drop policy if exists "admin full access" on public.buildings;
drop policy if exists "admin full access" on public.doors;
drop policy if exists "admin full access" on public.tenants;
drop policy if exists "admin full access" on public.tickets;

create policy "admin full access" on public.landlord
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin full access" on public.buildings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin full access" on public.doors
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin full access" on public.tenants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin full access" on public.tickets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
