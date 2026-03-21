import type { OHLCCandle, AssetQuote } from "./market-data.js";
import { fetchRealTimeQuote, fetchOHLCSeries } from "./market-data.js";

// ---- Math utilities ----
function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    const slice = values.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i === 0) { result.push(values[0]!); continue; }
    result.push(values[i]! * k + result[i - 1]! * (1 - k));
  }
  return result;
}

function rma(values: number[], period: number): number[] {
  const alpha = 1 / period;
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i === 0) { result.push(values[0]!); continue; }
    result.push(alpha * values[i]! + (1 - alpha) * result[i - 1]!);
  }
  return result;
}

function calculateATR(candles: OHLCCandle[], period: number): number[] {
  const trValues: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) { trValues.push(candles[i]!.high - candles[i]!.low); continue; }
    const hl = candles[i]!.high - candles[i]!.low;
    const hpc = Math.abs(candles[i]!.high - candles[i - 1]!.close);
    const lpc = Math.abs(candles[i]!.low - candles[i - 1]!.close);
    trValues.push(Math.max(hl, hpc, lpc));
  }
  return rma(trValues, period);
}

function calculateRSI(candles: OHLCCandle[], period: number = 14): number[] {
  const closes = candles.map(c => c.close);
  const gains: number[] = [0];
  const losses: number[] = [0];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  const avgGain = rma(gains, period);
  const avgLoss = rma(losses, period);
  return avgGain.map((g, i) => {
    const l = avgLoss[i]!;
    if (l === 0) return 100;
    const rs = g / l;
    return 100 - 100 / (1 + rs);
  });
}

interface SupertrendResult {
  values: number[];
  directions: number[]; // 1 = bullish, -1 = bearish
}

function calculateSupertrend(candles: OHLCCandle[], factor: number = 3, atrLen: number = 11): SupertrendResult {
  const atr = calculateATR(candles, atrLen);
  const closes = candles.map(c => c.close);
  const hl2 = candles.map(c => (c.high + c.low) / 2);

  const upperBasic = hl2.map((h, i) => h + factor * atr[i]!);
  const lowerBasic = hl2.map((h, i) => h - factor * atr[i]!);

  const upperBand: number[] = [upperBasic[0]!];
  const lowerBand: number[] = [lowerBasic[0]!];
  const supertrend: number[] = [upperBasic[0]!];
  const directions: number[] = [-1];

  for (let i = 1; i < candles.length; i++) {
    // Upper band
    const ub = upperBand[i - 1]! < upperBasic[i]! ? upperBasic[i]! : (closes[i - 1]! > upperBand[i - 1]! ? upperBasic[i]! : Math.min(upperBasic[i]!, upperBand[i - 1]!));
    upperBand.push(ub);

    // Lower band
    const lb = lowerBand[i - 1]! > lowerBasic[i]! ? lowerBasic[i]! : (closes[i - 1]! < lowerBand[i - 1]! ? lowerBasic[i]! : Math.max(lowerBasic[i]!, lowerBand[i - 1]!));
    lowerBand.push(lb);

    // Direction
    const prevDir = directions[i - 1]!;
    let dir: number;
    if (closes[i]! > upperBand[i - 1]!) {
      dir = 1;
    } else if (closes[i]! < lowerBand[i - 1]!) {
      dir = -1;
    } else {
      dir = prevDir;
    }
    directions.push(dir);
    supertrend.push(dir === 1 ? lb : ub);
  }

  return { values: supertrend, directions };
}

function calculateEMAs(candles: OHLCCandle[]) {
  const closes = candles.map(c => c.close);
  return {
    ema23: ema(closes, 23),
    ema80: ema(closes, 80),
    ema200: ema(closes, 200),
    sma7: sma(closes, 7),
    sma13: sma(closes, 13)
  };
}

function calculatePivots(candles: OHLCCandle[], pivotLen: number = 5): { supports: number[], resistances: number[] } {
  const supports: number[] = [];
  const resistances: number[] = [];

  for (let i = pivotLen; i < candles.length - pivotLen; i++) {
    const slice = candles.slice(i - pivotLen, i + pivotLen + 1);
    const low = candles[i]!.low;
    const high = candles[i]!.high;

    if (slice.every(c => c.low >= low)) {
      supports.push(low);
    }
    if (slice.every(c => c.high <= high)) {
      resistances.push(high);
    }
  }

  return {
    supports: [...new Set(supports)].sort((a, b) => b - a).slice(0, 3),
    resistances: [...new Set(resistances)].sort((a, b) => a - b).slice(0, 3)
  };
}

