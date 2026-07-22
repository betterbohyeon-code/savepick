// app/api/admin/applications/route.ts
// 🔴 어드민 신청 목록 조회 - Service Role로 우회 (JOIN + RLS 조합 이슈 회피)

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

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
    .select(`
      *,
      user:user_profiles(name, phone),
      product:products(name, image_url),
      round:pickup_rounds(round_name, pickup_date)
    `)
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

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
