// app/api/profile/route.ts
// 🔴 프로필 저장은 서버에서만 처리 (전화번호 암호화 키가 서버 전용이라 브라우저에서 직접 못 함)

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { encryptPhone, hashPhone } from '@/lib/crypto'

export async function POST(request: Request) {
  let body: { name?: string; phone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const name = (body.name || '').trim()
  const phone = (body.phone || '').trim()

  if (name.length < 2) {
    return NextResponse.json({ error: '이름을 2자 이상 입력해주세요' }, { status: 400 })
  }
  if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(phone)) {
    return NextResponse.json({ error: '올바른 전화번호를 입력해주세요' }, { status: 400 })
  }

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
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const encryptedPhone = encryptPhone(phone)
  const phoneHash = hashPhone(phone)

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      name,
      phone: encryptedPhone,
      phone_hash: phoneHash,
      is_profile_complete: true,
      privacy_agreed_at: new Date().toISOString(),
      service_agreed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('[api/profile] upsert error:', JSON.stringify(error))
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 등록된 전화번호입니다.' }, { status: 409 })
    }
    return NextResponse.json({ error: '저장 중 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
