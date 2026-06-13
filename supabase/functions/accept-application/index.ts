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
    const { application_id } = await req.json();
    if (!application_id) {
      return new Response(JSON.stringify({ error: "application_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client (RLS 우회 — 서버에서만 사용)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 호출자 확인 (anon key로 전달된 JWT)
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

    // 신청 정보 조회
    const { data: app, error: appErr } = await admin
      .from("meetup_applications")
      .select("id, status, meetup_id, user_id")
      .eq("id", application_id)
      .single();

    if (appErr || !app) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 모임 정보 + 호스트 확인
    const { data: meetup, error: meetupErr } = await admin
      .from("meetups")
      .select("id, title, host_id")
      .eq("id", app.meetup_id)
      .single();

    if (meetupErr || !meetup) {
      return new Response(JSON.stringify({ error: "Meetup not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 정원 확인 + 수락을 단일 트랜잭션으로 처리 (경쟁 조건 방지)
    const { error: rpcErr } = await admin.rpc("accept_application_atomic", {
      p_app_id: application_id,
      p_caller_id: callerUser.id,
    });

    if (rpcErr) {
      const msg = rpcErr.message ?? "";
      if (msg.includes("not_host")) {
        return new Response(JSON.stringify({ error: "Only the host can accept applications" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.includes("meetup_full")) {
        return new Response(JSON.stringify({ error: "Meetup is full" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.includes("not_pending")) {
        return new Response(JSON.stringify({ error: "Application is not pending" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: rpcErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 이메일 주소 조회 (auth.users)
    const { data: applicantAuth } = await admin.auth.admin.getUserById(app.user_id);
    const { data: hostAuth } = await admin.auth.admin.getUserById(meetup.host_id);

    const applicantEmail = applicantAuth?.user?.email;
    const hostEmail = hostAuth?.user?.email;

    // 수락된 신청에 host_email 저장 (신청자 UI에서 표시)
    if (hostEmail) {
      await admin
        .from("meetup_applications")
        .update({ host_email: hostEmail })
        .eq("id", application_id);
    }

    // Resend 이메일 발송
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && applicantEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "같이바코할사람 <onboarding@resend.dev>",
          to: applicantEmail,
          subject: `[같이바코할사람] '${meetup.title}' 신청이 수락됐어요 🎉`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <h2 style="color: #101828; margin-bottom: 8px;">신청이 수락됐어요!</h2>
              <p style="color: #6a7282; margin-bottom: 24px;">
                <strong style="color: #101828;">'${meetup.title}'</strong> 모임 참가 신청이 수락됐어요.
              </p>
              <div style="background: #f4e5ff; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px; font-size: 12px; color: #6a7282;">호스트 연락처</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #ae49fd;">${hostEmail ?? "이메일 없음"}</p>
              </div>
              <p style="color: #99a1af; font-size: 13px;">
                호스트에게 연락해서 일정을 확인해보세요.<br/>
                즐거운 모각작 되세요 🙌
              </p>
            </div>
          `,
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, host_email: hostEmail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
