import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "../contexts/UserContext";
import { getNotifications, type Notification } from "../api/notifications";
import { useNavigationGuard } from "../contexts/NavigationGuardContext";
import { ContactModal } from "./ContactModal";
import { UserAvatar } from "./UserAvatar";

const MAIN_TABS = [
  { path: "/home",    label: "홈",      icon: "/icons/home.svg"      },
  { path: "/meetup",  label: "모임",    icon: "/icons/group.svg"     },
  { path: "/board",   label: "게시판",  icon: "/icons/community.svg" },
  { path: "/product", label: "프로덕트", icon: null },
];
const PROFILE_PATH = "/mypage";
const ALL_TAB_PATHS = [...MAIN_TABS.map((t) => t.path), PROFILE_PATH];

const NEW_ACTION: Record<string, { label: string; to: string }> = {
  "/meetup":  { label: "모임 등록하기", to: "/meetup/new"  },
  "/board":   { label: "글쓰기",        to: "/board/new"   },
  "/product": { label: "프로젝트 등록", to: "/product/new" },
};



// ── SVG 아이콘 ──────────────────────────────────────────
function ProductIcon({ active }: { active: boolean }) {
  return (
    <img
      src="/icons/star.svg"
      width={24}
      height={24}
      className={active ? "brightness-0" : "opacity-60"}
    />
  );
}

