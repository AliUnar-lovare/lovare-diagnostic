import {
  ScoreEntry, GAD7Response, CauseAttribution, DiagnosticResult,
  InterventionTrack, AnxietyProfile, Intervention, LockerRoomProtocol,
  SessionLog, SessionAnalysis, QuestionType
} from '@/types'

const QT: QuestionType[] = ['Logical Reasoning', 'Analytical Reasoning', 'Reading Comprehension']

export function calculateGAD7(r: GAD7Response): number {
  return r.q1 + r.q2 + r.q3 + r.q4 + r.q5 + r.q6 + r.q7
}

export function classifyGAD7(total: number): { severity: string; profile: AnxietyProfile } {
  if (total >= 15) return { severity: 'Severe anxiety', profile: 'high' }
  if (total >= 10) return { severity: 'Moderate anxiety', profile: 'high' }
  if (total >= 5)  return { severity: 'Mild anxiety', profile: 'moderate' }
  return { severity: 'Minimal anxiety', profile: 'low' }
}

export function computeCauseAttribution(entry: ScoreEntry, gad7Profile: AnxietyProfile): CauseAttribution {
  const timedAcc = (entry.timedCorrect / entry.timedTotal) * 100
  const untimedAcc = (entry.untimedCorrect / entry.untimedTotal) * 100
  const delta = untimedAcc - timedAcc
  const gad7Multiplier = gad7Profile === 'high' ? 1.2 : gad7Profile === 'moderate' ? 1.0 : 0.85
  const rawAnxietyScore = Math.min(100, Math.max(0, delta > 0 ? (delta / 30) * 100 * gad7Multiplier : 0))
  const rawKnowledgeScore = Math.min(100, Math.max(0, 100 - untimedAcc))
  const total = rawAnxietyScore + rawKnowledgeScore || 1
  const anxietyScore = Math.round((rawAnxietyScore / total) * 100)
  const knowledgeScore = 100 - anxietyScore
  const primaryCause = anxietyScore >= 65 ? 'anxiety' : knowledgeScore >= 65 ? 'knowledge' : 'mixed'
  let severity: CauseAttribution['severity']
  if (primaryCause === 'anxiety') {
    severity = delta >= 20 ? 'critical' : delta >= 14 ? 'moderate' : 'mild'
  } else {
    severity = untimedAcc < 60 ? 'critical' : untimedAcc < 75 ? 'moderate' : untimedAcc >= 85 ? 'strong' : 'mild'
  }
  return {
    questionType: entry.questionType, timedAccuracy: Math.round(timedAcc),
    untimedAccuracy: Math.round(untimedAcc), delta: Math.round(delta),
    anxietyScore, knowledgeScore, primaryCause, severity,
  }
}

export function assignTrack(attributions: CauseAttribution[], gad7Profile: AnxietyProfile): { track: InterventionTrack; rationale: string } {
  const anxietyDriven = attributions.filter(a => a.primaryCause === 'anxiety').length
  const knowledgeDriven = attributions.filter(a => a.primaryCause === 'knowledge').length
  const total = attributions.length
  if (anxietyDriven / total >= 0.6 || gad7Profile === 'high') return {
    track: 'anxiety-primary',
    rationale: 'Your diagnostic shows performance gaps are primarily driven by time-pressure anxiety rather than content mastery. Drilling more content will not close these gaps. Your plan prioritizes psychological performance techniques first.',
  }
  if (knowledgeDriven / total >= 0.6 && gad7Profile === 'low') return {
    track: 'knowledge-primary',
    rationale: 'Your diagnostic shows strong untimed performance. The primary driver of your score gap is content mastery. Your plan focuses on targeted knowledge remediation in your weakest question types.',
  }
  return {
    track: 'mixed',
    rationale: 'Your diagnostic shows a combination of anxiety-driven and knowledge-driven gaps. Your plan interleaves psychological performance techniques and content remediation, adjusting balance weekly based on your session data.',
  }
}

