'use client'
// components/layout/CustomerDrawer.tsx
// 🔴 고객용 공통 드로어 메뉴 — 햄버거 아이콘이 있는 모든 화면에서 재사용

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface CustomerDrawerProps {
  open: boolean
  onClose: () => void
  name: string
  phone: string
  penaltyCount: number
  storeName: string
  store: string
}

export default function CustomerDrawer({ open, onClose, name, phone, penaltyCount, storeName, store }: CustomerDrawerProps) {
  const router = useRouter()
  const [policyOpen, setPolicyOpen] = useState(false)

  if (!open) return null

  const dots = [0, 1, 2].map(i => i < penaltyCount)

  return (
    <div className="fixed inset-0 z-40">
      <div onClick={onClose} className="absolute inset-0 bg-black/35" />
      <div className="absolute top-0 right-0 bottom-0 w-[80%] max-w-[340px] bg-surface shadow-2xl flex flex-col">
        {/* 헤더: 그라데이션 오렌지 + 이름/전화번호 + 노쇼 현황 */}
        <div
          className="px-5 pt-6 pb-5 flex flex-col gap-3.5"
          style={{ background: 'linear-gradient(150deg, var(--accent) 0%, oklch(0.58 0.17 30) 100%)' }}
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="text-white font-bold text-[16px]">{name}님</span>
              <span className="text-white/80 text-xs">{phone}</span>
            </div>
            <button onClick={onClose} className="w-[30px] h-[30px] rounded-lg bg-white/20 text-white flex items-center justify-center">✕</button>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 bg-white/[.18] rounded-xl">
            <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-white">
              노쇼 현황
              <span className="relative inline-flex">
                <button
                  onClick={() => setPolicyOpen(v => !v)}
                  className="w-4 h-4 rounded-full bg-white/40 text-white text-[10px] font-bold flex items-center justify-center"
                >i</button>
                {policyOpen && (
                  <div className="absolute top-[25px] left-[-10px] z-20 w-[216px] bg-white rounded-xl p-3 shadow-xl text-[11.5px] leading-relaxed text-ink">
                    <b className="text-accent">노쇼 정책</b><br />
                    픽업 신청 후 미방문 시 노쇼 1회가 쌓여요. <b>3회 누적 시 90일간</b> 픽업 신청이 제한됩니다. 방문이 어려우면 미리 취소해주세요.
                  </div>
                )}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="flex gap-1">
                {dots.map((filled, i) => (
                  <span key={i} className={`w-[9px] h-[9px] rounded-full ${filled ? 'bg-white' : 'bg-white/35'}`} />
                ))}
              </span>
              <span className="text-white font-bold text-[11px] whitespace-nowrap">{penaltyCount} / 3회</span>
            </span>
          </div>
        </div>

        {/* 메뉴 항목 */}
        <div className="flex-1 flex flex-col py-2">
          <button
            onClick={() => router.push(`/pickup/edit-profile?store=${store}`)}
            className="px-5 py-[15px] flex items-center gap-3 text-[14px] font-semibold text-ink text-left"
          >
            <span className="w-5 h-5 flex-none rounded-full border-2 border-ink-soft relative inline-flex">
              <span className="absolute left-1/2 bottom-[2px] -translate-x-1/2 w-[11px] h-[6px] border-2 border-ink-soft border-b-0 rounded-t-lg" />
            </span>
            내 정보 수정
          </button>
          <button className="px-5 py-[15px] flex items-center justify-between gap-3 text-[14px] font-semibold text-ink text-left">
            <span className="flex items-center gap-3">
              <span className="w-5 h-5 flex-none bg-kakao rounded-md flex items-center justify-center">
                <span className="w-2.5 h-[9px] bg-kakao-ink rounded-[5px_5px_5px_1px]" />
              </span>
              카카오채널 추가
            </span>
            <span className="text-[11px] font-medium text-ink-soft whitespace-nowrap">{storeName}</span>
          </button>
          <button
            onClick={() => router.push(`/pickup/my?store=${store}`)}
            className="px-5 py-[15px] flex items-center gap-3 text-[14px] font-semibold text-ink text-left"
          >
            <span className="w-5 h-5 flex-none border-2 border-ink-soft rounded-[5px] flex flex-col items-center justify-center gap-[2px]">
              <span className="w-[10px] h-[1.5px] bg-ink-soft" />
              <span className="w-[10px] h-[1.5px] bg-ink-soft" />
            </span>
            내 신청 내역
          </button>
          <div className="h-px bg-line mx-5 my-2" />
          <button onClick={() => window.open('/privacy', '_blank')} className="px-5 py-[13px] text-[13px] text-ink-soft text-left">개인정보 처리방침</button>
          <button className="px-5 py-[13px] text-[13px] text-ink-soft text-left">고객센터</button>
        </div>

        <div className="p-5 border-t border-line">
          <button
            onClick={async () => {
              if (!confirm('로그아웃 하시겠습니까?')) return
              await supabase.auth.signOut()
              router.push(`/auth/login?store=${store}`)
            }}
            className="w-full py-3 bg-bg border border-line rounded-xl text-[13px] font-semibold text-ink-soft"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
