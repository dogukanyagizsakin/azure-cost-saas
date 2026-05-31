-- Tenant (müşteri şirketler) tablosu
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  azure_subscription_id text,
  azure_tenant_id text,
  azure_client_id text,
  azure_client_secret text,
  is_active boolean default true,
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Kullanıcılar tablosu (IT adminler)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'admin' check (role in ('owner', 'admin', 'viewer')),
  created_at timestamptz default now()
);

-- Azure kaynakları tablosu
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  azure_resource_id text not null,
  name text not null,
  resource_type text not null,
  resource_group text not null,
  location text,
  subscription_id text,
  tags jsonb default '{}',
  is_active boolean default true,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Maliyet snapshot tablosu
create table public.cost_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  cost_usd numeric(12,4) default 0,
  currency text default 'USD',
  scanned_at timestamptz default now()
);

-- Optimizasyon önerileri tablosu
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  type text not null check (type in (
    'idle_vm', 'underused_disk', 'orphan_ip',
    'overprovisioned', 'unused_resource', 'rightsizing'
  )),
  title text not null,
  description text,
  estimated_monthly_saving numeric(10,2) default 0,
  status text default 'open' check (status in ('open', 'applied', 'dismissed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tarama logları tablosu
create table public.scan_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  status text default 'running' check (status in ('running', 'success', 'failed')),
  resources_scanned integer default 0,
  recommendations_found integer default 0,
  total_cost_usd numeric(12,2) default 0,
  error_message text,
  started_at timestamptz default now(),
  finished_at timestamptz
);

-- Bildirim logları tablosu
create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  type text default 'scan_report',
  recipient_email text not null,
  subject text,
  status text default 'sent' check (status in ('sent', 'failed')),
  sent_at timestamptz default now()
);

-- Updated_at otomatik güncellemesi için fonksiyon
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tenants_updated_at
  before update on public.tenants
  for each row execute function update_updated_at();

create trigger recommendations_updated_at
  before update on public.recommendations
  for each row execute function update_updated_at();

-- Row Level Security aktif et
alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.resources enable row level security;
alter table public.cost_snapshots enable row level security;
alter table public.recommendations enable row level security;
alter table public.scan_logs enable row level security;
alter table public.notification_logs enable row level security;

-- RLS politikaları
create policy "tenant_isolation" on public.users
  using (tenant_id = (select tenant_id from public.users where id = auth.uid()));

create policy "tenant_isolation" on public.resources
  using (tenant_id = (select tenant_id from public.users where id = auth.uid()));

create policy "tenant_isolation" on public.cost_snapshots
  using (tenant_id = (select tenant_id from public.users where id = auth.uid()));

create policy "tenant_isolation" on public.recommendations
  using (tenant_id = (select tenant_id from public.users where id = auth.uid()));

create policy "tenant_isolation" on public.scan_logs
  using (tenant_id = (select tenant_id from public.users where id = auth.uid()));

create policy "tenant_isolation" on public.notification_logs
  using (tenant_id = (select tenant_id from public.users where id = auth.uid()));

-- İndeksler
create index idx_resources_tenant on public.resources(tenant_id);
create index idx_cost_snapshots_tenant on public.cost_snapshots(tenant_id);
create index idx_cost_snapshots_period on public.cost_snapshots(period_start, period_end);
create index idx_recommendations_tenant on public.recommendations(tenant_id);
create index idx_recommendations_status on public.recommendations(status);
create index idx_scan_logs_tenant on public.scan_logs(tenant_id);