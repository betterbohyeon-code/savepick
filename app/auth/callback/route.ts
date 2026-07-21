// app/auth/callback/route.ts - 카카오 OAuth 콜백 처리

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name, value, options) { cookieStore.set({ name, value, ...options }) },
          remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)

    // 로그인 후 프로필 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_profile_complete')
        .eq('id', user.id)
        .single()

      if (!profile?.is_profile_complete) {
        return NextResponse.redirect(new URL('/auth/profile', request.url))
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

  return NextResponse.redirect(new URL('/pickup', request.url))
}
