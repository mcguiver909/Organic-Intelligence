-- Existing hackathon database only; new projects use schema.sql instead.
alter table public.leads add column if not exists company_analysis jsonb;
grant select(company_analysis) on public.leads to authenticated;
