import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMutation } from "@tanstack/react-query";
import {
  Shield,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ArrowRightLeft,
  Percent,
  Zap,
  CheckCircle,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface RiskAssessment {
  level: string;
  description?: string;
}

interface ComparisonItem {
  label: string;
  value: string | number;
  description?: string;
}

interface PignorarResult {
  liquidityObtained: number;
  annualCost: number;
  totalCost: number;
  comparisons: {
    vsSelling?: ComparisonItem;
    vsLoan?: ComparisonItem;
    vsInflation?: ComparisonItem;
  };
  riskAssessment: RiskAssessment;
  effectiveRate?: number;
  netBenefit?: number;
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

function getRiskColor(level: string): string {
  const lower = level.toLowerCase();
  if (lower.includes("bajo") || lower.includes("low")) return "#4ADE80";
  if (lower.includes("medio") || lower.includes("medium")) return "#FFD60A";
  return "#EF4444";
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PignorarModule() {
  const { colors } = useTheme();

  // Form state
  const [balance, setBalance] = useState<string>("5000");
  const [pledgeAmount, setPledgeAmount] = useState<string>("2000");
  const [ltvRatio, setLtvRatio] = useState<number>(70);
  const [annualCostRate, setAnnualCostRate] = useState<string>("2");
  const [years, setYears] = useState<number>(3);

  const LTV_OPTIONS = [60, 70, 80, 90];
  const YEAR_OPTIONS = [1, 2, 3, 5, 7, 10];

  // Simulation mutation
  const simulation = useMutation<PignorarResult, Error, void>({
    mutationFn: () =>
      api.post<PignorarResult>("/api/inflation/pignorar", {
        balance: parseFloat(balance) || 0,
        pledgeAmount: parseFloat(pledgeAmount) || 0,
        ltvRatio,
        annualCostRate: parseFloat(annualCostRate) || 0,
        years,
      }),
  });

  const result = simulation.data;

  return (
    <View testID="pignorar-module-container" style={{ gap: 12 }}>
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
                backgroundColor: "#00B4D815",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={18} color="#00B4D8" />
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.3 }}>
                Simulador de Pignorar
              </Text>
              <Text style={{ color: colors.text3, fontSize: 11 }}>
                Obtener liquidez sin vender tus activos
              </Text>
            </View>
          </View>

          {/* Balance Input */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Balance Total (€)
            </Text>
            <TextInput
              testID="pignorar-balance-input"
              style={{
                backgroundColor: colors.bg3,
                borderRadius: 12,
                padding: 14,
                color: colors.text,
                fontSize: 18,
                fontWeight: "700",
                borderWidth: 1,
                borderColor: colors.border,
              }}
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
              placeholderTextColor={colors.text4}
              placeholder="5000"
            />
          </View>

          {/* Pledge Amount */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Cantidad a Pignorar (€)
            </Text>
            <TextInput
              testID="pignorar-pledge-input"
              style={{
                backgroundColor: colors.bg3,
                borderRadius: 12,
                padding: 14,
                color: colors.text,
                fontSize: 18,
                fontWeight: "700",
                borderWidth: 1,
                borderColor: colors.border,
              }}
              value={pledgeAmount}
              onChangeText={setPledgeAmount}
              keyboardType="numeric"
              placeholderTextColor={colors.text4}
              placeholder="2000"
            />
            {/* Pledge percentage indicator */}
            {parseFloat(balance) > 0 ? (
              <Text style={{ color: colors.text4, fontSize: 11, marginTop: 4 }}>
                {((parseFloat(pledgeAmount) || 0) / parseFloat(balance) * 100).toFixed(0)}% del balance
              </Text>
            ) : null}
          </View>

          {/* LTV Ratio Selector */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Ratio LTV: {ltvRatio}%
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {LTV_OPTIONS.map((ltv) => (
                <Pressable
                  key={ltv}
                  testID={`pignorar-ltv-${ltv}`}
                  onPress={() => setLtvRatio(ltv)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: ltvRatio === ltv ? "#00B4D8" : colors.bg3,
                    borderWidth: 1,
                    borderColor: ltvRatio === ltv ? "#00B4D8" : colors.border,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: ltvRatio === ltv ? "#FFF" : colors.text2,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {ltv}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Annual Cost Rate */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Coste Anual (%)
            </Text>
            <TextInput
              testID="pignorar-cost-input"
              style={{
                backgroundColor: colors.bg3,
                borderRadius: 12,
                padding: 14,
                color: colors.text,
                fontSize: 18,
                fontWeight: "700",
                borderWidth: 1,
                borderColor: colors.border,
              }}
              value={annualCostRate}
              onChangeText={setAnnualCostRate}
              keyboardType="numeric"
              placeholderTextColor={colors.text4}
            />
          </View>

          {/* Years Selector */}
          <View style={{ marginBottom: 18 }}>
            <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Periodo: {years} {years === 1 ? "ano" : "anos"}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {YEAR_OPTIONS.map((y) => (
                  <Pressable
                    key={y}
                    testID={`pignorar-year-${y}`}
                    onPress={() => setYears(y)}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: years === y ? "#00B4D8" : colors.bg3,
                      borderWidth: 1,
                      borderColor: years === y ? "#00B4D8" : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: years === y ? "#FFF" : colors.text2,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {y}a
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Calculate Button */}
          <Pressable
            testID="pignorar-calculate-button"
            onPress={() => simulation.mutate()}
            disabled={simulation.isPending}
            style={{
              backgroundColor: "#00B4D8",
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              opacity: simulation.isPending ? 0.7 : 1,
            }}
          >
            {simulation.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Zap size={16} color="#FFF" />
                <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "800" }}>
                  Calcular
                </Text>
              </View>
            )}
          </Pressable>

          {simulation.isError ? (
            <Text style={{ color: colors.error, fontSize: 12, marginTop: 8, textAlign: "center" }}>
              Error: {simulation.error?.message ?? "Desconocido"}
            </Text>
          ) : null}
        </View>
      </Animated.View>

      {/* Results */}
      {result ? (
        <>
          {/* Liquidity Card */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: "#00B4D840",
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 16, letterSpacing: -0.2 }}>
                Resultado
              </Text>

              {/* Liquidity Obtained */}
              <View
                style={{
                  backgroundColor: `${colors.accent}10`,
                  borderRadius: 16,
                  padding: 18,
                  alignItems: "center",
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: `${colors.accent}30`,
                }}
              >
                <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 4 }}>
                  Liquidez Obtenida
                </Text>
                <Text style={{ color: colors.accent, fontSize: 32, fontWeight: "800", letterSpacing: -1 }}>
                  {formatCurrency(result.liquidityObtained)}€
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                {/* Annual Cost */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.bg3,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <Percent size={14} color={colors.text3} />
                  <Text style={{ color: colors.text3, fontSize: 10, marginTop: 4, marginBottom: 4 }}>
                    Coste Anual
                  </Text>
                  <Text style={{ color: "#FFD60A", fontSize: 18, fontWeight: "800" }}>
                    {formatCurrency(result.annualCost)}€
                  </Text>
                </View>

                {/* Total Cost */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.bg3,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <DollarSign size={14} color={colors.text3} />
                  <Text style={{ color: colors.text3, fontSize: 10, marginTop: 4, marginBottom: 4 }}>
                    Coste Total
                  </Text>
                  <Text style={{ color: colors.error, fontSize: 18, fontWeight: "800" }}>
                    {formatCurrency(result.totalCost)}€
                  </Text>
                </View>
              </View>

              {/* Risk Assessment */}
              {result.riskAssessment ? (
                <View
                  style={{
                    backgroundColor: `${getRiskColor(result.riskAssessment.level)}10`,
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    borderWidth: 1,
                    borderColor: `${getRiskColor(result.riskAssessment.level)}30`,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: `${getRiskColor(result.riskAssessment.level)}20`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AlertTriangle size={18} color={getRiskColor(result.riskAssessment.level)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text3, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Nivel de Riesgo
                    </Text>
                    <Text
                      style={{
                        color: getRiskColor(result.riskAssessment.level),
                        fontSize: 16,
                        fontWeight: "800",
                        textTransform: "capitalize",
                      }}
                    >
                      {result.riskAssessment.level}
                    </Text>
                    {result.riskAssessment.description ? (
                      <Text style={{ color: colors.text3, fontSize: 11, marginTop: 2 }}>
                        {result.riskAssessment.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* Comparisons */}
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <ArrowRightLeft size={16} color="#00B4D8" />
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", letterSpacing: -0.2 }}>
                  Comparativas
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {/* vs Selling */}
                {result.comparisons?.vsSelling ? (
                  <View
                    style={{
                      backgroundColor: colors.bg3,
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <DollarSign size={14} color={colors.accent} />
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>
                        vs Vender
                      </Text>
                    </View>
                    <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "700" }}>
                      {typeof result.comparisons.vsSelling.value === "number"
                        ? `${formatCurrency(result.comparisons.vsSelling.value)}€`
                        : result.comparisons.vsSelling.value}
                    </Text>
                    {result.comparisons.vsSelling.description ? (
                      <Text style={{ color: colors.text3, fontSize: 11, marginTop: 4 }}>
                        {result.comparisons.vsSelling.description}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {/* vs Traditional Loan */}
                {result.comparisons?.vsLoan ? (
                  <View
                    style={{
                      backgroundColor: colors.bg3,
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Percent size={14} color="#FFD60A" />
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>
                        vs Prestamo Tradicional
                      </Text>
                    </View>
                    <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "700" }}>
                      {typeof result.comparisons.vsLoan.value === "number"
                        ? `${formatCurrency(result.comparisons.vsLoan.value)}€`
                        : result.comparisons.vsLoan.value}
                    </Text>
                    {result.comparisons.vsLoan.description ? (
                      <Text style={{ color: colors.text3, fontSize: 11, marginTop: 4 }}>
                        {result.comparisons.vsLoan.description}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {/* vs Inflation */}
                {result.comparisons?.vsInflation ? (
                  <View
                    style={{
                      backgroundColor: colors.bg3,
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <TrendingUp size={14} color={colors.error} />
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>
                        vs Inflacion
                      </Text>
                    </View>
                    <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "700" }}>
                      {typeof result.comparisons.vsInflation.value === "number"
                        ? `${formatCurrency(result.comparisons.vsInflation.value)}€`
                        : result.comparisons.vsInflation.value}
                    </Text>
                    {result.comparisons.vsInflation.description ? (
                      <Text style={{ color: colors.text3, fontSize: 11, marginTop: 4 }}>
                        {result.comparisons.vsInflation.description}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}
