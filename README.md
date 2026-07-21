# 세이브픽 (SavePick)

세이브존 픽업 전용 웹서비스

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend/BaaS | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| 인증 | 카카오 OAuth via Supabase |
| 배포 | Vercel (FE) + Supabase Cloud |

## 9개 지점

| 지점명 | code (URL 파라미터) |
|--------|-------------------|
| 화정점 | hwajung |
| 울산점 | ulsan |
| 노원점 | nowon |
| 성남점 | seongnam |
| 광명점 | gwangmyung |
| 대전점 | daejeon |
| 해운대점 | haeundae |
| 부천상동점 | bucheon |
| 전주코아점 | jeonju |

고객 접속 URL 예시: `https://savepick.com/pickup?store=hwajung`

## 주요 기능

### 고객 앱
1. 카카오 간편로그인
2. 최초 1회 이름/전화번호 수집 (프로필 등록)
3. 날짜 탭별 상품 목록 → 장바구니 → 픽업 신청
4. 내 신청 내역 조회 및 취소
5. 노쇼 3회 누적 시 90일 이용 제한

### 지점 어드민 (PC)
1. **픽업 조회** — 전화번호로 신청자 검색, 픽업완료/노쇼 처리
   - ⚠️ 픽업코드 방식 제거 → 전화번호 직접 조회로 변경
   - 이름 마스킹: `김민지 → 김*지` (목록), 검색 결과는 실명 표시
2. **통계** — 회차별 신청/완료/노쇼 현황
3. **회원 관리** — 패널티 부여/삭감, 이용 제한 처리
4. **상품 관리** — 회차별 상품 등록 (이름, 설명, 이미지, 가격, 재고, 1인 최대)
5. **회차 관리** — 픽업 일정 추가, 진행중/완료 섹션 분리

### 마스터 어드민 (PC)
1. **전체 대시보드** — 9개 지점 카드 한눈에 보기
2. **지점 현황** — 픽업 현황 + 회원 현황 테이블
3. **전체 통계** — 지점별 완료율 비교, 추이 차트
4. **전체 회원** — 실명 표시 (마스킹 없음), 패널티 관리
5. **공통 상품 등록** — 선택 지점에 일괄 등록
6. **계정 관리** — 지점 어드민 계정 생성/관리

## 셋업

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.local.example .env.local
# .env.local 에 Supabase URL, anon key, Kakao 키 입력

# 3. Supabase DB 초기화 (순서 중요)
# Supabase 대시보드 > SQL Editor 에서 순서대로 실행:
# 1) supabase/schema.sql
# 2) supabase/functions.sql
# 3) supabase/storage.sql

# 4. Supabase > Authentication > Providers > Kakao 활성화

# 5. 개발 서버 실행
npm run dev
```

## 변경 이력

### v2 (현재)
- 픽업코드 완전 제거 → 전화번호 조회 방식으로 교체
- 프로필 입력 화면 (카카오 로그인 후 최초 1회 이름/전화번호)
- 지점 어드민 이름 마스킹 (`maskName`, `maskPhone` 유틸)
- 마스터 어드민 전면 개편 (6개 메뉴, 실명 표시)
- DB 스키마 최신화 (픽업코드 컬럼 제거, 전화번호 인덱스 추가)
- 9개 지점 코드 확정 (hwajung, ulsan, nowon, ...)

### v1
- 초기 버전 (픽업코드 방식)
