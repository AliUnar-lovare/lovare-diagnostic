'use client'
import { DiagnosticRun, SessionLog, SessionAnalysis, CauseAttribution, Intervention } from '@/types'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

interface Props {
  diagnostic: DiagnosticRun
  sessions: SessionLog[]
  analysis: SessionAnalysis
  studentName: string
  onGoLocker: () => void
  onGoLogger: () => void
  onRetake: () => void
  onHome: () => void
}

const TRACK_COLORS: Record<string, string> = {
  'anxiety-primary': '#E05252',
  'knowledge-primary': '#5A8FD4',
  'mixed': '#C090FF',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#E05252', moderate: '#E09052', mild: '#B8983F', strong: '#52A87E',
}

export default function DashboardResults({ diagnostic: d, sessions, analysis, studentName, onGoLocker, onGoLogger, onRetake, onHome }: Props) {
  const attributions = d.attributions as unknown as CauseAttribution[]
  const interventions = d.interventions as unknown as Intervention[]
  const protocol = d.locker_room_protocol as any
  const trackColor = TRACK_COLORS[d.track] ?? 'var(--gold)'

  const radarData = attributions.map(a => ({
    subject: a.questionType.split(' ')[0],
    Timed: a.timedAccuracy,
    Untimed: a.untimedAccuracy,
    fullMark: 100,
  }))

  const barData = attributions.map(a => ({
    name: a.questionType.split(' ')[0],
    anxiety: a.anxietyScore,
    knowledge: a.knowledgeScore,
  }))

  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-50"
        style={{ background: 'rgba(13,27,42,0.95)', borderBottom: '1px solid rgba(184,152,63,0.15)', backdropFilter: 'blur(8px)' }}>
        <div>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Diagnostic Results</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)', fontWeight: 300 }}>
            {studentName} · {new Date(d.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-outline text-xs py-2 px-4" onClick={onRetake}>Retake</button>
          <button className="btn-outline text-xs py-2 px-4" onClick={onHome}>Home</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Timed Accuracy', value: `${d.overall_timed_score}%` },
            { label: 'Untimed Accuracy', value: `${d.overall_untimed_score}%` },
            { label: 'Performance Gap', value: `+${d.overall_delta}%`, color: d.overall_delta > 10 ? '#E05252' : 'var(--gold-light)' },
            { label: 'Projected Gain', value: `+${d.projected_improvement}pts`, color: trackColor },
          ].map(s => (
            <div key={s.label} className="lovare-card p-5 text-center">
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--muted)', fontFamily: 'Montserrat', fontSize: 8 }}>{s.label}</p>
              <p className="font-cormorant" style={{ fontSize: 38, fontWeight: 300, color: (s as any).color ?? 'var(--cream)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Track */}
        <div className="lovare-card p-6" style={{ borderColor: `${trackColor}40`, background: `rgba(${d.track === 'anxiety-primary' ? '224,82,82' : d.track === 'knowledge-primary' ? '90,143,212' : '192,144,255'},0.05)` }}>
          <div className="flex items-start gap-5">
            <div className="min-w-40">
              <p className="text-xs tracking-widest uppercase mb-2" style={{ color: trackColor, fontFamily: 'Montserrat', fontSize: 8 }}>Your Track</p>
              <p className="font-cormorant capitalize" style={{ fontSize: 16, color: trackColor }}>{d.track}</p>
            </div>
            <div style={{ width: 1, background: `${trackColor}25`, alignSelf: 'stretch' }} />
            <p className="flex-1 text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.75)', fontWeight: 300 }}>{d.track_rationale}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          <div className="lovare-card p-6">
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Performance Profile</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(184,152,63,0.12)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(245,240,232,0.5)', fontSize: 11, fontFamily: 'Montserrat' }} />
                <Radar dataKey="Untimed" stroke="rgba(184,152,63,0.5)" fill="rgba(184,152,63,0.1)" strokeWidth={1.5} />
                <Radar dataKey="Timed" stroke="rgba(224,82,82,0.7)" fill="rgba(224,82,82,0.1)" strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="lovare-card p-6">
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Cause Attribution Map</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(245,240,232,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(245,240,232,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'var(--navy-mid)', border: '1px solid rgba(184,152,63,0.3)', fontSize: 11 }} />
                <Bar dataKey="anxiety" name="Anxiety %" fill="rgba(224,82,82,0.7)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="knowledge" name="Knowledge %" fill="rgba(184,152,63,0.5)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attribution cards */}
        <div className="grid grid-cols-3 gap-4">
          {attributions.map(a => (
            <div key={a.questionType} className="lovare-card p-5" style={{ borderColor: `${SEVERITY_COLORS[a.severity]}35` }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'Montserrat', fontSize: 9 }}>{a.questionType}</p>
                  <p className="capitalize" style={{ color: SEVERITY_COLORS[a.severity], fontSize: 14, fontWeight: 500 }}>
                    {a.primaryCause === 'anxiety' ? '⚡' : a.primaryCause === 'knowledge' ? '📚' : '◈'} {a.primaryCause}-driven
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 uppercase" style={{ background: `${SEVERITY_COLORS[a.severity]}15`, color: SEVERITY_COLORS[a.severity], border: `1px solid ${SEVERITY_COLORS[a.severity]}35`, fontSize: 8, fontFamily: 'Montserrat' }}>{a.severity}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted)' }}>
                    <span>Timed</span><span style={{ color: 'var(--cream)' }}>{a.timedAccuracy}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${a.timedAccuracy}%`, background: 'rgba(224,82,82,0.6)' }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted)' }}>
                    <span>Untimed</span><span style={{ color: 'var(--cream)' }}>{a.untimedAccuracy}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${a.untimedAccuracy}%` }} /></div>
                </div>
                {a.delta > 0 && <p className="text-xs" style={{ color: SEVERITY_COLORS[a.severity] }}>{a.delta}pt gap under time pressure</p>}
              </div>
            </div>
          ))}
        </div>

        {/* GAD-7 + session insight */}
        <div className="grid grid-cols-2 gap-6">
          <div className="lovare-card p-6">
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>GAD-7 Anxiety Profile</p>
            <div className="flex items-center gap-4">
              <p className="font-cormorant" style={{ fontSize: 52, fontWeight: 300, color: d.gad7_total >= 10 ? '#E05252' : d.gad7_total >= 5 ? 'var(--gold)' : '#52A87E' }}>{d.gad7_total}</p>
              <div className="flex-1">
                <p className="text-sm mb-2" style={{ color: 'var(--cream)' }}>{d.gad7_severity}</p>
                <div className="progress-bar mb-2">
                  <div className="progress-fill" style={{ width: `${(d.gad7_total / 21) * 100}%`, background: d.gad7_total >= 10 ? 'rgba(224,82,82,0.7)' : 'linear-gradient(90deg,var(--gold),var(--gold-light))' }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--muted)', fontWeight: 300 }}>out of 21</p>
              </div>
            </div>
          </div>
          <div className="lovare-card p-6">
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Session Insights</p>
            {sessions.length === 0 ? (
              <div className="text-center py-2">
                <p className="font-cormorant italic mb-3" style={{ fontSize: 16, color: 'var(--muted)' }}>No sessions logged yet</p>
                <button className="btn-outline text-xs py-2 px-4" onClick={onGoLogger}>Log First Session</button>
              </div>
            ) : (
              <div className="space-y-3">
                {[{ l: 'Sessions', v: analysis.totalSessions }, { l: 'Avg Score', v: analysis.avgScore }, { l: 'Improvement', v: `${analysis.scoreImprovement > 0 ? '+' : ''}${analysis.scoreImprovement}` }].map(s => (
                  <div key={s.l} className="flex justify-between">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{s.l}</span>
                    <span className="font-cormorant" style={{ fontSize: 18, color: 'var(--cream)' }}>{s.v}</span>
                  </div>
                ))}
                <p className="text-xs pt-2" style={{ color: 'var(--muted)', borderTop: '1px solid rgba(184,152,63,0.1)', fontWeight: 300, fontStyle: 'italic' }}>{analysis.anxietyScoreCorrelation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Interventions */}
        <div>
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Your Intervention Plan</p>
          <div className="space-y-3">
            {interventions.map(inv => (
              <div key={inv.id} className="lovare-card p-5">
                <div className="flex items-start gap-4">
                  <span className="text-xs px-2 py-0.5 uppercase mt-1"
                    style={{ background: inv.type === 'anxiety' ? 'rgba(224,82,82,0.1)' : 'rgba(184,152,63,0.1)', color: inv.type === 'anxiety' ? '#E05252' : 'var(--gold-light)', border: `1px solid ${inv.type === 'anxiety' ? 'rgba(224,82,82,0.3)' : 'rgba(184,152,63,0.3)'}`, fontSize: 8, fontFamily: 'Montserrat', whiteSpace: 'nowrap' }}>
                    {inv.type}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-cormorant mb-1" style={{ fontSize: 17, fontWeight: 500, color: 'var(--cream)' }}>{inv.title}</h4>
                    <p className="text-xs leading-relaxed mb-2" style={{ color: 'rgba(245,240,232,0.6)', fontWeight: 300 }}>{inv.description}</p>
                    <div className="flex gap-4 text-xs" style={{ color: 'var(--muted)' }}>
                      <span>⏱ {inv.duration}</span><span>📅 {inv.frequency}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Locker Room CTA */}
        <div className="lovare-card p-8 text-center" style={{ borderColor: 'rgba(184,152,63,0.4)', background: 'rgba(184,152,63,0.05)' }}>
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Your Pre-Session Protocol</p>
          <h3 className="font-cormorant mb-2" style={{ fontSize: 30, fontWeight: 300, color: 'var(--cream)' }}>{protocol?.name}</h3>
          <p className="text-sm mb-6" style={{ color: 'rgba(245,240,232,0.6)', fontWeight: 300 }}>{protocol?.duration} · {protocol?.steps?.length} steps · Before every timed session</p>
          <div className="flex justify-center gap-4">
            <button className="btn-gold" onClick={onGoLocker}>Enter The Locker Room</button>
            <button className="btn-outline" onClick={onGoLogger}>Log a Session</button>
          </div>
        </div>

      </div>
    </div>
  )
}
