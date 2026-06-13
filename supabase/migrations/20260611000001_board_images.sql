-- board_posts 에 이미지 URL 배열 컬럼 추가
ALTER TABLE board_posts
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Storage 버킷 생성 (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('board-images', 'board-images', true)
ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자는 업로드 가능
CREATE POLICY "board_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'board-images');

-- 누구나 읽기 가능 (public 버킷)
CREATE POLICY "board_images_select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'board-images');

-- 본인 파일만 삭제 가능
CREATE POLICY "board_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'board-images' AND auth.uid()::text = (storage.foldername(name))[1]);
