import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info, AlertCircle } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: "inflacion" | "euribor" | "mercados" | "vivienda" | "energia" | "economia";
  impact: "alto" | "medio" | "bajo";
  change: number;
  trend: "up" | "down" | "stable";
  date: string;
  icon: string;
}

interface Alert {
  id: string;
  message: string;
  severity: "critical" | "warning" | "info";
  category: string;
}

interface NewsData {
  news: NewsItem[];
  alerts: Alert[];
  euribor: {
    current: number;
    previous: number;
    change: number;
    trend: string;
    monthly: number[];
  };
  lastUpdated: string;
}

type CategoryFilter =
  | "todos"
  | "inflacion"
  | "euribor"
  | "mercados"
  | "vivienda"
  | "energia"
  | "economia";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: 8, backgroundColor: "#1F1F1F", opacity },
        style,
      ]}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NoticiasEconomicas() {
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("todos");
  const [collapsedAlerts, setCollapsedAlerts] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["noticias-economicas"],
    queryFn: () => api.get<NewsData>("/api/advanced/news"),
    staleTime: 5 * 60 * 1000,
  });

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "inflacion", label: "Inflación" },
    { key: "euribor", label: "Euribor" },
    { key: "mercados", label: "Mercados" },
    { key: "vivienda", label: "Vivienda" },
    { key: "energia", label: "Energía" },
    { key: "economia", label: "Economía" },
  ];

  const filteredNews =
    activeCategory === "todos"
      ? data?.news ?? []
      : (data?.news ?? []).filter((n) => n.category === activeCategory);

  function getAlertColors(severity: Alert["severity"]) {
    if (severity === "critical") return { bg: "#EF444420", border: "#EF4444", text: "#EF4444" };
    if (severity === "warning") return { bg: "#F9731620", border: "#F97316", text: "#F97316" };
    return { bg: "#3B82F620", border: "#3B82F6", text: "#3B82F6" };
  }

  function getChangeColor(change: number, category: string) {
    const isGoodWhenDown = ["inflacion", "euribor", "energia"].includes(category);
    if (isGoodWhenDown) {
      return change < 0 ? "#4ADE80" : change > 0 ? "#EF4444" : colors.text3;
    }
    return change > 0 ? "#4ADE80" : change < 0 ? "#EF4444" : colors.text3;
  }

  function getImpactBadgeColor(impact: NewsItem["impact"]) {
    if (impact === "alto") return { bg: "#EF444420", text: "#EF4444" };
    if (impact === "medio") return { bg: "#F9731620", text: "#F97316" };
    return { bg: "#4ADE8020", text: "#4ADE80" };
  }

  function formatDate(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    } catch {
      return dateStr;
    }
  }

  function toggleAlert(id: string) {
    setCollapsedAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View testID="noticias-loading" style={{ gap: 12 }}>
        <SkeletonBlock width="100%" height={120} />
        <SkeletonBlock width="100%" height={80} />
        <SkeletonBlock width="100%" height={110} />
        <SkeletonBlock width="100%" height={110} />
      </View>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View
        testID="noticias-error"
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
        <AlertTriangle size={28} color="#EF4444" />
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
          Error al cargar noticias
        </Text>
        <Pressable
          onPress={() => refetch()}
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

  const euribor = data?.euribor;
  const euriborUp = (euribor?.change ?? 0) > 0;
  const euriborColor = euriborUp ? "#EF4444" : "#4ADE80";

  return (
    <View testID="noticias-economicas" style={{ gap: 16, paddingBottom: 8 }}>
      {/* Euribor hero card */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: `${euriborColor}30`,
          padding: 20,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5 }}>
              EURIBOR 12 MESES
            </Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              <Text style={{ color: colors.text, fontSize: 36, fontWeight: "800", letterSpacing: -1 }}>
                {euribor?.current?.toFixed(2) ?? "—"}%
              </Text>
              {euriborUp ? (
                <TrendingUp size={22} color={euriborColor} style={{ marginBottom: 6 }} />
              ) : (
                <TrendingDown size={22} color={euriborColor} style={{ marginBottom: 6 }} />
              )}
            </View>
            <Text style={{ color: euriborColor, fontSize: 13, fontWeight: "600" }}>
              {euribor?.change !== undefined
                ? `${euribor.change > 0 ? "+" : ""}${euribor.change.toFixed(3)}% vs mes anterior`
                : "—"}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: `${euriborColor}15`,
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: `${euriborColor}30`,
            }}
          >
            <Text style={{ fontSize: 24 }}>📊</Text>
          </View>
        </View>
        {euribor?.previous !== undefined && (
          <Text style={{ color: colors.text3, fontSize: 11, marginTop: 8 }}>
            Mes anterior: {euribor.previous.toFixed(2)}%
          </Text>
        )}
      </View>

      {/* Alert banners */}
      {(data?.alerts ?? []).length > 0 && (
        <View style={{ gap: 8 }}>
          {(data?.alerts ?? []).map((alert) => {
            const ac = getAlertColors(alert.severity);
            const isCollapsed = collapsedAlerts.has(alert.id);
            const Icon = alert.severity === "critical" ? AlertCircle : alert.severity === "warning" ? AlertTriangle : Info;
            return (
              <Pressable
                key={alert.id}
                onPress={() => toggleAlert(alert.id)}
                testID={`alert-${alert.id}`}
                style={{
                  backgroundColor: ac.bg,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: `${ac.border}50`,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <Icon size={16} color={ac.text} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: ac.text, fontSize: 13, fontWeight: "600", lineHeight: 18 }}
                    numberOfLines={isCollapsed ? 2 : undefined}
                  >
                    {alert.message}
                  </Text>
                  <Text style={{ color: `${ac.text}90`, fontSize: 10, marginTop: 2, textTransform: "capitalize" }}>
                    {alert.category} · {isCollapsed ? "Ver más" : "Ver menos"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Category filter row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setActiveCategory(cat.key)}
              testID={`category-filter-${cat.key}`}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 100,
                backgroundColor: isActive ? colors.accent : `${colors.accent}10`,
                borderWidth: 1,
                borderColor: isActive ? colors.accent : colors.border,
              }}
            >
              <Text
                style={{
                  color: isActive ? "#000" : colors.text3,
                  fontSize: 12,
                  fontWeight: isActive ? "700" : "500",
                }}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* News cards */}
      <View style={{ gap: 12 }}>
        {filteredNews.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 32,
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 28 }}>📰</Text>
            <Text style={{ color: colors.text3, fontSize: 14, marginTop: 8 }}>
              Sin noticias en esta categoría
            </Text>
          </View>
        ) : (
          filteredNews.map((item) => {
            const changeColor = getChangeColor(item.change, item.category);
            const impactBadge = getImpactBadgeColor(item.impact);
            const TrendIcon =
              item.trend === "up" ? TrendingUp : item.trend === "down" ? TrendingDown : Minus;

            return (
              <View
                key={item.id}
                testID={`news-card-${item.id}`}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                  {/* Icon circle */}
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: `${changeColor}15`,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: `${changeColor}25`,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                  </View>

                  <View style={{ flex: 1, gap: 3 }}>
                    <Text
                      style={{ color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 19 }}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{ color: colors.text3, fontSize: 12, lineHeight: 17 }}
                      numberOfLines={2}
                    >
                      {item.summary}
                    </Text>
                  </View>
                </View>

                {/* Bottom row */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {/* Category badge */}
                  <View
                    style={{
                      backgroundColor: `${colors.accent}15`,
                      borderRadius: 100,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "600", textTransform: "capitalize" }}>
                      {item.category}
                    </Text>
                  </View>

                  {/* Impact badge */}
                  <View
                    style={{
                      backgroundColor: impactBadge.bg,
                      borderRadius: 100,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ color: impactBadge.text, fontSize: 10, fontWeight: "600", textTransform: "capitalize" }}>
                      Impacto {item.impact}
                    </Text>
                  </View>

                  {/* Change */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <TrendIcon size={12} color={changeColor} />
                    <Text style={{ color: changeColor, fontSize: 12, fontWeight: "700" }}>
                      {item.change > 0 ? "+" : ""}{item.change.toFixed(2)}%
                    </Text>
                  </View>

                  <View style={{ flex: 1 }} />

                  {/* Date */}
                  <Text style={{ color: colors.text4, fontSize: 10 }}>
                    {formatDate(item.date)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
