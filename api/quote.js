export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const symbol = req.query.symbol || "";

  try {

    // 한국 주식/ETF
    if (symbol.endsWith(".KS")) {

      const code = symbol.replace(".KS", "");

      const r = await fetch(
        `https://finance.naver.com/item/main.naver?code=${code}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

      const html = await r.text();

      const match = html.match(
        /<p class="no_today">[\s\S]*?<span class="blind">([\d,]+)<\/span>/
      );

      if (!match) {
        return res.status(500).json({
          error: "NAVER_PARSE_FAIL"
        });
      }

      const price = Number(match[1].replace(/,/g, ""));

      return res.status(200).json({
        c: price,
        source: "naver"
      });
    }

    // 미국주식
    const r = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=d8p0k71r01qp954tuqcgd8p0k71r01qp954tuqd0`
    );

    const data = await r.json();

    return res.status(200).json(data);

  } catch (e) {

    return res.status(500).json({
      error: e.message
    });

  }
}
