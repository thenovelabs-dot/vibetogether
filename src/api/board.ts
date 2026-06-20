import { supabase } from "../lib/supabase";

export interface BoardPost {
  id: string;
  user_id: string;
  author_nickname: string;
  author_avatar_url: string | null;
  title: string;
  content: string;
  category: string;
  image_urls: string[];
  view_count: number;
  comment_count: number;
  created_at: string;
}

export async function getPosts(params?: {
  category?: string;
  sort?: "latest" | "popular";
  limit?: number;
}): Promise<BoardPost[]> {
  const limit = params?.limit ?? 30;
  let query = supabase
    .from("board_posts")
    .select(`
      id,
      user_id,
      title,
      content,
      category,
      image_urls,
      view_count,
      created_at,
      author:users!user_id(nickname, avatar_url),
      comment_count:board_comments(count)
    `);

  if (params?.category && params.category !== "전체") {
    query = query.eq("category", params.category);
  }

  query = query.order(
    params?.sort === "popular" ? "view_count" : "created_at",
    { ascending: false },
  ).limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(shapePost);
}

export async function getPostById(id: string): Promise<BoardPost | null> {
  const { data, error } = await supabase
    .from("board_posts")
    .select("*, author:users!user_id(nickname, avatar_url), comment_count:board_comments(count)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return shapePost(data);
}

export async function incrementBoardView(id: string) {
  await supabase.rpc("increment_board_view", { post_id: id });
}

function autoTitle(content: string) {
  return content.trim().split("\n")[0].slice(0, 60) || "내용 없음";
}

export async function uploadBoardImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("board-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("board-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteBoardImage(url: string) {
  const path = url.split("/board-images/")[1];
  if (!path) return;
  await supabase.storage.from("board-images").remove([path]);
}

export async function createPost(params: {
  userId: string;
  content: string;
  category: string;
  imageUrls?: string[];
}): Promise<string> {
  const { data, error } = await supabase
    .from("board_posts")
    .insert({
      user_id: params.userId,
      title: autoTitle(params.content),
      content: params.content,
      category: params.category,
      image_urls: params.imageUrls ?? [],
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updatePost(
  id: string,
  params: Partial<{ content: string; category: string; imageUrls: string[] }>,
) {
  const updates: Record<string, unknown> = {};
  if (params.content !== undefined) { updates.content = params.content; updates.title = autoTitle(params.content); }
  if (params.category !== undefined) updates.category = params.category;
  if (params.imageUrls !== undefined) updates.image_urls = params.imageUrls;
  const { error } = await supabase.from("board_posts").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("board_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function getUserPosts(userId: string): Promise<BoardPost[]> {
  const { data, error } = await supabase
    .from("board_posts")
    .select("*, author:users!user_id(nickname, avatar_url), comment_count:board_comments(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(shapePost);
}

export async function getUserComments(userId: string) {
  const { data, error } = await supabase
    .from("board_comments")
    .select("id, content, created_at, post:board_posts!post_id(id, title)")
    .eq("user_id", userId)
    .is("parent_id", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const seen = new Set<string>();
  return (data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => ({ id: r.id, content: r.content, created_at: r.created_at, post_id: r.post?.id ?? "", post_title: r.post?.title ?? "" }))
    .filter((r) => { if (seen.has(r.post_id)) return false; seen.add(r.post_id); return true; });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapePost(raw: any): BoardPost {
  return {
    id: raw.id,
    user_id: raw.user_id,
    author_nickname: raw.author?.nickname ?? "알 수 없음",
    author_avatar_url: raw.author?.avatar_url ?? null,
    title: raw.title,
    content: raw.content,
    category: raw.category,
    image_urls: raw.image_urls ?? [],
    view_count: raw.view_count,
    comment_count: raw.comment_count?.[0]?.count ?? 0,
    created_at: raw.created_at,
  };
}
