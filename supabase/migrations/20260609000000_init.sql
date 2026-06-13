-- =========================================================
-- 같이바코할사람 — 초기 스키마
-- =========================================================

-- ── 테이블 ────────────────────────────────────────────────

CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  email      TEXT UNIQUE NOT NULL,
  nickname   TEXT UNIQUE NOT NULL,
  region     TEXT NOT NULL DEFAULT '',
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  ai_tools   TEXT[] NOT NULL DEFAULT '{}',
  job_role   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE meetups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  place_name  TEXT NOT NULL,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  start_at    TIMESTAMPTZ NOT NULL,
  capacity    INTEGER NOT NULL DEFAULT 4,
  region      TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  view_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE meetup_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id  UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  parent_id  UUID REFERENCES meetup_comments(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE meetup_applications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id  UUID NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meetup_id, user_id)
);

CREATE TABLE board_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT '일반',
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE board_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  parent_id  UUID REFERENCES board_comments(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE showcases (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  title              TEXT NOT NULL,
  short_description  TEXT NOT NULL DEFAULT '',
  detail_description TEXT,
  icon_url           TEXT,
  gallery_url        TEXT,
  service_url        TEXT,
  sns_url            TEXT,
  tags               TEXT[] NOT NULL DEFAULT '{}',
  service_category   TEXT NOT NULL DEFAULT '기타',
  ai_tools           TEXT[] NOT NULL DEFAULT '{}',
  launch_date        TEXT,
  like_count         INTEGER NOT NULL DEFAULT 0,
  save_count         INTEGER NOT NULL DEFAULT 0,
  view_count         INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE showcase_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (showcase_id, user_id)
);

CREATE TABLE showcase_saves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (showcase_id, user_id)
);

CREATE TABLE showcase_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  parent_id   UUID REFERENCES showcase_comments(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── view_count 증가 함수 (RLS 우회용) ──────────────────────

CREATE OR REPLACE FUNCTION increment_meetup_view(meetup_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE meetups SET view_count = view_count + 1 WHERE id = meetup_id;
$$;

CREATE OR REPLACE FUNCTION increment_board_view(post_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE board_posts SET view_count = view_count + 1 WHERE id = post_id;
$$;

CREATE OR REPLACE FUNCTION increment_showcase_view(showcase_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE showcases SET view_count = view_count + 1 WHERE id = showcase_id;
$$;

-- ── showcase like/save 카운트 트리거 ──────────────────────

CREATE OR REPLACE FUNCTION sync_showcase_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE showcases SET like_count = like_count + 1 WHERE id = NEW.showcase_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE showcases SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.showcase_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION sync_showcase_save_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE showcases SET save_count = save_count + 1 WHERE id = NEW.showcase_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE showcases SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.showcase_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_showcase_like_count
AFTER INSERT OR DELETE ON showcase_likes
FOR EACH ROW EXECUTE FUNCTION sync_showcase_like_count();

CREATE TRIGGER trg_showcase_save_count
AFTER INSERT OR DELETE ON showcase_saves
FOR EACH ROW EXECUTE FUNCTION sync_showcase_save_count();

-- ── RLS 활성화 ────────────────────────────────────────────

ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups              ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcase_likes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcase_saves       ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcase_comments    ENABLE ROW LEVEL SECURITY;

-- ── RLS 정책 ─────────────────────────────────────────────

-- users
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- meetups
CREATE POLICY "meetups_select" ON meetups FOR SELECT TO authenticated USING (true);
CREATE POLICY "meetups_insert" ON meetups FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "meetups_update" ON meetups FOR UPDATE TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "meetups_delete" ON meetups FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- meetup_comments
CREATE POLICY "meetup_comments_select" ON meetup_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "meetup_comments_insert" ON meetup_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meetup_comments_delete" ON meetup_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- meetup_applications
CREATE POLICY "applications_select" ON meetup_applications FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT host_id FROM meetups WHERE id = meetup_id)
  );
CREATE POLICY "applications_insert" ON meetup_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "applications_delete" ON meetup_applications FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- board_posts
CREATE POLICY "board_posts_select" ON board_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "board_posts_insert" ON board_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "board_posts_update" ON board_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "board_posts_delete" ON board_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- board_comments
CREATE POLICY "board_comments_select" ON board_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "board_comments_insert" ON board_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "board_comments_delete" ON board_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- showcases
CREATE POLICY "showcases_select" ON showcases FOR SELECT TO authenticated USING (true);
CREATE POLICY "showcases_insert" ON showcases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "showcases_update" ON showcases FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "showcases_delete" ON showcases FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- showcase_likes
CREATE POLICY "showcase_likes_select" ON showcase_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "showcase_likes_insert" ON showcase_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "showcase_likes_delete" ON showcase_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- showcase_saves
CREATE POLICY "showcase_saves_select" ON showcase_saves FOR SELECT TO authenticated USING (true);
CREATE POLICY "showcase_saves_insert" ON showcase_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "showcase_saves_delete" ON showcase_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- showcase_comments
CREATE POLICY "showcase_comments_select" ON showcase_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "showcase_comments_insert" ON showcase_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "showcase_comments_delete" ON showcase_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
