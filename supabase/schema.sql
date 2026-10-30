-- Run once in a NEW hackathon Supabase project. No corporate data is imported.
create extension if not exists pgcrypto;
create table public.team_members(user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.team_members enable row level security;
create policy self_membership on public.team_members for select to authenticated using(user_id=auth.uid());
revoke all on public.team_members from anon,authenticated;
grant select on public.team_members to authenticated;

create table public.leads(
 id uuid primary key, owner_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 name text not null,company text not null,email text not null,
 contact_outcome text not null default '검토 중',nurture_consent_at timestamptz,nurture_due_at timestamptz,nurture_status text not null default '동의 없음',company_analysis jsonb,slots jsonb not null,summary text not null,crm jsonb not null,
 meeting boolean not null default false,preferred_times jsonb not null default '[]',email_consent boolean not null default false,
 consent_at timestamptz not null,consent_version text not null,
 receipt_hash text not null,utm jsonb not null default '{}',
 status text not null default '검토 대기' check(status in ('검토 대기','연락 예정','미팅 예정','보류')),
 assignee text not null default '',team_note text not null default ''
);
alter table public.leads enable row level security;
create policy staff_read on public.leads for select to authenticated using(exists(select 1 from public.team_members where user_id=auth.uid()));
create policy staff_update on public.leads for update to authenticated using(exists(select 1 from public.team_members where user_id=auth.uid())) with check(exists(select 1 from public.team_members where user_id=auth.uid()));
revoke all on public.leads from anon,authenticated;
-- Receipt hashes and owner identifiers are never exposed to browser clients.
grant select(id,created_at,name,company,email,contact_outcome,nurture_consent_at,nurture_due_at,nurture_status,company_analysis,slots,summary,crm,meeting,preferred_times,email_consent,consent_at,consent_version,utm,status,assignee,team_note) on public.leads to authenticated;
grant update(status,assignee,team_note) on public.leads to authenticated;
create index leads_created_at_idx on public.leads(created_at desc);

create table public.email_jobs(id uuid primary key default gen_random_uuid(),lead_id uuid not null unique references public.leads(id) on delete cascade,status text not null check(status in ('sending','accepted','needs_review')),provider_id text,requested_by uuid references auth.users(id),created_at timestamptz not null default now());
alter table public.email_jobs enable row level security;
create policy staff_email_read on public.email_jobs for select to authenticated using(exists(select 1 from public.team_members where user_id=auth.uid()));
revoke all on public.email_jobs from anon,authenticated;
grant select on public.email_jobs to authenticated;

create table public.request_quotas(bucket text primary key,n integer not null);
alter table public.request_quotas enable row level security;
revoke all on public.request_quotas from anon,authenticated;
create function public.consume_quota(p_user uuid,p_kind text) returns boolean language plpgsql security definer set search_path=public as $$
declare n_user int;n_global int;lim int;k text;begin
 if p_kind not in ('consult','lead','email') then return false;end if;
 lim:=case p_kind when 'consult' then 20 when 'lead' then 5 else 10 end;
 k:=to_char(now() at time zone 'UTC','YYYYMMDDHH24MI');
 insert into request_quotas values(p_kind||':'||p_user||':'||k,1) on conflict(bucket) do update set n=request_quotas.n+1 returning n into n_user;
 insert into request_quotas values(p_kind||':global:'||k,1) on conflict(bucket) do update set n=request_quotas.n+1 returning n into n_global;
 return n_user<=lim and n_global<=100;
end;$$;
revoke all on function public.consume_quota(uuid,text) from public,anon,authenticated;
grant execute on function public.consume_quota(uuid,text) to service_role;
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.email_jobs;

create table public.meeting_bookings(lead_id uuid primary key references public.leads(id) on delete cascade,team_id uuid not null references public.team_members(user_id),start_at timestamptz not null,created_at timestamptz not null default now(),unique(team_id,start_at),check(extract(minute from start_at)::int % 30=0 and extract(second from start_at)=0));
alter table public.meeting_bookings enable row level security;
create policy staff_booking_read on public.meeting_bookings for select to authenticated using(exists(select 1 from public.team_members where user_id=auth.uid()));
revoke all on public.meeting_bookings from anon,authenticated;
grant select on public.meeting_bookings to authenticated;
create function public.confirm_meeting(p_lead uuid,p_staff uuid,p_start timestamptz) returns void language plpgsql security definer set search_path=public as $$
declare l public.leads;begin
 select * into l from public.leads where id=p_lead for update;
 if not found or not l.meeting or p_start<=now() or not exists(select 1 from public.team_members where user_id=p_staff) or not exists(select 1 from jsonb_array_elements_text(l.preferred_times) t where t::timestamptz=p_start) then raise exception 'invalid meeting';end if;
 insert into meeting_bookings(lead_id,team_id,start_at) values(p_lead,p_staff,p_start);
 update leads set status='미팅 예정' where id=p_lead;
end;$$;
revoke all on function public.confirm_meeting(uuid,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.confirm_meeting(uuid,uuid,timestamptz) to service_role;
alter publication supabase_realtime add table public.meeting_bookings;
grant all on public.team_members,public.leads,public.email_jobs,public.request_quotas,public.meeting_bookings to service_role;

-- After inviting each teammate via Supabase Auth, add their real Auth user UUID:
-- insert into public.team_members(user_id) values ('<AUTH-USER-UUID>');
-- Service-role key stays in Vercel server environment only. RLS blocks all other reads.

-- Follow-up review queue
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

-- Customer-facing meeting brief, separate from internal CRM fields
alter table public.leads add column if not exists customer_brief jsonb;
alter table public.leads add column if not exists conversation jsonb not null default '[]';
grant select(customer_brief,conversation) on public.leads to authenticated;
