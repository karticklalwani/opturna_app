import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useTheme } from "@/lib/theme";
import {
  Home,
  Check,
  AlertCircle,
  TrendingDown,
} from "lucide-react-native";
import Svg, { Polyline, Line, Text as SvgText } from "react-native-svg";

interface AmortizationPoint {
  year: number;
  capitalPendiente: number;
  totalPagado: number;
}

interface SimuladorCasaResult {
  cuotaMensual: number;
  totalPagado: number;
  totalIntereses: number;
  capitalPrestado: number;
  ratioEsfuerzo: number;
  asequible: boolean;
  ingresoNecesario: number;
  amortizationPoints: AmortizationPoint[];
  advice: string[];
}

function fmt(n: number) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 }) + "€";
}

function AmortizationChart({
  points,
  accentColor,
}: {
  points: AmortizationPoint[];
  accentColor: string;
}) {
  const { colors } = useTheme();
  const width = 300;
  const height = 120;
  const padLeft = 8;
  const padRight = 8;
  const padTop = 8;
  const padBottom = 20;

  if (!points || points.length < 2) return null;

  const maxVal = Math.max(...points.map((p) => p.capitalPendiente));
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const xs = points.map(
    (p, i) =>
      padLeft + ((i / (points.length - 1)) * (width - padLeft - padRight))
  );
  const ys = points.map(
    (p) =>
      padTop + ((1 - (p.capitalPendiente - minVal) / range) * (height - padTop - padBottom))
  );

  const polyPoints = xs.map((x, i) => `${x},${ys[i]}`).join(" ");

  return (
    <View style={{ alignItems: "center", marginTop: 8 }}>
      <Svg width={width} height={height}>
        {/* Baseline */}
        <Line
          x1={padLeft}
          y1={height - padBottom}
          x2={width - padRight}
          y2={height - padBottom}
          stroke={colors.border}
          strokeWidth={1}
        />
        {/* Line chart */}
        <Polyline
          points={polyPoints}
          fill="none"
          stroke={accentColor}
          strokeWidth={2}
        />
        {/* Labels */}
        <SvgText
          x={padLeft}
          y={height}
          fontSize={9}
          fill={colors.text4 as string}
        >
          Año {points[0]?.year}
        </SvgText>
        <SvgText
          x={width - padRight - 24}
          y={height}
          fontSize={9}
          fill={colors.text4 as string}
        >
          Año {points[points.length - 1]?.year}
        </SvgText>
      </Svg>
      <Text style={{ color: colors.text4, fontSize: 10, marginTop: 2 }}>
        Capital pendiente a lo largo del tiempo
      </Text>
    </View>
  );
}

