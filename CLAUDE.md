# CLAUDE.md — 같이바코할사람

Claude Code(및 Codex 등 AI 코딩 도구)가 이 파일을 읽고 프로젝트 컨텍스트를 파악한다.
동반 문서: `prd.md`, `design.md`, `flow-tasks.md`

---

## 서비스 한 줄 요약

바이브코딩하는 사람들이 동네에서 모각작 모임을 열고 참여하는 **웹 서비스**.
배포: https://vibetogether.vercel.app

---

## 기술 스택

| 레이어 | 패키지 | 버전 | 비고 |
|---|---|---|---|
| 플랫폼 | Vite + React | ^6 / ^19 | 순수 웹앱, 앱인토스 아님 |
| 라우팅 | react-router-dom | ^7 | Data API(loader/action) 미사용 |
| 스타일링 | tailwindcss | ^4 | @tailwindcss/vite 플러그인 사용 |
| 백엔드/DB | @supabase/supabase-js | ^2 | Auth + DB + Realtime 전담 |
| 인증 | Google OAuth | — | Supabase Auth로 연동, 토스 로그인 아님 |
| 이메일 알림 | Resend | — | Supabase Edge Function에서 호출 |
| 날짜 피커 | react-day-picker | ^10 | |
| 배포 | Vercel | — | `main` 브랜치 push → 자동 배포 |
| 지도 | 네이버 지도 웹 SDK v3 | — | **2차 MVP 예정, 현재 미구현** |

---

## 코드 패턴

- **Supabase 클라이언트**: `src/lib/supabase.ts` → `import { supabase } from "../lib/supabase"`
- **API 레이어**: `src/api/*.ts` — Supabase 직접 호출. React에서 fetch 직접 사용 금지
- **인증 상태**: `src/contexts/UserContext.tsx` → `useUser()` 훅으로 `session`, `profile` 접근
- **로그인 강제**: `src/hooks/useRequireAuth.ts` → `requireAuth(callback)` 패턴
- **라우팅**: `App.tsx`에서 react-router-dom v7 `<Routes>` 사용
- **실시간 업데이트**: Supabase Realtime `postgres_changes` 구독 — `FeedScreen`, `HomeScreen`, `BoardScreen`에서 사용 중

---

## 화면 목록 및 라우트

### 인증 / 온보딩 (Layout 없음)

| 경로 | 컴포넌트 | 설명 |
|---|---|---|
| `/login` | LoginScreen | Google OAuth 로그인 |
| `/auth/callback` | AuthCallbackScreen | OAuth 콜백 처리 → 온보딩 or 홈으로 리다이렉트 |
| `/onboarding/nickname` | OnboardingNicknameScreen | 닉네임 설정 (중복 검사) |
| `/onboarding/aitools` | OnboardingAIToolsScreen | 사용 AI 도구 선택 |
| `/onboarding/job` | OnboardingJobScreen | 직업 선택 → 완료 시 `/meetup`으로 이동 |

### 공개 라우트 (Layout 적용, 로그인 없이 접근 가능)

| 경로 | 컴포넌트 | 설명 |
|---|---|---|
| `/home` | **FeedScreen** | **홈 통합 피드**: 최신 모임 + 게시판 글 + 프로덕트 혼합 노출. Supabase Realtime 구독 |
| `/meetup` | **HomeScreen** | **모임 목록**: 모임만 필터링. 지역 필터 칩 + 최신순/임박순 정렬. Supabase Realtime 구독 |
| `/meetup/:id` | MeetupDetailScreen | 모임 상세 + 자유 댓글/대댓글 |
| `/board` | BoardScreen | 게시판 목록. 카테고리 필터 + 정렬. Supabase Realtime 구독 |
| `/board/:id` | BoardPostDetailScreen | 게시물 상세 + 댓글 |
| `/product` | ProductScreen | 프로덕트(쇼케이스) 목록 |
| `/product/:id` | ProductDetailScreen | 프로덕트 상세 + 댓글 |
| `/user/:nickname` | UserProfileScreen | 타유저 프로필 |
| `/about` | AboutScreen | 서비스 소개 |
| `/search` | SearchScreen | 검색 |
| `/notice` | NoticeScreen | 공지사항 목록 |
| `/notice/:id` | NoticeDetailScreen | 공지사항 상세 |

### 로그인 필요 라우트 (AuthGuard + Layout 적용)

| 경로 | 컴포넌트 | 설명 |
|---|---|---|
| `/meetup/new` | MeetupNewScreen | 모임 등록 |
| `/meetup/:id/edit` | MeetupEditScreen | 모임 수정 (호스트 전용) |
| `/meetup/:id/applications` | ApplicationsScreen | 신청자 관리 (호스트 전용) |
| `/board/new` | BoardPostNewScreen | 게시글 작성 |
| `/board/:id/edit` | BoardPostEditScreen | 게시글 수정 |
| `/product/new` | ProductNewScreen | 프로덕트 등록 |
| `/product/:id/edit` | ProductEditScreen | 프로덕트 수정 |
| `/mypage` | MyPageScreen | 마이페이지 |
| `/notice/new` | NoticeNewScreen | 공지 작성 (관리자 전용) |

