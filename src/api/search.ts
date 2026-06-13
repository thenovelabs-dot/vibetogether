import { supabase } from "../lib/supabase";

export interface SearchResult {
  type: "meetup" | "board" | "product";
  id: string;
  title: string;
  description: string;
  created_at: string;
  author_nickname: string;
  category?: string;
  // product-only fields (for ShowcaseCard)
  short_description?: string;
  service_category?: string;
  icon_url?: string | null;
  like_count?: number;
  save_count?: number;
}

// 한국어 표기 → 영어 기술 용어 매핑
const KO_EN_MAP: Record<string, string> = {
  "클로드": "claude",
  "챗지피티": "chatgpt",
  "챗gpt": "chatgpt",
  "오픈에이아이": "openai",
  "깃허브": "github",
  "코파일럿": "copilot",
  "커서": "cursor",
  "윈드서프": "windsurf",
  "제미나이": "gemini",
  "미드저니": "midjourney",
  "볼트": "bolt",
  "리액트": "react",
  "넥스트": "next",
  "뷰": "vue",
  "타입스크립트": "typescript",
  "자바스크립트": "javascript",
  "파이썬": "python",
  "수파베이스": "supabase",
  "파이어베이스": "firebase",
  "버셀": "vercel",
  "플러터": "flutter",
};

function expandKeywords(keyword: string): string[] {
  const normalized = keyword.trim();
  const results = new Set<string>();

  results.add(normalized);
  // 띄어쓰기 제거 버전도 추가
  const noSpace = normalized.replace(/\s+/g, "");
  if (noSpace !== normalized) results.add(noSpace);

  // 한→영 매핑
  const lower = normalized.toLowerCase();
  if (KO_EN_MAP[lower]) results.add(KO_EN_MAP[lower]);
  if (KO_EN_MAP[noSpace.toLowerCase()]) results.add(KO_EN_MAP[noSpace.toLowerCase()]);

  return [...results];
}

function buildOrFilter(keywords: string[], ...columns: string[]): string {
  return keywords
    .flatMap((kw) => columns.map((col) => `${col}.ilike.%${kw}%`))
    .join(",");
}

export async function searchAll(keyword: string): Promise<{
  meetups: SearchResult[];
  posts: SearchResult[];
  products: SearchResult[];
}> {
  if (!keyword.trim()) return { meetups: [], posts: [], products: [] };

  const keywords = expandKeywords(keyword);

  const [meetupsRes, postsRes, productsRes] = await Promise.all([
    supabase
      .from("meetups")
      .select("id, title, description, created_at, host:users!host_id(nickname)")
      .or(buildOrFilter(keywords, "title", "description"))
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("board_posts")
      .select("id, title, content, category, created_at, author:users!user_id(nickname)")
      .or(buildOrFilter(keywords, "title", "content"))
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("products")
      .select("id, title, short_description, service_category, icon_url, like_count, save_count, created_at, author:users!user_id(nickname)")
      .or(buildOrFilter(keywords, "title", "short_description"))
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    meetups: (meetupsRes.data ?? []).map((r: any) => ({
      type: "meetup" as const,
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      created_at: r.created_at,
      author_nickname: r.host?.nickname ?? "",
    })),
    posts: (postsRes.data ?? []).map((r: any) => ({
      type: "board" as const,
      id: r.id,
      title: r.title,
      description: r.content ?? "",
      created_at: r.created_at,
      author_nickname: r.author?.nickname ?? "",
      category: r.category,
    })),
    products: (productsRes.data ?? []).map((r: any) => ({
      type: "product" as const,
      id: r.id,
      title: r.title,
      description: r.short_description ?? "",
      short_description: r.short_description ?? "",
      service_category: r.service_category ?? "",
      icon_url: r.icon_url ?? null,
      like_count: r.like_count ?? 0,
      save_count: r.save_count ?? 0,
      created_at: r.created_at,
      author_nickname: r.author?.nickname ?? "",
    })),
  };
}
