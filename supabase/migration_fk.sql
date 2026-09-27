-- OPTIONNEL (recommandé) : transforme les colonnes de relation text -> bigint
-- et ajoute des clés étrangères. Empêche les références invalides.
-- L'application fonctionne avec ou sans cette migration.
-- Échoue si une valeur existante n'est pas un id numérique valide : corriger les données d'abord.

alter table public.buildings
  alter column landlord type bigint using nullif(landlord, '')::bigint,
  add constraint buildings_landlord_fkey foreign key (landlord) references public.landlord (id);

alter table public.doors
  alter column building type bigint using nullif(building, '')::bigint,
  add constraint doors_building_fkey foreign key (building) references public.buildings (id);

alter table public.doors
  alter column tenants type bigint using nullif(tenants, '')::bigint,
  add constraint doors_tenants_fkey foreign key (tenants) references public.tenants (id);

alter table public.tickets
  alter column door type bigint using nullif(door, '')::bigint,
  add constraint tickets_door_fkey foreign key (door) references public.doors (id);
