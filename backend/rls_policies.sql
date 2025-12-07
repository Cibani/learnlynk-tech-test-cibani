-- LearnLynk Tech Test - Task 2: RLS Policies on leads

alter table public.leads enable row level security;

-- Example helper: assume JWT has tenant_id, user_id, role.
-- You can use: current_setting('request.jwt.claims', true)::jsonb

-- TODO: write a policy so:
-- - counselors see leads where they are owner_id OR in one of their teams
-- - admins can see all leads of their tenant


-- Example skeleton for SELECT (replace with your own logic):

create policy "leads_select_policy"
on public.leads
for select
using (
  (
  -- Admins: can see all the  leads in their tenant, so have entire access
  (current_setting('request.jwt.claims', true)::jsonb ->> 'role')= 'admin'
  and tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid
  )
  or (
    -- Counselors: can see leads they own or leads in their teams
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'counselor'
    and tenant_id=(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid
    and (
      owner_id=(current_setting('request.jwt.claims', true)::jsonb ->> 'user_id')::uuid
      or team_id in (
        select team_id from public.user_teams
        where user_id=(current_setting('request.jwt.claims', true)::jsonb ->> 'user_id')::uuid
      )
    )
  )
  -- TODO: added real RLS logic here, refer to README instructions
);

-- TODO: add INSERT policy that:
-- - allows counselors/admins to insert leads for their tenant
-- - ensures tenant_id is correctly set/validated

create policy "leads_insert_policy"
on public.leads 
for insert with check (
  -- Only the admins or the counselor can perform insert operation
  (current_setting('request.jwt.claims', true)::jsonb ->> 'role') in ('admin', 'counselor')
  and tenant_id=(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid
);
