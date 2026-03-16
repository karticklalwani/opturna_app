import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Circle,
  Polygon,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import { useMutation } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Target,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type SignalType = "BUY" | "SELL" | "EXIT" | "HOLD";

interface PricePoint {
  time: string;
  price: number;
}

interface RecentSignal {
  time: string;
  signal: "BUY" | "SELL" | "EXIT";
  price: number;
}

interface AnalysisResult {
  asset: string;
  currentPrice: number;
  signal: SignalType;
  confidence: number;
  estimatedGain: number;
  estimatedLoss: number;
  riskRewardRatio: number;
  movementPercent: number;
  stopLoss: number;
  takeProfit: number;
  priceHistory: PricePoint[];
  recentSignals: RecentSignal[];
  summary: string;
  analysisId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSETS = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿" },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ" },
  { symbol: "SOL", name: "Solana", icon: "◎" },
  { symbol: "BNB", name: "BNB", icon: "B" },
  { symbol: "AAPL", name: "Apple", icon: "A" },
  { symbol: "NVDA", name: "NVIDIA", icon: "N" },
  { symbol: "TSLA", name: "Tesla", icon: "T" },
  { symbol: "SPY", name: "S&P 500", icon: "S" },
  { symbol: "GLD", name: "Gold", icon: "G" },
];

const SIGNAL_COLORS: Record<SignalType, string> = {
  BUY: "#4ADE80",
  SELL: "#EF4444",
  EXIT: "#F59E0B",
  HOLD: "#737373",
};

const SIGNAL_LABELS: Record<SignalType, string> = {
  BUY: "COMPRAR",
  SELL: "VENDER",
  EXIT: "SALIR",
  HOLD: "MANTENER",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(v: number): string {
  if (v >= 1000) {
    return v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return v.toFixed(2);
}

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) {
    const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return amount < 0 ? `-${formatted}` : formatted;
  }
  return amount.toFixed(2).replace(".", ",");
}

// ─── Price Chart ──────────────────────────────────────────────────────────────

