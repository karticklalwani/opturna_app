import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, {
  Circle as SvgCircle,
  Text as SvgText,
  G,
} from "react-native-svg";
import { useMutation } from "@tanstack/react-query";
import {
  Wallet,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Target,
  Zap,
  Heart,
  PiggyBank,
  CreditCard,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Recommendation {
  title: string;
  description: string;
  priority?: string;
  icon?: string;
}

interface PatrimonioResult {
  healthScore: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyFundMonths: number;
  recommendations: Recommendation[];
  riskLevel: string;
  inflationExposure?: number;
  monthlyPlan?: {
    description: string;
    steps: string[];
  };
  yearlyPlan?: {
    description: string;
    goals: string[];
  };
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

function getScoreColor(score: number): string {
  if (score >= 70) return "#4ADE80";
  if (score >= 40) return "#FFD60A";
  return "#EF4444";
}

function getRiskColor(level: string): string {
  const lower = level.toLowerCase();
  if (lower.includes("bajo") || lower.includes("low")) return "#4ADE80";
  if (lower.includes("medio") || lower.includes("medium") || lower.includes("moderado")) return "#FFD60A";
  return "#EF4444";
}

function getRecommendationIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("ahorro") || lower.includes("save")) return PiggyBank;
  if (lower.includes("deuda") || lower.includes("debt")) return CreditCard;
  if (lower.includes("emergencia") || lower.includes("emergency")) return ShieldCheck;
  if (lower.includes("inversion") || lower.includes("invest")) return TrendingUp;
  if (lower.includes("salud") || lower.includes("health")) return Heart;
  if (lower.includes("objetivo") || lower.includes("goal")) return Target;
  return Lightbulb;
}

