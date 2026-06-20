import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOKEN_URL = "https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/generate-token";
const ME_URL = "https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/login-me";

const ENCRYPTED_FIELDS = ["name", "phone", "birthday", "ci", "gender", "nationality", "email"] as const;

function getMtlsClient(): Deno.HttpClient | undefined {
  const cert = Deno.env.get("TOSS_MTLS_CERT");
  const key = Deno.env.get("TOSS_MTLS_KEY");
  if (!cert || !key) return undefined;
  return Deno.createHttpClient({ cert, key });
}

async function decryptField(base64Value: string, rawKey: Uint8Array, aad: Uint8Array): Promise<string> {
  const data = Uint8Array.from(atob(base64Value), (c) => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const cryptoKey = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: aad }, cryptoKey, ciphertext);
  return new TextDecoder().decode(plaintext);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorizationCode, referrer } = await req.json();
    if (!authorizationCode || !referrer) {
      return new Response(JSON.stringify({ error: "authorizationCode, referrer required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const decryptionKeyB64 = Deno.env.get("TOSS_LOGIN_DECRYPT_KEY");
    const aadValue = Deno.env.get("TOSS_LOGIN_AAD");
    if (!decryptionKeyB64 || !aadValue) {
      return new Response(JSON.stringify({ error: "Server not configured: missing decryption key or AAD" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = getMtlsClient();

    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorizationCode, referrer }),
      ...(client ? { client } : {}),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || tokenJson.resultType === "FAIL" || !tokenJson.success?.accessToken) {
      return new Response(JSON.stringify({ error: "Toss token exchange failed", detail: tokenJson }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = tokenJson.success.accessToken;

    const meRes = await fetch(ME_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      ...(client ? { client } : {}),
    });
    const meJson = await meRes.json();
    if (!meRes.ok || meJson.resultType === "FAIL") {
      return new Response(JSON.stringify({ error: "Toss user info fetch failed", detail: meJson }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawUser = meJson.success ?? meJson;
    const rawKey = Uint8Array.from(atob(decryptionKeyB64), (c) => c.charCodeAt(0));
    const aad = new TextEncoder().encode(aadValue);

    const decrypted: Record<string, string> = {};
    for (const field of ENCRYPTED_FIELDS) {
      const value = rawUser[field];
      if (typeof value === "string" && value.length > 0) {
        decrypted[field] = await decryptField(value, rawKey, aad);
      }
    }

    const tossUserKey = String(rawUser.userKey);
    const email = decrypted.email || `toss-${tossUserKey}@vibetogether.toss`;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { toss_user_key: tossUserKey, toss_name: decrypted.name ?? null },
    });
    if (createError && createError.code !== "email_exists") {
      return new Response(JSON.stringify({ error: "Failed to create user", detail: createError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkError || !linkData.properties?.email_otp) {
      return new Response(JSON.stringify({ error: "Failed to issue session", detail: linkError?.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        tossUserKey,
        email,
        otp: linkData.properties.email_otp,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