const INTERVENTIONS: Intervention[] = [
  { id: 'box-breathing', title: 'Pre-Session Box Breathing', type: 'anxiety', description: 'Four-count inhale, four-count hold, four-count exhale, four-count hold. Activates the parasympathetic nervous system and reduces cortisol before timed practice. Use the Locker Room timer before every session.', duration: '4 minutes', frequency: 'Before every timed session', priority: 'high' },
  { id: 'catastrophe-mapping', title: 'Catastrophe Mapping (CBT)', type: 'anxiety', description: 'Write your worst-case LSAT scenario in one sentence. Then: actual probability it occurs, actual consequences if it does, three concrete recovery paths. Defuses catastrophic thinking before it hijacks working memory.', duration: '10 minutes', frequency: '2× per week before high-stakes sets', priority: 'high' },
  { id: 'paced-timing-ladder', title: 'Paced Timing Ladder', type: 'anxiety', description: 'Start at 2.5 minutes per question, decrease by 10 seconds each session until standard 1:22 pace. Conditions your nervous system to time pressure gradually, breaking the anxiety-speed spiral.', duration: '35 minutes', frequency: 'Every other day', priority: 'high' },
  { id: 'performance-cue', title: 'Performance Cue Activation', type: 'anxiety', description: 'Identify one memory of peak academic performance. Before every timed session, spend 90 seconds in vivid recall — sensory details, confidence level, physical state. Primes the neural state associated with high performance.', duration: '90 seconds', frequency: 'Before every timed section', priority: 'medium' },
  { id: 'blind-review-delta', title: 'Blind Review Delta Analysis', type: 'knowledge', description: 'After every section: mark uncertain questions. With unlimited time, reattempt marked questions. Wrong timed but right untimed = anxiety. Wrong in both = knowledge gap. Drill only the second category.', duration: '60–90 minutes', frequency: 'After every full section', priority: 'high' },
  { id: 'question-type-drilling', title: 'Question-Type Isolation Drilling', type: 'knowledge', description: 'Drill your weakest question type in isolation — 20 questions per session, untimed, with full explanation review for every wrong answer. No mixed sets until 85% untimed accuracy.', duration: '45 minutes', frequency: '4× per week on weakest type', priority: 'high' },
  { id: 'explanation-reconstruction', title: 'Explanation Reconstruction', type: 'knowledge', description: 'For every wrong answer: close the explanation and reconstruct the reasoning from scratch in writing. Don\'t stop until you can explain why the right answer is right AND why each wrong answer is wrong.', duration: '10–15 min per question', frequency: 'Every incorrect practice answer', priority: 'medium' },
  { id: 'interleaved-protocol', title: 'Interleaved Anxiety + Content Protocol', type: 'mixed', description: 'Alternate: one anxiety-focused session (Locker Room + paced timing) followed by one content session (blind review + drilling). Review session logs weekly and weight toward whichever produced the highest score delta.', duration: '45–60 minutes', frequency: 'Daily, alternating', priority: 'high' },
]

export function selectInterventions(track: InterventionTrack): Intervention[] {
  const anxiety = INTERVENTIONS.filter(i => i.type === 'anxiety')
  const knowledge = INTERVENTIONS.filter(i => i.type === 'knowledge')
  const mixed = INTERVENTIONS.filter(i => i.type === 'mixed')
  if (track === 'anxiety-primary') return [...anxiety].sort((a, b) => a.priority === 'high' ? -1 : 1)
  if (track === 'knowledge-primary') return [...knowledge].sort((a, b) => a.priority === 'high' ? -1 : 1)
  return [...mixed, ...anxiety.slice(0, 2), ...knowledge.slice(0, 2)]
}

