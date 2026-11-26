create table public.gapy_catalog_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.gapy_catalog_admins enable row level security;
revoke all on public.gapy_catalog_admins from public, anon, authenticated;
grant select on public.gapy_catalog_admins to authenticated;

create policy "Read own catalog membership"
on public.gapy_catalog_admins
for select to authenticated
using (user_id = (select auth.uid()));

create table public.gapy_catalog_changes (
  id text primary key
    check (id ~ '^(p[1-9][0-9]*|excel-[1-9][0-9]*|item-[a-f0-9-]{36})$'),
  hidden boolean not null default false,
  patch jsonb not null default '{}'::jsonb
    check (jsonb_typeof(patch) = 'object' and octet_length(patch::text) <= 8192)
);

alter table public.gapy_catalog_changes enable row level security;
revoke all on public.gapy_catalog_changes from public, anon, authenticated;
grant select on public.gapy_catalog_changes to anon, authenticated;
grant insert, update, delete on public.gapy_catalog_changes to authenticated;

-- Seed records use tombstones to keep them hidden across deployments.
create policy "Read catalog changes"
on public.gapy_catalog_changes
for select to anon, authenticated
using (not hidden or id !~ '^item-');

create policy "Manage catalog changes"
on public.gapy_catalog_changes
for all to authenticated
using ((select exists (
  select 1 from public.gapy_catalog_admins where user_id = (select auth.uid())
)))
with check ((select exists (
  select 1 from public.gapy_catalog_admins where user_id = (select auth.uid())
)));
