export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const symbols = req.query.symbols || "";
  if (!symbols.trim()) {
    return res.status(400).json({ error: "Missing symbols" });
  }

  const yahooUrl =
    "https://query1.finance.yahoo.com/v7/finance/quote?symbols=" +
    encodeURIComponent(symbols) +
    "&lang=ko-KR&region=KR";

  try {
    const yahooResponse = await fetch(yahooUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 MarketRadar/1.0",
        Accept: "application/json,text/plain,*/*",
      },
    });

    const data = await yahooResponse.json();
    return res.status(yahooResponse.status).json(data);
  } catch (err) {
    return res.status(500).json({
      error: "Yahoo fetch failed",
      message: err.message,
    });
  }
}
