import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Radio,
  Eye,
  Users,
  Heart,
  Send,
  X,
  Play,
  Mic,
  Video,
  MessageCircle,
  ChevronLeft,
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
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/lib/theme";

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

const CATEGORIES = Object.keys(CATEGORY_COLORS);

// ─── Mock Data ─────────────────────────────────────────────────────────────────

interface LiveItem {
  id: string;
  host: string;
  hostAvatar: string;
  title: string;
  category: string;
  viewers: number;
  isLive: boolean;
  scheduledAt?: string;
  verified?: boolean;
  thumbnailGradient: [string, string];
}

const MOCK_LIVES: LiveItem[] = [
  {
    id: "1",
    host: "Carlos Mendez",
    hostAvatar: "CM",
    title: "Trading en Vivo: Análisis BTC/ETH",
    category: "finanzas",
    viewers: 342,
    isLive: true,
    verified: true,
    thumbnailGradient: ["#0A2015", "#0F3020"],
  },
  {
    id: "2",
    host: "Sofia Ramirez",
    hostAvatar: "SR",
    title: "Mindset de Millonario - Q&A",
    category: "desarrollo_personal",
    viewers: 128,
    isLive: true,
    verified: true,
    thumbnailGradient: ["#0A0F20", "#0D1535"],
  },
  {
    id: "3",
    host: "Alex Torres",
    hostAvatar: "AT",
    title: "Revisión de Portafolio en Tiempo Real",
    category: "finanzas",
    viewers: 89,
    isLive: true,
    verified: false,
    thumbnailGradient: ["#0A1A10", "#0C2018"],
  },
  {
    id: "4",
    host: "Maria Lopez",
    hostAvatar: "ML",
    title: "Stoicismo para Emprendedores",
    category: "filosofia",
    viewers: 201,
    isLive: true,
    verified: true,
    thumbnailGradient: ["#150A20", "#1A0D2A"],
  },
  {
    id: "5",
    host: "Diego Castro",
    hostAvatar: "DC",
    title: "Lanzamiento de Startup en Vivo",
    category: "negocios",
    viewers: 156,
    isLive: false,
    scheduledAt: "Mañana 19:00",
    verified: false,
    thumbnailGradient: ["#1A120A", "#221808"],
  },
  {
    id: "6",
    host: "Ana Flores",
    hostAvatar: "AF",
    title: "Hábitos que Cambian Vidas",
    category: "disciplina",
    viewers: 0,
    isLive: false,
    scheduledAt: "Viernes 20:00",
    verified: true,
    thumbnailGradient: ["#1A0A0A", "#220E0E"],
  },
];

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  color: string;
  timestamp: number;
}

const INITIAL_CHAT: ChatMessage[] = [
  { id: "c1", user: "Roberto", avatar: "RO", text: "Excelente análisis! 🔥", color: "#4ADE80", timestamp: Date.now() - 30000 },
  { id: "c2", user: "Valentina", avatar: "VA", text: "¿Cuándo crees que BTC llega a 100k?", color: "#3B82F6", timestamp: Date.now() - 25000 },
  { id: "c3", user: "Miguel", avatar: "MI", text: "Increíble contenido como siempre 💯", color: "#A855F7", timestamp: Date.now() - 20000 },
  { id: "c4", user: "Patricia", avatar: "PA", text: "Gracias por compartir esto!", color: "#F59E0B", timestamp: Date.now() - 15000 },
  { id: "c5", user: "Juan C.", avatar: "JC", text: "Llevo 3 meses siguiéndote y he mejorado mucho", color: "#EC4899", timestamp: Date.now() - 10000 },
  { id: "c6", user: "Laura", avatar: "LA", text: "¿Hay algún libro que recomiendes? 📚", color: "#06B6D4", timestamp: Date.now() - 5000 },
];

