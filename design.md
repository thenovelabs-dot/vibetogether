# design.md — 같이바코할사람

> 동반 문서: CLAUDE.md, prd.md
> TDS **미사용** — 일반 웹(Vite + React + Tailwind CSS)이므로 직접 정의한 토큰 사용

---

## 1. 디자인 방향

- 톤/분위기: 감성적이고 따뜻한 바이브코딩 커뮤니티 — 보라 계열 강조로 차별화
- 키워드: 바이브 · 커뮤니티 · 모각작
- 레퍼런스: 피그마 파일 UGcVHbsEfYaHrxtOqD5lim

---

## 2. 디자인 토큰

### 색상
| 토큰 | 값 | 용도 |
|---|---|---|
| primary | `#ae49fd` | 주요 버튼·강조·링크·required * |
| primary-bg | `#fbf6ff` | primary 필드 포커스 배경 |
| primary-chip | `#f4e5ff` | 선택된 칩 배경 |
| primary-light | `#fdf9ff` | 읽지 않은 알림 배경 |
| background | `#f9fafb` | 입력 필드 기본 배경 |
| surface | `#ffffff` | 카드·모달·네비게이션 |
| page-bg | `#fafbfb` | 콘텐츠 영역 배경 (폼 페이지 제외) |
| text-strong | `#101828` | 제목·선택된 값·사이드바 선택 항목 |
| text-label | `#364153` | 본문·댓글 내용·레이블 |
| text-body | `#2a2d33` | 게시물 본문 |
| text-sub | `#6a7282` | 카드 메타 정보 |
| text-weak | `#636e7f` | 조회수·댓글수 등 보조 숫자 |
| text-hint | `#99a1af` | placeholder·시간 표시 |
| chip-default-bg | `#f1f3f7` | 미선택 칩 배경 |
| chip-default-text | `#898f98` | 미선택 칩 텍스트 |
| chip-selected-bg | `#101828` | 지역 선택된 칩 배경 |
| border | `#f3f4f6` | 구분선·네비게이션 border·카드 하단 구분선 |
| overlay | `rgba(0,0,0,0.4)` | 모달 딤 처리 |
| nav-selected-bg | `#f3f4f6` | 사이드바 선택 항목 배경 |
| avatar-bg | `#ae49fd` | 호스트 아바타 기본 배경 |

### 타이포그래피 (폰트: Pretendard, letter-spacing: -0.32px 전체 공통)
| 역할 | 크기/굵기 | 용도 |
|---|---|---|
| heading | 20px / Bold | 화면 제목 |
| logo | 18px / Bold | 탑바 서비스명 |
| nav-item | 16px / SemiBold | 사이드바 탭 항목 |
| card-title | 16px / SemiBold | 모임 카드 제목 |
| body-bold | 14px / Bold | 강조 본문·버튼 |
| body-sb | 14px / SemiBold | 필드 레이블·칩·닉네임 |
| body-r | 14px / Regular | 본문·댓글 내용 |
| caption-sb | 12px / SemiBold | 카드 하단 호스트명 |
| caption-m | 12px / Medium | 조회수·댓글수·날짜·힌트 |
| tab-label | 10px / SemiBold | 모바일 하단 탭 레이블 |

### 간격 · 모서리
- spacing 단위: 4 / 6 / 8 / 10 / 12 / 16 / 20 / 24 / 32
- card radius: 16px
- input radius: 12px
- button radius: 16px (대형 CTA) · 12px (소형 CTA·FAB·사이드바 탭) · 9999px (칩/pill)
- modal/notification-panel radius: 16px
- 필드 간 gap: 20px (세로) · 12px (가로 나란히)

---

## 3. 아이콘 시스템

- **경로**: `public/icons/*.svg`
- **사용 방식**: 반드시 `<img src="/icons/파일명.svg" width={N} height={N} />` 형태 사용
- **인라인 SVG 금지** — 아이콘은 항상 파일 참조로 통일

### 아이콘 목록
| 파일명 | 용도 |
|---|---|
| `Comment.svg` | 댓글 수 (카드·목록) |
| `Reply.svg` | 대댓글 버튼 |
| `Share.svg` | 공유 버튼 |
| `eye.svg` | 조회수 |
| `heart.svg` | 좋아요 (현재 미사용) |
| `location.svg` | 장소 |
| `calender.svg` | 날짜 |
| `clock.svg` | 시간 |
| `group.svg` | 인원 |
| `community.svg` | 게시판 탭 |
| `profile.svg` | 프로필 탭 |
| `star.svg` | 프로덕트 탭 |
| `bell.svg` | 알림 |
| `plus.svg` | 추가/등록 |
| `X.svg` | 닫기·태그 삭제 |
| `arrow-narrow-up.svg` | 댓글 전송 |
| `Chevron-down.svg` | 드롭다운 화살표 |
| `Chevron-left.svg` | 뒤로가기 |
| `Chevron-right.svg` | 앞으로 |
| `dots-vertical.svg` | 더보기 메뉴 |
| `bookmark.svg` | 저장 |
| `link.svg` | 링크 |
| `code.svg` | 기술 태그 |
| `ai.svg` | AI 도구 |
| `rocket.svg` | 서비스 바로가기 |
| `person.svg` | 작성자 |
| `web.svg` | 웹 |

### 아이콘 상태 처리
- 비활성/흐림: `className="opacity-60"` 또는 `opacity-40`
- 활성(흑백→컬러): `className={active ? "brightness-0" : "opacity-60"}`
- 알림 뱃지: 아이콘 우상단 `w-2 h-2 bg-[#ae49fd] rounded-full`

