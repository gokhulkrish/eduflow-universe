-- Seed a neutral fee category so fee structures can reuse an existing category
-- without requiring a privileged client-side insert.

insert into public.fee_categories (institution_id, name, description, status)
select i.id, 'General Fees', 'Default fee category used by the fee structure editor', 'active'
from public.institutions i
on conflict (institution_id, name) do nothing;
