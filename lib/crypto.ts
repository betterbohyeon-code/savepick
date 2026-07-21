// lib/crypto.ts
// 전화번호 등 민감 정보 암호화/복호화 (AES-256-GCM)

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret) throw new Error('ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.')
  return createHash('sha256').update(secret).digest()
}

/**
 * 전화번호 암호화
 * 저장 형식: iv(hex):authTag(hex):encrypted(hex)
 */
export function encryptPhone(phone: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(phone, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * 전화번호 복호화
 */
export function decryptPhone(encryptedData: string): string {
  // 암호화되지 않은 레거시 데이터 처리 (마이그레이션 기간)
  if (!encryptedData.includes(':')) return encryptedData

  const key = getKey()
  const parts = encryptedData.split(':')
  if (parts.length !== 3) return encryptedData

  const [ivHex, authTagHex, encrypted] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * 전화번호 검색용 해시 (암호화된 값은 검색 불가 → 별도 해시 컬럼으로 조회)
 * phone_hash 컬럼에 저장해서 현장 조회 시 사용
 */
export function hashPhone(phone: string): string {
  const secret = process.env.ENCRYPTION_KEY || ''
  return createHash('sha256')
    .update(phone + secret) // HMAC-like: 솔트 포함
    .digest('hex')
}
