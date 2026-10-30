alter table public.leads add column if not exists customer_brief jsonb;
alter table public.leads add column if not exists conversation jsonb not null default '[]';
grant select(customer_brief,conversation) on public.leads to authenticated;
