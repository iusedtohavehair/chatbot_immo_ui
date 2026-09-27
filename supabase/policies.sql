-- Sécurité : seuls les utilisateurs connectés (Supabase Auth) peuvent lire/écrire.
-- Sans connexion, la clé anon ne donne accès à rien.

alter table public.landlord  enable row level security;
alter table public.buildings enable row level security;
alter table public.doors     enable row level security;
alter table public.tenants   enable row level security;
alter table public.tickets   enable row level security;

create policy "authenticated full access" on public.landlord
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.buildings
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.doors
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.tenants
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.tickets
  for all to authenticated using (true) with check (true);
