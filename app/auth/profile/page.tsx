'use client'
// app/auth/profile/page.tsx
// 카카오 로그인 후 최초 1회 이름·전화번호 수집 + 개인정보 동의

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { encryptPhone, hashPhone } from '@/lib/crypto'

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeService, setAgreeService] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '')
    if (d.length <= 3) return d
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (name.trim().length < 2) e.name = '이름을 2자 이상 입력해주세요'
    if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(phone)) e.phone = '올바른 전화번호를 입력해주세요'
    if (!agreePrivacy) e.privacy = '개인정보 수집 및 이용에 동의해주세요'
    if (!agreeService) e.service = '서비스 이용약관에 동의해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // 🔴 전화번호 암호화 저장
    const encryptedPhone = encryptPhone(phone.trim())
    const phoneHash = hashPhone(phone.trim()) // 검색용 해시

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        name: name.trim(),
        phone: encryptedPhone,       // 암호화된 전화번호 저장
        phone_hash: phoneHash,        // 조회용 해시
        is_profile_complete: true,
        privacy_agreed_at: new Date().toISOString(),
        service_agreed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (error) {
      // 전화번호 중복 확인
      if (error.code === '23505') {
        setErrors({ phone: '이미 등록된 전화번호입니다.' })
      } else {
        alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
      setLoading(false)
      return
    }

    const store = searchParams.get('store') || 'hwajung'
    router.push(`/pickup?store=${store}`)
  }

  const allAgreed = agreePrivacy && agreeService
  const isValid = name.trim().length >= 2 && phone.length >= 12 && allAgreed

  return (
    <div className="min-h-screen bg-orange-500 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        <h1 className="text-5xl font-bold text-white tracking-tight mb-2">SAVE PICK</h1>
        <p className="text-white/70 text-base">세이브존 픽업 서비스</p>
      </div>

      <div className="bg-white rounded-t-3xl px-6 pt-7 pb-10">
        {/* 진행 단계 */}
        <div className="flex items-center gap-2 mb-7">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <div className="flex-1 h-0.5 bg-orange-500" />
          <div className="w-2 h-2 rounded-full bg-gray-200" />
        </div>

        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">👤</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">정보를 입력해주세요</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            매장 방문 시 신청 확인에 사용됩니다<br />최초 1회만 입력하면 됩니다
          </p>
        </div>

        {/* 카카오 연동 표시 */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 mb-5">
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded">카카오</span>
          <span className="text-sm text-gray-500">카카오 로그인 완료</span>
        </div>

        {/* 이름 */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-900 mb-2">
            이름 <span className="text-orange-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="실명을 입력해주세요"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-orange-500"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
          <p className="text-xs text-gray-400 mt-1.5">매장 직원이 확인하는 이름입니다</p>
        </div>

        {/* 전화번호 */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-gray-900 mb-2">
            전화번호 <span className="text-orange-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="w-20 px-3 py-3.5 border border-gray-200 rounded-xl text-center text-sm text-gray-500 bg-gray-50">+82</div>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              placeholder="010-0000-0000"
              maxLength={13}
              className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-orange-500"
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone}</p>}
          <p className="text-xs text-gray-400 mt-1.5">픽업 확인 및 연락에 사용됩니다</p>
        </div>

        {/* 🔴 개인정보 동의 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
          <p className="text-xs font-bold text-gray-700 mb-3">약관 동의</p>

          {/* 전체 동의 */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => { setAgreePrivacy(!allAgreed); setAgreeService(!allAgreed) }}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${allAgreed ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}
            >
              {allAgreed && <span className="text-white text-xs">✓</span>}
            </div>
            <span className="text-sm font-bold text-gray-900">전체 동의</span>
          </label>

          <div className="border-t border-gray-200 pt-3 space-y-3">
            {/* 개인정보 동의 */}
            <div className="flex items-start gap-3">
              <div
                onClick={() => setAgreePrivacy(!agreePrivacy)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-colors ${agreePrivacy ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}
              >
                {agreePrivacy && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <span className="text-orange-500 font-bold">[필수]</span> 개인정보 수집 및 이용 동의
                </p>
                <p className="text-xs text-gray-400 mt-0.5">이름, 전화번호 수집 · 픽업 서비스 제공 목적 · 서비스 종료 시 삭제</p>
                <button
                  onClick={() => window.open('/privacy', '_blank')}
                  className="text-xs text-orange-500 underline mt-1"
                >
                  개인정보 처리방침 보기
                </button>
              </div>
            </div>

            {/* 서비스 이용약관 */}
            <div className="flex items-start gap-3">
              <div
                onClick={() => setAgreeService(!agreeService)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-colors ${agreeService ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}
              >
                {agreeService && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <span className="text-orange-500 font-bold">[필수]</span> 서비스 이용약관 동의
                </p>
                <p className="text-xs text-gray-400 mt-0.5">노쇼 3회 누적 시 90일 이용 제한 정책 포함</p>
              </div>
            </div>
          </div>

          {errors.privacy && <p className="text-red-500 text-xs">{errors.privacy}</p>}
          {errors.service && <p className="text-red-500 text-xs">{errors.service}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !isValid}
          className="w-full py-4 bg-orange-500 text-white font-bold text-lg rounded-2xl disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        >
          {loading ? '저장 중...' : '세이브픽 시작하기'}
        </button>
      </div>
    </div>
  )
}
