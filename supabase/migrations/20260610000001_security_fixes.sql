-- ── 1. accepted_count 기존 데이터 backfill ───────────────────────
-- 컬럼 추가 후 기존 행의 값이 0으로 남아 있으므로 실제 수락 수로 채운다.
UPDATE meetups m
SET accepted_count = (
  SELECT COUNT(*) FROM meetup_applications
  WHERE meetup_id = m.id AND status = 'accepted'
);


-- ── 2. 잘못된 UPDATE 정책 제거 ────────────────────────────────────
-- 이 정책은 호스트가 브라우저에서 직접 status=accepted 로 업데이트해
-- Edge Function의 정원 검사를 우회할 수 있게 한다.
DROP POLICY IF EXISTS "applications_update" ON meetup_applications;


-- ── 3. 거절 전용 RPC (호스트만 호출 가능) ────────────────────────
-- 수락은 accept-application Edge Function이 처리하고,
-- 거절은 이 RPC만 허용해 상태 변경 경로를 제한한다.
CREATE OR REPLACE FUNCTION reject_application(p_app_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_meetup_id UUID;
  v_host_id   UUID;
BEGIN
  SELECT meetup_id INTO v_meetup_id
  FROM meetup_applications
  WHERE id = p_app_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'application_not_found_or_not_pending';
  END IF;

  SELECT host_id INTO v_host_id
  FROM meetups WHERE id = v_meetup_id;

  IF v_host_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_host';
  END IF;

  UPDATE meetup_applications
  SET status = 'rejected'
  WHERE id = p_app_id;
END;
$$;


-- ── 4. 신청 RPC (서버에서 조건 검증 후 INSERT) ────────────────────
-- 클라이언트가 직접 INSERT하면 마감/정원 초과/지난 모임에도 신청 가능.
CREATE OR REPLACE FUNCTION apply_to_meetup(p_meetup_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_meetup meetups%ROWTYPE;
BEGIN
  SELECT * INTO v_meetup FROM meetups WHERE id = p_meetup_id FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'meetup_not_found';
  END IF;

  IF v_meetup.status <> 'open' THEN
    RAISE EXCEPTION 'meetup_closed';
  END IF;

  IF v_meetup.accepted_count >= v_meetup.capacity THEN
    RAISE EXCEPTION 'meetup_full';
  END IF;

  IF v_meetup.start_at < now() THEN
    RAISE EXCEPTION 'meetup_expired';
  END IF;

  IF EXISTS (
    SELECT 1 FROM meetup_applications
    WHERE meetup_id = p_meetup_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'already_applied';
  END IF;

  INSERT INTO meetup_applications (meetup_id, user_id)
  VALUES (p_meetup_id, auth.uid());
END;
$$;


-- ── 5. 수락 원자적 RPC (Edge Function에서 service role로 호출) ─────
-- 정원 조회와 status 업데이트를 단일 트랜잭션으로 처리해 경쟁 조건 제거.
CREATE OR REPLACE FUNCTION accept_application_atomic(p_app_id UUID, p_caller_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_app    meetup_applications%ROWTYPE;
  v_meetup meetups%ROWTYPE;
BEGIN
  SELECT * INTO v_app
  FROM meetup_applications
  WHERE id = p_app_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'application_not_found';
  END IF;

  IF v_app.status <> 'pending' THEN
    RAISE EXCEPTION 'not_pending';
  END IF;

  SELECT * INTO v_meetup
  FROM meetups WHERE id = v_app.meetup_id
  FOR UPDATE;

  IF v_meetup.host_id IS DISTINCT FROM p_caller_id THEN
    RAISE EXCEPTION 'not_host';
  END IF;

  IF v_meetup.accepted_count >= v_meetup.capacity THEN
    RAISE EXCEPTION 'meetup_full';
  END IF;

  UPDATE meetup_applications
  SET status = 'accepted'
  WHERE id = p_app_id;
END;
$$;
