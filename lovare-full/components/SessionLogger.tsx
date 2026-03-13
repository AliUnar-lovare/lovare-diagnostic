'use client'
import { useState } from 'react'
import { SessionLog, SessionAnalysis } from '@/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface Props {
  sessions: SessionLog[]
  protocol: string
  analysis: SessionAnalysis
  onAdd: (log: { anxiety: number; confidence: number; score: number; protocol: string; notes: string }) => Promise<void>
  onBack: () => void
}

export default function SessionLogger({ sessions, protocol, analysis, onAdd, onBack }: Props) {
  const [anxiety, setAnxiety] = useState(5)
  const [confidence, setConfidence] = useState(5)
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedProtocol, setSelectedProtocol] = useState(protocol)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const PROTOCOLS = [protocol, 'The Reset Protocol', 'The Focus Protocol', 'The Balance Protocol', 'Custom']

  async function handleSave() {
    if (!score || isNaN(Number(score))) return
    setSaving(true)
    await onAdd({ anxiety, confidence, score: Number(score), protocol: selectedProtocol, notes })
    setScore(''); setNotes(''); setAnxiety(5); setConfidence(5)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const chartData = sessions.map((s, i) => ({
    session: `S${i + 1}`,
    Score: s.practice_score,
    'Anxiety×10': s.anxiety_rating * 10,
    'Confidence×10': s.confidence_rating * 10,
  }))

  const RatingSlider = ({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>{label}</p>
        <p className="font-cormorant" style={{ fontSize: 22, color, lineHeight: 1 }}>{value}/10</p>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full" style={{ accentColor: color }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,152,63,0.15)' }}>
        <button onClick={onBack} className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>← Back</button>
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Session Logger</p>
        <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>{sessions.length} sessions</p>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="grid grid-cols-2 gap-8">

          {/* LOG FORM */}
          <div>
            <h2 className="font-cormorant mb-6" style={{ fontSize: 30, fontWeight: 300, color: 'var(--cream)' }}>Log today's session</h2>
            <div className="lovare-card p-6 space-y-5">
              <RatingSlider label="Anxiety level before session" value={anxiety} onChange={setAnxiety} color="#E05252" />
              <RatingSlider label="Confidence level" value={confidence} onChange={setConfidence} color="var(--gold)" />

              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Practice Score (correct/total or %)</label>
                <input type="number" value={score} onChange={e => setScore(e.target.value)}
                  placeholder="e.g. 68"
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat' }} />
              </div>

              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Protocol Used</label>
                <select value={selectedProtocol} onChange={e => setSelectedProtocol(e.target.value)}
                  className="w-full px-4 py-3 text-xs outline-none"
                  style={{ background: 'var(--navy-mid)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat' }}>
                  {PROTOCOLS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="What went well, what to work on..."
                  className="w-full px-4 py-3 text-xs outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(184,152,63,0.2)', color: 'var(--cream)', fontFamily: 'Montserrat', fontWeight: 300 }} />
              </div>

              <button className="btn-gold w-full" onClick={handleSave} disabled={saving || !score}>
                {saved ? '✓ Logged' : saving ? 'Saving...' : 'Log Session'}
              </button>
            </div>
          </div>

          {/* ANALYSIS */}
          <div className="space-y-5">
            {sessions.length >= 2 ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Sessions', value: analysis.totalSessions },
                    { label: 'Avg Score', value: analysis.avgScore },
                    { label: 'Score Change', value: `${analysis.scoreImprovement > 0 ? '+' : ''}${analysis.scoreImprovement}`, color: analysis.scoreImprovement > 0 ? '#52A87E' : '#E05252' },
                    { label: 'Trend', value: analysis.trend === 'improving' ? '↑ Improving' : analysis.trend === 'declining' ? '↓ Declining' : '→ Stable', color: analysis.trend === 'improving' ? '#52A87E' : analysis.trend === 'declining' ? '#E05252' : 'var(--gold)' },
                  ].map(s => (
                    <div key={s.label} className="lovare-card p-4 text-center">
                      <p className="text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'Montserrat', fontSize: 9 }}>{s.label}</p>
                      <p className="font-cormorant" style={{ fontSize: 24, color: (s as any).color ?? 'var(--gold-light)' }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="lovare-card p-5">
                  <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Score Trajectory</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <CartesianGrid stroke="rgba(184,152,63,0.07)" strokeDasharray="4 4" />
                      <XAxis dataKey="session" tick={{ fill: 'rgba(245,240,232,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(245,240,232,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--navy-mid)', border: '1px solid rgba(184,152,63,0.3)', fontSize: 11, fontFamily: 'Montserrat' }} />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Montserrat', color: 'rgba(245,240,232,0.4)' }} />
                      <Line type="monotone" dataKey="Score" stroke="var(--gold-light)" strokeWidth={2} dot={{ fill: 'var(--gold)', r: 3 }} />
                      <Line type="monotone" dataKey="Anxiety×10" stroke="rgba(224,82,82,0.5)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="lovare-card p-5 space-y-3">
                  <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Insights</p>
                  <div className="p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(184,152,63,0.1)' }}>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.7)', fontWeight: 300, lineHeight: 1.6 }}>{analysis.anxietyScoreCorrelation}</p>
                  </div>
                  {analysis.bestProtocol !== 'Insufficient data' && (
                    <div className="p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(184,152,63,0.1)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Best-performing protocol</p>
                      <p className="text-xs font-medium" style={{ color: 'var(--gold-light)' }}>{analysis.bestProtocol}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="lovare-card p-8 text-center h-full flex flex-col items-center justify-center">
                <p className="font-cormorant italic mb-3" style={{ fontSize: 20, color: 'var(--muted)' }}>Log {2 - sessions.length} more session{sessions.length === 0 ? 's' : ''}</p>
                <p className="text-xs" style={{ color: 'rgba(138,127,110,0.5)', fontWeight: 300 }}>to unlock trend analysis and anxiety correlation insights</p>
              </div>
            )}
          </div>
        </div>

        {/* Session history */}
        {sessions.length > 0 && (
          <div className="mt-8">
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Session History</p>
            <div className="space-y-2">
              {[...sessions].reverse().map((s, i) => (
                <div key={s.id} className="lovare-card p-4 flex items-center gap-6">
                  <p className="text-xs" style={{ color: 'var(--muted)', minWidth: 60 }}>{s.date_label}</p>
                  <div className="flex gap-4 flex-1">
                    <span className="text-xs" style={{ color: '#E05252' }}>Anxiety {s.anxiety_rating}/10</span>
                    <span className="text-xs" style={{ color: 'var(--gold)' }}>Confidence {s.confidence_rating}/10</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--cream)' }}>Score: {s.practice_score}</span>
                    <span className="text-xs" style={{ color: 'rgba(138,127,110,0.5)' }}>{s.protocol_used}</span>
                  </div>
                  {s.notes && <p className="text-xs italic" style={{ color: 'var(--muted)', maxWidth: 200 }}>{s.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
