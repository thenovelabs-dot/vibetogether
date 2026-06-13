-- users 테이블에 email 컬럼 재추가
-- accept-application, notify-application edge function에서 host/applicant 이메일 표시에 사용
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
