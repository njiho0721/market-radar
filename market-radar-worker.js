export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, service: "market-radar-proxy" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });
    }

    if (url.pathname !== "/quote") {
      return new Response(JSON.stringify({ error: "Use /quote?symbols=MU,ORCL,005930.KS" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });
    }

    const symbols = url.searchParams.get("symbols") || "";
    if (!symbols.trim()) {
      return new Response(JSON.stringify({ error: "Missing symbols" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });
    }

    const yahooUrl = "https://query1.finance.yahoo.com/v7/finance/quote?symbols="
      + encodeURIComponent(symbols)
      + "&lang=ko-KR&region=KR";

    const yahooResponse = await fetch(yahooUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 MarketRadar/1.0",
        "Accept": "application/json,text/plain,*/*"
      }
    });

    const body = await yahooResponse.text();
    return new Response(body, {
      status: yahooResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
    });
  }
};
