// lib/kakao-branches.ts
// 🔴 지점별 카카오 로그인 앱 설정
// REST API 키(client_id)는 공개 정보라 코드에 둬도 안전하지만,
// Client Secret은 절대 코드에 넣지 않고 Vercel 환경변수(KAKAO_CLIENT_SECRET_<지점코드>)로만 관리합니다.

export interface KakaoBranchConfig {
  code: string        // store 코드 (URL의 ?store=)
  name: string        // 지점명 (표시용)
  restApiKey: string  // 카카오 REST API 키 (= client_id, 공개 정보)
}

// ⚠️ TODO: 아래 8개 지점은 아직 "앱 ID"가 들어있는 임시값입니다 (실제 REST API 키 아님).
// 카카오 개발자 콘솔 > 각 지점 앱 > 앱 설정 > 플랫폼 키 > REST API 키 에서
// 16진수 문자열 값을 확인해서 교체해야 실제로 작동합니다. (해운대만 검증 완료)
export const KAKAO_BRANCHES: Record<string, KakaoBranchConfig> = {
  hwajung:    { code: 'hwajung',    name: '세이브존 화정',     restApiKey: '1199610' /* TODO: 실제 REST API 키로 교체 */ },
  jeonju:     { code: 'jeonju',     name: '세이브존 전주코아', restApiKey: '1199447' /* TODO: 실제 REST API 키로 교체 */ },
  bucheon:    { code: 'bucheon',    name: '세이브존 부천상동', restApiKey: '1199446' /* TODO: 실제 REST API 키로 교체 */ },
  haeundae:   { code: 'haeundae',   name: '세이브존 해운대',   restApiKey: '0be3c6956fa25823a36035b3c4e9b18f' },
  daejeon:    { code: 'daejeon',    name: '세이브존 대전',     restApiKey: '1199444' /* TODO: 실제 REST API 키로 교체 */ },
  gwangmyung: { code: 'gwangmyung', name: '세이브존 광명',     restApiKey: '1199442' /* TODO: 실제 REST API 키로 교체 */ },
  seongnam:   { code: 'seongnam',   name: '세이브존 성남',     restApiKey: '1199438' /* TODO: 실제 REST API 키로 교체 */ },
  nowon:      { code: 'nowon',      name: '세이브존 노원',     restApiKey: '1199429' /* TODO: 실제 REST API 키로 교체 */ },
  ulsan:      { code: 'ulsan',      name: '세이브존 울산',     restApiKey: '1199419' /* TODO: 실제 REST API 키로 교체 */ },
}

export const DEFAULT_STORE = 'hwajung'

export function getKakaoBranch(store: string | null | undefined): KakaoBranchConfig {
  const key = store && KAKAO_BRANCHES[store] ? store : DEFAULT_STORE
  return KAKAO_BRANCHES[key]
}

// Client Secret은 지점코드를 대문자+언더스코어로 바꾼 환경변수명에서 읽음
// 예: haeundae -> KAKAO_CLIENT_SECRET_HAEUNDAE
export function getKakaoClientSecret(store: string): string | undefined {
  const envName = `KAKAO_CLIENT_SECRET_${store.toUpperCase()}`
  return process.env[envName]
}
