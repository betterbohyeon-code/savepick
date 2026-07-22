// lib/pickup.ts
import { supabase } from './supabase'
import type { Product, PickupApplication, PickupRound } from '@/types'

// 활성 상품 목록 조회 (고객용)
export async function getActiveProducts(branchId?: string) {
  let query = supabase
    .from('products')
    .select(`
      *,
      branch:branches(id, name),
      round:pickup_rounds(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (branchId) {
    query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
  }

  const { data, error } = await query
  return { data: data as Product[], error }
}

// 픽업 신청
export async function applyPickup(params: {
  userId: string
  productId: string
  roundId: string
  branchId: string
  quantity: number
}) {
  // 1. 중복 신청 체크
  const { data: existing } = await supabase
    .from('pickup_applications')
    .select('id')
    .eq('user_id', params.userId)
    .eq('product_id', params.productId)
    .eq('round_id', params.roundId)
    .not('status', 'eq', 'cancelled')
    .single()

  if (existing) {
    return { data: null, error: '이미 신청한 상품입니다.' }
  }

  // 2. 재고 확인
  const { data: product } = await supabase
    .from('products')
    .select('remaining_quantity, max_per_user')
    .eq('id', params.productId)
    .single()

  if (!product || product.remaining_quantity < params.quantity) {
    return { data: null, error: '재고가 부족합니다.' }
  }

  if (params.quantity > product.max_per_user) {
    return { data: null, error: `1인당 최대 ${product.max_per_user}개까지 신청 가능합니다.` }
  }

  // 3. 신청 생성
  const { data, error } = await supabase
    .from('pickup_applications')
    .insert({
      user_id: params.userId,
      product_id: params.productId,
      round_id: params.roundId,
      branch_id: params.branchId,
      quantity: params.quantity,
      status: 'confirmed',
    })
    .select(`
      *,
      product:products(*),
      branch:branches(name)
    `)
    .single()

  return { data, error: error?.message || null }
}

// 내 픽업 신청 목록
export async function getMyApplications(userId: string) {
  const { data, error } = await supabase
    .from('pickup_applications')
    .select(`
      *,
      product:products(name, image_url, original_price, sale_price),
      branch:branches(name),
      round:pickup_rounds(pickup_date, pickup_start_time, pickup_end_time)
    `)
    .eq('user_id', userId)
    .order('applied_at', { ascending: false })

  return { data: data as PickupApplication[], error }
}


// 관리자: 지점별 신청 목록
export async function getBranchApplications(branchId: string, roundId?: string) {
  let query = supabase
    .from('pickup_applications')
    .select(`
      *,
      user:user_profiles(name, phone),
      product:products(name, image_url),
      round:pickup_rounds(round_name, pickup_date)
    `)
    .eq('branch_id', branchId)
    .order('applied_at', { ascending: false })

  if (roundId) {
    query = query.eq('round_id', roundId)
  }

  const { data, error } = await query
  return { data, error }
}

// 관리자: 픽업 완료 처리
export async function markPickedUp(applicationId: string) {
  const { data, error } = await supabase
    .from('pickup_applications')
    .update({
      status: 'picked_up',
      picked_up_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select()
    .single()

  return { data, error }
}

// 관리자: 노쇼 처리
export async function markNoShow(applicationId: string) {
  const { data, error } = await supabase
    .from('pickup_applications')
    .update({
      status: 'no_show',
      no_show_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select()
    .single()

  return { data, error }
}

// 마스터: 전체 현황 통계
export async function getMasterStats() {
  const { data, error } = await supabase
    .rpc('get_master_dashboard_stats')

  return { data, error }
}

// 상품 등록 (어드민)
export async function createProduct(product: {
  branch_id?: string
  round_id?: string
  name: string
  description?: string
  image_url?: string
  original_price: number
  sale_price: number
  total_quantity: number
  max_per_user?: number
  created_by: string
}) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...product,
      remaining_quantity: product.total_quantity,
    })
    .select()
    .single()

  return { data, error }
}

// 상품 수정
export async function updateProduct(productId: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .select()
    .single()

  return { data, error }
}

// ──────────────────────────────────────────────
// 전화번호로 신청자 조회 (픽업코드 대신 사용)
// ──────────────────────────────────────────────
export async function findApplicationByPhone(
  phone: string,
  branchId: string,
  roundId: string
) {
  // user_profiles에서 해당 전화번호 유저 먼저 조회
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('id, name, phone')
    .eq('phone', phone)
    .single()

  if (!userProfile) {
    return { data: null, error: '해당 전화번호로 가입된 회원을 찾을 수 없습니다.' }
  }

  const { data, error } = await supabase
    .from('pickup_applications')
    .select(`
      *,
      user:user_profiles(id, name, phone),
      product:products(name, image_url, sale_price),
      round:pickup_rounds(pickup_date, pickup_start_time, pickup_end_time)
    `)
    .eq('user_id', userProfile.id)
    .eq('branch_id', branchId)
    .eq('round_id', roundId)
    .not('status', 'eq', 'cancelled')
    .order('applied_at', { ascending: true })

  return { data, error: error?.message || null, userProfile }
}

// 패널티 관리 (마스터/지점 어드민)
export async function updateUserPenalty(
  userId: string,
  penalty_count: number,
  is_banned: boolean
) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      penalty_count,
      is_banned,
      banned_until: is_banned ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

// ──────────────────────────────────────
// 🟠 취소 마감 시간 정책
// ──────────────────────────────────────
// 픽업 당일 D-day 오전 9시 이후 취소 불가
export function isCancellable(pickupDate: string): { ok: boolean; reason?: string } {
  const now = new Date()
  const pickup = new Date(pickupDate)

  // 픽업 당일 09:00 기준으로 마감
  const deadline = new Date(pickup)
  deadline.setHours(9, 0, 0, 0)

  if (now >= deadline) {
    return {
      ok: false,
      reason: '픽업 당일 오전 9시 이후에는 취소가 불가합니다.',
    }
  }
  return { ok: true }
}

// 신청 취소 (마감 시간 체크 포함)
export async function cancelApplication(appId: string, pickupDate: string) {
  const { ok, reason } = isCancellable(pickupDate)
  if (!ok) return { error: reason }

  const { data, error } = await supabase
    .from('pickup_applications')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appId)
    .eq('status', 'confirmed') // 대기 상태만 취소 가능
    .select()
    .single()

  return { data, error: error?.message }
}

// 🟠 완료/노쇼 처리 되돌리기 (당일 픽업 시간 이내만 가능)
export async function revertApplication(appId: string) {
  const { data, error } = await supabase
    .from('pickup_applications')
    .update({
      status: 'confirmed',
      picked_up_at: null,
      no_show_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appId)
    .in('status', ['picked_up', 'no_show'])
    .select()
    .single()

  return { data, error: error?.message }
}

