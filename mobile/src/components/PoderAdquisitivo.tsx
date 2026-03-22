import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useTheme } from "@/lib/theme";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  Text as SvgText,
  Circle,
} from "react-native-svg";
import { TrendingDown, TrendingUp, Minus, RefreshCw } from "lucide-react-native";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HistoricalPoint {
  year: number;
  power: number;
  inflation: number;
}

interface CategoryImpact {
  name: string;
  rate: number;
  impact: "alto" | "medio" | "bajo";
}

interface PoderAdquisitivoData {
  currentPower: number;
  yearAgoPower: number;
  change: number;
  changePercent: number;
  historical: HistoricalPoint[];
  byCategory: CategoryImpact[];
  spainRate: number;
  eurozoneRate: number;
  worldRate: number;
  lastUpdated: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildLinePath(
  points: HistoricalPoint[],
  width: number,
  height: number,
  padding: number
): string {
  if (points.length === 0) return "";
  const minPower = Math.min(...points.map((p) => p.power)) - 2;
  const maxPower = Math.max(...points.map((p) => p.power)) + 2;
  const w = width - padding * 2;
  const h = height - padding * 2;

  return points
    .map((pt, i) => {
      const x = padding + (i / (points.length - 1)) * w;
      const y = padding + h - ((pt.power - minPower) / (maxPower - minPower)) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildAreaPath(
  points: HistoricalPoint[],
  width: number,
  height: number,
  padding: number
): string {
  if (points.length === 0) return "";
  const line = buildLinePath(points, width, height, padding);
  const lastX = (padding + (width - padding * 2)).toFixed(1);
  const firstX = padding.toFixed(1);
  const bottom = (height - padding + 8).toFixed(1);
  return `${line} L${lastX},${bottom} L${firstX},${bottom} Z`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PoderAdquisitivo() {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 64;
  const chartHeight = 160;
  const padding = 24;

  const { data, isLoading, isError, refetch } = useQuery<PoderAdquisitivoData>({
    queryKey: ["poder-adquisitivo"],
    queryFn: () => api.get<PoderAdquisitivoData>("/api/inflation/poder-adquisitivo"),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <View
        testID="poder-adquisitivo-loading"
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 24,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <ActivityIndicator color={colors.accent} />
        <Text style={{ color: colors.text3, marginTop: 8, fontSize: 13 }}>
          Cargando datos...
        </Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View
        testID="poder-adquisitivo-error"
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 24,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.error, fontSize: 14, marginBottom: 12 }}>
          Error cargando poder adquisitivo
        </Text>
        <Pressable
          onPress={() => refetch()}
          testID="poder-adquisitivo-retry"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: `${colors.accent}20`,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <RefreshCw size={14} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 13 }}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const changeIsNegative = (data.change ?? 0) < 0;
  const ChangeIcon = changeIsNegative ? TrendingDown : changeIsNegative === false && (data.change ?? 0) > 0 ? TrendingUp : Minus;
  const changeColor = changeIsNegative ? colors.error : colors.success;

  const impactColor = (impact: string) => {
    if (impact === "alto") return colors.error;
    if (impact === "medio") return "#FFD60A";
    return colors.success;
  };

  const maxRate = Math.max(...(data.byCategory ?? []).map((c) => Math.abs(c.rate)), 1);

  const linePath = buildLinePath(data.historical ?? [], chartWidth, chartHeight, padding);
  const areaPath = buildAreaPath(data.historical ?? [], chartWidth, chartHeight, padding);

  const historical = data.historical ?? [];
  const firstPoint = historical[0];
  const lastPoint = historical[historical.length - 1];
  const minPower = historical.length > 0 ? Math.min(...historical.map((p) => p.power)) - 2 : 0;
  const maxPower = historical.length > 0 ? Math.max(...historical.map((p) => p.power)) + 2 : 100;
  const w = chartWidth - padding * 2;
  const h = chartHeight - padding * 2;

  const firstX = padding;
  const firstY = historical.length > 0
    ? padding + h - ((firstPoint.power - minPower) / (maxPower - minPower)) * h
    : chartHeight / 2;
  const lastX = padding + w;
  const lastY = historical.length > 0
    ? padding + h - ((lastPoint.power - minPower) / (maxPower - minPower)) * h
    : chartHeight / 2;

  return (
    <Animated.View entering={FadeInDown.duration(400)} testID="poder-adquisitivo-container">
      {/* Hero Card */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 11, color: colors.text3, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
          Poder Adquisitivo
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 8 }}>
          <Text style={{ fontSize: 48, fontWeight: "800", color: colors.text, letterSpacing: -1 }}>
            {(data.currentPower ?? 0).toFixed(1)}
            <Text style={{ fontSize: 28, color: colors.text2 }}>%</Text>
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 }}>
            <ChangeIcon size={16} color={changeColor} />
            <Text style={{ color: changeColor, fontSize: 14, fontWeight: "600" }}>
              {changeIsNegative ? "" : "+"}{(data.change ?? 0).toFixed(1)}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: colors.text3 }}>Base 100 = 2020</Text>
      </View>

      {/* Comparison Row */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {[
          { label: "España", value: data.spainRate ?? 0, color: colors.error },
          { label: "Eurozona", value: data.eurozoneRate ?? 0, color: "#FF8C00" },
          { label: "Mundial", value: data.worldRate ?? 0, color: "#FFD60A" },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: item.color,
                marginBottom: 6,
              }}
            />
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
              {item.value.toFixed(1)}%
            </Text>
            <Text style={{ fontSize: 10, color: colors.text3, marginTop: 2 }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Line Chart */}
      {historical.length > 1 ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.text3, marginBottom: 12, letterSpacing: 0.5 }}>
            Evolución histórica
          </Text>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <SvgLinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.accent} stopOpacity="0.3" />
                <Stop offset="1" stopColor={colors.accent} stopOpacity="0.02" />
              </SvgLinearGradient>
            </Defs>
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((frac, i) => (
              <Line
                key={`grid-${i}`}
                x1={padding}
                y1={padding + h * frac}
                x2={padding + w}
                y2={padding + h * frac}
                stroke={colors.border}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            ))}
            {/* Area fill */}
            <Path d={areaPath} fill="url(#areaGrad)" />
            {/* Line */}
            <Path
              d={linePath}
              stroke={colors.accent}
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* First point label */}
            <Circle cx={firstX} cy={firstY} r="4" fill={colors.accent} />
            <SvgText
              x={firstX + 6}
              y={firstY - 6}
              fontSize="10"
              fill={colors.text3}
            >
              {firstPoint?.year}
            </SvgText>
            {/* Last point dot + label */}
            <Circle cx={lastX} cy={lastY} r="4" fill={colors.accent} />
            <SvgText
              x={lastX - 32}
              y={lastY - 6}
              fontSize="10"
              fill={colors.text}
              fontWeight="600"
            >
              {lastPoint?.power?.toFixed(1)}%
            </SvgText>
          </Svg>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
            <Text style={{ fontSize: 10, color: colors.text3 }}>{firstPoint?.year}</Text>
            <Text style={{ fontSize: 10, color: colors.text3 }}>{lastPoint?.year}</Text>
          </View>
        </View>
      ) : null}

      {/* Category Impact */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 12, color: colors.text3, marginBottom: 12, letterSpacing: 0.5 }}>
          Impacto por categoría
        </Text>
        {(data.byCategory ?? []).map((cat, idx) => {
          const barWidth = (Math.abs(cat.rate) / maxRate) * 100;
          const color = impactColor(cat.impact);
          return (
            <View key={`${cat.name}-${idx}`} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <Text style={{ fontSize: 13, color: colors.text, fontWeight: "500" }}>
                  {cat.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.text2 }}>
                    {cat.rate.toFixed(1)}%
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: `${color}20`,
                    }}
                  >
                    <Text style={{ fontSize: 10, color, fontWeight: "600", textTransform: "uppercase" }}>
                      {cat.impact}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={{
                  height: 4,
                  backgroundColor: `${color}20`,
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 4,
                    width: `${barWidth}%`,
                    backgroundColor: color,
                    borderRadius: 2,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>

      {data.lastUpdated ? (
        <Text style={{ fontSize: 10, color: colors.text4, textAlign: "right", marginTop: 8 }}>
          Actualizado: {data.lastUpdated}
        </Text>
      ) : null}
    </Animated.View>
  );
}
