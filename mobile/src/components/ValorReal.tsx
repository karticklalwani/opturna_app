import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Circle,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingDown,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Home,
  Fuel,
  GraduationCap,
  HeartPulse,
  Truck,
  Globe,
  Flag,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CategoryRate {
  name: string;
  rate: number;
}

interface HistoricalPoint {
  year: number;
  rate: number;
}

interface InflationMetric {
  current: number;
  previous: number;
  trend: string;
}

interface InflationRealTimeData {
  spain: InflationMetric;
  eurozone: InflationMetric;
  world: InflationMetric;
  food: InflationMetric;
  byCategory: { alimentos: number; transporte: number; vivienda: number; energia: number; educacion: number; salud: number };
  countries: Array<{ code: string; name: string; rate: number; flag: string }>;
  historical: Array<{ year: number; spain: number; eurozone: number; world: number }>;
  lastUpdated: string;
}

interface ValorRealProps {
  savings?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) {
    const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return amount < 0 ? `-${formatted}` : formatted;
  }
  return amount.toFixed(2).replace(".", ",");
}

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("alimento") || lower.includes("food"))
    return ShoppingCart;
  if (lower.includes("transport")) return Truck;
  if (lower.includes("vivienda") || lower.includes("housing")) return Home;
  if (lower.includes("energ")) return Fuel;
  if (lower.includes("educac")) return GraduationCap;
  if (lower.includes("salud") || lower.includes("health")) return HeartPulse;
  return DollarSign;
}

// ─── Historical Chart ───────────────────────────────────────────────────────

