import React, { useMemo } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useTheme } from "@/lib/theme";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface Props {
  transactions: Transaction[];
}

interface PersonalInflationCategory {
  name: string;
  amount: number;
  rate: number;
  weight: number;
  impact: number;
}

interface PersonalInflationData {
  personalRate: number;
  officialRate: number;
  difference: number;
  byCategory: PersonalInflationCategory[];
  totalExpenses: number;
  income: number;
  savingsRate: number;
  message: string;
}

interface GastosBody {
  gastos: {
    comida: number;
    alquiler: number;
    transporte: number;
    ocio: number;
    salud: number;
    educacion: number;
    otros: number;
  };
  ingresos: number;
}

// ─── Category Mapping ────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, keyof GastosBody["gastos"]> = {
  Comida: "comida",
  Vivienda: "alquiler",
  Transporte: "transporte",
  Entretenimiento: "ocio",
  Salud: "salud",
  "Educación": "educacion",
  Otros: "otros",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function InflacionPersonal({ transactions }: Props) {
  const { colors } = useTheme();

  const categoryTotals = useMemo<GastosBody>(() => {
    const gastos: GastosBody["gastos"] = {
      comida: 0,
      alquiler: 0,
      transporte: 0,
      ocio: 0,
      salud: 0,
      educacion: 0,
      otros: 0,
    };
    let ingresos = 0;

    for (const tx of transactions) {
      if (tx.type === "expense") {
        const key = CATEGORY_MAP[tx.category];
        if (key) {
          gastos[key] += tx.amount;
        } else {
          gastos.otros += tx.amount;
        }
      } else if (tx.type === "income") {
        ingresos += tx.amount;
      }
    }

    return { gastos, ingresos };
  }, [transactions]);

  const hasExpenses = useMemo(
    () => transactions.some((t) => t.type === "expense"),
    [transactions]
  );

  const { data, isLoading, isError, refetch } = useQuery<PersonalInflationData>({
    queryKey: ["personal-inflation", JSON.stringify(categoryTotals)],
    queryFn: () =>
      api.post<PersonalInflationData>("/api/inflation/inflacion-personal", categoryTotals),
    enabled: hasExpenses,
    staleTime: 5 * 60 * 1000,
  });

  if (!hasExpenses) {
    return (
      <Animated.View
        entering={FadeInDown.duration(400)}
        testID="inflacion-personal-empty"
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 24,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 32, marginBottom: 12 }}>📊</Text>
        <Text style={{ fontSize: 15, color: colors.text, fontWeight: "600", marginBottom: 6 }}>
          Sin datos de gastos
        </Text>
        <Text style={{ fontSize: 13, color: colors.text3, textAlign: "center" }}>
          Añade gastos para calcular tu inflación personal
        </Text>
      </Animated.View>
    );
  }

  if (isLoading) {
    return (
      <View
        testID="inflacion-personal-loading"
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
          Calculando inflación personal...
        </Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View
        testID="inflacion-personal-error"
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 24,
          alignItems: "center",
          gap: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.error, fontSize: 14 }}>
          Error al calcular la inflacion personal. Intentalo de nuevo.
        </Text>
        <Pressable
          onPress={() => refetch()}
          testID="inflacion-personal-retry"
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: `${colors.error}20`,
            borderRadius: 100,
          }}
        >
          <Text style={{ color: colors.error, fontSize: 13, fontWeight: "600" }}>
            Reintentar
          </Text>
        </Pressable>
      </View>
    );
  }

  const personalRate = data.personalRate ?? 0;
  const officialRate = data.officialRate ?? 0;
  const difference = data.difference ?? 0;
  const isHigher = personalRate > officialRate;
  const rateColor = isHigher ? colors.error : colors.success;

  const maxImpact = Math.max(...(data.byCategory ?? []).map((c) => Math.abs(c.impact)), 1);

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100)} testID="inflacion-personal-container">
      {/* Hero */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 11, color: colors.text3, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
          Inflación Personal
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 8 }}>
          <Text style={{ fontSize: 48, fontWeight: "800", color: rateColor, letterSpacing: -1 }}>
            {personalRate.toFixed(1)}
            <Text style={{ fontSize: 28, color: rateColor }}>%</Text>
          </Text>
        </View>
        {data.message ? (
          <Text style={{ fontSize: 13, color: colors.text2, lineHeight: 18 }}>
            {data.message}
          </Text>
        ) : null}
      </View>

      {/* Comparison */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.text3, marginBottom: 4 }}>Tu inflación</Text>
          <Text style={{ fontSize: 22, fontWeight: "700", color: rateColor }}>
            {personalRate.toFixed(1)}%
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.text3, marginBottom: 4 }}>Oficial</Text>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>
            {officialRate.toFixed(1)}%
          </Text>
        </View>
        <View
          style={{
            backgroundColor: `${Math.abs(difference) > 0 ? (isHigher ? colors.error : colors.success) : colors.text3}20`,
            borderRadius: 12,
            padding: 14,
            alignItems: "center",
            justifyContent: "center",
            minWidth: 64,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 10, color: colors.text3, marginBottom: 4 }}>Dif.</Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: isHigher ? colors.error : colors.success,
            }}
          >
            {difference > 0 ? "+" : ""}{difference.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Category Bars */}
      {(data.byCategory ?? []).length > 0 ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.text3, marginBottom: 12, letterSpacing: 0.5 }}>
            Impacto por categoría
          </Text>
          {(data.byCategory ?? []).map((cat, idx) => {
            const barWidth = (Math.abs(cat.impact) / maxImpact) * 100;
            const impactAbs = Math.abs(cat.impact ?? 0);
            const barColor =
              impactAbs > 2 ? colors.error : impactAbs > 1 ? "#FFD60A" : colors.success;
            return (
              <View key={`${cat.name}-${idx}`} style={{ marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 5,
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.text, fontWeight: "500" }}>
                    {cat.name}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <Text style={{ fontSize: 11, color: colors.text3 }}>
                      {((cat.weight ?? 0) * 100).toFixed(0)}%
                    </Text>
                    <Text style={{ fontSize: 12, color: barColor, fontWeight: "600" }}>
                      {(cat.rate ?? 0).toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    height: 4,
                    backgroundColor: `${barColor}20`,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: 4,
                      width: `${barWidth}%`,
                      backgroundColor: barColor,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>
            );
          })}

          <View
            style={{
              marginTop: 4,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 12, color: colors.text3 }}>
              Tasa de ahorro: {(data.savingsRate ?? 0).toFixed(1)}%
            </Text>
            <Text style={{ fontSize: 12, color: colors.text3 }}>
              Total: {(data.totalExpenses ?? 0).toFixed(0)}€
            </Text>
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}
