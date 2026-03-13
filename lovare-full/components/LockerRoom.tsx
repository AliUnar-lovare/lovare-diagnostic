'use client'
import { useState, useEffect, useRef } from 'react'
import { LockerRoomProtocol, LockerRoomStep } from '@/types'

export default function LockerRoom({ protocol, onBack }: { protocol: LockerRoomProtocol; onBack: () => void }) {
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [breathPhase, setBreathPhase] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const breathRef = useRef<NodeJS.Timeout | null>(null)

  const BREATH_PHASES = ['Inhale', 'Hold', 'Exhale', 'Hold']
  const BREATH_DURATIONS = [4, 4, 4, 4]

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setRunning(false)
            clearInterval(intervalRef.current!)
            if (activeStep !== null) {
              setCompleted(c => new Set([...c, activeStep]))
            }
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running, timeLeft, activeStep])

  useEffect(() => {
    const step = protocol.steps.find(s => s.order === (activeStep ?? -1) + 1)
    if (running && step?.type === 'breathing') {
      let phaseIndex = 0
      let phaseTimeLeft = BREATH_DURATIONS[0]
      breathRef.current = setInterval(() => {
        phaseTimeLeft--
        if (phaseTimeLeft <= 0) {
          phaseIndex = (phaseIndex + 1) % 4
          phaseTimeLeft = BREATH_DURATIONS[phaseIndex]
          setBreathPhase(phaseIndex)
        }
      }, 1000)
      return () => clearInterval(breathRef.current!)
    } else {
      clearInterval(breathRef.current!)
    }
  }, [running, activeStep, protocol.steps])

  function parseDuration(dur: string): number {
    const match = dur.match(/(\d+)\s*(min|sec)/i)
    if (!match) return 60
    const val = parseInt(match[1])
    return match[2].toLowerCase().startsWith('m') ? val * 60 : val
  }

  function startStep(stepIndex: number) {
    const step = protocol.steps[stepIndex]
    setActiveStep(stepIndex)
    setTimeLeft(parseDuration(step.duration))
    setRunning(true)
    setBreathPhase(0)
  }

  function togglePause() { setRunning(r => !r) }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const allDone = protocol.steps.every((_, i) => completed.has(i))
  const currentStep = activeStep !== null ? protocol.steps[activeStep] : null
  const isBreathing = currentStep?.type === 'breathing'

  const breathSize = isBreathing && running
    ? breathPhase === 0 ? 160 : breathPhase === 1 ? 160 : breathPhase === 2 ? 80 : 80
    : 80

  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(184,152,63,0.15)' }}>
        <button onClick={onBack} className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>← Back</button>
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>The Locker Room</p>
        <div />
      </div>

      <div className="max-w-2xl mx-auto px-8 py-10">

        {/* Protocol header */}
        <div className="text-center mb-10">
          <h2 className="font-cormorant mb-2" style={{ fontSize: 38, fontWeight: 300, color: 'var(--cream)' }}>{protocol.name}</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>{protocol.duration} · {protocol.steps.length} steps</p>
          <p className="text-xs leading-relaxed max-w-md mx-auto" style={{ color: 'rgba(245,240,232,0.5)', fontWeight: 300 }}>{protocol.rationale}</p>
        </div>

        {/* Breathing animation */}
        {isBreathing && running && (
          <div className="flex flex-col items-center mb-8">
            <div className="relative flex items-center justify-center mb-4" style={{ width: 200, height: 200 }}>
              <div style={{
                width: breathSize, height: breathSize, borderRadius: '50%',
                background: 'rgba(184,152,63,0.12)',
                border: '2px solid rgba(184,152,63,0.4)',
                transition: 'all 1s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <p className="font-cormorant" style={{ fontSize: 14, color: 'var(--gold-light)' }}>{BREATH_PHASES[breathPhase]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Timer */}
        {activeStep !== null && running && (
          <div className="text-center mb-8">
            <p className="font-cormorant" style={{ fontSize: 72, fontWeight: 300, color: timeLeft < 10 ? '#E05252' : 'var(--gold-light)', lineHeight: 1 }}>
              {formatTime(timeLeft)}
            </p>
            <button onClick={togglePause} className="btn-outline text-xs py-2 px-6 mt-4">
              {running ? 'Pause' : 'Resume'}
            </button>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {protocol.steps.map((step, i) => {
            const isDone = completed.has(i)
            const isActive = activeStep === i
            const canStart = !running && (i === 0 || completed.has(i - 1))
            return (
              <div key={i} className="lovare-card p-5 transition-all"
                style={{
                  borderColor: isActive ? 'rgba(184,152,63,0.5)' : isDone ? 'rgba(82,168,126,0.3)' : undefined,
                  background: isActive ? 'rgba(184,152,63,0.06)' : isDone ? 'rgba(82,168,126,0.04)' : undefined,
                  opacity: !canStart && !isDone && !isActive ? 0.5 : 1,
                }}>
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      border: `1.5px solid ${isDone ? '#52A87E' : isActive ? 'var(--gold)' : 'rgba(184,152,63,0.3)'}`,
                      borderRadius: 2,
                    }}>
                    {isDone ? <span style={{ color: '#52A87E', fontSize: 12 }}>✓</span>
                      : <span className="font-cormorant" style={{ color: isActive ? 'var(--gold-light)' : 'var(--muted)', fontSize: 14 }}>{i + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium mb-1" style={{ color: isDone ? '#52A87E' : 'var(--cream)' }}>{step.name}</p>
                      <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>{step.duration}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(245,240,232,0.55)', fontWeight: 300 }}>{step.instruction}</p>
                  </div>
                  {!isDone && !isActive && canStart && (
                    <button className="btn-gold text-xs py-2 px-4 flex-shrink-0" onClick={() => startStep(i)}>Start</button>
                  )}
                  {isActive && !running && timeLeft > 0 && (
                    <button className="btn-outline text-xs py-2 px-4 flex-shrink-0" onClick={togglePause}>Resume</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Completion */}
        {allDone && (
          <div className="lovare-card p-8 text-center mt-6" style={{ borderColor: 'rgba(82,168,126,0.4)', background: 'rgba(82,168,126,0.05)' }}>
            <p className="font-cormorant mb-2" style={{ fontSize: 30, color: '#52A87E' }}>Protocol complete</p>
            <p className="text-xs mb-6" style={{ color: 'rgba(245,240,232,0.5)', fontWeight: 300 }}>Your nervous system is calibrated. Begin your session.</p>
            <button className="btn-gold" onClick={onBack}>Begin Practice</button>
          </div>
        )}

        {!allDone && activeStep === null && (
          <div className="text-center mt-6">
            <button className="btn-gold" onClick={() => startStep(0)}>Begin Protocol →</button>
          </div>
        )}
      </div>
    </div>
  )
}
