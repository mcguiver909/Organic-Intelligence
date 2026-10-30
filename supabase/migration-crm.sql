-- Inbound customer DB: ACRYL CRM prospects scored by the lead model, plus the score of each new AI consultation.
-- Customer rows are loaded from a locally generated seed file (model/build_seed.mjs) that is never committed.
alter table public.leads add column if not exists lead_score jsonb;
grant select(lead_score) on public.leads to authenticated;
create table if not exists public.crm_prospects(
 customer_id text primary key,org_id text,lead_grade text,sales_stage text,segment text,org_type text,industry text,job_level text,
 interest_products text,request_type text,contact_count int not null default 0,first_event text,email_type text,onsite_request text,interest_area text,
 score int not null,score_low int not null,score_high int not null,tier text not null,rank_unknown boolean not null default false,factors jsonb not null default '[]'
);
alter table public.crm_prospects enable row level security;
drop policy if exists staff_crm_read on public.crm_prospects;
create policy staff_crm_read on public.crm_prospects for select to authenticated using(exists(select 1 from public.team_members where user_id=auth.uid()));
revoke all on public.crm_prospects from anon,authenticated;
grant select on public.crm_prospects to authenticated;
create index if not exists crm_prospects_score_idx on public.crm_prospects(score desc);
create index if not exists crm_prospects_unknown_idx on public.crm_prospects(rank_unknown,score_high desc);
