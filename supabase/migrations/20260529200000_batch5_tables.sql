create table if not exists public.it_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default 'desktop',
  brand text default '',
  model text default '',
  serial_no text default '',
  asset_tag text default '',
  purchase_date text default '',
  warranty_months integer default 0,
  location text default '',
  status text default 'available',
  assigned_to_type text default '',
  assigned_to_name text default '',
  assigned_to_id text default '',
  assigned_at text default '',
  notes text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.it_maintenance (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null,
  date text default '',
  maint_type text default '',
  description text default '',
  cost numeric default 0,
  vendor text default '',
  next_due text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.it_labs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text default '',
  capacity integer default 0,
  systems_count integer default 0,
  incharge text default '',
  status text default 'active',
  equipment text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.it_lab_bookings (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null,
  lab_name text default '',
  date text default '',
  start_time text default '',
  end_time text default '',
  faculty_name text default '',
  faculty_id text default '',
  purpose text default '',
  batch text default '',
  status text default 'pending',
  created_at timestamptz not null default now()
);
create table if not exists public.it_network_devices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  device_type text default '',
  brand text default '',
  model text default '',
  ip_address text default '',
  mac_address text default '',
  location text default '',
  status text default 'online',
  firmware_version text default '',
  purchase_date text default '',
  uplink text default '',
  notes text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.it_ip_allocations (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  device_name text default '',
  device_type text default '',
  location text default '',
  assigned_to text default '',
  notes text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.iot_devices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  device_type text default '',
  model text default '',
  serial_no text default '',
  location text default '',
  status text default 'active',
  firmware text default '',
  last_seen text default '',
  battery_level integer default 100,
  ip_address text default '',
  notes text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.iot_readings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  metric text default '',
  value numeric default 0,
  unit text default '',
  recorded_at timestamptz not null default now()
);
create table if not exists public.iot_rfid_logs (
  id uuid primary key default gen_random_uuid(),
  reader_id uuid not null,
  reader_name text default '',
  tag_id text default '',
  student_name text default '',
  student_id text default '',
  timestamp text default '',
  direction text default 'in'
);
create table if not exists public.scholarship_schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text default '',
  amount numeric default 0,
  criteria text default ''
);
create table if not exists public.scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  student text not null,
  scheme text default '',
  amount numeric default 0,
  status text default 'pending',
  applied text default ''
);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  assignee text default '',
  priority text default 'medium',
  status text default 'pending',
  due_date text default '',
  created_at timestamptz not null default now()
);
alter publication supabase_realtime add table public.it_assets;
alter publication supabase_realtime add table public.it_maintenance;
alter publication supabase_realtime add table public.it_labs;
alter publication supabase_realtime add table public.it_lab_bookings;
alter publication supabase_realtime add table public.it_network_devices;
alter publication supabase_realtime add table public.it_ip_allocations;
alter publication supabase_realtime add table public.iot_devices;
alter publication supabase_realtime add table public.iot_readings;
alter publication supabase_realtime add table public.iot_rfid_logs;
alter publication supabase_realtime add table public.scholarship_schemes;
alter publication supabase_realtime add table public.scholarship_applications;
alter publication supabase_realtime add table public.tasks;
