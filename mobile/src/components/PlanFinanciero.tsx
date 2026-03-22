import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, AlertTriangle, ChevronDown, ChevronUp, Lightbulb } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanAction {
  action: string;
  amount: number | null;
  priority: "alta" | "media" | "baja";
  category: string;
}

interface PlanGoal {
  title: string;
  amount: number | null;
  deadline: string;
  probability: number;
}

interface Strategy {
  title: string;
  description: string;
  impact: "alto" | "medio" | "bajo";
}

interface PlanData {
  plan: {
    monthlyPlan: PlanAction[];
    annualGoals: PlanGoal[];
    strategies: Strategy[];
    insights: string[];
    projections: {
      oneYear: number;
      fiveYears: number;
      monthlyToTarget: number | null;
    };
  };
  summary: string;
}

interface Props {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
}

type GoalType = "ahorro" | "inversion" | "deuda" | "libertad";
type TimeframeType = "3meses" | "6meses" | "1ano" | "5anos";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPriorityStyle(priority: PlanAction["priority"]) {
  if (priority === "alta") return { bg: "#EF444420", text: "#EF4444", label: "Alta" };
  if (priority === "media") return { bg: "#FFD60A20", text: "#FFD60A", label: "Media" };
  return { bg: "#4ADE8020", text: "#4ADE80", label: "Baja" };
}

function getImpactStyle(impact: Strategy["impact"]) {
  if (impact === "alto") return { bg: "#4ADE8020", text: "#4ADE80", label: "Alto impacto" };
  if (impact === "medio") return { bg: "#FFD60A20", text: "#FFD60A", label: "Impacto medio" };
  return { bg: "#3B82F620", text: "#3B82F6", label: "Bajo impacto" };
}

function formatEuros(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 }) + " €";
}

