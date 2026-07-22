// app/api/admin/applications/route.ts
// 🔴 어드민 신청 목록 조회 - Service Role로 우회 (JOIN + RLS 조합 이슈 회피)

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'
import { decryptPhone } from '@/lib/crypto'

function tryDecrypt(value: string): string {
  try {
    return decryptPhone(value)
  } catch {
    return '(복호화 실패)'
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const roundId = searchParams.get('round_id') || undefined

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

  const { data: admin } = await supabase
    .from('admins')
    .select('role, branch_id, is_active')
    .eq('id', user.id)
    .single()

  if (!admin || admin.is_active === false) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const service = createServiceClient()
  let query = service
    .from('pickup_applications')
    .select('*, product:products(name, image_url), round:pickup_rounds(round_name, pickup_date)')
    .order('applied_at', { ascending: false })

  if (admin.role === 'branch') {
    if (!admin.branch_id) {
      return NextResponse.json({ data: [] })
    }
    query = query.eq('branch_id', admin.branch_id)
  }
  // master는 전체 지점 조회 (추후 branch_id 쿼리파라미터로 필터 가능)

  if (roundId) {
    query = query.eq('round_id', roundId)
  }

  const { data: applications, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // user_profiles는 자동 관계 조인 대신 별도 조회 후 코드에서 병합
  // (스키마 캐시/관계 설정 이슈에 영향받지 않도록)
  const userIds = Array.from(new Set((applications || []).map((a: any) => a.user_id).filter(Boolean)))
  let usersById: Record<string, { name: string; phone: string }> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await service
      .from('user_profiles')
      .select('id, name, phone')
      .in('id', userIds)

    usersById = Object.fromEntries(
      (profiles || []).map((p: any) => [
        p.id,
        { name: p.name, phone: p.phone ? tryDecrypt(p.phone) : p.phone },
      ])
    )
  }

  const data = (applications || []).map((a: any) => ({
    ...a,
    user: usersById[a.user_id] || null,
  }))

  return NextResponse.json({ data })
}
