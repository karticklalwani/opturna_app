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
  frequency: z.enum(["Diaria", "Semanal", "Mensual", "Anual", "daily", "weekly", "monthly", "annual"]),
  annualInterestRate: z.number().min(0).max(1000),
  periodMonths: z.number().int().min(1).max(600),
  inflationRate: z.number().min(0).max(1000),
});

const FREQUENCY_SPANISH_MAP: Record<string, "daily" | "weekly" | "monthly" | "annual"> = {
  Diaria: "daily",
  Semanal: "weekly",
  Mensual: "monthly",
  Anual: "annual",
};

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

    const normalizedFrequency: "daily" | "weekly" | "monthly" | "annual" =
      FREQUENCY_SPANISH_MAP[frequency] ?? (frequency as "daily" | "weekly" | "monthly" | "annual");
    const monthlyMultiplier = FREQUENCY_MULTIPLIERS[normalizedFrequency];
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

// ─── Investment Analysis (Pine Script Algorithm - Server Side Only) ───────────

const investmentAnalysisSchema = z.object({
  asset: z.string().min(1).max(20),
  amount: z.number().positive(),
  analysisType: z.literal("intraday"),
});

const BASE_PRICES: Record<string, number> = {
  BTC: 85000, ETH: 3200, SOL: 155, BNB: 380,
  AAPL: 185, MSFT: 415, NVDA: 820, GOOGL: 165, AMZN: 195, TSLA: 265,
  SPY: 510, QQQ: 430, GLD: 225,
};

type OHLCV = { open: number; high: number; low: number; close: number };
type TradingSignal = "BUY" | "SELL" | "EXIT" | "HOLD";
type RecentSignalEntry = { time: string; signal: "BUY" | "SELL" | "EXIT"; price: number };

// ── Seeded PRNG (Park-Miller) ────────────────────────────────────────────────
function seededPRNG(seed: number): () => number {
  let s = Math.abs(seed % 2147483647);
  if (s === 0) s = 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashAsset(asset: string): number {
  let h = 5381;
  for (let i = 0; i < asset.length; i++) {
    h = ((h << 5) + h) + asset.charCodeAt(i);
  }
  return h;
}

// ── Generate realistic OHLCV candles ────────────────────────────────────────
function generateCandles(asset: string, n: number): OHLCV[] {
  const basePrice = BASE_PRICES[asset.toUpperCase()] ?? 100;
  const hourSlot = Math.floor(Date.now() / 3_600_000);
  const rng = seededPRNG(hashAsset(asset) + hourSlot * 137);

  const cryptoAssets = ["BTC", "ETH", "SOL", "BNB"];
  const isCrypto = cryptoAssets.includes(asset.toUpperCase());
  const dailyVol = isCrypto ? 0.022 : 0.010;

  const candles: OHLCV[] = [];
  let close = basePrice;
  const trendDrift = (rng() - 0.5) * 0.002 * close;

  for (let i = 0; i < n; i++) {
    const bodyMove = (rng() - 0.5) * 2 * dailyVol * close + trendDrift;
    const open = close;
    close = Math.max(open * 0.5, open + bodyMove);
    const wickH = rng() * dailyVol * close * 0.6;
    const wickL = rng() * dailyVol * close * 0.6;
    const high = Math.max(open, close) + wickH;
    const low  = Math.min(open, close) - wickL;
    candles.push({ open, high, low: Math.max(0.01, low), close });
  }
  return candles;
}

// ── RMA (Wilder's MA) ────────────────────────────────────────────────────────
function calcRMA(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN) as number[];
  let prev = 0;
  let initialized = false;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) continue;
    if (!initialized) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += (isNaN(values[j] ?? NaN) ? 0 : (values[j] ?? 0));
      prev = sum / period;
      result[i] = prev;
      initialized = true;
    } else {
      const vi = values[i] ?? NaN;
      const v = isNaN(vi) ? prev : vi;
      prev = (prev * (period - 1) + v) / period;
      result[i] = prev;
    }
  }
  return result;
}

// ── EMA ──────────────────────────────────────────────────────────────────────
function calcEMA(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN) as number[];
  const alpha = 2 / (period + 1);
  let prev = 0;
  let initialized = false;
  for (let i = 0; i < values.length; i++) {
    const vi = values[i] ?? NaN;
    const v = isNaN(vi) ? 0 : vi;
    if (i < period - 1) continue;
    if (!initialized) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += (isNaN(values[j] ?? NaN) ? 0 : (values[j] ?? 0));
      prev = sum / period;
      result[i] = prev;
      initialized = true;
    } else {
      prev = alpha * v + (1 - alpha) * prev;
      result[i] = prev;
    }
  }
  return result;
}

