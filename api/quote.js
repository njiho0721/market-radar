export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();

  const symbol = String(req.query.symbol || "").trim();
  if (!symbol) return res.status(400).json({ error: "Missing symbol" });

  try {
    if (symbol === "USDKRW") {
      const r = await fetch("https://finance.naver.com/marketindex/", {
        headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" }
      });
      const html = await r.text();
      const box = html.match(/<h3 class="h_lst"><span class="blind">미국 USD<\/span><\/h3>[\s\S]*?<div class="head_info[^>]*>([\s\S]*?)<\/div>/)
               || html.match(/<div class="head_info[^>]*>([\s\S]*?)<\/div>/);
      const chunk = box ? box[1] : html;
      const value = (chunk.match(/<span class="value">([\d,.]+)<\/span>/) || [])[1];
      const change = (chunk.match(/<span class="change">([\d,.]+)<\/span>/) || [])[1];
      const percent = (chunk.match(/<span class="blind">([\d,.]+)%\s*(상승|하락)?<\/span>/) || [])[1];
      const isDown = /하락|down/.test(chunk);
      if (!value) return res.status(500).json({ error: "NAVER_FX_PARSE_FAIL" });

      const c = Number(value.replace(/,/g, ""));
      const d = change ? Number(change.replace(/,/g, "")) * (isDown ? -1 : 1) : 0;
      const dp = percent ? Number(percent.replace(/,/g, "")) * (isDown ? -1 : 1) : 0;

      return res.status(200).json({ c, d, dp, source: "naver_fx", currency: "KRW" });
    }

    if (symbol.endsWith(".KS")) {
      const code = symbol.replace(".KS", "");
      const r = await fetch(`https://finance.naver.com/item/main.naver?code=${code}`, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" }
      });
      const html = await r.text();

      const priceText = (html.match(/<p class="no_today">[\s\S]*?<span class="blind">([\d,]+)<\/span>/) || [])[1];
      if (!priceText) return res.status(500).json({ error: "NAVER_PRICE_PARSE_FAIL", symbol });

      const c = Number(priceText.replace(/,/g, ""));
      const exday = (html.match(/<p class="no_exday">([\s\S]*?)<\/p>/) || [])[1] || "";
      const blindVals = [...exday.matchAll(/<span class="blind">([^<]+)<\/span>/g)].map(m => m[1].trim());
      const numericVals = blindVals.filter(v => /^[\d,.]+$/.test(v));
      const sign = /no_down|ico down|하락/.test(exday) ? -1 : (/no_up|ico up|상승/.test(exday) ? 1 : 0);

      const d = numericVals[0] ? Number(numericVals[0].replace(/,/g, "")) * sign : 0;
      const dp = numericVals[1] ? Number(numericVals[1].replace(/,/g, "")) * sign : 0;
      const pc = d ? c - d : null;

      return res.status(200).json({ c, d, dp, pc, source: "naver", currency: "KRW" });
    }

    const token = "d8p0k71r01qp954tuqcgd8p0k71r01qp954tuqd0";
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`);
    const data = await r.json();

    if (data && typeof data.c === "number") {
      return res.status(200).json({ ...data, source: "finnhub", currency: "USD" });
    }

    return res.status(502).json({ error: "FINNHUB_BAD_RESPONSE", symbol, data });
  } catch (e) {
    return res.status(500).json({ error: e.message, symbol });
  }
}