function BellIcon({ count }: { count: number }) {
  return (
    <div className="relative">
      <img src="/icons/bell.svg" width={22} height={22} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-[3px] bg-[#ae49fd] rounded-full flex items-center justify-center text-white text-[10px] font-bold leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}

const READ_IDS_KEY = "notifications_read_ids";
const DISMISSED_IDS_KEY = "notifications_dismissed_ids";

function relativeTime(isoStr: string) {
  const diffMin = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
}

function loadReadIds(): Set<string> {
  try {
    const stored = localStorage.getItem(READ_IDS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]));
}

function loadDismissedIds(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_IDS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedIds(ids: Set<string>) {
  localStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify([...ids]));
}

// ── 알림 드롭다운 ──────────────────────────────────────────
function NotificationBell() {
  const navigate = useNavigate();
  const { session } = useUser();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(loadDismissedIds);
  const ref = useRef<HTMLDivElement>(null);

  const visibleNotifications = notifications.filter((n) => !dismissedIds.has(n.id));
  const unreadCount = visibleNotifications.filter((n) => !readIds.has(n.id)).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifications = useCallback(() => {
    if (!session) return;
    getNotifications(session.user.id)
      .then(setNotifications)
      .catch(() => {});
  }, [session]);

  // 마운트 시 + 60초 폴링
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // 벨 열 때 즉시 갱신 + 로딩 표시
  useEffect(() => {
    if (!open || !session) return;
    setLoading(true);
    getNotifications(session.user.id)
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, session]);

  function handleOpen() {
    setOpen((v) => !v);
  }

  function dismissAll() {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      visibleNotifications.forEach((n) => next.add(n.id));
      saveDismissedIds(next);
      return next;
    });
    setReadIds((prev) => {
      const next = new Set(prev);
      visibleNotifications.forEach((n) => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  }

  function handleNotificationClick(n: Notification) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(n.id);
      saveReadIds(next);
      return next;
    });
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  if (!session) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="p-2 rounded-[10px] hover:bg-[#f9fafb] transition-colors"
        aria-label="알림"
      >
        <BellIcon count={unreadCount} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[320px] bg-white border border-[#f3f4f6] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3f4f6]">
            <span className="text-[14px] font-semibold text-[#101828]">알림</span>
            {visibleNotifications.length > 0 && (
              <button
                onClick={dismissAll}
                className="text-[12px] font-semibold text-[#99a1af] hover:text-red-400 transition-colors"
              >
                전체 삭제
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#ae49fd] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visibleNotifications.length === 0 ? (
            <p className="text-[14px] text-[#99a1af] text-center py-8">알림이 없어요</p>
          ) : (
            <div className="max-h-[320px] overflow-y-auto">
              {visibleNotifications.map((n) => {
                const isRead = readIds.has(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full px-4 py-3 flex gap-3 items-start border-b border-[#f9fafb] last:border-0 text-left transition-colors cursor-pointer ${isRead ? "bg-white hover:bg-[#f9fafb]" : "bg-[#fdf9ff] hover:bg-[#f5eeff]"}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isRead ? "bg-transparent" : "bg-[#ae49fd]"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-relaxed ${isRead ? "text-[#99a1af]" : "text-[#364153]"}`}>{n.message}</p>
                      <p className="text-[11px] text-[#99a1af] mt-1">{relativeTime(n.time)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────
export default function Layout() {
  const navigate = useNavigate();
  const guard = useNavigationGuard();
  const { session, profile } = useUser();
  const { pathname } = useLocation();
  const [inquiryOpen, setInquiryOpen] = useState(false);

  function guardNav(path: string) {
    guard.tryNavigate(navigate, path);
  }

  const activeTab = ALL_TAB_PATHS.find((path) => pathname === path || pathname.startsWith(path + "/"));
  const rootPath  = activeTab ?? "/home";
  const action    = pathname === "/search" ? undefined : NEW_ACTION[rootPath];
  const isFormPage = ["/product/new", "/board/new", "/meetup/new"].includes(pathname);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 탑 네비바 */}
      <header className="flex items-center justify-between px-7 h-[48px] border-b border-[#f3f4f6] bg-white shrink-0 z-40">
        <button
          onClick={() => guardNav("/home")}
          className="text-[18px] font-bold text-[#101828] tracking-tight"
        >
          같이바코할사람
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => guardNav("/search")}
            className="p-2 rounded-[10px] hover:bg-[#f9fafb] transition-colors"
            aria-label="검색"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#6a7282" strokeWidth="1.8"/>
              <path d="M21 21l-4.35-4.35" stroke="#6a7282" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <NotificationBell />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 사이드바 (desktop) */}
        <nav className="hidden lg:flex flex-col shrink-0 border-r border-[#f3f4f6] w-64">
          {/* 상단: 메인 탭 */}
          <div className="flex flex-col gap-1 flex-1 px-4 pt-4">
            {MAIN_TABS.map(({ path, label, icon }) => {
              const active = activeTab === path;
              return (
                <button
                  key={path}
                  onClick={() => guardNav(path)}
                  className={`flex items-center w-full py-3 rounded-[12px] gap-3 px-3 transition-colors ${
                    active ? "bg-[#f3f4f6]" : "hover:bg-[#f9fafb]"
                  }`}
                >
                  {icon ? (
                    <img src={icon} width={24} height={24} className={`shrink-0 ${active ? "brightness-0" : "opacity-60"}`} />
                  ) : (
                    <ProductIcon active={active} />
                  )}
                  <span className={`whitespace-nowrap text-[15px] font-semibold ${active ? "text-[#101828]" : "text-[#6a7282]"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 하단: 보조 링크 + FAB + 프로필 */}
          <div className="px-4 pb-6 flex flex-col gap-1">
            <div className="flex flex-col gap-0.5 mb-1">
              <button
                onClick={() => guardNav("/notice")}
                className={`w-full text-left px-3 py-2 rounded-[10px] text-[13px] font-semibold transition-colors whitespace-nowrap ${
                  pathname.startsWith("/notice") ? "text-[#ae49fd]" : "text-[#99a1af] hover:text-[#6a7282]"
                }`}
              >
                공지사항
              </button>
              <button
                onClick={() => setInquiryOpen(true)}
                className="w-full text-left px-3 py-2 rounded-[10px] text-[13px] font-semibold text-[#99a1af] hover:text-[#6a7282] transition-colors whitespace-nowrap"
              >
                문의하기
              </button>
            </div>

            {/* FAB */}
            {action && (
              <button
                onClick={() => guardNav(action.to)}
                className="flex items-center justify-center gap-2 h-[48px] w-full bg-[#101828] text-white rounded-[12px] text-[14px] font-semibold active:opacity-80 transition-opacity mb-1"
              >
                <img src="/icons/plus.svg" width={14} height={14} className="shrink-0" />
                <span className="whitespace-nowrap">{action.label}</span>
              </button>
            )}

            {/* 프로필 탭 */}
            {session ? (
              (() => {
                const active = activeTab === PROFILE_PATH;
                return (
                  <button
                    onClick={() => guardNav(PROFILE_PATH)}
                    className={`flex items-center w-full py-3 rounded-[12px] gap-3 px-3 transition-colors ${
                      active ? "bg-[#f3f4f6]" : "hover:bg-[#f9fafb]"
                    }`}
                  >
                    {profile ? (
                      <UserAvatar avatarUrl={profile.avatar_url} nickname={profile.nickname} className="w-6 h-6 text-[11px]" />
                    ) : (
                      <img src="/icons/profile.svg" width={24} height={24} className={`shrink-0 ${active ? "brightness-0" : "opacity-60"}`} />
                    )}
                    <span className={`text-[15px] font-semibold truncate max-w-[150px] ${active ? "text-[#101828]" : "text-[#6a7282]"}`}>
                      {profile?.nickname ?? "프로필"}
                    </span>
                  </button>
                );
              })()
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-2 px-3 w-full h-[48px] rounded-[12px] bg-[#101828] hover:bg-[#1f2937] transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[14px] font-semibold text-white whitespace-nowrap">로그인 / 회원가입</span>
              </button>
            )}
            {/* 푸터 */}
            <div className="pt-2 border-t border-[#f3f4f6] mt-2">
              <button
                onClick={() => guardNav("/about")}
                className={`w-full text-left px-3 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                  pathname === "/about" ? "text-[#ae49fd]" : "text-[#c4c9d4] hover:text-[#99a1af]"
                }`}
              >
                서비스 소개
              </button>
            </div>
          </div>
        </nav>

        {/* 모바일 하단 탭바 */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#f3f4f6] flex z-50">
          {MAIN_TABS.map(({ path, label, icon }) => {
            const active = activeTab === path;
            return (
              <button
                key={path}
                onClick={() => guardNav(path)}
                className="flex-1 flex flex-col items-center gap-1 py-3"
              >
                {icon ? (
                  <img src={icon} width={24} height={24} className={active ? "brightness-0" : ""} />
                ) : (
                  <ProductIcon active={active} />
                )}
                <span className={`text-[10px] font-semibold ${active ? "text-[#101828]" : "text-[#6a7282]"}`}>
                  {label}
                </span>
              </button>
            );
          })}
          {/* 프로필 탭 */}
          {session ? (
            (() => {
              const active = activeTab === PROFILE_PATH;
              return (
                <button
                  onClick={() => guardNav(PROFILE_PATH)}
                  className="flex-1 flex flex-col items-center gap-1 py-3"
                >
                  {profile ? (
                    <UserAvatar avatarUrl={profile.avatar_url} nickname={profile.nickname} className="w-6 h-6 text-[11px]" />
                  ) : (
                    <img src="/icons/profile.svg" width={24} height={24} className={active ? "brightness-0" : ""} />
                  )}
                  <span className={`text-[10px] font-semibold max-w-[56px] truncate ${active ? "text-[#101828]" : "text-[#6a7282]"}`}>
                    {profile?.nickname ?? "프로필"}
                  </span>
                </button>
              );
            })()
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex-1 flex flex-col items-center gap-1 py-2 px-3"
            >
              <div className="flex items-center gap-1.5 bg-[#101828] rounded-[10px] px-3 py-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[11px] font-semibold text-white whitespace-nowrap">로그인</span>
              </div>
            </button>
          )}
        </nav>

        {/* 콘텐츠 */}
        <main className={`flex-1 overflow-y-auto pb-16 lg:pb-0 ${isFormPage ? "bg-white" : "bg-[#fafbfb]"}`}>
          <div
            key={pathname}
            className={`animate-page-enter ${pathname === "/home" ? "h-full" : "mx-auto h-full"}`}
            style={pathname === "/home" ? {} : { maxWidth: "800px" }}
          >
            <Outlet />
          </div>
        </main>
      </div>
      {/* 모바일 플로팅 등록 버튼 */}
      {action && !isFormPage && (
        <button
          onClick={() => guardNav(action.to)}
          className="lg:hidden fixed bottom-[76px] right-4 z-40 flex items-center gap-2 h-[48px] px-5 bg-[#101828] text-white rounded-full text-[14px] font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.25)] active:scale-95 transition-transform"
        >
          <img src="/icons/plus.svg" width={14} height={14} className="shrink-0" />
          <span className="whitespace-nowrap">{action.label}</span>
        </button>
      )}

      {inquiryOpen && (
        <ContactModal
          type="inquiry"
          senderEmail={session?.user.email ?? ""}
          onClose={() => setInquiryOpen(false)}
        />
      )}
    </div>
  );
}
