-- Fix sync functions to use renamed table/column after showcase→product rename

CREATE OR REPLACE FUNCTION sync_showcase_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET like_count = like_count + 1 WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION sync_showcase_save_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET save_count = save_count + 1 WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$;
