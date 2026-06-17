export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const symbol = req.query.symbol || "AAPL";

  try {
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
