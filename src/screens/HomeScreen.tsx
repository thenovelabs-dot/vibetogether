import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { getMeetups, type Meetup } from "../api/meetups";
import { ALL_REGIONS, regionKey, regionDisplay } from "../lib/regions";
import { isViewCountOnlyUpdate } from "../lib/realtime";
import { supabase } from "../lib/supabase";
import { MeetupCardSkeleton } from "../components/Skeleton";
import { UserAvatar } from "../components/UserAvatar";

const SORT_OPTIONS = ["최신순", "임박순"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

function relativeTime(isoStr: string) {
  const diffMin = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { profile } = useUser();
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<SortOption>("최신순");
  const [showSort, setShowSort] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>("all");
  const [extraRegions, setExtraRegions] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("home_extra_regions") ?? "[]"); }
    catch { return []; }
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("home_extra_regions", JSON.stringify(extraRegions));
  }, [extraRegions]);

  const userRegion = profile?.region ?? "";

  const fetchMeetups = useCallback(() => {
    setLoading(true);
    getMeetups({ sort: activeSort === "임박순" ? "imminent" : "latest" })
      .then(setMeetups)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeSort]);

  useEffect(() => {
    fetchMeetups();
  }, [fetchMeetups]);

  useEffect(() => {
    const channel = supabase
      .channel("meetups_realtime")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes", { event: "*", schema: "public", table: "meetups" }, (payload: any) => {
        if (isViewCountOnlyUpdate(payload)) return;
        fetchMeetups();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMeetups]);

  const now = new Date();
  const regionFiltered =
    activeRegion === "all"
      ? meetups
      : activeRegion === "mine"
      ? meetups.filter((m) => m.region === userRegion)
      : meetups.filter((m) => m.region === activeRegion);

  // 모집 중인 모임 먼저, 마감된 모임은 뒤로
  const filtered = [
    ...regionFiltered.filter((m) => m.status !== "closed" && new Date(m.start_at) >= now),
    ...regionFiltered.filter((m) => m.status === "closed" || new Date(m.start_at) < now),
  ];

  const activeLabel =
    activeRegion === "all" ? "전체"
    : activeRegion === "mine" ? (userRegion ? regionDisplay(userRegion) : "내 지역")
    : regionDisplay(activeRegion);

  return (
    <div className="flex flex-col h-full" onClick={() => setShowSort(false)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between pt-6 pb-4 shrink-0 px-4">
        <h1 className="text-[20px] font-bold text-[#101828] tracking-[-0.32px]">주변 모임</h1>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowSort((v) => !v)}
            className="flex items-center gap-1 bg-white pl-3 pr-2 py-1.5 rounded-[8px] text-[14px] font-semibold text-[#101828] tracking-[-0.32px] hover:bg-[#f9fafb] transition-colors"
          >
            {activeSort}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`transition-transform ${showSort ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" stroke="#101828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-[10px] shadow-md border border-[#f3f4f6] py-1 z-20 min-w-[80px]">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setActiveSort(opt); setShowSort(false); }}
                  className={`w-full text-left px-4 py-2 text-[14px] font-semibold tracking-[-0.32px] hover:bg-[#f9fafb] transition-colors ${
                    activeSort === opt ? "text-[#ae49fd]" : "text-[#364153]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 지역 칩 */}
      <div className="flex items-center gap-2 pb-4 overflow-x-auto shrink-0 no-scrollbar px-4">
        <button
          onClick={() => setActiveRegion("all")}
          className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-semibold transition-colors tracking-[-0.32px] ${
            activeRegion === "all" ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#636e7f]"
          }`}
        >
          전체
        </button>
        <button
          onClick={() => {
            if (!userRegion) { navigate("/mypage"); return; }
            setActiveRegion("mine");
          }}
          className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-semibold transition-colors tracking-[-0.32px] ${
            activeRegion === "mine" && userRegion ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#636e7f]"
          }`}
        >
          {userRegion ? regionDisplay(userRegion) : "내 지역"}
        </button>
        {extraRegions.map((r) => (
          <div
            key={r}
            className={`shrink-0 flex items-center gap-1 rounded-full text-[14px] font-semibold transition-colors py-2 tracking-[-0.32px] ${
              activeRegion === r ? "bg-[#101828] text-white pl-4 pr-2" : "bg-[#f3f4f6] text-[#636e7f] px-4"
            }`}
          >
            <button onClick={() => setActiveRegion(r)}>{regionDisplay(r)}</button>
            {activeRegion === r && (
              <button
                onClick={(e) => { e.stopPropagation(); setExtraRegions((prev) => prev.filter((x) => x !== r)); setActiveRegion("mine"); }}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <img src="/icons/X.svg" width={10} height={10} className="brightness-0 invert" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setAdding(true)}
          className="shrink-0 flex items-center gap-1.5 pl-3 pr-4 py-2 rounded-full text-[14px] font-semibold text-[#99a1af] border border-dashed border-[#d1d5dc] hover:border-[#ae49fd] hover:text-[#ae49fd] transition-colors tracking-[-0.32px]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          지역 추가
        </button>
      </div>

      {adding && (
        <RegionAddModal
          excludes={[userRegion, ...extraRegions]}
          onAdd={(key) => { setExtraRegions((prev) => [...prev, key]); setActiveRegion(key); setAdding(false); }}
          onClose={() => setAdding(false)}
        />
      )}

      {/* 피드 */}
      <div className="flex-1 overflow-y-auto pb-6 px-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <MeetupCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[#f4e5ff] flex items-center justify-center mb-4">
              <img src="/icons/group.svg" width={28} height={28} />
            </div>
            <p className="text-[16px] font-semibold text-[#101828] mb-1 tracking-[-0.32px]">
              아직 {activeLabel} 모임이 없어요
            </p>
            <p className="text-[14px] text-[#99a1af] mb-6 tracking-[-0.32px]">첫 번째 모임을 열어보는 건 어때요?</p>
            <button
              onClick={() => navigate("/meetup/new")}
              className="px-5 py-2.5 bg-[#101828] text-white text-[14px] font-semibold rounded-[12px] tracking-[-0.32px]"
            >
              모임 등록하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((meetup) => (
              <MeetupCard key={meetup.id} meetup={meetup} onClick={() => navigate(`/meetup/${meetup.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MeetupCard({ meetup, onClick }: { meetup: Meetup; onClick: () => void }) {
  const date = new Date(meetup.start_at);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]}) ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  const isClosed = meetup.status === "closed" || date < new Date();

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 pt-5 pb-3 bg-white rounded-[16px] flex flex-col gap-3 hover:shadow-[0px_4px_10px_rgba(0,0,0,0.1)] transition-all active:opacity-90"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 flex items-start gap-2 min-w-0">
          {isClosed && (
            <span className="shrink-0 mt-0.5 px-2 py-[2px] bg-[#f3f4f6] text-[#99a1af] text-[11px] font-semibold rounded-full tracking-[-0.32px]">마감</span>
          )}
          <p className="text-[16px] font-semibold text-[#101828] leading-[22.4px] tracking-[-0.32px]">
            {meetup.title}
          </p>
        </div>
        <span className="text-[12px] text-[#99a1af] tracking-[-0.32px] shrink-0 mt-0.5">{relativeTime(meetup.created_at)}</span>
      </div>
      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center gap-[6px]">
          <img src="/icons/location.svg" width={18} height={18} className="shrink-0 opacity-60" />
          <span className="text-[14px] text-[#6a7282] tracking-[-0.32px]">{meetup.place_name || regionDisplay(meetup.region)}</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <img src="/icons/calender.svg" width={18} height={18} className="shrink-0 opacity-60" />
          <span className="text-[14px] text-[#6a7282] tracking-[-0.32px]">{dateStr}</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <img src="/icons/group.svg" width={18} height={18} className="shrink-0 opacity-60" />
          <span className="text-[14px] text-[#6a7282] tracking-[-0.32px]">{meetup.accepted_count}/{meetup.capacity}명 참여</span>
        </div>
      </div>
      <div className="w-full border-t border-[#f3f4f6] pt-3 flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          <div className="flex items-center gap-[6px]">
            <img src="/icons/Comment.svg" width={16} height={16} className="opacity-60" />
            <span className="text-[12px] font-medium text-[#636e7f] tracking-[-0.32px]">{meetup.comment_count}</span>
          </div>
          <div className="flex items-center gap-[6px]">
            <img src="/icons/eye.svg" width={16} height={16} className="opacity-60" />
            <span className="text-[12px] font-medium text-[#636e7f] tracking-[-0.32px]">{meetup.view_count}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserAvatar avatarUrl={meetup.host_avatar_url} nickname={meetup.host_nickname} className="w-5 h-5 text-[10px]" />
          <span className="text-[12px] font-semibold text-[#364153] tracking-[-0.32px] whitespace-nowrap">{meetup.host_nickname}</span>
        </div>
      </div>
    </button>
  );
}

function RegionAddModal({ excludes, onAdd, onClose }: {
  excludes: string[];
  onAdd: (r: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const suggestions = query.trim().length >= 1
    ? ALL_REGIONS
        .filter((r) => (r.name.includes(query.trim()) || r.city.includes(query.trim())) && !excludes.includes(regionKey(r.city, r.name)))
        .slice(0, 10)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.1)] w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[16px] font-bold text-[#101828] tracking-[-0.32px]">지역 추가</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-[8px] hover:bg-[#f3f4f6] transition-colors">
            <img src="/icons/X.svg" width={16} height={16} />
          </button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
          placeholder="지역명 입력 (예: 해운대구, 제주)"
          className="input"
        />
        <div className="mt-3 min-h-[52px]">
          {query.trim().length === 0 ? (
            <p className="text-[14px] text-[#99a1af] text-center py-3 tracking-[-0.32px]">지역명을 입력해주세요</p>
          ) : suggestions.length === 0 ? (
            <p className="text-[14px] text-[#99a1af] text-center py-3 tracking-[-0.32px]">검색 결과가 없어요</p>
          ) : (
            <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto">
              {suggestions.map((r) => (
                <button
                  key={`${r.city}-${r.name}`}
                  type="button"
                  onClick={() => onAdd(regionKey(r.city, r.name))}
                  className="w-full text-left px-3 py-2.5 rounded-[10px] text-[14px] text-[#364153] hover:bg-[#f9fafb] flex items-center justify-between transition-colors tracking-[-0.32px]"
                >
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-[12px] text-[#99a1af]">{r.city}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