export default function SimuladorCasa() {
  const { colors } = useTheme();

  const [precio, setPrecio] = useState("");
  const [entrada, setEntrada] = useState("20");
  const [interes, setInteres] = useState("3.5");
  const [anos, setAnos] = useState("30");
  const [ingresos, setIngresos] = useState("");

  const accentColor = "#00B4D8";

  const mutation = useMutation({
    mutationFn: (body: {
      precio: number;
      entrada: number;
      interes: number;
      anos: number;
      ingresos: number;
      gastos: number;
    }) => api.post<SimuladorCasaResult>("/api/advanced/simulador-casa", body),
  });

  const handleCalc = () => {
    mutation.mutate({
      precio: parseFloat(precio) || 0,
      entrada: parseFloat(entrada) || 0,
      interes: parseFloat(interes) || 0,
      anos: parseInt(anos) || 0,
      ingresos: parseFloat(ingresos) || 0,
      gastos: 0,
    });
  };

  const data = mutation.data as SimuladorCasaResult | undefined;

  const inputStyle = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 13,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
  };

  const labelStyle = {
    color: colors.text3,
    fontSize: 11,
    fontWeight: "600" as const,
    marginBottom: 5,
    letterSpacing: 0.3,
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {/* Title */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: 18,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 100,
            backgroundColor: `${accentColor}20`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Home size={18} color={accentColor} />
        </View>
        <View>
          <Text
            style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}
          >
            Simulador Hipoteca
          </Text>
          <Text style={{ color: colors.text3, fontSize: 11, marginTop: 1 }}>
            Calcula tu cuota mensual y coste total
          </Text>
        </View>
      </View>

      {/* Form */}
      <View style={{ padding: 18 }}>
        <Text style={labelStyle}>PRECIO VIVIENDA (€)</Text>
        <TextInput
          value={precio}
          onChangeText={setPrecio}
          placeholder="Ej. 250000"
          placeholderTextColor={colors.text4}
          keyboardType="numeric"
          style={inputStyle}
          testID="simulador-precio"
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>ENTRADA (%)</Text>
            <TextInput
              value={entrada}
              onChangeText={setEntrada}
              placeholder="20"
              placeholderTextColor={colors.text4}
              keyboardType="numeric"
              style={inputStyle}
              testID="simulador-entrada"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>TIPO DE INTERÉS (%)</Text>
            <TextInput
              value={interes}
              onChangeText={setInteres}
              placeholder="3.5"
              placeholderTextColor={colors.text4}
              keyboardType="numeric"
              style={inputStyle}
              testID="simulador-interes"
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>AÑOS HIPOTECA</Text>
            <TextInput
              value={anos}
              onChangeText={setAnos}
              placeholder="30"
              placeholderTextColor={colors.text4}
              keyboardType="numeric"
              style={inputStyle}
              testID="simulador-anos"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>INGRESOS MENSUALES (€)</Text>
            <TextInput
              value={ingresos}
              onChangeText={setIngresos}
              placeholder="Ej. 3000"
              placeholderTextColor={colors.text4}
              keyboardType="numeric"
              style={inputStyle}
              testID="simulador-ingresos"
            />
          </View>
        </View>

        <Pressable
          onPress={handleCalc}
          disabled={mutation.isPending}
          testID="simulador-calcular"
          style={{
            backgroundColor: accentColor,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            opacity: mutation.isPending ? 0.7 : 1,
            shadowColor: accentColor,
            shadowOpacity: 0.3,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}
            >
              Calcular
            </Text>
          )}
        </Pressable>

        {mutation.isError ? (
          <View
            style={{
              backgroundColor: "#EF444415",
              borderRadius: 12,
              padding: 14,
              marginTop: 10,
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text
              style={{
                color: "#EF4444",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Error al procesar los datos. Intentalo de nuevo.
            </Text>
            <Pressable
              onPress={() => { mutation.reset(); handleCalc(); }}
              testID="simulador-retry"
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: "#EF444420",
                borderRadius: 100,
              }}
            >
              <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "600" }}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Results */}
      {data ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            padding: 18,
            gap: 16,
          }}
        >
          {/* Hero */}
          <View style={{ alignItems: "center", gap: 8 }}>
            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.3 }}>
              CUOTA MENSUAL
            </Text>
            <Text
              style={{
                color: accentColor,
                fontSize: 42,
                fontWeight: "800",
                letterSpacing: -1,
              }}
            >
              {fmt(data.cuotaMensual)}
            </Text>
            <View
              style={{
                backgroundColor: data.asequible ? "#4ADE8020" : "#EF444420",
                borderRadius: 100,
                paddingHorizontal: 14,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: data.asequible ? "#4ADE8040" : "#EF444440",
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              {data.asequible ? (
                <Check size={12} color="#4ADE80" />
              ) : (
                <AlertCircle size={12} color="#EF4444" />
              )}
              <Text
                style={{
                  color: data.asequible ? "#4ADE80" : "#EF4444",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {data.asequible ? "Asequible" : "Esfuerzo elevado"}
              </Text>
            </View>
          </View>

          {/* 3 stats */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { label: "Capital prestado", value: fmt(data.capitalPrestado) },
              { label: "Total pagado", value: fmt(data.totalPagado) },
              { label: "Total intereses", value: fmt(data.totalIntereses) },
            ].map((s, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: colors.bg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 10,
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Text
                  style={{
                    color: accentColor,
                    fontSize: 13,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {s.value}
                </Text>
                <Text
                  style={{
                    color: colors.text3,
                    fontSize: 9,
                    textAlign: "center",
                    fontWeight: "500",
                  }}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Ratio esfuerzo */}
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600" }}>
                Ratio de esfuerzo
              </Text>
              <Text
                style={{
                  color:
                    data.ratioEsfuerzo > 35
                      ? "#EF4444"
                      : data.ratioEsfuerzo > 25
                      ? "#FBBF24"
                      : "#4ADE80",
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                {data.ratioEsfuerzo?.toFixed(1)}%
              </Text>
            </View>
            <View
              style={{
                height: 8,
                backgroundColor: colors.bg,
                borderRadius: 100,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  height: 8,
                  width: `${Math.min(100, data.ratioEsfuerzo ?? 0)}%`,
                  borderRadius: 100,
                  backgroundColor:
                    data.ratioEsfuerzo > 35
                      ? "#EF4444"
                      : data.ratioEsfuerzo > 25
                      ? "#FBBF24"
                      : "#4ADE80",
                }}
              />
            </View>
            <Text
              style={{
                color: colors.text4,
                fontSize: 10,
                marginTop: 4,
              }}
            >
              Ingreso necesario: {fmt(data.ingresoNecesario)}/mes
            </Text>
          </View>

          {/* Amortization chart */}
          {data.amortizationPoints && data.amortizationPoints.length > 1 ? (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <TrendingDown size={14} color={accentColor} />
                <Text
                  style={{
                    color: colors.text2,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Evolución del capital pendiente
                </Text>
              </View>
              <AmortizationChart
                points={data.amortizationPoints}
                accentColor={accentColor}
              />
            </View>
          ) : null}

          {/* Advice */}
          {data.advice && data.advice.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: colors.text2,
                  fontSize: 13,
                  fontWeight: "600",
                  marginBottom: 2,
                }}
              >
                Consejos
              </Text>
              {data.advice.map((tip, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 100,
                      backgroundColor: `${accentColor}20`,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Check size={10} color={accentColor} />
                  </View>
                  <Text
                    style={{
                      color: colors.text3,
                      fontSize: 12,
                      lineHeight: 18,
                      flex: 1,
                    }}
                  >
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
