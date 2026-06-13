-- 비로그인 사용자도 공개 콘텐츠를 읽을 수 있도록 RLS 정책 추가

-- users (프로필 공개)
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users FOR SELECT TO anon, authenticated USING (true);

-- meetups
DROP POLICY IF EXISTS "meetups_select" ON meetups;
CREATE POLICY "meetups_select" ON meetups FOR SELECT TO anon, authenticated USING (true);

-- meetup_comments
DROP POLICY IF EXISTS "meetup_comments_select" ON meetup_comments;
CREATE POLICY "meetup_comments_select" ON meetup_comments FOR SELECT TO anon, authenticated USING (true);

-- meetup_applications: 비로그인은 수락된 신청 수만 볼 수 있음 (카드 n/n명 표시용)
CREATE POLICY "applications_anon_select" ON meetup_applications
  FOR SELECT TO anon USING (status = 'accepted');

-- board_posts
DROP POLICY IF EXISTS "board_posts_select" ON board_posts;
CREATE POLICY "board_posts_select" ON board_posts FOR SELECT TO anon, authenticated USING (true);

-- board_comments
DROP POLICY IF EXISTS "board_comments_select" ON board_comments;
CREATE POLICY "board_comments_select" ON board_comments FOR SELECT TO anon, authenticated USING (true);

-- products (showcase에서 rename됨, policy 이름은 그대로)
DROP POLICY IF EXISTS "showcases_select" ON products;
CREATE POLICY "products_select" ON products FOR SELECT TO anon, authenticated USING (true);

-- product_comments
DROP POLICY IF EXISTS "showcase_comments_select" ON product_comments;
CREATE POLICY "product_comments_select" ON product_comments FOR SELECT TO anon, authenticated USING (true);
