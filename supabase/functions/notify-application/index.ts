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
    const { meetup_id } = await req.json();
    if (!meetup_id) {
      return new Response(JSON.stringify({ error: "meetup_id required" }), {
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
    const { data: { user: callerUser }, error: authErr } = await caller.auth.getUser();
    if (authErr || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 모임 + 호스트 조회
    const { data: meetup, error: meetupErr } = await admin
      .from("meetups")
      .select("title, host_id")
      .eq("id", meetup_id)
      .single();

    if (meetupErr || !meetup) {
      return new Response(JSON.stringify({ error: "Meetup not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 신청자가 호스트 본인이면 생략
    if (meetup.host_id === callerUser.id) {
      return new Response(JSON.stringify({ skipped: "applicant is host" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 신청자 닉네임 조회
    const { data: applicantUser } = await admin
      .from("users")
      .select("nickname")
      .eq("id", callerUser.id)
      .single();

    // 호스트 이메일 조회
    const { data: hostAuth } = await admin.auth.admin.getUserById(meetup.host_id);
    const hostEmail = hostAuth?.user?.email;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    console.log("[notify-application] resendKey존재:", !!resendKey, "hostEmail:", hostEmail);
    if (resendKey && hostEmail) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "같이바코할사람 <onboarding@resend.dev>",
          to: hostEmail,
          subject: `[같이바코할사람] '${meetup.title}'에 새 신청이 왔어요`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <h2 style="color: #101828; margin-bottom: 8px;">새 신청이 왔어요!</h2>
              <p style="color: #6a7282; margin-bottom: 24px;">
                <strong style="color: #101828;">${applicantUser?.nickname ?? "누군가"}</strong>님이
                <strong style="color: #101828;">'${meetup.title}'</strong> 모임에 참가 신청했어요.
              </p>
              <p style="color: #99a1af; font-size: 13px;">
                신청자 목록에서 수락 여부를 결정해보세요 🙌
              </p>
            </div>
          `,
        }),
      });
      const resendBody = await resendRes.text();
      console.log("[notify-application] Resend 응답:", resendRes.status, resendBody);
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
