-- =============================================
-- 세이브픽 (SavePick) - Supabase Schema v2
-- 변경사항: 픽업코드 제거, 전화번호 조회 방식으로 변경
-- =============================================

-- 1. 지점 테이블 (9개 지점)
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,    -- URL 파라미터용: hwajung, ulsan, ...
  address TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9개 지점 초기 데이터
INSERT INTO branches (name, code, address, phone) VALUES
  ('세이브존 화정점',    'hwajung',    '경기 고양시 화정동',   '031-900-0001'),
  ('세이브존 울산점',    'ulsan',      '울산 남구 삼산동',     '052-260-0002'),
  ('세이브존 노원점',    'nowon',      '서울 노원구 상계동',   '02-3391-0003'),
  ('세이브존 성남점',    'seongnam',   '경기 성남시 수정구',   '031-720-0004'),
  ('세이브존 광명점',    'gwangmyung', '경기 광명시 철산동',   '02-897-0005'),
  ('세이브존 대전점',    'daejeon',    '대전 중구 은행동',     '042-220-0006'),
  ('세이브존 해운대점',  'haeundae',   '부산 해운대구 중동',   '051-740-0007'),
  ('세이브존 부천상동점','bucheon',    '경기 부천시 상동',     '032-610-0008'),
  ('세이브존 전주코아점','jeonju',     '전북 전주시 완산구',   '063-270-0009');

-- 2. 사용자 프로필 (카카오 로그인 후 최초 1회 이름/전화번호 수집)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_id VARCHAR(100) UNIQUE,
  name VARCHAR(50),                    -- 최초 1회 직접 입력
  phone VARCHAR(20),                   -- 최초 1회 직접 입력, 픽업 현장 조회용
  is_profile_complete BOOLEAN DEFAULT false,
  penalty_count INTEGER DEFAULT 0,     -- 노쇼 누적 횟수
  is_banned BOOLEAN DEFAULT false,     -- 3회 이상 노쇼 시 90일 이용 제한
  banned_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 전화번호 인덱스 (현장 조회 성능)
CREATE UNIQUE INDEX idx_user_profiles_phone ON user_profiles(phone);

-- 3. 관리자 테이블
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('master', 'branch')),
  branch_id UUID REFERENCES branches(id),
  name VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 픽업 회차 (지점별 날짜 단위 픽업 이벤트)
CREATE TABLE pickup_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  round_name VARCHAR(100) NOT NULL,
  round_number INTEGER NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_start_time TIME NOT NULL DEFAULT '10:00',
  pickup_end_time TIME NOT NULL DEFAULT '18:00',
  apply_start_at TIMESTAMPTZ NOT NULL,
  apply_end_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'open'
    CHECK (status IN ('draft','open','closed','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 상품 테이블
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),   -- NULL = 마스터가 등록한 공통 상품
  round_id UUID REFERENCES pickup_rounds(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  original_price INTEGER NOT NULL CHECK (original_price > 0),
  sale_price INTEGER NOT NULL CHECK (sale_price > 0),
  discount_rate INTEGER GENERATED ALWAYS AS (
    ROUND((1 - sale_price::NUMERIC / original_price) * 100)
  ) STORED,
  total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
  remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
  max_per_user INTEGER DEFAULT 1 CHECK (max_per_user >= 1),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 픽업 신청 테이블 (픽업코드 제거 - 전화번호 조회 방식)
CREATE TABLE pickup_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  round_id UUID NOT NULL REFERENCES pickup_rounds(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  status VARCHAR(20) DEFAULT 'confirmed'
    CHECK (status IN ('pending','confirmed','picked_up','no_show','cancelled')),
  -- pickup_code 컬럼 제거: 전화번호로 현장 조회
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  no_show_at TIMESTAMPTZ,
  notes TEXT,

  -- 동일 회차 동일 상품 중복 신청 방지
  UNIQUE(user_id, product_id, round_id)
);

-- =============================================
-- 트리거 함수
-- =============================================

-- 노쇼 처리 시 패널티 자동 증가
CREATE OR REPLACE FUNCTION handle_no_show()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'no_show' AND OLD.status != 'no_show' THEN
    UPDATE user_profiles
    SET
      penalty_count = penalty_count + 1,
      is_banned = CASE WHEN penalty_count + 1 >= 3 THEN true ELSE false END,
      banned_until = CASE
        WHEN penalty_count + 1 >= 3 THEN NOW() + INTERVAL '90 days'
        ELSE NULL
      END,
      no_show_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- no_show_at 기록
    NEW.no_show_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_no_show
  BEFORE UPDATE ON pickup_applications
  FOR EACH ROW EXECUTE FUNCTION handle_no_show();

-- 픽업완료 처리 시 confirmed_at 기록
CREATE OR REPLACE FUNCTION handle_picked_up()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'picked_up' AND OLD.status != 'picked_up' THEN
    NEW.picked_up_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_picked_up
  BEFORE UPDATE ON pickup_applications
  FOR EACH ROW EXECUTE FUNCTION handle_picked_up();

-- 신청/취소 시 재고 자동 차감·복구
CREATE OR REPLACE FUNCTION handle_application_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products
    SET remaining_quantity = remaining_quantity - NEW.quantity
    WHERE id = NEW.product_id;

  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE products
    SET remaining_quantity = remaining_quantity + OLD.quantity
    WHERE id = OLD.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_application_change
  AFTER INSERT OR UPDATE ON pickup_applications
  FOR EACH ROW EXECUTE FUNCTION handle_application_quantity();

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_applications ENABLE ROW LEVEL SECURITY;

-- 지점: 인증된 사용자 모두 읽기 가능
CREATE POLICY "branches_read" ON branches
  FOR SELECT TO authenticated USING (true);

-- 사용자 프로필: 본인 접근
CREATE POLICY "profiles_own" ON user_profiles
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 어드민은 모든 프로필 읽기 가능 (픽업 현장 전화번호 조회용)
CREATE POLICY "profiles_admin_read" ON user_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- 상품: 공개 읽기
CREATE POLICY "products_read" ON products
  FOR SELECT TO authenticated USING (is_active = true);

-- 상품: 마스터 전체, 지점 어드민 자기 지점만 수정
CREATE POLICY "products_admin_write" ON products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid() AND (
        role = 'master' OR
        (role = 'branch' AND branch_id = products.branch_id)
      )
    )
  );