const AUTO_CHAT_POOL = [
  { user: "Andrés", avatar: "AN", text: "Que buen punto!", color: "#4ADE80" },
  { user: "Carmen", avatar: "CA", text: "Totalmente de acuerdo 👏", color: "#F59E0B" },
  { user: "Felipe", avatar: "FE", text: "Esto debería verlo todo el mundo", color: "#3B82F6" },
  { user: "Isabel", avatar: "IS", text: "Gracias por el contenido gratuito ❤️", color: "#EC4899" },
  { user: "Omar", avatar: "OM", text: "Primera vez aquí, increíble 🤯", color: "#A855F7" },
  { user: "Lucia", avatar: "LU", text: "¿Cuándo es el próximo directo?", color: "#06B6D4" },
  { user: "Tomás", avatar: "TO", text: "Siguiéndote desde hace 1 año 🙌", color: "#EF4444" },
  { user: "Gabriela", avatar: "GA", text: "Exactamente lo que necesitaba escuchar", color: "#4ADE80" },
  { user: "Ricardo", avatar: "RI", text: "Apliqué estos consejos y resultó! 💪", color: "#F59E0B" },
  { user: "Natalia", avatar: "NA", text: "Muy claro y conciso, gracias", color: "#3B82F6" },
];

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

function FeaturedCard({ live, onPress }: { live: LiveItem; onPress: () => void }) {
  const { colors } = useTheme();
  const accentColor = CATEGORY_COLORS[live.category] ?? "#4ADE80";
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, { marginBottom: 20 }]} entering={FadeInDown.duration(400)}>
      <Pressable
        testID={`featured-live-card-${live.id}`}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{ borderRadius: 24, overflow: "hidden" }}
      >
        {/* Gradient background simulating video thumbnail */}
        <LinearGradient
          colors={[live.thumbnailGradient[0], live.thumbnailGradient[1], "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 220, justifyContent: "flex-end" }}
        >
          {/* Scanline effect overlay */}
          <View style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            borderWidth: 1,
            borderColor: `${accentColor}18`,
            borderRadius: 24,
          }} />

          {/* Category accent line */}
          <View style={{
            position: "absolute",
            top: 0, left: 0, bottom: 0,
            width: 3,
            backgroundColor: accentColor,
            borderTopLeftRadius: 24,
            borderBottomLeftRadius: 24,
          }} />

          {/* Top row: LIVE + viewers */}
          <View style={{
            position: "absolute",
            top: 14, left: 16, right: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <LiveBadge />
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}>
              <Eye size={12} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {live.viewers.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Play button center */}
          <View style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderWidth: 2,
              borderColor: `${accentColor}66`,
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Play size={24} color={accentColor} fill={accentColor} />
            </View>
          </View>

          {/* Bottom gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            style={{ padding: 16, paddingTop: 32 }}
          >
            {/* Category chip */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}>
              <View style={{
                backgroundColor: `${accentColor}22`,
                borderWidth: 1,
                borderColor: `${accentColor}55`,
                borderRadius: 100,
                paddingHorizontal: 10,
                paddingVertical: 4,
                alignSelf: "flex-start",
              }}>
                <Text style={{ color: accentColor, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                  {CATEGORY_LABELS[live.category] ?? live.category}
                </Text>
              </View>
            </View>

            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 8, letterSpacing: -0.3 }}>
              {live.title}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Avatar initials={live.hostAvatar} color={accentColor} size={32} />
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
                      {live.host}
                    </Text>
                    {live.verified ? (
                      <View style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: accentColor,
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Text style={{ color: "#000", fontSize: 8, fontWeight: "900" }}>✓</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>Host</Text>
                </View>
              </View>

              <View style={{
                backgroundColor: accentColor,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 100,
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

// ─── Small Grid Card ───────────────────────────────────────────────────────────

function GridCard({ live, onPress, index }: { live: LiveItem; onPress: () => void; index: number }) {
  const { colors } = useTheme();
  const accentColor = CATEGORY_COLORS[live.category] ?? "#4ADE80";
  const cardWidth = (SCREEN_WIDTH - 48) / 2;

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(index * 80)}
      style={{ width: cardWidth, marginBottom: 12 }}
    >
      <Pressable
        testID={`grid-live-card-${live.id}`}
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.bg3 : colors.card,
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
          borderLeftWidth: 3,
          borderLeftColor: accentColor,
        })}
      >
        {/* Mini thumbnail */}
        <LinearGradient
          colors={[live.thumbnailGradient[0], live.thumbnailGradient[1]]}
          style={{ height: 80, alignItems: "center", justifyContent: "center" }}
        >
          <View style={{
            position: "absolute",
            top: 8, left: 8,
          }}>
            <LiveBadge small />
          </View>
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.5)",
            borderWidth: 1.5,
            borderColor: `${accentColor}44`,
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Play size={14} color={accentColor} fill={accentColor} />
          </View>
        </LinearGradient>

        {/* Info */}
        <View style={{ padding: 10 }}>
          <Text
            style={{ color: colors.text, fontSize: 12, fontWeight: "700", marginBottom: 4, letterSpacing: -0.2 }}
            numberOfLines={2}
          >
            {live.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Avatar initials={live.hostAvatar} color={accentColor} size={18} />
            <Text style={{ color: colors.text2, fontSize: 10, flex: 1 }} numberOfLines={1}>
              {live.host}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
            <Eye size={10} color={colors.text3} />
            <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "600" }}>
              {live.viewers}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Scheduled Card ────────────────────────────────────────────────────────────

