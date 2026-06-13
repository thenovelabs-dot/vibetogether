-- ── showcase → product 테이블 rename ─────────────────────────────

ALTER TABLE showcases         RENAME TO products;
ALTER TABLE showcase_likes    RENAME TO product_likes;
ALTER TABLE showcase_saves    RENAME TO product_saves;
ALTER TABLE showcase_comments RENAME TO product_comments;

-- 컬럼명 수정
ALTER TABLE product_likes    RENAME COLUMN showcase_id TO product_id;
ALTER TABLE product_saves    RENAME COLUMN showcase_id TO product_id;
ALTER TABLE product_comments RENAME COLUMN showcase_id TO product_id;

-- RPC 함수명 수정
ALTER FUNCTION increment_showcase_view(uuid) RENAME TO increment_product_view;
