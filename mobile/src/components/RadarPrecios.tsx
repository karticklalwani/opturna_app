import React from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useTheme } from "@/lib/theme";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react-native";

// ─── Types ───────────────────────────────────────────────────────────────────

type Trend = "up" | "down" | "stable";
type Severity = "critical" | "high" | "medium" | "low";

interface PriceCategory {
  name: string;
  icon: string;
  current: number;
  previous: number;
  change: number;
  trend: Trend;
  severity: Severity;
}

interface RadarSummary {
  averageChange: number;
  highestCategory: string;
  lowestCategory: string;
}

interface RadarPreciosData {
  categories: PriceCategory[];
  alerts: string[];
  summary: RadarSummary;
  lastUpdated: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function severityColor(
  severity: Severity,
  errorColor: string,
  successColor: string
): string {
  switch (severity) {
    case "critical":
      return errorColor;
    case "high":
      return "#FF8C00";
    case "medium":
      return "#FFD60A";
    case "low":
      return successColor;
  }
}

function severityBg(severity: Severity, errorColor: string, successColor: string): string {
  return `${severityColor(severity, errorColor, successColor)}14`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RadarPrecios() {
  const { colors } = useTheme();

  const { data, isLoading, isError, refetch } = useQuery<RadarPreciosData>({
    queryKey: ["radar-precios"],
    queryFn: () => api.get<RadarPreciosData>("/api/inflation/radar-precios"),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <View
        testID="radar-precios-loading"
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
          Cargando radar de precios...
        </Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View
        testID="radar-precios-error"
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
          Error cargando radar de precios
        </Text>
        <Pressable
          onPress={() => refetch()}
          testID="radar-precios-retry"
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

  const alerts = data.alerts ?? [];
  const summary = data.summary ?? { averageChange: 0, highestCategory: "—", lowestCategory: "—" };
  const categories = data.categories ?? [];

  return (
    <Animated.View entering={FadeInDown.duration(400)} testID="radar-precios-container">
      {/* Alerts Banner */}
      {alerts.length > 0 ? (
        <View
          style={{
            backgroundColor: `${colors.error}12`,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: `${colors.error}30`,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={16} color={colors.error} />
            <Text style={{ fontSize: 13, color: colors.error, fontWeight: "600" }}>
              Alertas de precios
            </Text>
          </View>
          {alerts.map((alert, i) => (
            <Text key={`alert-${i}`} style={{ fontSize: 12, color: colors.text2, marginBottom: 4, lineHeight: 16 }}>
              {`\u2022 ${alert}`}
            </Text>
          ))}
        </View>
      ) : null}

      {/* Section title */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 11, color: colors.text3, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
          Radar de Precios
        </Text>

        {/* Summary row */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.bg2,
              borderRadius: 10,
              padding: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 10, color: colors.text3, marginBottom: 4 }}>Media</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
              {(summary.averageChange ?? 0) > 0 ? "+" : ""}{(summary.averageChange ?? 0).toFixed(1)}%
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.bg2,
              borderRadius: 10,
              padding: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 10, color: colors.text3, marginBottom: 4 }}>Mayor</Text>
            <Text
              style={{ fontSize: 12, fontWeight: "600", color: colors.error, textAlign: "center" }}
              numberOfLines={1}
            >
              {summary.highestCategory ?? "—"}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.bg2,
              borderRadius: 10,
              padding: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 10, color: colors.text3, marginBottom: 4 }}>Menor</Text>
            <Text
              style={{ fontSize: 12, fontWeight: "600", color: colors.success, textAlign: "center" }}
              numberOfLines={1}
            >
              {summary.lowestCategory ?? "—"}
            </Text>
          </View>
        </View>
      </View>

      {/* Price Cards Grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {categories.map((cat, idx) => {
          const sColor = severityColor(cat.severity, colors.error, colors.success);
          const sBg = severityBg(cat.severity, colors.error, colors.success);
          const TrendIcon =
            cat.trend === "up"
              ? TrendingUp
              : cat.trend === "down"
              ? TrendingDown
              : Minus;
          const trendColor =
            cat.trend === "up"
              ? colors.error
              : cat.trend === "down"
              ? colors.success
              : colors.text3;
          const changeStr =
            (cat.change ?? 0) > 0
              ? `+${(cat.change ?? 0).toFixed(1)}%`
              : `${(cat.change ?? 0).toFixed(1)}%`;

          return (
            <View
              key={`${cat.name}-${idx}`}
              testID={`price-card-${cat.name}`}
              style={{
                width: "47.5%",
                backgroundColor: sBg,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: `${sColor}25`,
              }}
            >
              <Text style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon ?? "📦"}</Text>
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: "600", marginBottom: 4 }} numberOfLines={1}>
                {cat.name}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: sColor, marginBottom: 4 }}>
                {(cat.current ?? 0).toFixed(1)}%
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <TrendIcon size={12} color={trendColor} />
                <Text style={{ fontSize: 11, color: trendColor, fontWeight: "600" }}>
                  {changeStr}
                </Text>
              </View>
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: `${sColor}25`,
                  borderRadius: 5,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 9, color: sColor, fontWeight: "700", textTransform: "uppercase" }}>
                  {cat.severity}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {data.lastUpdated ? (
        <Text style={{ fontSize: 10, color: colors.text4, textAlign: "right", marginTop: 10 }}>
          Actualizado: {data.lastUpdated}
        </Text>
      ) : null}
    </Animated.View>
  );
}
