import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserByNickname, getMyMeetups, type UserProfile } from "../api/users";
import { getUserPosts, getUserComments, type BoardPost } from "../api/board";
import { getMyProducts } from "../api/users";
import { useUser } from "../contexts/userContextValue";
import { requestCoffeeChat, acceptCoffeeChat, getCoffeeChatWith } from "../api/coffeechat";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/toastContext";
import { features } from "../config/features";

const AVATAR_COLORS = [
  "bg-violet-400", "bg-blue-400", "bg-emerald-400",
  "bg-amber-400", "bg-rose-400", "bg-cyan-400",
];
const ICON_GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-700",
  "from-amber-400 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-indigo-500 to-blue-700",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}
function iconGradient(title: string) {
  return ICON_GRADIENTS[title.charCodeAt(0) % ICON_GRADIENTS.length];
}
function relativeTime(isoStr: string) {
  const diffMin = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
}

interface ProfileProduct {
  id: string;
  title: string;
  icon_url: string | null;
}

interface UserComment {
  id: string;
  content: string;
  post_id: string;
  post_title: string;
  created_at: string;
}

type Tab = "meetups" | "posts" | "comments";

export default function UserProfileScreen() {
  const { nickname } = useParams<{ nickname: string }>();
  const navigate = useNavigate();
  const { session } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<ProfileProduct[]>([]);
  const [meetups, setMeetups] = useState<{ id: string; title: string; place_name: string; start_at: string; created_at: string }[]>([]);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [chatStatus, setChatStatus] = useState<{
    id: string;
    status: "pending" | "accepted";
    role: "requester" | "recipient";
    requester_email: string | null;
    recipient_email: string | null;
  } | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const n = nickname ?? "";
  const color = avatarColor(n);

  useEffect(() => {
    if (!n) return;
    setLoading(true);
    getUserByNickname(n)
      .then((p) => {
        setProfile(p);
        if (!p) return;
        return Promise.all([
          getMyProducts(p.id).then((data) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setProducts(data.map((s: any) => ({ id: s.id, title: s.title, icon_url: s.icon_url ?? null })))
          ),
          features.meetups ? getMyMeetups(p.id).then(setMeetups) : Promise.resolve(),
          getUserPosts(p.id).then(setPosts),
          getUserComments(p.id).then(setComments),
          session && features.coffeechat ? getCoffeeChatWith(p.id).then(setChatStatus) : Promise.resolve(),
        ]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [n, session]);

  async function handleCoffeeChat() {
    if (!profile) return;
    setChatLoading(true);
    try {
      if (!chatStatus) {
        const chatId = await requestCoffeeChat(profile.id);
        supabase.functions.invoke("notify-coffeechat", { body: { coffee_chat_id: chatId } }).catch(() => {});
        setChatStatus({ id: chatId, status: "pending", role: "requester", requester_email: null, recipient_email: null });
      } else if (chatStatus.role === "recipient" && chatStatus.status === "pending") {
        const result = await acceptCoffeeChat(chatStatus.id);
        setChatStatus((prev) => prev ? { ...prev, status: "accepted", requester_email: result.requester_email, recipient_email: result.recipient_email } : prev);
      }
    } catch {
      // silent
    }
    setChatLoading(false);
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    ...(features.meetups ? [{ key: "meetups" as const, label: "모임", count: meetups.length }] : []),
    { key: "posts",    label: "게시물", count: posts.length },
    { key: "comments", label: "댓글",   count: comments.length },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#ae49fd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#fafbfb] min-h-full">
      <div className="flex flex-col gap-4 py-6 px-4">

        {/* 프로필 카드 */}
        <div className="bg-white rounded-[16px] p-5 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center text-white text-[22px] font-bold shrink-0`}>
              {n[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[18px] font-bold text-[#101828] tracking-[-0.32px]">{n}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <img src="/icons/location.svg" width={14} height={14} className="opacity-60 shrink-0" />
                <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">{profile?.region || "알 수 없는 위치"}</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#f3f4f6]" />

          {/* 커피챗 버튼 — 본인 프로필에서는 숨김 */}
          {features.coffeechat && session && profile && session.user.id !== profile.id && (
            <CoffeeChatButton
              chatStatus={chatStatus}
              loading={chatLoading}
              onClick={handleCoffeeChat}
            />
          )}

          <div className="flex items-center">
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <p className="text-[18px] font-bold text-[#101828]">{products.length}</p>
              <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">프로젝트</p>
            </div>
            {features.meetups && (
              <>
                <div className="w-px h-8 bg-[#f3f4f6]" />
                <div className="flex-1 flex flex-col items-center gap-1.5">
                  <p className="text-[18px] font-bold text-[#101828]">{meetups.length}</p>
                  <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">작성한 모임</p>
                </div>
                <div className="w-px h-8 bg-[#f3f4f6]" />
              </>
            )}
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <p className="text-[18px] font-bold text-[#101828]">{posts.length}</p>
              <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">게시물</p>
            </div>
          </div>
        </div>

        {/* 등록한 프로젝트 카드 */}
        {products.length > 0 && (
          <div className="bg-white rounded-[16px] p-5 flex flex-col gap-4">
            <p className="text-[14px] font-bold text-[#364153] tracking-[-0.32px]">등록한 프로젝트</p>
            <div className="flex gap-5 overflow-x-auto pb-1 no-scrollbar">
              {products.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="shrink-0 flex flex-col gap-3 items-center cursor-pointer"
                >
                  {item.icon_url ? (
                    <img src={item.icon_url} alt="icon" className="w-20 h-20 rounded-[22px] object-cover" />
                  ) : (
                    <div className={`w-20 h-20 rounded-[22px] bg-gradient-to-br ${iconGradient(item.title)} flex items-center justify-center shadow-sm`}>
                      <span className="text-[32px] font-bold text-white leading-none">{item.title[0]}</span>
                    </div>
                  )}
                  <p className="text-[14px] text-[#101828] text-center tracking-[-0.32px] line-clamp-1 max-w-[80px]">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 피드 탭 + 아이템 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-[14px] font-semibold tracking-[-0.32px] transition-colors ${
                  activeTab === tab.key ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#636e7f]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[#ae49fd]">{tab.count}</span>
              </button>
            ))}
          </div>

          {activeTab === "meetups" && (
            meetups.length > 0 ? (
              <div className="flex flex-col gap-3">
                {meetups.map((meetup) => (
                  <button
                    key={meetup.id}
                    onClick={() => navigate(`/meetup/${meetup.id}`)}
                    className="bg-white rounded-[16px] p-4 flex flex-col gap-1.5 text-left hover:shadow-[0px_4px_10px_rgba(0,0,0,0.1)] transition-shadow"
                  >
                    <div className="flex items-start justify-between w-full">
                      <span className="px-[6px] py-[3px] bg-[#f4e5ff] text-[#ae49fd] text-[10px] font-bold rounded-full tracking-[-0.32px]">
                        모임
                      </span>
                      <span className="text-[12px] font-medium text-[#99a1af] tracking-[-0.32px]">
                        {relativeTime(meetup.created_at)}
                      </span>
                    </div>
                    <p className="text-[14px] font-semibold text-[#101828] tracking-[-0.32px] line-clamp-2">
                      {meetup.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#99a1af] tracking-[-0.32px]">
                      <img src="/icons/location.svg" width={14} height={14} className="opacity-60" />
                      <span>{meetup.place_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Empty text="아직 개설한 모임이 없어요" />
            )
          )}

          {activeTab === "posts" && (
            posts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => navigate(`/board/${post.id}`)}
                    className="bg-white rounded-[16px] p-4 flex flex-col gap-1.5 text-left hover:shadow-[0px_4px_10px_rgba(0,0,0,0.1)] transition-shadow"
                  >
                    <div className="flex items-start justify-between w-full">
                      <span className="px-[6px] py-[3px] bg-[#e6eaf1] text-[#6a7282] text-[10px] font-bold rounded-full tracking-[-0.32px]">
                        게시글
                      </span>
                      <span className="text-[12px] font-medium text-[#99a1af] tracking-[-0.32px]">
                        {relativeTime(post.created_at)}
                      </span>
                    </div>
                    <p className="text-[14px] font-semibold text-[#101828] tracking-[-0.32px] line-clamp-2">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-[10px]">
                      <div className="flex items-center gap-1.5">
                        <img src="/icons/eye.svg" width={16} height={16} className="shrink-0" />
                        <span className="text-[12px] font-medium text-[#636e7f] tracking-[-0.32px]">{post.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <img src="/icons/Comment.svg" width={16} height={16} />
                        <span className="text-[12px] font-medium text-[#636e7f] tracking-[-0.32px]">{post.comment_count}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Empty text="아직 작성한 게시물이 없어요" />
            )
          )}

          {activeTab === "comments" && (
            comments.length > 0 ? (
              <div className="flex flex-col gap-3">
                {comments.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/board/${c.post_id}`)}
                    className="bg-white rounded-[16px] p-4 flex flex-col gap-2 text-left hover:shadow-[0px_4px_10px_rgba(0,0,0,0.1)] transition-shadow"
                  >
                    <p className="text-[14px] text-[#364153] leading-[20px] tracking-[-0.32px] line-clamp-2">
                      {c.content}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <img src="/icons/Comment.svg" width={12} height={12} />
                      <span className="text-[12px] text-[#99a1af] tracking-[-0.32px] truncate">
                        {c.post_title}
                      </span>
                      <span className="text-[#d1d5dc] shrink-0">·</span>
                      <span className="text-[12px] text-[#99a1af] tracking-[-0.32px] shrink-0">
                        {relativeTime(c.created_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Empty text="아직 작성한 댓글이 없어요" />
            )
          )}
        </div>

      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">{text}</p>
    </div>
  );
}

function CoffeeChatButton({
  chatStatus,
  loading,
  onClick,
}: {
  chatStatus: { id: string; status: "pending" | "accepted"; role: "requester" | "recipient"; requester_email: string | null; recipient_email: string | null } | null;
  loading: boolean;
  onClick: () => void;
}) {
  const { toast } = useToast();

  if (chatStatus?.status === "accepted") {
    const myEmail = chatStatus.role === "requester" ? chatStatus.recipient_email : chatStatus.requester_email;

    async function handleCopy() {
      if (!myEmail) return;
      try {
        await navigator.clipboard.writeText(myEmail);
        toast("이메일 복사됐어요", "info");
      } catch {
        // clipboard API 실패 시 fallback
        const el = document.createElement("textarea");
        el.value = myEmail;
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
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#f4e5ff] rounded-[12px]">
        <div className="flex items-center gap-2">
          <img src="/icons/coffeechat-purple.svg" width={24} height={24} className="shrink-0" />
          <p className="text-[14px] font-bold text-[#ae49fd] tracking-[-0.32px]">커피챗 연결됨</p>
        </div>
        {myEmail && (
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-black tracking-[-0.32px]">{myEmail}</p>
            <button
              onClick={handleCopy}
              className="shrink-0 opacity-50 hover:opacity-80 transition-opacity"
              title="이메일 복사"
            >
              <img src="/icons/copy_purple.svg" width={16} height={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (chatStatus?.status === "pending" && chatStatus.role === "requester") {
    return (
      <button disabled className="w-full py-3 bg-[#f3f4f6] text-[#99a1af] text-[14px] font-semibold rounded-[12px] tracking-[-0.32px] flex items-center justify-center gap-2">
        <img src="/icons/coffeechat_big.svg" width={20} height={20} className="opacity-50" />
        커피챗 신청 중...
      </button>
    );
  }

  if (chatStatus?.status === "pending" && chatStatus.role === "recipient") {
    return (
      <button
        onClick={onClick}
        disabled={loading}
        className="w-full py-3 bg-[#ae49fd] text-white text-[14px] font-semibold rounded-[12px] tracking-[-0.32px] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? "처리 중..." : <><img src="/icons/coffeechat_big.svg" width={20} height={20} className="brightness-0 invert" />커피챗 수락하기</>}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-3 bg-[#101828] text-white text-[14px] font-semibold rounded-[12px] tracking-[-0.32px] disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {loading ? "처리 중..." : <><img src="/icons/coffeechat_big.svg" width={20} height={20} className="brightness-0 invert" />커피챗 신청하기</>}
    </button>
  );
}
