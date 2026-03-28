import React from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Svg, { Circle } from "react-native-svg";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IndexScore {
  score: number;
  level: string;
  trend: "up" | "down" | "stable";
  description: string;
  tip: string;
}

interface IndicesData {
  indices: {
    estabilidad: IndexScore;
    riesgo: IndexScore;
    progreso: IndexScore;
    disciplina: IndexScore;
    ahorro: IndexScore;
    saludEconomica: IndexScore;
  };
  summary: {
    overallScore: number;
    topStrength: string;
    topWeakness: string;
  };
  lastUpdated: string;
}

interface Props {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score <= 30) return "#EF4444";
  if (score <= 50) return "#F97316";
  if (score <= 70) return "#FFD60A";
  if (score <= 85) return "#4ADE80";
  return "#00E5FF";
}

function IndexNameLabel(key: string): string {
  const labels: Record<string, string> = {
    estabilidad: "Estabilidad",
    riesgo: "Riesgo",
    progreso: "Progreso",
    disciplina: "Disciplina",
    ahorro: "Ahorro",
    saludEconomica: "Salud Eco.",
  };
  return labels[key] ?? key;
}

// ─── Circular gauge ──────────────────────────────────────────────────────────

function CircularGauge({ score, color }: { score: number; color: string }) {
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 130, height: 130 }}>
      <Svg width={130} height={130} viewBox="0 0 130 130">
        {/* Track */}
        <Circle
          cx={65}
          cy={65}
          r={radius}
          stroke="#1F1F1F"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={65}
          cy={65}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${filled} ${circumference}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>
          {Math.round(score)}
        </Text>
        <Text style={{ color: "#737373", fontSize: 9, fontWeight: "600", marginTop: -2 }}>
          / 100
        </Text>
      </View>
    </View>
  );
}

// ─── Index Card ──────────────────────────────────────────────────────────────

function IndexCard({ name, data }: { name: string; data: IndexScore }) {
  const { colors } = useTheme();
  const scoreColor = getScoreColor(data.score);
  const TrendIcon = data.trend === "up" ? TrendingUp : data.trend === "down" ? TrendingDown : Minus;
  const trendColor = data.trend === "up" ? "#4ADE80" : data.trend === "down" ? "#EF4444" : colors.text3;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: `${scoreColor}20`,
        padding: 14,
        gap: 8,
      }}
    >
      {/* Name + trend */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 }}>
          {name}
        </Text>
        <TrendIcon size={12} color={trendColor} />
      </View>

      {/* Score */}
      <Text style={{ color: scoreColor, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>
        {Math.round(data.score)}
      </Text>

      {/* Progress bar */}
      <View
        style={{
          height: 4,
          backgroundColor: `${scoreColor}20`,
          borderRadius: 100,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${Math.min(100, data.score)}%`,
            height: 4,
            backgroundColor: scoreColor,
            borderRadius: 100,
          }}
        />
      </View>

      {/* Level badge */}
      <View
        style={{
          backgroundColor: `${scoreColor}15`,
          borderRadius: 100,
          paddingHorizontal: 8,
          paddingVertical: 3,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ color: scoreColor, fontSize: 10, fontWeight: "700" }}>
          {data.level}
        </Text>
      </View>

      {/* Tip */}
      <Text style={{ color: colors.text3, fontSize: 10, lineHeight: 14 }} numberOfLines={2}>
        {data.tip}
      </Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IndicesInteligentes({ income, expenses, savings, investments }: Props) {
  const { colors } = useTheme();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["indices", income, expenses, savings, investments],
    queryFn: () =>
      api.post<IndicesData>("/api/advanced/indices", {
        income,
        expenses,
        savings,
        investments,
        debt: 0,
        habitsCompletionRate: 50,
        goalsCompletionRate: 50,
        personalInflation: 3.4,
      }),
    enabled: income > 0 || expenses > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <View
        testID="indices-loading"
        style={{
          backgroundColor: colors.card,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 32,
          alignItems: "center",
          gap: 12,
        }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ color: colors.text3, fontSize: 13 }}>
          Calculando índices financieros...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View
        testID="indices-error"
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#EF444430",
          padding: 24,
          alignItems: "center",
          gap: 12,
        }}
      >
        <AlertTriangle size={24} color="#EF4444" />
        <Text style={{ color: colors.text3, fontSize: 13 }}>
          Error al cargar los indices. Intentalo de nuevo.
        </Text>
        <Pressable
          onPress={() => refetch()}
          testID="indices-retry"
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: "#EF444420",
            borderRadius: 100,
          }}
        >
          <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "600" }}>
            Reintentar
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!data) {
    return (
      <View
        testID="indices-empty"
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 32,
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 32 }}>📊</Text>
        <Text style={{ color: colors.text3, fontSize: 14, textAlign: "center" }}>
          Añade tus datos financieros para ver tus índices
        </Text>
      </View>
    );
  }

  const overallScore = data.summary?.overallScore ?? 0;
  const gaugeColor = getScoreColor(overallScore);

  const indexEntries = Object.entries(data.indices ?? {}) as [
    keyof IndicesData["indices"],
    IndexScore
  ][];

  return (
    <View testID="indices-inteligentes" style={{ gap: 16, paddingBottom: 8 }}>
      {/* Overall score hero */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: `${gaugeColor}25`,
          padding: 24,
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5 }}>
          SALUD FINANCIERA GLOBAL
        </Text>
        <CircularGauge score={overallScore} color={gaugeColor} />
        <View
          style={{
            backgroundColor: `${gaugeColor}15`,
            borderRadius: 100,
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: `${gaugeColor}30`,
          }}
        >
          <Text style={{ color: gaugeColor, fontSize: 13, fontWeight: "700" }}>
            {overallScore <= 30 ? "Crítico" : overallScore <= 50 ? "Bajo" : overallScore <= 70 ? "Medio" : overallScore <= 85 ? "Bueno" : "Excelente"}
          </Text>
        </View>
      </View>

      {/* 6 index cards in 2-column grid */}
      <View style={{ gap: 10 }}>
        {Array.from({ length: Math.ceil(indexEntries.length / 2) }, (_, rowIdx) => (
          <View key={rowIdx} style={{ flexDirection: "row", gap: 10 }}>
            {indexEntries.slice(rowIdx * 2, rowIdx * 2 + 2).map(([key, val]) => (
              <IndexCard key={key} name={IndexNameLabel(key)} data={val} />
            ))}
          </View>
        ))}
      </View>

      {/* Summary card */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          gap: 10,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Resumen</Text>
        <View
          style={{
            backgroundColor: "#4ADE8015",
            borderRadius: 14,
            padding: 12,
            borderWidth: 1,
            borderColor: "#4ADE8025",
            flexDirection: "row",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Text style={{ fontSize: 16 }}>💪</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#737373", fontSize: 10, fontWeight: "600", marginBottom: 2 }}>
              MAYOR FORTALEZA
            </Text>
            <Text style={{ color: "#4ADE80", fontSize: 13, fontWeight: "600", lineHeight: 18 }}>
              {data.summary?.topStrength ?? "—"}
            </Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: "#F9731615",
            borderRadius: 14,
            padding: 12,
            borderWidth: 1,
            borderColor: "#F9731625",
            flexDirection: "row",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Text style={{ fontSize: 16 }}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#737373", fontSize: 10, fontWeight: "600", marginBottom: 2 }}>
              ÁREA DE MEJORA
            </Text>
            <Text style={{ color: "#F97316", fontSize: 13, fontWeight: "600", lineHeight: 18 }}>
              {data.summary?.topWeakness ?? "—"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
