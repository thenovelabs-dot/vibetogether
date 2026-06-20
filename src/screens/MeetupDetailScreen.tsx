import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getMeetupById, deleteMeetup, incrementMeetupView, type Meetup } from "../api/meetups";
import { getMeetupComments, addMeetupComment, deleteMeetupComment } from "../api/comments";
import { CommentSection } from "../components/CommentSection";
import { supabase } from "../lib/supabase";
import { getMyApplication, applyMeetup as applyMeetupApi } from "../api/applications";
import type { ApplicationStatus } from "../types";
import { DotsMenu } from "../components/DotsMenu";
import { UserAvatar } from "../components/UserAvatar";
import { ShareButton } from "../components/ShareButton";
import { ConfirmModal } from "../components/ConfirmModal";
import { ContactModal } from "../components/ContactModal";
import { LoginPromptModal } from "../components/LoginPromptModal";
import { DetailSkeleton } from "../components/Skeleton";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useUser } from "../contexts/userContextValue";
import { useToast } from "../components/toastContext";

function relativeTime(isoStr: string) {
  const diffMin = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
}

export default function MeetupDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session } = useUser();
  const requireAuth = useRequireAuth();

  const { toast } = useToast();
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [myStatus, setMyStatus] = useState<ApplicationStatus | null>(null);
  const [hostEmail, setHostEmail] = useState<string | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const viewIncremented = useRef(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    getMeetupById(id)
      .then((m) => setMeetup(m))
      .catch(() => {})
      .finally(() => setLoading(false));

    getMeetupComments(id)
      .then(setComments)
      .catch(() => {});

    if (session) {
      getMyApplication(id, session.user.id)
        .then((myApp) => {
          setMyStatus(myApp?.status ?? null);
          setHostEmail(myApp?.host_email ?? null);
        })
        .catch(() => {});
    }

    if (!viewIncremented.current) {
      viewIncremented.current = true;
      incrementMeetupView(id);
    }
  }, [id, session]);

  useEffect(() => {
    if (!id) return;
    const commentChannel = supabase
      .channel(`meetup_comments_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meetup_comments", filter: `meetup_id=eq.${id}` }, () => {
        getMeetupComments(id).then(setComments).catch(() => {});
      })
      .subscribe();
    const appChannel = supabase
      .channel(`meetup_applications_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meetup_applications", filter: `meetup_id=eq.${id}` }, () => {
        getMeetupById(id).then((m) => { if (m) setMeetup(m); }).catch(() => {});
      })
      .subscribe();
    return () => {
      supabase.removeChannel(commentChannel);
      supabase.removeChannel(appChannel);
    };
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (!meetup) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[14px] text-[#99a1af]">모임을 찾을 수 없어요</p>
      </div>
    );
  }

  const is_host = meetup.host_id === session?.user.id;
  const isFull = meetup.accepted_count >= meetup.capacity;
  const date = new Date(meetup.start_at);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]}) ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  async function handleCommentSubmit(content: string, parentId?: string | null) {
    if (!session || !id) return;
    await addMeetupComment({ meetupId: id, userId: session.user.id, content, parentId });
    const updated = await getMeetupComments(id);
    setComments(updated);
  }

  async function handleCommentDelete(commentId: string) {
    if (!id) return;
    await deleteMeetupComment(commentId);
    const updated = await getMeetupComments(id);
    setComments(updated);
  }

  async function handleApply() {
    requireAuth(() => _applyMeetup());
  }
  async function _applyMeetup() {
    if (!session || !id) return;
    setApplyLoading(true);
    try {
      await applyMeetupApi(id);
      setMyStatus("pending");
    } catch (e) {
      toast(e instanceof Error ? e.message : "신청에 실패했어요. 다시 시도해주세요");
    }
    setApplyLoading(false);
  }

  async function handleDeleteMeetup() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteMeetup(id);
      navigate("/meetup", { replace: true });
    } catch {
      toast("삭제에 실패했어요. 다시 시도해주세요");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }


  const totalComments = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  return (
    <div className="flex flex-col bg-[#fafbfb] min-h-full">
      {!session && <LoginPromptModal />}
      {reportOpen && meetup && (
        <ContactModal
          type="report"
          senderEmail={session?.user.email ?? ""}
          targetInfo={{ type: "meetup", title: meetup.title, id: meetup.id }}
          onClose={() => setReportOpen(false)}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="모임 삭제"
          message="모임을 삭제하면 복구할 수 없어요. 정말 삭제할까요?"
          onConfirm={handleDeleteMeetup}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}
      <div className="flex flex-col gap-4 py-6 px-4 flex-1">

        {/* 피드 아이템 카드 */}
        <div className="flex flex-col gap-3 items-end">
          {/* 공유 / 더보기 버튼 — 카드 위 */}
          <div className="flex items-center gap-2">
            <ShareButton />
            <DotsMenu items={is_host
              ? [
                  { label: "수정하기", onClick: () => navigate(`/meetup/${id}/edit`) },
                  { label: "삭제하기", onClick: () => setConfirmDelete(true), danger: true },
                ]
              : [
                  { label: "신고하기", onClick: () => setReportOpen(true), danger: true },
                ]
            } />
          </div>

          {/* 본문 카드 */}
          <div className="bg-white rounded-[16px] flex flex-col gap-3 items-end pb-3 pt-5 px-5 w-full">
            {/* 제목 + 작성 시간 */}
            <div className="flex items-start justify-between gap-3 w-full">
              <h1 className="text-[16px] font-semibold text-[#101828] leading-[22.4px] tracking-[-0.32px] flex-1 min-w-0">
                {meetup.title}
              </h1>
              <span className="text-[12px] text-[#99a1af] tracking-[-0.32px] shrink-0 mt-0.5">
                {relativeTime(meetup.created_at)}
              </span>
            </div>

            {/* 본문 */}
            <p className="text-[14px] leading-[19.6px] text-[#6a7282] tracking-[-0.32px] whitespace-pre-wrap w-full">
              {meetup.description}
            </p>

            {/* 모임 정보 */}
            <div className="bg-[rgba(244,246,250,0.5)] rounded-[8px] px-6 py-4 w-full">
              <p className="text-[14px] font-semibold text-[#9ba2ad] tracking-[-0.32px] mb-3">모임 정보</p>
              <div className="flex flex-col gap-3">
                {meetup.place_name && (
                  <div className="flex items-center gap-2">
                    <img src="/icons/location.svg" width={22} height={22} className="shrink-0 opacity-60" />
                    <span className="text-[14px] text-[#2a2d33] tracking-[-0.32px]">{meetup.place_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <img src="/icons/calender.svg" width={22} height={22} className="shrink-0 opacity-60" />
                  <span className="text-[14px] text-[#2a2d33] tracking-[-0.32px]">{dateStr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src="/icons/group.svg" width={22} height={22} className="shrink-0 opacity-60" />
                  <span className="text-[14px] text-[#2a2d33] tracking-[-0.32px]">최대 {meetup.capacity}명</span>
                  <span className="text-[14px] font-bold text-[#ae49fd] tracking-[-0.32px]">
                    {meetup.accepted_count}/{meetup.capacity}명 참여중
                  </span>
                </div>
              </div>
            </div>

            {/* 푸터: 댓글/조회수 (좌) + 작성자/지역 (우) */}
            <div className="border-t border-[#f3f4f6] pt-3 flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <img src="/icons/Comment.svg" width={16} height={16} />
                  <span className="text-[12px] font-medium text-[#636e7f] tracking-[-0.32px]">{totalComments}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <img src="/icons/eye.svg" width={16} height={16} />
                  <span className="text-[12px] font-medium text-[#636e7f] tracking-[-0.32px]">{meetup.view_count}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <UserAvatar avatarUrl={meetup.host_avatar_url} nickname={meetup.host_nickname} className="w-5 h-5 text-[10px]" />
                  <button
                    onClick={() => navigate(`/user/${meetup.host_nickname}`)}
                    className="text-[12px] font-semibold text-[#364153] tracking-[-0.32px] hover:text-[#ae49fd] transition-colors"
                  >
                    {meetup.host_nickname}
                  </button>
                </div>
                <span className="text-[12px] text-[#99a1af] tracking-[-0.32px]">{meetup.region}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 신청 상태 배너 (accepted) */}
        {!is_host && myStatus === "accepted" && (
          <AcceptedBanner hostEmail={hostEmail} />
        )}

        {/* 신청 상태 배너 (pending) */}
        {!is_host && myStatus === "pending" && (
          <div className="bg-[#f1f3f7] rounded-[16px] px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#e4e7ed] flex items-center justify-center shrink-0">
              <img src="/icons/clock.svg" width={16} height={16} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#364153] tracking-[-0.32px]">신청 완료 · 승인 대기 중</p>
              <p className="text-[13px] text-[#99a1af] mt-0.5 tracking-[-0.32px]">호스트가 확인 후 수락하면 알려드려요</p>
            </div>
          </div>
        )}

        {/* 신청 버튼 */}
        {is_host ? (
          <button
            onClick={() => navigate(`/meetup/${id}/applications`)}
            className="w-full flex items-center justify-center gap-2 py-[14px] border border-[#ae49fd] text-[#ae49fd] text-[14px] font-bold rounded-[12px] hover:bg-[#fdf5ff] transition-colors tracking-[-0.32px]"
          >
            신청자 보기 ({meetup.accepted_count}/{meetup.capacity}명)
          </button>
        ) : (
          <ApplySection
            status={myStatus}
            isFull={isFull}
            loading={applyLoading}
            onApply={handleApply}
          />
        )}

        <CommentSection
          comments={comments}
          onSubmit={handleCommentSubmit}
          onDelete={handleCommentDelete}
          currentUserId={session?.user.id}
          authorId={meetup.host_id}
          authorBadgeLabel="호스트"
        />

      </div>
    </div>
  );
}

// ── 신청 섹션 ──────────────────────────────────────────
function ApplySection({
  status,
  isFull,
  loading,
  onApply,
}: {
  status: ApplicationStatus | null;
  isFull: boolean;
  loading: boolean;
  onApply: () => void;
}) {
  if (status === "accepted" || status === "pending") return null;

  return (
    <button
      onClick={onApply}
      disabled={isFull || loading}
      className="w-full flex items-center justify-center gap-[10px] py-[14px] bg-[#ae49fd] text-white text-[14px] font-bold rounded-[12px] disabled:bg-[#f3f4f6] disabled:text-[#99a1af] transition-colors active:scale-[0.98] tracking-[-0.32px]"
    >
      {!isFull && !loading && (
        <img src="/icons/star.svg" width={18} height={18} className="brightness-0 invert" />
      )}
      {loading ? "신청 중..." : isFull ? "마감" : "신청하기"}
    </button>
  );
}

// ── 수락됨 배너 ──────────────────────────────────────────────
function AcceptedBanner({ hostEmail }: { hostEmail: string | null }) {
  const { toast } = useToast();

  async function handleCopy() {
    if (!hostEmail) return;
    try {
      await navigator.clipboard.writeText(hostEmail);
      toast("이메일 복사됐어요", "info");
    } catch {
      const el = document.createElement("textarea");
      el.value = hostEmail;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast("이메일 복사됐어요", "info");
    }
  }

  return (
    <div className="bg-[#f4e5ff] rounded-[12px] px-4 py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#ae49fd] flex items-center justify-center shrink-0">
          <svg width="11" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-[14px] font-bold text-[#ae49fd] tracking-[-0.32px]">신청 수락됨</p>
      </div>
      {hostEmail ? (
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold text-black tracking-[-0.32px]">{hostEmail}</p>
          <button
            onClick={handleCopy}
            className="shrink-0 opacity-50 hover:opacity-80 transition-opacity"
            title="이메일 복사"
          >
            <img src="/icons/copy_purple.svg" width={16} height={16} />
          </button>
        </div>
      ) : (
        <p className="text-[13px] text-[#6a7282] tracking-[-0.32px]">이메일로 호스트 연락처를 확인하세요</p>
      )}
    </div>
  );
}
