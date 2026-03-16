import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const financeToolsRouter = new Hono();

// ─── Types ───────────────────────────────────────────────────────────────────

type ChartPoint = { month: number; nominal: number; real: number; contributed: number };

// ─── Compound Interest ───────────────────────────────────────────────────────

const compoundInterestSchema = z.object({
  initialAmount: z.number().min(0),
  periodicContribution: z.number().min(0),
  frequency: z.enum(["daily", "weekly", "monthly", "annual"]),
  annualInterestRate: z.number().min(0).max(1000),
  periodMonths: z.number().int().min(1).max(600),
  inflationRate: z.number().min(0).max(1000),
});

const FREQUENCY_MULTIPLIERS: Record<"daily" | "weekly" | "monthly" | "annual", number> = {
  daily: 30.44,
  weekly: 4.33,
  monthly: 1,
  annual: 1 / 12,
};

function calcNominal(
  t: number,
  initialAmount: number,
  periodicContribution: number,
  monthlyMultiplier: number,
  r: number
): number {
  if (r === 0) {
    return initialAmount + periodicContribution * monthlyMultiplier * t;
  }
  const factor = Math.pow(1 + r, t);
  return (
    initialAmount * factor +
    periodicContribution * monthlyMultiplier * ((factor - 1) / r)
  );
}

financeToolsRouter.post(
  "/compound-interest",
  zValidator("json", compoundInterestSchema),
  (c) => {
    const {
      initialAmount,
      periodicContribution,
      frequency,
      annualInterestRate,
      periodMonths,
      inflationRate,
    } = c.req.valid("json");

    const monthlyMultiplier = FREQUENCY_MULTIPLIERS[frequency];
    const r = annualInterestRate / 100 / 12;

    // Determine step size to keep chartData at most 120 points
    let step = 1;
    if (periodMonths > 120) step = 12;
    else if (periodMonths > 60) step = 3;

    const chartData: ChartPoint[] = [];

    for (let t = 0; t <= periodMonths; t += step) {
      const nominal = calcNominal(t, initialAmount, periodicContribution, monthlyMultiplier, r);
      const real =
        inflationRate === 0
          ? nominal
          : nominal / Math.pow(1 + inflationRate / 100, t / 12);
      const contributed = initialAmount + periodicContribution * monthlyMultiplier * t;
      chartData.push({
        month: t,
        nominal: Math.round(nominal * 100) / 100,
        real: Math.round(real * 100) / 100,
        contributed: Math.round(contributed * 100) / 100,
      });
    }

    // Ensure the final month is always included
    const lastPoint = chartData[chartData.length - 1];
    if (lastPoint !== undefined && lastPoint.month !== periodMonths) {
      const t = periodMonths;
      const nominal = calcNominal(t, initialAmount, periodicContribution, monthlyMultiplier, r);
      const real =
        inflationRate === 0
          ? nominal
          : nominal / Math.pow(1 + inflationRate / 100, t / 12);
      const contributed = initialAmount + periodicContribution * monthlyMultiplier * t;
      chartData.push({
        month: t,
        nominal: Math.round(nominal * 100) / 100,
        real: Math.round(real * 100) / 100,
        contributed: Math.round(contributed * 100) / 100,
      });
    }

    const finalPoint = chartData[chartData.length - 1];
    const finalValue = finalPoint?.nominal ?? 0;
    const realValue = finalPoint?.real ?? 0;
    const totalContributed = finalPoint?.contributed ?? 0;
    const totalInterest = Math.round((finalValue - totalContributed) * 100) / 100;
    const realInterest = Math.round((realValue - totalContributed) * 100) / 100;

    return c.json({
      data: {
        totalContributed: Math.round(totalContributed * 100) / 100,
        totalInterest,
        finalValue: Math.round(finalValue * 100) / 100,
        realValue: Math.round(realValue * 100) / 100,
        realInterest,
        chartData,
      },
    });
  }
);

// ─── Inflation ───────────────────────────────────────────────────────────────

