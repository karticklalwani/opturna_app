import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Brain,
  RefreshCw,
  Newspaper,
  BarChart3,
  X,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Cpu,
} from "lucide-react-native";
import { useTheme, DARK } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  exchange: string;
  currency: string;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  pe?: number;
  eps?: number;
  week52High?: number;
  week52Low?: number;
  beta?: number;
}

interface Fundamentals {
  peRatio?: number;
  psRatio?: number;
  pbRatio?: number;
  evEbitda?: number;
  roe?: number;
  roic?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  revenueGrowth?: number;
  epsGrowth?: number;
  freeCashFlow?: number;
  debtToEquity?: number;
  currentRatio?: number;
  marketCap?: number;
  enterpriseValue?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
}

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  thumbnail?: string;
  summary?: string;
}

interface HistoryPoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

interface AIAnalysis {
  symbol: string;
  analysis: string;
  sentiment: "bullish" | "bearish" | "neutral";
  keyPoints: string[];
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const QUICK_PICKS = ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "BTC-USD", "ETH-USD", "SPY", "GLD"];

const fmtPrice = (n: number, currency = "USD") => {
  if (!n) return "--";
  const abs = Math.abs(n);
  const dec = abs < 1 ? 4 : abs < 100 ? 2 : 2;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }) + (currency && currency !== "USD" ? ` ${currency}` : "");
};

const fmtLarge = (n: number) => {
  if (!n) return "--";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
};

const fmtPct = (n?: number) => {
  if (n == null) return "--";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
};

