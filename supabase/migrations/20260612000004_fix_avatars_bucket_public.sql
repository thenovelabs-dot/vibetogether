-- avatars 버킷을 확실히 public으로 설정
-- ON CONFLICT DO NOTHING 때문에 기존 버킷이 private으로 남아있을 수 있음
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif'];

-- Public read 정책이 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read avatars'
  ) THEN
    EXECUTE 'CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = ''avatars'')';
  END IF;
END $$;
