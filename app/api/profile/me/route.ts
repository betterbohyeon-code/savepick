// app/api/profile/me/route.ts
// 🔴 로그인한 본인의 프로필 조회 - 전화번호를 복호화해서 반환

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { decryptPhone } from '@/lib/crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ data: null }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ data: null })
  }

  let phone = profile.phone
  if (phone) {
    try {
      phone = decryptPhone(phone)
    } catch {
      // 복호화 실패 시 원본 그대로 두지 않고 빈 값 처리 (안전)
      phone = ''
    }
  }

  return NextResponse.json({ data: { ...profile, phone } })
}
