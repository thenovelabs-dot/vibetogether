-- ── 1. accepted_count 컬럼 + 트리거 ─────────────────────────────
-- RLS 제약으로 일반 유저는 meetup_applications를 자신의 행만 볼 수 있어
-- 조인으로 카운트를 계산하면 0이나 1만 반환됨. 트리거로 직접 관리한다.

ALTER TABLE meetups ADD COLUMN IF NOT EXISTS accepted_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION sync_accepted_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'accepted' THEN
      UPDATE meetups SET accepted_count = accepted_count + 1 WHERE id = NEW.meetup_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status <> 'accepted' AND NEW.status = 'accepted' THEN
      UPDATE meetups SET accepted_count = accepted_count + 1 WHERE id = NEW.meetup_id;
    ELSIF OLD.status = 'accepted' AND NEW.status <> 'accepted' THEN
      UPDATE meetups SET accepted_count = GREATEST(accepted_count - 1, 0) WHERE id = OLD.meetup_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'accepted' THEN
      UPDATE meetups SET accepted_count = GREATEST(accepted_count - 1, 0) WHERE id = OLD.meetup_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_accepted_count ON meetup_applications;
CREATE TRIGGER trg_sync_accepted_count
AFTER INSERT OR UPDATE OF status OR DELETE ON meetup_applications
FOR EACH ROW EXECUTE FUNCTION sync_accepted_count();


-- ── 2. meetup_applications UPDATE 정책 추가 ──────────────────────
-- 호스트가 상태를 변경할 수 있어야 거절이 작동함.
-- (수락은 Edge Function이 service role로 처리하지만 거절은 직접 UPDATE)

DROP POLICY IF EXISTS "applications_update" ON meetup_applications;
CREATE POLICY "applications_update" ON meetup_applications
  FOR UPDATE TO authenticated
  USING  (auth.uid() IN (SELECT host_id FROM meetups WHERE id = meetup_id))
  WITH CHECK (auth.uid() IN (SELECT host_id FROM meetups WHERE id = meetup_id));


-- ── 3. users 테이블에서 email 제거 ────────────────────────────────
-- spec: "email은 auth.users.email 사용 (별도 저장 안 함)"
-- 현재 SELECT 정책이 모든 인증 유저에게 전체 행을 허용하므로
-- 이메일이 컬럼에 있으면 누구나 조회 가능. 컬럼 자체를 제거한다.

ALTER TABLE users DROP COLUMN IF EXISTS email;

-- 자신의 이메일이 필요한 경우(Edge Function 외부에서) 사용할 함수
CREATE OR REPLACE FUNCTION get_my_email()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;
