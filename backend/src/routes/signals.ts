import { Hono } from "hono";
import { prisma } from "../prisma.js";
import { runSignalEngine, type AnalysisResult } from "../services/signal-engine.js";
import { searchAssets, fetchRealTimeQuote, fetchOHLCSeries } from "../services/market-data.js";
import { sendTelegramSignalAlert, isTelegramConfigured } from "../services/telegram.js";

export const signalsRouter = new Hono();

// POST /api/signals/analyze
signalsRouter.post("/analyze", async (c) => {
  try {
    const body = await c.req.json() as {
      symbol: string;
      timeframe?: string;
      capitalInvested?: number;
      atrRisk?: number;
    };

    if (!body.symbol) {
      return c.json({ error: { message: "symbol is required", code: "MISSING_SYMBOL" } }, 400);
    }

    const result = await runSignalEngine(
      body.symbol.toUpperCase(),
      body.timeframe || "1h",
      body.capitalInvested || 0,
      body.atrRisk || 4
    );

    // Save signal to DB if valid and not NEUTRAL
    if (result.validationState === "valid" && result.signal !== "NEUTRAL") {
      try {
        const savedSignal = await prisma.signal.create({
          data: {
            symbol: result.symbol,
            name: result.name,
            assetType: result.assetType,
            exchange: result.exchange || "",
            currency: result.currency,
            signal: result.signal,
            signalSource: result.signalSource,
            signalStatus: result.signalStatus,
            price: result.currentPrice,
            entryPrice: result.entryPrice,
            stopLoss: result.stopLoss,
            tp1: result.tp1,
            tp2: result.tp2,
            tp3: result.tp3,
            riskReward: result.riskReward,
            confidenceScore: result.confidenceScore,
            riskLevel: result.riskLevel,
            movementPercent: result.movementPercent,
            gainEstimate: result.gainEstimate,
            lossEstimate: result.lossEstimate,
            capitalInvested: result.capitalInvested,
            timeframe: result.timeframe,
            analysisSummary: result.analysisSummary,
            atr: result.atr,
            supertrendValue: result.supertrendValue,
            telegramSent: false
          }
        });

        // Try Telegram
        if (isTelegramConfigured()) {
          const telegramResult = await sendTelegramSignalAlert(result);
          if (telegramResult.success) {
            await prisma.signal.update({
              where: { id: savedSignal.id },
              data: { telegramSent: true }
            });
            result.telegramSent = true;
          }
          await prisma.telegramDeliveryLog.create({
            data: {
              signalId: savedSignal.id,
              success: telegramResult.success,
              error: telegramResult.error || null
            }
          });
        }
      } catch (dbErr) {
        console.error("DB save error:", dbErr);
        // Don't fail the request if DB save fails
      }
    }

    return c.json({ data: result });
  } catch (err) {
    console.error("Signal analysis error:", err);
    return c.json({ error: { message: "Analysis failed", code: "ANALYSIS_ERROR" } }, 500);
  }
});

// GET /api/signals/search?q=query
signalsRouter.get("/search", async (c) => {
  const q = c.req.query("q") || "";
  if (q.length < 1) {
    return c.json({ data: [] });
  }
  try {
    const results = await searchAssets(q);
    return c.json({ data: results });
  } catch (err) {
    console.error("Search error:", err);
    return c.json({ data: [] });
  }
});

// GET /api/signals/quote/:symbol
signalsRouter.get("/quote/:symbol", async (c) => {
  const symbol = c.req.param("symbol");
  try {
    const quote = await fetchRealTimeQuote(symbol.toUpperCase());
    return c.json({ data: quote });
  } catch (err) {
    console.error("Quote error:", err);
    return c.json({ error: { message: "Quote fetch failed", code: "QUOTE_ERROR" } }, 500);
  }
});

// GET /api/signals/ohlc/:symbol?timeframe=1h
signalsRouter.get("/ohlc/:symbol", async (c) => {
  const symbol = c.req.param("symbol");
  const timeframe = c.req.query("timeframe") || "1h";
  try {
    const candles = await fetchOHLCSeries(symbol.toUpperCase(), timeframe);
    return c.json({ data: candles });
  } catch (err) {
    console.error("OHLC error:", err);
    return c.json({ error: { message: "OHLC fetch failed", code: "OHLC_ERROR" } }, 500);
  }
});

// GET /api/signals/history/:symbol
signalsRouter.get("/history/:symbol", async (c) => {
  const symbol = c.req.param("symbol");
  try {
    const signals = await prisma.signal.findMany({
      where: { symbol: symbol.toUpperCase() },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return c.json({ data: signals });
  } catch (err) {
    console.error("History error:", err);
    return c.json({ data: [] });
  }
});

// GET /api/signals/history (all recent signals)
signalsRouter.get("/history", async (c) => {
  try {
    const signals = await prisma.signal.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return c.json({ data: signals });
  } catch (err) {
    console.error("History error:", err);
    return c.json({ data: [] });
  }
});

// GET /api/signals/telegram/status
signalsRouter.get("/telegram/status", async (c) => {
  return c.json({ data: { configured: isTelegramConfigured() } });
});
