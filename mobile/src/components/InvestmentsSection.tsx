import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { WebView } from "react-native-webview";
import {
  Search,
  ChevronDown,
  ChevronUp,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  DollarSign,
  Send,
  AlertTriangle,
  Activity,
  Zap,
  RefreshCw,
  CheckCircle,
  ChevronRight,
  Edit2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "../lib/api/api";

// ---- Types ----

interface OHLCCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AssetSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  assetType: string;
  currency: string;
}

interface AnalysisResult {
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
  dataStatus: string;
  lastSignalTimestamp: string;
  telegramSent: boolean;
  candles: OHLCCandle[];
}

interface SavedSignal {
  id: string;
  symbol: string;
  name: string;
  signal: string;
  price: number;
  entryPrice: number;
  confidenceScore: number;
  riskLevel: string;
  telegramSent: boolean;
  createdAt: string;
  timeframe: string;
  gainEstimate: number;
  lossEstimate: number;
}

// ---- Helpers ----

const formatPrice = (price: number, currency: string = "USD") => {
  if (!price || price === 0) return "--";
  const decimals = price < 1 ? 6 : price < 100 ? 4 : 2;
  return (
    price.toLocaleString("en", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    " " +
    currency
  );
};

const formatPriceRaw = (price: number) => {
  if (!price || price === 0) return "--";
  const decimals = price < 1 ? 6 : price < 100 ? 4 : 2;
  return price.toLocaleString("en", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatPercent = (pct: number) =>
  `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

const timeAgo = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
};

const signalColor = (signal: string) =>
  signal === "BUY" ? "#4ADE80" : signal === "SELL" ? "#EF4444" : "#F59E0B";

const signalBg = (signal: string) =>
  signal === "BUY"
    ? "#4ADE8018"
    : signal === "SELL"
      ? "#EF444418"
      : "#F59E0B18";

const riskColor = (risk: string) =>
  risk === "low" || risk === "bajo"
    ? "#4ADE80"
    : risk === "medium" || risk === "medio"
      ? "#F59E0B"
      : "#EF4444";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W"];

const tvIntervalMap: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "4h": "240",
  "1D": "D",
  "1W": "W",
};

// ---- Skeleton ----

const SkeletonBox = ({ style }: { style?: object }) => (
  <Animated.View
    entering={FadeIn}
    style={[
      {
        backgroundColor: "#1A1A1A",
        borderRadius: 12,
      },
      style,
    ]}
  />
);

// ---- Main Component ----

export function InvestmentsSection() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AssetSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [capitalInvested, setCapitalInvested] = useState("1000");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [signalHistory, setSignalHistory] = useState<SavedSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssetInfo, setSelectedAssetInfo] =
    useState<AssetSearchResult | null>(null);
  const [showCapitalInput, setShowCapitalInput] = useState(false);

  // Animated values
  const confidenceProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  // Pulse animation for LIVE indicator
  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(1.4, { duration: 800 }), -1, true);
    pulseOpacity.value = withRepeat(
      withTiming(0.3, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // Confidence bar animation
  useEffect(() => {
    if (analysis) {
      confidenceProgress.value = withTiming(analysis.confidenceScore / 100, {
        duration: 1000,
      });
    }
  }, [analysis]);

  const confidenceBarStyle = useAnimatedStyle(() => ({
    width: `${confidenceProgress.value * 100}%`,
  }));

  // Search debounce
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await api.get<AssetSearchResult[]>(
          `/api/signals/search?q=${searchQuery}`
        );
        setSearchResults(results || []);
      } catch {
        setSearchResults([]);
      }
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Auto-analyze when symbol or timeframe changes
  useEffect(() => {
    if (selectedSymbol) {
      handleAnalyze();
    }
  }, [selectedSymbol, selectedTimeframe]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<AnalysisResult>("/api/signals/analyze", {
        symbol: selectedSymbol,
        timeframe: selectedTimeframe,
        capitalInvested: parseFloat(capitalInvested) || 0,
      });
      setAnalysis(result);
      loadHistory(selectedSymbol);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al analizar el activo"
      );
    }
    setLoading(false);
  };

  const loadHistory = async (symbol: string) => {
    try {
      const history = await api.get<SavedSignal[]>(
        `/api/signals/history/${symbol}`
      );
      setSignalHistory(history || []);
    } catch {
      setSignalHistory([]);
    }
  };

  const selectAsset = (asset: AssetSearchResult) => {
    setSelectedAssetInfo(asset);
    setSelectedSymbol(asset.symbol);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const tvInterval = tvIntervalMap[selectedTimeframe] ?? "D";

  const chartHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #080808; overflow: hidden; width: 100%; height: 100%; }
    #tv_chart_container { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="tv_chart_container"></div>
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <script type="text/javascript">
    new TradingView.widget({
      "width": "100%",
      "height": "100%",
      "symbol": "${selectedSymbol}",
      "interval": "${tvInterval}",
      "timezone": "exchange",
      "theme": "dark",
      "style": "1",
      "locale": "es",
      "toolbar_bg": "#080808",
      "enable_publishing": false,
      "hide_side_toolbar": true,
      "hide_top_toolbar": false,
      "save_image": false,
      "container_id": "tv_chart_container",
      "studies": ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
      "overrides": {
        "paneProperties.background": "#080808",
        "paneProperties.vertGridProperties.color": "#1A1A1A",
        "paneProperties.horzGridProperties.color": "#1A1A1A"
      }
    });
  </script>
</body>
</html>
`;

  const entryRef = analysis?.entryPrice ?? 0;
  const pctFromEntry = (price: number) => {
    if (!entryRef || entryRef === 0) return 0;
    return ((price - entryRef) / entryRef) * 100;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#080808" }}
      showsVerticalScrollIndicator={false}
      testID="investments-scroll"
    >
      {/* ---- 1. HEADER ---- */}
      <Animated.View
        entering={FadeInDown.delay(0).duration(400)}
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={{
              color: "#F5F5F5",
              fontSize: 22,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}
          >
            Señales de Inversión
          </Text>
          <Text style={{ color: "#737373", fontSize: 12, marginTop: 2 }}>
            Powered by Opturna Engine
          </Text>
        </View>
        {analysis ? (
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            testID="live-indicator"
          >
            <View style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
              <Animated.View
                style={[
                  pulseStyle,
                  {
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#4ADE80",
                    position: "absolute",
                  },
                ]}
              />
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: "#4ADE80",
                }}
              />
            </View>
            <Text
              style={{ color: "#4ADE80", fontSize: 11, fontWeight: "700", letterSpacing: 1 }}
            >
              LIVE
            </Text>
          </View>
        ) : null}
      </Animated.View>

      {/* ---- 2. ASSET SELECTOR ---- */}
      <Animated.View
        entering={FadeInDown.delay(60).duration(400)}
        style={{ marginHorizontal: 16, marginBottom: 12 }}
      >
        <Pressable
          onPress={() => {
            setShowSearch(!showSearch);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          testID="asset-selector"
          style={{
            backgroundColor: "#0F0F0F",
            borderRadius: showSearch ? 16 : 16,
            borderBottomLeftRadius: showSearch ? 0 : 16,
            borderBottomRightRadius: showSearch ? 0 : 16,
            borderWidth: 1,
            borderColor: "#1F1F1F",
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Text
                style={{
                  color: "#F5F5F5",
                  fontSize: 28,
                  fontWeight: "800",
                  letterSpacing: -1,
                }}
              >
                {selectedSymbol}
              </Text>
              {(selectedAssetInfo?.exchange ?? (analysis?.exchange || "")) ? (
                <View
                  style={{
                    backgroundColor: "#1A1A1A",
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ color: "#A3A3A3", fontSize: 10, fontWeight: "600" }}>
                    {selectedAssetInfo?.exchange ?? analysis?.exchange ?? ""}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: "#A3A3A3", fontSize: 13, marginBottom: 6 }}>
              {selectedAssetInfo?.name ?? analysis?.name ?? "Cargando..."}
            </Text>
            {analysis ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text
                  style={{
                    color: "#F5F5F5",
                    fontSize: 18,
                    fontWeight: "700",
                  }}
                >
                  {formatPriceRaw(analysis.currentPrice)}
                </Text>
                <View
                  style={{
                    backgroundColor:
                      analysis.percentChange >= 0 ? "#4ADE8020" : "#EF444420",
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      color:
                        analysis.percentChange >= 0 ? "#4ADE80" : "#EF4444",
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    {formatPercent(analysis.percentChange)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
          <View style={{ alignItems: "center", justifyContent: "center", paddingLeft: 8 }}>
            {showSearch ? (
              <ChevronUp size={20} color="#A3A3A3" />
            ) : (
              <ChevronDown size={20} color="#A3A3A3" />
            )}
          </View>
        </Pressable>

        {/* Search panel */}
        {showSearch ? (
          <View
            style={{
              backgroundColor: "#0A0A0A",
              borderWidth: 1,
              borderTopWidth: 0,
              borderColor: "#1F1F1F",
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              padding: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#141414",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                paddingHorizontal: 12,
                marginBottom: 10,
              }}
            >
              <Search size={16} color="#737373" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar activo... (AAPL, BTC, ETH)"
                placeholderTextColor="#404040"
                autoFocus
                testID="search-input"
                style={{
                  flex: 1,
                  color: "#F5F5F5",
                  fontSize: 14,
                  paddingVertical: 10,
                  paddingLeft: 8,
                }}
              />
              {searchLoading ? (
                <ActivityIndicator size="small" color="#4ADE80" />
              ) : null}
            </View>
            {searchResults.length > 0 ? (
              <View>
                {searchResults.slice(0, 6).map((item) => (
                  <Pressable
                    key={item.symbol}
                    onPress={() => selectAsset(item)}
                    testID={`search-result-${item.symbol}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                      paddingHorizontal: 4,
                      borderBottomWidth: 1,
                      borderBottomColor: "#141414",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text
                          style={{
                            color: "#F5F5F5",
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {item.symbol}
                        </Text>
                        <View
                          style={{
                            backgroundColor: "#1A1A1A",
                            borderRadius: 4,
                            paddingHorizontal: 5,
                            paddingVertical: 1,
                          }}
                        >
                          <Text style={{ color: "#737373", fontSize: 10 }}>
                            {item.assetType}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={{ color: "#737373", fontSize: 12, marginTop: 1 }}
                      >
                        {item.name} · {item.exchange}
                      </Text>
                    </View>
                    <ChevronRight size={14} color="#404040" />
                  </Pressable>
                ))}
              </View>
            ) : searchQuery.length > 0 && !searchLoading ? (
              <Text
                style={{
                  color: "#737373",
                  fontSize: 13,
                  textAlign: "center",
                  paddingVertical: 12,
                }}
              >
                Sin resultados para "{searchQuery}"
              </Text>
            ) : null}
          </View>
        ) : null}
      </Animated.View>

      {/* ---- 3. TIMEFRAME SELECTOR ---- */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={{ marginBottom: 12 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        >
          {TIMEFRAMES.map((tf) => (
            <Pressable
              key={tf}
              onPress={() => {
                setSelectedTimeframe(tf);
                Haptics.selectionAsync();
              }}
              testID={`timeframe-${tf}`}
              style={{
                backgroundColor:
                  selectedTimeframe === tf ? "#4ADE80" : "#141414",
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderWidth: 1,
                borderColor:
                  selectedTimeframe === tf ? "#4ADE80" : "#1F1F1F",
              }}
            >
              <Text
                style={{
                  color: selectedTimeframe === tf ? "#080808" : "#A3A3A3",
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.2,
                }}
              >
                {tf}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ---- 4. TRADINGVIEW CHART ---- */}
      <Animated.View
        entering={FadeInDown.delay(140).duration(400)}
        style={{
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#1F1F1F",
          height: 280,
        }}
      >
        <WebView
          source={{ html: chartHTML }}
          style={{ flex: 1, backgroundColor: "#080808" }}
          scrollEnabled={false}
          pointerEvents="none"
          testID="tradingview-chart"
        />
      </Animated.View>

      {/* ---- 5. ANALYZE BUTTON ---- */}
      <Animated.View
        entering={FadeInDown.delay(160).duration(400)}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleAnalyze();
          }}
          disabled={loading}
          testID="analyze-button"
          style={{
            backgroundColor: loading ? "#1A1A1A" : "#4ADE80",
            borderRadius: 14,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#4ADE80" />
              <Text
                style={{
                  color: "#4ADE80",
                  fontSize: 15,
                  fontWeight: "700",
                  letterSpacing: 0.3,
                }}
              >
                Analizando...
              </Text>
            </>
          ) : (
            <>
              <BarChart2 size={18} color="#080808" />
              <Text
                style={{
                  color: "#080808",
                  fontSize: 15,
                  fontWeight: "800",
                  letterSpacing: 0.3,
                }}
              >
                Analizar Señal
              </Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      {/* ---- 6. ERROR STATE ---- */}
      {error ? (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: "#EF444410",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#EF444430",
            padding: 16,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
          }}
          testID="error-state"
        >
          <AlertTriangle size={20} color="#EF4444" />
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: "#EF4444", fontSize: 13, fontWeight: "600", marginBottom: 6 }}
            >
              Error al analizar
            </Text>
            <Text style={{ color: "#A3A3A3", fontSize: 12, lineHeight: 18 }}>
              {error}
            </Text>
            <Pressable
              onPress={handleAnalyze}
              style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={14} color="#EF4444" />
              <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "700" }}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : null}

      {/* ---- 7. INSUFFICIENT DATA ---- */}
      {!error && analysis?.validationState === "insufficient_data" ? (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: "#F59E0B10",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#F59E0B30",
            padding: 16,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
          }}
          testID="insufficient-data-state"
        >
          <AlertTriangle size={20} color="#F59E0B" />
          <Text style={{ color: "#F5F5F5", fontSize: 13, lineHeight: 20, flex: 1 }}>
            Datos insuficientes para generar un análisis confiable. Prueba con
            otro timeframe o activo.
          </Text>
        </Animated.View>
      ) : null}

      {/* ---- Loading Skeleton ---- */}
      {loading && !analysis ? (
        <View style={{ marginHorizontal: 16, gap: 12 }}>
          <SkeletonBox style={{ height: 160, borderRadius: 16 }} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <SkeletonBox style={{ flex: 1, height: 80 }} />
            <SkeletonBox style={{ flex: 1, height: 80 }} />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <SkeletonBox style={{ flex: 1, height: 80 }} />
            <SkeletonBox style={{ flex: 1, height: 80 }} />
          </View>
        </View>
      ) : null}

      {/* ---- VALID ANALYSIS SECTIONS ---- */}
      {analysis && analysis.validationState === "valid" ? (
        <>
          {/* ---- 8. MAIN SIGNAL CARD ---- */}
          <Animated.View
            entering={FadeInDown.delay(0).duration(500)}
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: "#0F0F0F",
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: signalColor(analysis.signal) + "40",
              padding: 20,
              overflow: "hidden",
            }}
            testID="signal-card"
          >
            {/* Glow effect */}
            <View
              style={{
                position: "absolute",
                top: -40,
                left: -40,
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: signalColor(analysis.signal) + "08",
              }}
            />

            {/* Signal header row */}
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <Text
                style={{
                  color: signalColor(analysis.signal),
                  fontSize: 52,
                  fontWeight: "900",
                  letterSpacing: -2,
                  lineHeight: 56,
                }}
                testID="signal-label"
              >
                {analysis.signal}
              </Text>
              <View
                style={{
                  backgroundColor: signalColor(analysis.signal) + "20",
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Zap size={12} color={signalColor(analysis.signal)} />
                <Text
                  style={{
                    color: signalColor(analysis.signal),
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                  }}
                >
                  {analysis.signalSource || "SUPERTREND"}
                </Text>
              </View>
            </View>

            {/* Subtitle */}
            <Text style={{ color: "#A3A3A3", fontSize: 13, marginBottom: 16 }}>
              {analysis.signal === "BUY"
                ? "Señal alcista confirmada"
                : analysis.signal === "SELL"
                  ? "Señal bajista confirmada"
                  : "Mercado en zona neutral"}
            </Text>

            {/* Entry price */}
            <View
              style={{
                backgroundColor: "#141414",
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <Text style={{ color: "#737373", fontSize: 11, marginBottom: 4 }}>
                PRECIO DE ENTRADA
              </Text>
              <Text
                style={{
                  color: "#F5F5F5",
                  fontSize: 22,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                }}
              >
                {formatPrice(analysis.entryPrice, analysis.currency)}
              </Text>
            </View>

            {/* Confidence bar */}
            <View style={{ marginBottom: 14 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <Text style={{ color: "#737373", fontSize: 11 }}>CONFIANZA</Text>
                <Text
                  style={{
                    color: signalColor(analysis.signal),
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {analysis.confidenceScore}%
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: "#1A1A1A",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Animated.View
                  style={[
                    confidenceBarStyle,
                    {
                      height: "100%",
                      backgroundColor: signalColor(analysis.signal),
                      borderRadius: 3,
                    },
                  ]}
                />
              </View>
            </View>

            {/* RSI and trend row */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#141414",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <Text style={{ color: "#737373", fontSize: 10, marginBottom: 2 }}>
                  RSI
                </Text>
                <Text
                  style={{
                    color:
                      analysis.rsi > 70
                        ? "#EF4444"
                        : analysis.rsi < 30
                          ? "#4ADE80"
                          : "#F5F5F5",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  {analysis.rsi.toFixed(1)}
                </Text>
              </View>
              <View
                style={{
                  flex: 2,
                  backgroundColor: "#141414",
                  borderRadius: 10,
                  padding: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {analysis.trendRibbonBullish ? (
                  <TrendingUp size={16} color="#4ADE80" />
                ) : (
                  <TrendingDown size={16} color="#EF4444" />
                )}
                <View>
                  <Text style={{ color: "#737373", fontSize: 10 }}>TENDENCIA</Text>
                  <Text
                    style={{
                      color: analysis.trendRibbonBullish ? "#4ADE80" : "#EF4444",
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {analysis.trendRibbonBullish ? "ALCISTA" : "BAJISTA"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status and badges */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              <View
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ color: "#A3A3A3", fontSize: 11 }}>
                  {analysis.operationState || analysis.signalStatus}
                </Text>
              </View>
              {analysis.reversalSignal ? (
                <View
                  style={{
                    backgroundColor: "#F59E0B15",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: "#F59E0B30",
                  }}
                >
                  <Text style={{ color: "#F59E0B", fontSize: 11, fontWeight: "600" }}>
                    ↩ Reversión detectada
                  </Text>
                </View>
              ) : null}
              {analysis.breakoutSignal ? (
                <View
                  style={{
                    backgroundColor: "#4ADE8015",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: "#4ADE8030",
                  }}
                >
                  <Text style={{ color: "#4ADE80", fontSize: 11, fontWeight: "600" }}>
                    ⚡ Breakout confirmado
                  </Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* ---- 9. PRICE LEVELS GRID ---- */}
          <Animated.View
            entering={FadeInDown.delay(60).duration(500)}
            style={{ marginHorizontal: 16, marginBottom: 16 }}
          >
            <Text
              style={{
                color: "#A3A3A3",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              NIVELES DE PRECIO
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              {/* Stop Loss */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#EF444410",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#EF444425",
                  padding: 14,
                }}
                testID="stop-loss-card"
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <Shield size={12} color="#EF4444" />
                  <Text style={{ color: "#EF4444", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                    STOP LOSS
                  </Text>
                </View>
                <Text style={{ color: "#F5F5F5", fontSize: 15, fontWeight: "800" }}>
                  {formatPriceRaw(analysis.stopLoss)}
                </Text>
                <Text style={{ color: "#EF4444", fontSize: 11, marginTop: 2 }}>
                  {formatPercent(pctFromEntry(analysis.stopLoss))}
                </Text>
              </View>
              {/* TP1 */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#4ADE8010",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#4ADE8025",
                  padding: 14,
                }}
                testID="tp1-card"
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <Target size={12} color="#4ADE80" />
                  <Text style={{ color: "#4ADE80", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                    TP1
                  </Text>
                </View>
                <Text style={{ color: "#F5F5F5", fontSize: 15, fontWeight: "800" }}>
                  {formatPriceRaw(analysis.tp1)}
                </Text>
                <Text style={{ color: "#4ADE80", fontSize: 11, marginTop: 2 }}>
                  {formatPercent(pctFromEntry(analysis.tp1))}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {/* TP2 */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#4ADE8010",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#4ADE8025",
                  padding: 14,
                }}
                testID="tp2-card"
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <Target size={12} color="#4ADE80" />
                  <Text style={{ color: "#4ADE80", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                    TP2 (Objetivo)
                  </Text>
                </View>
                <Text style={{ color: "#F5F5F5", fontSize: 15, fontWeight: "800" }}>
                  {formatPriceRaw(analysis.tp2)}
                </Text>
                <Text style={{ color: "#4ADE80", fontSize: 11, marginTop: 2 }}>
                  {formatPercent(pctFromEntry(analysis.tp2))}
                </Text>
              </View>
              {/* TP3 */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#4ADE8010",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#4ADE8025",
                  padding: 14,
                }}
                testID="tp3-card"
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <Target size={12} color="#4ADE80" />
                  <Text style={{ color: "#4ADE80", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                    TP3
                  </Text>
                </View>
                <Text style={{ color: "#F5F5F5", fontSize: 15, fontWeight: "800" }}>
                  {formatPriceRaw(analysis.tp3)}
                </Text>
                <Text style={{ color: "#4ADE80", fontSize: 11, marginTop: 2 }}>
                  {formatPercent(pctFromEntry(analysis.tp3))}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ---- 10. RISK/REWARD METRICS STRIP ---- */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={{ marginHorizontal: 16, marginBottom: 16, flexDirection: "row", gap: 8 }}
          >
            {/* R/R Ratio */}
            <View
              style={{
                flex: 1,
                backgroundColor: "#0F0F0F",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                padding: 12,
                alignItems: "center",
              }}
              testID="rr-ratio-card"
            >
              <Text style={{ color: "#60A5FA", fontSize: 17, fontWeight: "800" }}>
                {analysis.riskReward.toFixed(2)}x
              </Text>
              <Text style={{ color: "#737373", fontSize: 10, marginTop: 3 }}>R/B RATIO</Text>
            </View>
            {/* Movement % */}
            <View
              style={{
                flex: 1,
                backgroundColor: "#0F0F0F",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                padding: 12,
                alignItems: "center",
              }}
              testID="movement-card"
            >
              <Text
                style={{
                  color:
                    analysis.movementPercent >= 0 ? "#4ADE80" : "#EF4444",
                  fontSize: 17,
                  fontWeight: "800",
                }}
              >
                {formatPercent(analysis.movementPercent)}
              </Text>
              <Text style={{ color: "#737373", fontSize: 10, marginTop: 3 }}>
                MOVIMIENTO
              </Text>
            </View>
            {/* Risk Level */}
            <View
              style={{
                flex: 1,
                backgroundColor: "#0F0F0F",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                padding: 12,
                alignItems: "center",
              }}
              testID="risk-card"
            >
              <Text
                style={{
                  color: riskColor(analysis.riskLevel),
                  fontSize: 13,
                  fontWeight: "800",
                  letterSpacing: 0.5,
                }}
              >
                {analysis.riskLevel.toUpperCase()}
              </Text>
              <Text style={{ color: "#737373", fontSize: 10, marginTop: 3 }}>RIESGO</Text>
            </View>
          </Animated.View>

          {/* ---- 11. CAPITAL & POSITION SIZE ---- */}
          <Animated.View
            entering={FadeInDown.delay(130).duration(500)}
            style={{ marginHorizontal: 16, marginBottom: 16 }}
          >
            <Pressable
              onPress={() => setShowCapitalInput(!showCapitalInput)}
              testID="capital-toggle"
              style={{
                backgroundColor: "#0F0F0F",
                borderRadius: showCapitalInput ? 0 : 14,
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                borderBottomLeftRadius: showCapitalInput ? 0 : 14,
                borderBottomRightRadius: showCapitalInput ? 0 : 14,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <DollarSign size={16} color="#A3A3A3" />
                <Text style={{ color: "#F5F5F5", fontSize: 14, fontWeight: "600" }}>
                  Capital y Estimaciones
                </Text>
              </View>
              {showCapitalInput ? (
                <ChevronUp size={16} color="#737373" />
              ) : (
                <ChevronDown size={16} color="#737373" />
              )}
            </Pressable>
            {showCapitalInput ? (
              <View
                style={{
                  backgroundColor: "#0A0A0A",
                  borderWidth: 1,
                  borderTopWidth: 0,
                  borderColor: "#1F1F1F",
                  borderBottomLeftRadius: 14,
                  borderBottomRightRadius: 14,
                  padding: 14,
                  gap: 12,
                }}
              >
                {/* Capital input */}
                <View>
                  <Text style={{ color: "#737373", fontSize: 11, marginBottom: 6 }}>
                    CAPITAL INVERTIDO (USD)
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#141414",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#1F1F1F",
                      paddingHorizontal: 12,
                    }}
                  >
                    <Edit2 size={14} color="#737373" />
                    <TextInput
                      value={capitalInvested}
                      onChangeText={setCapitalInvested}
                      keyboardType="numeric"
                      placeholder="1000"
                      placeholderTextColor="#404040"
                      testID="capital-input"
                      style={{
                        flex: 1,
                        color: "#F5F5F5",
                        fontSize: 15,
                        fontWeight: "600",
                        paddingVertical: 10,
                        paddingLeft: 8,
                      }}
                      onSubmitEditing={handleAnalyze}
                    />
                  </View>
                </View>

                {/* Position info */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#141414",
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <Text style={{ color: "#737373", fontSize: 10, marginBottom: 3 }}>
                      CANTIDAD
                    </Text>
                    <Text style={{ color: "#F5F5F5", fontSize: 14, fontWeight: "700" }}>
                      {analysis.quantity > 0
                        ? analysis.quantity.toFixed(4)
                        : "--"}{" "}
                      <Text style={{ color: "#737373", fontSize: 10 }}>
                        {analysis.symbol}
                      </Text>
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#141414",
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <Text style={{ color: "#737373", fontSize: 10, marginBottom: 3 }}>
                      ENTRADA
                    </Text>
                    <Text style={{ color: "#F5F5F5", fontSize: 14, fontWeight: "700" }}>
                      {formatPriceRaw(analysis.entryPrice)}
                    </Text>
                  </View>
                </View>

                {/* Gain/Loss cards */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#4ADE8012",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#4ADE8025",
                      padding: 12,
                    }}
                    testID="gain-card"
                  >
                    <Text style={{ color: "#737373", fontSize: 10, marginBottom: 4 }}>
                      GANANCIA EST.
                    </Text>
                    <Text
                      style={{
                        color: "#4ADE80",
                        fontSize: 16,
                        fontWeight: "800",
                      }}
                    >
                      +${analysis.gainEstimate.toFixed(2)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#EF444412",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#EF444425",
                      padding: 12,
                    }}
                    testID="loss-card"
                  >
                    <Text style={{ color: "#737373", fontSize: 10, marginBottom: 4 }}>
                      PÉRDIDA EST.
                    </Text>
                    <Text
                      style={{
                        color: "#EF4444",
                        fontSize: 16,
                        fontWeight: "800",
                      }}
                    >
                      -${Math.abs(analysis.lossEstimate).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Movement % */}
                <View
                  style={{
                    backgroundColor: "#141414",
                    borderRadius: 10,
                    padding: 12,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#737373", fontSize: 12 }}>
                    Movimiento esperado
                  </Text>
                  <Text
                    style={{
                      color:
                        analysis.movementPercent >= 0 ? "#4ADE80" : "#EF4444",
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    {formatPercent(analysis.movementPercent)}
                  </Text>
                </View>
              </View>
            ) : null}
          </Animated.View>

          {/* ---- 12. MARKET DATA STRIP ---- */}
          <Animated.View
            entering={FadeInDown.delay(160).duration(500)}
            style={{ marginHorizontal: 16, marginBottom: 16 }}
          >
            <Text
              style={{
                color: "#A3A3A3",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              DATOS DE MERCADO
            </Text>
            <View
              style={{
                backgroundColor: "#0F0F0F",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                padding: 14,
              }}
            >
              <View style={{ flexDirection: "row", gap: 0, marginBottom: 12 }}>
                {[
                  { label: "APERTURA", value: formatPriceRaw(analysis.open) },
                  { label: "MÁXIMO", value: formatPriceRaw(analysis.high) },
                  { label: "MÍNIMO", value: formatPriceRaw(analysis.low) },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      flex: 1,
                      borderRightWidth: idx < 2 ? 1 : 0,
                      borderRightColor: "#1A1A1A",
                      paddingHorizontal: 8,
                      paddingLeft: idx === 0 ? 0 : 8,
                    }}
                  >
                    <Text style={{ color: "#737373", fontSize: 9, marginBottom: 3 }}>
                      {item.label}
                    </Text>
                    <Text style={{ color: "#F5F5F5", fontSize: 13, fontWeight: "600" }}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Volume */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#141414",
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: "#737373", fontSize: 11 }}>Volumen</Text>
                <Text style={{ color: "#F5F5F5", fontSize: 13, fontWeight: "600" }}>
                  {analysis.volume > 1000000
                    ? `${(analysis.volume / 1000000).toFixed(2)}M`
                    : analysis.volume > 1000
                      ? `${(analysis.volume / 1000).toFixed(1)}K`
                      : analysis.volume.toLocaleString()}
                </Text>
              </View>

              {/* RSI bar */}
              <View style={{ marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ color: "#737373", fontSize: 11 }}>
                    RSI(14)
                  </Text>
                  <Text
                    style={{
                      color:
                        analysis.rsi > 70
                          ? "#EF4444"
                          : analysis.rsi < 30
                            ? "#4ADE80"
                            : "#F5F5F5",
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {analysis.rsi.toFixed(1)}{" "}
                    {analysis.rsi > 70
                      ? "(Sobrecompra)"
                      : analysis.rsi < 30
                        ? "(Sobreventa)"
                        : ""}
                  </Text>
                </View>
                <View
                  style={{
                    height: 4,
                    backgroundColor: "#1A1A1A",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${Math.min(analysis.rsi, 100)}%`,
                      height: "100%",
                      backgroundColor:
                        analysis.rsi > 70
                          ? "#EF4444"
                          : analysis.rsi < 30
                            ? "#4ADE80"
                            : "#F59E0B",
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>

              {/* ATR */}
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#737373", fontSize: 11 }}>ATR</Text>
                <Text style={{ color: "#F5F5F5", fontSize: 13, fontWeight: "600" }}>
                  {formatPriceRaw(analysis.atr)}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ---- 13. TREND & INDICATORS PANEL ---- */}
          <Animated.View
            entering={FadeInDown.delay(190).duration(500)}
            style={{ marginHorizontal: 16, marginBottom: 16 }}
          >
            <Text
              style={{
                color: "#A3A3A3",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              INDICADORES TÉCNICOS
            </Text>
            <View
              style={{
                backgroundColor: "#0F0F0F",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                padding: 14,
                gap: 10,
              }}
            >
              {/* Trend Ribbon badge */}
              <View
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <Text style={{ color: "#737373", fontSize: 12 }}>
                  Cinta de tendencia
                </Text>
                <View
                  style={{
                    backgroundColor: analysis.trendRibbonBullish
                      ? "#4ADE8020"
                      : "#EF444420",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      color: analysis.trendRibbonBullish
                        ? "#4ADE80"
                        : "#EF4444",
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {analysis.trendRibbonBullish ? "ALCISTA" : "BAJISTA"}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: "#141414",
                }}
              />

              {/* EMAs */}
              {[
                { label: "EMA 23", value: analysis.ema23 },
                { label: "EMA 80", value: analysis.ema80 },
                { label: "EMA 200", value: analysis.ema200 },
              ].map((ema) => (
                <View
                  key={ema.label}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor:
                          analysis.currentPrice > ema.value
                            ? "#4ADE80"
                            : "#EF4444",
                      }}
                    />
                    <Text style={{ color: "#737373", fontSize: 12 }}>
                      {ema.label}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: "#F5F5F5", fontSize: 13, fontWeight: "600" }}>
                      {formatPriceRaw(ema.value)}
                    </Text>
                    <Text
                      style={{
                        color:
                          analysis.currentPrice > ema.value
                            ? "#4ADE80"
                            : "#EF4444",
                        fontSize: 10,
                      }}
                    >
                      {analysis.currentPrice > ema.value
                        ? "▲ Por encima"
                        : "▼ Por debajo"}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={{ height: 1, backgroundColor: "#141414" }} />

              {/* RSI Gauge */}
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: "#737373", fontSize: 12 }}>
                    Oscilador RSI
                  </Text>
                  <Text
                    style={{
                      color:
                        analysis.rsi > 70
                          ? "#EF4444"
                          : analysis.rsi < 30
                            ? "#4ADE80"
                            : "#F59E0B",
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    {analysis.rsi.toFixed(1)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: "#141414",
                    borderRadius: 4,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {/* Zone markers */}
                  <View
                    style={{
                      position: "absolute",
                      left: "30%",
                      top: 0,
                      bottom: 0,
                      width: 1,
                      backgroundColor: "#4ADE8040",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: "70%",
                      top: 0,
                      bottom: 0,
                      width: 1,
                      backgroundColor: "#EF444440",
                    }}
                  />
                  <View
                    style={{
                      width: `${analysis.rsi}%`,
                      height: "100%",
                      backgroundColor:
                        analysis.rsi > 70
                          ? "#EF4444"
                          : analysis.rsi < 30
                            ? "#4ADE80"
                            : "#F59E0B",
                      borderRadius: 4,
                    }}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 3,
                  }}
                >
                  <Text style={{ color: "#404040", fontSize: 9 }}>0</Text>
                  <Text style={{ color: "#4ADE8060", fontSize: 9 }}>30</Text>
                  <Text style={{ color: "#EF444460", fontSize: 9 }}>70</Text>
                  <Text style={{ color: "#404040", fontSize: 9 }}>100</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ---- 14. SUPPORT & RESISTANCE ---- */}
          {((analysis.supportLevels?.length ?? 0) > 0 ||
            (analysis.resistanceLevels?.length ?? 0) > 0) ? (
            <Animated.View
              entering={FadeInDown.delay(210).duration(500)}
              style={{ marginHorizontal: 16, marginBottom: 16 }}
            >
              <Text
                style={{
                  color: "#A3A3A3",
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1,
                  marginBottom: 10,
                }}
              >
                SOPORTES Y RESISTENCIAS
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {/* Supports */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#0F0F0F",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#1F1F1F",
                    padding: 12,
                  }}
                >
                  <Text style={{ color: "#4ADE80", fontSize: 10, fontWeight: "700", marginBottom: 10 }}>
                    SOPORTES
                  </Text>
                  {(analysis.supportLevels || []).slice(0, 3).map((lvl, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#4ADE80",
                        }}
                      />
                      <Text style={{ color: "#F5F5F5", fontSize: 13, fontWeight: "600" }}>
                        {formatPriceRaw(lvl)}
                      </Text>
                    </View>
                  ))}
                </View>
                {/* Resistances */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#0F0F0F",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#1F1F1F",
                    padding: 12,
                  }}
                >
                  <Text style={{ color: "#EF4444", fontSize: 10, fontWeight: "700", marginBottom: 10 }}>
                    RESISTENCIAS
                  </Text>
                  {(analysis.resistanceLevels || []).slice(0, 3).map((lvl, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#EF4444",
                        }}
                      />
                      <Text style={{ color: "#F5F5F5", fontSize: 13, fontWeight: "600" }}>
                        {formatPriceRaw(lvl)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* ---- 15. ANALYSIS SUMMARY ---- */}
          {analysis.analysisSummary ? (
            <Animated.View
              entering={FadeInDown.delay(230).duration(500)}
              style={{ marginHorizontal: 16, marginBottom: 16 }}
            >
              <Text
                style={{
                  color: "#A3A3A3",
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1,
                  marginBottom: 10,
                }}
              >
                RESUMEN DEL ANÁLISIS
              </Text>
              <View
                style={{
                  backgroundColor: "#0F0F0F",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#1F1F1F",
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    color: "#D4D4D4",
                    fontSize: 13,
                    lineHeight: 22,
                    marginBottom: 14,
                  }}
                >
                  {analysis.analysisSummary}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: "#141414",
                  }}
                >
                  {analysis.telegramSent ? (
                    <>
                      <CheckCircle size={14} color="#4ADE80" />
                      <Text style={{ color: "#4ADE80", fontSize: 12 }}>
                        Enviado por Telegram
                      </Text>
                    </>
                  ) : (
                    <>
                      <Send size={14} color="#737373" />
                      <Text style={{ color: "#737373", fontSize: 12 }}>
                        Telegram no configurado
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </Animated.View>
          ) : null}
        </>
      ) : null}

      {/* ---- 16. SIGNAL HISTORY ---- */}
      {signalHistory.length > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(260).duration(500)}
          style={{ marginHorizontal: 16, marginBottom: 24 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Activity size={14} color="#A3A3A3" />
            <Text
              style={{
                color: "#A3A3A3",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1,
              }}
            >
              HISTORIAL DE SEÑALES
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#0F0F0F",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#1F1F1F",
              overflow: "hidden",
            }}
            testID="signal-history"
          >
            {signalHistory.slice(0, 8).map((sig, idx) => (
              <View
                key={sig.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 14,
                  borderBottomWidth: idx < signalHistory.length - 1 ? 1 : 0,
                  borderBottomColor: "#141414",
                }}
              >
                {/* Signal badge */}
                <View
                  style={{
                    backgroundColor: signalBg(sig.signal),
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    marginRight: 10,
                  }}
                >
                  <Text
                    style={{
                      color: signalColor(sig.signal),
                      fontSize: 10,
                      fontWeight: "800",
                      letterSpacing: 0.5,
                    }}
                  >
                    {sig.signal}
                  </Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                  >
                    <Text
                      style={{
                        color: "#F5F5F5",
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {sig.symbol}
                    </Text>
                    <Text style={{ color: "#737373", fontSize: 12 }}>
                      ${formatPriceRaw(sig.price)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 2,
                    }}
                  >
                    <Text style={{ color: "#404040", fontSize: 11 }}>
                      {timeAgo(sig.createdAt)}
                    </Text>
                    <Text style={{ color: "#404040", fontSize: 11 }}>·</Text>
                    <Text style={{ color: "#404040", fontSize: 11 }}>
                      {sig.confidenceScore}%
                    </Text>
                    {sig.telegramSent ? (
                      <>
                        <Text style={{ color: "#404040", fontSize: 11 }}>·</Text>
                        <CheckCircle size={11} color="#4ADE80" />
                        <Text style={{ color: "#4ADE80", fontSize: 11 }}>
                          TG
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>

                {/* Timeframe */}
                <View
                  style={{
                    backgroundColor: "#141414",
                    borderRadius: 5,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ color: "#737373", fontSize: 10 }}>
                    {sig.timeframe}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}

      {/* Bottom padding */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
