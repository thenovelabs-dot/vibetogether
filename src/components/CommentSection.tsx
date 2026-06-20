import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useToast } from "./toastContext";
import type { CommentNode, ReplyNode } from "../api/comments";
import { UserAvatar } from "./UserAvatar";
import { ContactModal } from "./ContactModal";
import { useUser } from "../contexts/userContextValue";

interface Props {
  comments: CommentNode[];
  onSubmit: (content: string, parentId?: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  currentUserId?: string;
  authorId?: string;
  authorBadgeLabel?: string;
  reportTargetType?: string;
}


export function CommentSection({ comments, onSubmit, onDelete, currentUserId, authorId, authorBadgeLabel = "작성자", reportTargetType = "comment" }: Props) {
  const requireAuth = useRequireAuth();
  const { toast } = useToast();
  const { session } = useUser();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ rootId: string; parentId: string; mention: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reportTarget, setReportTarget] = useState<{ id: string; title: string } | null>(null);

  const totalComments = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  function handleSubmitComment() {
    requireAuth(() => _submitComment());
  }
  async function _submitComment() {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(commentText.trim(), null);
      setCommentText("");
    } catch {
      toast("댓글 등록에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitReply() {
    requireAuth(() => _submitReply());
  }
  async function _submitReply() {
    if (!replyText.trim() || submitting || !replyingTo) return;
    setSubmitting(true);
    try {
      await onSubmit(replyText.trim(), replyingTo.parentId);
      setReplyText("");
      setReplyingTo(null);
    } catch {
      toast("댓글 등록에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDelete(id);
    } catch {
      toast("댓글 삭제에 실패했어요");
    }
  }

  return (
    <div className="bg-white rounded-[16px] p-5">
      {reportTarget && (
        <ContactModal
          type="report"
          senderEmail={session?.user.email ?? ""}
          targetInfo={{ type: reportTargetType, title: reportTarget.title, id: reportTarget.id }}
          onClose={() => setReportTarget(null)}
        />
      )}
      <div className="flex items-center gap-[4px] mb-5">
        <span className="text-[14px] font-bold text-[#364153] tracking-[-0.32px]">댓글</span>
        <span className="text-[14px] font-semibold text-[#ae49fd] tracking-[-0.32px]">{totalComments}</span>
      </div>

      {comments.length === 0 ? (
        <p className="text-[14px] text-[#99a1af] text-center py-6">첫 댓글을 남겨보세요</p>
      ) : (
        <div className="flex flex-col gap-5">
          {comments.map((c) => (
            <div key={c.id}>
              <CommentItem
                comment={c}
                onReply={() => requireAuth(() =>
                  setReplyingTo(replyingTo?.rootId === c.id && replyingTo.parentId === c.id
                    ? null
                    : { rootId: c.id, parentId: c.id, mention: c.nickname })
                )}
                isReplyOpen={replyingTo?.rootId === c.id && replyingTo.parentId === c.id}
                currentUserId={currentUserId}
                authorId={authorId}
                authorBadgeLabel={authorBadgeLabel}
                onDelete={handleDelete}
                onReport={(comment) => setReportTarget({
                  id: comment.id,
                  title: `댓글: ${comment.content.slice(0, 80)}`,
                })}
              />

              {c.replies.length > 0 && (
                <div className="ml-[38px] mt-3 flex flex-col gap-3 pl-4 border-l border-[#f3f4f6]">
                  {c.replies.map((r) => (
                    <ReplyItem
                      key={r.id}
                      reply={r}
                      currentUserId={currentUserId}
                      authorId={authorId}
                      authorBadgeLabel={authorBadgeLabel}
                      onDelete={handleDelete}
                      onReport={(reply) => setReportTarget({
                        id: reply.id,
                        title: `댓글: ${reply.content.slice(0, 80)}`,
                      })}
                      onReply={() => requireAuth(() =>
                        setReplyingTo(replyingTo?.parentId === r.id
                          ? null
                          : { rootId: c.id, parentId: r.id, mention: r.nickname })
                      )}
                      isReplyOpen={replyingTo?.parentId === r.id}
                    />
                  ))}
                </div>
              )}

              {replyingTo?.rootId === c.id && (
                <div className="ml-[38px] mt-3 flex gap-2">
                  <input
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSubmitReply(); }}
                    placeholder={`${replyingTo.mention}에게 답글`}
                    className="flex-1 bg-[#f9fafb] rounded-[12px] px-3 py-2 text-[13px] text-[#101828] placeholder:text-[#99a1af] outline-none focus:bg-[#fbf6ff] transition-colors tracking-[-0.32px]"
                  />
                  <button
                    onClick={handleSubmitReply}
                    disabled={!replyText.trim()}
                    className="w-9 h-9 flex items-center justify-center bg-[#ae49fd] rounded-[12px] disabled:opacity-40 shrink-0 transition-opacity"
                  >
                    <img src="/icons/arrow-narrow-up.svg" width={18} height={18} className="brightness-0 invert" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center mt-5">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSubmitComment(); }}
          placeholder="댓글을 입력하세요"
          className="flex-1 bg-[#f9fafb] rounded-[12px] px-4 py-[14px] text-[14px] text-[#101828] placeholder:text-[#99a1af] outline-none focus:bg-[#fbf6ff] transition-colors tracking-[-0.32px]"
        />
        <button
          onClick={handleSubmitComment}
          disabled={!commentText.trim()}
          className="w-[44px] h-[44px] flex items-center justify-center bg-[#ae49fd] rounded-[12px] disabled:opacity-40 transition-opacity shrink-0"
        >
          <img src="/icons/arrow-narrow-up.svg" width={20} height={20} className="brightness-0 invert" />
        </button>
      </div>
    </div>
  );
}

function CommentItem({ comment, onReply, isReplyOpen, currentUserId, authorId, authorBadgeLabel = "작성자", onDelete, onReport }: {
  comment: CommentNode;
  onReply: () => void;
  isReplyOpen: boolean;
  currentUserId?: string;
  authorId?: string;
  authorBadgeLabel?: string;
  onDelete: (id: string) => void;
  onReport: (comment: CommentNode) => void;
}) {
  const navigate = useNavigate();
  const date = new Date(comment.created_at);
  const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  const isMine = comment.user_id === currentUserId;
  const isAuthor = authorId ? comment.user_id === authorId : false;

  return (
    <div className="flex gap-[10px] items-start">
      <button onClick={() => navigate(`/user/${comment.nickname}`)} className="shrink-0 mt-0.5">
        <UserAvatar avatarUrl={comment.avatar_url} nickname={comment.nickname} className="w-7 h-7 text-[11px]" />
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-[10px]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/user/${comment.nickname}`)} className="text-[14px] font-bold text-[#101828] tracking-[-0.32px] hover:text-[#ae49fd] transition-colors">
              {comment.nickname}
            </button>
            {isAuthor && (
              <span className="px-1.5 py-0.5 bg-[#f1f3f7] text-[#9ba2ad] text-[10px] font-bold rounded-full leading-none">{authorBadgeLabel}</span>
            )}
            <span className="text-[12px] font-medium text-[#99a1af] tracking-[-0.32px]">{timeStr}</span>
          </div>
          <p className="text-[14px] text-[#364153] leading-[19.6px] tracking-[-0.32px]">{comment.content}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onReply}
            className={`w-fit flex items-center justify-center p-[3px] rounded-full transition-colors ${isReplyOpen ? "bg-[#ede9fe]" : "bg-[#f5f6f7] hover:bg-[#ececec]"}`}
          >
            <img src="/icons/Reply.svg" width={12} height={12} className={isReplyOpen ? "" : "opacity-50"} />
          </button>
          {isMine && (
            <button
              onClick={() => onDelete(comment.id)}
              className="w-fit flex items-center justify-center p-[3px] rounded-full bg-[#f5f6f7] hover:bg-[#fee2e2] transition-colors"
              title="삭제"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#99a1af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {!isMine && (
            <button
              onClick={() => onReport(comment)}
              className="w-fit flex items-center justify-center p-[3px] rounded-full bg-[#f5f6f7] hover:bg-[#fee2e2] transition-colors"
              title="신고"
            >
              <img src="/icons/report.svg" width={12} height={12} className="opacity-60" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReplyItem({ reply, currentUserId, authorId, authorBadgeLabel = "작성자", onDelete, onReport, onReply, isReplyOpen }: {
  reply: ReplyNode;
  currentUserId?: string;
  authorId?: string;
  authorBadgeLabel?: string;
  onDelete: (id: string) => void;
  onReport: (reply: ReplyNode) => void;
  onReply: () => void;
  isReplyOpen: boolean;
}) {
  const date = new Date(reply.created_at);
  const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  const isMine = reply.user_id === currentUserId;
  const isAuthor = authorId ? reply.user_id === authorId : false;

  return (
    <div className="flex gap-[10px] items-start">
      <UserAvatar avatarUrl={reply.avatar_url} nickname={reply.nickname} className="w-7 h-7 text-[11px] mt-0.5" />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-[#101828] tracking-[-0.32px]">{reply.nickname}</span>
          {isAuthor && (
            <span className="px-1.5 py-0.5 bg-[#f1f3f7] text-[#9ba2ad] text-[10px] font-bold rounded-full leading-none">{authorBadgeLabel}</span>
          )}
          <span className="text-[12px] font-medium text-[#99a1af] tracking-[-0.32px]">{timeStr}</span>
        </div>
        <p className="text-[14px] text-[#364153] leading-[19.6px] tracking-[-0.32px]">
          {reply.parent_nickname && (
            <span className="text-[#9ba2ad] font-semibold">@{reply.parent_nickname} </span>
          )}
          {reply.content}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <button
            onClick={onReply}
            className={`w-fit flex items-center justify-center p-[3px] rounded-full transition-colors ${isReplyOpen ? "bg-[#ede9fe]" : "bg-[#f5f6f7] hover:bg-[#ececec]"}`}
          >
            <img src="/icons/Reply.svg" width={11} height={11} className={`opacity-50 ${isReplyOpen ? "opacity-100" : ""}`} />
          </button>
          {isMine && (
            <button
              onClick={() => onDelete(reply.id)}
              className="w-fit flex items-center justify-center p-[3px] rounded-full bg-[#f5f6f7] hover:bg-[#fee2e2] transition-colors"
              title="삭제"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#99a1af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {!isMine && (
            <button
              onClick={() => onReport(reply)}
              className="w-fit flex items-center justify-center p-[3px] rounded-full bg-[#f5f6f7] hover:bg-[#fee2e2] transition-colors"
              title="신고"
            >
              <img src="/icons/report.svg" width={11} height={11} className="opacity-60" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
