import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchAll, type SearchResult } from "../api/search";
import { ShowcaseCard } from "./ProductScreen";
import type { ProductItem } from "../api/product";
import { features } from "../config/features";

const TYPE_LABEL: Record<"meetup" | "board", string> = {
  meetup: "모임",
  board: "게시글",
};

const TYPE_CHIP: Record<"meetup" | "board", string> = {
  meetup: "bg-[#f4e5ff] text-[#ae49fd]",
  board: "bg-[#eff6ff] text-[#2b7fff]",
};

function highlight(text: string, keyword: string) {
  const kw = keyword.trim();
  if (!kw) return text;
  // 띄어쓰기 제거 버전도 하이라이트
  const patterns = [kw, kw.replace(/\s+/g, "")].filter(Boolean);
  const regex = new RegExp(
    `(${patterns.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-[#f4e5ff] text-[#ae49fd] rounded-sm not-italic font-semibold">{part}</mark>
      : part
  );
}

function searchResultToProductItem(r: SearchResult): ProductItem {
  return {
    id: r.id,
    user_id: "",
    author_nickname: r.author_nickname,
    title: r.title,
    short_description: r.short_description ?? r.description,
    detail_description: null,
    icon_url: r.icon_url ?? null,
    gallery_urls: [],
    service_url: null,
    sns_url: null,
    tags: [],
    service_category: r.service_category ?? "",
    ai_tools: [],
    launch_date: null,
    like_count: r.like_count ?? 0,
    save_count: r.save_count ?? 0,
    view_count: 0,
    created_at: r.created_at,
    liked: false,
    saved: false,
  };
}

export default function SearchScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<{ meetups: SearchResult[]; posts: SearchResult[]; products: SearchResult[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setResults(null); return; }

    timerRef.current = setTimeout(() => {
      setLoading(true);
      setSearchParams({ q: query }, { replace: true });
      searchAll(query, { includeMeetups: features.meetups })
        .then(setResults)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 350);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCount = results ? results.meetups.length + results.posts.length + results.products.length : 0;
  const hasResults = results !== null;

  return (
    <div className="flex flex-col h-full">
      {/* 검색 헤더 */}
      <div className="px-4 pt-6 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-[#f3f4f6] rounded-[12px] px-3 py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-40">
              <circle cx="11" cy="11" r="8" stroke="#101828" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="#101828" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={features.meetups ? "모임, 게시글, 프로덕트 검색" : "게시글, 프로덕트 검색"}
              className="flex-1 bg-transparent text-[14px] text-[#101828] placeholder:text-[#99a1af] outline-none tracking-[-0.32px]"
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-0.5 rounded-full hover:bg-[#e5e7eb] transition-colors shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#99a1af" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 결과 */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border-2 border-[#ae49fd] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !query.trim() ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-[16px] bg-[#f4e5ff] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#ae49fd" strokeWidth="1.8"/>
                <path d="M21 21l-4.35-4.35" stroke="#ae49fd" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-[#101828] tracking-[-0.32px]">검색어를 입력해주세요</p>
            <p className="text-[13px] text-[#99a1af] mt-1 tracking-[-0.32px]">
              {features.meetups ? "모임, 게시글, 프로덕트를 한번에 검색할 수 있어요" : "게시글과 프로덕트를 한번에 검색할 수 있어요"}
            </p>
          </div>
        ) : hasResults && totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] font-semibold text-[#101828] tracking-[-0.32px]">검색 결과가 없어요</p>
            <p className="text-[13px] text-[#99a1af] mt-1 tracking-[-0.32px]">다른 키워드로 검색해보세요</p>
          </div>
        ) : results ? (
          <div className="flex flex-col gap-6">
            {features.meetups && results.meetups.length > 0 && (
              <Section title="모임" count={results.meetups.length}>
                <div className="flex flex-col gap-2">
                  {results.meetups.map((r) => (
                    <ResultCard key={r.id} result={r} keyword={query} onClick={() => navigate(`/meetup/${r.id}`)} />
                  ))}
                </div>
              </Section>
            )}
            {results.posts.length > 0 && (
              <Section title="게시글" count={results.posts.length}>
                <div className="flex flex-col gap-2">
                  {results.posts.map((r) => (
                    <ResultCard key={r.id} result={r} keyword={query} onClick={() => navigate(`/board/${r.id}`)} />
                  ))}
                </div>
              </Section>
            )}
            {results.products.length > 0 && (
              <Section title="프로덕트" count={results.products.length}>
                <div className="grid grid-cols-2 gap-3">
                  {results.products.map((r) => (
                    <ShowcaseCard key={r.id} item={searchResultToProductItem(r)} />
                  ))}
                </div>
              </Section>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[13px] font-bold text-[#364153] tracking-[-0.32px]">{title}</span>
        <span className="text-[12px] font-semibold text-[#ae49fd]">{count}</span>
      </div>
      {children}
    </div>
  );
}

function ResultCard({ result, keyword, onClick }: { result: SearchResult; keyword: string; onClick: () => void }) {
  const type = result.type as "meetup" | "board";
  const chipClass = TYPE_CHIP[type];
  const typeLabel = TYPE_LABEL[type];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-[14px] px-4 py-3.5 flex flex-col gap-1.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow active:opacity-80"
    >
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${chipClass}`}>{typeLabel}</span>
        {result.category && (
          <span className="text-[11px] text-[#99a1af] font-medium">{result.category}</span>
        )}
      </div>
      <p className="text-[14px] font-semibold text-[#101828] leading-snug tracking-[-0.32px]">
        {highlight(result.title, keyword)}
      </p>
      {result.description && (
        <p className="text-[13px] text-[#6a7282] leading-relaxed tracking-[-0.32px] overflow-hidden max-h-[38px]">
          {highlight(result.description, keyword)}
        </p>
      )}
      <p className="text-[11px] text-[#99a1af] tracking-[-0.32px]">{result.author_nickname}</p>
    </button>
  );
}
