-- ============================================================
-- LOVARE DIAGNOSTIC ENGINE — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'student' check (role in ('admin', 'coach', 'student')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  assigned_coach_id uuid references public.profiles(id) on delete set null,
  target_law_school text,
  intended_focus text,
  notes text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id)
);

-- ============================================================
-- DIAGNOSTIC RUNS
-- ============================================================
create table public.diagnostic_runs (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- Logical Reasoning scores
  lr_timed_correct integer not null,
  lr_timed_total integer not null,
  lr_untimed_correct integer not null,
  lr_untimed_total integer not null,

  -- Analytical Reasoning scores
  ar_timed_correct integer not null,
  ar_timed_total integer not null,
  ar_untimed_correct integer not null,
  ar_untimed_total integer not null,

  -- Reading Comprehension scores
  rc_timed_correct integer not null,
  rc_timed_total integer not null,
  rc_untimed_correct integer not null,
  rc_untimed_total integer not null,

  -- GAD-7
  gad7_q1 integer not null check (gad7_q1 between 0 and 3),
  gad7_q2 integer not null check (gad7_q2 between 0 and 3),
  gad7_q3 integer not null check (gad7_q3 between 0 and 3),
  gad7_q4 integer not null check (gad7_q4 between 0 and 3),
  gad7_q5 integer not null check (gad7_q5 between 0 and 3),
  gad7_q6 integer not null check (gad7_q6 between 0 and 3),
  gad7_q7 integer not null check (gad7_q7 between 0 and 3),
  gad7_total integer not null,

  -- Computed results
  overall_timed_score integer not null,
  overall_untimed_score integer not null,
  overall_delta integer not null,
  anxiety_profile text not null check (anxiety_profile in ('high', 'moderate', 'low')),
  gad7_severity text not null,
  track text not null check (track in ('anxiety-primary', 'knowledge-primary', 'mixed')),
  track_rationale text not null,
  projected_improvement integer not null,

  -- JSON blobs for complex computed objects
  attributions jsonb not null default '[]',
  interventions jsonb not null default '[]',
  locker_room_protocol jsonb not null default '{}'
);

-- ============================================================
-- SESSION LOGS
-- ============================================================
create table public.session_logs (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  diagnostic_id uuid references public.diagnostic_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  date_label text not null,
  anxiety_rating integer not null check (anxiety_rating between 1 and 10),
  confidence_rating integer not null check (confidence_rating between 1 and 10),
  practice_score integer not null,
  protocol_used text not null,
  notes text
);

-- ============================================================
-- COACH NOTES
-- ============================================================
create table public.coach_notes (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  content text not null,
  is_private boolean not null default true
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.diagnostic_runs enable row level security;
alter table public.session_logs enable row level security;
alter table public.coach_notes enable row level security;

-- Helper: get current user role
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer;

-- Helper: get current user status
create or replace function public.get_user_status()
returns text as $$
  select status from public.profiles where id = auth.uid();
$$ language sql security definer;

-- PROFILES policies
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Admins can read all profiles"
  on public.profiles for select
  using (get_user_role() = 'admin');

create policy "Coaches can read assigned students"
  on public.profiles for select
  using (
    get_user_role() = 'coach'
    and (id = auth.uid() or assigned_coach_id = auth.uid())
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "Admins can update any profile"
  on public.profiles for update
  using (get_user_role() = 'admin');

create policy "Allow insert on signup"
  on public.profiles for insert
  with check (id = auth.uid());

-- DIAGNOSTIC RUNS policies
create policy "Students can read own diagnostics"
  on public.diagnostic_runs for select
  using (student_id = auth.uid());

create policy "Approved students can insert diagnostics"
  on public.diagnostic_runs for insert
  with check (
    student_id = auth.uid()
    and get_user_status() = 'approved'
  );

create policy "Admins can read all diagnostics"
  on public.diagnostic_runs for select
  using (get_user_role() = 'admin');

create policy "Coaches can read assigned student diagnostics"
  on public.diagnostic_runs for select
  using (
    get_user_role() = 'coach'
    and student_id in (
      select id from public.profiles where assigned_coach_id = auth.uid()
    )
  );

-- SESSION LOGS policies
create policy "Students can manage own sessions"
  on public.session_logs for all
  using (student_id = auth.uid());

create policy "Admins can read all sessions"
  on public.session_logs for select
  using (get_user_role() = 'admin');

create policy "Coaches can read assigned student sessions"
  on public.session_logs for select
  using (
    get_user_role() = 'coach'
    and student_id in (
      select id from public.profiles where assigned_coach_id = auth.uid()
    )
  );

-- COACH NOTES policies
create policy "Coaches can manage own notes"
  on public.coach_notes for all
  using (coach_id = auth.uid());

create policy "Admins can read all notes"
  on public.coach_notes for select
  using (get_user_role() = 'admin');

create policy "Students can read non-private notes about them"
  on public.coach_notes for select
  using (student_id = auth.uid() and is_private = false);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student',
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
create index idx_diagnostics_student on public.diagnostic_runs(student_id);
create index idx_diagnostics_created on public.diagnostic_runs(created_at desc);
create index idx_sessions_student on public.session_logs(student_id);
create index idx_sessions_created on public.session_logs(created_at desc);
create index idx_coach_notes_student on public.coach_notes(student_id);
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_status on public.profiles(status);
create index idx_profiles_coach on public.profiles(assigned_coach_id);
