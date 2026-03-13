// ============================================================
// LOVARE DIAGNOSTIC ENGINE — Type Definitions
// ============================================================

export type UserRole = 'admin' | 'coach' | 'student'

export type StudentStatus = 'pending' | 'approved' | 'suspended'

export type InterventionTrack = 'anxiety-primary' | 'knowledge-primary' | 'mixed'

export type AnxietyProfile = 'high' | 'moderate' | 'low'

export type QuestionType =
  | 'Logical Reasoning'
  | 'Analytical Reasoning'
  | 'Reading Comprehension'

export type PrimaryCause = 'anxiety' | 'knowledge' | 'mixed'

export type Severity = 'critical' | 'moderate' | 'mild' | 'strong'

export type ProtocolType = 'breathing' | 'cbt' | 'visualization' | 'physical'

// ============================================================
// DATABASE MODELS (mirror Supabase tables)
// ============================================================

export interface Profile {
  id: string                    // = auth.users.id
  email: string
  full_name: string
  role: UserRole
  status: StudentStatus         // only relevant for students
  assigned_coach_id: string | null
  target_law_school?: string
  intended_focus?: string       // e.g. "AI governance law"
  created_at: string
  approved_at: string | null
  approved_by: string | null
  notes?: string                // coach notes
}

export interface DiagnosticRun {
  id: string
  student_id: string
  created_at: string
  // Scores
  lr_timed_correct: number
  lr_timed_total: number
  lr_untimed_correct: number
  lr_untimed_total: number
  ar_timed_correct: number
  ar_timed_total: number
  ar_untimed_correct: number
  ar_untimed_total: number
  rc_timed_correct: number
  rc_timed_total: number
  rc_untimed_correct: number
  rc_untimed_total: number
  // GAD-7
  gad7_q1: number; gad7_q2: number; gad7_q3: number; gad7_q4: number
  gad7_q5: number; gad7_q6: number; gad7_q7: number
  gad7_total: number
  // Results (computed, stored for history)
  overall_timed_score: number
  overall_untimed_score: number
  overall_delta: number
  anxiety_profile: AnxietyProfile
  gad7_severity: string
  track: InterventionTrack
  track_rationale: string
  projected_improvement: number
  // Attributions stored as JSON
  attributions: CauseAttribution[]
  interventions: Intervention[]
  locker_room_protocol: LockerRoomProtocol
}

export interface SessionLog {
  id: string
  student_id: string
  diagnostic_id: string | null
  created_at: string
  date_label: string
  anxiety_rating: number
  confidence_rating: number
  practice_score: number
  protocol_used: string
  notes: string | null
}

export interface CoachNote {
  id: string
  coach_id: string
  student_id: string
  created_at: string
  content: string
  is_private: boolean
}

// ============================================================
// COMPUTED / ENGINE TYPES
// ============================================================

export interface ScoreEntry {
  questionType: QuestionType
  timedCorrect: number
  timedTotal: number
  untimedCorrect: number
  untimedTotal: number
}

export interface GAD7Response {
  q1: number; q2: number; q3: number; q4: number
  q5: number; q6: number; q7: number
}

export interface CauseAttribution {
  questionType: QuestionType
  timedAccuracy: number
  untimedAccuracy: number
  delta: number
  anxietyScore: number
  knowledgeScore: number
  primaryCause: PrimaryCause
  severity: Severity
}

export interface Intervention {
  id: string
  title: string
  type: 'anxiety' | 'knowledge' | 'mixed'
  description: string
  duration: string
  frequency: string
  priority: 'high' | 'medium' | 'low'
}

export interface LockerRoomProtocol {
  name: string
  duration: string
  steps: LockerRoomStep[]
  rationale: string
}

export interface LockerRoomStep {
  order: number
  name: string
  duration: string
  instruction: string
  type: ProtocolType
}

export interface DiagnosticResult {
  studentName: string
  date: string
  overallTimedScore: number
  overallUntimedScore: number
  overallDelta: number
  gad7Total: number
  gad7Severity: string
  anxietyProfile: AnxietyProfile
  attributions: CauseAttribution[]
  track: InterventionTrack
  trackRationale: string
  primaryWeakness: QuestionType
  interventions: Intervention[]
  lockerRoomProtocol: LockerRoomProtocol
  projectedImprovement: number
}

export interface SessionAnalysis {
  avgAnxiety: number
  avgConfidence: number
  avgScore: number
  trend: 'improving' | 'declining' | 'stable'
  anxietyScoreCorrelation: string
  bestProtocol: string
  totalSessions: number
  scoreImprovement: number
}

// ============================================================
// ADMIN / AGGREGATE TYPES
// ============================================================

export interface CohortStats {
  totalStudents: number
  pendingApproval: number
  activeStudents: number
  totalDiagnostics: number
  totalSessions: number
  avgProjectedImprovement: number
  trackDistribution: Record<InterventionTrack, number>
  anxietyProfileDistribution: Record<AnxietyProfile, number>
  intendedFocusDistribution: Record<string, number>
}

export interface StudentSummary {
  profile: Profile
  latestDiagnostic: DiagnosticRun | null
  sessionCount: number
  latestScore: number | null
  trend: 'improving' | 'declining' | 'stable' | 'no-data'
  coachName: string | null
}
