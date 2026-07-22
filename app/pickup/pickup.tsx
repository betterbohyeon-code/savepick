'use client'
// app/pickup/page.tsx - 고객용 픽업 상품 목록 페이지 (SAVE PICK v2 디자인)

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getActiveProducts, applyPickup } from '@/lib/pickup'
import { getUserProfile, checkUserBanStatus } from '@/lib/auth'
import { getStoreName } from '@/lib/stores'
import type { Product, UserProfile } from '@/types'
import MobileShell from '@/components/layout/MobileShell'
import CustomerHeader from '@/components/layout/CustomerHeader'
import CustomerDrawer from '@/components/layout/CustomerDrawer'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function dateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ProductCard({ product, onApply, disabled }: {
  product: Product
  onApply: (product: Product) => void
  disabled: boolean
}) {
  const isSoldOut = product.remaining_quantity === 0
  const discountRate = Math.round((1 - product.sale_price / product.original_price) * 100)
  const stockPct = Math.min(100, Math.round((product.remaining_quantity / Math.max(product.total_quantity, 1)) * 100))
  const isLow = product.remaining_quantity > 0 && product.remaining_quantity <= 5

  return (
    <div className={`bg-surface border border-line rounded-2xl overflow-hidden flex flex-col ${isSoldOut ? 'opacity-60' : ''}`}>
      <div className="relative aspect-square bg-[repeating-linear-gradient(45deg,#e4ded2,#e4ded2_8px,#dbd4c6_8px,#dbd4c6_16px)]">
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        {discountRate > 0 && (
          <div className={`absolute top-2 left-2 px-2 py-[3px] rounded-[7px] text-xs font-extrabold text-white ${isSoldOut ? 'bg-ink-soft' : 'bg-accent'}`}>
            {discountRate}%
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <span className="px-3 py-1 bg-black/60 rounded-full text-xs font-extrabold text-white">품절</span>
          </div>
        )}
      </div>
      <div className="p-[9px] border-t border-line flex flex-col gap-1 flex-1">
        <div className="text-[12.5px] font-semibold text-ink leading-snug line-clamp-2">{product.name}</div>
        <div className="mt-auto flex flex-col gap-0.5">
          <div className="text-[11px] text-ink-soft line-through">{product.original_price.toLocaleString()}원</div>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-unbounded font-extrabold ${isSoldOut ? 'text-ink-soft' : 'text-accent'}`} style={{ fontSize: 19 }}>
              {product.sale_price.toLocaleString()}
            </span>
            <span className={`font-bold text-sm ${isSoldOut ? 'text-ink-soft' : 'text-accent'}`}>원</span>
          </div>
        </div>
        {product.round?.pickup_start_time && (
          <div className="text-[11px] text-ink-soft">
            {product.round.pickup_start_time.slice(0, 5)}-{product.round.pickup_end_time?.slice(0, 5)} 픽업
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[5px] rounded-full bg-line overflow-hidden">
            {!isSoldOut && <div className={`h-full rounded-full ${isLow ? 'bg-danger' : 'bg-ink-soft'}`} style={{ width: `${stockPct}%` }} />}
          </div>
          <span className={`text-[11px] font-bold whitespace-nowrap ${isSoldOut ? 'text-ink-soft' : isLow ? 'text-danger' : 'text-ink-soft'}`}>
            {isSoldOut ? '재고 소진' : `재고 ${product.remaining_quantity}개 남음`}
          </span>
        </div>
        <button
          onClick={() => onApply(product)}
          disabled={disabled || isSoldOut}
          className={`w-full h-[31px] rounded-[10px] text-[13px] font-bold transition-colors ${
            isSoldOut
              ? 'bg-line text-ink-soft cursor-not-allowed'
              : disabled
              ? 'bg-line text-ink-soft cursor-not-allowed'
              : 'bg-transparent border-[1.5px] border-accent text-accent'
          }`}
        >
          {isSoldOut ? '품절' : disabled ? '신청 불가' : '신청하기'}
        </button>
      </div>
    </div>
  )
}

function ApplyModal({ product, onConfirm, onClose }: {
  product: Product
  onConfirm: (qty: number) => void
  onClose: () => void
}) {
  const [qty, setQty] = useState(1)
  const max = Math.max(1, Math.min(product.max_per_user || 1, product.remaining_quantity))
  const total = qty * product.sale_price

  return (
    <div className="fixed inset-0 z-50">
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="absolute left-0 right-0 bottom-0 mx-auto max-w-[430px] bg-surface rounded-t-[24px] p-5 pb-7 flex flex-col gap-4 shadow-2xl">
        <div className="w-9 h-1 rounded-full bg-line mx-auto" />
        <div className="flex gap-3.5 items-center">
          <div className="w-[72px] h-[72px] flex-none rounded-2xl bg-[repeating-linear-gradient(45deg,#e4ded2,#e4ded2_8px,#dbd4c6_8px,#dbd4c6_16px)] overflow-hidden">
            {product.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-ink">{product.name}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-ink-soft line-through">{product.original_price.toLocaleString()}원</span>
            </div>
            <span className="inline-flex items-baseline gap-0.5">
              <span className="font-unbounded font-extrabold text-accent" style={{ fontSize: 22 }}>{product.sale_price.toLocaleString()}</span>
              <span className="font-bold text-accent text-[15px]">원</span>
            </span>
          </div>
        </div>

        {product.description && (
          <p className="text-[12.5px] text-ink-soft leading-relaxed">{product.description}</p>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink">수량</span>
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="w-[34px] h-[34px] border border-line bg-surface rounded-[10px] font-bold text-base text-ink disabled:opacity-40"
              >−</button>
              <span className="font-bold text-base text-ink min-w-[16px] text-center">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(max, q + 1))}
                disabled={qty >= max}
                className="w-[34px] h-[34px] border border-line bg-surface rounded-[10px] font-bold text-base text-ink disabled:opacity-40"
              >+</button>
            </div>
          </div>
          <p className="text-[11.5px] text-ink-soft">1인당 최대 {product.max_per_user || 1}개</p>
        </div>

        {product.round?.pickup_date && (
          <div className="flex items-center gap-2 px-3.5 py-3 bg-bg rounded-xl text-[13px] font-semibold text-ink">
            {new Date(product.round.pickup_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })}
            {' '}{product.round.pickup_start_time?.slice(0, 5)}-{product.round.pickup_end_time?.slice(0, 5)} 픽업
          </div>
        )}

        <div className="bg-bg border border-line rounded-xl px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-soft">
          노쇼(미수령) 3회 누적 시 90일간 픽업 신청이 제한됩니다. 신청 후 꼭 방문해주세요.
        </div>

        <div className="flex gap-2.5 mt-1">
          <button onClick={onClose} className="flex-1 h-[52px] bg-surface border border-line rounded-2xl font-bold text-sm text-ink-soft">취소</button>
          <button
            onClick={() => onConfirm(qty)}
            className="flex-[2] h-[52px] bg-accent rounded-2xl font-bold text-[15px] text-white whitespace-nowrap"
          >
            {qty}개 · {total.toLocaleString()}원 신청하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PickupPage() {
  return (
    <Suspense fallback={null}>
      <PickupPageInner />
    </Suspense>
  )
}

interface AppliedItem { date: string; name: string; qty: number; time: string }

function PickupPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = searchParams.get('store') || 'hwajung'
  const storeName = getStoreName(store)
  const [products, setProducts] = useState<Product[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
  const [isBanned, setIsBanned] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [appliedItems, setAppliedItems] = useState<AppliedItem[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?store=${store}`)
        return
      }

      const prof = await getUserProfile(user.id)
      if (!prof?.is_profile_complete) {
        router.push(`/auth/profile?store=${store}`)
        return
      }
      setProfile(prof)

      const banStatus = await checkUserBanStatus(user.id)
      setIsBanned(banStatus.isBanned)

      const { data: branch } = await supabase
        .from('branches')
        .select('id')
        .eq('code', store)
        .single()

      const { data } = await getActiveProducts(branch?.id)
      setProducts(data || [])
      setLoading(false)
    }
    init()
  }, [store])

  // 날짜 탭 목록: 오늘부터 7일, 상품 유무와 무관하게 항상 노출
  const dateTabs = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      return { key: dateKey(d), month: d.getMonth() + 1, day: d.getDate(), weekday: WEEKDAYS[d.getDay()] }
    })
  }, [])

  useEffect(() => {
    if (!selectedDate && dateTabs.length > 0) setSelectedDate(dateTabs[0].key)
  }, [dateTabs, selectedDate])

  const productsForDate = useMemo(
    () => products.filter(p => p.round?.pickup_date === selectedDate),
    [products, selectedDate]
  )
  const selectedTab = dateTabs.find(t => t.key === selectedDate)
  const sampleRound = productsForDate[0]?.round

  const handleApply = async (qty: number) => {
    if (!selectedProduct) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await applyPickup({
      userId: user.id,
      productId: selectedProduct.id,
      roundId: selectedProduct.round_id!,
      branchId: selectedProduct.branch_id!,
      quantity: qty,
    })

    if (error) {
      showToast('error', error)
    } else {
      showToast('success', '신청 완료! 매장 방문 시 전화번호로 조회하시면 돼요.')
      setProducts(prev => prev.map(p =>
        p.id === selectedProduct.id ? { ...p, remaining_quantity: p.remaining_quantity - qty } : p
      ))
      setAppliedItems(prev => [...prev, {
        date: selectedTab ? `${selectedTab.month}/${selectedTab.day}(${selectedTab.weekday})` : '',
        name: selectedProduct.name,
        qty,
        time: selectedProduct.round?.pickup_start_time?.slice(0, 5) + '-' + selectedProduct.round?.pickup_end_time?.slice(0, 5),
      }])
    }
    setSelectedProduct(null)
  }

  const groupedApplied = useMemo(() => {
    const map = new Map<string, AppliedItem[]>()
    appliedItems.forEach(it => {
      if (!map.has(it.date)) map.set(it.date, [])
      map.get(it.date)!.push(it)
    })
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
  }, [appliedItems])

  if (loading) {
    return (
      <MobileShell>
        <div className="min-h-screen md:h-full md:min-h-0 flex items-center justify-center">
          <div className="w-8 h-8 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileShell>
    )
  }

  return (
    <MobileShell>
      <div className="min-h-screen md:h-full md:min-h-0 flex flex-col relative">
        <div className="sticky top-0 z-20">
          <CustomerHeader storeName={storeName} onMenu={() => setDrawerOpen(true)} />
          <div className="flex gap-2 overflow-x-auto px-5 py-3" style={{ background: 'oklch(0.6 0.17 35)' }}>
            {dateTabs.map(tab => {
              const active = tab.key === selectedDate
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedDate(tab.key)}
                  className={`flex-none flex items-center gap-1.5 px-3.5 py-2 rounded-[13px] whitespace-nowrap ${
                    active ? 'bg-white' : 'bg-white/15 border border-white/30'
                  }`}
                >
                  <span className={`font-unbounded font-extrabold ${active ? 'text-accent' : 'text-white'}`} style={{ fontSize: 15 }}>
                    {tab.month}/{tab.day}
                  </span>
                  <span className={`text-xs font-bold ${active ? 'text-accent' : 'text-white'}`}>{tab.weekday}</span>
                </button>
              )
            })}
          </div>
        </div>

        {isBanned && (
          <div className="px-5 pt-4">
            <div className="bg-danger-soft border border-danger/20 rounded-xl p-3.5 text-[13px] text-danger">
              <p className="font-bold mb-1">🚫 픽업 신청이 제한되었습니다</p>
              <p>노쇼 3회로 인해 신청이 일시 제한됩니다. {profile?.banned_until && `(해제일: ${new Date(profile.banned_until).toLocaleDateString('ko-KR')})`}</p>
            </div>
          </div>
        )}

        {productsForDate.length > 0 ? (
          <>
            <div className="px-5 pt-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-extrabold text-ink">{selectedTab?.month}/{selectedTab?.day}({selectedTab?.weekday})</span>
                  <span className="text-[13px] font-bold text-accent">상품 {productsForDate.length}개</span>
                </div>
                <button className="flex-none flex items-center gap-1 bg-transparent border border-line rounded-[9px] px-2.5 py-[7px] text-xs font-semibold text-ink">
                  추천순<span className="text-[8px] text-ink-soft">▼</span>
                </button>
              </div>
              {sampleRound?.pickup_start_time && (
                <div className="flex items-center gap-2.5 px-3.5 py-3 bg-accent-soft rounded-xl">
                  <div className="w-[34px] h-[34px] flex-none rounded-[10px] bg-white flex items-center justify-center">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-ink">이 날 방문 수령 가능한 상품이에요</span>
                    <span className="text-[12.5px] font-bold text-accent">픽업 시간 {sampleRound.pickup_start_time.slice(0,5)}–{sampleRound.pickup_end_time.slice(0,5)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 pt-2.5 pb-24 grid grid-cols-2 gap-2">
              {productsForDate.map(product => (
                <ProductCard key={product.id} product={product} onApply={setSelectedProduct} disabled={isBanned} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 pb-24 text-center">
            <div className="w-[104px] h-[104px] rounded-full bg-accent-soft flex items-center justify-center">
              <div className="relative" style={{ width: 52, height: 46 }}>
                <div className="absolute bg-accent" style={{ bottom: 0, left: 2, right: 2, height: 32, borderRadius: '4px 4px 9px 9px', clipPath: 'polygon(0 0, 100% 0, 88% 100%, 12% 100%)' }} />
                <div className="absolute bg-white/55 rounded-sm" style={{ bottom: 9, left: 14, width: 3, height: 16 }} />
                <div className="absolute bg-white/55 rounded-sm" style={{ bottom: 9, left: '50%', transform: 'translateX(-50%)', width: 3, height: 16 }} />
                <div className="absolute bg-white/55 rounded-sm" style={{ bottom: 9, right: 14, width: 3, height: 16 }} />
                <div className="absolute bg-accent rounded" style={{ top: 6, left: 0, right: 0, height: 9 }} />
                <div className="absolute border-accent" style={{ top: 0, left: 11, width: 16, height: 16, borderWidth: 3, borderBottomStyle: 'none', borderRightStyle: 'none' as any, borderStyle: 'solid', borderBottom: 'none', borderRight: 'none', borderRadius: '12px 0 0 0', transform: 'rotate(35deg)' }} />
                <div className="absolute border-accent" style={{ top: 0, right: 11, width: 16, height: 16, borderWidth: 3, borderStyle: 'solid', borderBottom: 'none', borderLeft: 'none', borderRadius: '0 12px 0 0', transform: 'rotate(-35deg)' }} />
              </div>
            </div>
            <p className="font-bold text-[15px] text-ink">이 날짜에 픽업 가능한 상품이 없어요</p>
            <p className="text-[13px] text-ink-soft leading-relaxed">다른 날짜를 선택하거나<br />새로운 특가가 열리면 알려드릴게요</p>
          </div>
        )}

        {appliedItems.length > 0 && (
          <button
            onClick={() => setSheetOpen(true)}
            className="fixed left-1/2 -translate-x-1/2 bottom-5 bg-accent text-white rounded-full px-5 py-3 text-[13px] font-bold flex items-center gap-2 shadow-2xl z-10 whitespace-nowrap"
            style={{ boxShadow: '0 16px 40px rgba(0,0,0,.4), 0 4px 14px rgba(0,0,0,.3)' }}
          >
            🎫 오늘 신청 {appliedItems.length}건 보기
          </button>
        )}

        {sheetOpen && (
          <div className="fixed inset-0 z-30">
            <div onClick={() => setSheetOpen(false)} className="absolute inset-0 bg-black/40" />
            <div className="absolute left-0 right-0 bottom-0 mx-auto max-w-[430px] max-h-[70%] overflow-y-auto bg-surface rounded-t-[24px] p-5 pb-6 flex flex-col gap-3.5 shadow-2xl">
              <div className="w-9 h-1 rounded-full bg-line mx-auto" />
              <div className="font-bold text-[15px] text-ink">오늘 신청 내역</div>
              {groupedApplied.map(grp => (
                <div key={grp.date} className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-ink-soft">{grp.date}</div>
                  {grp.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center px-3 py-2.5 bg-bg rounded-[10px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-semibold text-ink">{item.name}</span>
                        <span className="text-[11px] text-ink-soft">{item.time} 픽업</span>
                      </div>
                      <span className="text-[12.5px] font-bold text-ink-soft whitespace-nowrap">{item.qty}개</span>
                    </div>
                  ))}
                </div>
              ))}
              <button onClick={() => router.push(`/pickup/my?store=${store}`)} className="text-center text-[13px] font-bold text-accent pt-1.5 border-t border-line mt-1">
                전체 신청 내역 보기
              </button>
            </div>
          </div>
        )}

        {selectedProduct && (
          <ApplyModal product={selectedProduct} onConfirm={handleApply} onClose={() => setSelectedProduct(null)} />
        )}

        {toast && (
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-lg z-50 whitespace-nowrap ${
            toast.type === 'success' ? 'bg-good' : 'bg-danger'
          }`}>
            {toast.msg}
          </div>
        )}

        <CustomerDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          name={profile?.name || ''}
          phone={profile?.phone || ''}
          penaltyCount={profile?.penalty_count || 0}
          storeName={storeName}
          store={store}
        />
      </div>
    </MobileShell>
  )
}
