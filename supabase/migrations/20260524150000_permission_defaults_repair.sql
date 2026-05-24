-- Repair and harden the default RBAC matrix so every permission row gets a
-- full role backfill, and privileged roles always retain global manage access.

create or replace function public.backfill_role_permissions_for_permission()
returns trigger
language plpgsql
as $$
begin
  insert into public.role_permissions (role, permission_id, level)
  select
    r.app_role,
    new.id,
    public.default_role_permission_level(r.app_role, new.module_key)
  from unnest(enum_range(null::public.app_role)) as r(app_role)
  on conflict (role, permission_id) do nothing;

  return new;
end;
$$;

drop trigger if exists permissions_backfill_role_permissions on public.permissions;

create trigger permissions_backfill_role_permissions
after insert on public.permissions
for each row
execute function public.backfill_role_permissions_for_permission();

insert into public.role_permissions (role, permission_id, level)
select
  r.app_role,
  p.id,
  public.default_role_permission_level(r.app_role, p.module_key)
from public.permissions p
cross join unnest(enum_range(null::public.app_role)) as r(app_role)
on conflict (role, permission_id) do nothing;

update public.role_permissions rp
set level = 'manage'
from public.permissions p
where rp.permission_id = p.id
  and rp.role in ('super_admin', 'admin', 'principal')
  and rp.level <> 'manage';
