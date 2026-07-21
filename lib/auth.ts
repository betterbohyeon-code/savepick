// lib/auth.ts
import { supabase } from './supabase'
import type { UserProfile, Admin } from '@/types'

// 카카오 로그인
export async function signInWithKakao() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'profile_nickname profile_image account_email phone_number',
    },
  })
  return { data, error }
}

// 로그아웃
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// 현재 세션
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// 사용자 프로필 조회
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

// 프로필 생성/업데이트 (최초 1회)
export async function upsertUserProfile(userId: string, profile: {
  name: string
  phone: string
  kakao_id?: string
}) {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      ...profile,
      is_profile_complete: true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  return { data, error }
}

// 관리자 권한 조회
export async function getAdminInfo(userId: string): Promise<Admin | null> {
  const { data } = await supabase
    .from('admins')
    .select('*, branch:branches(*)')
    .eq('id', userId)
    .eq('is_active', true)
    .single()
  return data
}

// 패널티 상태 확인
export async function checkUserBanStatus(userId: string) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_banned, banned_until, penalty_count')
    .eq('id', userId)
    .single()

  if (!profile) return { isBanned: false, penaltyCount: 0 }

  // 밴 기간 만료 체크
  if (profile.is_banned && profile.banned_until) {
    const banExpired = new Date(profile.banned_until) < new Date()
    if (banExpired) {
      // 밴 해제
      await supabase
        .from('user_profiles')
        .update({ is_banned: false, banned_until: null })
        .eq('id', userId)
      return { isBanned: false, penaltyCount: profile.penalty_count }
    }
  }

  return {
    isBanned: profile.is_banned,
    bannedUntil: profile.banned_until,
    penaltyCount: profile.penalty_count,
  }
}
