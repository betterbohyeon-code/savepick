// middleware.ts
// 🔴 Rate Limiting + 어드민 서버사이드 인증

import { createServerClient } from '@supabase/ssr'
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
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const pathname = req.nextUrl.pathname

  // ── 1. Rate Limiting ──
  if (pathname.startsWith('/api/admin/scan') || pathname.startsWith('/api/pickup')) {
    if (!rateLimit(ip, 20, 60_000)) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }
  }

  if (pathname.startsWith('/auth/login') && req.method === 'POST') {
    if (!rateLimit(ip + ':login', 10, 60_000)) {
      return NextResponse.json(
        { error: '로그인 시도가 너무 많습니다. 1분 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }
  }

  const needsAuth =
    pathname.startsWith('/admin') ||
    (pathname.startsWith('/pickup') && !pathname.startsWith('/pickup/public'))

  if (!needsAuth) {
    return NextResponse.next()
  }

  // ── 2. Supabase 세션 클라이언트 (Edge 런타임 호환) ──
  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: { headers: req.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // ── 3. 어드민 서버사이드 인증 ──
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    const admin = await getAdminRole(supabase, session.user.id)

    if (!admin) {
      return NextResponse.redirect(new URL('/auth/login?error=unauthorized', req.url))
    }

    if (pathname.startsWith('/admin/master') && admin.role !== 'master') {
      return NextResponse.redirect(new URL('/admin/branch', req.url))
    }

    if (admin.role === 'branch' && admin.branch_id) {
      res.headers.set('x-branch-id', admin.branch_id)
    }
    res.headers.set('x-admin-role', admin.role)
  }

  // ── 4. 고객 픽업 페이지 인증 ──
  if (pathname.startsWith('/pickup') && !pathname.startsWith('/pickup/public')) {
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
