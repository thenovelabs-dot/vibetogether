import { useState, useEffect, useCallback } from "react";
import { isViewCountOnlyUpdate } from "../lib/realtime";
import { useNavigate } from "react-router-dom";
import { getPosts, type BoardPost } from "../api/board";
import { BoardPostSkeleton } from "../components/Skeleton";
import { UserAvatar } from "../components/UserAvatar";
import { supabase } from "../lib/supabase";

const CATEGORIES = ["전체", "일반", "모각작 후기", "바이브코딩 꿀팁", "바이브코딩 질문"] as const;
type Category = (typeof CATEGORIES)[number];

const SORT_OPTIONS = ["최신순", "인기순"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const postsCache = new Map<string, BoardPost[]>();

const CATEGORY_CHIP: Record<Category, string> = {
  "전체": "",
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

export default function BoardScreen() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<SortOption>("최신순");
  const [showSort, setShowSort] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("전체");
  const cacheKey = `${activeCategory}:${activeSort}`;

  const fetchPosts = useCallback((showInitialLoading = true) => {
    const cached = postsCache.get(cacheKey);
    if (cached) {
      setPosts(cached);
      setLoading(false);
    } else if (showInitialLoading) {
      setLoading(true);
    }

    setError(null);
    getPosts({
      category: activeCategory !== "전체" ? activeCategory : undefined,
      sort: activeSort === "인기순" ? "popular" : "latest",
    })
      .then((nextPosts) => {
        postsCache.set(cacheKey, nextPosts);
        setPosts(nextPosts);
      })
      .catch(() => {
        setError("게시판 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      })
      .finally(() => setLoading(false));
  }, [activeSort, activeCategory, cacheKey]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const channel = supabase
      .channel("board_realtime")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes", { event: "*", schema: "public", table: "board_posts" }, (payload: any) => {
        if (!isViewCountOnlyUpdate(payload)) fetchPosts(false);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  return (
    <div className="flex flex-col h-full" onClick={() => setShowSort(false)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between pt-6 pb-4 shrink-0 px-4">
        <h1 className="text-[20px] font-bold text-[#101828] tracking-[-0.32px]">게시판</h1>
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

      {/* 카테고리 칩 */}
      <div className="flex gap-2 pb-4 overflow-x-auto shrink-0 no-scrollbar px-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-semibold transition-colors tracking-[-0.32px] ${
              activeCategory === cat ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#636e7f]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 피드 */}
      <div className="flex-1 overflow-y-auto pb-6 px-4">
        {loading ? (
          <div className="flex flex-col gap-3 pt-1">
            {Array.from({ length: 4 }).map((_, i) => <BoardPostSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[16px] font-semibold text-[#101828] mb-1 tracking-[-0.32px]">연결을 확인해주세요</p>
            <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[16px] font-semibold text-[#101828] mb-1 tracking-[-0.32px]">아직 게시물이 없어요</p>
            <p className="text-[14px] text-[#99a1af] mb-6 tracking-[-0.32px]">첫 글을 써보세요!</p>
            <button
              onClick={() => navigate("/board/new")}
              className="px-5 py-2.5 bg-[#101828] text-white text-[14px] font-semibold rounded-[12px] tracking-[-0.32px]"
            >
              글쓰기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onClick={() => navigate(`/board/${post.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onClick }: { post: BoardPost; onClick: () => void }) {
  const cat = post.category as Category;
  const chipClass = CATEGORY_CHIP[cat] ?? "bg-[#f1f3f7] text-[#6a7282]";

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 pt-5 pb-3 bg-white rounded-[16px] flex flex-col gap-3 hover:shadow-[0px_4px_10px_rgba(0,0,0,0.08)] transition-all active:opacity-90"
    >
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
        <div className="flex gap-2 flex-wrap">
          {post.image_urls.map((url, i) => (
            <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-[10px]" />
          ))}
        </div>
      )}

      {/* 하단: 댓글+조회수 / 작성자 */}
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