function detectReversalSignal(rsiValues: number[], rsiMa: number[]): boolean {
  const last = rsiValues.length - 1;
  const prev = last - 1;
  if (last < 1) return false;
  return rsiValues[prev]! < rsiMa[prev]! && rsiValues[last]! > rsiMa[last]! && rsiValues[last]! < 60;
}

function detectBreakoutSignal(candles: OHLCCandle[], resistances: number[]): boolean {
  if (candles.length < 2 || resistances.length === 0) return false;
  const prev = candles[candles.length - 2]!.close;
  const current = candles[candles.length - 1]!.close;
  const nearestResistance = resistances[0]!;
  return prev < nearestResistance && current > nearestResistance;
}

function calculateConfidenceScore(params: {
  signal: string;
  supertrendDir: number;
  prevSupertrendDir: number;
  rsi: number;
  rsiMa: number;
  trendRibbonBullish: boolean;
  reversalSignal: boolean;
  breakoutSignal: boolean;
  supports: number[];
  resistances: number[];
  currentPrice: number;
  stopLoss: number;
  tp2: number;
  entryPrice: number;
}): number {
  let score = 0;

  // A) Supertrend signal (30%)
  const justChanged = params.supertrendDir !== params.prevSupertrendDir;
  const supertrendScore = justChanged ? 90 : (params.signal !== "NEUTRAL" ? 60 : 20);
  score += supertrendScore * 0.30;

  // B) Trend ribbon (20%)
  const trendScore = params.trendRibbonBullish
    ? (params.signal === "BUY" ? 90 : 30)
    : (params.signal === "SELL" ? 90 : 30);
  score += trendScore * 0.20;

  // C) RSI / reversals (20%)
  let rsiScore = 50;
  if (params.signal === "BUY") {
    if (params.rsi > 50 && params.rsi < 70) rsiScore = 80;
    else if (params.rsi >= 70) rsiScore = 40;
    else if (params.rsi < 50 && params.rsi > 30) rsiScore = 60;
  } else if (params.signal === "SELL") {
    if (params.rsi < 50 && params.rsi > 30) rsiScore = 80;
    else if (params.rsi <= 30) rsiScore = 40;
  }
  if (params.reversalSignal) rsiScore = Math.min(100, rsiScore + 15);
  score += rsiScore * 0.20;

  // D) Breakout (10%)
  const breakoutScore = params.breakoutSignal ? 85 : 40;
  score += breakoutScore * 0.10;

  // E) Support/resistance proximity (10%)
  let structureScore = 50;
  if (params.signal === "BUY" && params.supports.length > 0) {
    const nearestSupport = params.supports[0]!;
    const distancePct = Math.abs(params.currentPrice - nearestSupport) / params.currentPrice * 100;
    if (distancePct < 1) structureScore = 90;
    else if (distancePct < 3) structureScore = 75;
    else structureScore = 50;
  } else if (params.signal === "SELL" && params.resistances.length > 0) {
    const nearestResistance = params.resistances[0]!;
    const distancePct = Math.abs(params.currentPrice - nearestResistance) / params.currentPrice * 100;
    if (distancePct < 1) structureScore = 90;
    else if (distancePct < 3) structureScore = 75;
    else structureScore = 50;
  }
  score += structureScore * 0.10;

  // F) Setup quality (10%)
  let setupScore = 50;
  const riskReward = params.signal === "BUY"
    ? (params.tp2 - params.entryPrice) / (params.entryPrice - params.stopLoss)
    : (params.entryPrice - params.tp2) / (params.stopLoss - params.entryPrice);
  if (riskReward >= 2) setupScore = 90;
  else if (riskReward >= 1.5) setupScore = 75;
  else if (riskReward >= 1) setupScore = 55;
  else setupScore = 30;
  score += setupScore * 0.10;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function generateAnalysisSummary(params: {
  symbol: string;
  signal: string;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  reversalSignal: boolean;
  breakoutSignal: boolean;
  trendRibbonBullish: boolean;
  rsi: number;
  supports: number[];
  resistances: number[];
  currentPrice: number;
  currency: string;
}): string {
  const fmt = (n: number) => n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const { symbol, signal, stopLoss, tp1, tp2, tp3, currency } = params;

  if (signal === "NEUTRAL") {
    let summary = `No hay una señal fuerte en ${symbol} en este momento. El activo sigue en observación esperando confirmaciones adicionales del Supertrend, momentum y estructura.`;
    if (params.resistances.length > 0) summary += ` Resistencia clave próxima en ${fmt(params.resistances[0]!)} ${currency}.`;
    if (params.supports.length > 0) summary += ` Soporte importante en ${fmt(params.supports[0]!)} ${currency}.`;
    return summary;
  }

  if (signal === "BUY") {
    let summary = `${symbol} acaba de generar señal BUY por cruce alcista del precio sobre el Supertrend.`;
    if (params.trendRibbonBullish) summary += " El ribbon de tendencia acompaña con sesgo alcista.";
    if (params.rsi > 50 && params.rsi < 70) summary += ` El RSI muestra momentum positivo (${params.rsi.toFixed(1)}).`;
    else if (params.rsi >= 70) summary += ` RSI en zona de sobrecompra (${params.rsi.toFixed(1)}), vigilar corrección.`;
    summary += ` Stop Loss fijado en ${fmt(stopLoss)} ${currency}. TP1 en ${fmt(tp1)}, TP2 en ${fmt(tp2)} y TP3 en ${fmt(tp3)} ${currency}.`;
    if (params.reversalSignal) summary += " Se detecta señal de reversión alcista adicional.";
    if (params.breakoutSignal) summary += " Breakout de resistencia confirmado.";
    if (params.supports.length > 0) summary += ` Soporte en ${fmt(params.supports[0]!)}.`;
    return summary;
  }

  // SELL
  let summary = `${symbol} acaba de generar señal SELL por cruce bajista del precio bajo el Supertrend.`;
  if (!params.trendRibbonBullish) summary += " El ribbon de tendencia y las medias confirman debilidad estructural.";
  if (params.rsi < 50 && params.rsi > 30) summary += ` RSI acompaña el impulso bajista (${params.rsi.toFixed(1)}).`;
  else if (params.rsi <= 30) summary += ` RSI en zona de sobreventa (${params.rsi.toFixed(1)}), posible rebote técnico.`;
  summary += ` Stop Loss fijado en ${fmt(stopLoss)} ${currency}. TP1 en ${fmt(tp1)}, TP2 en ${fmt(tp2)} y TP3 en ${fmt(tp3)} ${currency}.`;
  if (params.reversalSignal) summary += " Se detecta posible señal de reversión bajista.";
  if (params.resistances.length > 0) summary += ` Resistencia clave en ${fmt(params.resistances[0]!)}.`;
  return summary;
}

export interface AnalysisResult {
  symbol: string;
  name: string;
  assetType: string;
  exchange: string;
  currency: string;
  currentPrice: number;
  previousClose: number;
  percentChange: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  timeframe: string;
  entryPrice: number;
  signal: "BUY" | "SELL" | "NEUTRAL";
  signalSource: string;
  signalStatus: string;
  supertrendValue: number;
  supertrendDirection: number;
  atr: number;
  atrRisk: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskReward: number;
  movementPercent: number;
  confidenceScore: number;
  gainEstimate: number;
  lossEstimate: number;
  capitalInvested: number;
  quantity: number;
  rsi: number;
  rsiMa: number;
  reversalSignal: boolean;
  breakoutSignal: boolean;
  trendRibbonBullish: boolean;
  ema23: number;
  ema80: number;
  ema200: number;
  supportLevels: number[];
  resistanceLevels: number[];
  analysisSummary: string;
  riskLevel: string;
  operationState: string;
  validationState: "valid" | "invalid" | "insufficient_data";
  dataStatus: "live" | "delayed";
  lastSignalTimestamp: string;
  telegramSent: boolean;
  crossoverOccurred: boolean;
  candles: OHLCCandle[];
}

export async function runSignalEngine(
  symbol: string,
  timeframe: string = "1h",
  capitalInvested: number = 0,
  atrRisk: number = 4
): Promise<AnalysisResult> {
  // Fetch data
  const [quote, candles] = await Promise.all([
    fetchRealTimeQuote(symbol),
    fetchOHLCSeries(symbol, timeframe)
  ]);

  if (candles.length < 30) {
    return {
      ...quote,
      timestamp: Date.now(),
      timeframe,
      entryPrice: quote.currentPrice,
      signal: "NEUTRAL",
      signalSource: "Supertrend",
      signalStatus: "waiting",
      supertrendValue: 0,
      supertrendDirection: 0,
      atr: 0,
      atrRisk,
      stopLoss: 0,
      tp1: 0,
      tp2: 0,
      tp3: 0,
      riskReward: 0,
      movementPercent: 0,
      confidenceScore: 0,
      gainEstimate: 0,
      lossEstimate: 0,
      capitalInvested,
      quantity: 0,
      rsi: 50,
      rsiMa: 50,
      reversalSignal: false,
      breakoutSignal: false,
      trendRibbonBullish: false,
      ema23: quote.currentPrice,
      ema80: quote.currentPrice,
      ema200: quote.currentPrice,
      supportLevels: [],
      resistanceLevels: [],
      analysisSummary: "Datos insuficientes para generar un análisis confiable.",
      riskLevel: "unknown",
      operationState: "waiting",
      validationState: "insufficient_data",
      dataStatus: "live",
      lastSignalTimestamp: new Date().toISOString(),
      telegramSent: false,
      crossoverOccurred: false,
      candles: []
    };
  }

  // Calculations
  const supertrendData = calculateSupertrend(candles, 3, 11);
  const atrValues = calculateATR(candles, 14);
  const rsiValues = calculateRSI(candles, 14);
  const rsiMaValues = sma(rsiValues, 9);
  const emas = calculateEMAs(candles);
  const { supports, resistances } = calculatePivots(candles, 5);

  const lastIdx = candles.length - 1;
  const prevIdx = lastIdx - 1;

  const lastClose = candles[lastIdx]!.close;
  const prevClose = candles[prevIdx]!.close;
  const lastSupertrend = supertrendData.values[lastIdx]!;
  const prevSupertrend = supertrendData.values[prevIdx]!;
  const lastDir = supertrendData.directions[lastIdx]!;
  const prevDir = supertrendData.directions[prevIdx]!;
  const lastATR = atrValues[lastIdx]!;
  const lastRSI = rsiValues[lastIdx]!;
  const lastRSIMa = rsiMaValues[lastIdx] ?? 50;
  const lastEma23 = emas.ema23[lastIdx]!;
  const lastEma80 = emas.ema80[lastIdx]!;
  const lastEma200 = emas.ema200[lastIdx]!;

  // Signal detection
  const bullCross = prevClose <= prevSupertrend && lastClose > lastSupertrend;
  const bearCross = prevClose >= prevSupertrend && lastClose < lastSupertrend;

  // Check if crossover happened recently (within last 3 candles)
  const recentBullCross = supertrendData.directions.slice(-3).some((d, i, arr) =>
    i > 0 && arr[i] === 1 && arr[i - 1] === -1
  ) || bullCross;
  const recentBearCross = supertrendData.directions.slice(-3).some((d, i, arr) =>
    i > 0 && arr[i] === -1 && arr[i - 1] === 1
  ) || bearCross;

  const crossoverOccurred = recentBullCross || recentBearCross;

  let signal: "BUY" | "SELL" | "NEUTRAL";
  if (recentBullCross) {
    signal = "BUY";
  } else if (recentBearCross) {
    signal = "SELL";
  } else {
    // Continuous trend - still useful for directional bias
    signal = lastDir === 1 ? "BUY" : "SELL";
  }

  const entryPrice = lastClose;
  const atrBand = lastATR * atrRisk;

  let stopLoss: number;
  if (signal === "BUY") {
    stopLoss = candles[lastIdx]!.low - atrBand;
    stopLoss = Math.max(stopLoss, entryPrice * 0.85);
  } else if (signal === "SELL") {
    stopLoss = candles[lastIdx]!.high + atrBand;
    stopLoss = Math.min(stopLoss, entryPrice * 1.15);
  } else {
    stopLoss = entryPrice - atrBand;
  }

  const r1 = 0.7, r2 = 1.2, r3 = 1.5;
  let tp1: number, tp2: number, tp3: number;

  if (signal === "BUY") {
    const riskDist = entryPrice - stopLoss;
    tp1 = entryPrice + riskDist * r1;
    tp2 = entryPrice + riskDist * r2;
    tp3 = entryPrice + riskDist * r3;
  } else if (signal === "SELL") {
    const riskDist = stopLoss - entryPrice;
    tp1 = entryPrice - riskDist * r1;
    tp2 = entryPrice - riskDist * r2;
    tp3 = entryPrice - riskDist * r3;
  } else {
    const riskDist = lastATR * 2;
    tp1 = entryPrice + riskDist * r1;
    tp2 = entryPrice + riskDist * r2;
    tp3 = entryPrice + riskDist * r3;
  }

  let risk: number, reward: number;
  if (signal === "BUY") {
    risk = entryPrice - stopLoss;
    reward = tp2 - entryPrice;
  } else if (signal === "SELL") {
    risk = stopLoss - entryPrice;
    reward = entryPrice - tp2;
  } else {
    risk = 1;
    reward = r2;
  }
  const riskReward = risk > 0 ? Math.round((reward / risk) * 100) / 100 : 0;

  let movementPercent: number;
  if (signal === "BUY") {
    movementPercent = Math.round(((tp2 - entryPrice) / entryPrice) * 10000) / 100;
  } else if (signal === "SELL") {
    movementPercent = Math.round(((entryPrice - tp2) / entryPrice) * 10000) / 100;
  } else {
    movementPercent = 0;
  }

  const trendRibbonBullish = lastEma23 > lastEma80 && lastEma80 > lastEma200 && lastClose > lastEma23;
  const reversalSignal = detectReversalSignal(rsiValues, rsiMaValues);
  const breakoutSignal = detectBreakoutSignal(candles, resistances);

  const confidenceScore = calculateConfidenceScore({
    signal,
    supertrendDir: lastDir,
    prevSupertrendDir: prevDir,
    rsi: lastRSI,
    rsiMa: lastRSIMa,
    trendRibbonBullish,
    reversalSignal,
    breakoutSignal,
    supports,
    resistances,
    currentPrice: lastClose,
    stopLoss,
    tp2,
    entryPrice
  });

  const quantity = capitalInvested > 0 && entryPrice > 0 ? capitalInvested / entryPrice : 0;
  let gainEstimate: number, lossEstimate: number;
  if (signal === "BUY") {
    gainEstimate = (tp2 - entryPrice) * quantity;
    lossEstimate = (entryPrice - stopLoss) * quantity;
  } else if (signal === "SELL") {
    gainEstimate = (entryPrice - tp2) * quantity;
    lossEstimate = (stopLoss - entryPrice) * quantity;
  } else {
    gainEstimate = 0;
    lossEstimate = 0;
  }

  let riskLevel: string;
  if (riskReward >= 2 && confidenceScore >= 70) riskLevel = "low";
  else if (riskReward >= 1.5 && confidenceScore >= 55) riskLevel = "medium";
  else riskLevel = "high";

  let validationState: "valid" | "invalid" | "insufficient_data" = "valid";
  if (signal === "BUY" && !(stopLoss < entryPrice && entryPrice < tp1 && tp1 < tp2 && tp2 < tp3)) {
    validationState = "invalid";
  } else if (signal === "SELL" && !(tp3 < tp2 && tp2 < tp1 && tp1 < entryPrice && entryPrice < stopLoss)) {
    validationState = "invalid";
  }

  const analysisSummary = generateAnalysisSummary({
    symbol: quote.symbol,
    signal,
    stopLoss,
    tp1,
    tp2,
    tp3,
    reversalSignal,
    breakoutSignal,
    trendRibbonBullish,
    rsi: lastRSI,
    supports,
    resistances,
    currentPrice: lastClose,
    currency: quote.currency
  });

  return {
    ...quote,
    currentPrice: quote.currentPrice,
    timestamp: Date.now(),
    timeframe,
    entryPrice,
    signal,
    signalSource: "Supertrend",
    signalStatus: "active",
    supertrendValue: lastSupertrend,
    supertrendDirection: lastDir,
    atr: lastATR,
    atrRisk,
    stopLoss,
    tp1,
    tp2,
    tp3,
    riskReward,
    movementPercent,
    confidenceScore,
    gainEstimate,
    lossEstimate,
    capitalInvested,
    quantity,
    rsi: lastRSI,
    rsiMa: lastRSIMa,
    reversalSignal,
    breakoutSignal,
    trendRibbonBullish,
    ema23: lastEma23,
    ema80: lastEma80,
    ema200: lastEma200,
    supportLevels: supports,
    resistanceLevels: resistances,
    analysisSummary,
    riskLevel,
    operationState: "active",
    validationState,
    dataStatus: "live",
    lastSignalTimestamp: new Date().toISOString(),
    telegramSent: false,
    crossoverOccurred,
    candles: candles.slice(-100)
  };
}
