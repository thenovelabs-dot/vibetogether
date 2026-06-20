import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { getShowcaseById, deleteShowcase, toggleLike, incrementProductView, type ProductItem } from "../api/product";
import { getProductComments, addProductComment, deleteProductComment } from "../api/comments";
import { CommentSection } from "../components/CommentSection";
import { supabase } from "../lib/supabase";
import { useUser } from "../contexts/userContextValue";
import { DotsMenu } from "../components/DotsMenu";
import { ShareButton } from "../components/ShareButton";
import { ConfirmModal } from "../components/ConfirmModal";
import { ContactModal } from "../components/ContactModal";
import { LoginPromptModal } from "../components/LoginPromptModal";
import { DetailSkeleton } from "../components/Skeleton";
import { useToast } from "../components/toastContext";
import { UserAvatar } from "../components/UserAvatar";
import { features } from "../config/features";

const ICON_GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-700",
  "from-amber-400 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-indigo-500 to-blue-700",
];
function iconGradient(str: string) {
  return ICON_GRADIENTS[str.charCodeAt(0) % ICON_GRADIENTS.length];
}


export default function ShowcaseDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useUser();
  const { toast } = useToast();
  const [item, setItem] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const viewIncremented = useRef(false);
  const [reportOpen, setReportOpen] = useState(false);
  const requireAuth = useRequireAuth();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getShowcaseById(id, session?.user.id),
      getProductComments(id),
    ])
      .then(([showcase, coms]) => {
        setItem(showcase);
        setComments(coms);
        if (showcase) {
          setLiked(showcase.liked);
          setLikeCount(showcase.like_count);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    if (!viewIncremented.current) {
      viewIncremented.current = true;
      incrementProductView(id);
    }
  }, [id, session?.user.id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`product_comments_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_comments", filter: `product_id=eq.${id}` }, () => {
        getProductComments(id).then(setComments).catch(() => {});
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`product_${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products", filter: `id=eq.${id}` }, () => {
        getShowcaseById(id, session?.user.id).then((updated) => {
          if (!updated) return;
          setItem(updated);
          setLiked(updated.liked);
          setLikeCount(updated.like_count);
        }).catch(() => {});
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, session?.user.id]);

  function handleToggleLike() {
    requireAuth(() => _toggleLike());
  }
  async function _toggleLike() {
    if (!session || !id) return;
    const prev = liked;
    setLiked(!prev);
    setLikeCount((v) => prev ? v - 1 : v + 1);
    try {
      await toggleLike(id, session.user.id, prev);
    } catch (err) {
      setLiked(prev);
      setLikeCount((v) => prev ? v + 1 : v - 1);
      toast("좋아요 처리에 실패했어요");
      console.error("toggleLike error:", err);
    }
  }

  async function handleCommentSubmit(content: string, parentId?: string | null) {
    if (!session || !id) return;
    await addProductComment({ productId: id, userId: session.user.id, content, parentId });
    const updated = await getProductComments(id);
    setComments(updated);
  }

  async function handleCommentDelete(commentId: string) {
    if (!id) return;
    await deleteProductComment(commentId);
    const updated = await getProductComments(id);
    setComments(updated);
  }

  async function handleDeleteShowcase() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteShowcase(id);
      navigate("/showcase", { replace: true });
    } catch {
      toast("삭제에 실패했어요. 다시 시도해주세요");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }


  if (loading) return <DetailSkeleton />;

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[14px] text-[#99a1af]">프로젝트를 찾을 수 없어요</p>
      </div>
    );
  }

  const gradient = iconGradient(item.title);
  const is_mine = item.user_id === session?.user.id;

  return (
    <div className="flex flex-col bg-[#fafbfb] min-h-full">
      {!session && <LoginPromptModal />}
      {reportOpen && item && (
        <ContactModal
          type="report"
          senderEmail={session?.user.email ?? ""}
          targetInfo={{ type: "product", title: item.title, id: item.id }}
          onClose={() => setReportOpen(false)}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="프로젝트 삭제"
          message="프로젝트를 삭제하면 복구할 수 없어요. 정말 삭제할까요?"
          onConfirm={handleDeleteShowcase}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}
      <div className="flex flex-col gap-5 pt-[60px] pb-6 px-4 flex-1">

        {/* ProductHeader */}
        <div className="flex items-center justify-between">
          {/* 왼쪽: 아이콘 → 타이틀 → 칩스+출시일 */}
          <div className="flex flex-col gap-5 items-start">
            {item.icon_url ? (
              <img
                src={item.icon_url}
                alt="icon"
                className="w-[80px] h-[80px] rounded-[22px] object-cover shrink-0"
              />
            ) : (
              <div className={`w-[80px] h-[80px] rounded-[22px] bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                <span className="text-[32px] font-bold text-white leading-none">{item.title[0]}</span>
              </div>
            )}
            <div className="flex flex-col gap-[9px]">
              <h1 className="text-[24px] font-bold text-[#101828] leading-[30.8px] tracking-[-0.32px]">
                {item.title}
              </h1>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex gap-1 items-center">
                  {item.product_type && (
                    <span className="px-2 py-1 bg-[#f4e5ff] text-[#ae49fd] text-[12px] font-bold rounded-full tracking-[-0.32px]">
                      {item.product_type}
                    </span>
                  )}
                  {item.service_category && (
                    <span className="px-2 py-1 bg-[#e6eaf1] text-[#6a7282] text-[12px] font-bold rounded-full tracking-[-0.32px]">
                      {item.service_category}
                    </span>
                  )}
                </div>
                {item.launch_date && (
                  <div className="flex items-center gap-1.5">
                    <img src="/icons/rocket.svg" width={20} height={20} />
                    <span className="text-[14px] font-semibold text-[#364153] tracking-[-0.32px]">
                      {item.launch_date} 출시
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* 오른쪽: 액션 버튼 상단, 서비스 버튼 하단 */}
          <div className="flex flex-col items-end justify-between self-stretch">
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleLike}
                className={`h-9 px-2.5 flex items-center gap-1.5 rounded-[12px] transition-colors ${liked ? "bg-[#f4e5ff]" : "bg-[#f5f6f7] hover:bg-[#e9eaec]"}`}
              >
                <img
                  src="/icons/heart.svg"
                  width={16}
                  height={16}
                  style={liked ? { filter: "invert(42%) sepia(99%) saturate(747%) hue-rotate(247deg) brightness(101%) contrast(103%)" } : { opacity: 0.6 }}
                />
                <span className={`text-[12px] font-semibold tracking-[-0.32px] ${liked ? "text-[#ae49fd]" : "text-[#636e7f]"}`}>{likeCount}</span>
              </button>
              <ShareButton />
              <DotsMenu
                size={36}
                items={is_mine
                  ? [
                      { label: "수정하기", onClick: () => navigate(`/product/${id}/edit`) },
                      { label: "삭제하기", onClick: () => setConfirmDelete(true), danger: true },
                    ]
                  : [
                      { label: "신고하기", onClick: () => setReportOpen(true), danger: true },
                    ]
                }
              />
            </div>
            {features.externalProductLinks && item.service_url && (
              <button
                onClick={() => window.open(item.service_url!, "_blank", "noopener noreferrer")}
                className="flex items-center gap-[10px] h-[48px] px-6 bg-[#ae49fd] text-white text-[14px] font-bold rounded-[12px] hover:opacity-90 transition-opacity tracking-[-0.32px] whitespace-nowrap"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.8"/>
                  <path d="M12 3c-2.5 3-4 5.7-4 9s1.5 6 4 9M12 3c2.5 3 4 5.7 4 9s-1.5 6-4 9M3 12h18" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                서비스 바로가기
              </button>
            )}
          </div>
        </div>

        {/* 갤러리 */}
        {item.gallery_urls.length > 0 && (
          <>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
              {item.gallery_urls.map((url, i) => (
                <div
                  key={i}
                  className="shrink-0 rounded-[16px] overflow-hidden cursor-zoom-in"
                  style={{ width: 280, height: 158 }}
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                >
                  <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-200 hover:scale-105" />
                </div>
              ))}
            </div>
            {lightboxOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                onClick={() => setLightboxOpen(false)}
              >
                <button
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                  onClick={() => setLightboxOpen(false)}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
                {lightboxIndex > 0 && (
                  <button
                    className="absolute left-4 text-white/70 hover:text-white transition-colors"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i - 1); }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                <img
                  src={item.gallery_urls[lightboxIndex]}
                  alt=""
                  className="max-w-[90vw] max-h-[90vh] rounded-[12px] object-contain shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
                {lightboxIndex < item.gallery_urls.length - 1 && (
                  <button
                    className="absolute right-4 text-white/70 hover:text-white transition-colors"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i + 1); }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                {item.gallery_urls.length > 1 && (
                  <div className="absolute bottom-5 flex gap-1.5">
                    {item.gallery_urls.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === lightboxIndex ? "bg-white" : "bg-white/40"}`} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* DescriptionCard */}
        <div className="bg-white rounded-[16px] px-5 py-4 flex flex-col gap-4">
          <p className="text-[12px] font-bold text-[#99a1af] tracking-[-0.32px]">서비스 소개</p>
          <p className="text-[14px] text-[#2a2d33] leading-[19.6px] tracking-[-0.32px]">{item.short_description}</p>
          {item.detail_description && (
            <p className="text-[14px] text-[#6a7282] leading-[19.6px] tracking-[-0.32px] whitespace-pre-wrap">{item.detail_description}</p>
          )}

          <div className="bg-[#f9fbfd] rounded-[16px] px-5 py-4 flex flex-col gap-4 mt-6">
            {item.ai_tools.length > 0 && (
              <div className="flex gap-8 items-center">
                <div className="flex gap-1.5 items-center w-20 shrink-0">
                  <img src="/icons/ai.svg" width={20} height={20} />
                  <span className="text-[12px] font-bold text-[#99a1af] tracking-[-0.32px] whitespace-nowrap">사용 AI 툴</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {item.ai_tools.map((tool) => (
                    <span
                      key={tool}
                      className="flex items-center gap-1 pl-[9px] pr-3 py-[5px] bg-[#f4e5ff] text-[#ae49fd] text-[12px] font-semibold rounded-full tracking-[-0.32px]"
                    >
                      <img src="/icons/ai_purple.svg" width={14} height={14} />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.tags.length > 0 && (
              <div className="flex gap-8 items-center">
                <div className="flex gap-1.5 items-center w-20 shrink-0">
                  <img src="/icons/code.svg" width={20} height={20} />
                  <span className="text-[12px] font-bold text-[#99a1af] tracking-[-0.32px] whitespace-nowrap">기술 스택</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-[5px] bg-[#e8edf1] text-[#364153] text-[12px] font-semibold rounded-full tracking-[-0.32px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {features.externalProductLinks && item.sns_url && (
              <div className="flex gap-8 items-center">
                <div className="flex gap-1.5 items-center w-20 shrink-0">
                  <img src="/icons/link.svg" width={20} height={20} />
                  <span className="text-[12px] font-bold text-[#99a1af] tracking-[-0.32px] whitespace-nowrap">SNS 링크</span>
                </div>
                <a
                  href={item.sns_url.startsWith("http") ? item.sns_url : `https://${item.sns_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] font-semibold text-[#364153] tracking-[-0.32px] underline underline-offset-2 hover:opacity-70 transition-opacity break-all"
                >
                  {item.sns_url.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            <div className="flex gap-8 items-center">
              <div className="flex gap-1.5 items-center w-20 shrink-0">
                <img src="/icons/person.svg" width={20} height={20} />
                <span className="text-[12px] font-bold text-[#99a1af] tracking-[-0.32px] whitespace-nowrap">메이커</span>
              </div>
              <button onClick={() => navigate(`/user/${item.author_nickname}`)} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <UserAvatar avatarUrl={item.author_avatar_url} nickname={item.author_nickname} className="w-6 h-6 text-[12px]" />
                <p className="text-[14px] font-semibold text-[#364153] tracking-[-0.32px]">
                  {item.author_nickname}
                </p>
              </button>
            </div>
          </div>
        </div>

        <CommentSection
          comments={comments}
          onSubmit={handleCommentSubmit}
          onDelete={handleCommentDelete}
          currentUserId={session?.user.id}
          authorId={item.user_id}
          authorBadgeLabel="메이커"
          reportTargetType="product_comment"
        />

      </div>
    </div>
  );
}
