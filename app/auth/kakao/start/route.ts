// app/auth/kakao/start/route.ts
// 🔴 지점별 카카오 로그인 시작 — store에 맞는 카카오 앱으로 인가 요청

import { NextResponse } from 'next/server'
import { getKakaoBranch } from '@/lib/kakao-branches'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const store = requestUrl.searchParams.get('store')
  const branch = getKakaoBranch(store)

  const redirectUri = `${requestUrl.origin}/auth/kakao/callback`

  const authorizeUrl = new URL('https://kauth.kakao.com/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', branch.restApiKey)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'profile_nickname account_email')
  authorizeUrl.searchParams.set('state', branch.code)

  return NextResponse.redirect(authorizeUrl.toString())
}
