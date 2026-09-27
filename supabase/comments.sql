-- Commentaires des tickets. À exécuter APRÈS concierge.sql. Peut être ré-exécuté sans risque.
-- "by" est entre guillemets car BY est un mot-clé SQL.

alter table public.comments alter column "by" set default auth.uid()::text;

create or replace function public.my_ticket_ids()
returns setof bigint
language sql
stable
security definer
set search_path = ''
as $$
  select t.id from public.tickets t
  where nullif(t.door::text, '')::bigint in (select public.my_door_ids());
$$;

-- Utilisateurs qui partagent au moins un immeuble avec moi (pour afficher le nom des auteurs).
create or replace function public.my_colleague_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct ub.user_id from public.user_buildings ub
  where ub.building in (select public.my_building_ids());
$$;

alter table public.comments enable row level security;

drop policy if exists "admin full access" on public.comments;
create policy "admin full access" on public.comments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read my comments" on public.comments;
create policy "read my comments" on public.comments
  for select to authenticated
  using (nullif(ticket::text, '')::bigint in (select public.my_ticket_ids()));

drop policy if exists "create my comments" on public.comments;
create policy "create my comments" on public.comments
  for insert to authenticated
  with check (
    "by" = auth.uid()::text
    and nullif(ticket::text, '')::bigint in (select public.my_ticket_ids())
  );

-- Chacun peut modifier (ex. supprimer via is_deleted) seulement ses propres commentaires.
drop policy if exists "update own comments" on public.comments;
create policy "update own comments" on public.comments
  for update to authenticated
  using ("by" = auth.uid()::text)
  with check ("by" = auth.uid()::text);

drop policy if exists "read colleagues" on public.users;
create policy "read colleagues" on public.users
  for select to authenticated using (id in (select public.my_colleague_ids()));
