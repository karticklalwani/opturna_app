import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme, DARK } from "@/lib/theme";

type ThemeColors = typeof DARK;
import { api } from "@/lib/api/api";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  ArrowLeft,
  ArrowUp,
  X,
  ChevronRight,
  Brain,
  DollarSign,
  TrendingUp,
  Briefcase,
  Shield,
  Zap,
  Globe,
  Users,
  Droplets,
  Calculator,
} from "lucide-react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  response: string;
  intent: string;
  format: string;
}

interface LoanSimResult {
  availableLiquidity?: number;
  monthlyPayment?: number;
  totalInterestCost?: number;
  riskLevel?: string;
  comparison?: { pignorar: Record<string, unknown>; vender: Record<string, unknown> };
  riskWarnings?: string[];
  disclaimer?: string;
  [key: string]: unknown;
}

interface Suggestion {
  id?: string;
  title: string;
  description?: string;
  query?: string;
  category?: string;
  intent?: string;
}

// ─── Intent / Format mappings ─────────────────────────────────────────────────

const intentColors: Record<string, string> = {
  finances: "#4ADE80",
  savings: "#60A5FA",
  investment: "#FBBF24",
  business: "#A78BFA",
  fiscal: "#F87171",
  productivity: "#34D399",
  discover: "#FB923C",
  collaborations: "#E879F9",
  liquidity: "#4ADE80",
  general: "#9CA3AF",
};

const intentLabels: Record<string, string> = {
  finances: "Finanzas",
  savings: "Ahorro",
  investment: "Inversión",
  business: "Negocio",
  fiscal: "Fiscal",
  productivity: "Productividad",
  discover: "Descubrir",
  collaborations: "Colaboraciones",
  liquidity: "Liquidez",
  general: "General",
};

const intentIcons: Record<string, React.ReactNode> = {
  finances: <DollarSign size={12} color="#4ADE80" />,
  savings: <Shield size={12} color="#60A5FA" />,
  investment: <TrendingUp size={12} color="#FBBF24" />,
  business: <Briefcase size={12} color="#A78BFA" />,
  fiscal: <Shield size={12} color="#F87171" />,
  productivity: <Zap size={12} color="#34D399" />,
  discover: <Globe size={12} color="#FB923C" />,
  collaborations: <Users size={12} color="#E879F9" />,
  liquidity: <Droplets size={12} color="#4ADE80" />,
  general: <Brain size={12} color="#9CA3AF" />,
};

