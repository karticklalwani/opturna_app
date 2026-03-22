import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  ArrowRight,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CountryInfo {
  code: string;
  name: string;
  rate: number;
  flag: string;
  trend?: string;
  region?: string;
}

interface CountriesResponse {
  countries: CountryInfo[];
}

interface InflationRealTimeData {
  spain: number;
  eurozone: number;
  world: number;
  lastUpdated: string;
}

type Region = "Todos" | "Europa" | "America" | "Asia" | "Africa" | "Oceania";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getRateColor(rate: number): string {
  if (rate < 3) return "#4ADE80";
  if (rate < 5) return "#FFD60A";
  if (rate < 10) return "#FF9500";
  return "#EF4444";
}

function getTrendIcon(trend?: string) {
  if (trend === "up") return TrendingUp;
  if (trend === "down") return TrendingDown;
  return Minus;
}

function getTrendColor(trend: string | undefined, colors: { accent: string; error: string; text3: string }): string {
  if (trend === "up") return colors.error;
  if (trend === "down") return colors.accent;
  return colors.text3;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ComparadorPaises() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<Region>("Todos");
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);

  const REGIONS: Region[] = ["Todos", "Europa", "America", "Asia", "Africa", "Oceania"];

  // Fetch countries
  const {
    data: countriesData,
    isLoading: loadingCountries,
  } = useQuery<CountriesResponse>({
    queryKey: ["inflation-countries-comp"],
    queryFn: () => api.get<CountriesResponse>("/api/inflation/countries"),
  });

  // Fetch real-time for Spain/EU/World averages
  const { data: realTimeData } = useQuery<InflationRealTimeData>({
    queryKey: ["inflation-realtime-comp"],
    queryFn: () => api.get<InflationRealTimeData>("/api/inflation/real-time"),
  });

  const countries = countriesData?.countries ?? [];

  const filteredCountries = useMemo(() => {
    let list = countries;
    if (selectedRegion !== "Todos") {
      list = list.filter((c) => {
        const region = (c.region ?? "").toLowerCase();
        const regionMap: Record<string, string[]> = {
          europa: ["europe", "europa"],
          america: ["america", "americas", "north america", "south america"],
          asia: ["asia"],
          africa: ["africa"],
          oceania: ["oceania"],
        };
        const keys = regionMap[selectedRegion.toLowerCase()] ?? [];
        return keys.some((k) => region.includes(k));
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.rate - a.rate);
  }, [countries, selectedRegion, searchQuery]);

  const spainRate = realTimeData?.spain ?? 0;

  if (loadingCountries) {
    return (
      <View
        testID="comparador-loading"
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
        }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ color: colors.text3, marginTop: 12, fontSize: 13 }}>
          Cargando datos de paises...
        </Text>
      </View>
    );
  }

  return (
    <View testID="comparador-paises-container" style={{ gap: 12 }}>
      {/* Averages Card */}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Globe size={18} color={colors.accent} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.3 }}>
              Comparador de Paises
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* EU Average */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.bg3,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>🇪🇺</Text>
              <Text style={{ color: colors.text3, fontSize: 10, marginBottom: 4 }}>
                Media UE
              </Text>
              <Text
                style={{
                  color: getRateColor(realTimeData?.eurozone ?? 0),
                  fontSize: 20,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                }}
              >
                {(realTimeData?.eurozone ?? 0).toFixed(1)}%
              </Text>
            </View>

            {/* World Average */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.bg3,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>🌍</Text>
              <Text style={{ color: colors.text3, fontSize: 10, marginBottom: 4 }}>
                Media Mundial
              </Text>
              <Text
                style={{
                  color: getRateColor(realTimeData?.world ?? 0),
                  fontSize: 20,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                }}
              >
                {(realTimeData?.world ?? 0).toFixed(1)}%
              </Text>
            </View>

            {/* Spain */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.bg3,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>🇪🇸</Text>
              <Text style={{ color: colors.text3, fontSize: 10, marginBottom: 4 }}>
                Espana
              </Text>
              <Text
                style={{
                  color: getRateColor(spainRate),
                  fontSize: 20,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                }}
              >
                {spainRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Search & Filters */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Search Bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.bg3,
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Search size={16} color={colors.text3} />
            <TextInput
              testID="comparador-search"
              style={{
                flex: 1,
                padding: 12,
                color: colors.text,
                fontSize: 14,
              }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar pais..."
              placeholderTextColor={colors.text4}
            />
          </View>

          {/* Region Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {REGIONS.map((region) => (
                <Pressable
                  key={region}
                  testID={`region-tab-${region.toLowerCase()}`}
                  onPress={() => setSelectedRegion(region)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: selectedRegion === region ? colors.accent : colors.bg3,
                    borderWidth: 1,
                    borderColor: selectedRegion === region ? colors.accent : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: selectedRegion === region ? colors.bg : colors.text2,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {region}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </Animated.View>

      {/* Country List */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          <View style={{ padding: 16, paddingBottom: 8 }}>
            <Text style={{ color: colors.text3, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {filteredCountries.length} paises
            </Text>
          </View>

          {filteredCountries.length === 0 ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: colors.text3, fontSize: 13 }}>
                No se encontraron paises
              </Text>
            </View>
          ) : null}

          {filteredCountries.map((country, idx) => {
            const TrendIcon = getTrendIcon(country.trend);
            const trendColor = getTrendColor(country.trend, colors);

            return (
              <Pressable
                key={country.code}
                testID={`country-item-${country.code}`}
                onPress={() =>
                  setSelectedCountry(
                    selectedCountry?.code === country.code ? null : country
                  )
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderTopWidth: idx > 0 ? 1 : 0,
                  borderTopColor: colors.border,
                  backgroundColor:
                    selectedCountry?.code === country.code
                      ? `${colors.accent}08`
                      : "transparent",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 20 }}>{country.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                      numberOfLines={1}
                    >
                      {country.name}
                    </Text>
                    <Text style={{ color: colors.text4, fontSize: 11 }}>
                      {country.code}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <TrendIcon size={14} color={trendColor} />
                  <Text
                    style={{
                      color: getRateColor(country.rate),
                      fontSize: 18,
                      fontWeight: "800",
                      letterSpacing: -0.5,
                      minWidth: 60,
                      textAlign: "right",
                    }}
                  >
                    {country.rate.toFixed(1)}%
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Detail Comparison Card */}
      {selectedCountry ? (
        <Animated.View entering={FadeInDown.duration(300)}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.accent,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 24 }}>{selectedCountry.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                  {selectedCountry.name}
                </Text>
                <Text style={{ color: colors.text3, fontSize: 11 }}>
                  Comparado con Espana
                </Text>
              </View>
            </View>

            {/* Comparison */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.bg3,
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.text3, fontSize: 10, marginBottom: 4 }}>
                  {selectedCountry.name}
                </Text>
                <Text
                  style={{
                    color: getRateColor(selectedCountry.rate),
                    fontSize: 24,
                    fontWeight: "800",
                    letterSpacing: -0.5,
                  }}
                >
                  {selectedCountry.rate.toFixed(1)}%
                </Text>
              </View>

              <View style={{ justifyContent: "center" }}>
                <ArrowRight size={16} color={colors.text4} />
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.bg3,
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.text3, fontSize: 10, marginBottom: 4 }}>
                  Espana
                </Text>
                <Text
                  style={{
                    color: getRateColor(spainRate),
                    fontSize: 24,
                    fontWeight: "800",
                    letterSpacing: -0.5,
                  }}
                >
                  {spainRate.toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* Difference */}
            {(() => {
              const diff = selectedCountry.rate - spainRate;
              const isHigher = diff > 0;
              return (
                <View
                  style={{
                    backgroundColor: isHigher ? `${colors.error}10` : `${colors.accent}10`,
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 4 }}>
                    Diferencia
                  </Text>
                  <Text
                    style={{
                      color: isHigher ? colors.error : colors.accent,
                      fontSize: 20,
                      fontWeight: "800",
                    }}
                  >
                    {isHigher ? "+" : ""}{diff.toFixed(1)} pp
                  </Text>
                  <Text style={{ color: colors.text3, fontSize: 11, marginTop: 4 }}>
                    {isHigher
                      ? `${selectedCountry.name} tiene mayor inflacion`
                      : diff < 0
                      ? `${selectedCountry.name} tiene menor inflacion`
                      : "Misma tasa de inflacion"}
                  </Text>
                </View>
              );
            })()}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
