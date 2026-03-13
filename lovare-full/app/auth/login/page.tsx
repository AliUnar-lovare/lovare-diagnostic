'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles').select('role, status').eq('id', data.user.id).single()

    if (profile?.role === 'admin') router.push('/admin')
    else if (profile?.role === 'coach') router.push('/coach')
    else if (profile?.status === 'pending') router.push('/auth/pending')
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Lovare Institut</p>
          <h1 className="font-cormorant" style={{ fontSize: 40, fontWeight: 300, color: 'var(--cream)' }}>Welcome back</h1>
        </div>

        <div className="lovare-card p-8 space-y-5">
          <div>
            <label className="text-xs tracking-wider uppercase mb-2 block" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat', fontSize: 14 }}
              placeholder="your@email.com" />
          </div>
          <div>
            <label className="text-xs tracking-wider uppercase mb-2 block" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,152,63,0.3)', color: 'var(--cream)', fontFamily: 'Montserrat', fontSize: 14 }}
              placeholder="••••••••" />
          </div>

          {error && <p className="text-xs" style={{ color: '#E05252' }}>{error}</p>}

          <button className="btn-gold w-full" onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center pt-2">
            <Link href="/auth/signup" className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Montserrat' }}>
              Request access → <span style={{ color: 'var(--gold-light)' }}>Sign up</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
