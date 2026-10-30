-- Existing hackathon database, no automatic email is enabled.
alter table public.leads add column if not exists contact_outcome text not null default '검토 중';
alter table public.leads add column if not exists nurture_consent_at timestamptz;
alter table public.leads add column if not exists nurture_due_at timestamptz;
alter table public.leads add column if not exists nurture_status text not null default '동의 없음';
grant select(contact_outcome,nurture_consent_at,nurture_due_at,nurture_status) on public.leads to authenticated;
alter table public.leads add column if not exists hold_reason text not null default '';
alter table public.leads add column if not exists hold_evidence text not null default '';
alter table public.leads add column if not exists nurture_withdrawn_at timestamptz;
grant select(hold_reason,hold_evidence,nurture_withdrawn_at) on public.leads to authenticated;
create table if not exists public.nurture_reviews(
 id uuid primary key default gen_random_uuid(),lead_id uuid not null references public.leads(id) on delete cascade,
 cycle_at timestamptz not null,created_at timestamptz not null default now(),
 status text not null default '확인 중',comparison jsonb not null default '{}',draft text not null default '',
 resume_hash text unique,provider_id text,approved_by uuid references auth.users(id),unique(lead_id,cycle_at)
);
alter table public.nurture_reviews enable row level security;
revoke all on public.nurture_reviews from anon,authenticated;
create policy staff_nurture_read on public.nurture_reviews for select to authenticated using(exists(select 1 from public.team_members where user_id=auth.uid()));
grant select(id,lead_id,cycle_at,created_at,status,comparison,draft,provider_id,approved_by) on public.nurture_reviews to authenticated;
grant all on public.nurture_reviews to service_role;
alter publication supabase_realtime add table public.nurture_reviews;
