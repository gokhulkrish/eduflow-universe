-- Patch 10: extend existing audit_log with entity-level columns + index

alter table public.audit_log
  add column if not exists institution_id uuid,
  add column if not exists actor_role text,
  add column if not exists source text not null default 'system',
  add column if not exists before_state jsonb,
  add column if not exists after_state jsonb;

create index if not exists idx_audit_log_tenant_entity
  on public.audit_log (institution_id, entity, entity_id, created_at desc);
