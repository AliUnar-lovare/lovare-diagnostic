'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const FOCUS_OPTIONS = [
  'AI Governance Law', 'Cybersecurity Law', 'National Security Law',
  'Technology Law', 'General Practice', 'Not sure yet',
]

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', targetSchool: '', intendedFocus: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSignup() {
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.fullName } },
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').update({
        full_name: form.fullName,
        target_law_school: form.targetSchool,
        intended_focus: form.intendedFocus,
      }).eq('id', data.user.id)
    }
    setDone(true); setLoading(false)
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full" style={{ border: '2px solid var(--gold)', background: 'rgba(184,152,63,0.1)' }}>
          <span className="font-cormorant" style={{ fontSize: 28, color: 'var(--gold-light)' }}>✓</span>
        </div>
        <h2 className="font-cormorant mb-4" style={{ fontSize: 36, fontWeight: 300, color: 'var(--cream)' }}>Application submitted</h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(245,240,232,0.6)', fontWeight: 300 }}>
          Your account is pending approval. You'll receive an email when access is granted — typically within 24 hours.
        </p>
        <Link href="/auth/login" className="btn-outline text-xs py-2 px-6">Back to login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Lovare Institut</p>
          <h1 className="font-cormorant" style={{ fontSize: 38, fontWeight: 300, color: 'var(--cream)' }}>Request access</h1>
          <p className="text-xs mt-2" style={{ color: 'var(--muted)', fontWeight: 300 }}>All accounts are manually approved</p>
        </div>

        <div className="lovare-card p-8 space-y-5">
          {step === 1 && <>
            <div>
              <label className="text-xs tracking-wider uppercase mb-2 block" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Full Name</label>
              <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="w-full px-4 py-3 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat', fontSize: 14 }} />
            </div>
            <div>
              <label className="text-xs tracking-wider uppercase mb-2 block" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat', fontSize: 14 }} />
            </div>
            <div>
              <label className="text-xs tracking-wider uppercase mb-2 block" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-3 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat', fontSize: 14 }} />
            </div>
            <button className="btn-gold w-full" onClick={() => setStep(2)}>Continue →</button>
          </>}

          {step === 2 && <>
            <div>
              <label className="text-xs tracking-wider uppercase mb-2 block" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Target Law School (optional)</label>
              <input type="text" value={form.targetSchool} onChange={e => setForm(f => ({ ...f, targetSchool: e.target.value }))}
                placeholder="e.g. Georgetown Law, Yale Law"
                className="w-full px-4 py-3 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat', fontSize: 14 }} />
            </div>
            <div>
              <label className="text-xs tracking-wider uppercase mb-3 block" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Intended Legal Focus</label>
              <div className="grid grid-cols-2 gap-2">
                {FOCUS_OPTIONS.map(f => (
                  <button key={f} onClick={() => setForm(prev => ({ ...prev, intendedFocus: f }))}
                    className="py-2 px-3 text-xs text-left transition-all"
                    style={{
                      background: form.intendedFocus === f ? 'rgba(184,152,63,0.15)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${form.intendedFocus === f ? 'var(--gold)' : 'rgba(184,152,63,0.15)'}`,
                      color: form.intendedFocus === f ? 'var(--gold-light)' : 'var(--muted)',
                      fontFamily: 'Montserrat', fontWeight: form.intendedFocus === f ? 500 : 300, cursor: 'pointer',
                    }}>{f}</button>
                ))}
              </div>
            </div>
            {error && <p className="text-xs" style={{ color: '#E05252' }}>{error}</p>}
            <div className="flex gap-4">
              <button className="btn-outline flex-1" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-gold flex-1" onClick={handleSignup} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </>}

          <div className="text-center pt-2">
            <Link href="/auth/login" className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>
              Already have access? <span style={{ color: 'var(--gold-light)' }}>Sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
