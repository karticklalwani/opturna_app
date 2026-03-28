import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
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
  Rect,
} from "react-native-svg";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  BarChart3,
  Zap,
  Shield,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SimulateChartPoint {
  year: number;
  nominal: number;
  real: number;
  contributed: number;
}

interface SimulateResult {
  nominalValue: number;
  realValue: number;
  inflationLoss: number;
  investmentGain?: number;
  totalContributed: number;
  chartData: SimulateChartPoint[];
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
  lastUpdated: string;
}

interface CountryInfo {
  code: string;
  name: string;
  rate: number;
  flag: string;
}

interface CountriesResponse {
  countries: CountryInfo[];
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

// ─── Chart ──────────────────────────────────────────────────────────────────

function SimulationChart({
  data,
  width,
}: {
  data: SimulateChartPoint[];
  width: number;
}) {
  const { colors } = useTheme();
  const chartWidth = width - 32;
  const chartHeight = 200;
  const paddingLeft = 56;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 28;
  const plotW = chartWidth - paddingLeft - paddingRight;
  const plotH = chartHeight - paddingTop - paddingBottom;

  if (!data || data.length < 2) return null;

  const allValues = data.flatMap((d) => [d.nominal, d.real, d.contributed]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => paddingLeft + (i / (data.length - 1)) * plotW;
  const toY = (v: number) => paddingTop + plotH - ((v - minVal) / range) * plotH;

  const nominalPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)},${toY(d.nominal)}`)
    .join(" ");
  const realPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)},${toY(d.real)}`)
    .join(" ");
  const contribPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)},${toY(d.contributed)}`)
    .join(" ");

  const nominalFill = `${nominalPath} L ${toX(data.length - 1)},${paddingTop + plotH} L ${toX(0)},${paddingTop + plotH} Z`;

  return (
    <View>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <SvgLinearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#4ADE80" stopOpacity="0.15" />
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

        <Path d={nominalFill} fill="url(#simGrad)" />

        {/* Contributed line (gray dashed) */}
        <Path
          d={contribPath}
          fill="none"
          stroke={colors.text4}
          strokeWidth="1.5"
          strokeDasharray="4,3"
          strokeLinecap="round"
        />

        {/* Real line (red) */}
        <Path
          d={realPath}
          fill="none"
          stroke="#EF4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Nominal line (green) */}
        <Path
          d={nominalPath}
          fill="none"
          stroke="#4ADE80"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End dots */}
        <Circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1].nominal)} r={4} fill="#4ADE80" stroke={colors.bg} strokeWidth="2" />
        <Circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1].real)} r={4} fill="#EF4444" stroke={colors.bg} strokeWidth="2" />

        {/* Y labels */}
        {[minVal, minVal + range * 0.5, maxVal].map((v, i) => (
          <SvgText key={`ylabel-${v.toFixed(2)}`} x={paddingLeft - 4} y={toY(v) + 4} fill={colors.text3} fontSize="9" textAnchor="end">
            {formatCurrency(v)}€
          </SvgText>
        ))}

        {/* X labels */}
        {data
          .filter((_, i) => i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2))
          .map((d) => {
            const idx = data.indexOf(d);
            return (
              <SvgText key={d.year} x={toX(idx)} y={chartHeight - 4} fill={colors.text3} fontSize="9" textAnchor="middle">
                Ano {d.year}
              </SvgText>
            );
          })}
      </Svg>

      {/* Legend */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 8 }}>
        {[
          { label: "Nominal", color: "#4ADE80" },
          { label: "Real", color: "#EF4444" },
          { label: "Aportado", color: colors.text4 },
        ].map((item) => (
          <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 3, backgroundColor: item.color, borderRadius: 2 }} />
            <Text style={{ color: colors.text3, fontSize: 10 }}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SimuladorInflacion() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  // Form state
  const [savingsAmount, setSavingsAmount] = useState<string>("5000");
  const [inflationRate, setInflationRate] = useState<string>("3.0");
  const [years, setYears] = useState<number>(10);
  const [includeInvestment, setIncludeInvestment] = useState<boolean>(false);
  const [investmentReturn, setInvestmentReturn] = useState<string>("7");
  const [includePignorar, setIncludePignorar] = useState<boolean>(false);
  const [showCountrySelector, setShowCountrySelector] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("Espana");

  // Fetch real-time inflation to pre-fill
  const { data: realTimeData } = useQuery<InflationRealTimeData>({
    queryKey: ["inflation-realtime-sim"],
    queryFn: () => api.get<InflationRealTimeData>("/api/inflation/real-time"),
  });

  // Fetch countries
  const { data: countriesData } = useQuery<CountriesResponse>({
    queryKey: ["inflation-countries-sim"],
    queryFn: () => api.get<CountriesResponse>("/api/inflation/countries"),
    enabled: showCountrySelector,
  });

  useEffect(() => {
    if (realTimeData?.spain != null) {
      setInflationRate(realTimeData.spain.current.toFixed(1));
    }
  }, [realTimeData]);

  // Simulation mutation
  const simulation = useMutation<SimulateResult, Error, void>({
    mutationFn: () =>
      api.post<SimulateResult>("/api/inflation/simulate", {
        savingsAmount: parseFloat(savingsAmount) || 0,
        inflationRate: parseFloat(inflationRate) || 0,
        years,
        includeInvestment,
        investmentReturn: includeInvestment ? parseFloat(investmentReturn) || 0 : undefined,
        includePignorar,
      }),
  });

  const result = simulation.data;

  const YEAR_MARKS = [1, 5, 10, 15, 20, 25, 30];

  return (
    <View testID="simulador-inflacion-container" style={{ gap: 12 }}>
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
              <Calculator size={18} color={colors.accent} />
            </View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.3 }}>
              Simulador Anti-Inflacion
            </Text>
          </View>

          {/* Savings Input */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Cantidad de Ahorro (€)
            </Text>
            <TextInput
              testID="sim-savings-input"
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
              value={savingsAmount}
              onChangeText={setSavingsAmount}
              keyboardType="numeric"
              placeholderTextColor={colors.text4}
              placeholder="5000"
            />
          </View>

          {/* Inflation Rate Input */}
          <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ color: colors.text3, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Tasa de Inflacion (%)
              </Text>
              <Pressable
                testID="sim-country-toggle"
                onPress={() => setShowCountrySelector(!showCountrySelector)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "600" }}>
                  {selectedCountry}
                </Text>
                <ChevronDown size={12} color={colors.accent} />
              </Pressable>
            </View>
            <TextInput
              testID="sim-inflation-input"
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
              value={inflationRate}
              onChangeText={setInflationRate}
              keyboardType="numeric"
              placeholderTextColor={colors.text4}
            />
          </View>

          {/* Country Selector */}
          {showCountrySelector ? (
            <View
              style={{
                backgroundColor: colors.bg3,
                borderRadius: 12,
                padding: 8,
                marginBottom: 14,
                maxHeight: 160,
              }}
            >
              <ScrollView style={{ flexGrow: 0 }} nestedScrollEnabled>
                {(countriesData?.countries ?? []).map((country) => (
                  <Pressable
                    key={country.code}
                    testID={`sim-country-${country.code}`}
                    onPress={() => {
                      setSelectedCountry(country.name);
                      setInflationRate(country.rate.toFixed(1));
                      setShowCountrySelector(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 16 }}>{country.flag}</Text>
                      <Text style={{ color: colors.text2, fontSize: 13 }}>{country.name}</Text>
                    </View>
                    <Text style={{ color: country.rate > 5 ? colors.error : colors.accent, fontSize: 13, fontWeight: "700" }}>
                      {country.rate.toFixed(1)}%
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Years Selector */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Periodo: {years} anos
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {YEAR_MARKS.map((y) => (
                  <Pressable
                    key={y}
                    testID={`sim-year-${y}`}
                    onPress={() => setYears(y)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: years === y ? colors.accent : colors.bg3,
                      borderWidth: 1,
                      borderColor: years === y ? colors.accent : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: years === y ? colors.bg : colors.text2,
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

          {/* Investment Toggle */}
          <Pressable
            testID="sim-investment-toggle"
            onPress={() => setIncludeInvestment(!includeInvestment)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.bg3,
              borderRadius: 12,
              padding: 14,
              marginBottom: includeInvestment ? 10 : 14,
              borderWidth: 1,
              borderColor: includeInvestment ? colors.accent : colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TrendingUp size={16} color={includeInvestment ? colors.accent : colors.text3} />
              <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600" }}>
                Incluir inversion
              </Text>
            </View>
            <View
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                backgroundColor: includeInvestment ? colors.accent : colors.text4,
                justifyContent: "center",
                paddingHorizontal: 2,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#FFF",
                  alignSelf: includeInvestment ? "flex-end" : "flex-start",
                }}
              />
            </View>
          </Pressable>

          {/* Investment Return Input */}
          {includeInvestment ? (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Rentabilidad Anual (%)
              </Text>
              <TextInput
                testID="sim-return-input"
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
                value={investmentReturn}
                onChangeText={setInvestmentReturn}
                keyboardType="numeric"
                placeholderTextColor={colors.text4}
              />
            </View>
          ) : null}

          {/* Pignorar Toggle */}
          <Pressable
            testID="sim-pignorar-toggle"
            onPress={() => setIncludePignorar(!includePignorar)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.bg3,
              borderRadius: 12,
              padding: 14,
              marginBottom: 18,
              borderWidth: 1,
              borderColor: includePignorar ? "#00B4D8" : colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Shield size={16} color={includePignorar ? "#00B4D8" : colors.text3} />
              <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600" }}>
                Comparar con pignorar
              </Text>
            </View>
            <View
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                backgroundColor: includePignorar ? "#00B4D8" : colors.text4,
                justifyContent: "center",
                paddingHorizontal: 2,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#FFF",
                  alignSelf: includePignorar ? "flex-end" : "flex-start",
                }}
              />
            </View>
          </Pressable>

          {/* Simulate Button */}
          <Pressable
            testID="sim-calculate-button"
            onPress={() => {
              const parsedSavings = parseFloat(savingsAmount);
              const parsedInflation = parseFloat(inflationRate);
              const parsedReturn = includeInvestment ? parseFloat(investmentReturn) : 0;

              if (isNaN(parsedSavings) || parsedSavings <= 0) {
                setValidationError("Introduce una cantidad de ahorro valida");
                return;
              }
              if (isNaN(parsedInflation) || parsedInflation < 0 || parsedInflation > 50) {
                setValidationError("Tasa de inflacion no valida (0-50%)");
                return;
              }
              if (includeInvestment && (isNaN(parsedReturn) || parsedReturn < 0 || parsedReturn > 100)) {
                setValidationError("Rentabilidad no valida (0-100%)");
                return;
              }
              setValidationError(null);
              simulation.mutate();
            }}
            disabled={simulation.isPending}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              opacity: simulation.isPending ? 0.7 : 1,
            }}
          >
            {simulation.isPending ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Zap size={16} color={colors.bg} />
                <Text style={{ color: colors.bg, fontSize: 15, fontWeight: "800" }}>
                  Simular
                </Text>
              </View>
            )}
          </Pressable>

          {validationError ? (
            <Text style={{ color: colors.error, fontSize: 12, marginTop: 8, textAlign: "center" }}>
              {validationError}
            </Text>
          ) : null}
          {simulation.isError ? (
            <Text style={{ color: colors.error, fontSize: 12, marginTop: 8, textAlign: "center" }}>
              Error al procesar la simulacion. Verifica los datos e intentalo de nuevo.
            </Text>
          ) : null}
        </View>
      </Animated.View>

      {/* Results */}
      {result ? (
        <>
          {/* Key Metrics */}
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
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 16, letterSpacing: -0.2 }}>
                Resultado de la Simulacion
              </Text>

              <View style={{ gap: 12 }}>
                {/* Nominal */}
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
                  <View>
                    <Text style={{ color: colors.text3, fontSize: 11 }}>Valor Nominal</Text>
                    <Text style={{ color: colors.text, fontSize: 11, marginTop: 2 }}>
                      Lo que tendras en {years} anos
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
                    {formatCurrency(result.nominalValue)}€
                  </Text>
                </View>

                {/* Real Value */}
                <View
                  style={{
                    backgroundColor: `${colors.accent}10`,
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderColor: `${colors.accent}30`,
                  }}
                >
                  <View>
                    <Text style={{ color: colors.text3, fontSize: 11 }}>Valor Real</Text>
                    <Text style={{ color: colors.text3, fontSize: 11, marginTop: 2 }}>
                      Poder adquisitivo real
                    </Text>
                  </View>
                  <Text style={{ color: colors.accent, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
                    {formatCurrency(result.realValue)}€
                  </Text>
                </View>

                {/* Inflation Loss */}
                <View
                  style={{
                    backgroundColor: `${colors.error}10`,
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderColor: `${colors.error}30`,
                  }}
                >
                  <View>
                    <Text style={{ color: colors.text3, fontSize: 11 }}>Perdida por Inflacion</Text>
                    <Text style={{ color: colors.text3, fontSize: 11, marginTop: 2 }}>
                      Dinero que "desaparece"
                    </Text>
                  </View>
                  <Text style={{ color: colors.error, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
                    -{formatCurrency(Math.abs(result.inflationLoss))}€
                  </Text>
                </View>

                {/* Investment Gain */}
                {result.investmentGain != null ? (
                  <View
                    style={{
                      backgroundColor: `${colors.accent}10`,
                      borderRadius: 14,
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View>
                      <Text style={{ color: colors.text3, fontSize: 11 }}>Ganancia por Inversion</Text>
                    </View>
                    <Text style={{ color: colors.accent, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
                      +{formatCurrency(result.investmentGain)}€
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Animated.View>

          {/* Chart */}
          {(result.chartData?.length ?? 0) > 1 ? (
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <BarChart3 size={16} color={colors.accent} />
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", letterSpacing: -0.2 }}>
                    Proyeccion a {years} Anos
                  </Text>
                </View>
                <SimulationChart data={result.chartData} width={width - 32} />
              </View>
            </Animated.View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