// ─── Strategy Card ────────────────────────────────────────────────────────────

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const impactStyle = getImpactStyle(strategy.impact);

  return (
    <Pressable
      testID="strategy-card"
      onPress={() => setExpanded((v) => !v)}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", lineHeight: 18 }}>
            {strategy.title}
          </Text>
          <View
            style={{
              backgroundColor: impactStyle.bg,
              borderRadius: 100,
              paddingHorizontal: 8,
              paddingVertical: 3,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: impactStyle.text, fontSize: 10, fontWeight: "700" }}>
              {impactStyle.label}
            </Text>
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={16} color={colors.text3} />
        ) : (
          <ChevronDown size={16} color={colors.text3} />
        )}
      </View>
      {expanded ? (
        <Text style={{ color: colors.text3, fontSize: 12, lineHeight: 17 }}>
          {strategy.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

// ─── Constants (outside component to avoid queryKey exhaustive-deps issue) ────

const TIMEFRAME_API_MAP: Record<TimeframeType, string> = {
  "3meses": "3meses",
  "6meses": "6meses",
  "1ano": "1ano",
  "5anos": "5anos",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlanFinanciero({ income, expenses, savings, investments }: Props) {
  const { colors } = useTheme();

  const [goal, setGoal] = useState<GoalType>("ahorro");
  const [timeframe, setTimeframe] = useState<TimeframeType>("1ano");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["plan", income, expenses, savings, investments, goal, TIMEFRAME_API_MAP[timeframe]],
    queryFn: () =>
      api.post<PlanData>("/api/advanced/plan", {
        income,
        expenses,
        savings,
        investments,
        debt: 0,
        goal,
        timeframe: TIMEFRAME_API_MAP[timeframe],
      }),
    enabled: income > 0,
    staleTime: 5 * 60 * 1000,
  });

  const goals: { key: GoalType; label: string }[] = [
    { key: "ahorro", label: "Ahorro" },
    { key: "inversion", label: "Inversión" },
    { key: "deuda", label: "Deuda" },
    { key: "libertad", label: "Libertad" },
  ];

  const timeframes: { key: TimeframeType; label: string }[] = [
    { key: "3meses", label: "3 meses" },
    { key: "6meses", label: "6 meses" },
    { key: "1ano", label: "1 año" },
    { key: "5anos", label: "5 años" },
  ];

  // Empty state when no income
  if (income === 0) {
    return (
      <View
        testID="plan-financiero-empty"
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
        <Text style={{ fontSize: 36 }}>💡</Text>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", textAlign: "center" }}>
          Añade tus ingresos en Finanzas para generar tu plan
        </Text>
        <Text style={{ color: colors.text3, fontSize: 12, textAlign: "center", lineHeight: 17 }}>
          Tu plan financiero personalizado aparecerá aquí con acciones concretas y proyecciones.
        </Text>
      </View>
    );
  }

  return (
    <View testID="plan-financiero" style={{ gap: 16, paddingBottom: 8 }}>
      {/* Goal selector */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
          OBJETIVO
        </Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {goals.map((g) => {
            const isActive = goal === g.key;
            return (
              <Pressable
                key={g.key}
                onPress={() => setGoal(g.key)}
                testID={`goal-selector-${g.key}`}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 100,
                  backgroundColor: isActive ? colors.accent : `${colors.accent}10`,
                  borderWidth: 1,
                  borderColor: isActive ? colors.accent : colors.border,
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#000" : colors.text3,
                    fontSize: 13,
                    fontWeight: isActive ? "700" : "500",
                  }}
                >
                  {g.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Timeframe selector */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
          PLAZO
        </Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {timeframes.map((tf) => {
            const isActive = timeframe === tf.key;
            return (
              <Pressable
                key={tf.key}
                onPress={() => setTimeframe(tf.key)}
                testID={`timeframe-selector-${tf.key}`}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: isActive ? "#818CF8" : "#818CF810",
                  borderWidth: 1,
                  borderColor: isActive ? "#818CF8" : colors.border,
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#fff" : colors.text3,
                    fontSize: 12,
                    fontWeight: isActive ? "700" : "500",
                  }}
                >
                  {tf.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Loading */}
      {isLoading ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 32,
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={{ color: colors.text3, fontSize: 13 }}>
            Generando tu plan personalizado...
          </Text>
        </View>
      ) : null}

      {/* Error */}
      {isError && !isLoading ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 24,
            alignItems: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: "#EF444430",
          }}
        >
          <AlertTriangle size={24} color="#EF4444" />
          <Text style={{ color: colors.text3, fontSize: 13 }}>Error al generar el plan</Text>
        </View>
      ) : null}

      {/* Results */}
      {data && !isLoading ? (
        <>
          {/* Summary card */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: `${colors.accent}25`,
              padding: 16,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Sparkles size={16} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700", letterSpacing: 0.3 }}>
                TU PLAN
              </Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: "500" }}>
              {data.summary}
            </Text>
          </View>

          {/* Projections row */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "#4ADE8025",
                padding: 16,
                gap: 4,
              }}
            >
              <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "600" }}>1 AÑO</Text>
              <Text style={{ color: "#4ADE80", fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}>
                {formatEuros(data.plan?.projections?.oneYear)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "#00E5FF25",
                padding: 16,
                gap: 4,
              }}
            >
              <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "600" }}>5 AÑOS</Text>
              <Text style={{ color: "#00E5FF", fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}>
                {formatEuros(data.plan?.projections?.fiveYears)}
              </Text>
            </View>
          </View>

          {/* Plan mensual */}
          {(data.plan?.monthlyPlan ?? []).length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                Plan mensual
              </Text>
              {(data.plan?.monthlyPlan ?? []).map((action, idx) => {
                const p = getPriorityStyle(action.priority);
                return (
                  <View
                    key={idx}
                    testID={`plan-action-${idx}`}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 14,
                      flexDirection: "row",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 100,
                        backgroundColor: `${colors.accent}20`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "800" }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600", lineHeight: 18 }}>
                        {action.action}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                        <View
                          style={{
                            backgroundColor: p.bg,
                            borderRadius: 100,
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                          }}
                        >
                          <Text style={{ color: p.text, fontSize: 10, fontWeight: "700" }}>
                            {p.label}
                          </Text>
                        </View>
                        {action.amount !== null && (
                          <Text style={{ color: colors.text3, fontSize: 11 }}>
                            {formatEuros(action.amount)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Estrategias */}
          {(data.plan?.strategies ?? []).length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                Estrategias
              </Text>
              {(data.plan?.strategies ?? []).map((strategy, idx) => (
                <StrategyCard key={idx} strategy={strategy} />
              ))}
            </View>
          )}

          {/* Insights */}
          {(data.plan?.insights ?? []).length > 0 && (
            <View
              style={{
                backgroundColor: "#FFD60A10",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#FFD60A25",
                padding: 16,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Lightbulb size={16} color="#FFD60A" />
                <Text style={{ color: "#FFD60A", fontSize: 12, fontWeight: "700", letterSpacing: 0.3 }}>
                  INSIGHTS
                </Text>
              </View>
              {(data.plan?.insights ?? []).map((insight, idx) => (
                <View key={idx} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                  <Text style={{ color: "#FFD60A", fontSize: 12, marginTop: 2 }}>•</Text>
                  <Text style={{ color: "#A3A3A3", fontSize: 12, lineHeight: 17, flex: 1 }}>
                    {insight}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}