const riskColors: Record<string, string> = {
  bajo: "#4ADE80",
  medio: "#FBBF24",
  alto: "#F87171",
  muy_alto: "#EF4444",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M €`;
  if (amount >= 1_000) return `${amount.toLocaleString("es-ES", { maximumFractionDigits: 0 })} €`;
  return `${amount.toFixed(2)} €`;
}

// ─── Suggestion default data ──────────────────────────────────────────────────

const defaultSuggestions: Suggestion[] = [
  { title: "¿Cómo optimizar mi cartera?", intent: "investment", query: "¿Cómo puedo optimizar mi cartera de inversiones este año?" },
  { title: "Estrategia de ahorro", intent: "savings", query: "Dame una estrategia de ahorro para los próximos 6 meses" },
  { title: "Pignorar vs vender activos", intent: "liquidity", query: "¿Cuándo conviene pignorar activos en lugar de venderlos?" },
  { title: "Reducir carga fiscal", intent: "fiscal", query: "¿Qué estrategias legales existen para reducir la carga fiscal?" },
  { title: "Diversificación inteligente", intent: "investment", query: "¿Cómo diversificar mis inversiones de forma inteligente?" },
  { title: "Planificar negocio", intent: "business", query: "¿Cuáles son los pasos clave para planificar un negocio rentable?" },
  { title: "Gestión de liquidez", intent: "finances", query: "¿Cómo mejorar mi gestión de liquidez personal?" },
  { title: "Colaboraciones rentables", intent: "collaborations", query: "¿Cómo identificar colaboraciones financieramente rentables?" },
];

// ─── Loan Simulator Modal ─────────────────────────────────────────────────────

function LoanSimulatorModal({
  visible,
  onClose,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
}) {
  const [assetValue, setAssetValue] = useState<string>("");
  const [ltv, setLtv] = useState<string>("60");
  const [interestRate, setInterestRate] = useState<string>("8");
  const [durationMonths, setDurationMonths] = useState<string>("12");
  const [assetName, setAssetName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LoanSimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!assetValue || isNaN(Number(assetValue))) {
      setError("Introduce un valor de activo válido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const simResult = await api.post<LoanSimResult>("/api/opturna-ai/simulate/loan", {
        assetValue: Number(assetValue),
        ltv: Number(ltv) / 100,
        interestRate: Number(interestRate),
        durationMonths: Number(durationMonths),
        assetName: assetName || undefined,
      });
      setResult(simResult);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al calcular";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setAssetValue("");
    setLtv("60");
    setInterestRate("8");
    setDurationMonths("12");
    setAssetName("");
  };

  const riskLevel = result?.riskLevel as string | undefined;
  const riskColor = riskLevel ? (riskColors[riskLevel] ?? "#9CA3AF") : "#9CA3AF";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Calculator size={20} color={colors.accent} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Simulador de Pignoramiento</Text>
            </View>
            <Pressable
              onPress={onClose}
              testID="simulator-close-button"
              style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.bg4, alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} color={colors.text2} />
            </Pressable>
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {!result ? (
            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 13, color: colors.text3, marginBottom: 4 }}>
                Calcula cuánta liquidez puedes obtener pignorando un activo sin venderlo.
              </Text>

              {/* Asset Value */}
              <View>
                <Text style={{ fontSize: 12, color: colors.text3, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8 }}>VALOR DEL ACTIVO (€)</Text>
                <TextInput
                  value={assetValue}
                  onChangeText={setAssetValue}
                  placeholder="Ej: 50000"
                  placeholderTextColor={colors.text4}
                  keyboardType="numeric"
                  testID="sim-asset-value"
                  style={{
                    backgroundColor: colors.bg3,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>

              {/* Asset Name */}
              <View>
                <Text style={{ fontSize: 12, color: colors.text3, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8 }}>NOMBRE DEL ACTIVO (opcional)</Text>
                <TextInput
                  value={assetName}
                  onChangeText={setAssetName}
                  placeholder="Ej: Bitcoin, Acciones Apple..."
                  placeholderTextColor={colors.text4}
                  testID="sim-asset-name"
                  style={{
                    backgroundColor: colors.bg3,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>

              {/* LTV */}
              <View>
                <Text style={{ fontSize: 12, color: colors.text3, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8 }}>LTV — LOAN TO VALUE (%)</Text>
                <TextInput
                  value={ltv}
                  onChangeText={setLtv}
                  placeholder="60"
                  placeholderTextColor={colors.text4}
                  keyboardType="numeric"
                  testID="sim-ltv"
                  style={{
                    backgroundColor: colors.bg3,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>

              {/* Interest Rate */}
              <View>
                <Text style={{ fontSize: 12, color: colors.text3, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8 }}>TIPO DE INTERÉS ANUAL (%)</Text>
                <TextInput
                  value={interestRate}
                  onChangeText={setInterestRate}
                  placeholder="8"
                  placeholderTextColor={colors.text4}
                  keyboardType="numeric"
                  testID="sim-interest-rate"
                  style={{
                    backgroundColor: colors.bg3,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>

              {/* Duration */}
              <View>
                <Text style={{ fontSize: 12, color: colors.text3, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8 }}>DURACIÓN (MESES)</Text>
                <TextInput
                  value={durationMonths}
                  onChangeText={setDurationMonths}
                  placeholder="12"
                  placeholderTextColor={colors.text4}
                  keyboardType="numeric"
                  testID="sim-duration"
                  style={{
                    backgroundColor: colors.bg3,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>

              {error ? (
                <Text style={{ color: colors.error, fontSize: 13, textAlign: "center" }}>{error}</Text>
              ) : null}

              <Pressable
                onPress={handleCalculate}
                disabled={loading}
                testID="sim-calculate-button"
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginTop: 8,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={{ color: "#000", fontSize: 16, fontWeight: "700" }}>Calcular</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(300)} style={{ gap: 14 }}>
              {/* Liquidity card */}
              <View style={{ backgroundColor: colors.bg3, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: colors.text3, fontWeight: "600", letterSpacing: 0.8, marginBottom: 8 }}>LIQUIDEZ DISPONIBLE</Text>
                <Text style={{ fontSize: 36, fontWeight: "800", color: colors.accent, letterSpacing: -1 }}>
                  {result.availableLiquidity !== undefined ? formatCurrency(result.availableLiquidity) : "—"}
                </Text>
                {assetName ? (
                  <Text style={{ fontSize: 13, color: colors.text3, marginTop: 4 }}>Activo: {assetName}</Text>
                ) : null}
              </View>

              {/* Monthly payment + cost row */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: colors.bg3, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 11, color: colors.text3, fontWeight: "600", letterSpacing: 0.5, marginBottom: 6 }}>PAGO MENSUAL</Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>
                    {result.monthlyPayment !== undefined ? formatCurrency(result.monthlyPayment) : "—"}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.bg3, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 11, color: colors.text3, fontWeight: "600", letterSpacing: 0.5, marginBottom: 6 }}>COSTE TOTAL</Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#F87171" }}>
                    {result.totalInterestCost !== undefined ? formatCurrency(result.totalInterestCost) : "—"}
                  </Text>
                </View>
              </View>

              {/* Risk level */}
              {riskLevel ? (
                <View style={{ backgroundColor: colors.bg3, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, color: colors.text2, fontWeight: "600" }}>Nivel de riesgo</Text>
                  <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: `${riskColor}20` }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: riskColor }}>
                      {riskLevel.replace("_", " ").toUpperCase()}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Risk warnings */}
              {result.riskWarnings && Array.isArray(result.riskWarnings) && result.riskWarnings.length > 0 ? (
                <View style={{ backgroundColor: colors.bg3, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.text3, fontWeight: "600", letterSpacing: 0.5 }}>ADVERTENCIAS</Text>
                  {(result.riskWarnings as string[]).map((w, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                      <Text style={{ color: "#FBBF24", fontSize: 12, marginTop: 1 }}>•</Text>
                      <Text style={{ fontSize: 13, color: colors.text2, flex: 1, lineHeight: 18 }}>{w}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Disclaimer */}
              {result.disclaimer ? (
                <Text style={{ fontSize: 11, color: colors.text4, textAlign: "center", lineHeight: 16, paddingHorizontal: 8 }}>
                  {result.disclaimer as string}
                </Text>
              ) : null}

              {/* Reset button */}
              <Pressable
                onPress={handleReset}
                testID="sim-reset-button"
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 }}
              >
                <Text style={{ color: colors.text2, fontSize: 15, fontWeight: "600" }}>Nueva simulación</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OpturnAIScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [query, setQuery] = useState<string>("");
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // Load suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const data = await api.get<Suggestion[]>("/api/opturna-ai/suggestions");
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
        } else {
          setSuggestions(defaultSuggestions);
        }
      } catch {
        setSuggestions(defaultSuggestions);
      } finally {
        setSuggestionsLoaded(true);
      }
    };
    fetchSuggestions();
  }, []);

  const handleSend = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q || loading) return;

    setQuery("");
    setLoading(true);
    setErrorMsg(null);

    const newHistory: ConversationMessage[] = [
      ...conversationHistory,
      { role: "user", content: q },
    ];

    try {
      const result = await api.post<AIResponse>("/api/opturna-ai/query", {
        query: q,
        conversationHistory: conversationHistory.slice(-10),
      });

      const assistantMsg: ConversationMessage = { role: "assistant", content: result.response };
      const updatedHistory = [...newHistory, assistantMsg];
      setConversationHistory(updatedHistory.slice(-12));
      setCurrentResponse(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al conectar con Opturna AI";
      setErrorMsg(msg);
      // still push user message to history so they see context
      setConversationHistory(newHistory.slice(-12));
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  const handleSuggestionPress = (s: Suggestion) => {
    const q = s.query ?? s.title;
    handleSend(q);
  };

  const intentColor = currentResponse
    ? (intentColors[currentResponse.intent] ?? "#9CA3AF")
    : "#9CA3AF";
  const intentLabel = currentResponse
    ? (intentLabels[currentResponse.intent] ?? currentResponse.intent)
    : "";

  const hasConversation = conversationHistory.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="opturna-ai-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              testID="back-button"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.bg3,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={18} color={colors.text2} />
            </Pressable>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, letterSpacing: -0.4 }}>
                  Opturna AI
                </Text>
                {currentResponse ? (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: `${intentColor}20`,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: intentColor }}>
                      {intentLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ fontSize: 12, color: colors.text3, marginTop: 1 }}>
                Sistema de Decisión Inteligente
              </Text>
            </View>

            <Pressable
              onPress={() => setShowSimulator(true)}
              testID="open-simulator-button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 10,
                backgroundColor: `${colors.accent}15`,
                borderWidth: 1,
                borderColor: `${colors.accent}30`,
              }}
            >
              <Calculator size={14} color={colors.accent} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>Simulador</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Main content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {!hasConversation ? (
            /* Empty state — suggestion grid */
            <Animated.View entering={FadeIn.duration(400)}>
              {/* Welcome block */}
              <View
                style={{
                  backgroundColor: colors.bg3,
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 20,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    backgroundColor: `${colors.accent}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Brain size={28} color={colors.accent} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 6 }}>
                  ¿En qué puedo ayudarte?
                </Text>
                <Text style={{ fontSize: 13, color: colors.text3, textAlign: "center", lineHeight: 18 }}>
                  Analizo tu situación financiera y te ofrezco decisiones estratégicas personalizadas.
                </Text>
              </View>

              {/* Suggestions grid */}
              {suggestionsLoaded ? (
                <View>
                  <Text style={{ fontSize: 11, color: colors.text3, fontWeight: "600", letterSpacing: 0.8, marginBottom: 12 }}>
                    CONSULTAS SUGERIDAS
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {suggestions.map((s, index) => {
                      const sIntent = s.intent ?? s.category ?? "general";
                      const sColor = intentColors[sIntent] ?? "#9CA3AF";
                      const sLabel = intentLabels[sIntent] ?? sIntent;
                      return (
                        <Animated.View
                          key={s.id ?? index}
                          entering={FadeInDown.duration(300).delay(index * 40)}
                          style={{ width: "47.5%" }}
                        >
                          <Pressable
                            onPress={() => handleSuggestionPress(s)}
                            testID={`suggestion-${index}`}
                            style={{
                              backgroundColor: colors.bg3,
                              borderRadius: 14,
                              padding: 14,
                              borderWidth: 1,
                              borderColor: colors.border,
                              gap: 8,
                            }}
                          >
                            {/* Category tag */}
                            <View
                              style={{
                                alignSelf: "flex-start",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                                paddingHorizontal: 7,
                                paddingVertical: 3,
                                borderRadius: 6,
                                backgroundColor: `${sColor}18`,
                              }}
                            >
                              {intentIcons[sIntent] ?? null}
                              <Text style={{ fontSize: 10, fontWeight: "600", color: sColor }}>
                                {sLabel}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, lineHeight: 17 }}>
                              {s.title}
                            </Text>
                            {s.description ? (
                              <Text style={{ fontSize: 11, color: colors.text3, lineHeight: 15 }} numberOfLines={2}>
                                {s.description}
                              </Text>
                            ) : null}
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                  <ActivityIndicator color={colors.accent} />
                </View>
              )}
            </Animated.View>
          ) : (
            /* Conversation state */
            <View style={{ gap: 14 }}>
              {conversationHistory.map((msg, index) => {
                if (msg.role === "user") {
                  return (
                    <Animated.View
                      key={index}
                      entering={FadeInDown.duration(250)}
                      style={{ alignSelf: "flex-end", maxWidth: "80%" }}
                    >
                      <View
                        style={{
                          backgroundColor: colors.bg4,
                          borderRadius: 16,
                          borderBottomRightRadius: 4,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>{msg.content}</Text>
                      </View>
                    </Animated.View>
                  );
                }

                // Assistant message: last one gets the full structured card
                const isLast = index === conversationHistory.length - 1;
                const correspondingResponse =
                  isLast && currentResponse ? currentResponse : null;

                const msgIntent = correspondingResponse?.intent ?? "general";
                const msgColor = intentColors[msgIntent] ?? "#9CA3AF";
                const msgLabel = intentLabels[msgIntent] ?? msgIntent;
                const msgFormat = correspondingResponse?.format ?? "";

                return (
                  <Animated.View
                    key={index}
                    entering={FadeInDown.duration(300)}
                    style={{ alignSelf: "flex-start", width: "100%" }}
                  >
                    <View
                      style={{
                        backgroundColor: colors.bg3,
                        borderRadius: 16,
                        borderTopLeftRadius: 4,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                        gap: 10,
                      }}
                    >
                      {/* Badges row */}
                      {correspondingResponse ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              backgroundColor: `${msgColor}18`,
                            }}
                          >
                            {intentIcons[msgIntent] ?? null}
                            <Text style={{ fontSize: 11, fontWeight: "600", color: msgColor }}>{msgLabel}</Text>
                          </View>
                          {msgFormat ? (
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 6,
                                backgroundColor: colors.bg4,
                                borderWidth: 1,
                                borderColor: colors.border,
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.text3 }}>{msgFormat}</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}

                      {/* Response text */}
                      <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22 }}>
                        {msg.content}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}

              {/* Loading indicator */}
              {loading ? (
                <Animated.View entering={FadeIn.duration(200)} style={{ alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator color={colors.accent} size="small" />
                    <Text style={{ fontSize: 13, color: colors.text3 }}>Analizando...</Text>
                  </View>
                </Animated.View>
              ) : null}

              {/* Error */}
              {errorMsg ? (
                <View style={{ backgroundColor: `${colors.error}15`, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: `${colors.error}30` }}>
                  <Text style={{ fontSize: 13, color: colors.error }}>{errorMsg}</Text>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>

        {/* Bottom input bar */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Platform.OS === "ios" ? 28 : 16,
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {/* Loading indicator for initial (empty state) queries */}
          {loading && !hasConversation ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <ActivityIndicator color={colors.accent} size="small" />
              <Text style={{ fontSize: 13, color: colors.text3 }}>Opturna AI está analizando...</Text>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 10,
              backgroundColor: colors.bg3,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              paddingLeft: 16,
              paddingRight: 6,
              paddingVertical: 6,
            }}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Consulta a Opturna AI..."
              placeholderTextColor={colors.text4}
              multiline
              maxLength={1000}
              testID="ai-input"
              style={{
                flex: 1,
                fontSize: 15,
                color: colors.text,
                maxHeight: 100,
                paddingTop: Platform.OS === "ios" ? 6 : 4,
                paddingBottom: Platform.OS === "ios" ? 6 : 4,
              }}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={() => handleSend()}
              disabled={loading || !query.trim()}
              testID="send-button"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: loading || !query.trim() ? colors.bg4 : colors.accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: loading || !query.trim() ? 0.5 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <ArrowUp size={18} color={loading || !query.trim() ? colors.text3 : "#000"} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Loan Simulator Modal */}
      <LoanSimulatorModal
        visible={showSimulator}
        onClose={() => setShowSimulator(false)}
        colors={colors}
      />
    </View>
  );
}
