'use client'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full"
          style={{ border: '2px solid rgba(184,152,63,0.4)', background: 'rgba(184,152,63,0.06)' }}>
          <span style={{ fontSize: 24, color: 'var(--gold)' }}>⏳</span>
        </div>
        <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)', fontFamily: 'Montserrat' }}>Lovare Institut</p>
        <h2 className="font-cormorant mb-4" style={{ fontSize: 36, fontWeight: 300, color: 'var(--cream)' }}>Pending approval</h2>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(245,240,232,0.6)', fontWeight: 300 }}>
          Your account is awaiting manual approval. You'll receive an email notification when access is granted — typically within 24 hours.
        </p>
        <button onClick={handleSignOut} className="btn-outline text-xs py-2 px-6">Sign out</button>
      </div>
    </div>
  )
}
