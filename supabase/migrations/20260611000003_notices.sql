CREATE TABLE IF NOT EXISTS notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
CREATE POLICY "notices_select" ON notices FOR SELECT TO anon, authenticated USING (true);

-- 로그인 사용자만 등록 (UI에서 관리자 여부 추가 체크)
CREATE POLICY "notices_insert" ON notices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notices_delete" ON notices FOR DELETE TO authenticated USING (true);