function PriceChart({
  priceHistory,
  recentSignals,
  width,
}: {
  priceHistory: PricePoint[];
  recentSignals: RecentSignal[];
  width: number;
}) {
  const chartWidth = width - 40;
  const chartHeight = 180;
  const paddingLeft = 52;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 28;
  const plotW = chartWidth - paddingLeft - paddingRight;
  const plotH = chartHeight - paddingTop - paddingBottom;

  if (!priceHistory || priceHistory.length === 0) return null;

  const prices = priceHistory.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const toX = (i: number) => paddingLeft + (i / (priceHistory.length - 1)) * plotW;
  const toY = (v: number) => paddingTop + plotH - ((v - minPrice) / range) * plotH;

  const linePath = priceHistory
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)},${toY(p.price)}`)
    .join(" ");

  const fillPath =
    linePath +
    ` L ${toX(priceHistory.length - 1)},${paddingTop + plotH} L ${toX(0)},${paddingTop + plotH} Z`;

  const yLabels = [minPrice, minPrice + range * 0.5, maxPrice];

  // Map recent signals onto price history by index
  const signalOverlays = recentSignals
    .map((sig) => {
      const matchIdx = priceHistory.findIndex(
        (p) => p.time === sig.time || Math.abs(p.price - sig.price) < 0.01
      );
      const idx = matchIdx >= 0 ? matchIdx : -1;
      return { ...sig, idx };
    })
    .filter((s) => s.idx >= 0);

  return (
    <Svg width={chartWidth} height={chartHeight}>
      <Defs>
        <SvgLinearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#60A5FA" stopOpacity="0.2" />
          <Stop offset="1" stopColor="#60A5FA" stopOpacity="0.01" />
        </SvgLinearGradient>
      </Defs>

      {/* Grid */}
      {[0, 0.5, 1].map((t) => (
        <Line
          key={t}
          x1={paddingLeft}
          y1={paddingTop + plotH * (1 - t)}
          x2={paddingLeft + plotW}
          y2={paddingTop + plotH * (1 - t)}
          stroke="#1A1A1A"
          strokeWidth="1"
        />
      ))}

      {/* Price fill */}
      <Path d={fillPath} fill="url(#priceGrad)" />

      {/* Price line */}
      <Path
        d={linePath}
        fill="none"
        stroke="#60A5FA"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Signal markers */}
      {signalOverlays.map((sig, i) => {
        const x = toX(sig.idx);
        const y = toY(sig.price);
        const isBuy = sig.signal === "BUY";
        const color = isBuy ? "#4ADE80" : "#EF4444";
        if (isBuy) {
          // Upward triangle
          return (
            <Polygon
              key={i}
              points={`${x},${y - 12} ${x - 6},${y} ${x + 6},${y}`}
              fill={color}
              opacity={0.9}
            />
          );
        }
        // Downward triangle
        return (
          <Polygon
            key={i}
            points={`${x},${y + 12} ${x - 6},${y} ${x + 6},${y}`}
            fill={color}
            opacity={0.9}
          />
        );
      })}

      {/* Last price dot */}
      <Circle
        cx={toX(priceHistory.length - 1)}
        cy={toY(priceHistory[priceHistory.length - 1].price)}
        r={4}
        fill="#60A5FA"
        stroke="#080808"
        strokeWidth="2"
      />

      {/* Y labels */}
      {yLabels.map((v, i) => (
        <SvgText
          key={i}
          x={paddingLeft - 4}
          y={toY(v) + 4}
          fill="#737373"
          fontSize="9"
          textAnchor="end"
        >
          {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
        </SvgText>
      ))}

      {/* X labels: first, mid, last */}
      {[0, Math.floor(priceHistory.length / 2), priceHistory.length - 1].map(
        (idx) => (
          <SvgText
            key={idx}
            x={toX(idx)}
            y={chartHeight - 4}
            fill="#737373"
            fontSize="9"
            textAnchor="middle"
          >
            {priceHistory[idx]?.time?.slice(-5) ?? ""}
          </SvgText>
        )
      )}

      {/* Axes */}
      <Line
        x1={paddingLeft}
        y1={paddingTop}
        x2={paddingLeft}
        y2={paddingTop + plotH}
        stroke="#1F1F1F"
        strokeWidth="1"
      />
      <Line
        x1={paddingLeft}
        y1={paddingTop + plotH}
        x2={paddingLeft + plotW}
        y2={paddingTop + plotH}
        stroke="#1F1F1F"
        strokeWidth="1"
      />
    </Svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InvestmentAnalysisTool() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const [selectedAsset, setSelectedAsset] = useState<string>("BTC");
  const [customAsset, setCustomAsset] = useState<string>("");
  const [amount, setAmount] = useState<string>("1000");

  const activeAsset = customAsset.trim().toUpperCase() || selectedAsset;

  const { mutate: analyze, data: result, isPending, error } = useMutation<AnalysisResult>({
    mutationFn: () =>
      api.post<AnalysisResult>("/api/finance/investment-analysis", {
        asset: activeAsset,
        amount: parseFloat(amount) || 1000,
        analysisType: "intraday",
      }),
  });

  const signalColor = result ? SIGNAL_COLORS[result.signal] : colors.text3;

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Asset selector */}
      <Animated.View entering={FadeInDown.duration(300).springify()}>
        <View
          style={{
            backgroundColor: "#0F0F0F",
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: "#1F1F1F",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#60A5FA",
              }}
            />
            <Text
              style={{
                color: colors.text,
                fontSize: 14,
                fontWeight: "700",
                letterSpacing: -0.2,
              }}
            >
              Seleccionar Activo
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginBottom: 14 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {ASSETS.map((asset) => {
              const isActive = selectedAsset === asset.symbol && !customAsset.trim();
              return (
                <Pressable
                  key={asset.symbol}
                  onPress={() => {
                    setSelectedAsset(asset.symbol);
                    setCustomAsset("");
                  }}
                  testID={`asset-${asset.symbol}`}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 14,
                    alignItems: "center",
                    backgroundColor: isActive ? `${"#60A5FA"}18` : "#141414",
                    borderWidth: 1,
                    borderColor: isActive ? "#60A5FA" : "#1F1F1F",
                    minWidth: 64,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? "#60A5FA" : colors.text3,
                      fontSize: 16,
                      fontWeight: "800",
                      marginBottom: 2,
                    }}
                  >
                    {asset.icon}
                  </Text>
                  <Text
                    style={{
                      color: isActive ? "#60A5FA" : colors.text3,
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {asset.symbol}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Custom asset input */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            O INTRODUCE UN SÍMBOLO PERSONALIZADO
          </Text>
          <TextInput
            value={customAsset}
            onChangeText={(v) => setCustomAsset(v.toUpperCase())}
            placeholder="Ej: MSFT, AMZN, XRP..."
            placeholderTextColor={colors.text4}
            autoCapitalize="characters"
            testID="custom-asset-input"
            style={{
              backgroundColor: "#141414",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.text,
              fontSize: 15,
              fontWeight: "700",
              borderWidth: 1,
              borderColor: customAsset.trim() ? "#60A5FA" : "#1F1F1F",
              marginBottom: 14,
            }}
          />

          {/* Amount input */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            IMPORTE A INVERTIR (€)
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="1000"
            placeholderTextColor={colors.text4}
            keyboardType="decimal-pad"
            testID="investment-amount-input"
            style={{
              backgroundColor: "#141414",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.accent,
              fontSize: 15,
              fontWeight: "700",
              borderWidth: 1,
              borderColor: "#1F1F1F",
              marginBottom: 16,
            }}
          />

          {/* Analyze button */}
          <Pressable
            onPress={() => analyze()}
            disabled={isPending}
            testID="analyze-button"
            style={{
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: isPending ? `${"#60A5FA"}40` : "#60A5FA",
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Activity size={16} color="#000" />
            )}
            <Text
              style={{
                color: "#000",
                fontSize: 15,
                fontWeight: "800",
                letterSpacing: -0.2,
              }}
            >
              {isPending ? "Analizando..." : `Analizar ${activeAsset}`}
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Error state */}
      {error ? (
        <View
          style={{
            backgroundColor: `${colors.error}10`,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: `${colors.error}30`,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: colors.error, fontSize: 13, fontWeight: "600" }}>
            Error al analizar. Intenta de nuevo.
          </Text>
        </View>
      ) : null}

      {/* Results */}
      {result ? (
        <Animated.View entering={FadeInDown.duration(350).springify()}>
          {/* Signal badge */}
          <View
            style={{
              backgroundColor: "#0F0F0F",
              borderRadius: 20,
              padding: 20,
              borderWidth: 2,
              borderColor: `${signalColor}50`,
              marginBottom: 12,
              alignItems: "center",
            }}
          >
            {/* Asset + price row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                marginBottom: 16,
              }}
            >
              <View>
                <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "600", letterSpacing: 0.5 }}>
                  ACTIVO
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 22,
                    fontWeight: "800",
                    letterSpacing: -0.5,
                  }}
                >
                  {result.asset}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "600", letterSpacing: 0.5 }}>
                  PRECIO ACTUAL
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 22,
                    fontWeight: "800",
                    letterSpacing: -0.5,
                  }}
                >
                  ${formatPrice(result.currentPrice)}
                </Text>
              </View>
            </View>

            {/* Large signal badge */}
            <View
              style={{
                backgroundColor: `${signalColor}18`,
                borderRadius: 20,
                paddingHorizontal: 36,
                paddingVertical: 16,
                borderWidth: 1.5,
                borderColor: `${signalColor}50`,
                marginBottom: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: signalColor,
                  fontSize: 32,
                  fontWeight: "900",
                  letterSpacing: 4,
                }}
              >
                {SIGNAL_LABELS[result.signal]}
              </Text>
              <Text
                style={{
                  color: `${signalColor}90`,
                  fontSize: 12,
                  fontWeight: "600",
                  marginTop: 2,
                  letterSpacing: 0.5,
                }}
              >
                {result.signal} · INTRADAY
              </Text>
            </View>

            {/* Confidence bar */}
            <View style={{ width: "100%" }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "600", letterSpacing: 0.5 }}>
                  CONFIANZA
                </Text>
                <Text style={{ color: signalColor, fontSize: 12, fontWeight: "700" }}>
                  {result.confidence.toFixed(0)}%
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#1A1A1A",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 8,
                    borderRadius: 4,
                    width: `${Math.min(100, result.confidence)}%`,
                    backgroundColor: signalColor,
                  }}
                />
              </View>
            </View>
          </View>

          {/* 4 stat cards */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {[
              {
                label: "Ganancia Estimada",
                value: `+${formatCurrency(result.estimatedGain)} €`,
                color: colors.accent,
                icon: <TrendingUp size={14} color={colors.accent} />,
              },
              {
                label: "Pérdida Estimada",
                value: `-${formatCurrency(result.estimatedLoss)} €`,
                color: colors.error,
                icon: <TrendingDown size={14} color={colors.error} />,
              },
              {
                label: "Relación R/B",
                value: `${result.riskRewardRatio.toFixed(2)}x`,
                color: "#60A5FA",
                icon: <Activity size={14} color="#60A5FA" />,
              },
              {
                label: "Movimiento %",
                value: `${result.movementPercent >= 0 ? "+" : ""}${result.movementPercent.toFixed(2)}%`,
                color:
                  result.movementPercent >= 0 ? colors.accent : colors.error,
                icon:
                  result.movementPercent >= 0 ? (
                    <TrendingUp size={14} color={colors.accent} />
                  ) : (
                    <TrendingDown size={14} color={colors.error} />
                  ),
              },
            ].map((card) => (
              <View
                key={card.label}
                style={{
                  width: "47.5%",
                  backgroundColor: "#0F0F0F",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: `${card.color}25`,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 8,
                  }}
                >
                  {card.icon}
                  <Text
                    style={{
                      color: colors.text3,
                      fontSize: 10,
                      fontWeight: "600",
                      letterSpacing: 0.3,
                      flex: 1,
                    }}
                  >
                    {card.label.toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={{
                    color: card.color,
                    fontSize: 15,
                    fontWeight: "800",
                    letterSpacing: -0.5,
                  }}
                >
                  {card.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Stop loss / Take profit */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: `${colors.error}08`,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: `${colors.error}25`,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <ShieldAlert size={14} color={colors.error} />
                <Text
                  style={{
                    color: colors.text3,
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 0.4,
                  }}
                >
                  STOP LOSS
                </Text>
              </View>
              <Text
                style={{
                  color: colors.error,
                  fontSize: 16,
                  fontWeight: "800",
                  letterSpacing: -0.4,
                }}
              >
                ${formatPrice(result.stopLoss)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: `${colors.accent}08`,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: `${colors.accent}25`,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <Target size={14} color={colors.accent} />
                <Text
                  style={{
                    color: colors.text3,
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 0.4,
                  }}
                >
                  TAKE PROFIT
                </Text>
              </View>
              <Text
                style={{
                  color: colors.accent,
                  fontSize: 16,
                  fontWeight: "800",
                  letterSpacing: -0.4,
                }}
              >
                ${formatPrice(result.takeProfit)}
              </Text>
            </View>
          </View>

          {/* Price history chart */}
          {result.priceHistory && result.priceHistory.length > 0 ? (
            <View
              style={{
                backgroundColor: "#0F0F0F",
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  Historial de Precio
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#4ADE80",
                      }}
                    />
                    <Text style={{ color: colors.text3, fontSize: 10 }}>Compra</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#EF4444",
                      }}
                    />
                    <Text style={{ color: colors.text3, fontSize: 10 }}>Venta</Text>
                  </View>
                </View>
              </View>
              <PriceChart
                priceHistory={result.priceHistory}
                recentSignals={result.recentSignals}
                width={width - 40}
              />
            </View>
          ) : null}

          {/* Summary */}
          {result.summary ? (
            <View
              style={{
                backgroundColor: "#0F0F0F",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                RESUMEN DEL ANÁLISIS
              </Text>
              <Text
                style={{
                  color: colors.text2,
                  fontSize: 13,
                  lineHeight: 20,
                }}
              >
                {result.summary}
              </Text>
            </View>
          ) : null}

          {/* Signal history */}
          {result.recentSignals && result.recentSignals.length > 0 ? (
            <View
              style={{
                backgroundColor: "#0F0F0F",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                SEÑALES RECIENTES
              </Text>
              {result.recentSignals.map((sig, i) => {
                const sigColor = SIGNAL_COLORS[sig.signal];
                return (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                      borderBottomWidth: i < result.recentSignals.length - 1 ? 1 : 0,
                      borderBottomColor: "#1A1A1A",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: `${sigColor}18`,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: `${sigColor}40`,
                      }}
                    >
                      <Text
                        style={{
                          color: sigColor,
                          fontSize: 11,
                          fontWeight: "800",
                          letterSpacing: 1,
                        }}
                      >
                        {sig.signal}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, color: colors.text3, fontSize: 12 }}>
                      {sig.time}
                    </Text>
                    <Text
                      style={{
                        color: colors.text2,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      ${formatPrice(sig.price)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </Animated.View>
      ) : null}

      {/* Disclaimer */}
      <View
        style={{
          backgroundColor: `${"#F59E0B"}08`,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: `${"#F59E0B"}20`,
          flexDirection: "row",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <AlertTriangle size={14} color="#F59E0B" style={{ marginTop: 1 }} />
        <Text
          style={{
            flex: 1,
            color: colors.text3,
            fontSize: 11,
            lineHeight: 16,
          }}
        >
          Esta herramienta es solo para análisis educativo y estimación. No constituye asesoramiento financiero.
        </Text>
      </View>
    </View>
  );
}
