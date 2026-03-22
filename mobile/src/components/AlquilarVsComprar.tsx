import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useTheme } from "@/lib/theme";
import {
  Home,
  Check,
  TrendingUp,
  HelpCircle,
} from "lucide-react-native";
import Svg, { Polyline, Line, Text as SvgText } from "react-native-svg";

interface YearlyPoint {
  year: number;
  costAcumuladoCompra: number;
  costAcumuladoAlquiler: number;
  patrimonioCompra: number;
  patrimonioAlquiler: number;
}

interface ComparisonData {
  recommendation: "comprar" | "alquilar" | "depende";
  breakEvenYear: number | null;
  costeTotalCompra: number;
  costeTotalAlquiler: number;
  patrimonioCompra: number;
  patrimonioAlquiler: number;
  yearlyComparison: YearlyPoint[];
  advice: string[];
}

function fmt(n: number) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 }) + "€";
}

function PatrimonioChart({
  points,
  compraColor,
  alquilerColor,
}: {
  points: YearlyPoint[];
  compraColor: string;
  alquilerColor: string;
}) {
  const { colors } = useTheme();
  const width = 300;
  const height = 120;
  const padLeft = 8;
  const padRight = 8;
  const padTop = 8;
  const padBottom = 20;

  if (!points || points.length < 2) return null;

  const allVals = [
    ...points.map((p) => p.patrimonioCompra),
    ...points.map((p) => p.patrimonioAlquiler),
  ];
  const maxVal = Math.max(...allVals);
  const minVal = Math.min(0, ...allVals);
  const range = maxVal - minVal || 1;

  const toX = (i: number) =>
    padLeft + (i / (points.length - 1)) * (width - padLeft - padRight);
  const toY = (v: number) =>
    padTop + (1 - (v - minVal) / range) * (height - padTop - padBottom);

  const compraPoints = points.map((p, i) => `${toX(i)},${toY(p.patrimonioCompra)}`).join(" ");
  const alquilerPoints = points.map((p, i) => `${toX(i)},${toY(p.patrimonioAlquiler)}`).join(" ");

  return (
    <View style={{ alignItems: "center", marginTop: 8 }}>
      <Svg width={width} height={height}>
        <Line
          x1={padLeft}
          y1={height - padBottom}
          x2={width - padRight}
          y2={height - padBottom}
          stroke={colors.border}
          strokeWidth={1}
        />
        <Polyline
          points={compraPoints}
          fill="none"
          stroke={compraColor}
          strokeWidth={2}
        />
        <Polyline
          points={alquilerPoints}
          fill="none"
          stroke={alquilerColor}
          strokeWidth={2}
          strokeDasharray="4,3"
        />
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
      {/* Legend */}
      <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 16, height: 2, backgroundColor: compraColor }} />
          <Text style={{ color: colors.text4, fontSize: 9 }}>Comprar</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 16, height: 2, backgroundColor: alquilerColor }} />
          <Text style={{ color: colors.text4, fontSize: 9 }}>Alquilar</Text>
        </View>
      </View>
    </View>
  );
}

const RECOMMENDATION_CONFIG = {
  comprar: {
    label: "Comprar es mejor",
    bg: "#4ADE8015",
    border: "#4ADE8040",
    color: "#4ADE80",
  },
  alquilar: {
    label: "Alquilar es mejor",
    bg: "#00B4D815",
    border: "#00B4D840",
    color: "#00B4D8",
  },
  depende: {
    label: "Depende de tu situación",
    bg: "#FBBF2415",
    border: "#FBBF2440",
    color: "#FBBF24",
  },
};

