// app/auth/callback/route.ts - 카카오 OAuth 콜백 처리

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  console.log('[callback] code present:', !!code)

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            console.log('[callback] setAll called with', cookiesToSet.map(c => c.name))
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[callback] exchangeCodeForSession error:', exchangeError?.message || 'none')
    console.log('[callback] cookies after exchange:', cookieStore.getAll().map(c => c.name))

    // 로그인 후 프로필 확인
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[callback] user:', user?.id || 'none')
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_profile_complete')
        .eq('id', user.id)
        .single()

      if (!profile?.is_profile_complete) {
        const res = NextResponse.redirect(new URL('/auth/profile', request.url))
        console.log('[callback] redirecting to /auth/profile, set-cookie header present:', res.headers.has('set-cookie'))
        return res
      }

      // 관리자 여부 확인
      const { data: admin } = await supabase
        .from('admins')
        .select('role')
        .eq('id', user.id)
        .single()

      if (admin?.role === 'master') {
        return NextResponse.redirect(new URL('/admin/master', request.url))
      }
      if (admin?.role === 'branch') {
        return NextResponse.redirect(new URL('/admin/branch', request.url))
      }
    }
  }

  const finalRes = NextResponse.redirect(new URL('/pickup', request.url))
  console.log('[callback] final redirect to /pickup, set-cookie header present:', finalRes.headers.has('set-cookie'))
  return finalRes
}
