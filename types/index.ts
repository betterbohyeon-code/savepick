// types/index.ts

export type UserRole = 'customer' | 'branch' | 'master'

export type ApplicationStatus = 'pending' | 'confirmed' | 'picked_up' | 'no_show' | 'cancelled'

export type RoundStatus = 'draft' | 'open' | 'closed' | 'completed'

// 이름 마스킹 유틸 (지점 어드민용)
export function maskName(name: string): string {
  if (!name || name.length <= 1) return name
  if (name.length === 2) return name[0] + '*'
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

// 전화번호 마스킹 (지점 어드민용)
export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3}-\d{4}-)(\d{4})/, '$1****')
}

export interface Branch {
  id: string
  name: string
  code: string
  kakao_channel_id: string | null
  address: string | null
  phone: string | null
  is_active: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  kakao_id: string | null
  name: string | null
  phone: string | null
  is_profile_complete: boolean
  penalty_count: number
  is_banned: boolean
  banned_until: string | null
  created_at: string
}

export interface Admin {
  id: string
  email: string
  role: 'master' | 'branch'
  branch_id: string | null
  branch?: Branch
  name: string | null
  is_active: boolean
}

export interface PickupRound {
  id: string
  branch_id: string
  branch?: Branch
  round_name: string
  round_number: number
  pickup_date: string
  pickup_start_time: string
  pickup_end_time: string
  apply_start_at: string
  apply_end_at: string
  status: RoundStatus
  created_at: string
}

export interface Product {
  id: string
  branch_id: string | null  // null = 공통 상품
  branch?: Branch
  round_id: string | null
  round?: PickupRound
  name: string
  description: string | null
  image_url: string | null
  original_price: number
  sale_price: number
  discount_rate: number
  total_quantity: number
  remaining_quantity: number
  max_per_user: number
  is_active: boolean
  created_at: string
}

export interface PickupApplication {
  id: string
  user_id: string
  user?: UserProfile
  product_id: string
  product?: Product
  round_id: string
  round?: PickupRound
  branch_id: string
  branch?: Branch
  quantity: number
  status: ApplicationStatus
  // pickup_code 제거 - 전화번호 조회 방식으로 변경
  applied_at: string
  confirmed_at: string | null
  picked_up_at: string | null
  no_show_at: string | null
}

// API Response 타입
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// 대시보드 통계 타입
export interface BranchStats {
  branch_id: string
  branch_name: string
  total_products: number
  total_applications: number
  confirmed: number
  picked_up: number
  no_show: number
  no_show_rate: number
}

export interface MasterDashboard {
  total_applications: number
  total_picked_up: number
  total_no_show: number
  branches: BranchStats[]
}
