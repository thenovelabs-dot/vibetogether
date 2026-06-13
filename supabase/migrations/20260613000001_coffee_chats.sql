CREATE TABLE coffee_chats (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  -- 수락 시 edge function이 채워줌 (이메일 직접 노출 없이 양방향 공개용)
  requester_email TEXT,
  recipient_email TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, recipient_id),
  CHECK(requester_id <> recipient_id)
);

ALTER TABLE coffee_chats ENABLE ROW LEVEL SECURITY;

-- 본인이 requester 또는 recipient인 경우만 조회
CREATE POLICY "coffee_chats_select" ON coffee_chats
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- 신청은 본인이 requester여야 함 (자기 자신 신청 불가는 CHECK로 처리)
CREATE POLICY "coffee_chats_insert" ON coffee_chats
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- RPC: 커피챗 신청 (중복 방지 + 자기 자신 방지)
CREATE OR REPLACE FUNCTION request_coffee_chat(p_recipient_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF auth.uid() = p_recipient_id THEN RAISE EXCEPTION 'cannot_self_request'; END IF;

  INSERT INTO coffee_chats (requester_id, recipient_id)
  VALUES (auth.uid(), p_recipient_id)
  RETURNING id INTO v_id;

  RETURN v_id;
EXCEPTION
  WHEN unique_violation THEN RAISE EXCEPTION 'already_requested';
END;
$$;