function HistoricalChart({
  data,
  width,
}: {
  data: HistoricalPoint[];
  width: number;
}) {
  const { colors } = useTheme();
  const chartWidth = width - 32;
  const chartHeight = 180;
  const paddingLeft = 44;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 28;
  const plotW = chartWidth - paddingLeft - paddingRight;
  const plotH = chartHeight - paddingTop - paddingBottom;

  if (!data || data.length < 2) return null;

  const rates = data.map((d) => d.rate);
  const minVal = Math.min(...rates, 0);
  const maxVal = Math.max(...rates);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => paddingLeft + (i / (data.length - 1)) * plotW;
  const toY = (v: number) => paddingTop + plotH - ((v - minVal) / range) * plotH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)},${toY(d.rate)}`)
    .join(" ");

  const fillPath = `${linePath} L ${toX(data.length - 1)},${paddingTop + plotH} L ${toX(0)},${paddingTop + plotH} Z`;

  const zeroY = toY(0);

  return (
    <Svg width={chartWidth} height={chartHeight}>
      <Defs>
        <SvgLinearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4ADE80" stopOpacity="0.2" />
          <Stop offset="1" stopColor="#4ADE80" stopOpacity="0.01" />
        </SvgLinearGradient>
      </Defs>

      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <Line
          key={t}
          x1={paddingLeft}
          y1={paddingTop + plotH * (1 - t)}
          x2={paddingLeft + plotW}
          y2={paddingTop + plotH * (1 - t)}
          stroke={colors.border}
          strokeWidth="0.5"
        />
      ))}

      {minVal < 0 && maxVal > 0 ? (
        <Line
          x1={paddingLeft}
          y1={zeroY}
          x2={paddingLeft + plotW}
          y2={zeroY}
          stroke={colors.text4}
          strokeWidth="1"
          strokeDasharray="4,3"
        />
      ) : null}

      <Path d={fillPath} fill="url(#histGrad)" />
      <Path
        d={linePath}
        fill="none"
        stroke="#4ADE80"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Circle
        cx={toX(data.length - 1)}
        cy={toY(data[data.length - 1].rate)}
        r={4}
        fill="#4ADE80"
        stroke={colors.bg}
        strokeWidth="2"
      />

      {[minVal, minVal + range * 0.5, maxVal].map((v, i) => (
        <SvgText
          key={`ylabel-${v.toFixed(2)}`}
          x={paddingLeft - 4}
          y={toY(v) + 4}
          fill={colors.text3}
          fontSize="9"
          textAnchor="end"
        >
          {v.toFixed(1)}%
        </SvgText>
      ))}

      {data
        .filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0 || i === data.length - 1)
        .map((d, _, arr) => {
          const idx = data.indexOf(d);
          return (
            <SvgText
              key={d.year}
              x={toX(idx)}
              y={chartHeight - 4}
              fill={colors.text3}
              fontSize="8"
              textAnchor="middle"
            >
              {d.year}
            </SvgText>
          );
        })}
    </Svg>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ValorReal({ savings = 5000 }: ValorRealProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<InflationRealTimeData>({
    queryKey: ["inflation-realtime"],
    queryFn: () => api.get<InflationRealTimeData>("/api/inflation/real-time"),
  });

  const rawRate = Number(data?.spain?.current ?? 0);
  const spainRate = Math.abs(rawRate) > 50 ? 3.4 : rawRate; // fallback if unrealistic
  const realValue = savings / (1 + spainRate / 100);
  const inflationLoss = savings - realValue;

  if (isLoading) {
    return (
      <View
        testID="valor-real-loading"
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
        }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ color: colors.text3, marginTop: 12, fontSize: 13 }}>
          Cargando datos de inflacion...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        testID="valor-real-error"
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.error, fontSize: 14, fontWeight: "600" }}>
          Error al cargar datos
        </Text>
        <Pressable
          testID="valor-real-retry"
          onPress={() => refetch()}
          style={{
            marginTop: 12,
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: colors.accent,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: colors.bg, fontWeight: "700", fontSize: 13 }}>
            Reintentar
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View testID="valor-real-container" style={{ gap: 12 }}>
      {/* Main Value Card */}
      <Animated.View entering={FadeInDown.duration(400).delay(0)}>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: `${colors.accent}15`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DollarSign size={18} color={colors.accent} />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: "700",
                  letterSpacing: -0.3,
                }}
              >
                Valor Real del Dinero
              </Text>
            </View>
            <Pressable
              testID="valor-real-refresh"
              onPress={() => refetch()}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: colors.bg3,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RefreshCw
                size={14}
                color={isFetching ? colors.accent : colors.text3}
              />
            </Pressable>
          </View>

          {/* Savings & Real Value */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Tus Ahorros
              </Text>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>
                {formatCurrency(savings)}€
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Valor Real
              </Text>
              <Text style={{ color: colors.accent, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>
                {formatCurrency(realValue)}€
              </Text>
            </View>
          </View>

          {/* Inflation Loss */}
          <View
            style={{
              backgroundColor: `${colors.error}12`,
              borderRadius: 14,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TrendingDown size={20} color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text3, fontSize: 11 }}>
                Perdida por inflacion
              </Text>
              <Text style={{ color: colors.error, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
                -{formatCurrency(inflationLoss)}€
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Inflation Rates Card */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 14,
              fontWeight: "700",
              marginBottom: 16,
              letterSpacing: -0.2,
            }}
          >
            Tasas de Inflacion
          </Text>

          <View style={{ gap: 12 }}>
            {/* Spain */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.bg3,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 22 }}>🇪🇸</Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                  Espana
                </Text>
              </View>
              <Text
                style={{
                  color: spainRate > 3 ? colors.error : colors.accent,
                  fontSize: 20,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                }}
              >
                {spainRate.toFixed(1)}%
              </Text>
            </View>

            {/* Eurozone */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.bg3,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 22 }}>🇪🇺</Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                  Eurozona
                </Text>
              </View>
              <Text
                style={{
                  color: Number(data?.eurozone?.current ?? 0) > 3 ? colors.error : colors.accent,
                  fontSize: 20,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                }}
              >
                {Number(data?.eurozone?.current ?? 0).toFixed(1)}%
              </Text>
            </View>

            {/* World */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.bg3,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Globe size={22} color={colors.text2} />
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                  Mundial
                </Text>
              </View>
              <Text
                style={{
                  color: Number(data?.world?.current ?? 0) > 5 ? colors.error : "#FFD60A",
                  fontSize: 20,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                }}
              >
                {Number(data?.world?.current ?? 0).toFixed(1)}%
              </Text>
            </View>

            {/* Food */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.bg3,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ShoppingCart size={22} color={colors.text2} />
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                  Alimentacion
                </Text>
              </View>
              <Text
                style={{
                  color: Number(data?.food?.current ?? 0) > 5 ? colors.error : "#FFD60A",
                  fontSize: 20,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                }}
              >
                {Number(data?.food?.current ?? 0).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Category Breakdown */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 14,
              fontWeight: "700",
              marginBottom: 16,
              letterSpacing: -0.2,
            }}
          >
            Desglose por Categoria
          </Text>

          <View style={{ gap: 14 }}>
            {(() => {
              const categoryArray: CategoryRate[] = data?.byCategory
                ? Object.entries(data.byCategory).map(([name, rate]) => ({ name, rate }))
                : [];
              const maxRate = Math.max(...categoryArray.map((c) => Math.abs(c.rate)), 1);
              return categoryArray.map((cat, idx) => {
                const barWidth = (Math.abs(cat.rate) / maxRate) * 100;
              const barColor =
                cat.rate > 5
                  ? colors.error
                  : cat.rate > 3
                  ? "#FFD60A"
                  : colors.accent;
              const Icon = getCategoryIcon(cat.name);

              return (
                <View key={`cat-${cat.name}`} style={{ gap: 6 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Icon size={14} color={colors.text3} />
                      <Text
                        style={{
                          color: colors.text2,
                          fontSize: 12,
                          fontWeight: "500",
                          textTransform: "capitalize",
                        }}
                      >
                        {cat.name}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: barColor,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {cat.rate.toFixed(1)}%
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.bg3,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 6,
                        width: `${barWidth}%`,
                        backgroundColor: barColor,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </View>
              );
              });
            })()}
          </View>
        </View>
      </Animated.View>

      {/* Historical Chart */}
      {(data?.historical?.length ?? 0) > 0 ? (
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 14,
                fontWeight: "700",
                marginBottom: 4,
                letterSpacing: -0.2,
              }}
            >
              Historico de Inflacion (Espana)
            </Text>
            <Text
              style={{
                color: colors.text3,
                fontSize: 11,
                marginBottom: 12,
              }}
            >
              Ultimos 10 anos
            </Text>

            <HistoricalChart data={(data?.historical ?? []).map((h) => ({ year: h.year, rate: h.spain }))} width={width - 32} />
          </View>
        </Animated.View>
      ) : null}

      {/* Last Updated */}
      {data?.lastUpdated ? (
        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 8,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: isFetching ? "#FFD60A" : colors.accent,
              }}
            />
            <Text style={{ color: colors.text4, fontSize: 11 }}>
              {isFetching
                ? "Actualizando..."
                : `Actualizado: ${data.lastUpdated}`}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
