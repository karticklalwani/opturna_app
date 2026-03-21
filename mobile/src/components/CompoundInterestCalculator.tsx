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
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import { Calculator, TrendingUp, Globe, ChevronDown, ChevronUp } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Frequency = "Diaria" | "Semanal" | "Mensual" | "Anual";

interface ChartPoint {
  month: number;
  nominal: number;
  real: number;
  contributed: number;
}

interface CompoundResult {
  totalContributed: number;
  totalInterest: number;
  finalValue: number;
  realValue: number;
  realInterest: number;
  chartData: ChartPoint[];
}

interface InflationCountry {
  code: string;
  name: string;
  rate: number;
  flag: string;
  trend: string;
}

interface InflationData {
  world: number;
  lastUpdated: string;
  continents: {
    europe: number;
    northAmerica: number;
    southAmerica: number;
    asia: number;
    africa: number;
    oceania: number;
  };
  countries: InflationCountry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return amount < 0 ? `-${formatted}` : formatted;
  }
  return amount.toFixed(2).replace(".", ",");
}

// ─── Chart Component ──────────────────────────────────────────────────────────

function CompoundChart({
  data,
  showReal,
  width,
}: {
  data: ChartPoint[];
  showReal: boolean;
  width: number;
}) {
  const chartWidth = width - 40;
  const chartHeight = 200;
  const paddingLeft = 56;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 32;
  const plotW = chartWidth - paddingLeft - paddingRight;
  const plotH = chartHeight - paddingTop - paddingBottom;

  if (!data || data.length === 0) return null;

  const allValues = data.flatMap((d) => [d.nominal, showReal ? d.real : 0, d.contributed]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => paddingLeft + (i / (data.length - 1)) * plotW;
  const toY = (v: number) => paddingTop + plotH - ((v - minVal) / range) * plotH;

  // Build nominal path + fill
  const nominalPoints = data.map((d, i) => `${toX(i)},${toY(d.nominal)}`).join(" ");
  const fillPath = `M ${toX(0)},${toY(data[0].nominal)} L ${data
    .map((d, i) => `${toX(i)},${toY(d.nominal)}`)
    .join(" L ")} L ${toX(data.length - 1)},${paddingTop + plotH} L ${toX(0)},${paddingTop + plotH} Z`;

  // Real line
  const realPoints = data.map((d, i) => `${toX(i)},${toY(d.real)}`).join(" ");

  // Contributed dashed — build path segments
  const contributedPoints = data.map((d, i) => `${toX(i)},${toY(d.contributed)}`);

  // Y axis labels
  const yLabels = [minVal, minVal + range * 0.5, maxVal];

  // X axis labels: first, mid, last
  const midIdx = Math.floor(data.length / 2);
  const xLabels = [
    { idx: 0, label: `M0` },
    { idx: midIdx, label: `M${data[midIdx]?.month ?? midIdx}` },
    { idx: data.length - 1, label: `M${data[data.length - 1]?.month ?? data.length - 1}` },
  ];

  return (
    <Svg width={chartWidth} height={chartHeight}>
      <Defs>
        <SvgLinearGradient id="nominalGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4ADE80" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#4ADE80" stopOpacity="0.02" />
        </SvgLinearGradient>
      </Defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <Line
          key={t}
          x1={paddingLeft}
          y1={paddingTop + plotH * (1 - t)}
          x2={paddingLeft + plotW}
          y2={paddingTop + plotH * (1 - t)}
          stroke="#1F1F1F"
          strokeWidth="1"
        />
      ))}

      {/* Nominal fill */}
      <Path d={fillPath} fill="url(#nominalGrad)" />

      {/* Contributed dashed */}
      {contributedPoints.map((pt, i) => {
        if (i === 0) return null;
        const prev = contributedPoints[i - 1];
        return (
          <Line
            key={i}
            x1={parseFloat(prev.split(",")[0])}
            y1={parseFloat(prev.split(",")[1])}
            x2={parseFloat(pt.split(",")[0])}
            y2={parseFloat(pt.split(",")[1])}
            stroke="#737373"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
        );
      })}

      {/* Real line */}
      {showReal ? (
        <Path
          d={`M ${data.map((d, i) => `${toX(i)},${toY(d.real)}`).join(" L ")}`}
          fill="none"
          stroke="#60A5FA"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {/* Nominal line */}
      <Path
        d={`M ${data.map((d, i) => `${toX(i)},${toY(d.nominal)}`).join(" L ")}`}
        fill="none"
        stroke="#4ADE80"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Last point dots */}
      <Circle
        cx={toX(data.length - 1)}
        cy={toY(data[data.length - 1].nominal)}
        r={4}
        fill="#4ADE80"
        stroke="#080808"
        strokeWidth="2"
      />
      {showReal ? (
        <Circle
          cx={toX(data.length - 1)}
          cy={toY(data[data.length - 1].real)}
          r={4}
          fill="#60A5FA"
          stroke="#080808"
          strokeWidth="2"
        />
      ) : null}

      {/* Y axis labels */}
      {yLabels.map((v, i) => (
        <SvgText
          key={i}
          x={paddingLeft - 4}
          y={toY(v) + 4}
          fill="#737373"
          fontSize="9"
          textAnchor="end"
        >
          {formatCurrency(v)}
        </SvgText>
      ))}

      {/* X axis labels */}
      {xLabels.map(({ idx, label }) => (
        <SvgText
          key={idx}
          x={toX(idx)}
          y={chartHeight - 4}
          fill="#737373"
          fontSize="9"
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}

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

export default function CompoundInterestCalculator() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  // Form state
  const [initialAmount, setInitialAmount] = useState<string>("1000");
  const [periodicContribution, setPeriodicContribution] = useState<string>("200");
  const [frequency, setFrequency] = useState<Frequency>("Mensual");
  const [annualInterestRate, setAnnualInterestRate] = useState<string>("7");
  const [periodMonths, setPeriodMonths] = useState<string>("120");
  const [inflationRate, setInflationRate] = useState<string>("3");
  const [showReal, setShowReal] = useState<boolean>(false);

  // Inflation toggle
  const [inflationView, setInflationView] = useState<"continent" | "country">("continent");
  const [showInflation, setShowInflation] = useState<boolean>(false);

  const FREQUENCIES: Frequency[] = ["Diaria", "Semanal", "Mensual", "Anual"];

  // Compound interest query
  const {
    data: result,
    isFetching: calculating,
    refetch: calculate,
    error: calcError,
  } = useQuery<CompoundResult>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      "compound-interest",
      initialAmount,
      periodicContribution,
      frequency,
      annualInterestRate,
      periodMonths,
      inflationRate,
    ],
    queryFn: () =>
      api.post<CompoundResult>("/api/finance/compound-interest", {
        initialAmount: parseFloat(initialAmount) || 0,
        periodicContribution: parseFloat(periodicContribution) || 0,
        frequency,
        annualInterestRate: parseFloat(annualInterestRate) || 0,
        periodMonths: parseInt(periodMonths) || 0,
        inflationRate: parseFloat(inflationRate) || 0,
      }),
    enabled: false,
    refetchOnMount: false,
  });

  // Inflation data
  const {
    data: inflationData,
    isFetching: loadingInflation,
    refetch: fetchInflation,
  } = useQuery<InflationData>({
    queryKey: ["finance-inflation"],
    queryFn: () => api.get<InflationData>("/api/finance/inflation"),
    enabled: false,
    refetchOnMount: false,
  });

  const handleShowInflation = () => {
    setShowInflation((prev) => {
      if (!prev && !inflationData) {
        fetchInflation();
      }
      return !prev;
    });
  };

  // When inflation data loads, update default inflation rate
  React.useEffect(() => {
    if (inflationData?.world != null) {
      setInflationRate(inflationData.world.toFixed(1));
    }
  }, [inflationData]);

  const CONTINENT_LABELS: Record<string, string> = {
    europe: "Europa",
    northAmerica: "América del Norte",
    southAmerica: "América del Sur",
    asia: "Asia",
    africa: "África",
    oceania: "Oceanía",
  };

  return (
    <View style={{ marginTop: 8 }}>
      {/* Form Card */}
      <Animated.View entering={FadeInDown.duration(300).springify()}>
        <View
          style={{
            backgroundColor: colors.bg2,
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.accent,
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
              Parámetros de Cálculo
            </Text>
          </View>

          {/* Row: Initial Amount + Contribution */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                CAPITAL INICIAL (€)
              </Text>
              <TextInput
                value={initialAmount}
                onChangeText={setInitialAmount}
                placeholder="1000"
                placeholderTextColor={colors.text4}
                keyboardType="decimal-pad"
                testID="calc-initial-amount"
                style={{
                  backgroundColor: colors.bg3,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.text,
                  fontSize: 15,
                  fontWeight: "700",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                APORTACIÓN (€)
              </Text>
              <TextInput
                value={periodicContribution}
                onChangeText={setPeriodicContribution}
                placeholder="200"
                placeholderTextColor={colors.text4}
                keyboardType="decimal-pad"
                testID="calc-contribution"
                style={{
                  backgroundColor: colors.bg3,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.text,
                  fontSize: 15,
                  fontWeight: "700",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
          </View>

          {/* Frequency selector */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            FRECUENCIA
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              marginBottom: 14,
            }}
          >
            {FREQUENCIES.map((f) => {
              const isActive = frequency === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFrequency(f)}
                  testID={`freq-${f}`}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: isActive ? `${colors.accent}20` : colors.bg3,
                    borderWidth: 1,
                    borderColor: isActive ? `${colors.accent}60` : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? colors.accent : colors.text3,
                      fontSize: 11,
                      fontWeight: isActive ? "700" : "500",
                    }}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Row: Interest + Period */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                INTERÉS ANUAL (%)
              </Text>
              <TextInput
                value={annualInterestRate}
                onChangeText={setAnnualInterestRate}
                placeholder="7"
                placeholderTextColor={colors.text4}
                keyboardType="decimal-pad"
                testID="calc-interest-rate"
                style={{
                  backgroundColor: colors.bg3,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.accent,
                  fontSize: 15,
                  fontWeight: "700",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                PERÍODO (MESES)
              </Text>
              <TextInput
                value={periodMonths}
                onChangeText={setPeriodMonths}
                placeholder="120"
                placeholderTextColor={colors.text4}
                keyboardType="number-pad"
                testID="calc-period"
                style={{
                  backgroundColor: colors.bg3,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.text,
                  fontSize: 15,
                  fontWeight: "700",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
          </View>

          {/* Inflation rate */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            INFLACIÓN ANUAL (%)
          </Text>
          <TextInput
            value={inflationRate}
            onChangeText={setInflationRate}
            placeholder="3"
            placeholderTextColor={colors.text4}
            keyboardType="decimal-pad"
            testID="calc-inflation"
            style={{
              backgroundColor: colors.bg3,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: "#F59E0B",
              fontSize: 15,
              fontWeight: "700",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
          />

          {/* Calculate button */}
          <Pressable
            onPress={() => calculate()}
            disabled={calculating}
            testID="calculate-button"
            style={{
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: calculating ? `${colors.accent}40` : colors.accent,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {calculating ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Calculator size={16} color="#000" />
            )}
            <Text
              style={{
                color: "#000",
                fontSize: 15,
                fontWeight: "800",
                letterSpacing: -0.2,
              }}
            >
              {calculating ? "Calculando..." : "Calcular"}
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Results */}
      {result ? (
        <Animated.View entering={FadeInDown.duration(350).springify()}>
          {/* View toggle */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.bg2,
              borderRadius: 12,
              padding: 4,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {(["Nominal", "Real (ajustado)"] as const).map((label) => {
              const isActive =
                label === "Nominal" ? !showReal : showReal;
              return (
                <Pressable
                  key={label}
                  onPress={() => setShowReal(label === "Real (ajustado)")}
                  testID={`view-${label}`}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: "center",
                    backgroundColor: isActive ? `${colors.accent}18` : "transparent",
                    borderWidth: isActive ? 1 : 0,
                    borderColor: isActive ? `${colors.accent}40` : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? colors.accent : colors.text3,
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "500",
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 4 result cards */}
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
                label: "Capital Aportado",
                value: result.totalContributed,
                color: colors.accent,
                dot: colors.accent,
              },
              {
                label: "Interés Generado",
                value: result.totalInterest,
                color: "#60A5FA",
                dot: "#60A5FA",
              },
              {
                label: "Valor Final Nominal",
                value: result.finalValue,
                color: colors.accent,
                dot: colors.accent,
              },
              {
                label: "Valor Real (ajustado)",
                value: result.realValue,
                color: "#F59E0B",
                dot: "#F59E0B",
              },
            ].map((card) => (
              <View
                key={card.label}
                style={{
                  width: "47.5%",
                  backgroundColor: colors.bg2,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: `${card.dot}30`,
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
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: card.dot,
                    }}
                  />
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
                    fontSize: 16,
                    fontWeight: "800",
                    letterSpacing: -0.5,
                  }}
                >
                  {formatCurrency(card.value)} €
                </Text>
              </View>
            ))}
          </View>

          {/* Chart */}
          <View
            style={{
              backgroundColor: colors.bg2,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <TrendingUp size={14} color={colors.accent} />
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  Proyección de Crecimiento
                </Text>
              </View>
            </View>

            {result.chartData && result.chartData.length > 0 ? (
              <CompoundChart
                data={result.chartData}
                showReal={showReal}
                width={width - 40}
              />
            ) : null}

            {/* Legend */}
            <View
              style={{
                flexDirection: "row",
                gap: 16,
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View
                  style={{
                    width: 16,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: colors.accent,
                  }}
                />
                <Text style={{ color: colors.text3, fontSize: 11 }}>Nominal</Text>
              </View>
              {showReal ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View
                    style={{
                      width: 16,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: "#60A5FA",
                    }}
                  />
                  <Text style={{ color: colors.text3, fontSize: 11 }}>Real</Text>
                </View>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View
                  style={{
                    width: 16,
                    height: 2,
                    backgroundColor: "#737373",
                  }}
                />
                <Text style={{ color: colors.text3, fontSize: 11 }}>Aportado</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      ) : null}

      {calcError ? (
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
            Error al calcular. Comprueba los parámetros.
          </Text>
        </View>
      ) : null}

      {/* Inflation data section */}
      <Animated.View entering={FadeInDown.duration(300).delay(100).springify()}>
        <Pressable
          onPress={handleShowInflation}
          testID="toggle-inflation"
          style={{
            backgroundColor: colors.bg2,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: showInflation ? 0 : 0,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${"#F59E0B"}18`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Globe size={16} color="#F59E0B" />
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                Datos de Inflación Mundial
              </Text>
              <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>
                {inflationData
                  ? `Mundial: ${inflationData.world.toFixed(1)}%`
                  : "Ver tasas por país y continente"}
              </Text>
            </View>
          </View>
          {showInflation ? (
            <ChevronUp size={18} color={colors.text3} />
          ) : (
            <ChevronDown size={18} color={colors.text3} />
          )}
        </Pressable>

        {showInflation ? (
          <View
            style={{
              backgroundColor: colors.bg2,
              borderRadius: 16,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              padding: 16,
              paddingTop: 8,
              borderWidth: 1,
              borderTopWidth: 0,
              borderColor: colors.border,
              marginBottom: 4,
            }}
          >
            {loadingInflation ? (
              <View
                style={{
                  paddingVertical: 24,
                  alignItems: "center",
                }}
              >
                <ActivityIndicator color={colors.accent} size="small" />
                <Text
                  style={{
                    color: colors.text3,
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  Cargando datos...
                </Text>
              </View>
            ) : inflationData ? (
              <>
                {/* World rate prominent display */}
                <View
                  style={{
                    alignItems: "center",
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    marginBottom: 14,
                  }}
                >
                  <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "600", letterSpacing: 0.5 }}>
                    INFLACIÓN MUNDIAL MEDIA
                  </Text>
                  <Text
                    style={{
                      color: "#F59E0B",
                      fontSize: 42,
                      fontWeight: "800",
                      letterSpacing: -1.5,
                      marginTop: 4,
                    }}
                  >
                    {inflationData.world.toFixed(1)}%
                  </Text>
                  {inflationData.lastUpdated ? (
                    <Text style={{ color: colors.text4, fontSize: 11, marginTop: 2 }}>
                      Actualizado: {inflationData.lastUpdated}
                    </Text>
                  ) : null}
                </View>

                {/* Toggle continent/country */}
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: colors.bg3,
                    borderRadius: 10,
                    padding: 3,
                    marginBottom: 14,
                  }}
                >
                  {(["continent", "country"] as const).map((v) => {
                    const isActive = inflationView === v;
                    return (
                      <Pressable
                        key={v}
                        onPress={() => setInflationView(v)}
                        testID={`inflation-view-${v}`}
                        style={{
                          flex: 1,
                          paddingVertical: 7,
                          borderRadius: 8,
                          alignItems: "center",
                          backgroundColor: isActive ? colors.bg2 : "transparent",
                          borderWidth: isActive ? 1 : 0,
                          borderColor: isActive ? colors.border : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            color: isActive ? colors.text : colors.text3,
                            fontSize: 12,
                            fontWeight: isActive ? "700" : "500",
                          }}
                        >
                          {v === "continent" ? "Por Continente" : "Por País"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {inflationView === "continent" ? (
                  <View style={{ gap: 8 }}>
                    {Object.entries(inflationData.continents).map(([key, rate]) => (
                      <View
                        key={key}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 8,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.bg4,
                        }}
                      >
                        <Text style={{ color: colors.text2, fontSize: 13 }}>
                          {CONTINENT_LABELS[key] ?? key}
                        </Text>
                        <Text
                          style={{
                            color:
                              rate > 5
                                ? colors.error
                                : rate > 3
                                ? "#F59E0B"
                                : colors.accent,
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          {rate.toFixed(1)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <ScrollView
                    style={{ maxHeight: 240 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    {inflationData.countries.map((country) => (
                      <View
                        key={country.code}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 9,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.bg4,
                          gap: 10,
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>{country.flag}</Text>
                        <Text
                          style={{
                            flex: 1,
                            color: colors.text2,
                            fontSize: 13,
                          }}
                          numberOfLines={1}
                        >
                          {country.name}
                        </Text>
                        <Text
                          style={{
                            color:
                              country.rate > 5
                                ? colors.error
                                : country.rate > 3
                                ? "#F59E0B"
                                : colors.accent,
                            fontSize: 13,
                            fontWeight: "700",
                            marginRight: 4,
                          }}
                        >
                          {country.rate.toFixed(1)}%
                        </Text>
                        <Text style={{ fontSize: 14 }}>
                          {country.trend === "up"
                            ? "↑"
                            : country.trend === "down"
                            ? "↓"
                            : "→"}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Text style={{ color: colors.text3, fontSize: 13 }}>
                  No se pudieron cargar los datos de inflación.
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}
