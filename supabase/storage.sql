-- supabase/storage.sql
-- Storage 버킷 및 정책 설정

-- 상품 이미지 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,           -- 공개 버킷 (CDN 제공)
  5242880,        -- 5MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- 관리자만 업로드/삭제 가능
CREATE POLICY "admin_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM admins
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- 모든 인증 사용자 읽기 가능 (public 버킷이므로 사실상 불필요하지만 명시)
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'product-images');
