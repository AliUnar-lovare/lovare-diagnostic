'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Profile, DiagnosticRun, SessionLog } from '@/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface StudentRow {
  profile: Profile
  latestDiagnostic: DiagnosticRun | null
  sessionCount: number
  trend: string
}

export default function AdminPage() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [coaches, setCoaches] = useState<Profile[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'suspended'>('pending')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, diagnostics: 0, sessions: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [coachAssigning, setCoachAssigning] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false })
    const { data: coachData } = await supabase.from('profiles').select('*').eq('role', 'coach')
    const { data: diagnostics } = await supabase.from('diagnostic_runs').select('*')
    const { data: sessions } = await supabase.from('session_logs').select('id, student_id, practice_score, created_at')

    setCoaches(coachData ?? [])

    const rows: StudentRow[] = (profiles ?? []).map(p => {
      const studentDiags = (diagnostics ?? []).filter(d => d.student_id === p.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const studentSessions = (sessions ?? []).filter(s => s.student_id === p.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      let trend = 'no-data'
      if (studentSessions.length >= 4) {
        const mid = Math.floor(studentSessions.length / 2)
        const first = studentSessions.slice(0, mid).reduce((s, l) => s + l.practice_score, 0) / mid
        const second = studentSessions.slice(mid).reduce((s, l) => s + l.practice_score, 0) / (studentSessions.length - mid)
        trend = second > first + 2 ? 'improving' : second < first - 2 ? 'declining' : 'stable'
      }
      return { profile: p, latestDiagnostic: studentDiags[0] ?? null, sessionCount: studentSessions.length, trend }
    })

    setStudents(rows)
    setStats({
      total: profiles?.length ?? 0,
      pending: profiles?.filter(p => p.status === 'pending').length ?? 0,
      approved: profiles?.filter(p => p.status === 'approved').length ?? 0,
      diagnostics: diagnostics?.length ?? 0,
      sessions: sessions?.length ?? 0,
    })
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  async function approveStudent(id: string) {
    setActionLoading(id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: user?.id }).eq('id', id)
    await fetchData()
    setActionLoading(null)
  }

  async function suspendStudent(id: string) {
    setActionLoading(id)
    await supabase.from('profiles').update({ status: 'suspended' }).eq('id', id)
    await fetchData()
    setActionLoading(null)
  }

  async function assignCoach(studentId: string, coachId: string) {
    await supabase.from('profiles').update({ assigned_coach_id: coachId || null }).eq('id', studentId)
    setCoachAssigning(null)
    await fetchData()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const filtered = students.filter(s =>
    filter === 'all' ? true : s.profile.status === filter
  )

  const TREND_STYLE: Record<string, { color: string; label: string }> = {
    'improving': { color: '#52A87E', label: '↑ Improving' },
    'declining': { color: '#E05252', label: '↓ Declining' },
    'stable': { color: 'var(--gold)', label: '→ Stable' },
    'no-data': { color: 'var(--muted)', label: '— No data' },
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-50"
        style={{ background: 'rgba(13,27,42,0.97)', borderBottom: '1px solid rgba(184,152,63,0.15)', backdropFilter: 'blur(8px)' }}>
        <div>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Lovare Institut</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Admin Dashboard</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/admin/coaches" className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Manage Coaches</Link>
          <button onClick={handleSignOut} className="btn-outline text-xs py-2 px-4">Sign Out</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* STATS */}
        <div className="grid grid-cols-5 gap-4 mb-10">
          {[
            { label: 'Total Students', value: stats.total },
            { label: 'Pending Approval', value: stats.pending, highlight: stats.pending > 0 },
            { label: 'Active Students', value: stats.approved },
            { label: 'Diagnostics Run', value: stats.diagnostics },
            { label: 'Sessions Logged', value: stats.sessions },
          ].map(s => (
            <div key={s.label} className="lovare-card p-5 text-center"
              style={{ borderColor: s.highlight ? 'rgba(224,82,82,0.5)' : undefined }}>
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: s.highlight ? '#E05252' : 'var(--muted)', fontFamily: 'Montserrat' }}>{s.label}</p>
              <p className="font-cormorant" style={{ fontSize: 36, fontWeight: 300, color: s.highlight ? '#E05252' : 'var(--gold-light)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid rgba(184,152,63,0.15)' }}>
          {(['pending', 'approved', 'suspended', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-5 py-3 text-xs tracking-wider uppercase transition-all capitalize"
              style={{
                fontFamily: 'Montserrat', fontWeight: 500,
                color: filter === f ? 'var(--gold-light)' : 'var(--muted)',
                borderBottom: filter === f ? '2px solid var(--gold)' : '2px solid transparent',
                marginBottom: -1, background: 'transparent',
              }}>{f} {f !== 'all' && `(${students.filter(s => s.profile.status === f).length})`}</button>
          ))}
        </div>

        {/* STUDENT TABLE */}
        {loading ? (
          <div className="text-center py-20"><p style={{ color: 'var(--muted)' }}>Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-cormorant italic" style={{ fontSize: 22, color: 'var(--muted)' }}>No {filter} students</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(({ profile: p, latestDiagnostic: d, sessionCount, trend }) => (
              <div key={p.id} className="lovare-card p-5">
                <div className="flex items-start gap-6 flex-wrap">

                  {/* Student info */}
                  <div className="min-w-52">
                    <p className="font-cormorant mb-1" style={{ fontSize: 18, color: 'var(--cream)', fontWeight: 500 }}>{p.full_name || '(No name)'}</p>
                    <p className="text-xs mb-1" style={{ color: 'var(--muted)', fontWeight: 300 }}>{p.email}</p>
                    {p.intended_focus && <p className="text-xs" style={{ color: 'var(--gold)', fontFamily: 'Montserrat', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{p.intended_focus}</p>}
                    {p.target_law_school && <p className="text-xs mt-1" style={{ color: 'var(--muted)', fontWeight: 300 }}>Target: {p.target_law_school}</p>}
                    <p className="text-xs mt-2" style={{ color: 'rgba(138,127,110,0.5)' }}>
                      Applied {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Diagnostic data */}
                  <div className="flex gap-6 flex-1 flex-wrap">
                    {d ? (
                      <>
                        <div className="text-center">
                          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Track</p>
                          <p className="text-xs font-medium capitalize" style={{ color: d.track === 'anxiety-primary' ? '#E05252' : d.track === 'knowledge-primary' ? '#5A8FD4' : '#C090FF' }}>{d.track}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Gap</p>
                          <p className="font-cormorant" style={{ fontSize: 20, color: d.overall_delta > 10 ? '#E05252' : 'var(--gold-light)' }}>+{d.overall_delta}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Proj.</p>
                          <p className="font-cormorant" style={{ fontSize: 20, color: 'var(--gold-light)' }}>+{d.projected_improvement}pts</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Sessions</p>
                          <p className="font-cormorant" style={{ fontSize: 20, color: 'var(--cream)' }}>{sessionCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Trend</p>
                          <p className="text-xs font-medium" style={{ color: TREND_STYLE[trend]?.color }}>{TREND_STYLE[trend]?.label}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs self-center" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No diagnostic run yet</p>
                    )}
                  </div>

                  {/* Coach assignment */}
                  <div className="min-w-40">
                    <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>Coach</p>
                    {coachAssigning === p.id ? (
                      <select onChange={e => assignCoach(p.id, e.target.value)} defaultValue={p.assigned_coach_id ?? ''}
                        className="w-full px-2 py-1 text-xs outline-none"
                        style={{ background: 'var(--navy-mid)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat' }}>
                        <option value="">Unassigned</option>
                        {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => setCoachAssigning(p.id)} className="text-xs"
                        style={{ color: p.assigned_coach_id ? 'var(--gold-light)' : 'var(--muted)', fontFamily: 'Montserrat' }}>
                        {coaches.find(c => c.id === p.assigned_coach_id)?.full_name ?? 'Assign coach →'}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 items-start">
                    {p.status === 'pending' && (
                      <button className="btn-gold text-xs py-2 px-4" onClick={() => approveStudent(p.id)}
                        disabled={actionLoading === p.id}>
                        {actionLoading === p.id ? '...' : 'Approve'}
                      </button>
                    )}
                    {p.status === 'approved' && (
                      <button className="btn-outline text-xs py-2 px-4" onClick={() => suspendStudent(p.id)}
                        disabled={actionLoading === p.id}
                        style={{ borderColor: 'rgba(224,82,82,0.4)', color: '#E05252' }}>
                        {actionLoading === p.id ? '...' : 'Suspend'}
                      </button>
                    )}
                    {p.status === 'suspended' && (
                      <button className="btn-outline text-xs py-2 px-4" onClick={() => approveStudent(p.id)}
                        disabled={actionLoading === p.id}>
                        {actionLoading === p.id ? '...' : 'Reinstate'}
                      </button>
                    )}
                    <Link href={`/admin/students/${p.id}`} className="btn-outline text-xs py-2 px-4">View →</Link>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