-- 픽업 신청: 본인 읽기/생성
CREATE POLICY "applications_own_read" ON pickup_applications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "applications_insert" ON pickup_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "applications_own_cancel" ON pickup_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'confirmed')
  WITH CHECK (status = 'cancelled');

-- 지점 어드민: 자기 지점 신청 전체 관리
CREATE POLICY "applications_branch_admin" ON pickup_applications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid() AND (
        role = 'master' OR
        (role = 'branch' AND branch_id = pickup_applications.branch_id)
      )
    )
  );

-- 픽업 회차: 인증 사용자 읽기
CREATE POLICY "rounds_read" ON pickup_rounds
  FOR SELECT TO authenticated USING (true);

-- 회차 어드민 관리
CREATE POLICY "rounds_admin_write" ON pickup_rounds
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid() AND (
        role = 'master' OR
        (role = 'branch' AND branch_id = pickup_rounds.branch_id)
      )
    )
  );

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX idx_products_branch ON products(branch_id);
CREATE INDEX idx_products_round ON products(round_id);
CREATE INDEX idx_applications_user ON pickup_applications(user_id);
CREATE INDEX idx_applications_branch ON pickup_applications(branch_id);
CREATE INDEX idx_applications_round ON pickup_applications(round_id);
CREATE INDEX idx_applications_status ON pickup_applications(status);
CREATE INDEX idx_rounds_branch ON pickup_rounds(branch_id);
CREATE INDEX idx_rounds_date ON pickup_rounds(pickup_date);


-- =============================================
-- v3 업데이트: 보안 강화
-- =============================================

-- user_profiles에 추가 컬럼
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64),           -- 전화번호 검색용 HMAC 해시
  ADD COLUMN IF NOT EXISTS privacy_agreed_at TIMESTAMPTZ,   -- 개인정보 동의 일시
  ADD COLUMN IF NOT EXISTS service_agreed_at TIMESTAMPTZ;   -- 서비스 이용약관 동의 일시

-- phone_hash 인덱스 (현장 조회 성능)
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_hash ON user_profiles(phone_hash);

-- 기존 phone 인덱스는 유지 (암호화된 값 저장용)
-- 실제 검색은 phone_hash로 수행

-- pickup_applications에 되돌리기 이력 컬럼 추가
ALTER TABLE pickup_applications
  ADD COLUMN IF NOT EXISTS reverted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reverted_by UUID REFERENCES admins(id);

-- 어드민 접근 로그 테이블 (보안 감사)
CREATE TABLE IF NOT EXISTS admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id),
  action VARCHAR(50) NOT NULL,       -- 'search_phone', 'mark_pickup', 'mark_noshow', 'revert'
  target_user_id UUID,
  application_id UUID,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_admin ON admin_access_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON admin_access_logs(created_at);
