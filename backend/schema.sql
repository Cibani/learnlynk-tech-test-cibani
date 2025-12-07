-- LearnLynk Tech Test - Task 1: Schema
-- Fill in the definitions for leads, applications, tasks as per README.

create extension if not exists "pgcrypto";

-- Leads table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  owner_id uuid not null,
  email text,
  phone text,
  full_name text,
  stage text not null default 'new',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TODO: add useful indexes for leads:
-- - by tenant_id, owner_id, stage, created_at
create index if not exists idx_leads_tenant_id on public.leads(tenant_id);
create index if not exists idx_leads_owner_id on public.leads(owner_id);
create index if not exists idx_leads_stage on public.leads(stage);
create index if not exists idx_leads_created_at on public.leads(created_at);

--Done!!

-- Applications table
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  lead_id uuid not null references public.leads(id) on delete cascade,
  program_id uuid,
  intake_id uuid,
  stage text not null default 'inquiry',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

--DONE:
-- added useful indexes for applications:
-- by tenant_id, lead_id, stage
create index if not exists idx_applications_tenant_id on public.applications(tenant_id);
create index if not exists idx_applications_lead_id on public.applications(lead_id);
create index if not exists idx_applications_stage on public.applications(stage);

-- Done!!
-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  application_id uuid not null references public.applications(id) on delete cascade,
  title text,
  type text not null,
  status text not null default 'open',
  due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- constraints
  check (type in ('call', 'email', 'review')),
  check (due_at>=created_at)
);

-- DONE:
-- - added check constraint for type in ('call','email','review')
-- - added constraint that due_at >= created_at
-- - added indexes for tasks due today by tenant_id, due_at, status
create index if not exists idx_tasks_tenant_id on public.tasks(tenant_id);
create index if not exists idx_tasks_due_at on public.tasks(due_at);
create index if not exists idx_tasks_status on public.tasks(status);