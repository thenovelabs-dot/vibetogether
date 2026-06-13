import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMeetups, type Meetup } from "../api/meetups";
import { getPosts, type BoardPost } from "../api/board";
import { getShowcases, type ProductItem } from "../api/product";
import {
  getMyApplicationsWithMeetup,
  getHostPendingItems,
  type MyApplicationItem,
  type HostPendingItem,
} from "../api/applications";
import { getMyCoffeeChats, acceptCoffeeChat, type CoffeeChatIncoming, type CoffeeChatOutgoing } from "../api/coffeechat";
import { UserAvatar } from "../components/UserAvatar";
import { ApplicationStatusPanel, ApplicationStatusDrawer } from "../components/ApplicationStatusPanel";
import { useUser } from "../contexts/UserContext";

type FeedItem =
  | { type: "meetup"; data: Meetup; created_at: string }
  | { type: "board"; data: BoardPost; created_at: string };

const CATEGORY_CHIP: Record<string, string> = {
  "일반": "bg-[#f1f3f7] text-[#6a7282]",
  "모각작 후기": "bg-[#eff6ff] text-[#2b7fff]",
  "바이브코딩 꿀팁": "bg-emerald-50 text-emerald-600",
  "바이브코딩 질문": "bg-[#f4e5ff] text-[#ae49fd]",
};

const ICON_GRADIENTS = [
  "linear-gradient(135deg, #FF2056 0%, #C6005C 100%)",
  "linear-gradient(135deg, #615FFF 0%, #1447E6 100%)",
  "linear-gradient(135deg, #10B981 0%, #059669 100%)",
  "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
];

