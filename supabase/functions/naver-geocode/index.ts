import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CLIENT_ID = Deno.env.get("NAVER_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("NAVER_CLIENT_SECRET")!;

const NAVER_HEADERS = {
  "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
  "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { type, lat, lng, query } = await req.json();

    if (type === "reverse") {
      const res = await fetch(
        `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&output=json&orders=admcode`,
        { headers: NAVER_HEADERS }
      );
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (type === "search") {
      const res = await fetch(
        `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`,
        { headers: NAVER_HEADERS }
      );
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response("Bad Request", { status: 400, headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