function ScheduledCard({ live, index }: { live: LiveItem; index: number }) {
  const { colors } = useTheme();
  const accentColor = CATEGORY_COLORS[live.category] ?? "#4ADE80";

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(index * 80)} style={{ marginBottom: 10 }}>
      <View style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
      }}>
        <Avatar initials={live.hostAvatar} color={accentColor} size={42} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: 2, letterSpacing: -0.2 }} numberOfLines={1}>
            {live.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ color: colors.text2, fontSize: 11 }}>{live.host}</Text>
            {live.verified ? (
              <View style={{
                width: 12, height: 12, borderRadius: 6,
                backgroundColor: accentColor, alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ color: "#000", fontSize: 7, fontWeight: "900" }}>✓</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <View style={{
              backgroundColor: `${accentColor}18`,
              borderRadius: 100,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}>
              <Text style={{ color: accentColor, fontSize: 9, fontWeight: "700" }}>
                {CATEGORY_LABELS[live.category]}
              </Text>
            </View>
            <Text style={{ color: colors.text3, fontSize: 10 }}>{live.scheduledAt}</Text>
          </View>
        </View>
        <View style={{
          backgroundColor: `${accentColor}18`,
          borderWidth: 1,
          borderColor: `${accentColor}44`,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}>
          <Text style={{ color: accentColor, fontSize: 10, fontWeight: "700" }}>Recordar</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Live Player Modal ─────────────────────────────────────────────────────────

function LivePlayerModal({
  live,
  visible,
  onClose,
}: {
  live: LiveItem | null;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewers, setViewers] = useState(live?.viewers ?? 0);
  const scrollRef = useRef<ScrollView>(null);

  const heartScale = useSharedValue(1);
  const heartOpacity = useSharedValue(1);
  const followScale = useSharedValue(1);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const followStyle = useAnimatedStyle(() => ({
    transform: [{ scale: followScale.value }],
  }));

  useEffect(() => {
    if (!visible) return;
    setMessages(INITIAL_CHAT);
    setViewers(live?.viewers ?? 0);

    const interval = setInterval(() => {
      const random = AUTO_CHAT_POOL[Math.floor(Math.random() * AUTO_CHAT_POOL.length)];
      const newMsg: ChatMessage = {
        id: `auto-${Date.now()}-${Math.random()}`,
        user: random.user,
        avatar: random.avatar,
        text: random.text,
        color: random.color,
        timestamp: Date.now(),
      };
      setMessages(prev => {
        const next = [...prev, newMsg];
        return next.slice(-30);
      });
      setViewers(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 2500);

    return () => clearInterval(interval);
  }, [visible, live]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleLike = () => {
    heartScale.value = withSequence(
      withSpring(1.4),
      withSpring(1)
    );
    setLikeCount(prev => prev + 1);
  };

  const handleFollow = () => {
    followScale.value = withSequence(
      withSpring(0.9),
      withSpring(1)
    );
    setIsFollowing(prev => !prev);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: `user-${Date.now()}`,
      user: "Tú",
      avatar: "TU",
      text: chatInput.trim(),
      color: "#4ADE80",
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
    setChatInput("");
  };

  if (!live) return null;

  const accentColor = CATEGORY_COLORS[live.category] ?? "#4ADE80";

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
          colors={[live.thumbnailGradient[0], live.thumbnailGradient[1], "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.55 }}
        />

        {/* Scanlines overlay */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04 }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <View key={i} style={{ height: 2, backgroundColor: "#fff", marginBottom: 10 }} />
          ))}
        </View>

        {/* Top bar */}
        <View style={{
          position: "absolute",
          top: insets.top + 12,
          left: 16,
          right: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}>
          <Pressable
            testID="live-player-close"
            onPress={onClose}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.6)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <ChevronLeft size={22} color="#fff" />
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <LiveBadge />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Eye size={11} color="rgba(255,255,255,0.7)" />
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" }}>
                {Math.max(0, viewers).toLocaleString()} viendo
              </Text>
            </View>
          </View>

          <Animated.View style={followStyle}>
            <Pressable
              testID="follow-host-button"
              onPress={handleFollow}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 100,
                backgroundColor: isFollowing
                  ? "rgba(255,255,255,0.15)"
                  : accentColor,
                borderWidth: 1,
                borderColor: isFollowing ? "rgba(255,255,255,0.3)" : "transparent",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{
                color: isFollowing ? "#fff" : "#000",
                fontSize: 12,
                fontWeight: "800",
              }}>
                {isFollowing ? "Siguiendo" : "Seguir"}
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Host info */}
        <View style={{
          position: "absolute",
          top: insets.top + 80,
          left: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          zIndex: 10,
        }}>
          <Avatar initials={live.hostAvatar} color={accentColor} size={44} />
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>{live.host}</Text>
              {live.verified ? (
                <View style={{
                  width: 16, height: 16, borderRadius: 8,
                  backgroundColor: accentColor, alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ color: "#000", fontSize: 9, fontWeight: "900" }}>✓</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }} numberOfLines={1}>
              {live.title}
            </Text>
          </View>
        </View>

        {/* Chat + right actions */}
        <View style={{
          position: "absolute",
          bottom: insets.bottom + 70,
          left: 0,
          right: 0,
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 12,
          paddingBottom: 8,
        }}>
          {/* Chat feed */}
          <View style={{ flex: 1, maxHeight: 220, marginRight: 8 }}>
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              {messages.map(msg => (
                <View key={msg.id} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 8 }}>
                  <Avatar initials={msg.avatar} color={msg.color} size={24} />
                  <View style={{
                    backgroundColor: "rgba(0,0,0,0.55)",
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.06)",
                  }}>
                    <Text style={{ color: msg.color, fontSize: 10, fontWeight: "700", marginBottom: 1 }}>
                      {msg.user}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>{msg.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Right actions */}
          <View style={{ alignItems: "center", gap: 16, paddingBottom: 4 }}>
            <Animated.View style={heartStyle}>
              <Pressable
                testID="like-button"
                onPress={handleLike}
                style={{ alignItems: "center", gap: 3 }}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(255,59,48,0.25)",
                  borderWidth: 1,
                  borderColor: "rgba(255,59,48,0.4)",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Heart size={20} color={LIVE_RED} fill={likeCount > 0 ? LIVE_RED : "transparent"} />
                </View>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "600" }}>
                  {likeCount > 0 ? likeCount : ""}
                </Text>
              </Pressable>
            </Animated.View>

            <Pressable
              testID="chat-icon-button"
              style={{ alignItems: "center", gap: 3 }}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
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
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 12,
            paddingTop: 12,
            backgroundColor: "rgba(0,0,0,0.7)",
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.07)",
          }}>
            <TextInput
              testID="chat-input"
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 10,
                color: "#fff",
                fontSize: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.15)",
              }}
              returnKeyType="send"
              onSubmitEditing={handleSendChat}
            />
            <Pressable
              testID="send-chat-button"
              onPress={handleSendChat}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: pressed ? "#2D9E4A" : accentColor,
                alignItems: "center",
                justifyContent: "center",
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

