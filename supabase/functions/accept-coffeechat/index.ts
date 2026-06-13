import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coffee_chat_id } = await req.json();
    if (!coffee_chat_id) {
      return new Response(JSON.stringify({ error: "coffee_chat_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 호출자 확인
    const authHeader = req.headers.get("Authorization");
    const caller = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader ?? "" } } },
    );
    const { data: { user: callerUser } } = await caller.auth.getUser();
    if (!callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 커피챗 조회
    const { data: chat } = await admin
      .from("coffee_chats")
      .select("id, status, requester_id, recipient_id")
      .eq("id", coffee_chat_id)
      .single();

    if (!chat) {
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (chat.recipient_id !== callerUser.id) {
      return new Response(JSON.stringify({ error: "Only recipient can accept" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (chat.status !== "pending") {
      return new Response(JSON.stringify({ error: "Already processed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 양쪽 이메일 조회
    const [{ data: requesterAuth }, { data: recipientAuth }] = await Promise.all([
      admin.auth.admin.getUserById(chat.requester_id),
      admin.auth.admin.getUserById(chat.recipient_id),
    ]);
    const requesterEmail = requesterAuth?.user?.email ?? null;
    const recipientEmail = recipientAuth?.user?.email ?? null;

    // 수락 + 이메일 저장
    await admin
      .from("coffee_chats")
      .update({ status: "accepted", requester_email: requesterEmail, recipient_email: recipientEmail })
      .eq("id", coffee_chat_id);

    // 신청자 닉네임 + 수신자 닉네임 조회 (이메일 본문용)
    const { data: users } = await admin
      .from("users")
      .select("id, nickname")
      .in("id", [chat.requester_id, chat.recipient_id]);

    const requesterNickname = users?.find((u: { id: string }) => u.id === chat.requester_id)?.nickname ?? "누군가";
    const recipientNickname = users?.find((u: { id: string }) => u.id === chat.recipient_id)?.nickname ?? "누군가";

    // 신청자에게 수락 이메일 발송
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && requesterEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "같이바코할사람 <onboarding@resend.dev>",
          to: requesterEmail,
          subject: `[같이바코할사람] ${recipientNickname}님이 커피챗을 수락했어요 ☕`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <h2 style="color: #101828; margin-bottom: 8px;">커피챗이 수락됐어요!</h2>
              <p style="color: #6a7282; margin-bottom: 24px;">
                <strong style="color: #101828;">${recipientNickname}</strong>님이 커피챗 신청을 수락했어요.
              </p>
              <div style="background: #f4e5ff; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px; font-size: 12px; color: #6a7282;">${recipientNickname}님 연락처</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #ae49fd;">${recipientEmail ?? "이메일 없음"}</p>
              </div>
              <p style="color: #99a1af; font-size: 13px;">
                ${recipientNickname}님께 먼저 연락해보세요 ☕
              </p>
            </div>
          `,
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, requester_email: requesterEmail, recipient_email: recipientEmail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