// ── ATR (using Wilder RMA on True Range) ─────────────────────────────────────
function calcATR(candles: OHLCV[], period: number): number[] {
  const tr = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const pC = (candles[i - 1] as OHLCV).close;
    return Math.max(c.high - c.low, Math.abs(c.high - pC), Math.abs(c.low - pC));
  });
  return calcRMA(tr, period);
}

// ── RSI (Wilder's smoothing) ──────────────────────────────────────────────────
function calcRSI(closes: number[], period: number): number[] {
  const result: number[] = new Array(closes.length).fill(NaN) as number[];
  if (closes.length < period + 1) return result;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = (closes[i] ?? 0) - (closes[i - 1] ?? 0);
    if (d > 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period; avgLoss /= period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = (closes[i] ?? 0) - (closes[i - 1] ?? 0);
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

// ── Supertrend ────────────────────────────────────────────────────────────────
// direction: -1 = bullish (price above ST = buy zone), 1 = bearish (price below = sell zone)
function calcSupertrend(candles: OHLCV[], factor: number, atrLen: number): {
  superTrend: number[];
  direction: number[];
} {
  const n = candles.length;
  const atr = calcATR(candles, atrLen);
  const closes = candles.map(c => c.close);
  const hl2 = candles.map(c => (c.high + c.low) / 2);

  const upper: number[] = new Array(n).fill(0) as number[];
  const lower: number[] = new Array(n).fill(0) as number[];
  const st: number[]    = new Array(n).fill(0) as number[];
  const dir: number[]   = new Array(n).fill(1) as number[];

  for (let i = 0; i < n; i++) {
    const atrRaw = atr[i] ?? NaN;
    const candleI = candles[i] as OHLCV;
    const atrI = isNaN(atrRaw) ? (candleI.high - candleI.low) : atrRaw;
    const hl2I = hl2[i] ?? 0;
    const rawU = hl2I + factor * atrI;
    const rawL = hl2I - factor * atrI;

    if (i === 0) {
      upper[i] = rawU; lower[i] = rawL; dir[i] = 1; st[i] = rawU;
      continue;
    }

    const prevLower = lower[i - 1] ?? 0;
    const prevUpper = upper[i - 1] ?? 0;
    const prevClose = closes[i - 1] ?? 0;
    const prevSt    = st[i - 1] ?? 0;
    const curClose  = closes[i] ?? 0;

    lower[i] = rawL > prevLower || prevClose < prevLower ? rawL : prevLower;
    upper[i] = rawU < prevUpper || prevClose > prevUpper ? rawU : prevUpper;

    const curUpper = upper[i] ?? 0;
    const curLower = lower[i] ?? 0;

    if (prevSt === prevUpper) {
      dir[i] = curClose > curUpper ? -1 : 1;
    } else {
      dir[i] = curClose < curLower ? 1 : -1;
    }
    st[i] = (dir[i] ?? 1) === -1 ? curLower : curUpper;
  }
  return { superTrend: st, direction: dir };
}

// ── QQE (Quantitative Qualitative Estimation) ─────────────────────────────────
function calcQQE(closes: number[], rsiPeriod: number, sf: number, kqe: number): {
  qqeLong: (number | null)[];
  qqeShort: (number | null)[];
} {
  const n = closes.length;
  const wildersPeriod = rsiPeriod * 2 - 1;

  const rsi = calcRSI(closes, rsiPeriod);
  const rsiSafe = rsi.map(v => isNaN(v) ? 50 : v);
  const rsiMa = calcEMA(rsiSafe, sf);
  const rsiMaSafe = rsiMa.map(v => isNaN(v) ? 50 : v);

  const atrRsi = rsiMaSafe.map((v, i) => i === 0 ? 0 : Math.abs((rsiMaSafe[i - 1] ?? 50) - v));
  const maAtrRsi = calcEMA(atrRsi, wildersPeriod);
  const maAtrRsiSafe = maAtrRsi.map(v => isNaN(v) ? 0 : v);
  const dar = calcEMA(maAtrRsiSafe, wildersPeriod).map(v => (isNaN(v) ? 0 : v) * kqe);

  const longband:  number[] = new Array(n).fill(0) as number[];
  const shortband: number[] = new Array(n).fill(0) as number[];
  const trend:     number[] = new Array(n).fill(1) as number[];
  const fastTL:    number[] = new Array(n).fill(0) as number[];

  for (let i = 1; i < n; i++) {
    const rs = rsiMaSafe[i] ?? 50;
    const d  = dar[i] ?? 0;
    const newS = rs + d;
    const newL = rs - d;

    const prevLb  = longband[i - 1] ?? 0;
    const prevSb  = shortband[i - 1] ?? 0;
    const prevRsM = rsiMaSafe[i - 1] ?? 50;

    longband[i]  = rs > prevLb && prevRsM > prevLb ? Math.max(prevLb, newL) : newL;
    shortband[i] = rs < prevSb && prevRsM < prevSb ? Math.min(prevSb, newS) : newS;

    const curSb = shortband[i] ?? 0;
    const curLb = longband[i] ?? 0;

    const crossShort = (prevSb > prevRsM && curSb <= rs) || (prevSb < prevRsM && curSb >= rs);
    const crossLong  = (prevLb > prevRsM && curLb <= rs) || (prevLb < prevRsM && curLb >= rs);

    if (crossShort) trend[i] = 1;
    else if (crossLong) trend[i] = -1;
    else trend[i] = trend[i - 1] ?? 1;

    fastTL[i] = (trend[i] ?? 1) === 1 ? curLb : curSb;
  }

  const exlong:  number[] = new Array(n).fill(0) as number[];
  const exshort: number[] = new Array(n).fill(0) as number[];
  for (let i = 1; i < n; i++) {
    const ftl  = fastTL[i] ?? 0;
    const rsm  = rsiMaSafe[i] ?? 50;
    exlong[i]  = ftl < rsm ? (exlong[i - 1] ?? 0) + 1 : 0;
    exshort[i] = ftl > rsm ? (exshort[i - 1] ?? 0) + 1 : 0;
  }

  const qqeLong  = exlong.map((v, i)  => v === 1 ? (fastTL[i - 1] ?? 0) - 50 : null);
  const qqeShort = exshort.map((v, i) => v === 1 ? (fastTL[i - 1] ?? 0) - 50 : null);

  return { qqeLong, qqeShort };
}

// ── Main Trading Algorithm ────────────────────────────────────────────────────
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
  const N = 50;

  const FACTOR   = 2;
  const ATR_LEN  = 11;
  const ATR_SL   = 14;
  const ATR_RISK = 4;
  const R1       = 0.7;
  const R2       = 1.2;
  const R3       = 1.5;
  const RSI_P    = 14;
  const SF       = 5;
  const KQE      = 4.238;

  const candles = generateCandles(upperAsset, N);
  const closes  = candles.map(c => c.close);
  const lows    = candles.map(c => c.low);
  const highs   = candles.map(c => c.high);

  const { direction } = calcSupertrend(candles, FACTOR, ATR_LEN);
  const atrSL         = calcATR(candles, ATR_SL);
  const { qqeLong, qqeShort } = calcQQE(closes, RSI_P, SF, KQE);
  const rsiArr        = calcRSI(closes, RSI_P);

  const last         = N - 1;
  const currentPrice = closes[last] ?? (BASE_PRICES[upperAsset] ?? 100);
  const rsiRaw       = rsiArr[last] ?? NaN;
  const rsi: number  = isNaN(rsiRaw) ? 50 : rsiRaw;
  const atrRaw       = atrSL[last] ?? NaN;
  const atrNow: number = isNaN(atrRaw) ? currentPrice * 0.01 : atrRaw;

  // ── Detect last bull/bear crossover ──────────────────────────────────────
  let lastBullIdx = -1;
  let lastBearIdx = -1;
  for (let i = 1; i <= last; i++) {
    if ((direction[i] ?? 1) === -1 && (direction[i - 1] ?? 1) === 1)  lastBullIdx = i;
    if ((direction[i] ?? 1) ===  1 && (direction[i - 1] ?? 1) === -1) lastBearIdx = i;
  }

  // ── Detect last QQE reversal ──────────────────────────────────────────────
  let lastQQELongIdx  = -1;
  let lastQQEShortIdx = -1;
  for (let i = 0; i <= last; i++) {
    if ((qqeLong[i]  ?? null) !== null) lastQQELongIdx  = i;
    if ((qqeShort[i] ?? null) !== null) lastQQEShortIdx = i;
  }

  const currentTrend = direction[last] ?? 1;

  let signal: TradingSignal;
  let confidence: number;

  const barsFromBull = lastBullIdx === -1 ? 999 : last - lastBullIdx;
  const barsFromBear = lastBearIdx === -1 ? 999 : last - lastBearIdx;

  const qqqOpposes =
    (currentTrend === -1 && lastQQEShortIdx > lastBullIdx) ||
    (currentTrend ===  1 && lastQQELongIdx  > lastBearIdx);

  if (barsFromBull < barsFromBear) {
    signal = qqqOpposes ? "EXIT" : "BUY";
    confidence = Math.round(75 - barsFromBull * 2 + (rsi < 50 ? 10 : 0));
  } else if (barsFromBear < barsFromBull) {
    signal = qqqOpposes ? "EXIT" : "SELL";
    confidence = Math.round(75 - barsFromBear * 2 + (rsi > 50 ? 10 : 0));
  } else {
    signal = "HOLD";
    confidence = 45;
  }

  confidence = Math.min(94, Math.max(42, confidence));

  // ── TP / SL calculation ───────────────────────────────────────────────────
  const atrBand    = atrNow * ATR_RISK;
  const isLong     = signal === "BUY" || (signal !== "SELL" && currentTrend === -1);
  const entryLow:  number = lows[lastBullIdx !== -1 ? lastBullIdx : last] ?? currentPrice;
  const entryHigh: number = highs[lastBearIdx !== -1 ? lastBearIdx : last] ?? currentPrice;

  const stopLossPrice = isLong
    ? Math.round((entryLow  - atrBand) * 10000) / 10000
    : Math.round((entryHigh + atrBand) * 10000) / 10000;

  const entry: number = currentPrice;
  const tp1 = isLong
    ? Math.round((entry + (entry - stopLossPrice) * R1) * 10000) / 10000
    : Math.round((entry - (stopLossPrice - entry) * R1) * 10000) / 10000;
  const tp2 = isLong
    ? Math.round((entry + (entry - stopLossPrice) * R2) * 10000) / 10000
    : Math.round((entry - (stopLossPrice - entry) * R2) * 10000) / 10000;
  const tp3 = isLong
    ? Math.round((entry + (entry - stopLossPrice) * R3) * 10000) / 10000
    : Math.round((entry - (stopLossPrice - entry) * R3) * 10000) / 10000;

  const estimatedGainPct = Math.abs(tp2 - entry) / entry;
  const estimatedLossPct = Math.abs(entry - stopLossPrice) / entry;
  const estimatedGain    = Math.round(amount * estimatedGainPct * 100) / 100;
  const estimatedLoss    = Math.round(amount * estimatedLossPct * 100) / 100;
  const riskRewardRatio  = estimatedLoss > 0 ? Math.round((estimatedGain / estimatedLoss) * 100) / 100 : R2;
  const movementPercent  = Math.round(estimatedGainPct * 1000) / 10;

  // ── Price history ─────────────────────────────────────────────────────────
  const now = Date.now();
  const priceHistory = candles.slice(-20).map((c, i) => ({
    time: new Date(now - (19 - i) * 5 * 60000).toISOString(),
    price: Math.round(c.close * 100) / 100,
  }));

  // ── Recent signals ────────────────────────────────────────────────────────
  const recentSignals: RecentSignalEntry[] = [];
  const histStart = N - 20;
  for (let i = Math.max(1, histStart); i <= last && recentSignals.length < 5; i++) {
    const dirI  = direction[i] ?? 1;
    const dirP  = direction[i - 1] ?? 1;
    const ph    = priceHistory[i - histStart];
    if (!ph) continue;
    if (dirI === -1 && dirP === 1) {
      recentSignals.push({ time: ph.time, signal: "BUY",  price: ph.price });
    } else if (dirI === 1 && dirP === -1) {
      recentSignals.push({ time: ph.time, signal: "SELL", price: ph.price });
    } else if ((qqeLong[i] ?? null) !== null) {
      recentSignals.push({ time: ph.time, signal: "BUY",  price: ph.price });
    } else if ((qqeShort[i] ?? null) !== null) {
      recentSignals.push({ time: ph.time, signal: "EXIT", price: ph.price });
    }
  }

  // ── Summary in Spanish ────────────────────────────────────────────────────
  const summaries: Record<TradingSignal, string> = {
    BUY:  `${upperAsset} acaba de generar señal BUY. El Supertrend ha cruzado al alza y el RSI (${rsi.toFixed(1)}) confirma momentum positivo. Stop Loss fijado en ${stopLossPrice.toLocaleString("es-ES")}. TP1: ${tp1.toLocaleString("es-ES")} · TP2: ${tp2.toLocaleString("es-ES")} · TP3: ${tp3.toLocaleString("es-ES")}.`,
    SELL: `${upperAsset} ha generado señal SELL. El Supertrend ha cruzado a la baja con RSI en ${rsi.toFixed(1)}. Stop Loss en ${stopLossPrice.toLocaleString("es-ES")}. TP1: ${tp1.toLocaleString("es-ES")} · TP2: ${tp2.toLocaleString("es-ES")} · TP3: ${tp3.toLocaleString("es-ES")}.`,
    EXIT: `El indicador QQE detecta agotamiento de la tendencia actual en ${upperAsset}. RSI en ${rsi.toFixed(1)}. Se recomienda cerrar posiciones abiertas y esperar confirmación de nueva señal.`,
    HOLD: `${upperAsset} se encuentra en fase de consolidación. Sin cruce confirmado en el Supertrend. RSI neutral en ${rsi.toFixed(1)}. Mantener posición y esperar ruptura de rango.`,
  };

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
    takeProfit: tp2,
    priceHistory,
    recentSignals,
    summary: summaries[signal] ?? "",
    analysisId: `${upperAsset}-${Date.now().toString(36).toUpperCase()}`,
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
