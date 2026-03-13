import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Radio,
  Eye,
  Heart,
  Send,
  X,
  Play,
  MessageCircle,
  ChevronLeft,
  Wifi,
  WifiOff,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/lib/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useSession } from "@/lib/auth/use-session";
import { router } from "expo-router";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Constants ────────────────────────────────────────────────────────────────

const LIVE_RED = "#FF3B30";
const LIVE_GREEN = "#34C759";

const CATEGORY_COLORS: Record<string, string> = {
  finanzas: "#4ADE80",
  desarrollo_personal: "#3B82F6",
  filosofia: "#A855F7",
  negocios: "#F59E0B",
  disciplina: "#EF4444",
};

const CATEGORY_LABELS: Record<string, string> = {
  finanzas: "Finanzas",
  desarrollo_personal: "Desarrollo",
  filosofia: "Filosofía",
  negocios: "Negocios",
  disciplina: "Disciplina",
};

const THUMBNAIL_GRADIENTS: Record<string, [string, string]> = {
  finanzas: ["#0A2015", "#0F3020"],
  desarrollo_personal: ["#0A0F20", "#0D1535"],
  filosofia: ["#150A20", "#1A0D2A"],
  negocios: ["#1A120A", "#221808"],
  disciplina: ["#1A0A0A", "#220E0E"],
};

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
  thumbnailUrl?: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
};

type LiveMessage = {
  id: string;
  streamId: string;
  userId: string;
  content: string;
  createdAt: string;
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

// ─── Helper: get initials ──────────────────────────────────────────────────────

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

function getThumbnailGradient(category: string): [string, string] {
  return THUMBNAIL_GRADIENTS[category] ?? ["#0A1A10", "#0C2018"];
}

// ─── Pulsing Dot ───────────────────────────────────────────────────────────────

function PulsingDot({ color, size = 8 }: { color: string; size?: number }) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
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
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animStyle,
      ]}
    />
  );
}

// ─── Live Badge ────────────────────────────────────────────────────────────────

function LiveBadge({ small = false }: { small?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: LIVE_RED,
        paddingHorizontal: small ? 8 : 10,
        paddingVertical: small ? 3 : 5,
        borderRadius: 100,
      }}
    >
      <PulsingDot color="#fff" size={small ? 5 : 6} />
      <Text style={{ color: "#fff", fontSize: small ? 9 : 11, fontWeight: "800", letterSpacing: 0.5 }}>
        EN VIVO
      </Text>
    </View>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  const bg = `${color}22`;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        borderWidth: 1.5,
        borderColor: `${color}55`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color, fontWeight: "800", fontSize: size * 0.36 }}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Featured Card ─────────────────────────────────────────────────────────────

