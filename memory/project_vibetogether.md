---
name: project-vibetogether-status
description: 같이바코할사람 프로젝트 현재 상태와 구현된 기능 목록 (2026-06-10 기준)
metadata:
  type: project
---

바이브코딩 모각작 모임 커뮤니티 웹서비스. Vite + React + Supabase + Tailwind CSS.

**Why:** 런칭 전 기능 구멍 메우기 작업 완료.

**구현 완료된 것 (2026-06-10):**
- Toast 시스템 (`src/components/Toast.tsx`, `useToast` hook) — App.tsx에서 ToastProvider로 감쌈
- ConfirmModal 컴포넌트 (`src/components/ConfirmModal.tsx`) — 삭제 확인 모달
- 모임/게시글/쇼케이스 수정 (`/meetup/:id/edit`, `/board/:id/edit`, `/showcase/:id/edit`) — MeetupEditScreen, BoardPostEditScreen, ShowcaseEditScreen 생성
- 모임/게시글/쇼케이스 삭제 — DotsMenu "삭제하기" → ConfirmModal → delete API 호출
- 댓글/대댓글 삭제 — 내 댓글에만 휴지통 아이콘 표시 (3개 detail screen 모두)
- OG 메타태그 — index.html에 og:*, twitter:* 추가, lang="ko" 변경
- 알림 벨 실데이터 연결 — `src/api/notifications.ts` (meetup_applications 기반 파생), Layout.tsx에서 dropdown 열릴 때 fetch, localStorage로 read 상태 관리
- showcase API에 updateShowcase 추가
- MyPageScreen에 AI 툴/직업 수정 이미 구현되어 있음 (ProfileEditor 컴포넌트)
- ShowcaseScreen에 empty state 이미 구현되어 있음

**아직 미구현:**
- MeetupNewScreen submit — TODO 주석만 있음, createMeetup API는 존재하나 UI에서 미호출
- BoardPostNewScreen submit — 동일
- RLS 설정 검증 — DB 직접 접근 필요
- og-image.png 실제 이미지 파일 — /public/og-image.png 없음 (태그는 추가됨)
- 모임 마감 자동화 (현재 MeetupEditScreen에서 수동으로 status 토글 가능)

**How to apply:** 새 기능 추가 시 위 구현된 Toast/ConfirmModal 재사용. 새 edit screen은 `/screens/MeetupEditScreen.tsx` 패턴 참고.
