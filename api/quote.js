export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const symbol = (req.query.symbol || "").toUpperCase();

  try {
    // =========================
    // 한국주식 / ETF
    // =========================
    if (
      symbol.endsWith(".KS") ||
      /^\d{6}$/.test(symbol) ||
      /^\d{6}\.KS$/.test(symbol)
    ) {
      const code = symbol.replace(".KS", "");

      const r = await fetch(
        `https://finance.naver.com/item/main.naver?code=${code}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      );

      const html = await r.text();

      const priceMatch = html.match(
        /<p class="no_today">[\s\S]*?<span class="blind">([\d,]+)<\/span>/
      );

      const changeMatch = html.match(
        /<span class="blind">([\+\-]?\d+\.\d+)%<\/span>/
      );

      const price = priceMatch
        ? Number(priceMatch[1].replace(/,/g, ""))
        : null;

      const dp = changeMatch
        ? Number(changeMatch[1])
        : 0;

      return res.status(200).json({
        c: price,
        dp,
        source: "naver",
        currency: "KRW",
      });
    }

    // =========================
    // 환율
    // =========================
    if (symbol === "USDKRW") {
      const r = await fetch(
        "https://finance.naver.com/marketindex/exchangeDetail.naver?marketindexCd=FX_USDKRW"
      );

      const html = await r.text();

      const match = html.match(
        /<span class="value">([\d,\.]+)<\/span>/
      );

      const price = match
        ? Number(match[1].replace(/,/g, ""))
        : null;

      return res.status(200).json({
        c: price,
        dp: 0,
        source: "naver_fx",
        currency: "KRW",
      });
    }

    // =========================
    // VIX
    // =========================
    if (symbol === "VIX") {
      const r = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=VIXM&token=d8p0k71r01qp954tuqcgd8p0k71r01qp954tuqd0`
      );

      const data = await r.json();

      return res.status(200).json({
        ...data,
        source: "finnhub",
      });
    }

    // =========================
    // 미국주식 / ETF
    // =========================
    const r = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=d8p0k71r01qp954tuqcgd8p0k71r01qp954tuqd0`
    );

    const data = await r.json();

    return res.status(200).json({
      ...data,
      source: "finnhub",
    });
  } catch (e) {
    return res.status(500).json({
      error: e.message,
    });
  }
}