// ─── Start Live Modal ──────────────────────────────────────────────────────────

function StartLiveModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const pulseOpacity = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  useEffect(() => {
    if (isBroadcasting) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [isBroadcasting]);

  const handleStart = () => {
    if (!title.trim() || !selectedCategory) return;
    setIsBroadcasting(true);
  };

  const handleEnd = () => {
    setIsBroadcasting(false);
    setTitle("");
    setSelectedCategory(null);
    onClose();
  };

  const canStart = title.trim().length > 0 && selectedCategory !== null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      testID="start-live-modal"
    >
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Handle */}
        <View style={{
          width: 36, height: 4, backgroundColor: colors.border,
          borderRadius: 100, alignSelf: "center", marginTop: 12, marginBottom: 4,
        }} />

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 40 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <Pressable
              testID="close-start-live-modal"
              onPress={onClose}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: pressed ? colors.bg3 : colors.bg2,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <X size={18} color={colors.text2} />
            </Pressable>
            <Text style={{
              flex: 1, textAlign: "center",
              color: colors.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.3,
            }}>
              Iniciar Directo
            </Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Mic icon header */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <Animated.View style={[{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: isBroadcasting ? `${LIVE_RED}20` : `${LIVE_GREEN}20`,
              borderWidth: 2,
              borderColor: isBroadcasting ? `${LIVE_RED}55` : `${LIVE_GREEN}55`,
              alignItems: "center", justifyContent: "center", marginBottom: 12,
            }, pulseStyle]}>
              {isBroadcasting
                ? <Radio size={30} color={LIVE_RED} />
                : <Mic size={30} color={LIVE_GREEN} />
              }
            </Animated.View>

            {isBroadcasting ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <PulsingDot color={LIVE_RED} size={8} />
                <Text style={{ color: LIVE_RED, fontWeight: "800", fontSize: 14, letterSpacing: 1 }}>
                  TRANSMITIENDO EN VIVO
                </Text>
              </View>
            ) : (
              <Text style={{ color: colors.text2, fontSize: 13 }}>
                Comparte con tu comunidad
              </Text>
            )}
          </View>

          {/* Title input */}
          {!isBroadcasting ? (
            <>
              <Text style={{ color: colors.text2, fontSize: 12, fontWeight: "700", marginBottom: 8, letterSpacing: 0.5 }}>
                TÍTULO DEL DIRECTO
              </Text>
              <TextInput
                testID="start-live-title-input"
                value={title}
                onChangeText={setTitle}
                placeholder="ej. Trading en Vivo: Análisis BTC"
                placeholderTextColor={colors.text3}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  padding: 14,
                  color: colors.text,
                  fontSize: 14,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: title ? colors.accent : colors.border,
                }}
                autoFocus={false}
              />

              {/* Category selector */}
              <Text style={{ color: colors.text2, fontSize: 12, fontWeight: "700", marginBottom: 12, letterSpacing: 0.5 }}>
                CATEGORÍA
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
                {CATEGORIES.map(cat => {
                  const catColor = CATEGORY_COLORS[cat];
                  const selected = selectedCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      testID={`category-${cat}`}
                      onPress={() => setSelectedCategory(cat)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 100,
                        backgroundColor: selected ? `${catColor}25` : colors.card,
                        borderWidth: 1.5,
                        borderColor: selected ? catColor : colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={{
                        color: selected ? catColor : colors.text2,
                        fontSize: 12,
                        fontWeight: selected ? "800" : "600",
                      }}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Start button */}
              <Pressable
                testID="empezar-transmision-button"
                onPress={handleStart}
                disabled={!canStart}
                style={({ pressed }) => ({
                  backgroundColor: canStart
                    ? pressed ? "#2D9E4A" : LIVE_GREEN
                    : colors.bg3,
                  borderRadius: 100,
                  paddingVertical: 17,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 10,
                  opacity: canStart ? 1 : 0.5,
                })}
              >
                <Video size={18} color={canStart ? "#000" : colors.text3} />
                <Text style={{
                  color: canStart ? "#000" : colors.text3,
                  fontSize: 15,
                  fontWeight: "800",
                }}>
                  Empezar Transmisión
                </Text>
              </Pressable>
            </>
          ) : (
            /* Broadcasting state */
            <View style={{ alignItems: "center", gap: 16 }}>
              <View style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                width: "100%",
                borderWidth: 1,
                borderColor: `${LIVE_RED}30`,
              }}>
                <Text style={{ color: colors.text2, fontSize: 11, fontWeight: "700", marginBottom: 4, letterSpacing: 0.5 }}>
                  TRANSMITIENDO
                </Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>{title}</Text>
                {selectedCategory ? (
                  <View style={{ flexDirection: "row", marginTop: 8 }}>
                    <View style={{
                      backgroundColor: `${CATEGORY_COLORS[selectedCategory]}20`,
                      borderRadius: 100,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: `${CATEGORY_COLORS[selectedCategory]}44`,
                    }}>
                      <Text style={{ color: CATEGORY_COLORS[selectedCategory], fontSize: 11, fontWeight: "700" }}>
                        {CATEGORY_LABELS[selectedCategory]}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <Pressable
                testID="end-broadcast-button"
                onPress={handleEnd}
                style={({ pressed }) => ({
                  width: "100%",
                  backgroundColor: pressed ? "#CC2E26" : LIVE_RED,
                  borderRadius: 100,
                  paddingVertical: 17,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 10,
                })}
              >
                <X size={18} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
                  Finalizar Directo
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function LiveScreen() {
  const { colors } = useTheme();
  const [selectedLive, setSelectedLive] = useState<LiveItem | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showStartLive, setShowStartLive] = useState(false);

  const activeLives = MOCK_LIVES.filter(l => l.isLive);
  const scheduledLives = MOCK_LIVES.filter(l => !l.isLive);
  const featuredLive = activeLives[0];
  const gridLives = activeLives.slice(1);

  const handleOpenLive = (live: LiveItem) => {
    setSelectedLive(live);
    setShowPlayer(true);
  };

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="live-screen">
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 }}>
              <Text style={{
                fontSize: 30, fontWeight: "900", color: colors.text, letterSpacing: -1,
              }}>
                Directos
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <PulsingDot color={LIVE_RED} size={8} />
              <Text style={{
                color: LIVE_RED,
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 1.5,
              }}>
                EN VIVO
              </Text>
              <Text style={{ color: colors.text3, fontSize: 11 }}>
                · {activeLives.length} activos
              </Text>
            </View>
          </View>

          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: `${LIVE_RED}15`,
            borderWidth: 1,
            borderColor: `${LIVE_RED}30`,
            borderRadius: 100,
            paddingHorizontal: 12,
            paddingVertical: 7,
          }}>
            <Radio size={13} color={LIVE_RED} />
            <Text style={{ color: LIVE_RED, fontSize: 11, fontWeight: "700" }}>
              {activeLives.length} en vivo
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        >
          {/* Featured live */}
          {featuredLive ? (
            <>
              <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 }}>
                DESTACADO
              </Text>
              <FeaturedCard live={featuredLive} onPress={() => handleOpenLive(featuredLive)} />
            </>
          ) : null}

          {/* Grid lives */}
          {gridLives.length > 0 ? (
            <>
              <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 12 }}>
                EN VIVO AHORA
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                {gridLives.map((live, i) => (
                  <GridCard
                    key={live.id}
                    live={live}
                    index={i}
                    onPress={() => handleOpenLive(live)}
                  />
                ))}
              </View>
            </>
          ) : null}

          {/* Scheduled section */}
          {scheduledLives.length > 0 ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>
                  PRÓXIMOS DIRECTOS
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>
              {scheduledLives.map((live, i) => (
                <ScheduledCard key={live.id} live={live} index={i} />
              ))}
            </>
          ) : null}
        </ScrollView>

        {/* FAB: Iniciar Directo */}
        <Animated.View
          style={[fabStyle, {
            position: "absolute",
            bottom: 32,
            alignSelf: "center",
          }]}
        >
          <Pressable
            testID="iniciar-directo-fab"
            onPressIn={() => { fabScale.value = withSpring(0.95); }}
            onPressOut={() => { fabScale.value = withSpring(1); }}
            onPress={() => setShowStartLive(true)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: LIVE_GREEN,
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 100,
              shadowColor: LIVE_GREEN,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 10,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Radio size={16} color="#000" />
            <Text style={{ color: "#000", fontWeight: "900", fontSize: 14, letterSpacing: -0.2 }}>
              Iniciar Directo
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      {/* Live Player */}
      <LivePlayerModal
        live={selectedLive}
        visible={showPlayer}
        onClose={() => {
          setShowPlayer(false);
          setSelectedLive(null);
        }}
      />

      {/* Start Live */}
      <StartLiveModal
        visible={showStartLive}
        onClose={() => setShowStartLive(false)}
      />
    </View>
  );
}
