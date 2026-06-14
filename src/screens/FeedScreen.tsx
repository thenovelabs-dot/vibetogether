import { useState, useEffect, useCallback } from "react";
import { isViewCountOnlyUpdate } from "../lib/realtime";
import { useNavigate } from "react-router-dom";
import { getMeetups, type Meetup } from "../api/meetups";
import { getPosts, type BoardPost } from "../api/board";
import { getShowcases, type ProductItem } from "../api/product";
import { supabase } from "../lib/supabase";
import {
  getMyApplicationsWithMeetup,
  getHostPendingItems,
  type MyApplicationItem,
  type HostPendingItem,
} from "../api/applications";
import { getMyCoffeeChats, acceptCoffeeChat, type CoffeeChatIncoming, type CoffeeChatOutgoing } from "../api/coffeechat";
import { MeetupCardSkeleton, BoardPostSkeleton } from "../components/Skeleton";
import { UserAvatar } from "../components/UserAvatar";
import { ApplicationStatusPanel, ApplicationStatusDrawer } from "../components/ApplicationStatusPanel";
import { useUser } from "../contexts/UserContext";

type FeedItem =
  | { type: "meetup"; data: Meetup }
  | { type: "post"; data: BoardPost };

const PRODUCT_GRADIENTS = [
  "linear-gradient(135deg, #FF2056 0%, #C6005C 100%)",
  "linear-gradient(135deg, #615FFF 0%, #1447E6 100%)",
  "linear-gradient(135deg, #10B981 0%, #059669 100%)",
  "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
];

const CATEGORY_CHIP: Record<string, string> = {
  "일반": "bg-[#f1f3f7] text-[#6a7282]",
  "모각작 후기": "bg-[#eff6ff] text-[#2b7fff]",
  "바이브코딩 꿀팁": "bg-emerald-50 text-emerald-600",
  "바이브코딩 질문": "bg-[#f4e5ff] text-[#ae49fd]",
};


function relativeTime(isoStr: string) {
  const diffMin = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
}

function getWeekOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

function getWeekLabel(date: Date) {
  const month = date.getMonth() + 1;
  const weekOfMonth = Math.ceil(date.getDate() / 7);
  const labels = ["첫째주", "둘째주", "셋째주", "넷째주", "다섯째주"];
  return `${month}월 ${labels[Math.min(weekOfMonth - 1, 4)]}`;
}

function getWeeklyProducts(allProducts: ProductItem[]): ProductItem[] {
  if (allProducts.length === 0) return [];
  const weekNum = getWeekOfYear(new Date());
  const total = allProducts.length;
  const offset = (weekNum * 4) % total;
  const picked = allProducts.slice(offset, offset + 4);
  if (picked.length < 4) picked.push(...allProducts.slice(0, 4 - picked.length));
  return picked;
}