export function assignLockerRoomProtocol(track: InterventionTrack, gad7Total: number): LockerRoomProtocol {
  if (track === 'anxiety-primary' || gad7Total >= 10) return {
    name: 'The Reset Protocol', duration: '5 minutes',
    rationale: 'Your GAD-7 score and diagnostic pattern indicate significant pre-performance anxiety. This protocol activates the parasympathetic nervous system and resets your cognitive baseline before timed work.',
    steps: [
      { order: 1, name: 'Physiological Sigh', duration: '1 min', type: 'breathing', instruction: 'Double inhale through the nose (short, then long), followed by a long exhale through the mouth. Repeat 5 times. Fastest evidence-based intervention for acute anxiety reduction.' },
      { order: 2, name: 'Catastrophe Defusion', duration: '2 min', type: 'cbt', instruction: 'State your fear: "I\'m afraid I will ___." Then complete: "The actual probability is ___. If it happened, I would ___." Interrupts the rumination loop.' },
      { order: 3, name: 'Performance Anchor', duration: '90 sec', type: 'visualization', instruction: 'Close your eyes. Recall a moment of strong academic performance in vivid detail — where you were, how your body felt, how clear your thinking was. Hold 60 seconds.' },
      { order: 4, name: 'Ready State', duration: '30 sec', type: 'physical', instruction: 'Sit up straight, shoulders back, feet flat. One deep breath. Say: "I know this material. I am ready to show it." Begin.' },
    ],
  }
  if (track === 'knowledge-primary') return {
    name: 'The Focus Protocol', duration: '3 minutes',
    rationale: 'Your anxiety levels are manageable. This protocol optimizes cognitive focus and working memory access before timed sections.',
    steps: [
      { order: 1, name: 'Box Breathing', duration: '90 sec', type: 'breathing', instruction: 'Inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 4 cycles. Regulates heart rate variability and sharpens prefrontal attention.' },
      { order: 2, name: 'Intention Setting', duration: '60 sec', type: 'cbt', instruction: 'State one specific technical goal: "Today I will correctly identify assumption question stems in under 20 seconds." Specific intentions outperform vague effort.' },
      { order: 3, name: 'Ready State', duration: '30 sec', type: 'physical', instruction: 'Feet flat, posture upright. One breath. Begin.' },
    ],
  }
  return {
    name: 'The Balance Protocol', duration: '4 minutes',
    rationale: 'Your profile shows both anxiety and knowledge components. This protocol regulates your nervous system while priming focused content retrieval.',
    steps: [
      { order: 1, name: 'Box Breathing', duration: '90 sec', type: 'breathing', instruction: 'Inhale 4, hold 4, exhale 4, hold 4. Four complete cycles.' },
      { order: 2, name: 'Strength Recall', duration: '60 sec', type: 'visualization', instruction: 'Name your strongest question type. Spend 60 seconds recalling how it feels to move through those questions with confidence. Primes the cognitive state for weaker types.' },
      { order: 3, name: 'Specific Intent', duration: '60 sec', type: 'cbt', instruction: 'State today\'s single technical goal. One sentence. Make it measurable.' },
      { order: 4, name: 'Ready State', duration: '30 sec', type: 'physical', instruction: 'Posture, breath, begin.' },
    ],
  }
}

export function projectImprovement(attributions: CauseAttribution[]): number {
  let recoverable = 0
  attributions.forEach(a => {
    if (a.primaryCause === 'anxiety') recoverable += a.delta * 0.7
    else if (a.primaryCause === 'knowledge') recoverable += (100 - a.untimedAccuracy) * 0.3 * 0.5
    else recoverable += a.delta * 0.7 * 0.6
  })
  return Math.min(Math.round(recoverable / attributions.length), 22)
}

