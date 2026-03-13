import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Radio,
  Mic,
  X,
  Eye,
  Send,
  MessageCircle,
  Wifi,
  WifiOff,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTheme } from "@/lib/theme";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useSession } from "@/lib/auth/use-session";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const LIVE_RED = "#FF3B30";
const LIVE_GREEN = "#4ADE80";

const CATEGORY_COLORS: Record<string, string> = {
  finanzas: "#4ADE80",
  desarrollo_personal: "#3B82F6",
  filosofia: "#A855F7",
  negocios: "#F59E0B",
  disciplina: "#EF4444",
};

const CATEGORY_LABELS: Record<string, string> = {
  finanzas: "Finanzas",
  desarrollo_personal: "Desarrollo Personal",
  filosofia: "Filosofía",
  negocios: "Negocios",
  disciplina: "Disciplina",
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

const USER_COLORS = [
  "#4ADE80", "#3B82F6", "#A855F7", "#F59E0B", "#EC4899", "#06B6D4", "#EF4444",
];

// ─── Types ─────────────────────────────────────────────────────────────────────

type LiveStream = {
  id: string;
  userId: string;
  title: string;
  category: string;
  status: "live" | "ended";
  viewerCount: number;
  peakViewers: number;
  startedAt: string;
  endedAt?: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
};

type WsMessage =
  | { type: "chat"; id: string; userId: string; userName: string; userImage?: string; content: string; createdAt: string }
  | { type: "viewer_count"; count: number }
  | { type: "stream_ended" }
  | { type: "error"; message: string };

type ChatItem = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

// ─── Pulsing Dot ───────────────────────────────────────────────────────────────

function PulsingDot({ color, size = 8 }: { color: string; size?: number }) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, animStyle]}
    />
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: `${color}22`,
      borderWidth: 1.5, borderColor: `${color}55`,
      alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ color, fontWeight: "800", fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

// ─── Broadcast Screen ─────────────────────────────────────────────────────────

