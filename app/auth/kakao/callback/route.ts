// app/auth/kakao/callback/route.ts
// 🔴 카카오 인가 코드 -> (지점 앱으로) 토큰 교환 -> 사용자 조회/생성 -> Supabase 로그인 링크 발급

import { NextResponse } from 'next/server'
import { getKakaoBranch, getKakaoClientSecret } from '@/lib/kakao-branches'
import { createServiceClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const store = requestUrl.searchParams.get('state') || ''
  const branch = getKakaoBranch(store)
  const redirectUri = `${requestUrl.origin}/auth/kakao/callback`

  if (!code) {
    return NextResponse.redirect(new URL(`/auth/login?store=${branch.code}&error=kakao_denied`, request.url))
  }

  try {
    // 1. 인가 코드 -> 액세스 토큰 (해당 지점 앱의 client_id/secret 사용)
    const clientSecret = getKakaoClientSecret(branch.code)
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: branch.restApiKey,
      redirect_uri: redirectUri,
      code,
    })
    if (clientSecret) tokenParams.set('client_secret', clientSecret)

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[kakao/callback] token error:', JSON.stringify(tokenData))
      return NextResponse.redirect(new URL(`/auth/login?store=${branch.code}&error=kakao_token`, request.url))
    }

    // 2. 액세스 토큰으로 사용자 정보 조회
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const kakaoUser = await userRes.json()
    const kakaoId = String(kakaoUser.id)
    const email = kakaoUser.kakao_account?.email as string | undefined

    if (!kakaoId || !email) {
      console.error('[kakao/callback] missing id/email:', JSON.stringify(kakaoUser))
      return NextResponse.redirect(new URL(`/auth/login?store=${branch.code}&error=kakao_profile`, request.url))
    }

    // 지점별로 독립된 계정이 되도록 지점코드+카카오ID를 합쳐서 식별
    const compositeKakaoId = `${branch.code}_${kakaoId}`
    const supabaseAdmin = createServiceClient()

    // 3. 기존 사용자 조회 (user_profiles.kakao_id 기준)
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('kakao_id', compositeKakaoId)
      .maybeSingle()

    let userId: string
    let authEmail: string

    if (existingProfile) {
      userId = existingProfile.id
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      authEmail = existingUser.user?.email || `kakao.${compositeKakaoId}@savepick.internal`
    } else {
      // 지점+카카오ID로 스코프된 합성 이메일 (Supabase Auth 고유 식별자 용도)
      const syntheticEmail = `kakao.${compositeKakaoId}@savepick.internal`
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: syntheticEmail,
        email_confirm: true,
        user_metadata: { kakao_id: compositeKakaoId, branch: branch.code },
      })

      if (createError || !created.user) {
        console.error('[kakao/callback] createUser error:', JSON.stringify(createError))
        return NextResponse.redirect(new URL(`/auth/login?store=${branch.code}&error=account_create`, request.url))
      }

      userId = created.user.id
      authEmail = syntheticEmail

      await supabaseAdmin.from('user_profiles').insert({
        id: userId,
        kakao_id: compositeKakaoId,
        is_profile_complete: false,
      })
    }

    // 4. 매직링크 발급 (브라우저에서 verifyOtp로 세션 확정)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: authEmail,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('[kakao/callback] generateLink error:', JSON.stringify(linkError))
      return NextResponse.redirect(new URL(`/auth/login?store=${branch.code}&error=session`, request.url))
    }

    const verifyUrl = new URL('/auth/kakao/verify', request.url)
    verifyUrl.searchParams.set('token_hash', linkData.properties.hashed_token)
    verifyUrl.searchParams.set('store', branch.code)

    return NextResponse.redirect(verifyUrl)
  } catch (err) {
    console.error('[kakao/callback] unexpected error:', err instanceof Error ? err.message : String(err))
    return NextResponse.redirect(new URL(`/auth/login?store=${branch.code}&error=unknown`, request.url))
  }
}