export function runDiagnostic(studentName: string, scores: ScoreEntry[], gad7: GAD7Response): DiagnosticResult {
  const gad7Total = calculateGAD7(gad7)
  const { severity: gad7Severity, profile: anxietyProfile } = classifyGAD7(gad7Total)
  const attributions = scores.map(s => computeCauseAttribution(s, anxietyProfile))
  const { track, rationale: trackRationale } = assignTrack(attributions, anxietyProfile)
  const interventions = selectInterventions(track)
  const lockerRoomProtocol = assignLockerRoomProtocol(track, gad7Total)
  const projectedImprovement = projectImprovement(attributions)
  const totalTimedCorrect = scores.reduce((s, e) => s + e.timedCorrect, 0)
  const totalTimedQ = scores.reduce((s, e) => s + e.timedTotal, 0)
  const totalUntimedCorrect = scores.reduce((s, e) => s + e.untimedCorrect, 0)
  const totalUntimedQ = scores.reduce((s, e) => s + e.untimedTotal, 0)
  const overallTimedScore = Math.round((totalTimedCorrect / totalTimedQ) * 100)
  const overallUntimedScore = Math.round((totalUntimedCorrect / totalUntimedQ) * 100)
  const primaryWeakness = attributions
    .filter(a => a.severity === 'critical' || a.severity === 'moderate')
    .sort((a, b) => b.delta - a.delta)[0]?.questionType ?? attributions[0].questionType
  return {
    studentName, date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    overallTimedScore, overallUntimedScore, overallDelta: overallUntimedScore - overallTimedScore,
    gad7Total, gad7Severity, anxietyProfile, attributions, track, trackRationale,
    primaryWeakness, interventions, lockerRoomProtocol, projectedImprovement,
  }
}

export function analyzeSessionLogs(logs: SessionLog[]): SessionAnalysis {
  if (logs.length === 0) return {
    avgAnxiety: 0, avgConfidence: 0, avgScore: 0, trend: 'stable',
    anxietyScoreCorrelation: 'No data yet', bestProtocol: 'No data yet',
    totalSessions: 0, scoreImprovement: 0,
  }
  const avgAnxiety = Math.round(logs.reduce((s, l) => s + l.anxiety_rating, 0) / logs.length * 10) / 10
  const avgConfidence = Math.round(logs.reduce((s, l) => s + l.confidence_rating, 0) / logs.length * 10) / 10
  const avgScore = Math.round(logs.reduce((s, l) => s + l.practice_score, 0) / logs.length)
  const mid = Math.floor(logs.length / 2)
  const first = logs.slice(0, mid).reduce((s, l) => s + l.practice_score, 0) / Math.max(mid, 1)
  const second = logs.slice(mid).reduce((s, l) => s + l.practice_score, 0) / Math.max(logs.length - mid, 1)
  const trend = second > first + 2 ? 'improving' : second < first - 2 ? 'declining' : 'stable'
  const scoreImprovement = logs.length >= 2 ? Math.round(logs[logs.length - 1].practice_score - logs[0].practice_score) : 0
  const highAnx = logs.filter(l => l.anxiety_rating >= 7)
  const lowAnx = logs.filter(l => l.anxiety_rating <= 3)
  let anxietyScoreCorrelation = 'Need more sessions for correlation analysis'
  if (highAnx.length >= 2 && lowAnx.length >= 2) {
    const diff = Math.round(
      lowAnx.reduce((s, l) => s + l.practice_score, 0) / lowAnx.length -
      highAnx.reduce((s, l) => s + l.practice_score, 0) / highAnx.length
    )
    anxietyScoreCorrelation = diff > 0
      ? `Your score is ${diff} points higher on low-anxiety days — a strong anxiety signal`
      : 'Anxiety level is not significantly predicting your score variation'
  }
  const protocolMap: Record<string, number[]> = {}
  logs.forEach(l => {
    if (!protocolMap[l.protocol_used]) protocolMap[l.protocol_used] = []
    protocolMap[l.protocol_used].push(l.practice_score)
  })
  let bestProtocol = 'Insufficient data'
  let bestAvg = 0
  Object.entries(protocolMap).forEach(([p, scores]) => {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length
    if (avg > bestAvg && scores.length >= 2) { bestAvg = avg; bestProtocol = p }
  })
  return { avgAnxiety, avgConfidence, avgScore, trend, anxietyScoreCorrelation, bestProtocol, totalSessions: logs.length, scoreImprovement }
}
