'use client'
// components/layout/CustomerLayout.tsx
// 고객 앱 공통 레이아웃 - 상단 헤더(햄버거) + 하단 탭바

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface CustomerLayoutProps {
  children: React.ReactNode
  storeName?: string   // 지점명 (예: 세이브존 화정점)
  storeCode?: string   // 지점 코드 (예: hwajung)
  userName?: string    // 고객 이름
  userPhone?: string   // 고객 전화번호 (마스킹)
  penaltyCount?: number
  hideTabBar?: boolean // 상세/완료 화면 등 탭바 숨길 때
}

export default function CustomerLayout({
  children,
  storeName = '세이브존',
  storeCode = 'hwajung',
  userName = '',
  userPhone = '',
  penaltyCount = 0,
  hideTabBar = false,
}: CustomerLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return
    await supabase.auth.signOut()
    router.push(`/auth/login?store=${storeCode}`)
  }

  const handleKakaoChannel = () => {
    // 지점별 카카오채널 추가
    // 실제 채널 URL은 각 지점 채널 개설 후 업데이트
    const channelMap: Record<string, string> = {
      hwajung: 'https://pf.kakao.com/_hwajungChannel',
      ulsan: 'https://pf.kakao.com/_ulsanChannel',
      nowon: 'https://pf.kakao.com/_nowonChannel',
      seongnam: 'https://pf.kakao.com/_seongnamChannel',
      gwangmyung: 'https://pf.kakao.com/_gwangmyungChannel',
      daejeon: 'https://pf.kakao.com/_daejeonChannel',
      haeundae: 'https://pf.kakao.com/_haeundaeChannel',
      bucheon: 'https://pf.kakao.com/_bucheonChannel',
      jeonju: 'https://pf.kakao.com/_jeonjuChannel',
    }
    const url = channelMap[storeCode]
    if (url) window.open(url, '_blank')
    setDrawerOpen(false)
  }

  // 현재 활성 탭 판단
  const isHome = pathname === '/pickup'
  const isMy = pathname === '/pickup/my'
  const isMyApp = pathname === '/pickup/my/applications' || pathname.includes('/my/')

  const tabs = [
    { label: '홈', icon: '🏠', path: `/pickup?store=${storeCode}`, active: isHome },
    { label: '내 신청', icon: '📋', path: `/pickup/my/applications?store=${storeCode}`, active: isMyApp },
    { label: 'MY', icon: '👤', path: `/pickup/my?store=${storeCode}`, active: isMy },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto relative">

      {/* ── 상단 헤더 ── */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">SP</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">세이브픽</p>
            <p className="text-xs text-gray-500">{storeName}</p>
          </div>
        </div>
        {/* 햄버거 버튼 */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-50"
          aria-label="메뉴 열기"
        >
          <span className="w-5 h-0.5 bg-gray-600 rounded-full block" />
          <span className="w-5 h-0.5 bg-gray-600 rounded-full block" />
          <span className="w-5 h-0.5 bg-gray-600 rounded-full block" />
        </button>
      </header>

      {/* ── 콘텐츠 ── */}
      <main className={`flex-1 overflow-y-auto ${hideTabBar ? '' : 'pb-16'}`}>
        {children}
      </main>

      {/* ── 하단 탭바 ── */}
      {!hideTabBar && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 flex z-30">
          {tabs.map(tab => (
            <button
              key={tab.label}
              onClick={() => router.push(tab.path)}
              className="flex-1 flex flex-col items-center py-2 gap-0.5"
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className={`text-xs font-medium ${tab.active ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {tab.active && (
                <span className="w-1 h-1 rounded-full bg-orange-500 block" />
              )}
            </button>
          ))}
        </nav>
      )}

      {/* ── 햄버거 드로어 오버레이 ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── 햄버거 드로어 패널 ── */}
      <div className={`fixed top-0 right-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* 드로어 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-bold text-gray-900">메뉴</span>
          <button onClick={() => setDrawerOpen(false)} className="text-2xl text-gray-400 leading-none">×</button>
        </div>

        {/* 사용자 프로필 */}
        <div className="px-5 py-4 border-b border-gray-50 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 border-2 border-orange-200 rounded-full flex items-center justify-center text-xl">👤</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{userName || '사용자'} 님</p>
              <p className="text-xs text-gray-500 font-mono">{userPhone || '---'}</p>
            </div>
          </div>
          {/* 패널티 현황 */}
          {penaltyCount > 0 && (
            <div className="mt-2 flex items-center gap-2 bg-red-50 rounded-lg px-3 py-1.5">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < penaltyCount ? 'bg-red-500' : 'bg-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs font-bold text-red-600">패널티 {penaltyCount}/3회</span>
            </div>
          )}
        </div>

        {/* 메뉴 아이템 */}
        <div className="flex-1 py-2">
          <button
            onClick={() => { router.push(`/auth/profile?store=${storeCode}&edit=true`); setDrawerOpen(false) }}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 text-left border-b border-gray-50"
          >
            <span className="text-xl">✏️</span>
            <span className="font-medium text-gray-800 text-sm">내 정보 수정</span>
            <span className="ml-auto text-gray-300 text-lg">›</span>
          </button>

          <button
            onClick={handleKakaoChannel}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-yellow-50 text-left border-b border-gray-50 bg-amber-50"
          >
            <span className="text-xl">💬</span>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">카카오채널 추가</p>
              <p className="text-xs text-amber-600">{storeName} 채널 친구 추가</p>
            </div>
            <span className="text-amber-300 text-lg">›</span>
          </button>

          <button
            onClick={() => { router.push(`/pickup/my/applications?store=${storeCode}`); setDrawerOpen(false) }}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 text-left border-b border-gray-50"
          >
            <span className="text-xl">📋</span>
            <span className="font-medium text-gray-800 text-sm">내 신청 내역</span>
            <span className="ml-auto text-gray-300 text-lg">›</span>
          </button>

          <button
            onClick={() => { window.open('/privacy', '_blank'); setDrawerOpen(false) }}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 text-left border-b border-gray-50"
          >
            <span className="text-xl">📄</span>
            <span className="font-medium text-gray-800 text-sm">개인정보 처리방침</span>
            <span className="ml-auto text-gray-300 text-lg">›</span>
          </button>

          <button
            onClick={() => { alert('문의: 매장 전화 또는 카카오채널로 연락해주세요'); setDrawerOpen(false) }}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 text-left"
          >
            <span className="text-xl">📞</span>
            <span className="font-medium text-gray-800 text-sm">고객센터</span>
            <span className="ml-auto text-gray-300 text-lg">›</span>
          </button>
        </div>

        {/* 로그아웃 */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-gray-400"
          >
            <span className="text-xl">🚪</span>
            <span className="text-sm">로그아웃</span>
          </button>
        </div>
      </div>

    </div>
  )
}
