import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

// Map our timeframes to Yahoo Finance intervals
const TIMEFRAME_MAP: Record<string, string> = {
  "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
  "1h": "60m", "4h": "1h", "1D": "1d", "1W": "1wk"
};

// How many candles to fetch per timeframe (in minutes of history)
const TIMEFRAME_PERIOD: Record<string, number> = {
  "1m": 1, "5m": 5, "15m": 15, "30m": 60,
  "1h": 60 * 24, "4h": 60 * 24 * 4, "1D": 60 * 24 * 60, "1W": 60 * 24 * 365
};

export interface OHLCCandle {
  time: number; // unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetQuote {
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
}

export interface AssetSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  assetType: string;
  currency: string;
}

export async function searchAssets(query: string): Promise<AssetSearchResult[]> {
  try {
    const results = await yahooFinance.search(query, {}, { validateResult: false }) as {
      quotes?: Array<{
        symbol?: string;
        shortname?: string;
        longname?: string;
        exchange?: string;
        exchDisp?: string;
        quoteType?: string;
        currency?: string;
      }>;
    };
    const quotes = results.quotes || [];
    return quotes
      .filter((q) => q.symbol && (q.shortname || q.longname))
      .slice(0, 10)
      .map((q) => ({
        symbol: q.symbol!,
        name: q.shortname || q.longname || q.symbol!,
        exchange: q.exchange || q.exchDisp || "Unknown",
        assetType: mapQuoteType(q.quoteType || ""),
        currency: q.currency || "USD"
      }));
  } catch (err) {
    console.error("searchAssets error:", err);
    return [];
  }
}

function mapQuoteType(quoteType: string): string {
  const map: Record<string, string> = {
    "EQUITY": "stock",
    "ETF": "etf",
    "CRYPTOCURRENCY": "crypto",
    "CURRENCY": "forex",
    "INDEX": "index",
    "FUTURE": "futures",
    "COMMODITY": "commodity"
  };
  return map[quoteType] || "other";
}

export async function fetchRealTimeQuote(symbol: string): Promise<AssetQuote> {
  const result = await yahooFinance.quote(symbol, {}, { validateResult: false }) as {
    symbol?: string;
    longName?: string;
    shortName?: string;
    quoteType?: string;
    fullExchangeName?: string;
    exchange?: string;
    currency?: string;
    regularMarketPrice?: number;
    regularMarketPreviousClose?: number;
    regularMarketOpen?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    regularMarketVolume?: number;
  };
  const price = result.regularMarketPrice || 0;
  const prevClose = result.regularMarketPreviousClose || price;
  const pctChange = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

  return {
    symbol: result.symbol || symbol,
    name: result.longName || result.shortName || symbol,
    assetType: mapQuoteType(result.quoteType || ""),
    exchange: result.fullExchangeName || result.exchange || "Unknown",
    currency: result.currency || "USD",
    currentPrice: price,
    previousClose: prevClose,
    percentChange: pctChange,
    open: result.regularMarketOpen || price,
    high: result.regularMarketDayHigh || price,
    low: result.regularMarketDayLow || price,
    close: price,
    volume: result.regularMarketVolume || 0,
    timestamp: Date.now()
  };
}

export async function fetchOHLCSeries(symbol: string, timeframe: string): Promise<OHLCCandle[]> {
  const interval = (TIMEFRAME_MAP[timeframe] || "60m") as "1m" | "5m" | "15m" | "30m" | "60m" | "1h" | "1d" | "1wk";
  const periodMinutes = TIMEFRAME_PERIOD[timeframe] || 60 * 24;
  const period1 = new Date(Date.now() - periodMinutes * 60 * 1000);

  try {
    const result = await yahooFinance.chart(symbol, {
      period1,
      interval,
    }, { validateResult: false }) as {
      quotes?: Array<{
        date?: Date | string;
        open?: number | null;
        high?: number | null;
        low?: number | null;
        close?: number | null;
        volume?: number | null;
      }>;
    };

    const quotes = result.quotes || [];
    return quotes
      .filter((q) => q.open != null && q.high != null && q.low != null && q.close != null)
      .map((q) => ({
        time: new Date(q.date!).getTime(),
        open: q.open!,
        high: q.high!,
        low: q.low!,
        close: q.close!,
        volume: q.volume || 0
      }));
  } catch (err) {
    console.error("fetchOHLCSeries error:", err);
    return [];
  }
}