function FeaturedCard({ stream, onPress }: { stream: LiveStream; onPress: () => void }) {
  const { colors } = useTheme();
  const accentColor = CATEGORY_COLORS[stream.category] ?? "#4ADE80";
  const gradient = getThumbnailGradient(stream.category);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animStyle, { marginBottom: 20 }]} entering={FadeInDown.duration(400)}>
      <Pressable
        testID={`featured-live-card-${stream.id}`}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{ borderRadius: 24, overflow: "hidden" }}
      >
        <LinearGradient
          colors={[gradient[0], gradient[1], "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 220, justifyContent: "flex-end" }}
        >
          <View style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            borderWidth: 1, borderColor: `${accentColor}18`, borderRadius: 24,
          }} />
          <View style={{
            position: "absolute", top: 0, left: 0, bottom: 0,
            width: 3, backgroundColor: accentColor,
            borderTopLeftRadius: 24, borderBottomLeftRadius: 24,
          }} />

          <View style={{
            position: "absolute", top: 14, left: 16, right: 16,
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          }}>
            <LiveBadge />
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
            }}>
              <Eye size={12} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {stream.viewerCount.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            alignItems: "center", justifyContent: "center",
          }}>
            <View style={{
              width: 60, height: 60, borderRadius: 30,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderWidth: 2, borderColor: `${accentColor}66`,
              alignItems: "center", justifyContent: "center",
            }}>
              <Play size={24} color={accentColor} fill={accentColor} />
            </View>
          </View>

          <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={{ padding: 16, paddingTop: 32 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <View style={{
                backgroundColor: `${accentColor}22`,
                borderWidth: 1, borderColor: `${accentColor}55`,
                borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4,
              }}>
                <Text style={{ color: accentColor, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                  {CATEGORY_LABELS[stream.category] ?? stream.category}
                </Text>
              </View>
            </View>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 8, letterSpacing: -0.3 }}>
              {stream.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Avatar initials={getInitials(stream.user.name)} color={accentColor} size={32} />
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
                  {stream.user.name}
                </Text>
              </View>
              <View style={{
                backgroundColor: accentColor, paddingHorizontal: 16,
                paddingVertical: 8, borderRadius: 100,
              }}>
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 12 }}>Unirse</Text>
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─── Grid Card ─────────────────────────────────────────────────────────────────

function GridCard({ stream, onPress, index }: { stream: LiveStream; onPress: () => void; index: number }) {
  const { colors } = useTheme();
  const accentColor = CATEGORY_COLORS[stream.category] ?? "#4ADE80";
  const gradient = getThumbnailGradient(stream.category);
  const cardWidth = (SCREEN_WIDTH - 48) / 2;

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(index * 80)} style={{ width: cardWidth, marginBottom: 12 }}>
      <Pressable
        testID={`grid-live-card-${stream.id}`}
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.bg3 : colors.card,
          borderRadius: 18, overflow: "hidden",
          borderWidth: 1, borderColor: colors.border,
          borderLeftWidth: 3, borderLeftColor: accentColor,
        })}
      >
        <LinearGradient colors={[gradient[0], gradient[1]]} style={{ height: 80, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", top: 8, left: 8 }}>
            <LiveBadge small />
          </View>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.5)",
            borderWidth: 1.5, borderColor: `${accentColor}44`,
            alignItems: "center", justifyContent: "center",
          }}>
            <Play size={14} color={accentColor} fill={accentColor} />
          </View>
        </LinearGradient>
        <View style={{ padding: 10 }}>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700", marginBottom: 4, letterSpacing: -0.2 }} numberOfLines={2}>
            {stream.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Avatar initials={getInitials(stream.user.name)} color={accentColor} size={18} />
            <Text style={{ color: colors.text2, fontSize: 10, flex: 1 }} numberOfLines={1}>
              {stream.user.name}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
            <Eye size={10} color={colors.text3} />
            <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "600" }}>
              {stream.viewerCount}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 32 }}>
      <View style={{
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: `${LIVE_RED}15`,
        borderWidth: 1.5, borderColor: `${LIVE_RED}30`,
        alignItems: "center", justifyContent: "center", marginBottom: 20,
      }}>
        <Radio size={32} color={LIVE_RED} />
      </View>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: 8, textAlign: "center" }}>
        No hay directos activos
      </Text>
      <Text style={{ color: colors.text3, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
        Sé el primero en transmitir hoy. Comparte tu conocimiento en vivo con tu comunidad.
      </Text>
    </Animated.View>
  );
}

// ─── Live Player Modal ─────────────────────────────────────────────────────────

type ChatItem = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
};