const fmtVal = (n?: number, suffix = "") => {
  if (n == null) return "--";
  return `${n.toFixed(2)}${suffix}`;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

// ─── Price Chart (SVG) ────────────────────────────────────────────────────────

function PriceChart({ data, colors }: { data: HistoryPoint[]; colors: { accent: string; bg: string; border: string; text3: string } }) {
  if (!data || data.length < 2) return null;

  const w = 340;
  const h = 120;
  const padL = 8;
  const padR = 8;
  const padT = 8;
  const padB = 8;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const closes = data.map((d) => d.close);
  const minV = Math.min(...closes);
  const maxV = Math.max(...closes);
  const range = maxV - minV || 1;

  const toX = (i: number) => padL + (i / (data.length - 1)) * plotW;
  const toY = (v: number) => padT + plotH - ((v - minV) / range) * plotH;

  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)},${toY(d.close)}`).join(" ");
  const fillD = `${pathD} L ${toX(data.length - 1)},${padT + plotH} L ${padL},${padT + plotH} Z`;

  const isUp = closes[closes.length - 1] >= closes[0];
  const lineColor = isUp ? "#4ADE80" : "#EF4444";

  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgLinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lineColor} stopOpacity="0.2" />
          <Stop offset="1" stopColor={lineColor} stopOpacity="0.01" />
        </SvgLinearGradient>
      </Defs>
      <Path d={fillD} fill="url(#chartFill)" />
      <Path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ h, r = 8, colors }: { h: number; r?: number; colors: { bg4: string } }) {
  return (
    <Animated.View
      entering={FadeIn}
      style={{ height: h, borderRadius: r, backgroundColor: colors.bg4 }}
    />
  );
}

// ─── QuoteCard ────────────────────────────────────────────────────────────────

function QuoteCard({ quote, colors }: { quote: Quote; colors: typeof DARK }) {
  const isUp = quote.changePercent >= 0;
  return (
    <Animated.View
      entering={FadeInDown.duration(350)}
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14,
      }}
      testID="quote-card"
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.8 }}>
            {quote.symbol}
          </Text>
          <Text style={{ color: colors.text3, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
            {quote.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <View style={{ backgroundColor: colors.bg4, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "600" }}>{quote.exchange}</Text>
            </View>
            {quote.currency && quote.currency !== "USD" ? (
              <View style={{ backgroundColor: colors.bg4, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "600" }}>{quote.currency}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>
            {fmtPrice(quote.price)}
          </Text>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: isUp ? "#4ADE8018" : "#EF444418",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginTop: 4,
          }}>
            {isUp
              ? <ArrowUpRight size={13} color="#4ADE80" />
              : <ArrowDownRight size={13} color="#EF4444" />}
            <Text style={{ color: isUp ? "#4ADE80" : "#EF4444", fontSize: 13, fontWeight: "700" }}>
              {fmtPct(quote.changePercent)}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 0, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
        {[
          { label: "MCap", value: fmtLarge(quote.marketCap) },
          { label: "Vol", value: quote.volume > 1e6 ? `${(quote.volume / 1e6).toFixed(1)}M` : `${(quote.volume / 1e3).toFixed(0)}K` },
          { label: "High", value: fmtPrice(quote.high) },
          { label: "Low", value: fmtPrice(quote.low) },
        ].map((item, i) => (
          <View
            key={item.label}
            style={{
              flex: 1,
              borderRightWidth: i < 3 ? 1 : 0,
              borderRightColor: colors.border,
              paddingHorizontal: 8,
              paddingLeft: i === 0 ? 0 : 8,
            }}
          >
            <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "600", letterSpacing: 0.3, marginBottom: 2 }}>
              {item.label.toUpperCase()}
            </Text>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }} numberOfLines={1}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ─── RatioCard ────────────────────────────────────────────────────────────────

function RatioCard({ label, value, color, colors }: {
  label: string;
  value: string;
  color?: string;
  colors: typeof DARK;
}) {
  return (
    <View style={{
      width: "47.5%",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "600", letterSpacing: 0.4, marginBottom: 6 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: color ?? colors.text, fontSize: 16, fontWeight: "800", letterSpacing: -0.3 }}>
        {value}
      </Text>
    </View>
  );
}

// ─── NewsItemRow ──────────────────────────────────────────────────────────────

function NewsItemRow({ item, colors }: { item: NewsItem; colors: typeof DARK }) {
  return (
    <View style={{
      flexDirection: "row",
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      {item.thumbnail ? (
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: colors.bg4 }}
          testID="news-thumbnail"
        />
      ) : (
        <View style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: colors.bg4, alignItems: "center", justifyContent: "center" }}>
          <Newspaper size={22} color={colors.text3} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", lineHeight: 18, marginBottom: 4 }} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: colors.text3, fontSize: 11 }} numberOfLines={1}>{item.publisher}</Text>
          <Text style={{ color: colors.text4, fontSize: 11 }}>·</Text>
          <Text style={{ color: colors.text4, fontSize: 11 }}>{timeAgo(item.publishedAt)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── AIAnalysisPanel ──────────────────────────────────────────────────────────

function AIAnalysisPanel({ symbol, colors }: { symbol: string; colors: typeof DARK }) {
  const { data, isFetching, refetch } = useQuery<AIAnalysis>({
    queryKey: ["research-ai-analysis", symbol],
    queryFn: () => api.post<AIAnalysis>("/api/research/analyze", { symbol, language: "es" }),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });

  const sentimentColor = data?.sentiment === "bullish"
    ? "#4ADE80"
    : data?.sentiment === "bearish"
      ? "#EF4444"
      : "#F59E0B";

  return (
    <Animated.View entering={FadeInDown.duration(400)} testID="ai-analysis-panel">
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: `${colors.accent}18`, alignItems: "center", justifyContent: "center" }}>
            <Brain size={14} color={colors.accent} />
          </View>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>Análisis IA</Text>
        </View>
        <Pressable
          onPress={() => refetch()}
          disabled={isFetching}
          testID="refresh-analysis"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: colors.bg4,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          {isFetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={13} color={colors.text3} />}
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600" }}>
            {isFetching ? "Generando..." : "Actualizar"}
          </Text>
        </Pressable>
      </View>

      {isFetching && !data ? (
        <View style={{ gap: 10 }}>
          <Skeleton h={14} colors={colors} />
          <Skeleton h={14} colors={colors} />
          <Skeleton h={14} r={8} colors={colors} />
          <Skeleton h={14} colors={colors} />
          <Skeleton h={14} r={8} colors={colors} />
          <Skeleton h={14} colors={colors} />
        </View>
      ) : data ? (
        <View>
          {/* Sentiment badge */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: `${sentimentColor}15`,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: `${sentimentColor}30`,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 14,
            alignSelf: "flex-start",
          }}>
            {data.sentiment === "bullish"
              ? <TrendingUp size={14} color={sentimentColor} />
              : data.sentiment === "bearish"
                ? <TrendingDown size={14} color={sentimentColor} />
                : <Minus size={14} color={sentimentColor} />}
            <Text style={{ color: sentimentColor, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>
              {data.sentiment?.toUpperCase()}
            </Text>
          </View>

          {/* Analysis text */}
          <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
            {data.analysis}
          </Text>

          {/* Key points */}
          {data.keyPoints && data.keyPoints.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
                PUNTOS CLAVE
              </Text>
              {data.keyPoints.map((pt, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.accent, marginTop: 7 }} />
                  <Text style={{ color: colors.text2, fontSize: 13, lineHeight: 20, flex: 1 }}>{pt}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {data.generatedAt ? (
            <Text style={{ color: colors.text4, fontSize: 11, marginTop: 14 }}>
              Generado: {new Date(data.generatedAt).toLocaleString("es")}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
          <Brain size={32} color={colors.text4} />
          <Text style={{ color: colors.text3, fontSize: 14, marginTop: 10 }}>
            No se pudo cargar el análisis
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Tab = "overview" | "fundamentals" | "news" | "ai" | "compare";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "fundamentals", label: "Fundamentos" },
  { key: "news", label: "Noticias" },
  { key: "ai", label: "Análisis IA" },
  { key: "compare", label: "Comparar" },
];

export default function ResearchScreen() {
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [compareSymbol, setCompareSymbol] = useState<string>("");
  const [compareSearch, setCompareSearch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const searchRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [compareResults, setCompareResults] = useState<SearchResult[]>([]);
  const [compareLoading, setCompareLoading] = useState<boolean>(false);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setShowDropdown(true);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get<SearchResult[]>(`/api/research/search?q=${encodeURIComponent(text)}`);
        setSearchResults(res ?? []);
      } catch {
        setSearchResults([]);
      }
      setSearchLoading(false);
    }, 300);
  }, []);

  const handleCompareSearchChange = useCallback((text: string) => {
    setCompareSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 1) {
      setCompareResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setCompareLoading(true);
      try {
        const res = await api.get<SearchResult[]>(`/api/research/search?q=${encodeURIComponent(text)}`);
        setCompareResults(res ?? []);
      } catch {
        setCompareResults([]);
      }
      setCompareLoading(false);
    }, 300);
  }, []);

  const selectSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    setSearchText(sym);
    setShowDropdown(false);
    setSearchResults([]);
    setActiveTab("overview");
  };

  // Quote
  const { data: quote, isFetching: quoteLoading } = useQuery<Quote>({
    queryKey: ["research-quote", selectedSymbol],
    queryFn: () => api.get<Quote>(`/api/research/quote/${selectedSymbol}`),
    enabled: !!selectedSymbol,
    staleTime: 60 * 1000,
  });

  // Fundamentals
  const { data: fundamentals, isFetching: fundamentalsLoading } = useQuery<Fundamentals>({
    queryKey: ["research-fundamentals", selectedSymbol, quote?.marketCap],
    queryFn: async () => {
      const raw = await api.get<{
        trailingPE?: number; forwardPE?: number; priceToBook?: number; priceToSales?: number;
        evEbitda?: number; returnOnEquity?: number; returnOnAssets?: number;
        grossMargins?: number; operatingMargins?: number; profitMargins?: number;
        revenueGrowth?: number; earningsGrowth?: number; freeCashflow?: number;
        debtToEquity?: number; currentRatio?: number; totalCash?: number;
        totalRevenue?: number; totalDebt?: number; beta?: number;
        fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number;
        dividendYield?: number; trailingEps?: number;
      }>(`/api/research/fundamentals/${selectedSymbol}`);
      const pct = (v?: number) => v != null ? Math.round(v * 10000) / 100 : undefined;
      return {
        peRatio: raw?.trailingPE,
        psRatio: raw?.priceToSales,
        pbRatio: raw?.priceToBook,
        evEbitda: raw?.evEbitda,
        roe: pct(raw?.returnOnEquity),
        grossMargin: pct(raw?.grossMargins),
        operatingMargin: pct(raw?.operatingMargins),
        netMargin: pct(raw?.profitMargins),
        revenueGrowth: pct(raw?.revenueGrowth),
        epsGrowth: pct(raw?.earningsGrowth),
        freeCashFlow: raw?.freeCashflow,
        debtToEquity: raw?.debtToEquity,
        currentRatio: raw?.currentRatio,
        beta: raw?.beta,
        week52High: raw?.fiftyTwoWeekHigh,
        week52Low: raw?.fiftyTwoWeekLow,
        marketCap: quote?.marketCap,
      } as Fundamentals;
    },
    enabled: !!selectedSymbol && activeTab === "fundamentals",
    staleTime: 5 * 60 * 1000,
  });

  // History (30-day)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const { data: history } = useQuery<HistoryPoint[]>({
    queryKey: ["research-history", selectedSymbol, thirtyDaysAgo],
    queryFn: () => api.get<HistoryPoint[]>(`/api/research/history/${selectedSymbol}?interval=1d&period1=${thirtyDaysAgo}`),
    enabled: !!selectedSymbol && activeTab === "overview",
    staleTime: 5 * 60 * 1000,
  });

  // News
  const { data: news, isFetching: newsLoading } = useQuery<NewsItem[]>({
    queryKey: ["research-news", selectedSymbol],
    queryFn: () => api.get<NewsItem[]>(`/api/research/news/${selectedSymbol}`),
    enabled: !!selectedSymbol && activeTab === "news",
    staleTime: 5 * 60 * 1000,
  });

  // AI Summary (overview)
  const { data: summary } = useQuery<{ summary: string }>({
    queryKey: ["research-summary", selectedSymbol],
    queryFn: () => api.get<{ summary: string }>(`/api/research/summary/${selectedSymbol}`),
    enabled: !!selectedSymbol && activeTab === "overview",
    staleTime: 10 * 60 * 1000,
  });

  // Compare quote
  const { data: compareQuote, isFetching: compareQuoteLoading } = useQuery<Quote>({
    queryKey: ["research-compare-quote", compareSymbol],
    queryFn: () => api.get<Quote>(`/api/research/quote/${compareSymbol}`),
    enabled: !!compareSymbol && activeTab === "compare",
    staleTime: 60 * 1000,
  });

  const hasSymbol = !!selectedSymbol;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="research-screen">
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* ── Header ── */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(350)}
          style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <View>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.8 }}>
                Research AI
              </Text>
              <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>
                Powered by Opturna Quant
              </Text>
            </View>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: `${colors.accent}18`,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: `${colors.accent}30`,
            }}>
              <Cpu size={11} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>AI</Text>
            </View>
          </View>

          {/* Search bar */}
          <View style={{ position: "relative" }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: showDropdown ? colors.accent + "60" : colors.border,
              paddingHorizontal: 14,
              paddingVertical: 2,
            }}>
              <Search size={17} color={colors.text3} />
              <TextInput
                ref={searchRef}
                value={searchText}
                onChangeText={handleSearchChange}
                onFocus={() => searchText.length > 0 && setShowDropdown(true)}
                placeholder="Buscar empresa o símbolo..."
                placeholderTextColor={colors.text4}
                autoCapitalize="characters"
                testID="research-search-input"
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 15,
                  fontWeight: "600",
                  paddingVertical: 12,
                  paddingLeft: 10,
                  paddingRight: 4,
                }}
              />
              {searchLoading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : searchText.length > 0 ? (
                <Pressable onPress={() => { setSearchText(""); setShowDropdown(false); setSearchResults([]); }}>
                  <X size={16} color={colors.text3} />
                </Pressable>
              ) : null}
            </View>

            {/* Dropdown */}
            {showDropdown && searchResults.length > 0 ? (
              <View style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 100,
                backgroundColor: colors.card,
                borderRadius: 14,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderWidth: 1,
                borderTopWidth: 0,
                borderColor: colors.border,
                overflow: "hidden",
                marginTop: -2,
              }}>
                {searchResults.slice(0, 7).map((item) => (
                  <Pressable
                    key={item.symbol}
                    onPress={() => selectSymbol(item.symbol)}
                    testID={`search-result-${item.symbol}`}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      backgroundColor: pressed ? colors.bg4 : "transparent",
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{item.symbol}</Text>
                      <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }} numberOfLines={1}>{item.name}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 2 }}>
                      <Text style={{ color: colors.text4, fontSize: 10 }}>{item.exchange}</Text>
                      <ChevronRight size={14} color={colors.text4} />
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ── Quick picks ── */}
          <Animated.View entering={FadeInDown.delay(60).duration(350)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingHorizontal: 18, gap: 8, paddingBottom: 4 }}
            >
              {QUICK_PICKS.map((sym) => (
                <Pressable
                  key={sym}
                  onPress={() => selectSymbol(sym)}
                  testID={`quick-pick-${sym}`}
                  style={{
                    backgroundColor: selectedSymbol === sym ? colors.accent : colors.card,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: selectedSymbol === sym ? colors.accent : colors.border,
                  }}
                >
                  <Text style={{
                    color: selectedSymbol === sym ? colors.bg : colors.text2,
                    fontSize: 12,
                    fontWeight: "700",
                    letterSpacing: 0.2,
                  }}>
                    {sym}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {!hasSymbol ? (
            <Animated.View
              entering={FadeInDown.delay(120).duration(400)}
              style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 32 }}
              testID="empty-state"
            >
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}>
                <BarChart3 size={28} color={colors.text3} />
              </View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.4, marginBottom: 8, textAlign: "center" }}>
                Busca una empresa
              </Text>
              <Text style={{ color: colors.text3, fontSize: 14, lineHeight: 21, textAlign: "center" }}>
                Escribe un símbolo o nombre de empresa para ver cotizaciones, fundamentales y análisis IA.
              </Text>
            </Animated.View>
          ) : (
            <View style={{ paddingHorizontal: 18, paddingTop: 14 }}>
              {/* Quote card or skeleton */}
              {quoteLoading && !quote ? (
                <View style={{ gap: 10, marginBottom: 14 }}>
                  <Skeleton h={130} r={20} colors={colors} />
                </View>
              ) : quote ? (
                <QuoteCard quote={quote} colors={colors} />
              ) : null}

              {/* Tabs */}
              <Animated.View entering={FadeInDown.delay(100).duration(300)}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0, marginBottom: 16 }}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <Pressable
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key)}
                        testID={`tab-${tab.key}`}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: isActive ? colors.accent : colors.card,
                          borderWidth: 1,
                          borderColor: isActive ? colors.accent : colors.border,
                        }}
                      >
                        <Text style={{
                          color: isActive ? colors.bg : colors.text2,
                          fontSize: 13,
                          fontWeight: "700",
                        }}>
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Animated.View>

              {/* ── Tab: Overview ── */}
              {activeTab === "overview" ? (
                <Animated.View entering={FadeInDown.duration(350)} testID="tab-content-overview">
                  {/* 30-day chart */}
                  {history && history.length > 1 ? (
                    <View style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginBottom: 14,
                      alignItems: "center",
                    }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 10 }}>
                        <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
                          PRECIO 30 DÍAS
                        </Text>
                        <Text style={{
                          color: history[history.length - 1].close >= history[0].close ? "#4ADE80" : "#EF4444",
                          fontSize: 11,
                          fontWeight: "700",
                        }}>
                          {fmtPct(((history[history.length - 1].close - history[0].close) / history[0].close) * 100)}
                        </Text>
                      </View>
                      <PriceChart data={history} colors={colors} />
                    </View>
                  ) : null}

                  {/* AI Summary */}
                  {summary?.summary ? (
                    <View style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginBottom: 14,
                    }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <Brain size={14} color={colors.accent} />
                        <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
                          RESUMEN IA
                        </Text>
                      </View>
                      <Text style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}>
                        {summary.summary}
                      </Text>
                    </View>
                  ) : null}

                  {/* Quick stats */}
                  {quote ? (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
                      {[
                        { label: "Apertura", value: fmtPrice(quote.open) },
                        { label: "Cierre ant.", value: fmtPrice(quote.previousClose) },
                        { label: "P/E", value: quote.pe ? quote.pe.toFixed(1) : "--" },
                        { label: "EPS", value: quote.eps ? `$${quote.eps.toFixed(2)}` : "--" },
                        { label: "Máx 52s", value: quote.week52High ? fmtPrice(quote.week52High) : "--" },
                        { label: "Mín 52s", value: quote.week52Low ? fmtPrice(quote.week52Low) : "--" },
                      ].map((item) => (
                        <RatioCard key={item.label} label={item.label} value={item.value} colors={colors} />
                      ))}
                    </View>
                  ) : null}
                </Animated.View>
              ) : null}

              {/* ── Tab: Fundamentals ── */}
              {activeTab === "fundamentals" ? (
                <Animated.View entering={FadeInDown.duration(350)} testID="tab-content-fundamentals">
                  {fundamentalsLoading && !fundamentals ? (
                    <View style={{ gap: 10 }}>
                      {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={{ flexDirection: "row", gap: 10 }}>
                          <Skeleton h={80} r={14} colors={colors} />
                          <Skeleton h={80} r={14} colors={colors} />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                      {[
                        { label: "P/E Ratio", value: fmtVal(fundamentals?.peRatio ?? quote?.pe) },
                        { label: "P/S Ratio", value: fmtVal(fundamentals?.psRatio) },
                        { label: "P/B Ratio", value: fmtVal(fundamentals?.pbRatio) },
                        { label: "EV/EBITDA", value: fmtVal(fundamentals?.evEbitda) },
                        { label: "ROE", value: fmtVal(fundamentals?.roe, "%") },
                        { label: "ROIC", value: fmtVal(fundamentals?.roic, "%") },
                        { label: "Margen Bruto", value: fmtVal(fundamentals?.grossMargin, "%") },
                        { label: "Margen Op.", value: fmtVal(fundamentals?.operatingMargin, "%") },
                        { label: "Margen Neto", value: fmtVal(fundamentals?.netMargin, "%") },
                        { label: "Crec. Revenue", value: fmtVal(fundamentals?.revenueGrowth, "%"), color: (fundamentals?.revenueGrowth ?? 0) >= 0 ? "#4ADE80" : "#EF4444" },
                        { label: "Crec. EPS", value: fmtVal(fundamentals?.epsGrowth, "%"), color: (fundamentals?.epsGrowth ?? 0) >= 0 ? "#4ADE80" : "#EF4444" },
                        { label: "FCF", value: fmtLarge(fundamentals?.freeCashFlow ?? 0) },
                        { label: "Market Cap", value: fmtLarge(fundamentals?.marketCap ?? quote?.marketCap ?? 0) },
                        { label: "Deuda/Equity", value: fmtVal(fundamentals?.debtToEquity) },
                        { label: "Beta", value: fmtVal(fundamentals?.beta ?? quote?.beta) },
                        { label: "Máx 52s", value: fmtPrice(fundamentals?.week52High ?? quote?.week52High ?? 0) },
                        { label: "Mín 52s", value: fmtPrice(fundamentals?.week52Low ?? quote?.week52Low ?? 0) },
                        { label: "Ratio Corriente", value: fmtVal(fundamentals?.currentRatio) },
                      ].map((item) => (
                        <RatioCard
                          key={item.label}
                          label={item.label}
                          value={item.value}
                          color={item.color}
                          colors={colors}
                        />
                      ))}
                    </View>
                  )}
                </Animated.View>
              ) : null}

              {/* ── Tab: News ── */}
              {activeTab === "news" ? (
                <Animated.View entering={FadeInDown.duration(350)} testID="tab-content-news">
                  {newsLoading && !news ? (
                    <View style={{ gap: 14 }}>
                      {[1, 2, 3].map((i) => (
                        <View key={i} style={{ flexDirection: "row", gap: 12 }}>
                          <Skeleton h={64} r={10} colors={colors} />
                          <View style={{ flex: 1, gap: 8 }}>
                            <Skeleton h={14} colors={colors} />
                            <Skeleton h={14} colors={colors} />
                            <Skeleton h={10} r={6} colors={colors} />
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : news && news.length > 0 ? (
                    <View>
                      {news.map((item, i) => (
                        <NewsItemRow key={i} item={item} colors={colors} />
                      ))}
                    </View>
                  ) : (
                    <View style={{ alignItems: "center", paddingVertical: 32 }}>
                      <Newspaper size={32} color={colors.text4} />
                      <Text style={{ color: colors.text3, fontSize: 14, marginTop: 10 }}>
                        No hay noticias disponibles
                      </Text>
                    </View>
                  )}
                </Animated.View>
              ) : null}

              {/* ── Tab: AI Analysis ── */}
              {activeTab === "ai" ? (
                <View style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }} testID="tab-content-ai">
                  <AIAnalysisPanel symbol={selectedSymbol} colors={colors} />
                </View>
              ) : null}

              {/* ── Tab: Compare ── */}
              {activeTab === "compare" ? (
                <Animated.View entering={FadeInDown.duration(350)} testID="tab-content-compare">
                  <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 10 }}>
                    COMPARAR CON
                  </Text>

                  {/* Compare search */}
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 12,
                    marginBottom: 8,
                  }}>
                    <Search size={15} color={colors.text3} />
                    <TextInput
                      value={compareSearch}
                      onChangeText={handleCompareSearchChange}
                      placeholder="Buscar símbolo para comparar..."
                      placeholderTextColor={colors.text4}
                      autoCapitalize="characters"
                      testID="compare-search-input"
                      style={{
                        flex: 1,
                        color: colors.text,
                        fontSize: 14,
                        fontWeight: "600",
                        paddingVertical: 10,
                        paddingLeft: 8,
                      }}
                    />
                    {compareLoading ? <ActivityIndicator size="small" color={colors.accent} /> : null}
                  </View>

                  {/* Compare search results */}
                  {compareResults.length > 0 ? (
                    <View style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginBottom: 14,
                      overflow: "hidden",
                    }}>
                      {compareResults.slice(0, 5).map((item) => (
                        <Pressable
                          key={item.symbol}
                          onPress={() => {
                            setCompareSymbol(item.symbol);
                            setCompareSearch(item.symbol);
                            setCompareResults([]);
                          }}
                          testID={`compare-result-${item.symbol}`}
                          style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            backgroundColor: pressed ? colors.bg4 : "transparent",
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          })}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{item.symbol}</Text>
                            <Text style={{ color: colors.text3, fontSize: 11 }} numberOfLines={1}>{item.name}</Text>
                          </View>
                          <ChevronRight size={13} color={colors.text4} />
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  {/* Side-by-side quote cards */}
                  {(quote || compareQuote) ? (
                    <View style={{ gap: 10 }}>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        {[
                          { q: quote, label: selectedSymbol, loading: quoteLoading },
                          { q: compareQuote, label: compareSymbol, loading: compareQuoteLoading },
                        ].map(({ q, label, loading }, i) => (
                          <View
                            key={i}
                            style={{
                              flex: 1,
                              backgroundColor: colors.card,
                              borderRadius: 14,
                              padding: 14,
                              borderWidth: 1,
                              borderColor: colors.border,
                            }}
                          >
                            {loading && !q ? (
                              <View style={{ gap: 8 }}>
                                <Skeleton h={14} colors={colors} />
                                <Skeleton h={22} r={6} colors={colors} />
                                <Skeleton h={12} r={6} colors={colors} />
                              </View>
                            ) : q ? (
                              <>
                                <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "600", marginBottom: 4 }}>{q.exchange}</Text>
                                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900", letterSpacing: -0.5 }}>{q.symbol}</Text>
                                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 6, letterSpacing: -0.5 }}>
                                  {fmtPrice(q.price)}
                                </Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                                  {q.changePercent >= 0
                                    ? <ArrowUpRight size={12} color="#4ADE80" />
                                    : <ArrowDownRight size={12} color="#EF4444" />}
                                  <Text style={{ color: q.changePercent >= 0 ? "#4ADE80" : "#EF4444", fontSize: 12, fontWeight: "700" }}>
                                    {fmtPct(q.changePercent)}
                                  </Text>
                                </View>
                                <View style={{ marginTop: 10, gap: 4 }}>
                                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ color: colors.text3, fontSize: 10 }}>MCap</Text>
                                    <Text style={{ color: colors.text, fontSize: 10, fontWeight: "700" }}>{fmtLarge(q.marketCap)}</Text>
                                  </View>
                                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ color: colors.text3, fontSize: 10 }}>P/E</Text>
                                    <Text style={{ color: colors.text, fontSize: 10, fontWeight: "700" }}>{q.pe ? q.pe.toFixed(1) : "--"}</Text>
                                  </View>
                                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text style={{ color: colors.text3, fontSize: 10 }}>Beta</Text>
                                    <Text style={{ color: colors.text, fontSize: 10, fontWeight: "700" }}>{q.beta ? q.beta.toFixed(2) : "--"}</Text>
                                  </View>
                                </View>
                              </>
                            ) : (
                              <View style={{ alignItems: "center", paddingVertical: 16 }}>
                                <Text style={{ color: colors.text4, fontSize: 12 }}>{label || "Seleccionar"}</Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </Animated.View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
