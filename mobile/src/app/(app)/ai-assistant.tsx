import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Cpu,
  Send,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart2,
  Zap,
  Users,
  Landmark,
  Globe,
  DollarSign,
  FileText,
  RotateCcw,
  Sparkles,
  Clock,
  Plus,
  Copy,
  RefreshCw,
  Brain,
  BookOpen,
  X,
  ChevronRight,
  MessageSquare,
  Calendar,
  Flame,
} from "lucide-react-native";
import { authClient } from "@/lib/auth/auth-client";
import { fetch } from "expo/fetch";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  preview: string;
  messageCount: number;
}

interface SuggestedPrompt {
  id: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  text: string;
  category: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HISTORY_STORAGE_KEY = "opturna-ai-chat-sessions";
const MAX_SESSIONS = 30;

const CATEGORIES = [
  "Negocios",
  "Finanzas",
  "Productividad",
  "Filosofía",
  "Trading",
  "Personal",
  "Plan",
  "Taxation",
  "Strategy",
];

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  // Negocios
  {
    id: "neg1",
    icon: Target,
    text: "¿Cómo validar una idea de negocio?",
    category: "Negocios",
  },
  {
    id: "neg2",
    icon: TrendingUp,
    text: "Dame 5 estrategias de marketing digital",
    category: "Negocios",
  },
  {
    id: "neg3",
    icon: Users,
    text: "¿Cómo construir un equipo de alto rendimiento?",
    category: "Negocios",
  },
  {
    id: "neg4",
    icon: FileText,
    text: "¿Qué es un modelo de negocio canvas?",
    category: "Negocios",
  },
  // Finanzas
  {
    id: "fin1",
    icon: DollarSign,
    text: "¿Cómo crear un presupuesto personal efectivo?",
    category: "Finanzas",
  },
  {
    id: "fin2",
    icon: BarChart2,
    text: "Explícame la regla del 50/30/20",
    category: "Finanzas",
  },
  {
    id: "fin3",
    icon: TrendingUp,
    text: "¿Cómo invertir con poco dinero?",
    category: "Finanzas",
  },
  {
    id: "fin4",
    icon: Landmark,
    text: "¿Qué es el interés compuesto?",
    category: "Finanzas",
  },
  // Productividad
  {
    id: "prod1",
    icon: Zap,
    text: "¿Cómo aplicar el método Pomodoro?",
    category: "Productividad",
  },
  {
    id: "prod2",
    icon: Target,
    text: "Dame una rutina matutina de alto rendimiento",
    category: "Productividad",
  },
  {
    id: "prod3",
    icon: Brain,
    text: "¿Cómo eliminar procrastinación?",
    category: "Productividad",
  },
  {
    id: "prod4",
    icon: BookOpen,
    text: "Técnicas para aprender más rápido",
    category: "Productividad",
  },
  // Filosofía
  {
    id: "fil1",
    icon: Sparkles,
    text: "¿Qué enseña el estoicismo sobre el éxito?",
    category: "Filosofía",
  },
  {
    id: "fil2",
    icon: Lightbulb,
    text: "¿Cuál es el significado del ikigai?",
    category: "Filosofía",
  },
  {
    id: "fil3",
    icon: Brain,
    text: "Explícame la filosofía de Nietzsche",
    category: "Filosofía",
  },
  {
    id: "fil4",
    icon: BookOpen,
    text: "¿Qué es la mentalidad de crecimiento?",
    category: "Filosofía",
  },
  // Trading
  {
    id: "trd1",
    icon: BarChart2,
    text: "Explícame el análisis técnico",
    category: "Trading",
  },
  {
    id: "trd2",
    icon: TrendingUp,
    text: "¿Qué es el RSI y cómo usarlo?",
    category: "Trading",
  },
  {
    id: "trd3",
    icon: Target,
    text: "Estrategias de gestión de riesgo",
    category: "Trading",
  },
  {
    id: "trd4",
    icon: DollarSign,
    text: "¿Qué son las medias móviles?",
    category: "Trading",
  },
  // Personal
  {
    id: "per1",
    icon: Sparkles,
    text: "¿Cómo mejorar mi inteligencia emocional?",
    category: "Personal",
  },
  {
    id: "per2",
    icon: TrendingUp,
    text: "Hábitos para mejorar mi vida en 90 días",
    category: "Personal",
  },
  {
    id: "per3",
    icon: Brain,
    text: "¿Cómo desarrollar más confianza?",
    category: "Personal",
  },
  {
    id: "per4",
    icon: Target,
    text: "¿Cómo establecer metas que realmente logre?",
    category: "Personal",
  },
  // Taxation (existing)
  {
    id: "t1",
    icon: Globe,
    text: "What's the corporate tax rate in UAE?",
    category: "Taxation",
  },
  {
    id: "t2",
    icon: DollarSign,
    text: "How does the US capital gains tax work?",
    category: "Taxation",
  },
  {
    id: "t3",
    icon: Landmark,
    text: "Explain OECD Pillar Two global minimum tax",
    category: "Taxation",
  },
  {
    id: "t4",
    icon: FileText,
    text: "What's the difference between ISR and IVA in Mexico?",
    category: "Taxation",
  },
  // Strategy (existing)
  {
    id: "s1",
    icon: Zap,
    text: "Create a growth strategy for my startup",
    category: "Strategy",
  },
  {
    id: "s2",
    icon: Target,
    text: "How to use OKRs effectively for a small team?",
    category: "Strategy",
  },
  {
    id: "s3",
    icon: TrendingUp,
    text: "Blue ocean vs red ocean strategy explained",
    category: "Strategy",
  },
  {
    id: "s4",
    icon: BarChart2,
    text: "How to do a SWOT analysis for my business?",
    category: "Strategy",
  },
  // Plan / Organización
  {
    id: "plan1",
    icon: Calendar,
    text: "Organiza mi día de forma efectiva",
    category: "Plan",
  },
  {
    id: "plan2",
    icon: Target,
    text: "Crea un plan semanal de productividad para mí",
    category: "Plan",
  },
  {
    id: "plan3",
    icon: Target,
    text: "Ayúdame a definir mis objetivos para este año",
    category: "Plan",
  },
  {
    id: "plan4",
    icon: Flame,
    text: "Dame un plan para mejorar mis hábitos en 30 días",
    category: "Plan",
  },
  {
    id: "plan5",
    icon: DollarSign,
    text: "Crea un plan financiero personal completo",
    category: "Plan",
  },
  {
    id: "plan6",
    icon: BookOpen,
    text: "Diseña un plan de estudio efectivo para mí",
    category: "Plan",
  },
  {
    id: "plan7",
    icon: TrendingUp,
    text: "Ayúdame a crear un plan de negocio desde cero",
    category: "Plan",
  },
];

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

function formatSessionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }
}

async function loadSessions(): Promise<ChatSession[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

async function saveSessions(sessions: ChatSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // silently fail
  }
}

// ─── Dot animation component ─────────────────────────────────────────────────

function TypingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 280, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 240 })
        ),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: "#4ADE80",
          marginHorizontal: 2,
        },
        animStyle,
      ]}
    />
  );
}

// ─── History Modal ────────────────────────────────────────────────────────────

interface HistoryModalProps {
  visible: boolean;
  sessions: ChatSession[];
  onClose: () => void;
  onSelectSession: (session: ChatSession) => void;
  onNewConversation: () => void;
  onDeleteSession: (sessionId: string) => void;
}

function HistoryModal({
  visible,
  sessions,
  onClose,
  onSelectSession,
  onNewConversation,
  onDeleteSession,
}: HistoryModalProps) {
  const { colors } = useTheme();
  const accentSoft = `${colors.accent}18`;
  const accentBorder = `${colors.accent}38`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "800",
                  letterSpacing: -0.4,
                }}
              >
                Historial
              </Text>
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {sessions.length} conversacion{sessions.length !== 1 ? "es" : ""}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              testID="history-close-button"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color={colors.text3} />
            </Pressable>
          </View>
        </SafeAreaView>

        {/* New Conversation Button */}
        <Pressable
          onPress={() => {
            onNewConversation();
            onClose();
          }}
          testID="new-conversation-button"
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            marginBottom: 8,
            backgroundColor: accentSoft,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: accentBorder,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={16} color="#000" />
          </View>
          <Text
            style={{
              color: colors.accent,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Nueva Conversacion
          </Text>
        </Pressable>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {sessions.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingTop: 60,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  backgroundColor: accentSoft,
                  borderWidth: 1,
                  borderColor: accentBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageSquare size={26} color={colors.text4} />
              </View>
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                No hay conversaciones anteriores
              </Text>
            </View>
          ) : null}

          {sessions.map((session) => (
            <Pressable
              key={session.id}
              onPress={() => {
                onSelectSession(session);
                onClose();
              }}
              testID={`session-${session.id}`}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.bg3 : colors.card,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: accentSoft,
                  borderWidth: 1,
                  borderColor: accentBorder,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={17} color={colors.accent} />
              </View>

              <View style={{ flex: 1, gap: 3 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 13,
                    fontWeight: "600",
                    lineHeight: 18,
                  }}
                  numberOfLines={2}
                >
                  {session.preview}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text
                    style={{
                      color: colors.text3,
                      fontSize: 11,
                    }}
                  >
                    {formatSessionDate(session.updatedAt)}
                  </Text>
                  <View
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: colors.text4,
                    }}
                  />
                  <Text
                    style={{
                      color: colors.text3,
                      fontSize: 11,
                    }}
                  >
                    {session.messageCount} msg{session.messageCount !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Pressable
                  onPress={() => onDeleteSession(session.id)}
                  testID={`delete-session-${session.id}`}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: `${colors.accent2}15`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  hitSlop={8}
                >
                  <X size={12} color={colors.accent2} />
                </Pressable>
                <ChevronRight size={14} color={colors.text4} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AiAssistantScreen() {
  const { colors } = useTheme();

  // Chat state
  const [activeCategory, setActiveCategory] = useState<string>("Negocios");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Session / history state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [historyVisible, setHistoryVisible] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const abortRef = useRef<boolean>(false);

  const accentSoft = `${colors.accent}18`;
  const accentBorder = `${colors.accent}38`;
  const cyanBorder = `${colors.accent}38`;

  const filteredPrompts = SUGGESTED_PROMPTS.filter(
    (p) => p.category === activeCategory
  );

  // Load sessions on mount
  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, []);

  useEffect(() => {
    if (streamingText) {
      scrollToBottom();
    }
  }, [streamingText, scrollToBottom]);

  // Persist session whenever messages change
  const persistSession = useCallback(
    async (updatedMessages: Message[], sessionId: string) => {
      if (updatedMessages.length === 0) return;

      const firstUserMsg = updatedMessages.find((m) => m.role === "user");
      const preview = firstUserMsg
        ? firstUserMsg.content.slice(0, 80)
        : "Conversacion";

      const now = Date.now();
      const session: ChatSession = {
        id: sessionId,
        messages: updatedMessages,
        createdAt: now,
        updatedAt: now,
        preview,
        messageCount: updatedMessages.length,
      };

      const existingSessions = await loadSessions();
      const filtered = existingSessions.filter((s) => s.id !== sessionId);
      const updated = [session, ...filtered].slice(0, MAX_SESSIONS);
      setSessions(updated);
      await saveSessions(updated);
    },
    []
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? inputText).trim();
      if (!trimmed || isStreaming || isThinking) return;

      // Create or reuse session id
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = `session-${Date.now()}`;
        setCurrentSessionId(sessionId);
      }

      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInputText("");
      setIsThinking(true);
      setStreamingText("");
      abortRef.current = false;
      scrollToBottom();

      try {
        const cookieHeader = authClient.getCookie();

        const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
          credentials: "include",
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        setIsThinking(false);
        setIsStreaming(true);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No readable stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";

        while (true) {
          if (abortRef.current) {
            reader.cancel();
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              reader.cancel();
              break;
            }
            try {
              const event = JSON.parse(data);
              // Handle chat completions streaming format
              const delta = event.choices?.[0]?.delta?.content;
              if (delta) {
                accumulatedText += delta;
                setStreamingText(accumulatedText);
              }
            } catch {
              // skip malformed JSON chunks
            }
          }
        }

        if (accumulatedText) {
          const aiMessage: Message = {
            id: `msg-${Date.now()}-assistant`,
            role: "assistant",
            content: accumulatedText,
            timestamp: Date.now(),
          };
          const finalMessages = [...updatedMessages, aiMessage];
          setMessages(finalMessages);
          await persistSession(finalMessages, sessionId);
        }
        setStreamingText("");
        setIsStreaming(false);
        scrollToBottom();
      } catch (err) {
        setIsThinking(false);
        setIsStreaming(false);
        setStreamingText("");

        const errorMessage: Message = {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please check your connection and try again.",
          timestamp: Date.now(),
        };
        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);
        await persistSession(finalMessages, sessionId);
        scrollToBottom();
        console.error("AI stream error:", err);
      }
    },
    [inputText, messages, isStreaming, isThinking, scrollToBottom, currentSessionId, persistSession]
  );

  const handleRegenerate = useCallback(async () => {
    if (isStreaming || isThinking || messages.length < 2) return;
    // Remove last assistant message and resend
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const userMsgIdx = messages.length - 1 - lastUserIdx;
    const messagesUpToUser = messages.slice(0, userMsgIdx + 1);
    const lastUserMsg = messages[userMsgIdx];
    setMessages(messagesUpToUser.slice(0, -1));
    await handleSend(lastUserMsg.content);
  }, [messages, isStreaming, isThinking, handleSend]);

  const handleClear = useCallback(() => {
    abortRef.current = true;
    setMessages([]);
    setStreamingText("");
    setIsThinking(false);
    setIsStreaming(false);
    setInputText("");
    setCurrentSessionId(null);
  }, []);

  const handleLoadSession = useCallback((session: ChatSession) => {
    abortRef.current = true;
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setStreamingText("");
    setIsThinking(false);
    setIsStreaming(false);
    setInputText("");
    setTimeout(() => scrollToBottom(), 200);
  }, [scrollToBottom]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    await saveSessions(updated);
    if (currentSessionId === sessionId) {
      handleClear();
    }
  }, [sessions, currentSessionId, handleClear]);

  const handleCopyMessage = useCallback((content: string, messageId: string) => {
    Clipboard.setString(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  }, []);

  const hasConversation = messages.length > 0 || isThinking || isStreaming;

  // Find index of last assistant message for regenerate button
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      testID="ai-assistant-screen"
    >
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        {/* ── Header ── */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: accentSoft,
                borderWidth: 1,
                borderColor: accentBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cpu size={18} color={colors.accent} />
            </View>

            {/* Title + Subtitle */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 20,
                    fontWeight: "800",
                    letterSpacing: -0.4,
                  }}
                >
                  Opturna AI
                </Text>
                {/* LIVE badge */}
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 100,
                    backgroundColor: "#10B98118",
                    borderWidth: 1,
                    borderColor: "#10B98138",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: "#10B981",
                    }}
                  />
                  <Text
                    style={{
                      color: "#10B981",
                      fontSize: 9,
                      fontWeight: "700",
                      letterSpacing: 0.5,
                    }}
                  >
                    LIVE
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 11,
                  fontWeight: "400",
                  marginTop: 1,
                }}
              >
                Expert in business, finance & global taxation
              </Text>
            </View>

            {/* History button */}
            <Pressable
              onPress={() => setHistoryVisible(true)}
              testID="history-button"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={15} color={colors.text3} />
            </Pressable>

            {/* Clear / New conversation button */}
            {hasConversation ? (
              <Pressable
                onPress={handleClear}
                testID="clear-button"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={15} color={colors.text3} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Welcome / Empty State ── */}
        {!hasConversation ? (
          <Animated.View
            entering={FadeInDown.delay(60).duration(400).springify()}
            style={{ alignItems: "center", paddingTop: 40, paddingHorizontal: 24 }}
          >
            {/* AI Glow Icon */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: accentSoft,
                borderWidth: 1.5,
                borderColor: accentBorder,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                shadowColor: colors.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
              }}
            >
              <Cpu size={34} color={colors.accent} />
            </View>

            <Text
              style={{
                color: colors.text,
                fontSize: 26,
                fontWeight: "800",
                letterSpacing: -0.6,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Ask me anything
            </Text>
            <Text
              style={{
                color: colors.text3,
                fontSize: 14,
                textAlign: "center",
                lineHeight: 21,
                marginBottom: 32,
                maxWidth: 280,
              }}
            >
              Expert in global taxation, finance, and business strategy
            </Text>
          </Animated.View>
        ) : null}

        {/* ── Categories bar ── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(350).springify()}
          style={{ marginTop: hasConversation ? 16 : 0 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 8,
              paddingBottom: 4,
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  testID={`category-${cat.toLowerCase()}`}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor: isActive ? colors.accent : colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? colors.accent : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? "#000" : colors.text3,
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "500",
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── Suggestion prompts (empty state only) ── */}
        {!hasConversation ? (
          <Animated.View
            entering={FadeInDown.delay(160).duration(350).springify()}
            style={{ marginHorizontal: 16, marginTop: 16 }}
          >
            <Text
              style={{
                color: colors.text3,
                fontSize: 10,
                fontWeight: "600",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Sugerencias
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {filteredPrompts.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <Animated.View
                    key={prompt.id}
                    entering={FadeInDown.delay(180 + index * 40)
                      .duration(300)
                      .springify()}
                    style={{ width: "47.5%" }}
                  >
                    <Pressable
                      onPress={() => handleSend(prompt.text)}
                      testID={`prompt-${prompt.id}`}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? colors.bg3 : colors.card,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: pressed ? accentBorder : colors.border,
                        padding: 14,
                        minHeight: 92,
                        justifyContent: "space-between",
                      })}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: accentSoft,
                          borderWidth: 1,
                          borderColor: accentBorder,
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Icon size={13} color={colors.accent} />
                      </View>
                      <Text
                        style={{
                          color: colors.text2,
                          fontSize: 12,
                          lineHeight: 17,
                          fontWeight: "500",
                        }}
                        numberOfLines={3}
                      >
                        {prompt.text}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        {/* ── Conversation ── */}
        {hasConversation ? (
          <View style={{ marginHorizontal: 16, marginTop: 16, gap: 14 }}>
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              const isLastAssistant = index === lastAssistantIndex;
              const isCopied = copiedMessageId === message.id;

              return (
                <Animated.View
                  key={message.id}
                  entering={
                    isUser
                      ? FadeInRight.duration(250)
                      : FadeInLeft.duration(250)
                  }
                  style={{ alignItems: isUser ? "flex-end" : "flex-start" }}
                >
                  {!isUser ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          backgroundColor: accentSoft,
                          borderWidth: 1,
                          borderColor: accentBorder,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Cpu size={10} color={colors.accent} />
                      </View>
                      <Text
                        style={{
                          color: colors.text3,
                          fontSize: 10,
                          fontWeight: "700",
                          letterSpacing: 0.4,
                        }}
                      >
                        OPTURNA AI
                      </Text>
                    </View>
                  ) : null}

                  <Pressable
                    onLongPress={() => handleCopyMessage(message.content, message.id)}
                    delayLongPress={400}
                    testID={`message-${message.id}`}
                    style={{
                      maxWidth: "82%",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: isUser ? colors.accent : colors.card,
                        borderRadius: 18,
                        borderBottomRightRadius: isUser ? 4 : 18,
                        borderBottomLeftRadius: isUser ? 18 : 4,
                        paddingHorizontal: 15,
                        paddingVertical: 12,
                        borderWidth: isUser ? 0 : 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: isUser ? "#000" : colors.text2,
                          fontSize: 14,
                          lineHeight: 22,
                          fontWeight: isUser ? "600" : "400",
                        }}
                      >
                        {message.content}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Timestamp + Copy row */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.text4,
                        fontSize: 10,
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Text>
                    <Pressable
                      onPress={() => handleCopyMessage(message.content, message.id)}
                      testID={`copy-${message.id}`}
                      hitSlop={6}
                    >
                      {isCopied ? (
                        <Animated.View entering={FadeIn.duration(150)}>
                          <Text
                            style={{
                              color: colors.accent,
                              fontSize: 10,
                              fontWeight: "600",
                            }}
                          >
                            Copiado
                          </Text>
                        </Animated.View>
                      ) : (
                        <Copy size={11} color={colors.text4} />
                      )}
                    </Pressable>
                  </View>

                  {/* Regenerate button on last AI message */}
                  {!isUser && isLastAssistant && !isStreaming && !isThinking ? (
                    <Pressable
                      onPress={handleRegenerate}
                      testID="regenerate-button"
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 2,
                        paddingHorizontal: 4,
                      }}
                    >
                      <RefreshCw size={11} color={colors.text3} />
                      <Text
                        style={{
                          color: colors.text3,
                          fontSize: 11,
                          fontWeight: "500",
                        }}
                      >
                        Regenerar
                      </Text>
                    </Pressable>
                  ) : null}
                </Animated.View>
              );
            })}

            {/* Streaming message bubble */}
            {isStreaming && streamingText ? (
              <Animated.View
                entering={FadeInLeft.duration(200)}
                style={{ alignItems: "flex-start" }}
                testID="streaming-message"
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 5,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: accentSoft,
                      borderWidth: 1,
                      borderColor: cyanBorder,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Cpu size={10} color={colors.accent} />
                  </View>
                  <Text
                    style={{
                      color: colors.accent,
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 0.4,
                    }}
                  >
                    OPTURNA AI
                  </Text>
                </View>
                <View
                  style={{
                    maxWidth: "82%",
                    backgroundColor: colors.card,
                    borderRadius: 18,
                    borderBottomLeftRadius: 4,
                    paddingHorizontal: 15,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: cyanBorder,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text2,
                      fontSize: 14,
                      lineHeight: 22,
                      fontWeight: "400",
                    }}
                  >
                    {streamingText}
                  </Text>
                </View>
              </Animated.View>
            ) : null}

            {/* Thinking dots */}
            {isThinking ? (
              <Animated.View
                entering={FadeInLeft.duration(200)}
                style={{ alignItems: "flex-start" }}
                testID="thinking-indicator"
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 5,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: accentSoft,
                      borderWidth: 1,
                      borderColor: accentBorder,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Cpu size={10} color={colors.accent} />
                  </View>
                  <Text
                    style={{
                      color: colors.text3,
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 0.4,
                    }}
                  >
                    OPTURNA AI
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 18,
                    borderBottomLeftRadius: 4,
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <TypingDot delay={0} />
                  <TypingDot delay={160} />
                  <TypingDot delay={320} />
                </View>
              </Animated.View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* ── Input Bar ── */}
      <SafeAreaView
        edges={["bottom"]}
        style={{
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 8,
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 10,
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor:
                inputText.length > 0 ? accentBorder : colors.border,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Pregunta sobre negocios, finanzas, trading..."
              placeholderTextColor={colors.text3}
              multiline
              testID="ai-input"
              onSubmitEditing={() => handleSend()}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 14,
                lineHeight: 20,
                maxHeight: 100,
                paddingTop: 2,
              }}
            />
            <Pressable
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isStreaming || isThinking}
              testID="send-button"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor:
                  inputText.trim() && !isStreaming && !isThinking
                    ? colors.accent
                    : colors.bg,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor:
                  inputText.trim() && !isStreaming && !isThinking
                    ? colors.accent
                    : colors.border,
              }}
            >
              <Send
                size={15}
                color={
                  inputText.trim() && !isStreaming && !isThinking
                    ? "#000"
                    : colors.text3
                }
              />
            </Pressable>
          </View>
          <Text
            style={{
              color: colors.text3,
              fontSize: 10,
              textAlign: "center",
              fontWeight: "400",
              opacity: 0.7,
            }}
          >
            Opturna AI may produce inaccurate information. Verify important facts.
          </Text>
        </View>
      </SafeAreaView>

      {/* ── History Modal ── */}
      <HistoryModal
        visible={historyVisible}
        sessions={sessions}
        onClose={() => setHistoryVisible(false)}
        onSelectSession={handleLoadSession}
        onNewConversation={handleClear}
        onDeleteSession={handleDeleteSession}
      />
    </KeyboardAvoidingView>
  );
}