// ─── Score Gauge ────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const { colors } = useTheme();
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);
  const scoreColor = getScoreColor(score);

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background circle */}
          <SvgCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.bg3}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <SvgCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
        {/* Score text */}
        <SvgText
          x={size / 2}
          y={size / 2 - 8}
          fill={scoreColor}
          fontSize="36"
          fontWeight="800"
          textAnchor="middle"
          alignmentBaseline="central"
        >
          {score}
        </SvgText>
        <SvgText
          x={size / 2}
          y={size / 2 + 20}
          fill={colors.text3}
          fontSize="11"
          textAnchor="middle"
        >
          de 100
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function GestorPatrimonio() {
  const { colors } = useTheme();

  // Form state
  const [monthlyIncome, setMonthlyIncome] = useState<string>("2500");
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>("1800");
  const [totalSavings, setTotalSavings] = useState<string>("5000");
  const [totalInvestments, setTotalInvestments] = useState<string>("2000");
  const [totalDebt, setTotalDebt] = useState<string>("0");
  const [pledgedAmount, setPledgedAmount] = useState<string>("0");

  // Mutation
  const analysis = useMutation<PatrimonioResult, Error, void>({
    mutationFn: () =>
      api.post<PatrimonioResult>("/api/inflation/patrimonio", {
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        monthlyExpenses: parseFloat(monthlyExpenses) || 0,
        totalSavings: parseFloat(totalSavings) || 0,
        totalInvestments: parseFloat(totalInvestments) || 0,
        totalDebt: parseFloat(totalDebt) || 0,
        pledgedAmount: parseFloat(pledgedAmount) || 0,
      }),
  });

  const result = analysis.data;

  const inputFields = [
    { label: "Ingresos Mensuales (€)", value: monthlyIncome, setter: setMonthlyIncome, testId: "patrimonio-income" },
    { label: "Gastos Mensuales (€)", value: monthlyExpenses, setter: setMonthlyExpenses, testId: "patrimonio-expenses" },
    { label: "Ahorros Totales (€)", value: totalSavings, setter: setTotalSavings, testId: "patrimonio-savings" },
    { label: "Inversiones (€)", value: totalInvestments, setter: setTotalInvestments, testId: "patrimonio-investments" },
    { label: "Deuda Total (€)", value: totalDebt, setter: setTotalDebt, testId: "patrimonio-debt" },
    { label: "Cantidad Pignorada (€)", value: pledgedAmount, setter: setPledgedAmount, testId: "patrimonio-pledged" },
  ];

  return (
    <View testID="gestor-patrimonio-container" style={{ gap: 12 }}>
      {/* Input Card */}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 }}>
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
              <Wallet size={18} color={colors.accent} />
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.3 }}>
                Gestor de Patrimonio
              </Text>
              <Text style={{ color: colors.text3, fontSize: 11 }}>
                Analiza tu salud financiera
              </Text>
            </View>
          </View>

          {/* Input Fields */}
          <View style={{ gap: 12, marginBottom: 18 }}>
            {inputFields.map((field) => (
              <View key={field.testId}>
                <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {field.label}
                </Text>
                <TextInput
                  testID={field.testId}
                  style={{
                    backgroundColor: colors.bg3,
                    borderRadius: 12,
                    padding: 14,
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "700",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType="numeric"
                  placeholderTextColor={colors.text4}
                />
              </View>
            ))}
          </View>

          {/* Analyze Button */}
          <Pressable
            testID="patrimonio-analyze-button"
            onPress={() => analysis.mutate()}
            disabled={analysis.isPending}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              opacity: analysis.isPending ? 0.7 : 1,
            }}
          >
            {analysis.isPending ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Zap size={16} color={colors.bg} />
                <Text style={{ color: colors.bg, fontSize: 15, fontWeight: "800" }}>
                  Analizar
                </Text>
              </View>
            )}
          </Pressable>

          {analysis.isError ? (
            <Text style={{ color: colors.error, fontSize: 12, marginTop: 8, textAlign: "center" }}>
              Error: {analysis.error?.message ?? "Desconocido"}
            </Text>
          ) : null}
        </View>
      </Animated.View>

      {/* Results */}
      {result ? (
        <>
          {/* Health Score */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: `${getScoreColor(result.healthScore)}30`,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 16, letterSpacing: -0.2 }}>
                Salud Financiera
              </Text>

              <ScoreGauge score={result.healthScore} />

              {/* Risk Level */}
              <View
                style={{
                  marginTop: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: `${getRiskColor(result.riskLevel)}15`,
                  borderWidth: 1,
                  borderColor: `${getRiskColor(result.riskLevel)}30`,
                }}
              >
                <Text
                  style={{
                    color: getRiskColor(result.riskLevel),
                    fontSize: 13,
                    fontWeight: "700",
                    textTransform: "capitalize",
                  }}
                >
                  Riesgo: {result.riskLevel}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Key Metrics */}
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
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 14, letterSpacing: -0.2 }}>
                Metricas Clave
              </Text>

              <View style={{ gap: 10 }}>
                {/* Savings Rate */}
                <View
                  style={{
                    backgroundColor: colors.bg3,
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <PiggyBank size={16} color={colors.accent} />
                    <Text style={{ color: colors.text2, fontSize: 13 }}>
                      Tasa de Ahorro
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: result.savingsRate >= 20 ? colors.accent : result.savingsRate >= 10 ? "#FFD60A" : colors.error,
                      fontSize: 18,
                      fontWeight: "800",
                    }}
                  >
                    {result.savingsRate.toFixed(1)}%
                  </Text>
                </View>

                {/* Debt-to-Income */}
                <View
                  style={{
                    backgroundColor: colors.bg3,
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <CreditCard size={16} color="#FFD60A" />
                    <Text style={{ color: colors.text2, fontSize: 13 }}>
                      Deuda/Ingreso
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: result.debtToIncomeRatio <= 30 ? colors.accent : result.debtToIncomeRatio <= 50 ? "#FFD60A" : colors.error,
                      fontSize: 18,
                      fontWeight: "800",
                    }}
                  >
                    {result.debtToIncomeRatio.toFixed(1)}%
                  </Text>
                </View>

                {/* Emergency Fund */}
                <View
                  style={{
                    backgroundColor: colors.bg3,
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ShieldCheck size={16} color="#00B4D8" />
                    <Text style={{ color: colors.text2, fontSize: 13 }}>
                      Fondo de Emergencia
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: result.emergencyFundMonths >= 6 ? colors.accent : result.emergencyFundMonths >= 3 ? "#FFD60A" : colors.error,
                      fontSize: 18,
                      fontWeight: "800",
                    }}
                  >
                    {result.emergencyFundMonths.toFixed(1)} meses
                  </Text>
                </View>

                {/* Inflation Exposure */}
                {result.inflationExposure != null ? (
                  <View
                    style={{
                      backgroundColor: colors.bg3,
                      borderRadius: 14,
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <AlertCircle size={16} color={colors.error} />
                      <Text style={{ color: colors.text2, fontSize: 13 }}>
                        Exposicion a Inflacion
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: result.inflationExposure <= 30 ? colors.accent : result.inflationExposure <= 60 ? "#FFD60A" : colors.error,
                        fontSize: 18,
                        fontWeight: "800",
                      }}
                    >
                      {result.inflationExposure.toFixed(0)}%
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Animated.View>

          {/* Recommendations */}
          {(result.recommendations?.length ?? 0) > 0 ? (
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Lightbulb size={16} color="#FFD60A" />
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", letterSpacing: -0.2 }}>
                    Recomendaciones
                  </Text>
                </View>

                <View style={{ gap: 10 }}>
                  {result.recommendations.map((rec, idx) => {
                    const Icon = getRecommendationIcon(rec.title);
                    return (
                      <View
                        key={`rec-${rec.title}-${idx}`}
                        style={{
                          backgroundColor: colors.bg3,
                          borderRadius: 14,
                          padding: 14,
                          flexDirection: "row",
                          gap: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            backgroundColor: `${colors.accent}15`,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon size={16} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600", marginBottom: 2 }}>
                            {rec.title}
                          </Text>
                          <Text style={{ color: colors.text3, fontSize: 12, lineHeight: 18 }}>
                            {rec.description}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* Monthly Plan */}
          {result.monthlyPlan ? (
            <Animated.View entering={FadeInDown.duration(400).delay(400)}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Target size={16} color="#00B4D8" />
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", letterSpacing: -0.2 }}>
                    Plan Mensual
                  </Text>
                </View>
                <Text style={{ color: colors.text3, fontSize: 12, marginBottom: 10, lineHeight: 18 }}>
                  {result.monthlyPlan.description}
                </Text>
                {(result.monthlyPlan.steps ?? []).map((step, idx) => (
                  <View key={`step-${idx}-${step.slice(0, 20)}`} style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                    <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700" }}>
                      {idx + 1}.
                    </Text>
                    <Text style={{ color: colors.text2, fontSize: 12, flex: 1, lineHeight: 18 }}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {/* Yearly Plan */}
          {result.yearlyPlan ? (
            <Animated.View entering={FadeInDown.duration(400).delay(500)}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <TrendingUp size={16} color={colors.accent} />
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", letterSpacing: -0.2 }}>
                    Plan Anual
                  </Text>
                </View>
                <Text style={{ color: colors.text3, fontSize: 12, marginBottom: 10, lineHeight: 18 }}>
                  {result.yearlyPlan.description}
                </Text>
                {(result.yearlyPlan.goals ?? []).map((goal, idx) => (
                  <View key={`goal-${idx}-${goal.slice(0, 20)}`} style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                    <Text style={{ color: colors.accent, fontSize: 12 }}>•</Text>
                    <Text style={{ color: colors.text2, fontSize: 12, flex: 1, lineHeight: 18 }}>
                      {goal}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
