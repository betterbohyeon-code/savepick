'use client'
// components/admin/ImageUpload.tsx - Supabase Storage 이미지 업로드

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  bucket?: string
}

export default function ImageUpload({
  value,
  onChange,
  bucket = 'product-images',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setError('업로드 실패: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    onChange(data.publicUrl)
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = async () => {
    if (!value) return
    // URL에서 파일 경로 추출 후 삭제
    const path = value.split('/').slice(-2).join('/')
    await supabase.storage.from(bucket).remove([path])
    onChange('')
  }

  return (
    <div>
      {value ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
          <img src={value} alt="상품 이미지" className="w-full h-full object-cover" />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">업로드 중...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <span className="text-3xl">📷</span>
              <p className="text-sm font-medium">이미지를 드래그하거나 클릭하여 업로드</p>
              <p className="text-xs">JPG, PNG, WEBP · 최대 5MB</p>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  )
}
