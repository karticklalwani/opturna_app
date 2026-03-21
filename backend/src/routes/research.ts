import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import YahooFinance from "yahoo-finance2";
import OpenAI from "openai";

const yf = new YahooFinance();

const researchRouter = new Hono();

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey });
}

// ─── Yahoo Finance Types ─────────────────────────────────────────────────────

interface YFQuote {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  currency?: string;
  fullExchangeName?: string;
  exchange?: string;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

interface YFSearchResult {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchDisp?: string;
    typeDisp?: string;
    exchange?: string;
  }>;
  news?: Array<{
    uuid: string;
    title: string;
    publisher: string;
    link: string;
    providerPublishTime?: Date | string | number;
    type?: string;
    thumbnail?: { resolutions?: Array<{ url?: string }> };
  }>;
}

interface YFChartResult {
  quotes?: Array<{
    date?: Date | string;
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
    volume?: number | null;
  }>;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/research/quote/:symbol — Real-time quote
researchRouter.get("/quote/:symbol", async (c) => {
  const symbol = c.req.param("symbol").toUpperCase();
  try {
    const quote = await yf.quote(symbol, {}, { validateResult: false }) as YFQuote;
    return c.json({
      data: {
        symbol: quote.symbol ?? symbol,
        shortName: quote.shortName ?? null,
        longName: quote.longName ?? null,
        price: quote.regularMarketPrice ?? null,
        previousClose: quote.regularMarketPreviousClose ?? null,
        change: quote.regularMarketChange ?? null,
        changePercent: quote.regularMarketChangePercent ?? null,
        open: quote.regularMarketOpen ?? null,
        high: quote.regularMarketDayHigh ?? null,
        low: quote.regularMarketDayLow ?? null,
        volume: quote.regularMarketVolume ?? null,
        marketCap: quote.marketCap ?? null,
        currency: quote.currency ?? null,
        exchange: quote.fullExchangeName ?? quote.exchange ?? null,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch quote";
    return c.json({ error: { message } }, 502);
  }
});

// GET /api/research/search?q=... — Search for tickers/companies
researchRouter.get(
  "/search",
  zValidator("query", z.object({ q: z.string().min(1).max(100) })),
  async (c) => {
    const { q } = c.req.valid("query");
    try {
      const results = await yf.search(q, {}, { validateResult: false }) as YFSearchResult;
      const quotes = (results.quotes ?? []).slice(0, 10).map((item) => ({
        symbol: item.symbol ?? null,
        shortname: item.shortname ?? null,
        longname: item.longname ?? null,
        exchDisp: item.exchDisp ?? null,
        typeDisp: item.typeDisp ?? null,
      }));
      return c.json({ data: quotes });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      return c.json({ error: { message } }, 502);
    }
  }
);

// GET /api/research/history/:symbol — Historical OHLC data
researchRouter.get(
  "/history/:symbol",
  zValidator("query", z.object({
    period1: z.string().optional(),
    period2: z.string().optional(),
    interval: z.enum(["1d", "1wk", "1mo"]).optional(),
  })),
  async (c) => {
    const symbol = c.req.param("symbol").toUpperCase();
    const { period1, period2, interval } = c.req.valid("query");
    try {
      const result = await yf.chart(symbol, {
        period1: period1 ?? "2024-01-01",
        period2: period2 ?? new Date().toISOString().split("T")[0]!,
        interval: (interval ?? "1d") as "1d" | "1wk" | "1mo",
      }, { validateResult: false }) as YFChartResult;

      const candles = (result.quotes ?? []).map((q) => ({
        date: q.date ? new Date(q.date).toISOString() : null,
        open: q.open ?? null,
        high: q.high ?? null,
        low: q.low ?? null,
        close: q.close ?? null,
        volume: q.volume ?? null,
      }));
      return c.json({ data: candles });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch history";
      return c.json({ error: { message } }, 502);
    }
  }
);

// GET /api/research/news/:symbol — News for a symbol
researchRouter.get("/news/:symbol", async (c) => {
  const symbol = c.req.param("symbol").toUpperCase();
  try {
    const result = await yf.search(symbol, { newsCount: 10, quotesCount: 0 }, { validateResult: false }) as YFSearchResult;
    const news = (result.news ?? []).map((n) => ({
      uuid: n.uuid,
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      providerPublishTime: n.providerPublishTime
        ? new Date(n.providerPublishTime as string).toISOString()
        : null,
      type: n.type ?? null,
      thumbnail: n.thumbnail?.resolutions?.[0]?.url ?? null,
    }));
    return c.json({ data: news });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch news";
    return c.json({ error: { message } }, 502);
  }
});

// POST /api/research/analyze — AI-powered analysis with OpenAI
researchRouter.post(
  "/analyze",
  zValidator("json", z.object({
    symbol: z.string().min(1).max(20),
    context: z.string().max(2000).optional(),
    language: z.enum(["en", "es"]).optional(),
  })),
  async (c) => {
    const { symbol, context, language } = c.req.valid("json");
    const upperSymbol = symbol.toUpperCase();

    let quoteText = "";
    try {
      const quote = await yf.quote(upperSymbol, {}, { validateResult: false }) as YFQuote;
      quoteText = [
        `Current data for ${upperSymbol}:`,
        `- Price: ${quote.regularMarketPrice ?? "N/A"} ${quote.currency ?? ""}`,
        `- Change: ${quote.regularMarketChange?.toFixed(2) ?? "N/A"} (${quote.regularMarketChangePercent?.toFixed(2) ?? "N/A"}%)`,
        `- Market Cap: ${quote.marketCap ? (quote.marketCap / 1e9).toFixed(2) + "B" : "N/A"}`,
        `- 52W High: ${quote.fiftyTwoWeekHigh ?? "N/A"} | 52W Low: ${quote.fiftyTwoWeekLow ?? "N/A"}`,
        `- Volume: ${quote.regularMarketVolume ?? "N/A"}`,
      ].join("\n");
    } catch {
      quoteText = `Symbol: ${upperSymbol} (live data unavailable)`;
    }

    const isSpanish = language === "es";
    const systemPrompt = isSpanish
      ? "Eres un analista financiero experto. Proporciona análisis concisos, claros y basados en datos. No das consejos de inversión específicos, solo análisis educativo."
      : "You are an expert financial analyst. Provide concise, clear, data-driven analysis. You do not give specific investment advice, only educational analysis.";

    const userPrompt = isSpanish
      ? `Analiza el activo ${upperSymbol} con los siguientes datos en tiempo real:\n\n${quoteText}${context ? `\n\nContexto adicional: ${context}` : ""}\n\nProporciona: 1) Resumen del estado actual, 2) Factores clave a considerar, 3) Niveles técnicos importantes.`
      : `Analyze the asset ${upperSymbol} with the following real-time data:\n\n${quoteText}${context ? `\n\nAdditional context: ${context}` : ""}\n\nProvide: 1) Current state summary, 2) Key factors to consider, 3) Important technical levels.`;

    try {
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 600,
        temperature: 0.7,
      });
      const analysis = completion.choices[0]?.message?.content ?? "";
      return c.json({ data: { symbol: upperSymbol, analysis, quoteSnapshot: quoteText } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI analysis failed";
      return c.json({ error: { message } }, 502);
    }
  }
);

// GET /api/research/summary/:symbol — Quick AI one-liner summary
researchRouter.get("/summary/:symbol", async (c) => {
  const symbol = c.req.param("symbol").toUpperCase();
  let quoteText = "";
  try {
    const quote = await yf.quote(symbol, {}, { validateResult: false }) as YFQuote;
    quoteText = `${symbol}: ${quote.regularMarketPrice ?? "N/A"} ${quote.currency ?? ""}, Change: ${quote.regularMarketChangePercent?.toFixed(2) ?? "N/A"}%`;
  } catch {
    quoteText = `Symbol: ${symbol} (live data unavailable)`;
  }

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise financial analyst. Give a 2-3 sentence market summary." },
        { role: "user", content: `Give a brief market summary for ${symbol}. Data: ${quoteText}` },
      ],
      max_tokens: 150,
      temperature: 0.5,
    });
    const summary = completion.choices[0]?.message?.content ?? "";
    return c.json({ data: { symbol, summary } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Summary generation failed";
    return c.json({ error: { message } }, 502);
  }
});

export default researchRouter;
