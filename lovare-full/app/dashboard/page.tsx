'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { DiagnosticRun, SessionLog, Profile } from '@/types'
import { analyzeSessionLogs, runDiagnostic } from '@/lib/engine'
import DiagnosticWizard from '@/components/DiagnosticWizard'
import DashboardResults from '@/components/DashboardResults'
import LockerRoom from '@/components/LockerRoom'
import SessionLogger from '@/components/SessionLogger'
import { useRouter } from 'next/navigation'

type View = 'home' | 'diagnostic' | 'results' | 'locker' | 'logger'

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticRun[]>([])
  const [sessions, setSessions] = useState<SessionLog[]>([])
  const [view, setView] = useState<View>('home')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const [{ data: p }, { data: d }, { data: s }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('diagnostic_runs').select('*').eq('student_id', user.id).order('created_at', { ascending: false }),
      supabase.from('session_logs').select('*').eq('student_id', user.id).order('created_at', { ascending: true }),
    ])
    setProfile(p); setDiagnostics(d ?? []); setSessions(s ?? [])
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDiagnosticComplete(scores: any, gad7: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !profile) return
    const result = runDiagnostic(profile.full_name, scores, gad7)
    const row = {
      student_id: user.id,
      lr_timed_correct: scores[0].timedCorrect, lr_timed_total: scores[0].timedTotal,
      lr_untimed_correct: scores[0].untimedCorrect, lr_untimed_total: scores[0].untimedTotal,
      ar_timed_correct: scores[1].timedCorrect, ar_timed_total: scores[1].timedTotal,
      ar_untimed_correct: scores[1].untimedCorrect, ar_untimed_total: scores[1].untimedTotal,
      rc_timed_correct: scores[2].timedCorrect, rc_timed_total: scores[2].timedTotal,
      rc_untimed_correct: scores[2].untimedCorrect, rc_untimed_total: scores[2].untimedTotal,
      gad7_q1: gad7.q1, gad7_q2: gad7.q2, gad7_q3: gad7.q3, gad7_q4: gad7.q4,
      gad7_q5: gad7.q5, gad7_q6: gad7.q6, gad7_q7: gad7.q7, gad7_total: result.gad7Total,
      overall_timed_score: result.overallTimedScore, overall_untimed_score: result.overallUntimedScore,
      overall_delta: result.overallDelta, anxiety_profile: result.anxietyProfile,
      gad7_severity: result.gad7Severity, track: result.track, track_rationale: result.trackRationale,
      projected_improvement: result.projectedImprovement, attributions: result.attributions,
      interventions: result.interventions, locker_room_protocol: result.lockerRoomProtocol,
    }
    await supabase.from('diagnostic_runs').insert(row)
    await fetchData()
    setView('results')
  }

  async function handleSessionLog(log: { anxiety: number; confidence: number; score: number; protocol: string; notes: string }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('session_logs').insert({
      student_id: user.id,
      diagnostic_id: diagnostics[0]?.id ?? null,
      date_label: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      anxiety_rating: log.anxiety, confidence_rating: log.confidence,
      practice_score: log.score, protocol_used: log.protocol, notes: log.notes || null,
    })
    await fetchData()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const latestDiag = diagnostics[0] ?? null
  const analysis = analyzeSessionLogs(sessions)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy)' }}>
      <p style={{ color: 'var(--muted)', fontFamily: 'Montserrat', fontSize: 12 }}>Loading...</p>
    </div>
  )

  if (view === 'diagnostic') return (
    <DiagnosticWizard onComplete={handleDiagnosticComplete} onBack={() => setView('home')} />
  )

  if (view === 'results' && latestDiag) return (
    <DashboardResults
      diagnostic={latestDiag} sessions={sessions} analysis={analysis}
      onGoLocker={() => setView('locker')} onGoLogger={() => setView('logger')}
      onRetake={() => setView('diagnostic')} onHome={() => setView('home')}
      studentName={profile?.full_name ?? ''}
    />
  )

  if (view === 'locker' && latestDiag) return (
    <LockerRoom protocol={latestDiag.locker_room_protocol as any} onBack={() => setView(latestDiag ? 'results' : 'home')} />
  )

  if (view === 'logger') return (
    <SessionLogger
      sessions={sessions}
      protocol={(latestDiag?.locker_room_protocol as any)?.name ?? 'The Focus Protocol'}
      analysis={analysis}
      onAdd={handleSessionLog}
      onBack={() => setView(latestDiag ? 'results' : 'home')}
    />
  )

  // HOME VIEW
  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      </div>

      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-50"
        style={{ background: 'rgba(13,27,42,0.95)', borderBottom: '1px solid rgba(184,152,63,0.15)', backdropFilter: 'blur(8px)' }}>
        <div>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Lovare Institut</p>
          <p className="font-cormorant mt-1" style={{ fontSize: 16, color: 'var(--cream)' }}>Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Student'}</p>
        </div>
        <button onClick={handleSignOut} className="btn-outline text-xs py-2 px-4">Sign Out</button>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-10">

        {/* Quick stats */}
        {latestDiag && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Performance Gap', value: `+${latestDiag.overall_delta}%`, color: latestDiag.overall_delta > 10 ? '#E05252' : 'var(--gold-light)' },
              { label: 'Projected Gain', value: `+${latestDiag.projected_improvement}pts`, color: 'var(--gold-light)' },
              { label: 'Sessions Logged', value: sessions.length },
              { label: 'Score Trend', value: analysis.trend === 'improving' ? '↑' : analysis.trend === 'declining' ? '↓' : '→', color: analysis.trend === 'improving' ? '#52A87E' : analysis.trend === 'declining' ? '#E05252' : 'var(--gold)' },
            ].map(s => (
              <div key={s.label} className="lovare-card p-4 text-center">
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--muted)', fontFamily: 'Montserrat', fontSize: 8 }}>{s.label}</p>
                <p className="font-cormorant" style={{ fontSize: 30, fontWeight: 300, color: (s as any).color ?? 'var(--cream)' }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main CTA grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

          <div className="lovare-card p-7" style={{ borderColor: 'rgba(184,152,63,0.4)', background: 'rgba(184,152,63,0.05)' }}>
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>
              {latestDiag ? `Diagnostic · ${new Date(latestDiag.created_at).toLocaleDateString()}` : 'Get Started'}
            </p>
            <h3 className="font-cormorant mb-3" style={{ fontSize: 26, fontWeight: 300, color: 'var(--cream)' }}>
              {latestDiag ? 'View Your Results' : 'Run Your Diagnostic'}
            </h3>
            <p className="text-xs leading-relaxed mb-6" style={{ color: 'rgba(245,240,232,0.6)', fontWeight: 300 }}>
              {latestDiag
                ? `Track: ${latestDiag.track} · GAD-7: ${latestDiag.gad7_total}/21 · ${latestDiag.gad7_severity}`
                : 'The first tool to distinguish anxiety-driven from knowledge-driven errors. Takes 5 minutes.'}
            </p>
            <div className="flex gap-3">
              {latestDiag && <button className="btn-gold" onClick={() => setView('results')}>View Results</button>}
              <button className={latestDiag ? 'btn-outline' : 'btn-gold'} onClick={() => setView('diagnostic')}>
                {latestDiag ? 'Retake' : 'Run Diagnostic →'}
              </button>
            </div>
          </div>

          <div className="lovare-card p-7">
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Pre-Session Protocol</p>
            <h3 className="font-cormorant mb-3" style={{ fontSize: 26, fontWeight: 300, color: 'var(--cream)' }}>
              {latestDiag ? (latestDiag.locker_room_protocol as any).name : 'The Locker Room'}
            </h3>
            <p className="text-xs leading-relaxed mb-6" style={{ color: 'rgba(245,240,232,0.6)', fontWeight: 300 }}>
              {latestDiag
                ? `${(latestDiag.locker_room_protocol as any).duration} · Use before every timed session`
                : 'Run your diagnostic first to get your personalized pre-session protocol.'}
            </p>
            <button className={latestDiag ? 'btn-gold' : 'btn-outline'} onClick={() => latestDiag ? setView('locker') : setView('diagnostic')}
              disabled={!latestDiag}>
              {latestDiag ? 'Enter The Locker Room' : 'Run diagnostic first'}
            </button>
          </div>

          <div className="lovare-card p-7">
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Session Tracker</p>
            <h3 className="font-cormorant mb-3" style={{ fontSize: 26, fontWeight: 300, color: 'var(--cream)' }}>
              {sessions.length > 0 ? `${sessions.length} sessions logged` : 'Track your progress'}
            </h3>
            <p className="text-xs leading-relaxed mb-6" style={{ color: 'rgba(245,240,232,0.6)', fontWeight: 300 }}>
              {sessions.length > 0
                ? analysis.anxietyScoreCorrelation
                : 'Log anxiety, confidence, and scores after each session to uncover your performance patterns.'}
            </p>
            <button className="btn-gold" onClick={() => setView('logger')}>
              {sessions.length > 0 ? 'Log Session' : 'Start Logging →'}
            </button>
          </div>

          {/* Diagnostic history */}
          <div className="lovare-card p-7">
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Diagnostic History</p>
            {diagnostics.length === 0 ? (
              <>
                <h3 className="font-cormorant mb-3" style={{ fontSize: 26, fontWeight: 300, color: 'var(--cream)' }}>No history yet</h3>
                <p className="text-xs" style={{ color: 'var(--muted)', fontWeight: 300 }}>Your diagnostic history will appear here after your first run.</p>
              </>
            ) : (
              <div className="space-y-2">
                {diagnostics.slice(0, 4).map((d, i) => (
                  <div key={d.id} className="flex justify-between items-center p-2"
                    style={{ background: i === 0 ? 'rgba(184,152,63,0.05)' : 'transparent', border: '1px solid rgba(184,152,63,0.1)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{new Date(d.created_at).toLocaleDateString()}</p>
                    <p className="text-xs capitalize" style={{ color: d.track === 'anxiety-primary' ? '#E05252' : d.track === 'knowledge-primary' ? '#5A8FD4' : '#C090FF' }}>{d.track}</p>
                    <p className="text-xs" style={{ color: 'var(--cream)' }}>+{d.overall_delta}% gap</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Intended focus */}
        {profile?.intended_focus && (
          <div className="text-center py-6" style={{ borderTop: '1px solid rgba(184,152,63,0.1)' }}>
            <p className="font-cormorant italic" style={{ fontSize: 16, color: 'var(--muted)' }}>
              Pipeline focus: <span style={{ color: 'var(--gold-light)' }}>{profile.intended_focus}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
