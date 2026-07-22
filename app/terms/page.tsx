'use client'

// app/terms/page.tsx
// 🔴 이용약관 페이지

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStoreName } from '@/lib/stores'
import MobileShell from '@/components/layout/MobileShell'
import CustomerHeader from '@/components/layout/CustomerHeader'

export default function TermsPage() {
  return (
    <Suspense fallback={null}>
      <TermsPageInner />
    </Suspense>
  )
}

function TermsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = searchParams.get('store') || 'hwajung'
  const storeName = getStoreName(store)

  return (
    <MobileShell>
      <div className="min-h-screen flex flex-col">
        <CustomerHeader storeName={storeName} onBack={() => router.back()} />
        <div className="px-5 py-8">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-ink">이용약관</h1>
            <p className="text-sm text-ink-soft mt-1">세이브픽 (SavePick) · 최종 수정일: 2025년 1월 25일</p>
          </div>

          <div className="bg-accent-soft border border-accent/20 rounded-xl p-4 mb-8">
            <p className="text-sm text-ink leading-relaxed">
              본 약관은 세이브픽 서비스 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 정합니다.
            </p>
          </div>

          <div className="space-y-8 text-sm text-ink leading-relaxed">

            <section>
              <h2 className="text-base font-bold text-ink mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                서비스 개요
              </h2>
              <p>
                세이브픽은 세이브존 각 지점의 특가 상품을 이용자가 사전에 예약하고, 지정된 지점을 방문하여 직접 픽업하는 서비스입니다. 결제는 매장 방문 시 진행되며, 세이브픽 자체는 결제·배송 서비스를 제공하지 않습니다.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-ink mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                노쇼(미수령) 정책
              </h2>
              <div className="bg-bg rounded-xl p-4 space-y-2">
                <p>신청한 상품을 지정된 픽업 시간 내에 방문하여 수령하지 않을 경우 노쇼로 처리됩니다.</p>
                <p className="font-semibold text-ink">노쇼가 3회 누적되면 90일간 픽업 신청이 제한됩니다.</p>
              </div>
              <p className="mt-2 text-ink-soft">
                방문이 어려운 경우, 픽업 당일 오전 9시 이전까지 마이페이지에서 신청을 취소할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-ink mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                이용자의 의무
              </h2>
              <ul className="space-y-2 pl-4">
                <li className="list-disc">신청 시 입력한 이름과 전화번호는 실제 픽업 시 본인 확인에 사용되므로 정확히 입력해야 합니다.</li>
                <li className="list-disc">신청 후 방문이 어려운 경우 사전에 신청을 취소하여 다른 이용자의 픽업 기회를 보장해야 합니다.</li>
                <li className="list-disc">1인당 구매 제한 수량을 초과하여 신청할 수 없습니다.</li>
                <li className="list-disc">허위 정보 입력, 부정한 방법으로 반복 신청하는 행위는 이용 제한 사유가 될 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-ink mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                계정 관리
              </h2>
              <p>
                세이브픽은 카카오 계정을 통해 로그인하며, 지점마다 별도의 계정으로 연동됩니다. 즉 같은 이용자라도 방문하는 지점에 따라 서로 다른 계정으로 관리될 수 있습니다.
              </p>
              <p className="mt-2 text-ink-soft">
                계정 정보는 본인만 이용할 수 있으며, 계정 정보 유출로 인해 발생하는 문제에 대한 책임은 이용자 본인에게 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-ink mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                서비스 이용 제한
              </h2>
              <p>
                회사는 다음 각 호에 해당하는 경우 사전 통지 없이 서비스 이용을 제한하거나 계정을 정지할 수 있습니다.
              </p>
              <ul className="space-y-2 pl-4 mt-2">
                <li className="list-disc">노쇼 3회 누적 시 (90일간 자동 제한)</li>
                <li className="list-disc">타인의 정보를 도용하여 신청한 경우</li>
                <li className="list-disc">시스템에 부정한 방법으로 접근하거나 서비스 운영을 방해한 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-ink mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                면책 조항
              </h2>
              <p>
                회사는 이용자가 예약한 상품을 지정된 시간 내에 픽업하지 않아 발생하는 불이익에 대해 책임을 지지 않습니다. 매장 사정에 따라 상품 구성, 가격, 픽업 가능 시간이 사전 고지 없이 변경될 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-ink mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
                약관 변경
              </h2>
              <p>
                본 약관은 관련 법령 및 서비스 운영 방침에 따라 변경될 수 있으며, 변경 시 서비스 내 공지사항 또는 앱 내 안내를 통해 고지합니다.
              </p>
            </section>

          </div>

          <div className="mt-10 pt-6 border-t border-line text-center">
            <p className="text-xs text-ink-soft">본 약관은 2025년 1월 25일부터 시행됩니다.</p>
          </div>
        </div>
      </div>
    </MobileShell>
  )
}
