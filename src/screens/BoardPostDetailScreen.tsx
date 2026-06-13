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
  const date = new Date(post.created_at);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일(${days[date.getDay()]})`;
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
        <div className="bg-white rounded-[16px] p-3">
          <div className="flex items-start justify-between px-3 pt-3 pb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button onClick={() => navigate(`/user/${post.author_nickname}`)} className="shrink-0">
                <UserAvatar avatarUrl={post.author_avatar_url} nickname={post.author_nickname} className="w-7 h-7 text-[12px]" />
              </button>
              <button
                onClick={() => navigate(`/user/${post.author_nickname}`)}
                className="text-[14px] font-semibold text-[#364153] tracking-[-0.32px] hover:text-[#ae49fd] transition-colors"
              >
                {post.author_nickname}
              </button>
              <span className="self-start px-2 py-0.5 bg-[rgba(244,246,250,0.8)] text-[#9ba2ad] text-[11px] font-semibold rounded-full tracking-[-0.32px]">
                {post.category}
              </span>
              <span className="text-[12px] font-medium text-[#99a1af] tracking-[-0.32px] ml-auto shrink-0">
                {dateStr}
              </span>
            </div>
            <div className="shrink-0 ml-2 flex items-center gap-1">
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

          <div className="px-3 pt-2">
            <p className="text-[15px] leading-[24px] text-[#2a2d33] tracking-[-0.32px] whitespace-pre-line">
              {post.content}
            </p>
            {post.image_urls.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-4">
                {post.image_urls.map((url, i) => (
                  <button key={i} type="button" onClick={() => setLightboxUrl(url)}>
                    <img
                      src={url}
                      alt=""
                      className="w-24 h-24 object-cover rounded-[12px] hover:opacity-90 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#f3f4f6] flex items-center justify-end gap-4 px-4 pt-4 mt-6">
            <div className="flex items-center gap-1.5">
              <img src="/icons/eye.svg" width={18} height={18} />
              <span className="text-[12px] font-medium text-[#636e7f] tracking-[-0.32px]">{post.view_count}</span>
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
