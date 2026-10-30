alter table public.leads add column if not exists company_profile jsonb;
grant select(company_profile) on public.leads to authenticated;
alter table public.leads add column if not exists additional_note text not null default '';
grant select(additional_note) on public.leads to authenticated;
