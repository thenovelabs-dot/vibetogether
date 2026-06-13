import { supabase } from "../lib/supabase";

export interface CoffeeChatOutgoing {
  id: string;
  recipient_id: string;
  recipient_nickname: string;
  recipient_email: string | null;
  status: "pending" | "accepted";
  created_at: string;
}

export interface CoffeeChatIncoming {
  id: string;
  requester_id: string;
  requester_nickname: string;
  requester_email: string | null;
  status: "pending" | "accepted";
  created_at: string;
}

export interface MyCoffeeChats {
  outgoing: CoffeeChatOutgoing[];
  incoming: CoffeeChatIncoming[];
}

export async function requestCoffeeChat(recipientId: string): Promise<string> {
  const { data, error } = await supabase.rpc("request_coffee_chat", { p_recipient_id: recipientId });
  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("already_requested")) throw new Error("이미 신청했어요");
    if (msg.includes("cannot_self_request")) throw new Error("자기 자신에게는 신청할 수 없어요");
    throw error;
  }
  return data as string;
}

export async function acceptCoffeeChat(chatId: string): Promise<{ requester_email: string | null; recipient_email: string | null }> {
  const { data, error } = await supabase.functions.invoke("accept-coffeechat", {
    body: { coffee_chat_id: chatId },
  });
  if (error) throw error;
  return data;
}

export async function getCoffeeChatWith(otherUserId: string): Promise<{
  id: string;
  status: "pending" | "accepted";
  role: "requester" | "recipient";
  requester_email: string | null;
  recipient_email: string | null;
} | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("coffee_chats")
    .select("id, status, requester_id, recipient_id, requester_email, recipient_email")
    .or(`and(requester_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    status: data.status as "pending" | "accepted",
    role: data.requester_id === user.id ? "requester" : "recipient",
    requester_email: data.requester_email ?? null,
    recipient_email: data.recipient_email ?? null,
  };
}

export async function getMyCoffeeChats(): Promise<MyCoffeeChats> {
  const { data, error } = await supabase
    .from("coffee_chats")
    .select(`
      id, status, requester_id, recipient_id, requester_email, recipient_email, created_at,
      requester:users!requester_id(nickname),
      recipient:users!recipient_id(nickname)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { outgoing: [], incoming: [] };

  const outgoing: CoffeeChatOutgoing[] = [];
  const incoming: CoffeeChatIncoming[] = [];

  for (const row of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    if (r.requester_id === user.id) {
      outgoing.push({
        id: r.id,
        recipient_id: r.recipient_id,
        recipient_nickname: r.recipient?.nickname ?? "알 수 없음",
        recipient_email: r.status === "accepted" ? (r.recipient_email ?? null) : null,
        status: r.status,
        created_at: r.created_at,
      });
    } else {
      incoming.push({
        id: r.id,
        requester_id: r.requester_id,
        requester_nickname: r.requester?.nickname ?? "알 수 없음",
        requester_email: r.status === "accepted" ? (r.requester_email ?? null) : null,
        status: r.status,
        created_at: r.created_at,
      });
    }
  }

  return { outgoing, incoming };
}
