# LOVARE DIAGNOSTIC ENGINE v2 — DEPLOY GUIDE
# Full-stack: Next.js 14 + Supabase + Vercel
# Time to live: ~25 minutes

================================================================
STEP 1: SUPABASE PROJECT
================================================================

1. Go to https://supabase.com → New project
   Name: "lovare-diagnostic"
   Password: (save this)
   Region: US East (closest to DC)

2. Once created → SQL Editor → New query
   Paste the ENTIRE contents of supabase/schema.sql
   Click "Run" — you should see "Success" for all statements

3. Settings → API → copy:
   - Project URL         → NEXT_PUBLIC_SUPABASE_URL
   - anon/public key     → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role key    → SUPABASE_SERVICE_ROLE_KEY

4. Authentication → Providers → Email
   - "Confirm email" → DISABLE (you're manually approving anyway)
   - This allows instant login after signup without email verification

================================================================
STEP 2: CREATE YOUR ADMIN ACCOUNT
================================================================

After deploy (Step 4), sign up at /auth/signup with your email.

Then in Supabase → Table Editor → profiles:
Find your row → set role = 'admin' and status = 'approved'

This is a one-time manual step. All subsequent admin actions 
happen in the UI.

================================================================
STEP 3: PUSH TO GITHUB
================================================================

cd lovare-diagnostic-engine-v2
git init
git add .
git commit -m "Initial: Lovare Diagnostic Engine v2"
git remote add origin https://github.com/YOUR_USERNAME/lovare-diagnostic.git
git push -u origin main

================================================================
STEP 4: DEPLOY TO VERCEL
================================================================

1. Go to https://vercel.com → Add New Project
2. Import your GitHub repo
3. Framework: Next.js (auto-detected)
4. Environment Variables — add all three:
   NEXT_PUBLIC_SUPABASE_URL        = (from Step 1)
   NEXT_PUBLIC_SUPABASE_ANON_KEY   = (from Step 1)
   SUPABASE_SERVICE_ROLE_KEY       = (from Step 1)
5. Deploy → wait ~90 seconds → live

================================================================
STEP 5: ADD YOUR COACHING TEAM
================================================================

Each coach signs up at /auth/signup (or you create accounts for them).

Then in Supabase → Table Editor → profiles:
Find their row → set role = 'coach' and status = 'approved'

Once a coach exists in the system, you can assign students 
to them from the admin dashboard.

================================================================
STEP 6: STUDENT WORKFLOW
================================================================

1. Student goes to /auth/signup
2. Fills in: name, email, password, target school, intended focus
3. Status = "pending" — they see the pending page
4. You get notified (or check /admin daily)
5. Admin dashboard → Pending tab → Approve
6. Student receives access, logs in, runs diagnostic
7. You see all their data in /admin/students/[id]

================================================================
ROUTE MAP
================================================================

/ → redirects to /auth/login
/auth/login         Student/coach/admin login
/auth/signup        New student application
/auth/pending       Shown to unapproved students

/dashboard          Student home (scores, protocol, logger, history)
/admin              Admin dashboard (all students, approvals, stats)
/admin/students/[id] Full student record + coach notes + history
/admin/coaches      Manage coaching team (coming next if needed)

================================================================
WHAT'S BUILT
================================================================

✅ Supabase Postgres + Row Level Security
✅ Auth (email/password with server-side session management)
✅ Manual student approval workflow
✅ Role system: admin / coach / student
✅ Student assignment to coaches
✅ Diagnostic runs saved to database
✅ Session logs saved to database (persistent across logins)
✅ Admin dashboard: cohort stats, pending approvals, student table
✅ Admin student detail: full record, diagnostics history, charts
✅ Coach notes (private or visible to student)
✅ Admin internal notes per student
✅ DiagnosticWizard: 4-step intake
✅ Cause Attribution Map (anxiety vs. knowledge, per section)
✅ GAD-7 anxiety screen integrated into diagnosis
✅ Track assignment: anxiety-primary / knowledge-primary / mixed
✅ Intervention plan generated per track
✅ Locker Room: guided pre-session protocol with countdown timer
   and breathing animation (box breathing, physiological sigh)
✅ Session Logger: log + longitudinal charts + anxiety correlation
✅ Score trajectory charts per student (recharts)
✅ Diagnostic history (multiple runs tracked over time)
✅ Lovare navy/gold/cream design system throughout

================================================================
NEXT ENHANCEMENTS (when you're ready)
================================================================

- Email notifications (Resend) when student approved
- CSV export of cohort data (for NIW evidence documentation)
- Aggregate analytics page (/admin/analytics)
- Coach-only view (/coach) with filtered student list
- Thinkific webhook integration (auto-grant access to course students)
