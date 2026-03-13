'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Profile, DiagnosticRun, SessionLog, CoachNote } from '@/types'
import { analyzeSessionLogs } from '@/lib/engine'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Link from 'next/link'

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticRun[]>([])
  const [sessions, setSessions] = useState<SessionLog[]>([])
  const [notes, setNotes] = useState<CoachNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [notePrivate, setNotePrivate] = useState(true)
  const [loading, setLoading] = useState(true)
  const [adminNotes, setAdminNotes] = useState('')
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [{ data: p }, { data: d }, { data: s }, { data: n }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', params.id).single(),
      supabase.from('diagnostic_runs').select('*').eq('student_id', params.id).order('created_at', { ascending: false }),
      supabase.from('session_logs').select('*').eq('student_id', params.id).order('created_at', { ascending: true }),
      supabase.from('coach_notes').select('*').eq('student_id', params.id).order('created_at', { ascending: false }),
    ])
    setProfile(p); setDiagnostics(d ?? []); setSessions(s ?? []); setNotes(n ?? [])
    setAdminNotes(p?.notes ?? '')
    setLoading(false)
  }, [supabase, params.id])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveNotes() {
    await supabase.from('profiles').update({ notes: adminNotes }).eq('id', params.id)
  }

  async function addNote() {
    if (!newNote.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('coach_notes').insert({ coach_id: user!.id, student_id: params.id, content: newNote, is_private: notePrivate })
    setNewNote('')
    await fetchData()
  }

  const analysis = analyzeSessionLogs(sessions)
  const latestDiag = diagnostics[0]
  const chartData = sessions.map((s, i) => ({ session: `S${i+1}`, score: s.practice_score, anxiety: s.anxiety_rating * 10 }))

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy)' }}><p style={{ color: 'var(--muted)' }}>Loading...</p></div>
  if (!profile) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy)' }}><p style={{ color: 'var(--muted)' }}>Student not found</p></div>

  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
      <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-50"
        style={{ background: 'rgba(13,27,42,0.97)', borderBottom: '1px solid rgba(184,152,63,0.15)', backdropFilter: 'blur(8px)' }}>
        <div>
          <Link href="/admin" className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>← Admin</Link>
          <p className="font-cormorant mt-1" style={{ fontSize: 20, color: 'var(--cream)' }}>{profile.full_name}</p>
        </div>
        <span className="text-xs px-3 py-1 uppercase tracking-wider"
          style={{ background: profile.status === 'approved' ? 'rgba(82,168,126,0.1)' : profile.status === 'pending' ? 'rgba(224,160,82,0.1)' : 'rgba(224,82,82,0.1)', color: profile.status === 'approved' ? '#52A87E' : profile.status === 'pending' ? '#E0A052' : '#E05252', border: `1px solid ${profile.status === 'approved' ? 'rgba(82,168,126,0.3)' : 'rgba(224,82,82,0.3)'}`, fontFamily: 'Montserrat', fontSize: 9 }}>
          {profile.status}
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="grid grid-cols-3 gap-6">

          {/* LEFT: Profile + Notes */}
          <div className="space-y-5">
            <div className="lovare-card p-5">
              <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Profile</p>
              <div className="space-y-3 text-sm">
                <div><p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Email</p><p style={{ color: 'var(--cream)', fontWeight: 300 }}>{profile.email}</p></div>
                <div><p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Focus</p><p style={{ color: 'var(--cream)', fontWeight: 300 }}>{profile.intended_focus ?? '—'}</p></div>
                <div><p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Target School</p><p style={{ color: 'var(--cream)', fontWeight: 300 }}>{profile.target_law_school ?? '—'}</p></div>
                <div><p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Applied</p><p style={{ color: 'var(--cream)', fontWeight: 300 }}>{new Date(profile.created_at).toLocaleDateString()}</p></div>
              </div>
            </div>

            <div className="lovare-card p-5">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Admin Notes</p>
              <textarea rows={4} value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 outline-none resize-none text-xs mb-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(184,152,63,0.2)', color: 'var(--cream)', fontFamily: 'Montserrat', fontWeight: 300 }}
                placeholder="Internal notes about this student..." />
              <button className="btn-outline text-xs py-2 px-4 w-full" onClick={saveNotes}>Save Notes</button>
            </div>

            {/* Coach notes */}
            <div className="lovare-card p-5">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Coach Notes ({notes.length})</p>
              <textarea rows={2} value={newNote} onChange={e => setNewNote(e.target.value)}
                className="w-full px-3 py-2 outline-none resize-none text-xs mb-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(184,152,63,0.2)', color: 'var(--cream)', fontFamily: 'Montserrat', fontWeight: 300 }}
                placeholder="Add a note..." />
              <div className="flex gap-2 mb-3">
                <button onClick={() => setNotePrivate(!notePrivate)} className="text-xs px-3 py-1"
                  style={{ border: '1px solid rgba(184,152,63,0.2)', color: notePrivate ? 'var(--gold)' : 'var(--muted)', background: 'transparent', cursor: 'pointer', fontFamily: 'Montserrat' }}>
                  {notePrivate ? '🔒 Private' : '👁 Visible to student'}
                </button>
                <button className="btn-gold flex-1 text-xs py-1" onClick={addNote}>Add</button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notes.map(n => (
                  <div key={n.id} className="p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(184,152,63,0.1)' }}>
                    <p className="text-xs leading-relaxed mb-1" style={{ color: 'rgba(245,240,232,0.7)', fontWeight: 300 }}>{n.content}</p>
                    <p className="text-xs" style={{ color: 'rgba(138,127,110,0.5)' }}>{new Date(n.created_at).toLocaleDateString()} · {n.is_private ? '🔒' : '👁'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Diagnostic + Sessions */}
          <div className="col-span-2 space-y-5">

            {/* Latest diagnostic */}
            {latestDiag ? (
              <div className="lovare-card p-6">
                <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Latest Diagnostic · {new Date(latestDiag.created_at).toLocaleDateString()}</p>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {[
                    { label: 'Timed', value: `${latestDiag.overall_timed_score}%` },
                    { label: 'Untimed', value: `${latestDiag.overall_untimed_score}%` },
                    { label: 'Gap', value: `+${latestDiag.overall_delta}%`, color: latestDiag.overall_delta > 10 ? '#E05252' : 'var(--gold-light)' },
                    { label: 'Proj.', value: `+${latestDiag.projected_improvement}pts` },
                  ].map(s => (
                    <div key={s.label} className="text-center p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(184,152,63,0.1)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
                      <p className="font-cormorant" style={{ fontSize: 24, color: s.color ?? 'var(--cream)' }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(latestDiag.attributions as any[]).map((a: any) => (
                    <div key={a.questionType} className="p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(184,152,63,0.1)' }}>
                      <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>{a.questionType}</p>
                      <p className="text-xs font-medium capitalize mb-1" style={{ color: a.primaryCause === 'anxiety' ? '#E05252' : a.primaryCause === 'knowledge' ? '#5A8FD4' : '#C090FF' }}>{a.primaryCause}-driven</p>
                      <p className="text-xs" style={{ color: 'var(--muted)', fontWeight: 300 }}>{a.timedAccuracy}% timed → {a.untimedAccuracy}% untimed</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3 p-3" style={{ color: 'rgba(245,240,232,0.6)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(184,152,63,0.1)', fontWeight: 300, lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--gold)' }}>Track:</span> {latestDiag.track} · {latestDiag.track_rationale}
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>GAD-7: {latestDiag.gad7_total}/21 · {latestDiag.gad7_severity}</p>
              </div>
            ) : (
              <div className="lovare-card p-6 text-center">
                <p className="font-cormorant italic" style={{ fontSize: 18, color: 'var(--muted)' }}>No diagnostic run yet</p>
              </div>
            )}

            {/* Session chart */}
            {sessions.length >= 2 && (
              <div className="lovare-card p-6">
                <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Score Trajectory ({sessions.length} sessions)</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: 'Avg Score', value: analysis.avgScore },
                    { label: 'Improvement', value: `${analysis.scoreImprovement > 0 ? '+' : ''}${analysis.scoreImprovement}` },
                    { label: 'Trend', value: analysis.trend === 'improving' ? '↑' : analysis.trend === 'declining' ? '↓' : '→' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
                      <p className="font-cormorant" style={{ fontSize: 26, color: 'var(--gold-light)' }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="rgba(184,152,63,0.08)" strokeDasharray="4 4" />
                    <XAxis dataKey="session" tick={{ fill: 'rgba(245,240,232,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(245,240,232,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--navy-mid)', border: '1px solid rgba(184,152,63,0.3)', fontSize: 11, fontFamily: 'Montserrat' }} />
                    <Line type="monotone" dataKey="score" stroke="var(--gold-light)" strokeWidth={2} dot={{ fill: 'var(--gold)', r: 3 }} name="Score" />
                    <Line type="monotone" dataKey="anxiety" stroke="rgba(224,82,82,0.5)" strokeWidth={1.5} dot={false} name="Anxiety×10" strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs mt-3" style={{ color: 'var(--muted)', fontStyle: 'italic', fontWeight: 300 }}>{analysis.anxietyScoreCorrelation}</p>
              </div>
            )}

            {/* Diagnostic history */}
            {diagnostics.length > 1 && (
              <div className="lovare-card p-5">
                <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Diagnostic History ({diagnostics.length} runs)</p>
                <div className="space-y-2">
                  {diagnostics.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-4 p-3"
                      style={{ background: i === 0 ? 'rgba(184,152,63,0.05)' : 'rgba(255,255,255,0.01)', border: '1px solid rgba(184,152,63,0.1)' }}>
                      <p className="text-xs" style={{ color: 'var(--muted)', minWidth: 80 }}>{new Date(d.created_at).toLocaleDateString()}</p>
                      <p className="text-xs font-medium capitalize" style={{ color: d.track === 'anxiety-primary' ? '#E05252' : d.track === 'knowledge-primary' ? '#5A8FD4' : '#C090FF', minWidth: 100 }}>{d.track}</p>
                      <p className="text-xs" style={{ color: 'var(--cream)', fontWeight: 300 }}>Gap: +{d.overall_delta}% · Proj: +{d.projected_improvement}pts</p>
                      {i === 0 && <span className="text-xs px-2 py-0.5 ml-auto" style={{ background: 'rgba(184,152,63,0.1)', color: 'var(--gold)', border: '1px solid rgba(184,152,63,0.3)', fontFamily: 'Montserrat', fontSize: 8 }}>LATEST</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
