import { supabase } from "../lib/supabase";

export interface CommentNode {
  id: string;
  parent_id: string | null;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
  replies: ReplyNode[];
}

export interface ReplyNode {
  id: string;
  parent_id: string;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
  parent_nickname: string | null;
}

// ── 모임 댓글 ─────────────────────────────────────────────

export async function getMeetupComments(meetupId: string): Promise<CommentNode[]> {
  const { data, error } = await supabase
    .from("meetup_comments")
    .select("*, user:users!user_id(nickname, avatar_url)")
    .eq("meetup_id", meetupId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return buildTree(data ?? []);
}

export async function addMeetupComment(params: {
  meetupId: string;
  userId: string;
  content: string;
  parentId?: string | null;
}) {
  const { error } = await supabase.from("meetup_comments").insert({
    meetup_id: params.meetupId,
    user_id: params.userId,
    content: params.content,
    parent_id: params.parentId ?? null,
  });
  if (error) throw error;

  // 호스트에게 이메일 알림 (fire-and-forget)
  supabase.functions.invoke("notify-comment", {
    body: { meetup_id: params.meetupId, commenter_id: params.userId },
  }).catch(() => {});
}

export async function deleteMeetupComment(id: string) {
  const { error } = await supabase.from("meetup_comments").delete().eq("id", id);
  if (error) throw error;
}

// ── 게시판 댓글 ───────────────────────────────────────────

export async function getBoardComments(postId: string): Promise<CommentNode[]> {
  const { data, error } = await supabase
    .from("board_comments")
    .select("*, user:users!user_id(nickname, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return buildTree(data ?? []);
}

export async function addBoardComment(params: {
  postId: string;
  userId: string;
  content: string;
  parentId?: string | null;
}) {
  const { error } = await supabase.from("board_comments").insert({
    post_id: params.postId,
    user_id: params.userId,
    content: params.content,
    parent_id: params.parentId ?? null,
  });
  if (error) throw error;
}

export async function deleteBoardComment(id: string) {
  const { error } = await supabase.from("board_comments").delete().eq("id", id);
  if (error) throw error;
}

// ── 프로덕트 댓글 ─────────────────────────────────────────

export async function getProductComments(productId: string): Promise<CommentNode[]> {
  const { data, error } = await supabase
    .from("product_comments")
    .select("*, user:users!user_id(nickname, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return buildTree(data ?? []);
}

export async function addProductComment(params: {
  productId: string;
  userId: string;
  content: string;
  parentId?: string | null;
}) {
  const { error } = await supabase.from("product_comments").insert({
    product_id: params.productId,
    user_id: params.userId,
    content: params.content,
    parent_id: params.parentId ?? null,
  });
  if (error) throw error;
}

export async function deleteProductComment(id: string) {
  const { error } = await supabase.from("product_comments").delete().eq("id", id);
  if (error) throw error;
}

// ── 트리 구조 변환 ────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTree(rows: any[]): CommentNode[] {
  const shaped = rows.map((r) => ({
    id: r.id,
    parent_id: r.parent_id ?? null,
    user_id: r.user_id,
    nickname: r.user?.nickname ?? "알 수 없음",
    avatar_url: r.user?.avatar_url ?? null,
    content: r.content,
    created_at: r.created_at,
    replies: [] as ReplyNode[],
  }));

  const byId = new Map(shaped.map((c) => [c.id, c]));

  function findRootId(id: string): string {
    const node = byId.get(id);
    if (!node || !node.parent_id) return id;
    return findRootId(node.parent_id);
  }

  const topLevel: CommentNode[] = [];

  for (const c of shaped) {
    if (!c.parent_id) {
      topLevel.push(c);
    } else {
      const rootId = findRootId(c.id);
      const root = byId.get(rootId);
      const parent = byId.get(c.parent_id);
      // @mention only when replying to a reply (not directly to root)
      const parent_nickname = parent && parent.parent_id !== null ? parent.nickname : null;
      if (root) {
        root.replies.push({ id: c.id, parent_id: c.parent_id, user_id: c.user_id, nickname: c.nickname, avatar_url: c.avatar_url, content: c.content, created_at: c.created_at, parent_nickname });
      } else {
        topLevel.push(c);
      }
    }
  }
  return topLevel;
}
