import { useNavigate } from "react-router-dom";
import type { MyApplicationItem, HostPendingItem } from "../api/applications";
import type { CoffeeChatIncoming, CoffeeChatOutgoing } from "../api/coffeechat";

function formatDate(isoStr: string) {
  const d = new Date(isoStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]}) ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface Props {
  myApplications: MyApplicationItem[];
  hostPending: HostPendingItem[];
  incomingChats: CoffeeChatIncoming[];
  outgoingChats: CoffeeChatOutgoing[];
  onAcceptChat: (chatId: string) => Promise<void>;
  loading: boolean;
}

export function ApplicationStatusPanel({ myApplications, hostPending, incomingChats, outgoingChats, onAcceptChat, loading }: Props) {
  const navigate = useNavigate();
  const isEmpty =
    myApplications.length === 0 &&
    hostPending.length === 0 &&
    incomingChats.length === 0 &&
    outgoingChats.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 모임 현황 */}
      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-bold text-[#101828] tracking-[-0.32px]">내 모임 현황</p>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-[60px] rounded-[12px] bg-[#f3f4f6] animate-pulse" />
            ))}
          </div>
        ) : myApplications.length === 0 && hostPending.length === 0 ? (
          <p className="text-[12px] text-[#99a1af] tracking-[-0.32px] py-1">신청한 모임이 없어요</p>
        ) : (
          <div className="flex flex-col gap-2">
            {/* 신청자 뷰 */}
            {myApplications.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/meetup/${item.meetup_id}`)}
                className="w-full text-left bg-white rounded-[12px] px-3 py-3 flex items-start gap-2.5 hover:bg-[#f9fafb] transition-colors"
              >
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  item.status === "accepted" ? "bg-[#ae49fd]" : "bg-[#f4e5ff]"
                }`}>
                  {item.status === "accepted" ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <img src="/icons/clock.svg" width={11} height={11} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#101828] tracking-[-0.32px] truncate">{item.meetup_title}</p>
                  <p className={`text-[11px] mt-0.5 tracking-[-0.32px] ${item.status === "accepted" ? "text-[#ae49fd]" : "text-[#99a1af]"}`}>
                    {item.status === "accepted" ? "수락됨" : "승인 대기 중"}
                    {item.meetup_start_at && ` · ${formatDate(item.meetup_start_at)}`}
                  </p>
                </div>
              </button>
            ))}

            {/* 호스트 뷰 */}
            {hostPending.map((item) => (
              <button
                key={item.meetup_id}
                onClick={() => navigate(`/meetup/${item.meetup_id}/applications`)}
                className="w-full text-left bg-white rounded-[12px] px-3 py-3 flex items-start gap-2.5 hover:bg-[#f9fafb] transition-colors"
              >
                <div className="mt-0.5 w-5 h-5 rounded-full bg-[#fdf0d5] flex items-center justify-center shrink-0">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="9" cy="7" r="4" stroke="#f59e0b" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#101828] tracking-[-0.32px] truncate">{item.meetup_title}</p>
                  <p className="text-[11px] text-[#f59e0b] mt-0.5 tracking-[-0.32px]">신청자 {item.pending_count}명 대기 중</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 커피챗 현황 */}
      {!loading && (incomingChats.length > 0 || outgoingChats.length > 0) && (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-bold text-[#101828] tracking-[-0.32px]">커피챗</p>
          <div className="flex flex-col gap-2">

            {/* 받은 신청 (pending) */}
            {incomingChats.filter((c) => c.status === "pending").map((chat) => (
              <div key={chat.id} className="bg-white rounded-[12px] px-3 py-3 flex items-start gap-2.5">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-[#fdf0d5] flex items-center justify-center shrink-0 text-[11px]">☕</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#101828] tracking-[-0.32px] truncate">
                    {chat.requester_nickname}님이 신청했어요
                  </p>
                  <button
                    onClick={() => onAcceptChat(chat.id)}
                    className="mt-1.5 px-3 py-1 bg-[#ae49fd] text-white text-[11px] font-semibold rounded-full tracking-[-0.32px]"
                  >
                    수락하기
                  </button>
                </div>
              </div>
            ))}

            {/* 연결된 커피챗 (accepted) */}
            {[
              ...incomingChats.filter((c) => c.status === "accepted").map((c) => ({
                id: c.id, nickname: c.requester_nickname, email: c.requester_email,
              })),
              ...outgoingChats.filter((c) => c.status === "accepted").map((c) => ({
                id: c.id, nickname: c.recipient_nickname, email: c.recipient_email,
              })),
            ].map((item) => (
              <div key={item.id} className="bg-[#f4e5ff] rounded-[12px] px-3 py-3 flex items-start gap-2.5">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-[#ae49fd] flex items-center justify-center shrink-0 text-[11px]">☕</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#ae49fd] tracking-[-0.32px] truncate">{item.nickname}</p>
                  {item.email && <p className="text-[11px] text-[#ae49fd] mt-0.5 tracking-[-0.32px] truncate">{item.email}</p>}
                </div>
              </div>
            ))}

            {/* 내가 보낸 대기 중 */}
            {outgoingChats.filter((c) => c.status === "pending").map((chat) => (
              <div key={chat.id} className="bg-white rounded-[12px] px-3 py-3 flex items-start gap-2.5">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0 text-[11px]">☕</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#101828] tracking-[-0.32px] truncate">{chat.recipient_nickname}</p>
                  <p className="text-[11px] text-[#99a1af] mt-0.5 tracking-[-0.32px]">수락 대기 중</p>
                </div>
              </div>
            ))}

          </div>
        </div>
      )}

      {!loading && isEmpty && (
        <p className="text-[12px] text-[#99a1af] tracking-[-0.32px] py-2">아직 활동 내역이 없어요</p>
      )}
    </div>
  );
}

// 모바일용 슬라이드업 드로어
interface DrawerProps extends Props {
  open: boolean;
  onClose: () => void;
}

export function ApplicationStatusDrawer({ open, onClose, ...panelProps }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-[#f5f6f8] rounded-t-[24px] px-4 pt-5 pb-8 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#d1d5dc] rounded-full mx-auto mb-5" />
        <ApplicationStatusPanel {...panelProps} />
      </div>
    </div>
  );
}
