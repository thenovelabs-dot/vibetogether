import { supabase } from "../lib/supabase";

export interface Notification {
  id: string;
  message: string;
  time: string;
  link?: string;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const [meetupAppRes, appStatusRes, meetupCommentRes, boardCommentRes, productCommentRes, productLikeRes, coffeeChatRes] = await Promise.all([
    // 내 모임 신청 (호스트 뷰)
    supabase
      .from("meetup_applications")
      .select("id, created_at, user:users!user_id(nickname), meetup:meetups!meetup_id(id, title, host_id)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(30),
    // 내 신청 수락
    supabase
      .from("meetup_applications")
      .select("id, created_at, status, meetup:meetups!meetup_id(id, title)")
      .eq("user_id", userId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(10),
    // 내 모임 댓글
    supabase
      .from("meetup_comments")
      .select("id, created_at, user_id, user:users!user_id(nickname), meetup:meetups!meetup_id(id, title, host_id)")
      .order("created_at", { ascending: false })
      .limit(60),
    // 내 게시글 댓글
    supabase
      .from("board_comments")
      .select("id, created_at, user_id, user:users!user_id(nickname), post:board_posts!post_id(id, title, user_id)")
      .order("created_at", { ascending: false })
      .limit(60),
    // 내 프로덕트 댓글
    supabase
      .from("product_comments")
      .select("id, created_at, user_id, user:users!user_id(nickname), product:products!product_id(id, title, user_id)")
      .order("created_at", { ascending: false })
      .limit(60),
    // 내 프로덕트 좋아요
    supabase
      .from("product_likes")
      .select("id, created_at, user_id, user:users!user_id(nickname), product:products!product_id(id, title, user_id)")
      .order("created_at", { ascending: false })
      .limit(60),
    // 커피챗
    supabase
      .from("coffee_chats")
      .select("id, status, created_at, requester_id, recipient_id, requester:users!requester_id(nickname), recipient:users!recipient_id(nickname)")
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Notification[] = [];

  // 내 모임 신청 (호스트)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const app of (meetupAppRes.data ?? []) as any[]) {
    if (app.meetup?.host_id !== userId) continue;
    result.push({
      id: `app_${app.id}`,
      message: `'${app.meetup.title}'에 ${app.user?.nickname ?? "누군가"}님이 신청했어요`,
      time: app.created_at,
      link: `/meetup/${app.meetup.id}/applications`,
    });
  }

  // 내 신청 수락
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const app of (appStatusRes.data ?? []) as any[]) {
    result.push({
      id: `status_${app.id}`,
      message: `'${app.meetup?.title ?? "모임"}' 신청이 수락됐어요`,
      time: app.created_at,
      link: `/meetup/${app.meetup?.id}`,
    });
  }

  // 내 모임 댓글
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const comment of (meetupCommentRes.data ?? []) as any[]) {
    if (comment.meetup?.host_id !== userId) continue;
    if (comment.user_id === userId) continue;
    result.push({
      id: `meetup_comment_${comment.id}`,
      message: `${comment.user?.nickname ?? "누군가"}님이 '${comment.meetup.title}'에 댓글을 달았어요`,
      time: comment.created_at,
      link: `/meetup/${comment.meetup.id}`,
    });
  }

  // 내 게시글 댓글
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const comment of (boardCommentRes.data ?? []) as any[]) {
    if (comment.post?.user_id !== userId) continue;
    if (comment.user_id === userId) continue;
    result.push({
      id: `board_comment_${comment.id}`,
      message: `${comment.user?.nickname ?? "누군가"}님이 '${comment.post.title}'에 댓글을 달았어요`,
      time: comment.created_at,
      link: `/board/${comment.post.id}`,
    });
  }

  // 내 프로덕트 댓글
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const comment of (productCommentRes.data ?? []) as any[]) {
    if (comment.product?.user_id !== userId) continue;
    if (comment.user_id === userId) continue;
    result.push({
      id: `product_comment_${comment.id}`,
      message: `${comment.user?.nickname ?? "누군가"}님이 '${comment.product.title}'에 댓글을 달았어요`,
      time: comment.created_at,
      link: `/product/${comment.product.id}`,
    });
  }

  // 내 프로덕트 좋아요
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const like of (productLikeRes.data ?? []) as any[]) {
    if (like.product?.user_id !== userId) continue;
    if (like.user_id === userId) continue;
    result.push({
      id: `product_like_${like.id}`,
      message: `${like.user?.nickname ?? "누군가"}님이 '${like.product.title}'을 좋아해요`,
      time: like.created_at,
      link: `/product/${like.product.id}`,
    });
  }

  // 커피챗 알림
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const chat of (coffeeChatRes.data ?? []) as any[]) {
    if (chat.status === "pending" && chat.recipient_id === userId) {
      // 내가 받은 신청
      result.push({
        id: `coffeechat_req_${chat.id}`,
        message: `${chat.requester?.nickname ?? "누군가"}님이 커피챗을 신청했어요 ☕`,
        time: chat.created_at,
      });
    } else if (chat.status === "accepted" && chat.requester_id === userId) {
      // 내가 보낸 신청이 수락됨
      result.push({
        id: `coffeechat_acc_${chat.id}`,
        message: `${chat.recipient?.nickname ?? "누군가"}님이 커피챗을 수락했어요 ☕`,
        time: chat.created_at,
      });
    }
  }

  return result
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 30);
}