financeToolsRouter.get("/inflation", (c) => {
  return c.json({
    data: {
      world: 4.2,
      lastUpdated: "2025-03-01",
      continents: {
        europe: 2.8,
        northAmerica: 3.1,
        southAmerica: 8.4,
        asia: 3.6,
        africa: 14.2,
        oceania: 3.0,
      },
      countries: [
        { code: "ES", name: "España", rate: 2.9, flag: "🇪🇸", trend: "down" },
        { code: "US", name: "Estados Unidos", rate: 3.1, flag: "🇺🇸", trend: "down" },
        { code: "UK", name: "Reino Unido", rate: 2.6, flag: "🇬🇧", trend: "down" },
        { code: "DE", name: "Alemania", rate: 2.4, flag: "🇩🇪", trend: "down" },
        { code: "FR", name: "Francia", rate: 2.2, flag: "🇫🇷", trend: "down" },
        { code: "IT", name: "Italia", rate: 1.8, flag: "🇮🇹", trend: "down" },
        { code: "MX", name: "México", rate: 4.9, flag: "🇲🇽", trend: "stable" },
        { code: "AR", name: "Argentina", rate: 142.7, flag: "🇦🇷", trend: "down" },
        { code: "BR", name: "Brasil", rate: 4.7, flag: "🇧🇷", trend: "up" },
        { code: "JP", name: "Japón", rate: 2.1, flag: "🇯🇵", trend: "up" },
        { code: "CN", name: "China", rate: 0.7, flag: "🇨🇳", trend: "stable" },
        { code: "IN", name: "India", rate: 5.2, flag: "🇮🇳", trend: "down" },
        { code: "TR", name: "Turquía", rate: 64.9, flag: "🇹🇷", trend: "down" },
        { code: "NG", name: "Nigeria", rate: 31.7, flag: "🇳🇬", trend: "up" },
        { code: "AU", name: "Australia", rate: 2.8, flag: "🇦🇺", trend: "down" },
        { code: "CA", name: "Canadá", rate: 2.3, flag: "🇨🇦", trend: "down" },
        { code: "CH", name: "Suiza", rate: 1.1, flag: "🇨🇭", trend: "stable" },
        { code: "KR", name: "Corea del Sur", rate: 2.0, flag: "🇰🇷", trend: "stable" },
        { code: "RU", name: "Rusia", rate: 9.2, flag: "🇷🇺", trend: "up" },
        { code: "ZA", name: "Sudáfrica", rate: 4.1, flag: "🇿🇦", trend: "down" },
      ],
    },
  });
});

// ─── Investment Analysis ─────────────────────────────────────────────────────

const investmentAnalysisSchema = z.object({
  asset: z.string().min(1).max(20),
  amount: z.number().positive(),
  analysisType: z.literal("intraday"),
});

const BASE_PRICES: Record<string, number> = {
  BTC: 85000,
  ETH: 3200,
  SOL: 155,
  BNB: 380,
  AAPL: 185,
  MSFT: 415,
  NVDA: 820,
  GOOGL: 165,
  AMZN: 195,
  TSLA: 265,
  SPY: 510,
  QQQ: 430,
  GLD: 225,
};

function hashAsset(asset: string): number {
  let h = 0;
  for (let i = 0; i < asset.length; i++) {
    h = (Math.imul(31, h) + asset.charCodeAt(i)) | 0;
  }
  return h;
}

type TradingSignal = "BUY" | "SELL" | "EXIT" | "HOLD";
type RecentSignalEntry = { time: string; signal: "BUY" | "SELL" | "EXIT"; price: number };

