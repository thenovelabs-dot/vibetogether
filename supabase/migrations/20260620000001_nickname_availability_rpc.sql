CREATE OR REPLACE FUNCTION is_nickname_available(p_nickname TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM users WHERE nickname = p_nickname);
$$;
