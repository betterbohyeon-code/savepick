// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 브라우저(클라이언트)용 - PKCE 플로우, 쿠키 기반 세션 저장
// (서버의 미들웨어/콜백 라우트에서도 같은 세션을 읽을 수 있도록 @supabase/ssr 사용)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// 서버 컴포넌트용 (Service Role Key - 관리자 전용)
export const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