---

## 4. 공통 컴포넌트

### 버튼
| 컴포넌트 | 스타일 |
|---|---|
| CTA/L | bg `#ae49fd` · white · 16px Bold · radius-16 · py-4 · 비활성: opacity-40 |
| CTA/S | bg `#ae49fd` · white · 14px Bold · radius-12 · py-[14px] |
| FAB (사이드바 하단) | bg `#101828` · white · 14px SemiBold · radius-12 |
| Chip (필터) | 미선택 `#f1f3f7`/`#898f98` · 선택 `#f4e5ff`/`#ae49fd` · radius-12 · 14px SemiBold |
| Chip/pill (지역) | 미선택 `#f3f4f6`/`#636e7f` · 선택 `#101828`/white · radius-9999 · 14px SemiBold |

### 입력
| 컴포넌트 | 스타일 |
|---|---|
| InputField | bg `#f9fafb` · radius-12 · p-14px · 14px Regular · 포커스: bg `#fbf6ff` |
| Textarea | InputField와 동일, 세로 확장 |

### 모달/패널
| 컴포넌트 | 스타일 |
|---|---|
| Modal | bg white · radius-20 · shadow `0px 4px 10px rgba(0,0,0,0.1)` · 딤 `rgba(0,0,0,0.4)` |
| Notification Panel | w-320px · bg white · radius-16 · shadow `0_4px_20px_rgba(0,0,0,0.08)` |

### 네비게이션
| 컴포넌트 | 스타일 |
|---|---|
| 탑바 | h-auto · px-7 py-4 · border-b `#f3f4f6` · bg white |
| 사이드바 | w-256px · border-r `#f3f4f6` · 선택항목 bg `#f3f4f6` radius-12 |
| 하단 탭바 (모바일) | fixed bottom · border-t `#f3f4f6` · bg white |

---

## 5. 카드 디자인 패턴

### 모임 카드 (`HomeScreen` MeetupCard)
- bg white · radius-16 · px-5 pt-5 pb-3 · hover shadow
- 구조: 제목(16px SemiBold) → 메타(장소·날짜·인원, 14px `#6a7282`) → 구분선 → 하단
- 하단: [조회수 + 댓글수] ← → [아바타 + 닉네임 · 지역]
- 아이콘 크기: 18px (메타) · 16px (하단 카운트)
- 좋아요 없음 — 조회수·댓글수만 표시

### 게시물 카드 (`BoardScreen`)
- 카테고리 칩 · 제목 · 작성자·날짜 → 구분선 → 조회수 + 댓글수
- 댓글 아이콘: `Comment.svg` 16px

---

## 6. 화면별 디자인 메모

### 6.1 레이아웃 공통
- 콘텐츠 영역: `max-width: 800px` 중앙 정렬
- 폼 페이지(`/*/new`): bg white
- 나머지: bg `#fafbfb`
- 모바일: 하단 탭바 높이만큼 `pb-16`

### 6.2 온보딩
- 닉네임 → AI 도구 선택 → 직업 선택 순서
- 지역 설정은 별도 화면 (`/onboarding/region`)

### 6.3 홈 (모임 목록)
- 지역 pill 칩 필터 + 정렬 드롭다운
- 모임 카드 리스트
- 2차 MVP: 지도뷰/게시판뷰 토글

### 6.4 모임 상세
- 카드: 제목·장소·날짜·인원·설명
- 하단: 조회수만 표시 (좋아요 없음)
- 공유 버튼: `Share.svg` 사용 (`ShareButton` 컴포넌트)
- 신청 영역: 신청하기 버튼 or 신청자 보기 (호스트)
- 댓글 카드: 댓글 수(보라색) + 댓글 목록 + 대댓글

### 6.5 게시물 상세
- 카드: 카테고리 칩·제목·작성자·날짜·본문
- 하단: 조회수만 표시 (좋아요 없음)
- 공유 버튼: `Share.svg` 사용
- 댓글 구조: 모임 상세와 동일

### 6.6 댓글 / 대댓글 공통 패턴
- 아바타: w-7 h-7 · rounded-full · bg primary · 이니셜 white 11px Bold
- 닉네임: 14px Bold `#101828` · 클릭 시 유저 프로필로 이동
- 시간: 12px Medium `#99a1af`
- 내용: 14px Regular `#364153`
- 대댓글 버튼: `Reply.svg` 12px · 평소 opacity-50 · 활성 opacity-100
- 대댓글 아바타: w-6 h-6 (댓글보다 작음)

### 6.7 모임 등록
- 콘텐츠 너비: max-w-xl (696px)
- 헤더: 20px Bold + 14px Regular `#99a1af` 서브
- 필드 순서 (gap-5): 제목 → 지역+장소 → 날짜+시간 → 모집인원 칩 → 설명
- 하단: border-t → CTA 버튼 (보라색)
- 모달 3종: 지역 선택 · 날짜 선택(react-day-picker) · 시간 선택(휠피커)

### 6.8 프로덕트 (Showcase)
- 카테고리 칩 필터
- 카드: 그라디언트 아이콘 + 제목·태그·설명 + 좋아요·저장 수

---

## 7. 결정된 사항 (Parking Lot 해소)

| 항목 | 결정 |
|---|---|
| 다크모드 | 미지원 |
| 아이콘 세트 | 커스텀 SVG — `public/icons/`에서 파일 참조 방식으로 통일 |
| 좋아요 | 모임 상세·게시물 상세에서 제거 (조회수만 유지) |
| 빈 화면 문구 톤 | `#99a1af` · "첫 댓글을 남겨보세요" 스타일로 통일 |