function LivePlayerModal({
  stream,
  visible,
  onClose,
  currentUserId,
  currentUserName,
  currentUserImage,
}: {
  stream: LiveStream | null;
  visible: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserImage?: string;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewerCount, setViewerCount] = useState(stream?.viewerCount ?? 0);
  const [streamEnded, setStreamEnded] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: () => api.post<void>(`/api/live/${stream?.id}/join`, {}),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.post<void>(`/api/live/${stream?.id}/leave`, {}),
  });

  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));
  const followScale = useSharedValue(1);
  const followStyle = useAnimatedStyle(() => ({ transform: [{ scale: followScale.value }] }));

  // Load initial chat history
  useEffect(() => {
    if (!visible || !stream) return;
    setMessages([]);
    setStreamEnded(false);
    setViewerCount(stream.viewerCount);

    api.get<LiveMessage[]>(`/api/live/${stream.id}/messages`)
      .then((msgs) => {
        if (!msgs) return;
        setMessages(msgs.map((m) => ({
          id: m.id,
          userId: m.userId,
          userName: m.user.name,
          content: m.content,
          createdAt: m.createdAt,
        })));
      })
      .catch(() => null);
  }, [visible, stream?.id]);

  // Join / WebSocket connect
  useEffect(() => {
    if (!visible || !stream) return;

    joinMutation.mutate();

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
            return next.slice(-50);
          });
        } else if (data.type === "viewer_count") {
          setViewerCount(data.count);
        } else if (data.type === "stream_ended") {
          setStreamEnded(true);
          queryClient.invalidateQueries({ queryKey: ["live-streams"] });
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      leaveMutation.mutate();
      queryClient.invalidateQueries({ queryKey: ["live-streams"] });
    };
  }, [visible, stream?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleClose = () => {
    setStreamEnded(false);
    onClose();
  };

  const handleLike = () => {
    heartScale.value = withSequence(withSpring(1.4), withSpring(1));
    setLikeCount((prev) => prev + 1);
  };

  const handleFollow = () => {
    followScale.value = withSequence(withSpring(0.9), withSpring(1));
    setIsFollowing((prev) => !prev);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "chat", content: chatInput.trim() }));
    }
    setChatInput("");
  };

  if (!stream) return null;

  const accentColor = CATEGORY_COLORS[stream.category] ?? "#4ADE80";
  const gradient = getThumbnailGradient(stream.category);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      testID="live-player-modal"
    >
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {/* Video background */}
        <LinearGradient
          colors={[gradient[0], gradient[1], "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.55 }}
        />

        {/* Stream ended overlay */}
        {streamEnded ? (
          <View style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            alignItems: "center", justifyContent: "center",
            zIndex: 50,
          }}>
            <View style={{
              backgroundColor: "#0F0F0F", borderRadius: 20, padding: 28,
              alignItems: "center", borderWidth: 1, borderColor: "#1F1F1F", maxWidth: 280,
            }}>
              <View style={{
                width: 60, height: 60, borderRadius: 30,
                backgroundColor: `${LIVE_RED}20`, borderWidth: 1.5, borderColor: `${LIVE_RED}40`,
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <WifiOff size={26} color={LIVE_RED} />
              </View>
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 8, textAlign: "center" }}>
                El directo ha terminado
              </Text>
              <Text style={{ color: "#737373", fontSize: 13, textAlign: "center", marginBottom: 20 }}>
                El host ha finalizado la transmisión
              </Text>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#2D9E4A" : "#4ADE80",
                  borderRadius: 100, paddingHorizontal: 28, paddingVertical: 12,
                })}
              >
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 14 }}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Top bar */}
        <View style={{
          position: "absolute", top: insets.top + 12, left: 16, right: 16,
          flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 10,
        }}>
          <Pressable
            testID="live-player-close"
            onPress={handleClose}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: pressed ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.6)",
              borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
              alignItems: "center", justifyContent: "center",
            })}
          >
            <ChevronLeft size={22} color="#fff" />
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <LiveBadge />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Eye size={11} color="rgba(255,255,255,0.7)" />
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" }}>
                {Math.max(0, viewerCount).toLocaleString()} viendo
              </Text>
            </View>
          </View>

          <Animated.View style={followStyle}>
            <Pressable
              testID="follow-host-button"
              onPress={handleFollow}
              style={({ pressed }) => ({
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
                backgroundColor: isFollowing ? "rgba(255,255,255,0.15)" : accentColor,
                borderWidth: 1, borderColor: isFollowing ? "rgba(255,255,255,0.3)" : "transparent",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: isFollowing ? "#fff" : "#000", fontSize: 12, fontWeight: "800" }}>
                {isFollowing ? "Siguiendo" : "Seguir"}
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Host info */}
        <View style={{
          position: "absolute", top: insets.top + 80, left: 16,
          flexDirection: "row", alignItems: "center", gap: 10, zIndex: 10,
        }}>
          <Avatar initials={getInitials(stream.user.name)} color={accentColor} size={44} />
          <View>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>{stream.user.name}</Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }} numberOfLines={1}>
              {stream.title}
            </Text>
          </View>
          {wsConnected ? (
            <View style={{ marginLeft: 4 }}>
              <Wifi size={12} color="#4ADE80" />
            </View>
          ) : null}
        </View>

        {/* Chat + actions */}
        <View style={{
          position: "absolute", bottom: insets.bottom + 70,
          left: 0, right: 0,
          flexDirection: "row", alignItems: "flex-end",
          paddingHorizontal: 12, paddingBottom: 8,
        }}>
          <View style={{ flex: 1, maxHeight: 220, marginRight: 8 }}>
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
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

          <View style={{ alignItems: "center", gap: 16, paddingBottom: 4 }}>
            <Animated.View style={heartStyle}>
              <Pressable testID="like-button" onPress={handleLike} style={{ alignItems: "center", gap: 3 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: "rgba(255,59,48,0.25)",
                  borderWidth: 1, borderColor: "rgba(255,59,48,0.4)",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Heart size={20} color={LIVE_RED} fill={likeCount > 0 ? LIVE_RED : "transparent"} />
                </View>
                {likeCount > 0 ? (
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "600" }}>
                    {likeCount}
                  </Text>
                ) : null}
              </Pressable>
            </Animated.View>

            <Pressable testID="chat-icon-button" style={{ alignItems: "center", gap: 3 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
                alignItems: "center", justifyContent: "center",
              }}>
                <MessageCircle size={20} color="#fff" />
              </View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "600" }}>
                {messages.length}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Chat input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
        >
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 12,
            paddingTop: 12,
            backgroundColor: "rgba(0,0,0,0.7)",
            borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)",
          }}>
            <TextInput
              testID="chat-input"
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={{
                flex: 1, backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
                color: "#fff", fontSize: 14,
                borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
              }}
              returnKeyType="send"
              onSubmitEditing={handleSendChat}
            />
            <Pressable
              testID="send-chat-button"
              onPress={handleSendChat}
              style={({ pressed }) => ({
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: pressed ? "#2D9E4A" : accentColor,
                alignItems: "center", justifyContent: "center",
              })}
            >
              <Send size={18} color="#000" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function LiveScreen() {
  const { colors } = useTheme();
  const { data: session } = useSession();
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const currentUserId = session?.user?.id ?? "guest";
  const currentUserName = session?.user?.name ?? "Invitado";
  const currentUserImage = session?.user?.image ?? undefined;

  const { data: streams, isLoading, isError, refetch } = useQuery({
    queryKey: ["live-streams"],
    queryFn: () => api.get<LiveStream[]>("/api/live"),
    refetchInterval: 10000,
  });

  const activeStreams = (streams ?? []).filter((s) => s.status === "live");
  const featuredStream = activeStreams[0] ?? null;
  const gridStreams = activeStreams.slice(1);

  const handleOpenStream = (stream: LiveStream) => {
    setSelectedStream(stream);
    setShowPlayer(true);
  };

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="live-screen">
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        }}>
          <View>
            <Text style={{ fontSize: 30, fontWeight: "900", color: colors.text, letterSpacing: -1, marginBottom: 2 }}>
              Directos
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <PulsingDot color={LIVE_RED} size={8} />
              <Text style={{ color: LIVE_RED, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 }}>
                EN VIVO
              </Text>
              <Text style={{ color: colors.text3, fontSize: 11 }}>
                · {activeStreams.length} activos
              </Text>
            </View>
          </View>

          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: `${LIVE_RED}15`,
            borderWidth: 1, borderColor: `${LIVE_RED}30`,
            borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7,
          }}>
            <Radio size={13} color={LIVE_RED} />
            <Text style={{ color: LIVE_RED, fontSize: 11, fontWeight: "700" }}>
              {activeStreams.length} en vivo
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        >
          {isLoading ? (
            <View style={{ paddingTop: 60, alignItems: "center" }}>
              <ActivityIndicator color="#4ADE80" size="large" testID="loading-indicator" />
              <Text style={{ color: colors.text3, marginTop: 12, fontSize: 13 }}>Cargando directos...</Text>
            </View>
          ) : isError ? (
            <View style={{ paddingTop: 60, alignItems: "center", gap: 12 }}>
              <Text style={{ color: colors.text3, fontSize: 14 }}>No se pudo cargar los directos</Text>
              <Pressable
                onPress={() => refetch()}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#1A1A1A" : "#141414",
                  paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100,
                  borderWidth: 1, borderColor: "#1F1F1F",
                })}
              >
                <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600" }}>Reintentar</Text>
              </Pressable>
            </View>
          ) : activeStreams.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {featuredStream ? (
                <>
                  <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 }}>
                    DESTACADO
                  </Text>
                  <FeaturedCard stream={featuredStream} onPress={() => handleOpenStream(featuredStream)} />
                </>
              ) : null}

              {gridStreams.length > 0 ? (
                <>
                  <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 12 }}>
                    EN VIVO AHORA
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                    {gridStreams.map((stream, i) => (
                      <GridCard
                        key={stream.id}
                        stream={stream}
                        index={i}
                        onPress={() => handleOpenStream(stream)}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </>
          )}
        </ScrollView>

        {/* FAB: Ir en Directo */}
        <Animated.View style={[fabStyle, { position: "absolute", bottom: 32, alignSelf: "center" }]}>
          <Pressable
            testID="ir-en-directo-fab"
            onPressIn={() => { fabScale.value = withSpring(0.95); }}
            onPressOut={() => { fabScale.value = withSpring(1); }}
            onPress={() => router.push("/go-live" as never)}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", gap: 8,
              backgroundColor: LIVE_GREEN,
              paddingHorizontal: 24, paddingVertical: 16, borderRadius: 100,
              shadowColor: LIVE_GREEN,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Radio size={16} color="#000" />
            <Text style={{ color: "#000", fontWeight: "900", fontSize: 14, letterSpacing: -0.2 }}>
              Ir en Directo
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      <LivePlayerModal
        stream={selectedStream}
        visible={showPlayer}
        onClose={() => {
          setShowPlayer(false);
          setSelectedStream(null);
        }}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserImage={currentUserImage}
      />
    </View>
  );
}
