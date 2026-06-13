const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, tag, content, senderEmail, targetInfo } = await req.json();
    console.log("[send-contact-email] received:", { type, tag, senderEmail });

    const isReport = type === "report";
    const subject = isReport
      ? `[신고] ${tag} — ${targetInfo?.title ?? ""}`
      : `[문의] ${tag} — ${senderEmail}`;

    const targetLine = targetInfo
      ? `\n대상: ${targetInfo.type} / ${targetInfo.title} (ID: ${targetInfo.id})`
      : "";

    const bodyText = [
      `유형: ${isReport ? "신고" : "문의"}`,
      `태그: ${tag}`,
      `발신자 이메일: ${senderEmail}`,
      targetLine,
      ``,
      `내용:`,
      content,
    ].join("\n");

    const bodyHtml = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #101828;">
        <h2 style="margin-bottom: 16px;">${isReport ? "🚨 신고 접수" : "📬 문의 접수"}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #6a7282; width: 120px;">유형</td><td>${isReport ? "신고" : "문의"}</td></tr>
          <tr><td style="padding: 6px 0; color: #6a7282;">태그</td><td>${tag}</td></tr>
          <tr><td style="padding: 6px 0; color: #6a7282;">발신자</td><td>${senderEmail}</td></tr>
          ${targetInfo ? `<tr><td style="padding: 6px 0; color: #6a7282;">대상</td><td>${targetInfo.type} / ${targetInfo.title}</td></tr>` : ""}
        </table>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #f3f4f6;" />
        <p style="font-size: 14px; color: #364153; white-space: pre-wrap;">${content}</p>
      </div>
    `;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not set");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "같이바코할사람 <onboarding@resend.dev>",
        to: ["thenovelabs@gmail.com"],
        subject,
        text: bodyText,
        html: bodyHtml,
      }),
    });

    const resBody = await res.text();
    console.log("[send-contact-email] Resend status:", res.status, resBody);

    if (!res.ok) {
      throw new Error(`Resend error: ${resBody}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-contact-email] error:", String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
