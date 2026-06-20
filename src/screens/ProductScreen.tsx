import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getShowcases, type ProductItem } from "../api/product";
import { useUser } from "../contexts/userContextValue";
import { ProductCardSkeleton } from "../components/Skeleton";
import { supabase } from "../lib/supabase";
import { features } from "../config/features";

export type { ProductItem };

export const SERVICE_CATEGORIES = ["생산성", "교육", "커뮤니티", "개발 도구", "엔터테인먼트", "헬스케어", "금융", "기타"] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const ALL_TECH_TAGS = ["React", "Next.js", "Vue", "TypeScript", "Python", "Node.js", "Supabase", "Firebase", "PostgreSQL", "FastAPI", "Flutter", "React Native", "Vercel", "AWS", "OpenAI API", "Claude API"] as const;
export const AI_TOOLS_OPTIONS = ["Claude", "ChatGPT", "Cursor", "GitHub Copilot", "Gemini", "v0", "Windsurf", "Bolt", "Midjourney", "기타"] as const;

const CATEGORY_ITEMS: { label: string; value: string }[] = [
  { label: "전체", value: "전체" },
  { label: "생산성", value: "생산성" },
  { label: "교육", value: "교육" },
  { label: "커뮤니티", value: "커뮤니티" },
  { label: "개발 도구", value: "개발 도구" },
  { label: "엔터테인먼트", value: "엔터테인먼트" },
  { label: "헬스케어", value: "헬스케어" },
  { label: "금융", value: "금융" },
  { label: "기타", value: "기타" },
];

const productsCache = new Map<string, ProductItem[]>();

const ICON_GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-700",
  "from-amber-400 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-indigo-500 to-blue-700",
];
function gradientIdx(str: string) {
  return str.charCodeAt(0) % ICON_GRADIENTS.length;
}

export default function ShowcaseScreen() {
  const navigate = useNavigate();
  const { session } = useUser();
  const [items, setItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [activeSort, setActiveSort] = useState<"최신순" | "인기순">("최신순");
  const [showSort, setShowSort] = useState(false);
  const effectiveUserId = features.tossLogin ? undefined : session?.user.id;
  const cacheKey = `${activeCategory}:${activeSort}:${effectiveUserId ?? "public"}`;

  useEffect(() => {
    const cached = productsCache.get(cacheKey);
    if (cached) {
      setItems(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError(null);
    getShowcases({
      category: activeCategory !== "전체" ? activeCategory : undefined,
      sort: activeSort === "인기순" ? "popular" : "latest",
      userId: effectiveUserId,
    })
      .then((nextItems) => {
        productsCache.set(cacheKey, nextItems);
        setItems(nextItems);
      })
      .catch(() => {
        setError("프로덕트 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      })
      .finally(() => setLoading(false));
  }, [activeCategory, activeSort, cacheKey, effectiveUserId]);

  useEffect(() => {
    if (features.tossLogin) return;
    const channel = supabase
      .channel("products_list_likes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, (payload) => {
        const updated = payload.new as { id: string; like_count: number; save_count: number };
        setItems((prev) =>
          prev.map((item) =>
            item.id === updated.id
              ? { ...item, like_count: updated.like_count, save_count: updated.save_count }
              : item
          )
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="flex flex-col h-full" onClick={() => setShowSort(false)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between pt-6 pb-4 shrink-0 px-4">
        <h1 className="text-[20px] font-bold text-[#101828] tracking-[-0.32px]">프로덕트</h1>
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
              {(["최신순", "인기순"] as const).map((opt) => (
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
        {CATEGORY_ITEMS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveCategory(value)}
            className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-semibold transition-colors tracking-[-0.32px] ${
              activeCategory === value ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#636e7f]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      <div className="flex-1 overflow-y-auto pb-6 px-4 py-1">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[16px] font-semibold text-[#101828] mb-1">연결을 확인해주세요</p>
            <p className="text-[14px] text-[#99a1af]">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[16px] font-semibold text-[#101828] mb-1">프로젝트가 없어요</p>
            <p className="text-[14px] text-[#99a1af] mb-6">첫 번째 프로젝트를 등록해보세요!</p>
            <button
              onClick={() => navigate("/product/new")}
              className="px-5 py-2.5 bg-[#101828] text-white text-[14px] font-semibold rounded-[12px]"
            >
              프로젝트 등록하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <ShowcaseCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ShowcaseCard({ item }: { item: ProductItem }) {
  const navigate = useNavigate();
  const idx = gradientIdx(item.title);
  const iconGrad = ICON_GRADIENTS[idx];

  return (
    <div
      className="bg-white rounded-[16px] p-6 flex flex-col gap-4 cursor-pointer hover:shadow-[0px_4px_10px_rgba(0,0,0,0.1)] transition-shadow"
      onClick={() => navigate(`/product/${item.id}`)}
    >
      {item.icon_url ? (
        <img src={item.icon_url} alt="icon" className="w-20 h-20 rounded-[20px] object-cover shrink-0" />
      ) : (
        <div className={`w-20 h-20 rounded-[20px] bg-gradient-to-br ${iconGrad} flex items-center justify-center shrink-0`}>
          <span className="text-[32px] font-bold text-white leading-none">{item.title[0]}</span>
        </div>
      )}

      <div className="flex flex-col gap-1 w-full flex-1">
        <h3 className="text-[16px] font-semibold text-[#101828] leading-[1.4] tracking-[-0.32px] line-clamp-1">{item.title}</h3>
        <p className="text-[14px] text-[#6a7282] leading-[1.4] tracking-[-0.32px] line-clamp-2">{item.short_description}</p>
      </div>

      <div className="flex items-center justify-between w-full">
        <span className="bg-[#e6eaf1] text-[#6a7282] text-[10px] font-bold tracking-[-0.32px] px-1.5 py-0.5 rounded-full">
          {item.service_category}
        </span>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <img src="/icons/heart.svg" width={16} height={16} className="opacity-40" />
            <span className="text-[12px] text-[#636e7f] tracking-[-0.32px]">{item.like_count}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <img src="/icons/Comment.svg" width={16} height={16} className="opacity-40" />
            <span className="text-[12px] text-[#636e7f] tracking-[-0.32px]">{item.save_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
