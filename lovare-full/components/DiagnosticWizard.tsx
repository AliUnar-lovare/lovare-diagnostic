'use client'
import { useState } from 'react'
import { ScoreEntry, GAD7Response, QuestionType } from '@/types'

const QT: { key: keyof Pick<any,'lr'|'ar'|'rc'>; label: QuestionType; abbr: string }[] = [
  { key: 'lr', label: 'Logical Reasoning', abbr: 'LR' },
  { key: 'ar', label: 'Analytical Reasoning', abbr: 'AR' },
  { key: 'rc', label: 'Reading Comprehension', abbr: 'RC' },
]

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
]

const GAD7_OPTIONS = ['Not at all', 'Several days', 'More than half', 'Nearly every day']

interface ScoreInputs {
  lr: { tc: string; tt: string; uc: string; ut: string }
  ar: { tc: string; tt: string; uc: string; ut: string }
  rc: { tc: string; tt: string; uc: string; ut: string }
}

export default function DiagnosticWizard({ onComplete, onBack }: {
  onComplete: (scores: ScoreEntry[], gad7: GAD7Response) => void
  onBack: () => void
}) {
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState<ScoreInputs>({
    lr: { tc: '', tt: '26', uc: '', ut: '26' },
    ar: { tc: '', tt: '23', uc: '', ut: '23' },
    rc: { tc: '', tt: '27', uc: '', ut: '27' },
  })
  const [gad7, setGad7] = useState<number[]>(Array(7).fill(-1))

  const steps = ['Intro', 'Scores', 'GAD-7', 'Processing']

  function setScore(section: keyof ScoreInputs, field: string, val: string) {
    setScores(s => ({ ...s, [section]: { ...s[section], [field]: val } }))
  }

  function scoresValid() {
    return QT.every(({ key }) => {
      const s = scores[key]
      return [s.tc, s.tt, s.uc, s.ut].every(v => v !== '' && !isNaN(Number(v)) && Number(v) >= 0)
    })
  }

  function gad7Valid() { return gad7.every(v => v >= 0) }

  function handleComplete() {
    const scoreEntries: ScoreEntry[] = QT.map(({ key, label }) => ({
      questionType: label,
      timedCorrect: Number(scores[key].tc),
      timedTotal: Number(scores[key].tt),
      untimedCorrect: Number(scores[key].uc),
      untimedTotal: Number(scores[key].ut),
    }))
    const gad7Resp: GAD7Response = {
      q1: gad7[0], q2: gad7[1], q3: gad7[2], q4: gad7[3],
      q5: gad7[4], q6: gad7[5], q7: gad7[6],
    }
    onComplete(scoreEntries, gad7Resp)
  }

  const progress = ((step) / 3) * 100

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--navy)' }}>
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,152,63,0.15)' }}>
        <button onClick={onBack} className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>← Back</button>
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Lovare Diagnostic Engine</p>
        <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Step {step + 1} of 3</p>
      </div>

      {/* Progress */}
      <div style={{ height: 2, background: 'rgba(184,152,63,0.1)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--gold), var(--gold-light))', transition: 'width 0.4s ease' }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">

          {/* STEP 0: Intro */}
          {step === 0 && (
            <div className="text-center">
              <p className="text-xs tracking-widest uppercase mb-6" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Diagnostic Engine v2</p>
              <h1 className="font-cormorant mb-6" style={{ fontSize: 44, fontWeight: 300, color: 'var(--cream)', lineHeight: 1.2 }}>
                The first tool to distinguish<br /><em>why</em> you're losing points
              </h1>
              <p className="text-sm leading-relaxed mb-10 max-w-lg mx-auto" style={{ color: 'rgba(245,240,232,0.6)', fontWeight: 300 }}>
                Most LSAT tools prescribe more drilling. We first establish whether your score gap is driven by anxiety under time pressure — or genuine knowledge deficits. The intervention changes entirely depending on the cause.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-10 text-left">
                {[
                  { step: '01', title: 'Enter Your Scores', desc: 'Timed and untimed accuracy per section from a recent practice test' },
                  { step: '02', title: 'GAD-7 Assessment', desc: 'Clinically validated 7-item anxiety screen (2 minutes)' },
                  { step: '03', title: 'Your Protocol', desc: 'Personalized track, intervention plan, and pre-session protocol' },
                ].map(s => (
                  <div key={s.step} className="lovare-card p-4">
                    <p className="font-cormorant mb-2" style={{ fontSize: 28, color: 'rgba(184,152,63,0.4)', fontWeight: 300 }}>{s.step}</p>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--cream)', fontFamily: 'Montserrat' }}>{s.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', fontWeight: 300 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
              <button className="btn-gold text-sm" onClick={() => setStep(1)}>Begin Diagnostic →</button>
            </div>
          )}

          {/* STEP 1: Scores */}
          {step === 1 && (
            <div>
              <h2 className="font-cormorant text-center mb-2" style={{ fontSize: 36, fontWeight: 300, color: 'var(--cream)' }}>Enter your scores</h2>
              <p className="text-xs text-center mb-8" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>From a recent practice test — timed and untimed (with unlimited time)</p>

              <div className="space-y-6">
                {QT.map(({ key, label, abbr }) => (
                  <div key={key} className="lovare-card p-5">
                    <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>{label}</p>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Timed (standard test conditions)</p>
                        <div className="flex items-center gap-2">
                          <input type="number" placeholder="Correct" value={scores[key].tc} onChange={e => setScore(key, 'tc', e.target.value)} min={0}
                            className="w-20 px-3 py-2 text-sm text-center outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat' }} />
                          <span style={{ color: 'var(--muted)' }}>/</span>
                          <input type="number" placeholder="Total" value={scores[key].tt} onChange={e => setScore(key, 'tt', e.target.value)} min={1}
                            className="w-20 px-3 py-2 text-sm text-center outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat' }} />
                        </div>
                        {scores[key].tc && scores[key].tt && (
                          <p className="text-xs mt-1" style={{ color: 'rgba(224,82,82,0.7)' }}>
                            {Math.round((Number(scores[key].tc) / Number(scores[key].tt)) * 100)}% timed
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Untimed (unlimited time)</p>
                        <div className="flex items-center gap-2">
                          <input type="number" placeholder="Correct" value={scores[key].uc} onChange={e => setScore(key, 'uc', e.target.value)} min={0}
                            className="w-20 px-3 py-2 text-sm text-center outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat' }} />
                          <span style={{ color: 'var(--muted)' }}>/</span>
                          <input type="number" placeholder="Total" value={scores[key].ut} onChange={e => setScore(key, 'ut', e.target.value)} min={1}
                            className="w-20 px-3 py-2 text-sm text-center outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat' }} />
                        </div>
                        {scores[key].uc && scores[key].ut && (
                          <p className="text-xs mt-1" style={{ color: 'var(--gold)' }}>
                            {Math.round((Number(scores[key].uc) / Number(scores[key].ut)) * 100)}% untimed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <button className="btn-outline" onClick={() => setStep(0)}>← Back</button>
                <button className="btn-gold" onClick={() => setStep(2)} disabled={!scoresValid()}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 2: GAD-7 */}
          {step === 2 && (
            <div>
              <h2 className="font-cormorant text-center mb-2" style={{ fontSize: 36, fontWeight: 300, color: 'var(--cream)' }}>Anxiety Assessment</h2>
              <p className="text-xs text-center mb-2" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>GAD-7 · Clinically validated · 7 questions</p>
              <p className="text-xs text-center mb-8" style={{ color: 'rgba(138,127,110,0.6)', fontWeight: 300 }}>
                Over the last 2 weeks, how often have you been bothered by the following?
              </p>

              <div className="space-y-4">
                {GAD7_QUESTIONS.map((q, i) => (
                  <div key={i} className="lovare-card p-4">
                    <p className="text-sm mb-3" style={{ color: 'var(--cream)', fontWeight: 300 }}>{i + 1}. {q}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {GAD7_OPTIONS.map((opt, j) => (
                        <button key={j} onClick={() => setGad7(g => { const n = [...g]; n[i] = j; return n })}
                          className="py-2 px-2 text-xs transition-all"
                          style={{
                            background: gad7[i] === j ? 'rgba(184,152,63,0.15)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${gad7[i] === j ? 'var(--gold)' : 'rgba(184,152,63,0.12)'}`,
                            color: gad7[i] === j ? 'var(--gold-light)' : 'var(--muted)',
                            fontFamily: 'Montserrat', cursor: 'pointer', fontSize: 10,
                          }}>{opt}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <button className="btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-gold" onClick={() => { setStep(3); setTimeout(handleComplete, 1200) }} disabled={!gad7Valid()}>
                  Generate Report →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Processing */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-8 relative">
                <div className="absolute inset-0 rounded-full animate-pulse"
                  style={{ background: 'radial-gradient(circle, rgba(184,152,63,0.2) 0%, transparent 70%)' }} />
                <div className="w-full h-full flex items-center justify-center rounded-full"
                  style={{ border: '2px solid rgba(184,152,63,0.4)' }}>
                  <div className="w-8 h-8 rounded-full animate-spin"
                    style={{ border: '2px solid rgba(184,152,63,0.1)', borderTop: '2px solid var(--gold)' }} />
                </div>
              </div>
              <h2 className="font-cormorant mb-4" style={{ fontSize: 32, fontWeight: 300, color: 'var(--cream)' }}>Computing your profile</h2>
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat', fontWeight: 300 }}>
                Analyzing cause attribution map · Assigning track · Generating protocol
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
