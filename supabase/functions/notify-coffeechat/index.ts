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

    // 커피챗 + 신청자 닉네임 조회
    const { data: chat } = await admin
      .from("coffee_chats")
      .select("recipient_id, requester:users!requester_id(nickname)")
      .eq("id", coffee_chat_id)
      .single();

    if (!chat) {
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 수신자 이메일 조회
    const { data: recipientAuth } = await admin.auth.admin.getUserById(chat.recipient_id);
    const recipientEmail = recipientAuth?.user?.email;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requesterNickname = (chat.requester as any)?.nickname ?? "누군가";

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && recipientEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "같이바코할사람 <onboarding@resend.dev>",
          to: recipientEmail,
          subject: `[같이바코할사람] ${requesterNickname}님이 커피챗을 신청했어요 ☕`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <h2 style="color: #101828; margin-bottom: 8px;">커피챗 신청이 왔어요!</h2>
              <p style="color: #6a7282; margin-bottom: 24px;">
                <strong style="color: #101828;">${requesterNickname}</strong>님이 커피챗을 신청했어요.
              </p>
              <p style="color: #99a1af; font-size: 13px;">
                앱에서 수락하면 서로의 이메일이 공개돼요 🙌
              </p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