### 기본 리다이렉트
- 미매칭 경로(`*`) → `/home`
- 로그인 후 → `/meetup` (AuthCallbackScreen 기준)
- 온보딩 완료 후 → `/meetup`

---

## 레이아웃 구조

- **탑 네비바**: "같이바코할사람" 로고(좌) + 알림 벨(우)
- **사이드바 (desktop, w-64 고정)**: 탭 4개(홈/모임/게시판/프로덕트) + 보조 링크(공지사항/문의/서비스소개) + FAB(등록하기) + 프로필
  - hover 확장 없음 — 항상 256px 고정 표시
- **하단 탭바 (mobile)**: 동일 4탭
- **콘텐츠 영역**: 폼 페이지는 `bg-white`, 나머지는 `bg-[#fafbfb]`
  - `/home`은 `max-width` 제한 없음 (풀 레이아웃)
  - 그 외 대부분 `max-width: 800px`

### 탭별 FAB(등록하기) 동작

| 현재 경로 | FAB 라벨 | FAB 이동 경로 |
|---|---|---|
| `/home` | 모임 등록하기 | `/meetup/new` |
| `/meetup` | 모임 등록하기 | `/meetup/new` |
| `/board` | 글쓰기 | `/board/new` |
| `/product` | 프로젝트 등록 | `/product/new` |

---

## DB 스키마 (Supabase)

```sql
-- profiles (Supabase auth.users와 연결)
id (= auth.users.id), nickname (unique), region, lat, lng,
job_role, ai_tools TEXT[], avatar_url, created_at
-- email은 auth.users.email 사용 (별도 저장 안 함)

-- meetups
id, host_id → profiles, title, description, place_name, lat, lng,
start_at, capacity, region, status (open/closed), view_count (default 0), created_at

-- meetup_applications
id, meetup_id → meetups, user_id → profiles,
status (pending | accepted | rejected) default 'pending',
created_at
UNIQUE(meetup_id, user_id)

-- comments (모임 댓글)
id, meetup_id → meetups, user_id → profiles,
parent_id → comments (nullable, 대댓글),
content, created_at

-- board_posts
id, user_id → profiles, title, content, category,
view_count (default 0), comment_count (default 0), created_at

-- board_comments
id, post_id → board_posts, user_id → profiles,
parent_id → board_comments (nullable),
content, created_at

-- showcase (프로덕트)
id, user_id → profiles, title, description, short_description,
service_url, sns_url, icon_url, tags TEXT[],
like_count, save_count, view_count, created_at

-- showcase_likes
id, showcase_id → showcase, user_id → profiles, created_at
UNIQUE(showcase_id, user_id)

-- showcase_saves
id, showcase_id → showcase, user_id → profiles, created_at
UNIQUE(showcase_id, user_id)

-- notifications
id, user_id → profiles, type, title, body, read (bool), created_at

-- notices
id, title, content, created_at
```

---

## 신청 흐름 (MeetupApplication)

1. 비호스트 유저가 모임 상세에서 "신청하기" 클릭 → `status: pending` 레코드 생성
2. 호스트가 `/meetup/:id/applications`에서 수락/거절
3. 수락 시: `status: accepted` + Resend로 신청자에게 이메일 발송
4. 정원(`capacity`) 도달 시 신청 버튼 비활성화(마감)

---

## 이메일 알림 (Resend via Supabase Edge Function)

| 트리거 | 수신자 | 내용 |
|---|---|---|
| 모임에 댓글 달릴 때 | 모임 호스트 | `"'{모임 제목}'에 새 댓글이 달렸어요"` |
| 호스트가 신청 수락할 때 | 신청자 | `"'{모임 제목}' 참가 신청이 수락됐어요. 호스트 이메일: {host_email}"` |

- 환경변수: `RESEND_API_KEY` (Supabase Edge Function 환경)

---

## 핵심 결정사항

- 닉네임 **중복 불가** (고유값), 마이페이지에서 수정 가능
- 댓글은 **자유 댓글 + 대댓글** 지원 — 참여 카운트와 무관
- 모집 인원은 **목표 표시값** (실시간 카운트·하드 마감 없음)
- 비로그인도 콘텐츠 **열람 가능** — 작성/신청은 로그인 필요
- **좋아요 없음** (모임/게시물) — 조회수 + 댓글 수만 표시
- **지도뷰 없음** (현재) — 2차 MVP에서 네이버 지도 웹 SDK v3 추가 예정

---

## 2차 MVP 예정

- **지도뷰**: `/meetup`에서 지도/리스트 토글 (네이버 지도 웹 SDK v3)

---

## 주의사항

- Supabase Auth — `auth.users.id`가 profiles 테이블 PK
- RLS 필수 — 본인 데이터만 수정 가능
- `.env.local` GitHub 커밋 금지
- 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `RESEND_API_KEY`
- 지역 데이터: `src/lib/regions.ts`의 `ALL_REGIONS` 배열 사용 (전국 행정동 기준)
