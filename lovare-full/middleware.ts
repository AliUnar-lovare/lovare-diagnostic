import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — no auth needed
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/verify', '/auth/reset-password']
  if (publicRoutes.includes(pathname)) {
    return await updateSession(request)
  }

  // Refresh session
  let response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Get user profile for role/status checks
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  // Student pending approval — redirect to pending page
  if (profile?.role === 'student' && profile?.status === 'pending' && pathname !== '/auth/pending') {
    return NextResponse.redirect(new URL('/auth/pending', request.url))
  }

  // Admin routes — only admins
  if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Coach routes — admins and coaches only
  if (pathname.startsWith('/coach') && !['admin', 'coach'].includes(profile?.role ?? '')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
