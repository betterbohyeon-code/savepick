-- supabase/functions.sql
-- 마스터 대시보드 통계 RPC 함수

CREATE OR REPLACE FUNCTION get_master_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_applications', COUNT(pa.id),
    'total_picked_up',    COUNT(CASE WHEN pa.status = 'picked_up' THEN 1 END),
    'total_no_show',      COUNT(CASE WHEN pa.status = 'no_show' THEN 1 END),
    'total_confirmed',    COUNT(CASE WHEN pa.status = 'confirmed' THEN 1 END),
    'branches', (
      SELECT json_agg(
        json_build_object(
          'branch_id',         b.id,
          'branch_name',       b.name,
          'total_products',    COALESCE(p_count.cnt, 0),
          'total_applications',COALESCE(a_stats.total, 0),
          'confirmed',         COALESCE(a_stats.confirmed, 0),
          'picked_up',         COALESCE(a_stats.picked_up, 0),
          'no_show',           COALESCE(a_stats.no_show, 0),
          'no_show_rate', CASE
            WHEN COALESCE(a_stats.total, 0) = 0 THEN 0
            ELSE ROUND(COALESCE(a_stats.no_show, 0)::NUMERIC / a_stats.total * 100, 1)
          END
        )
      )
      FROM branches b
      LEFT JOIN (
        SELECT branch_id, COUNT(*) as cnt
        FROM products
        WHERE is_active = true
        GROUP BY branch_id
      ) p_count ON p_count.branch_id = b.id
      LEFT JOIN (
        SELECT
          branch_id,
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'picked_up' THEN 1 END) as picked_up,
          COUNT(CASE WHEN status = 'no_show'   THEN 1 END) as no_show
        FROM pickup_applications
        GROUP BY branch_id
      ) a_stats ON a_stats.branch_id = b.id
      WHERE b.is_active = true
    )
  ) INTO result
  FROM pickup_applications pa;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 마스터 관리자만 호출 가능
REVOKE ALL ON FUNCTION get_master_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_master_dashboard_stats() TO authenticated;


-- ============================================
-- 픽업코드로 신청 조회 함수 (지점 관리자용)
-- ============================================
CREATE OR REPLACE FUNCTION get_application_by_code(p_code TEXT)
RETURNS TABLE (
  id UUID,
  pickup_code TEXT,
  status TEXT,
  user_name TEXT,
  user_phone TEXT,
  product_name TEXT,
  quantity INTEGER,
  branch_name TEXT,
  pickup_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.id,
    pa.pickup_code,
    pa.status::TEXT,
    up.name::TEXT as user_name,
    up.phone::TEXT as user_phone,
    p.name::TEXT as product_name,
    pa.quantity,
    b.name::TEXT as branch_name,
    pr.pickup_date
  FROM pickup_applications pa
  JOIN user_profiles up ON up.id = pa.user_id
  JOIN products p ON p.id = pa.product_id
  JOIN branches b ON b.id = pa.branch_id
  LEFT JOIN pickup_rounds pr ON pr.id = pa.round_id
  WHERE pa.pickup_code = UPPER(p_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_application_by_code(TEXT) TO authenticated;


-- ============================================
-- 노쇼율 기반 고객 조회 (마스터용)
-- ============================================
CREATE OR REPLACE FUNCTION get_high_risk_users(min_penalty INTEGER DEFAULT 2)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_phone TEXT,
  penalty_count INTEGER,
  is_banned BOOLEAN,
  last_no_show_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.name::TEXT,
    up.phone::TEXT,
    up.penalty_count,
    up.is_banned,
    MAX(pa.no_show_at) as last_no_show_at
  FROM user_profiles up
  LEFT JOIN pickup_applications pa ON pa.user_id = up.id AND pa.status = 'no_show'
  WHERE up.penalty_count >= min_penalty
  GROUP BY up.id, up.name, up.phone, up.penalty_count, up.is_banned
  ORDER BY up.penalty_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_high_risk_users(INTEGER) TO authenticated;
