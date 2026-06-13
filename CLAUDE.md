# CLAUDE.md — 같이바코할사람

Claude Code가 이 파일을 읽고 프로젝트 컨텍스트를 파악한다.
동반 문서: `prd.md`, `design.md`, `flow-tasks.md`

---

## 서비스 한 줄 요약
바이브코딩하는 사람들이 동네에서 모각작 모임을 열고 참여하는 **웹 서비스**.

---

## 기술 스택

| 레이어 | 패키지 | 버전 | 비고 |
|---|---|---|---|
| 플랫폼 | vite + react | ^6 / ^19 | 앱인토스 아님, TDS 미사용 |
| 라우팅 | react-router-dom | ^7 | |
| 스타일링 | tailwindcss | ^4 | @tailwindcss/vite 플러그인 사용 |
| 백엔드/DB | @supabase/supabase-js | ^2 | Auth 포함, 서버 역할 전담 |
| 인증 | Google OAuth | — | Supabase Auth로 연동 |
| 날짜 피커 | react-day-picker | ^10 | |
| 지도 | 네이버 지도 웹 SDK v3 | — | 2차 MVP |
| 이메일 알림 | Resend | — | Supabase Edge Function에서 호출 |

### 코드 패턴

- **Supabase 클라이언트**: `src/lib/supabase.ts`에서 `import { supabase } from "../lib/supabase"` 로 사용
- **API 레이어**: `src/api/*.ts` — Supabase를 직접 호출, React에서 직접 fetch 쓰지 않음
- **인증 상태**: `src/contexts/UserContext.tsx` → `useUser()` 훅으로 `session`, `profile` 접근
- **로그인 강제**: `src/hooks/useRequireAuth.ts` → `requireAuth(callback)` 패턴
- **라우팅**: `App.tsx`에서 react-router-dom v7 `<Routes>` 사용, Data API(loader/action) 미사용

---

## 핵심 결정사항 (변경 시 prd.md도 함께 수정)

- 닉네임 **중복 불가** (고유값), 마이페이지에서 수정 가능
- 댓글은 **자유 댓글 + 대댓글** 지원 — 댓글 달릴 때마다 호스트에게 이메일 알림
- 모집 인원은 **목표 표시값** (실시간 카운트·마감 없음)
- 비로그인 열람 없음 — Google 로그인 필수
- 시드 지역: 서울 강남·성수·판교 인접
- **좋아요 없음** — 모임 상세·게시물 상세에서 제거, 조회수만 표시
- 모임 카드·게시물 카드에서는 조회수 + 댓글 수 표시

---

## 화면 목록

### 인증/온보딩
| 경로 | 화면 |
|---|---|
| `/login` | 로그인 (Google OAuth) |
| `/auth/callback` | OAuth 콜백 처리 |
| `/onboarding/nickname` | 닉네임 설정 |
| `/onboarding/aitools` | 사용 AI 도구 선택 |
| `/onboarding/job` | 직업 선택 |

### 메인 (Layout 공통 적용)
| 경로 | 화면 |
|---|---|
| `/home` | 홈 — 모임 목록 (게시판뷰) |
| `/meetup/new` | 모임 등록 (로그인 필요) |
| `/meetup/:id` | 모임 상세 + 댓글 |
| `/meetup/:id/applications` | 신청자 관리 (호스트 전용) |
| `/board` | 게시판 목록 |
| `/board/new` | 글쓰기 (로그인 필요) |
| `/board/:id` | 게시물 상세 + 댓글 |
| `/showcase` | 프로덕트 목록 |
| `/showcase/new` | 프로젝트 등록 (로그인 필요) |
| `/showcase/:id` | 프로젝트 상세 + 댓글 |
| `/mypage` | 마이페이지 (로그인 필요) |
| `/user/:nickname` | 타유저 프로필 |

---

## 레이아웃 구조

- **탑 네비바**: "같이바코할사람" 로고 + 알림 벨 (우측)
- **사이드바 (desktop, 256px)**: 모임 / 게시판 / 프로덕트 / 프로필 탭 + 하단 FAB (등록하기)
- **하단 탭바 (mobile)**: 동일 4탭
- **콘텐츠 영역**: `max-width: 800px`, 폼 페이지는 `bg-white`, 나머지는 `bg-[#fafbfb]`

---

## DB 스키마 (Supabase)

```sql
-- User (Supabase Auth users 테이블과 연결)
id (= auth.users.id), nickname (unique), region, lat, lng, created_at
-- email은 auth.users.email 사용 (별도 저장 안 함)

-- Meetup
id, host_id → User, title, description, place_name, lat, lng,
start_at, capacity, region, status (open/closed), view_count (default 0), created_at

-- Comment
id, meetup_id → Meetup, user_id → User,
parent_id → Comment (nullable, 대댓글용),
content, created_at

-- MeetupApplication (모임 신청)
id, meetup_id → Meetup, user_id → User,
status (pending | accepted | rejected) default 'pending',
created_at
UNIQUE(meetup_id, user_id)

-- Showcase (프로젝트/서비스 홍보)
id, user_id → User, title, description,
service_url (nullable), sns_url (nullable),
tags TEXT[] DEFAULT '{}',
like_count INTEGER DEFAULT 0,
save_count INTEGER DEFAULT 0,
created_at

-- ShowcaseLike
id, showcase_id → Showcase, user_id → User, created_at
UNIQUE(showcase_id, user_id)

-- ShowcaseSave
id, showcase_id → Showcase, user_id → User, created_at
UNIQUE(showcase_id, user_id)
```

### 신청 흐름
- 신청자: 신청하기 → pending → 호스트 수락 시 accepted + 호스트 이메일(auth.users.email) 공개
- 호스트: ApplicationsScreen(`/meetup/:id/applications`)에서 수락/거절
- 정원(capacity) 도달 시 신청 버튼 비활성화(마감)
- 수락 처리 시 Resend로 신청자에게 알림 이메일 발송

---

## 이메일 알림 (Resend)

트리거 1 — 댓글:
- 트리거: 모임에 댓글이 달릴 때
- 수신자: 해당 모임의 호스트
- 내용: `"'{모임 제목}'에 새 댓글이 달렸어요"`

트리거 2 — 신청 수락:
- 트리거: 호스트가 신청을 수락할 때
- 수신자: 신청자
- 내용: `"'{모임 제목}' 참가 신청이 수락됐어요. 호스트 이메일: {host_email}"`

- 발신: Resend API (Supabase Edge Function에서 호출)
- 환경변수: `RESEND_API_KEY`

---

## 2차 MVP 예정 (1차 MVP 이후)

- **지도뷰** (홈 화면 지도/게시판 토글 — 네이버 지도 웹 SDK v3)

---

## 주의사항

- Supabase Auth 사용 — `auth.users.id`가 User 테이블 PK
- RLS 필수 설정 — 본인 데이터만 수정 가능하도록
- `.env.local` GitHub 커밋 금지
- 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `RESEND_API_KEY`
