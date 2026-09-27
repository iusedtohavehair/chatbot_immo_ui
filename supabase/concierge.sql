-- Plateforme concierge : chaque utilisateur voit et gère uniquement ce qui touche ses immeubles.
-- À exécuter APRÈS user_buildings.sql. Peut être ré-exécuté sans risque.
-- nullif(...::text, '')::bigint fonctionne que les colonnes soient text ou bigint (migration_fk.sql).

alter table public.tickets add column if not exists tenant bigint references public.tenants (id);
alter table public.tickets alter column owner set default auth.uid()::text;
alter table public.tickets alter column priority set default 2;
alter table public.tickets alter column state set default 0;

create or replace function public.my_door_ids()
returns setof bigint
language sql
stable
security definer
set search_path = ''
as $$
  select d.id from public.doors d
  where nullif(d.building::text, '')::bigint in (select public.my_building_ids());
$$;

create or replace function public.my_tenant_ids()
returns setof bigint
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(d.tenants::text, '')::bigint from public.doors d
  where d.id in (select public.my_door_ids());
$$;

create or replace function public.my_landlord_ids()
returns setof bigint
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(b.landlord::text, '')::bigint from public.buildings b
  where b.id in (select public.my_building_ids());
$$;

-- Tickets : lecture, création et modification limitées aux logements de ses immeubles.
drop policy if exists "read my tickets" on public.tickets;
create policy "read my tickets" on public.tickets
  for select to authenticated
  using (nullif(door::text, '')::bigint in (select public.my_door_ids()));

drop policy if exists "create my tickets" on public.tickets;
create policy "create my tickets" on public.tickets
  for insert to authenticated
  with check (nullif(door::text, '')::bigint in (select public.my_door_ids()));

drop policy if exists "update my tickets" on public.tickets;
create policy "update my tickets" on public.tickets
  for update to authenticated
  using (nullif(door::text, '')::bigint in (select public.my_door_ids()))
  with check (nullif(door::text, '')::bigint in (select public.my_door_ids()));

-- Locataires et propriétaires : lecture seulement, limités à ses immeubles.
drop policy if exists "read my tenants" on public.tenants;
create policy "read my tenants" on public.tenants
  for select to authenticated using (id in (select public.my_tenant_ids()));

drop policy if exists "read my landlords" on public.landlord;
create policy "read my landlords" on public.landlord
  for select to authenticated using (id in (select public.my_landlord_ids()));