function relativeTime(isoStr: string) {
  const diffMin = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { session } = useUser();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [showcases, setShowcases] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [myApplications, setMyApplications] = useState<MyApplicationItem[]>([]);
  const [hostPending, setHostPending] = useState<HostPendingItem[]>([]);
  const [incomingChats, setIncomingChats] = useState<CoffeeChatIncoming[]>([]);
  const [outgoingChats, setOutgoingChats] = useState<CoffeeChatOutgoing[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      getMeetups({ sort: "latest" }),
      getPosts({ sort: "latest" }),
      getShowcases({ sort: "latest" }),
    ]).then(([meetups, posts, products]) => {
      const combined: FeedItem[] = [
        ...meetups.map((m) => ({ type: "meetup" as const, data: m, created_at: m.created_at })),
        ...posts.map((p) => ({ type: "board" as const, data: p, created_at: p.created_at })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setFeed(combined);
      setShowcases(products.slice(0, 4));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    setStatusLoading(true);
    Promise.all([
      getMyApplicationsWithMeetup(session.user.id),
      getHostPendingItems(session.user.id),
      getMyCoffeeChats(),
    ])
      .then(([apps, host, chats]) => {
        setMyApplications(apps);
        setHostPending(host);
        setIncomingChats(chats.incoming);
        setOutgoingChats(chats.outgoing);
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, [session]);

  async function handleAcceptChat(chatId: string) {
    const result = await acceptCoffeeChat(chatId);
    setIncomingChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, status: "accepted" as const, requester_email: result.requester_email } : c
      )
    );
  }

  const totalStatusCount = myApplications.length + hostPending.length + incomingChats.length + outgoingChats.length;

  return (
    <div className="flex h-full">
      {/* 모바일 드로어 */}
      <ApplicationStatusDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        myApplications={myApplications}
        hostPending={hostPending}
        incomingChats={incomingChats}
        outgoingChats={outgoingChats}
        onAcceptChat={handleAcceptChat}
        loading={statusLoading}
      />

      {/* 메인 피드 */}
      <div className="flex-1 min-w-0 overflow-y-auto pb-6">
        {/* 이번주 프로덕트 배너 */}
        <div className="px-4 pt-6 mb-5">
          <div className="bg-[#101828] rounded-[20px] md:rounded-[28px] px-5 pt-5 pb-4 md:px-10 md:pt-12 md:pb-7 flex flex-col gap-4 md:gap-[18px]">
            <div className="flex items-end justify-between gap-2 mx-auto w-full" style={{ maxWidth: "760px" }}>
              <div className="flex flex-col gap-1">
                <p className="text-[12px] font-medium text-white/40 tracking-[0.6px] uppercase">This Week</p>
                <p className="text-[20px] md:text-[24px] font-bold text-white leading-[1.3] tracking-[-0.32px]">
                  이번주 업데이트된<br className="md:hidden" /> 프로덕트를 만나보세요
                </p>
              </div>
              <button
                onClick={() => navigate("/showcase")}
                className="shrink-0 px-4 py-2 rounded-[12px] bg-white/5 hover:bg-white/10 transition-colors text-[14px] font-semibold text-white/50 tracking-[-0.32px] whitespace-nowrap"
              >
                전체보기
              </button>
            </div>
            {showcases.length > 0 && (
              <div className="flex gap-2 mx-auto w-full" style={{ maxWidth: "760px" }}>
                {showcases.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/showcase/${item.id}`)}
                    className="flex-1 min-w-0 bg-white/5 hover:bg-white/10 rounded-[16px] p-[14px] flex flex-col gap-3 text-left transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-[10px] overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: item.icon_url ? undefined : ICON_GRADIENTS[i % ICON_GRADIENTS.length] }}
                    >
                      {item.icon_url
                        ? <img src={item.icon_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[16px] font-bold text-white">{item.title[0]}</span>
                      }
                    </div>
                    <p className="text-[14px] font-semibold text-white leading-[19.6px] tracking-[-0.32px] line-clamp-2">{item.title}</p>
                    <p className="text-[12px] text-white/75 leading-[16.8px] tracking-[-0.32px] line-clamp-2">{item.short_description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 모바일 모임 현황 배지 버튼 */}
        {session && totalStatusCount > 0 && (
          <div className="lg:hidden px-4 mb-4 mx-auto w-full" style={{ maxWidth: "800px" }}>
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full flex items-center justify-between bg-white rounded-[12px] px-4 py-3 hover:bg-[#f9fafb] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#f4e5ff] flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z" stroke="#ae49fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-[13px] font-semibold text-[#364153] tracking-[-0.32px]">내 모임 현황</span>
                <span className="px-1.5 py-0.5 bg-[#ae49fd] text-white text-[10px] font-bold rounded-full leading-none">
                  {totalStatusCount}
                </span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#99a1af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* 혼합 피드 */}
        <div className="px-4 mx-auto w-full" style={{ maxWidth: "800px" }}>
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => <FeedSkeleton key={i} />)}
            </div>
          ) : feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[16px] font-semibold text-[#101828] mb-1 tracking-[-0.32px]">아직 게시물이 없어요</p>
              <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">첫 번째 모임이나 글을 올려보세요</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {feed.map((item) =>
                item.type === "meetup" ? (
                  <MeetupCard
                    key={`meetup-${item.data.id}`}
                    meetup={item.data}
                    onClick={() => navigate(`/meetup/${item.data.id}`)}
                  />
                ) : (
                  <BoardCard
                    key={`board-${item.data.id}`}
                    post={item.data}
                    onClick={() => navigate(`/board/${item.data.id}`)}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* 데스크톱 우측 패널 — 내 모임 현황 */}
      {session && (
        <div className="hidden lg:flex flex-col w-[260px] shrink-0 border-l border-[#f3f4f6] overflow-y-auto p-4">
          <ApplicationStatusPanel
            myApplications={myApplications}
            hostPending={hostPending}
            incomingChats={incomingChats}
            outgoingChats={outgoingChats}
            onAcceptChat={handleAcceptChat}
            loading={statusLoading}
          />
        </div>
      )}
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
      className="w-full text-left px-5 pt-5 pb-3 bg-white rounded-[16px] flex flex-col gap-3 hover:shadow-[0px_4px_10px_rgba(0,0,0,0.08)] transition-all active:opacity-90"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-[2px] rounded-full text-[12px] font-bold bg-[#e6eaf1] text-[#6a7282] tracking-[-0.32px]">모임</span>
            {isClosed && (
              <span className="px-2 py-[2px] bg-[#f3f4f6] text-[#99a1af] text-[11px] font-semibold rounded-full tracking-[-0.32px]">마감</span>
            )}
          </div>
          <p className="text-[16px] font-semibold text-[#101828] leading-[22.4px] tracking-[-0.32px]">{meetup.title}</p>
        </div>
        <span className="text-[12px] text-[#99a1af] tracking-[-0.32px] shrink-0 mt-0.5">{relativeTime(meetup.created_at)}</span>
      </div>
      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center gap-[6px]">
          <img src="/icons/location.svg" width={18} height={18} className="shrink-0 opacity-60" />
          <span className="text-[14px] text-[#6a7282] tracking-[-0.32px]">{meetup.place_name || meetup.region}</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <img src="/icons/calender.svg" width={18} height={18} className="shrink-0 opacity-60" />
          <span className="text-[14px] text-[#6a7282] tracking-[-0.32px]">{dateStr}</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <img src="/icons/group.svg" width={18} height={18} className="shrink-0 opacity-60" />
          <span className="text-[14px] text-[#6a7282] tracking-[-0.32px]">최대 {meetup.capacity}명</span>
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

function BoardCard({ post, onClick }: { post: BoardPost; onClick: () => void }) {
  const chipClass = CATEGORY_CHIP[post.category] ?? "bg-[#f1f3f7] text-[#6a7282]";
  const preview = post.content.replace(/\n+/g, " ").trim().slice(0, 100);

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 pt-5 pb-3 bg-white rounded-[16px] flex flex-col gap-3 hover:shadow-[0px_4px_10px_rgba(0,0,0,0.08)] transition-all active:opacity-90"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <span className={`self-start px-2 py-[2px] rounded-full text-[12px] font-bold tracking-[-0.32px] ${chipClass}`}>
            {post.category}
          </span>
          <p className="text-[16px] font-semibold text-[#101828] leading-[22.4px] tracking-[-0.32px]">{post.title}</p>
        </div>
        <span className="text-[12px] text-[#99a1af] tracking-[-0.32px] shrink-0 mt-0.5">{relativeTime(post.created_at)}</span>
      </div>
      {preview && (
        <p className="text-[14px] text-[#6a7282] leading-[1.4] tracking-[-0.32px] line-clamp-2">{preview}</p>
      )}
      <div className="w-full border-t border-[#f3f4f6] pt-3 flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          <div className="flex items-center gap-[6px]">
            <img src="/icons/Comment.svg" width={16} height={16} className="opacity-60" />
            <span className="text-[12px] font-medium text-[#636e7f] tracking-[-0.32px]">{post.comment_count}</span>
          </div>
          <div className="flex items-center gap-[6px]">
            <img src="/icons/eye.svg" width={16} height={16} className="opacity-60" />
            <span className="text-[12px] font-medium text-[#636e7f] tracking-[-0.32px]">{post.view_count}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserAvatar avatarUrl={post.author_avatar_url} nickname={post.author_nickname} className="w-5 h-5 text-[10px]" />
          <span className="text-[12px] font-semibold text-[#364153] tracking-[-0.32px] whitespace-nowrap">{post.author_nickname}</span>
        </div>
      </div>
    </button>
  );
}

function FeedSkeleton() {
  return (
    <div className="bg-white rounded-[16px] px-5 pt-5 pb-3 flex flex-col gap-3 animate-pulse">
      <div className="flex gap-2 items-center">
        <div className="h-5 w-10 bg-[#f3f4f6] rounded-full" />
        <div className="h-5 w-32 bg-[#f3f4f6] rounded-[6px]" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-3 bg-[#f3f4f6] rounded w-3/4" />
        <div className="h-3 bg-[#f3f4f6] rounded w-1/2" />
      </div>
      <div className="border-t border-[#f3f4f6] pt-3 flex justify-between">
        <div className="h-3 w-16 bg-[#f3f4f6] rounded" />
        <div className="h-3 w-20 bg-[#f3f4f6] rounded" />
      </div>
    </div>
  );
}