export default function FeedScreen() {
  const navigate = useNavigate();
  const { session } = useUser();
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [myApplications, setMyApplications] = useState<MyApplicationItem[]>([]);
  const [hostPending, setHostPending] = useState<HostPendingItem[]>([]);
  const [incomingChats, setIncomingChats] = useState<CoffeeChatIncoming[]>([]);
  const [outgoingChats, setOutgoingChats] = useState<CoffeeChatOutgoing[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchFeed = useCallback(() => {
    setLoading(true);
    Promise.all([
      getMeetups({ sort: "latest" }),
      getPosts({ sort: "latest" }),
      getShowcases({ sort: "latest" }),
    ])
      .then(([m, p, s]) => {
        setMeetups(m);
        setPosts(p);
        setAllProducts(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (payload: any) => { if (!isViewCountOnlyUpdate(payload)) fetchFeed(); };
    const channel = supabase
      .channel("feed_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "meetups" }, handler)
      .on("postgres_changes", { event: "*", schema: "public", table: "board_posts" }, handler)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchFeed]);

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

  const products = getWeeklyProducts(allProducts);
  const weekLabel = getWeekLabel(new Date());
  const totalStatusCount = myApplications.length + hostPending.length + incomingChats.length + outgoingChats.length;

  async function handleAcceptChat(chatId: string) {
    const result = await acceptCoffeeChat(chatId);
    setIncomingChats((prev) => prev.map((c) =>
      c.id === chatId ? { ...c, status: "accepted" as const, requester_email: result.requester_email } : c
    ));
  }

  const now = new Date();
  const feed: FeedItem[] = [
    ...meetups
      .filter((m) => m.status !== "closed" && new Date(m.start_at) >= now)
      .map((m) => ({ type: "meetup" as const, data: m })),
    ...posts.map((p) => ({ type: "post" as const, data: p })),
  ].sort(
    (a, b) =>
      new Date(b.data.created_at).getTime() -
      new Date(a.data.created_at).getTime()
  );

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
        {/* 배너 */}
        <div className="mb-5 px-4 pt-6">
          <div className="bg-[#101828] rounded-[20px] md:rounded-[28px] px-5 pt-5 pb-4 md:px-10 md:pt-12 md:pb-7 flex flex-col gap-4 md:gap-[18px]">
            {/* 타이틀 행 */}
            <div className="flex items-end justify-between gap-2 mx-auto w-full" style={{ maxWidth: "760px" }}>
              <div className="flex flex-col gap-[4px]">
                <p className="text-[12px] font-medium text-white/40 tracking-[0.6px] uppercase">{weekLabel}</p>
                <p className="text-[20px] md:text-[24px] font-semibold text-white leading-[27px] md:leading-[30.8px] tracking-[-0.32px]">
                  이번주 업데이트된 프로덕트를 만나보세요
                </p>
              </div>
              <button
                onClick={() => navigate("/product")}
                className="shrink-0 px-4 py-2 rounded-[12px] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] transition-colors text-[14px] font-semibold text-white/50 tracking-[-0.32px] whitespace-nowrap"
              >
                전체보기
              </button>
            </div>

            {/* 프로덕트 카드 */}
            <div className="flex gap-2 mx-auto w-full" style={{ maxWidth: "760px" }}>
              {loading || products.length === 0
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-1 min-w-0 bg-[rgba(255,255,255,0.05)] rounded-[16px] p-[14px] flex flex-col gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-[10px] bg-[rgba(255,255,255,0.08)]" />
                      <div className="h-3 rounded bg-[rgba(255,255,255,0.08)] w-3/4" />
                      <div className="h-2.5 rounded bg-[rgba(255,255,255,0.06)] w-full" />
                      <div className="h-2.5 rounded bg-[rgba(255,255,255,0.06)] w-2/3" />
                    </div>
                  ))
                : products.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/product/${p.id}`)}
                      className="flex-1 min-w-0 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] rounded-[16px] p-[14px] flex flex-col gap-3 text-left transition-all duration-500 animate-[fadeIn_0.4s_ease-out]"
                    >
                      <div
                        className="w-10 h-10 rounded-[10px] overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ background: p.icon_url ? undefined : PRODUCT_GRADIENTS[idx % PRODUCT_GRADIENTS.length] }}
                      >
                        {p.icon_url
                          ? <img src={p.icon_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-[16px] font-bold text-white">{p.title[0]}</span>
                        }
                      </div>
                      <p className="text-[14px] font-semibold text-white leading-[19.6px] tracking-[-0.32px] line-clamp-2">{p.title}</p>
                      <p className="text-[12px] text-[rgba(255,255,255,0.75)] leading-[16.8px] tracking-[-0.32px] line-clamp-2">{p.short_description}</p>
                    </button>
                  ))
              }
            </div>
          </div>
        </div>

        {/* 모바일 배지 버튼 — 배너와 피드 사이, lg 이상에서는 숨김 */}
        {session && totalStatusCount > 0 && (
          <div className="lg:hidden px-4 mb-4">
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

        <div className="px-4 mx-auto w-full" style={{ maxWidth: "800px" }}>
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) =>
              i % 2 === 0 ? <MeetupCardSkeleton key={i} /> : <BoardPostSkeleton key={i} />
            )}
          </div>
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[16px] font-semibold text-[#101828] mb-1 tracking-[-0.32px]">
              아직 콘텐츠가 없어요
            </p>
            <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">
              첫 번째 모임이나 게시글을 남겨보세요
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {feed.map((item) =>
              item.type === "meetup" ? (
                <MeetupCard
                  key={`m-${item.data.id}`}
                  meetup={item.data}
                  onClick={() => navigate(`/meetup/${item.data.id}`)}
                />
              ) : (
                <PostCard
                  key={`p-${item.data.id}`}
                  post={item.data}
                  onClick={() => navigate(`/board/${item.data.id}`)}
                />
              )
            )}
          </div>
        )}
        </div>
      </div>

      {/* 데스크톱 우측 패널 */}
      {session && (
        <div className="hidden lg:flex flex-col w-[260px] shrink-0 border-l border-[#f3f4f6] overflow-y-auto pt-6 px-4 pb-4">
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

function CardShell({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 pt-5 pb-3 bg-white rounded-[16px] flex flex-col gap-3 hover:shadow-[0px_4px_10px_rgba(0,0,0,0.08)] transition-all active:opacity-90"
    >
      {children}
    </button>
  );
}

function CardFooter({
  commentCount,
  viewCount,
  authorAvatarUrl,
  authorNickname,
}: {
  commentCount: number;
  viewCount: number;
  authorAvatarUrl?: string | null;
  authorNickname?: string;
}) {
  return (
    <div className="w-full border-t border-[#f3f4f6] pt-3 flex items-center justify-between">
      <div className="flex items-center gap-[10px]">
        <div className="flex items-center gap-[6px]">
          <img src="/icons/Comment.svg" width={16} height={16} className="opacity-60" />
          <span className="text-[12px] font-medium text-[#636e7f] tracking-[-0.32px]">{commentCount}</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <img src="/icons/eye.svg" width={16} height={16} className="opacity-60" />
          <span className="text-[12px] font-medium text-[#636e7f] tracking-[-0.32px]">{viewCount}</span>
        </div>
      </div>
      {authorNickname && (
        <div className="flex items-center gap-2">
          <UserAvatar avatarUrl={authorAvatarUrl} nickname={authorNickname} className="w-5 h-5 text-[10px]" />
          <span className="text-[12px] font-semibold text-[#364153] tracking-[-0.32px] whitespace-nowrap">{authorNickname}</span>
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
    <CardShell onClick={onClick}>
      {/* 모임 배지 + 제목 + 시간 */}
      <div className="flex items-start gap-3">
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex self-start px-2 py-[2px] rounded-full text-[12px] font-medium bg-[#e6eaf1] text-[#6a7282] tracking-[-0.32px]">
              모임
            </span>
            {isClosed && (
              <span className="px-2 py-[2px] bg-[#f3f4f6] text-[#99a1af] text-[11px] font-semibold rounded-full tracking-[-0.32px]">마감</span>
            )}
          </div>
          <p className="text-[16px] font-semibold text-[#101828] leading-[22.4px] tracking-[-0.32px]">
            {meetup.title}
          </p>
        </div>
        <span className="text-[12px] text-[#99a1af] tracking-[-0.32px] shrink-0 mt-0.5">{relativeTime(meetup.created_at)}</span>
      </div>

      {/* 장소·날짜·인원 */}
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

      <CardFooter
        commentCount={meetup.comment_count}
        viewCount={meetup.view_count}
        authorAvatarUrl={meetup.host_avatar_url}
        authorNickname={meetup.host_nickname}
      />
    </CardShell>
  );
}

function PostCard({ post, onClick }: { post: BoardPost; onClick: () => void }) {
  const chipClass = CATEGORY_CHIP[post.category] ?? "bg-[#f1f3f7] text-[#6a7282]";

  return (
    <CardShell onClick={onClick}>
      {/* 카테고리 배지 + 제목 + 시간 */}
      <div className="flex items-start gap-3">
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <span className={`inline-flex self-start px-2 py-[2px] rounded-full text-[12px] font-medium tracking-[-0.32px] ${chipClass}`}>
            {post.category}
          </span>
          {post.title && (
            <p className="text-[16px] font-semibold text-[#101828] leading-[22.4px] tracking-[-0.32px]">
              {post.title}
            </p>
          )}
        </div>
        <span className="text-[12px] text-[#99a1af] tracking-[-0.32px] shrink-0 mt-0.5">{relativeTime(post.created_at)}</span>
      </div>

      {/* 본문 미리보기 */}
      <p className="text-[14px] text-[#6a7282] leading-[19.6px] tracking-[-0.32px] whitespace-pre-line">
        {post.content}
      </p>

      {/* 이미지 */}
      {post.image_urls.length > 0 && (
        <div className="flex gap-2">
          {post.image_urls.slice(0, 3).map((url, i) => (
            <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-[10px]" />
          ))}
        </div>
      )}

      <CardFooter
        commentCount={post.comment_count}
        viewCount={post.view_count}
        authorAvatarUrl={post.author_avatar_url}
        authorNickname={post.author_nickname}
      />
    </CardShell>
  );
}
