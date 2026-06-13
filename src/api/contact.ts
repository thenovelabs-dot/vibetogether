import { supabase } from "../lib/supabase";

export async function sendContactEmail(params: {
  type: "inquiry" | "report";
  tag: string;
  content: string;
  senderEmail: string;
  targetInfo?: { type: string; title: string; id: string };
}): Promise<void> {
  // DB에 저장
  const { error } = await supabase.from("contact_requests").insert({
    type: params.type,
    tag: params.tag,
    content: params.content,
    sender_email: params.senderEmail,
    target_type: params.targetInfo?.type ?? null,
    target_title: params.targetInfo?.title ?? null,
    target_id: params.targetInfo?.id ?? null,
  });
  if (error) throw error;

  // 이메일 발송 (실패해도 사용자에게 에러 안 보임)
  supabase.functions.invoke("send-contact-email", {
    body: params,
  }).catch(() => {});
}