export default function AlquilarVsComprar() {
  const { colors } = useTheme();

  const [precioVivienda, setPrecioVivienda] = useState("");
  const [alquilerMensual, setAlquilerMensual] = useState("");
  const [entrada, setEntrada] = useState("20");
  const [interes, setInteres] = useState("3.5");
  const [anos, setAnos] = useState("30");
  const [revalorizacion, setRevalorizacion] = useState("3");

  const compraColor = "#00B4D8";
  const alquilerColor = "#818CF8";

  const mutation = useMutation({
    mutationFn: (body: {
      precioVivienda: number;
      alquilerMensual: number;
      entrada: number;
      interes: number;
      anos: number;
      revalorizacion: number;
      inflacionAlquiler: number;
      rentabilidadAlternativa: number;
    }) =>
      api.post<ComparisonData>("/api/advanced/alquilar-vs-comprar", body),
  });

  const handleComparar = () => {
    mutation.mutate({
      precioVivienda: parseFloat(precioVivienda) || 0,
      alquilerMensual: parseFloat(alquilerMensual) || 0,
      entrada: parseFloat(entrada) || 0,
      interes: parseFloat(interes) || 0,
      anos: parseInt(anos) || 0,
      revalorizacion: parseFloat(revalorizacion) || 0,
      inflacionAlquiler: 3,
      rentabilidadAlternativa: 7,
    });
  };

  const data = mutation.data as ComparisonData | undefined;

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
            backgroundColor: `${compraColor}20`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TrendingUp size={18} color={compraColor} />
        </View>
        <View>
          <Text
            style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}
          >
            Alquilar vs Comprar
          </Text>
          <Text style={{ color: colors.text3, fontSize: 11, marginTop: 1 }}>
            Análisis financiero comparativo
          </Text>
        </View>
      </View>

      {/* Form */}
      <View style={{ padding: 18 }}>
        <Text style={labelStyle}>PRECIO VIVIENDA (€)</Text>
        <TextInput
          value={precioVivienda}
          onChangeText={setPrecioVivienda}
          placeholder="Ej. 250000"
          placeholderTextColor={colors.text4}
          keyboardType="numeric"
          style={inputStyle}
          testID="alqvscmp-precio"
        />

        <Text style={labelStyle}>ALQUILER MENSUAL (€)</Text>
        <TextInput
          value={alquilerMensual}
          onChangeText={setAlquilerMensual}
          placeholder="Ej. 1000"
          placeholderTextColor={colors.text4}
          keyboardType="numeric"
          style={inputStyle}
          testID="alqvscmp-alquiler"
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
              testID="alqvscmp-entrada"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>TIPO HIPOTECA (%)</Text>
            <TextInput
              value={interes}
              onChangeText={setInteres}
              placeholder="3.5"
              placeholderTextColor={colors.text4}
              keyboardType="numeric"
              style={inputStyle}
              testID="alqvscmp-interes"
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>AÑOS ANÁLISIS</Text>
            <TextInput
              value={anos}
              onChangeText={setAnos}
              placeholder="30"
              placeholderTextColor={colors.text4}
              keyboardType="numeric"
              style={inputStyle}
              testID="alqvscmp-anos"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>REVALORIZACIÓN (%/AÑO)</Text>
            <TextInput
              value={revalorizacion}
              onChangeText={setRevalorizacion}
              placeholder="3"
              placeholderTextColor={colors.text4}
              keyboardType="numeric"
              style={inputStyle}
              testID="alqvscmp-revalorizacion"
            />
          </View>
        </View>

        <Pressable
          onPress={handleComparar}
          disabled={mutation.isPending}
          testID="alqvscmp-comparar"
          style={{
            backgroundColor: compraColor,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            opacity: mutation.isPending ? 0.7 : 1,
            shadowColor: compraColor,
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
              Comparar
            </Text>
          )}
        </Pressable>

        {mutation.isError ? (
          <Text
            style={{
              color: "#EF4444",
              fontSize: 12,
              textAlign: "center",
              marginTop: 10,
            }}
          >
            Error al comparar. Verifica los datos.
          </Text>
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
          {/* Recommendation hero */}
          {data.recommendation ? (
            <View
              style={{
                backgroundColor:
                  RECOMMENDATION_CONFIG[data.recommendation]?.bg ?? "#ffffff10",
                borderRadius: 16,
                borderWidth: 1,
                borderColor:
                  RECOMMENDATION_CONFIG[data.recommendation]?.border ??
                  colors.border,
                padding: 16,
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text
                style={{
                  color:
                    RECOMMENDATION_CONFIG[data.recommendation]?.color ??
                    colors.text,
                  fontSize: 20,
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                {RECOMMENDATION_CONFIG[data.recommendation]?.label ??
                  data.recommendation}
              </Text>
              {data.breakEvenYear ? (
                <Text
                  style={{
                    color: colors.text3,
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  Punto de equilibrio: año {data.breakEvenYear}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Patrimonio 2-col */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: `${compraColor}10`,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: `${compraColor}30`,
                padding: 14,
                alignItems: "center",
                gap: 4,
              }}
            >
              <Home size={16} color={compraColor} />
              <Text
                style={{
                  color: compraColor,
                  fontSize: 18,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                {fmt(data.patrimonioCompra ?? 0)}
              </Text>
              <Text
                style={{ color: colors.text3, fontSize: 10, fontWeight: "600" }}
              >
                Patrimonio comprando
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: `${alquilerColor}10`,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: `${alquilerColor}30`,
                padding: 14,
                alignItems: "center",
                gap: 4,
              }}
            >
              <HelpCircle size={16} color={alquilerColor} />
              <Text
                style={{
                  color: alquilerColor,
                  fontSize: 18,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                {fmt(data.patrimonioAlquiler ?? 0)}
              </Text>
              <Text
                style={{ color: colors.text3, fontSize: 10, fontWeight: "600" }}
              >
                Patrimonio alquilando
              </Text>
            </View>
          </View>

          {/* Chart */}
          {data.yearlyComparison && data.yearlyComparison.length > 1 ? (
            <View>
              <Text
                style={{
                  color: colors.text2,
                  fontSize: 13,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                Evolución del patrimonio
              </Text>
              <PatrimonioChart
                points={data.yearlyComparison}
                compraColor={compraColor}
                alquilerColor={alquilerColor}
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
                  style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 100,
                      backgroundColor: `${compraColor}20`,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Check size={10} color={compraColor} />
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