function BroadcastScreen({
  stream,
  currentUserId,
  currentUserName,
  currentUserImage,
  onEnd,
}: {
  stream: LiveStream;
  currentUserId: string;
  currentUserName: string;
  currentUserImage?: string;
  onEnd: () => void;
}) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const accentColor = CATEGORY_COLORS[stream.category] ?? "#4ADE80";

  const endMutation = useMutation({
    mutationFn: () => api.patch<LiveStream>(`/api/live/${stream.id}/end`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-streams"] });
      onEnd();
    },
    onError: () => {
      setIsEnding(false);
    },
  });

  const pulseScale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  // Connect WebSocket
  useEffect(() => {
    const wsBase = process.env.EXPO_PUBLIC_BACKEND_URL
      ?.replace("https://", "wss://")
      .replace("http://", "ws://");

    const params = new URLSearchParams({
      userId: currentUserId,
      userName: currentUserName,
      ...(currentUserImage ? { userImage: currentUserImage } : {}),
    });

    const wsUrl = `${wsBase}/ws/live/${stream.id}?${params.toString()}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    ws.onmessage = (event) => {
      try {
        const data: WsMessage = JSON.parse(event.data as string);
        if (data.type === "chat") {
          setMessages((prev) => {
            const next: ChatItem[] = [...prev, {
              id: data.id,
              userId: data.userId,
              userName: data.userName,
              content: data.content,
              createdAt: data.createdAt,
            }];
            return next.slice(-60);
          });
        } else if (data.type === "viewer_count") {
          setViewerCount(data.count);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [stream.id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "chat", content: chatInput.trim() }));
    }
    setChatInput("");
  };

  const handleEnd = () => {
    setIsEnding(true);
    endMutation.mutate();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Background gradient */}
      <LinearGradient
        colors={["#050E08", "#020505", "#000000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Subtle grid pattern overlay */}
      <View style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03,
        borderWidth: 1, borderColor: LIVE_GREEN,
      }} />

      {/* Top bar */}
      <View style={{
        position: "absolute", top: insets.top + 12, left: 16, right: 16,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        zIndex: 10,
      }}>
        {/* LIVE indicator */}
        <Animated.View style={[pulseStyle, {
          flexDirection: "row", alignItems: "center", gap: 8,
          backgroundColor: `${LIVE_RED}20`,
          borderWidth: 1.5, borderColor: `${LIVE_RED}50`,
          borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8,
        }]}>
          <PulsingDot color={LIVE_RED} size={8} />
          <Text style={{ color: LIVE_RED, fontSize: 12, fontWeight: "900", letterSpacing: 1.5 }}>
            ESTÁS EN DIRECTO
          </Text>
        </Animated.View>

        {/* Viewer count */}
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 6,
          backgroundColor: "rgba(0,0,0,0.6)",
          borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
          borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7,
        }}>
          <Eye size={13} color="rgba(255,255,255,0.8)" />
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "700" }}>
            {viewerCount}
          </Text>
          {wsConnected ? (
            <Wifi size={11} color={LIVE_GREEN} />
          ) : (
            <WifiOff size={11} color="#737373" />
          )}
        </View>
      </View>

      {/* Stream info */}
      <Animated.View
        entering={FadeIn.duration(500)}
        style={{
          position: "absolute", top: insets.top + 76, left: 16, right: 16,
          zIndex: 10,
        }}
      >
        <Text style={{ color: LIVE_GREEN, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 4 }}>
          {(CATEGORY_LABELS[stream.category] ?? stream.category).toUpperCase()}
        </Text>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: -0.5 }} numberOfLines={2}>
          {stream.title}
        </Text>
      </Animated.View>

      {/* Chat feed */}
      <View style={{
        position: "absolute",
        bottom: insets.bottom + 80, left: 16, right: 16,
        maxHeight: SCREEN_HEIGHT * 0.35,
      }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingVertical: 4 }}
        >
          {messages.length === 0 ? (
            <View style={{
              backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 12,
              padding: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
            }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center" }}>
                Los mensajes del chat aparecerán aquí
              </Text>
            </View>
          ) : null}
          {messages.map((msg) => {
            const color = getUserColor(msg.userId);
            const initials = getInitials(msg.userName);
            return (
              <View key={msg.id} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 8 }}>
                <Avatar initials={initials} color={color} size={24} />
                <View style={{
                  backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 12,
                  paddingHorizontal: 10, paddingVertical: 6, flex: 1,
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
                }}>
                  <Text style={{ color, fontSize: 10, fontWeight: "700", marginBottom: 1 }}>
                    {msg.userName}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>{msg.content}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Chat input + end button */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
      >
        <View style={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 12,
          paddingTop: 12,
          backgroundColor: "rgba(0,0,0,0.8)",
          borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)",
          gap: 10,
        }}>
          {/* Chat row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TextInput
              testID="broadcast-chat-input"
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Escribe un mensaje al chat..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={{
                flex: 1, backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
                color: "#fff", fontSize: 14,
                borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
              }}
              returnKeyType="send"
              onSubmitEditing={handleSendChat}
            />
            <Pressable
              testID="broadcast-send-chat"
              onPress={handleSendChat}
              style={({ pressed }) => ({
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: pressed ? "#2D9E4A" : LIVE_GREEN,
                alignItems: "center", justifyContent: "center",
              })}
            >
              <Send size={18} color="#000" />
            </Pressable>
          </View>

          {/* End broadcast button */}
          <Pressable
            testID="end-broadcast-button"
            onPress={handleEnd}
            disabled={isEnding}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#CC2E26" : LIVE_RED,
              borderRadius: 100, paddingVertical: 15,
              alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 10,
              opacity: isEnding ? 0.7 : 1,
            })}
          >
            {isEnding ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <X size={18} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: -0.2 }}>
                  Terminar Directo
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Go Live Setup Screen ─────────────────────────────────────────────────────

export default function GoLiveScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);

  const currentUserId = session?.user?.id ?? "guest";
  const currentUserName = session?.user?.name ?? "Invitado";
  const currentUserImage = session?.user?.image ?? undefined;

  const startMutation = useMutation({
    mutationFn: (data: { title: string; category: string }) =>
      api.post<LiveStream>("/api/live", data),
    onSuccess: (stream) => {
      queryClient.invalidateQueries({ queryKey: ["live-streams"] });
      setActiveStream(stream);
    },
  });

  const canStart = title.trim().length > 0 && selectedCategory !== null;

  const handleStart = () => {
    if (!canStart || !selectedCategory) return;
    startMutation.mutate({ title: title.trim(), category: selectedCategory });
  };

  const handleEnd = () => {
    setActiveStream(null);
    setTitle("");
    setSelectedCategory(null);
    router.back();
  };

  // If broadcast is active, show the broadcast screen
  if (activeStream) {
    return (
      <BroadcastScreen
        stream={activeStream}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserImage={currentUserImage}
        onEnd={handleEnd}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }} testID="go-live-screen">
      {/* Dark gradient background */}
      <LinearGradient
        colors={["#080808", "#0A100C", "#080808"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16,
        }}>
          <Pressable
            testID="go-live-back-button"
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: pressed ? "#1A1A1A" : "#141414",
              borderWidth: 1, borderColor: "#1F1F1F",
              alignItems: "center", justifyContent: "center",
              marginRight: 12,
            })}
          >
            <ChevronLeft size={22} color="#F5F5F5" />
          </Pressable>
          <Text style={{ color: "#F5F5F5", fontSize: 18, fontWeight: "900", letterSpacing: -0.5, flex: 1 }}>
            Ir en Directo
          </Text>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: `${LIVE_GREEN}15`,
            borderWidth: 1, borderColor: `${LIVE_GREEN}30`,
            borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5,
          }}>
            <Radio size={11} color={LIVE_GREEN} />
            <Text style={{ color: LIVE_GREEN, fontSize: 10, fontWeight: "700" }}>LIVE</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero section */}
            <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: "center", marginBottom: 36 }}>
              <View style={{
                width: 90, height: 90, borderRadius: 45,
                backgroundColor: `${LIVE_GREEN}12`,
                borderWidth: 2, borderColor: `${LIVE_GREEN}35`,
                alignItems: "center", justifyContent: "center", marginBottom: 14,
              }}>
                <Mic size={36} color={LIVE_GREEN} />
              </View>
              <Text style={{ color: "#F5F5F5", fontSize: 22, fontWeight: "900", textAlign: "center", letterSpacing: -0.5, marginBottom: 6 }}>
                Comparte en vivo
              </Text>
              <Text style={{ color: "#737373", fontSize: 14, textAlign: "center", lineHeight: 20 }}>
                Conecta con tu comunidad en tiempo real
              </Text>
            </Animated.View>

            {/* Title input */}
            <Animated.View entering={FadeInDown.duration(400).delay(80)}>
              <Text style={{ color: "#A3A3A3", fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8 }}>
                TÍTULO DEL DIRECTO
              </Text>
              <TextInput
                testID="go-live-title-input"
                value={title}
                onChangeText={setTitle}
                placeholder="¿De qué vas a hablar hoy?"
                placeholderTextColor="#404040"
                multiline={false}
                style={{
                  backgroundColor: "#0F0F0F",
                  borderRadius: 16, padding: 16,
                  color: "#F5F5F5", fontSize: 16, fontWeight: "600",
                  borderWidth: 1.5,
                  borderColor: title.length > 0 ? `${LIVE_GREEN}60` : "#1F1F1F",
                  marginBottom: 28,
                }}
              />
            </Animated.View>

            {/* Category selector */}
            <Animated.View entering={FadeInDown.duration(400).delay(140)}>
              <Text style={{ color: "#A3A3A3", fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 12 }}>
                CATEGORÍA
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
              >
                {CATEGORIES.map((cat) => {
                  const catColor = CATEGORY_COLORS[cat] ?? "#4ADE80";
                  const selected = selectedCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      testID={`category-chip-${cat}`}
                      onPress={() => setSelectedCategory(cat)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16, paddingVertical: 10,
                        borderRadius: 100,
                        backgroundColor: selected ? `${catColor}20` : "#0F0F0F",
                        borderWidth: 1.5,
                        borderColor: selected ? catColor : "#1F1F1F",
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Text style={{
                        color: selected ? catColor : "#737373",
                        fontSize: 13, fontWeight: selected ? "800" : "500",
                      }}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            {/* Preview card */}
            {title.trim().length > 0 || selectedCategory ? (
              <Animated.View entering={FadeInDown.duration(350)} style={{ marginTop: 28 }}>
                <Text style={{ color: "#A3A3A3", fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 }}>
                  VISTA PREVIA
                </Text>
                <View style={{
                  backgroundColor: "#0F0F0F", borderRadius: 16, padding: 16,
                  borderWidth: 1, borderColor: "#1F1F1F",
                  borderLeftWidth: 3,
                  borderLeftColor: selectedCategory ? (CATEGORY_COLORS[selectedCategory] ?? LIVE_GREEN) : LIVE_GREEN,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <View style={{
                      flexDirection: "row", alignItems: "center", gap: 5,
                      backgroundColor: `${LIVE_RED}20`,
                      borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4,
                      borderWidth: 1, borderColor: `${LIVE_RED}40`,
                    }}>
                      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: LIVE_RED }} />
                      <Text style={{ color: LIVE_RED, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>EN VIVO</Text>
                    </View>
                    {selectedCategory ? (
                      <View style={{
                        backgroundColor: `${CATEGORY_COLORS[selectedCategory] ?? LIVE_GREEN}18`,
                        borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: `${CATEGORY_COLORS[selectedCategory] ?? LIVE_GREEN}35`,
                      }}>
                        <Text style={{
                          color: CATEGORY_COLORS[selectedCategory] ?? LIVE_GREEN,
                          fontSize: 9, fontWeight: "700",
                        }}>
                          {CATEGORY_LABELS[selectedCategory]}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: "#F5F5F5", fontSize: 15, fontWeight: "800", letterSpacing: -0.3 }}>
                    {title.trim().length > 0 ? title.trim() : "Título del directo..."}
                  </Text>
                  <Text style={{ color: "#737373", fontSize: 11, marginTop: 6 }}>
                    {currentUserName} · Ahora mismo
                  </Text>
                </View>
              </Animated.View>
            ) : null}

            {/* Start button */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ marginTop: 36 }}>
              <Pressable
                testID="comenzar-directo-button"
                onPress={handleStart}
                disabled={!canStart || startMutation.isPending}
                style={({ pressed }) => ({
                  borderRadius: 100, overflow: "hidden",
                  opacity: canStart && !startMutation.isPending ? 1 : 0.4,
                })}
              >
                <LinearGradient
                  colors={canStart ? ["#4ADE80", "#22C55E"] : ["#1A1A1A", "#141414"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 18, alignItems: "center",
                    flexDirection: "row", justifyContent: "center", gap: 12,
                  }}
                >
                  {startMutation.isPending ? (
                    <ActivityIndicator color="#000" size="small" testID="start-loading" />
                  ) : (
                    <>
                      <Radio size={20} color={canStart ? "#000" : "#404040"} />
                      <Text style={{
                        color: canStart ? "#000" : "#404040",
                        fontSize: 16, fontWeight: "900", letterSpacing: 0.5,
                      }}>
                        COMENZAR DIRECTO
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              {startMutation.isError ? (
                <Text style={{ color: LIVE_RED, fontSize: 12, textAlign: "center", marginTop: 10 }}>
                  No se pudo iniciar el directo. Inténtalo de nuevo.
                </Text>
              ) : null}

              <Text style={{ color: "#404040", fontSize: 11, textAlign: "center", marginTop: 14, lineHeight: 16 }}>
                Al empezar, serás visible para todos los usuarios de la app
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
