import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { DotsMenu } from "../components/DotsMenu";
import { ShareButton } from "../components/ShareButton";
import { ConfirmModal } from "../components/ConfirmModal";
import { ContactModal } from "../components/ContactModal";
import { LoginPromptModal } from "../components/LoginPromptModal";
import { DetailSkeleton } from "../components/Skeleton";
import { getPostById, deletePost, incrementBoardView, type BoardPost } from "../api/board";
import { getBoardComments, addBoardComment, deleteBoardComment } from "../api/comments";
import { CommentSection } from "../components/CommentSection";
import { supabase } from "../lib/supabase";
import { useUser } from "../contexts/UserContext";
import { useToast } from "../components/Toast";
import { UserAvatar } from "../components/UserAvatar";

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



export default function BoardPostDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session } = useUser();
  const requireAuth = useRequireAuth();

  const { toast } = useToast();
  const [post, setPost] = useState<BoardPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const viewIncremented = useRef(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    async function load() {
      if (!viewIncremented.current) {
        viewIncremented.current = true;
        await incrementBoardView(id!);
      }
      const [p, coms] = await Promise.all([getPostById(id!), getBoardComments(id!)]);
      setPost(p);
      setComments(coms);
    }

    load().catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`board_comments_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "board_comments", filter: `post_id=eq.${id}` }, () => {
        getBoardComments(id).then(setComments).catch(() => {});
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[14px] text-[#99a1af]">게시물을 찾을 수 없어요</p>
      </div>
    );
  }

  const is_mine = post.user_id === session?.user.id;
  async function handleCommentSubmit(content: string, parentId?: string | null) {
    if (!session || !id) return;
    await addBoardComment({ postId: id, userId: session.user.id, content, parentId });
    const updated = await getBoardComments(id);
    setComments(updated);
  }

  async function handleCommentDelete(commentId: string) {
    if (!id) return;
    await deleteBoardComment(commentId);
    const updated = await getBoardComments(id);
    setComments(updated);
  }

  async function handleDeletePost() {
    if (!id) return;
    setDeleting(true);
    try {
      await deletePost(id);
      navigate("/board", { replace: true });
    } catch {
      toast("삭제에 실패했어요. 다시 시도해주세요");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }


  return (
    <div className="flex flex-col bg-[#fafbfb] min-h-full">
      {!session && <LoginPromptModal />}
      {reportOpen && post && (
        <ContactModal
          type="report"
          senderEmail={session?.user.email ?? ""}
          targetInfo={{ type: "board", title: post.title, id: post.id }}
          onClose={() => setReportOpen(false)}
        />
      )}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-full max-h-full object-contain rounded-[12px]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {confirmDelete && (
        <ConfirmModal
          title="게시글 삭제"
          message="게시글을 삭제하면 복구할 수 없어요. 정말 삭제할까요?"
          onConfirm={handleDeletePost}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}
      <div className="flex flex-col gap-4 py-6 px-4 flex-1">

        {/* 본문 카드 */}
        <div className="bg-white rounded-[16px] px-5 pt-5 pb-3 flex flex-col gap-3">
          {/* 카테고리 + 제목 + 시간/액션 */}
          <div className="flex items-start gap-3">
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              <span className={`inline-flex self-start px-2 py-[2px] rounded-full text-[12px] font-medium tracking-[-0.32px] ${CATEGORY_CHIP[post.category] ?? "bg-[#f1f3f7] text-[#6a7282]"}`}>
                {post.category}
              </span>
              {post.title && (
                <p className="text-[16px] font-semibold text-[#101828] leading-[22.4px] tracking-[-0.32px]">
                  {post.title}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              <span className="text-[12px] text-[#99a1af] tracking-[-0.32px]">{relativeTime(post.created_at)}</span>
              <ShareButton />
              <DotsMenu items={is_mine
                ? [
                    { label: "수정하기", onClick: () => navigate(`/board/${id}/edit`) },
                    { label: "삭제하기", onClick: () => setConfirmDelete(true), danger: true },
                  ]
                : [
                    { label: "신고하기", onClick: () => setReportOpen(true), danger: true },
                  ]
              } />
            </div>
          </div>

          {/* 본문 */}
          <p className="text-[14px] text-[#6a7282] leading-[19.6px] tracking-[-0.32px] whitespace-pre-line">
            {post.content}
          </p>

          {/* 이미지 */}
          {post.image_urls.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {post.image_urls.map((url, i) => (
                <button key={i} type="button" onClick={() => setLightboxUrl(url)}>
                  <img
                    src={url}
                    alt=""
                    className="w-20 h-20 object-cover rounded-[10px] hover:opacity-90 transition-opacity"
                  />
                </button>
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
              <button onClick={() => navigate(`/user/${post.author_nickname}`)} className="shrink-0">
                <UserAvatar avatarUrl={post.author_avatar_url} nickname={post.author_nickname} className="w-5 h-5 text-[10px]" />
              </button>
              <button
                onClick={() => navigate(`/user/${post.author_nickname}`)}
                className="text-[12px] font-semibold text-[#364153] tracking-[-0.32px] hover:text-[#ae49fd] transition-colors whitespace-nowrap"
              >
                {post.author_nickname}
              </button>
            </div>
          </div>
        </div>

        <CommentSection
          comments={comments}
          onSubmit={handleCommentSubmit}
          onDelete={handleCommentDelete}
          currentUserId={session?.user.id}
          authorId={post.user_id}
        />

      </div>
    </div>
  );
}
