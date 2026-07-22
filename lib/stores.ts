// lib/stores.ts
// 🔴 지점 코드 ↔ 표시용 이름 매핑 (여러 화면 공통 사용)

export const STORE_NAMES: Record<string, string> = {
  hwajung: '세이브존 화정점',
  ulsan: '세이브존 울산점',
  nowon: '세이브존 노원점',
  seongnam: '세이브존 성남점',
  gwangmyung: '세이브존 광명점',
  daejeon: '세이브존 대전점',
  haeundae: '세이브존 해운대점',
  bucheon: '세이브존 부천상동점',
  jeonju: '세이브존 전주코아점',
}

export function getStoreName(code: string | null | undefined): string {
  if (!code) return '세이브존'
  return STORE_NAMES[code] || '세이브존'
}
