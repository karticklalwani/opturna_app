import React from "react";
import { View, Text, ActivityIndicator, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useTheme } from "@/lib/theme";
import Svg, { Circle, Path } from "react-native-svg";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react-native";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
}

interface ScoreBreakdown {
  savingsScore: number;
  expenseScore: number;
  investmentScore: number;
  debtScore: number;
  inflationScore: number;
}

interface StabilityMetrics {
  savingsRate: number;
  expenseRatio: number;
  investmentCoverage: number;
  debtRatio: number;
  inflationGap: number;
}

interface StabilityData {
  score: number;
  level: string;
  breakdown: ScoreBreakdown;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  metrics: StabilityMetrics;
}

// ─── Score Circle ────────────────────────────────────────────────────────────

interface ScoreCircleProps {
  score: number;
  level: string;
  size: number;
}

function ScoreCircle({ score, level, size }: ScoreCircleProps) {
  const { colors } = useTheme();
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const filled = (clampedScore / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  const scoreColor =
    clampedScore < 50 ? colors.error : clampedScore < 70 ? "#FFD60A" : colors.success;

  return (
    <Svg width={size} height={size}>
      {/* Background track */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={`${scoreColor}20`}
        strokeWidth="10"
        fill="none"
      />
      {/* Progress arc — starts at top (rotate -90°) */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={scoreColor}
        strokeWidth="10"
        fill="none"
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90, ${cx}, ${cy})`}
      />
    </Svg>
  );
}

// ─── Mini Progress Bar ────────────────────────────────────────────────────────

interface MiniBarProps {
  label: string;
  value: number;
  color: string;
}

function MiniBar({ label, value, color }: MiniBarProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: colors.text2 }}>{label}</Text>
        <Text style={{ fontSize: 12, color, fontWeight: "600" }}>{clamped.toFixed(0)}</Text>
      </View>
      <View
        style={{
          height: 5,
          backgroundColor: `${color}20`,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 5,
            width: `${clamped}%`,
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EstabilidadFinanciera({
  income,
  expenses,
  savings,
  investments,
}: Props) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const circleSize = 160;

  const { data, isLoading, isError } = useQuery<StabilityData>({
    queryKey: ["financial-stability", income, expenses, savings, investments],
    queryFn: () =>
      api.post<StabilityData>("/api/inflation/estabilidad-avanzada", {
        income,
        expenses,
        savings,
        investments,
        debt: 0,
        personalInflation: 3.4,
      }),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <View
        testID="estabilidad-loading"
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
          Analizando estabilidad financiera...
        </Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View
        testID="estabilidad-error"
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 24,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.error, fontSize: 14 }}>
          Error cargando estabilidad financiera
        </Text>
      </View>
    );
  }

  const score = data.score ?? 0;
  const scoreColor =
    score < 50 ? colors.error : score < 70 ? "#FFD60A" : colors.success;

  const breakdown = data.breakdown ?? {
    savingsScore: 0,
    expenseScore: 0,
    investmentScore: 0,
    debtScore: 0,
    inflationScore: 0,
  };

  const breakdownItems: { label: string; value: number }[] = [
    { label: "Ahorro", value: breakdown.savingsScore },
    { label: "Gastos", value: breakdown.expenseScore },
    { label: "Inversiones", value: breakdown.investmentScore },
    { label: "Deuda", value: breakdown.debtScore },
    { label: "Inflación", value: breakdown.inflationScore },
  ];

  const getBarColor = (v: number) =>
    v < 40 ? colors.error : v < 65 ? "#FFD60A" : colors.success;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(200)} testID="estabilidad-container">
      {/* Score Circle Hero */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: colors.text3,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 16,
            alignSelf: "flex-start",
          }}
        >
          Estabilidad Financiera
        </Text>
        <View style={{ position: "relative", alignItems: "center", justifyContent: "center" }}>
          <ScoreCircle score={score} level={data.level ?? ""} size={circleSize} />
          <View
            style={{
              position: "absolute",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 36, fontWeight: "800", color: scoreColor, letterSpacing: -1 }}>
              {score.toFixed(0)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.text3 }}>/100</Text>
            <Text style={{ fontSize: 13, color: colors.text2, fontWeight: "600", marginTop: 2 }}>
              {data.level ?? ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Score Breakdown */}
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
        <Text style={{ fontSize: 12, color: colors.text3, marginBottom: 12, letterSpacing: 0.5 }}>
          Desglose de puntuación
        </Text>
        {breakdownItems.map((item) => (
          <MiniBar
            key={item.label}
            label={item.label}
            value={item.value}
            color={getBarColor(item.value)}
          />
        ))}
      </View>

      {/* Strengths & Weaknesses */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        {/* Strengths */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.success, fontWeight: "600", marginBottom: 8 }}>
            Fortalezas
          </Text>
          {(data.strengths ?? []).length === 0 ? (
            <Text style={{ fontSize: 12, color: colors.text3 }}>—</Text>
          ) : null}
          {(data.strengths ?? []).map((s, i) => (
            <View key={`str-${i}`} style={{ flexDirection: "row", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
              <CheckCircle2 size={13} color={colors.success} style={{ marginTop: 1 }} />
              <Text style={{ fontSize: 12, color: colors.text2, flex: 1, lineHeight: 16 }}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Weaknesses */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.error, fontWeight: "600", marginBottom: 8 }}>
            Debilidades
          </Text>
          {(data.weaknesses ?? []).length === 0 ? (
            <Text style={{ fontSize: 12, color: colors.text3 }}>—</Text>
          ) : null}
          {(data.weaknesses ?? []).map((w, i) => (
            <View key={`weak-${i}`} style={{ flexDirection: "row", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
              <XCircle size={13} color={colors.error} style={{ marginTop: 1 }} />
              <Text style={{ fontSize: 12, color: colors.text2, flex: 1, lineHeight: 16 }}>{w}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recommendations */}
      {(data.recommendations ?? []).length > 0 ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Lightbulb size={16} color="#FFD60A" />
            <Text style={{ fontSize: 12, color: colors.text3, letterSpacing: 0.5 }}>
              Recomendaciones
            </Text>
          </View>
          {(data.recommendations ?? []).map((rec, i) => (
            <View
              key={`rec-${i}`}
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 10,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: `${"#FFD60A"}20`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}
              >
                <Text style={{ fontSize: 10, color: "#FFD60A", fontWeight: "700" }}>
                  {i + 1}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.text2, flex: 1, lineHeight: 18 }}>
                {rec}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}
