-- Le locataire d'un ticket est toujours celui du logement (doors.tenants), peu importe ce qui est envoyé.
-- Calculé à la création et quand le logement change ; ensuite il reste figé (historique si le locataire déménage).
-- À exécuter APRÈS concierge.sql. Peut être ré-exécuté sans risque.

alter table public.tickets add column if not exists title text null;

create or replace function public.tickets_set_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.door is not distinct from old.door then
    new.tenant := old.tenant;
  else
    select nullif(d.tenants::text, '')::bigint into new.tenant
    from public.doors d
    where d.id = nullif(new.door::text, '')::bigint;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_set_tenant on public.tickets;
create trigger tickets_set_tenant
  before insert or update on public.tickets
  for each row execute function public.tickets_set_tenant();