function runTradingAlgorithm(asset: string, amount: number): {
  asset: string;
  currentPrice: number;
  signal: TradingSignal;
  confidence: number;
  estimatedGain: number;
  estimatedLoss: number;
  riskRewardRatio: number;
  movementPercent: number;
  stopLoss: number;
  takeProfit: number;
  priceHistory: Array<{ time: string; price: number }>;
  recentSignals: RecentSignalEntry[];
  summary: string;
  analysisId: string;
} {
  const upperAsset = asset.toUpperCase();
  const basePrice = BASE_PRICES[upperAsset] ?? 100;
  const seed = Math.sin(hashAsset(upperAsset) + Date.now() / 3600000);

  // Generate 20 price history points using seeded pseudo-random sequence
  const prices: number[] = [];
  let price = basePrice;
  const now = Date.now();
  const priceHistory: Array<{ time: string; price: number }> = [];

  for (let i = 0; i < 20; i++) {
    const localSeed = Math.sin(seed * (i + 1) * 9301 + 49297) * 233280;
    const rand = (localSeed - Math.floor(localSeed)) * 2 - 1; // -1 to 1
    const volatility = basePrice * 0.015; // 1.5% per step
    price = price + rand * volatility;
    prices.push(price);
    const t = new Date(now - (19 - i) * 3 * 60000);
    priceHistory.push({
      time: t.toISOString(),
      price: Math.round(price * 100) / 100,
    });
  }

  const currentPrice = prices[prices.length - 1] ?? basePrice;

  // RSI calculation (14-period but we only have 20 points, use all available)
  const period = Math.min(14, prices.length - 1);
  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const curr = prices[i] ?? 0;
    const prev = prices[i - 1] ?? 0;
    const diff = curr - prev;
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  // MACD (simplified: 6-period EMA minus 12-period EMA)
  const ema6 = prices.slice(-6).reduce((a, b) => a + b, 0) / 6;
  const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const macd = ema6 - ema12;

  // Momentum
  const momentum = (prices[prices.length - 1] ?? 0) - (prices[prices.length - 5] ?? 0);

  // Signal determination
  let signal: TradingSignal;
  let confidence: number;

  if (rsi < 30) {
    signal = "BUY";
    confidence = Math.round(65 + (30 - rsi) * 1.5);
  } else if (rsi > 70) {
    signal = "SELL";
    confidence = Math.round(65 + (rsi - 70) * 1.5);
  } else if (rsi >= 45 && rsi <= 55) {
    signal = macd > 0 ? "EXIT" : "HOLD";
    confidence = Math.round(50 + Math.abs(rsi - 50) * 2);
  } else {
    // Probabilistic based on seeded value
    const prob = (seed + 1) / 2; // 0 to 1
    if (prob > 0.6) {
      signal = macd > 0 ? "BUY" : "SELL";
      confidence = Math.round(52 + prob * 20);
    } else {
      signal = momentum > 0 ? "BUY" : "SELL";
      confidence = Math.round(50 + (1 - prob) * 20);
    }
  }

  confidence = Math.min(95, Math.max(40, confidence));

  // Risk/reward calculations
  const volatilityPct = Math.abs(seed) * 0.03 + 0.02; // 2-5%
  const movementPercent = Math.round(volatilityPct * 100 * 10) / 10;
  const estimatedGain = Math.round(amount * volatilityPct * 1.8 * 100) / 100;
  const estimatedLoss = Math.round(amount * volatilityPct * 100) / 100;
  const riskRewardRatio = Math.round((estimatedGain / estimatedLoss) * 10) / 10;

  const stopLossPrice = Math.round(currentPrice * (1 - volatilityPct) * 100) / 100;
  const takeProfitPrice = Math.round(currentPrice * (1 + volatilityPct * 1.8) * 100) / 100;

  // Recent signals (last 3 notable points)
  const recentSignalTypes: Array<"BUY" | "SELL" | "EXIT"> = ["BUY", "SELL", "EXIT"];
  const recentSignals: RecentSignalEntry[] = [0, 1, 2].map((i) => {
    const idx = 5 + i * 4;
    const entry = priceHistory[idx] ?? priceHistory[0];
    return {
      time: entry?.time ?? new Date().toISOString(),
      signal: recentSignalTypes[i % 3] as "BUY" | "SELL" | "EXIT",
      price: entry?.price ?? currentPrice,
    };
  });

  // Summary in Spanish
  const signalMessages: Record<TradingSignal, string> = {
    BUY: `El activo ${upperAsset} muestra señales de sobreventa con RSI en ${rsi.toFixed(1)}. El análisis técnico sugiere una oportunidad de entrada con potencial alcista del ${movementPercent}%.`,
    SELL: `${upperAsset} presenta sobrecompra con RSI en ${rsi.toFixed(1)}. Se recomienda considerar toma de ganancias con riesgo de corrección del ${movementPercent}%.`,
    EXIT: `${upperAsset} está en zona neutral. El MACD indica posible agotamiento de tendencia. Considera gestionar posiciones abiertas.`,
    HOLD: `${upperAsset} muestra consolidación. El momentum es mixto y el RSI en zona neutral (${rsi.toFixed(1)}). Mantener posición y vigilar próximos movimientos.`,
  };

  const summary = signalMessages[signal];
  const analysisId = `${upperAsset}-${Date.now().toString(36).toUpperCase()}`;

  return {
    asset: upperAsset,
    currentPrice: Math.round(currentPrice * 100) / 100,
    signal,
    confidence,
    estimatedGain,
    estimatedLoss,
    riskRewardRatio,
    movementPercent,
    stopLoss: stopLossPrice,
    takeProfit: takeProfitPrice,
    priceHistory,
    recentSignals,
    summary,
    analysisId,
  };
}

financeToolsRouter.post(
  "/investment-analysis",
  zValidator("json", investmentAnalysisSchema),
  (c) => {
    const { asset, amount } = c.req.valid("json");
    const result = runTradingAlgorithm(asset, amount);
    return c.json({ data: result });
  }
);

export default financeToolsRouter;
