// middleware.ts
// 🔴 Rate Limiting + 어드민 서버사이드 인증

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Rate Limiting (메모리 기반 · Edge 호환) ──
const rateMap = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)

  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + windowMs })
    return true // 허용
  }

  if (entry.count >= limit) return false // 차단

  entry.count++
  return true // 허용
}

// ── 어드민 역할 확인 ──
async function getAdminRole(supabase: any, userId: string) {
  const { data } = await supabase
    .from('admins')
    .select('role, branch_id')
    .eq('id', userId)
    .single()
  return data
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const pathname = req.nextUrl.pathname

  // ── 1. Rate Limiting ──
  // 전화번호 조회 API: 분당 20회
  if (pathname.startsWith('/api/admin/scan') || pathname.startsWith('/api/pickup')) {
    if (!rateLimit(ip, 20, 60_000)) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }
  }

  // 로그인 시도: 분당 10회
  if (pathname.startsWith('/auth/login') && req.method === 'POST') {
    if (!rateLimit(ip + ':login', 10, 60_000)) {
      return NextResponse.json(
        { error: '로그인 시도가 너무 많습니다. 1분 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }
  }

  // ── 2. 어드민 서버사이드 인증 ──
  if (pathname.startsWith('/admin')) {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    // 로그인 안 됨 → 로그인 페이지로
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    const admin = await getAdminRole(supabase, session.user.id)

    // 어드민 계정 아님
    if (!admin) {
      return NextResponse.redirect(new URL('/auth/login?error=unauthorized', req.url))
    }

    // 마스터 전용 페이지에 지점 어드민 접근 차단
    if (pathname.startsWith('/admin/master') && admin.role !== 'master') {
      return NextResponse.redirect(new URL('/admin/branch', req.url))
    }

    // 지점 어드민 페이지 접근 시 branch_id 헤더 추가
    if (admin.role === 'branch' && admin.branch_id) {
      res.headers.set('x-branch-id', admin.branch_id)
    }
    res.headers.set('x-admin-role', admin.role)
  }

  // ── 3. 고객 픽업 페이지 인증 ──
  if (pathname.startsWith('/pickup') && !pathname.startsWith('/pickup/public')) {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const store = req.nextUrl.searchParams.get('store') || 'hwajung'
      return NextResponse.redirect(new URL(`/auth/login?store=${store}`, req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/pickup/:path*',
    '/api/admin/:path*',
    '/api/pickup/:path*',
    '/auth/login',
  ],
}
