'use client'
// app/pickup/page.tsx - 고객용 픽업 상품 목록 페이지

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getActiveProducts, applyPickup } from '@/lib/pickup'
import { getUserProfile, checkUserBanStatus } from '@/lib/auth'
import type { Product, UserProfile } from '@/types'

function PenaltyBadge({ count }: { count: number }) {
  if (count === 0) return null
  const color = count >= 2 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      ⚠ 노쇼 {count}회
    </span>
  )
}

function ProductCard({ product, onApply, disabled }: {
  product: Product
  onApply: (product: Product) => void
  disabled: boolean
}) {
  const isSoldOut = product.remaining_quantity === 0
  const discountRate = Math.round((1 - product.sale_price / product.original_price) * 100)

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
            <span className="text-4xl">🛍️</span>
          </div>
        )}
        {discountRate > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
            {discountRate}% OFF
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg bg-black/60 px-4 py-2 rounded-xl">품절</span>
          </div>
        )}
        {product.branch && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-lg text-gray-600">
            {product.branch.name}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">{product.name}</h3>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-orange-600 font-bold text-lg">{product.sale_price.toLocaleString()}원</span>
          {product.original_price !== product.sale_price && (
            <span className="text-gray-400 text-sm line-through">{product.original_price.toLocaleString()}원</span>
          )}
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">잔여 {product.remaining_quantity}개</span>
          {product.round?.pickup_date && (
            <span className="text-xs text-blue-600 font-medium">
              픽업 {new Date(product.round.pickup_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
            </span>
          )}
        </div>
        <button
          onClick={() => onApply(product)}
          disabled={disabled || isSoldOut}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
            disabled || isSoldOut
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'
          }`}
        >
          {isSoldOut ? '품절' : disabled ? '신청 불가' : '픽업 신청'}
        </button>
      </div>
    </div>
  )
}

function ApplyModal({ product, onConfirm, onClose }: {
  product: Product
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 mb-4">
        <h3 className="font-bold text-gray-900 text-lg mb-4">픽업 신청</h3>
        <div className="flex gap-3 mb-5">
          {product.image_url && (
            <img src={product.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
          )}
          <div>
            <p className="font-medium text-gray-900 text-sm">{product.name}</p>
            <p className="text-orange-600 font-bold">{product.sale_price.toLocaleString()}원</p>
            {product.round?.pickup_date && (
              <p className="text-xs text-gray-500 mt-1">
                픽업일: {new Date(product.round.pickup_date).toLocaleDateString('ko-KR')}
                &nbsp;{product.round.pickup_start_time?.slice(0,5)}~{product.round.pickup_end_time?.slice(0,5)}
              </p>
            )}
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 mb-5 text-sm text-amber-800">
          <p className="font-medium mb-1">📌 픽업 안내</p>
          <p>• 지정 날짜에 {product.branch?.name || '해당 지점'}에서 픽업하세요.</p>
          <p>• 노쇼 3회 시 90일간 신청이 제한됩니다.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium">취소</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-semibold">신청하기</button>
        </div>
      </div>
    </div>
  )
}

export default function PickupPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [applying, setApplying] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
  const [isBanned, setIsBanned] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<string>('')

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const prof = await getUserProfile(user.id)
      if (!prof?.is_profile_complete) {
        router.push('/auth/profile')
        return
      }
      setProfile(prof)

      const banStatus = await checkUserBanStatus(user.id)
      setIsBanned(banStatus.isBanned)

      const { data } = await getActiveProducts()
      setProducts(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleApply = async () => {
    if (!selectedProduct) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setApplying(true)
    const { data, error } = await applyPickup({
      userId: user.id,
      productId: selectedProduct.id,
      roundId: selectedProduct.round_id!,
      branchId: selectedProduct.branch_id!,
      quantity: 1,
    })

    setSelectedProduct(null)
    setApplying(false)

    if (error) {
      showToast('error', error)
    } else {
      showToast('success', `신청 완료! 픽업코드: ${data?.pickup_code}`)
      // 재고 업데이트
      setProducts(prev => prev.map(p =>
        p.id === selectedProduct.id
          ? { ...p, remaining_quantity: p.remaining_quantity - 1 }
          : p
      ))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">세이브존 픽업</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-gray-500">{profile?.name}님</span>
              <PenaltyBadge count={profile?.penalty_count || 0} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/pickup/my')}
              className="text-sm text-orange-600 font-medium bg-orange-50 px-3 py-1.5 rounded-lg"
            >
              내 신청 내역
            </button>
            <button
              onClick={async () => {
                if (!confirm('로그아웃 하시겠습니까?')) return
                await supabase.auth.signOut()
                router.push('/auth/login')
              }}
              className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 밴 경고 */}
      {isBanned && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <p className="font-semibold mb-1">🚫 픽업 신청이 제한되었습니다</p>
            <p>노쇼 3회로 인해 신청이 일시 제한됩니다. {profile?.banned_until && `(해제일: ${new Date(profile.banned_until).toLocaleDateString('ko-KR')})`}</p>
          </div>
        </div>
      )}

      {/* 상품 목록 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">픽업 상품</h2>
          <span className="text-sm text-gray-500">{products.length}개 상품</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-medium">현재 픽업 가능한 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onApply={setSelectedProduct}
                disabled={isBanned}
              />
            ))}
          </div>
        )}
      </main>

      {/* 신청 모달 */}
      {selectedProduct && !applying && (
        <ApplyModal
          product={selectedProduct}
          onConfirm={handleApply}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* 토스트 */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-lg z-50 whitespace-nowrap ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
