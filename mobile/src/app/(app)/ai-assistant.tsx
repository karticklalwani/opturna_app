import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
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
} from "lucide-react-native";
import { authClient } from "@/lib/auth/auth-client";
import { fetch } from "expo/fetch";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

interface SuggestedPrompt {
  id: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  text: string;
  category: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Business",
  "Finance",
  "Taxation",
  "Strategy",
  "Productivity",
  "Mindset",
  "Growth",
];

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  // Business
  {
    id: "b1",
    icon: TrendingUp,
    text: "How to structure a startup for tax efficiency?",
    category: "Business",
  },
  {
    id: "b2",
    icon: Users,
    text: "Cap table basics for founders",
    category: "Business",
  },
  {
    id: "b3",
    icon: FileText,
    text: "Give me a business model for a digital product",
    category: "Business",
  },
  {
    id: "b4",
    icon: Target,
    text: "How to validate a business idea in 2 weeks?",
    category: "Business",
  },
  // Finance
  {
    id: "f1",
    icon: BarChart2,
    text: "Analyze my personal finance structure",
    category: "Finance",
  },
  {
    id: "f2",
    icon: DollarSign,
    text: "Best investment strategies for 2025",
    category: "Finance",
  },
  {
    id: "f3",
    icon: TrendingUp,
    text: "How to build a 6-month emergency fund?",
    category: "Finance",
  },
  {
    id: "f4",
    icon: BarChart2,
    text: "Explain compound interest with real examples",
    category: "Finance",
  },
  // Taxation
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
  // Strategy
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
  // Productivity
  {
    id: "p1",
    icon: Target,
    text: "Help me organize my week for maximum focus",
    category: "Productivity",
  },
  {
    id: "p2",
    icon: Zap,
    text: "Best deep work techniques for entrepreneurs",
    category: "Productivity",
  },
  // Mindset
  {
    id: "m1",
    icon: Lightbulb,
    text: "How to build discipline and consistency",
    category: "Mindset",
  },
  {
    id: "m2",
    icon: Sparkles,
    text: "How do high performers manage stress?",
    category: "Mindset",
  },
  // Growth
  {
    id: "g1",
    icon: Users,
    text: "Help me improve my personal brand",
    category: "Growth",
  },
  {
    id: "g2",
    icon: TrendingUp,
    text: "How to grow from 0 to 1000 customers?",
    category: "Growth",
  },
];

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

// ─── Dot animation component ─────────────────────────────────────────────────

function TypingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 200 })
      ),
      -1,
      false
    );
  }, [translateY, delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Stagger via delay in JS side — start with an initial pause
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

  return (
    <Animated.View
      style={[
        {
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: "#F59E0B",
          marginHorizontal: 2,
        },
        animStyle,
      ]}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AiAssistantScreen() {
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string>("Taxation");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const abortRef = useRef<boolean>(false);

  const accentSoft = "#F59E0B18";
  const accentBorder = "#F59E0B38";
  const cyanSoft = "#00B4D818";
  const cyanBorder = "#00B4D838";
  const AMBER = "#F59E0B";
  const CYAN = "#00B4D8";

  const filteredPrompts = SUGGESTED_PROMPTS.filter(
    (p) => p.category === activeCategory
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, []);

  // Auto-scroll when streaming text updates
  useEffect(() => {
    if (streamingText) {
      scrollToBottom();
    }
  }, [streamingText, scrollToBottom]);

  const handleSend = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? inputText).trim();
      if (!trimmed || isStreaming || isThinking) return;

      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content: trimmed,
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
              if (event.type === "response.output_text.delta" && event.delta) {
                accumulatedText += event.delta;
                setStreamingText(accumulatedText);
              }
            } catch {
              // skip malformed JSON chunks
            }
          }
        }

        // Commit the streamed text as a permanent message
        if (accumulatedText) {
          const aiMessage: Message = {
            id: `msg-${Date.now()}-assistant`,
            role: "assistant",
            content: accumulatedText,
          };
          setMessages((prev) => [...prev, aiMessage]);
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
        };
        setMessages((prev) => [...prev, errorMessage]);
        scrollToBottom();
        console.error("AI stream error:", err);
      }
    },
    [inputText, messages, isStreaming, isThinking, scrollToBottom]
  );

  const handleClear = useCallback(() => {
    abortRef.current = true;
    setMessages([]);
    setStreamingText("");
    setIsThinking(false);
    setIsStreaming(false);
    setInputText("");
  }, []);

  const hasConversation = messages.length > 0 || isThinking || isStreaming;

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
              <Cpu size={18} color={AMBER} />
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

            {/* Clear button */}
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
                <RotateCcw size={14} color={colors.text3} />
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
        {/* ── Welcome State ── */}
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
                shadowColor: AMBER,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
              }}
            >
              <Cpu size={34} color={AMBER} />
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
                    backgroundColor: isActive ? AMBER : colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? AMBER : colors.border,
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

        {/* ── Suggestion prompts ── */}
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
              Suggested
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
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 14,
                        minHeight: 92,
                        justifyContent: "space-between",
                      }}
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
                        <Icon size={13} color={AMBER} />
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
            {messages.map((message) => {
              const isUser = message.role === "user";
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
                        <Cpu size={10} color={AMBER} />
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
                  <View
                    style={{
                      maxWidth: "82%",
                      backgroundColor: isUser ? AMBER : colors.card,
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
                </Animated.View>
              );
            })}

            {/* Streaming message bubble */}
            {(isStreaming && streamingText) ? (
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
                      backgroundColor: cyanSoft,
                      borderWidth: 1,
                      borderColor: cyanBorder,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Cpu size={10} color={CYAN} />
                  </View>
                  <Text
                    style={{
                      color: CYAN,
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
                    <Cpu size={10} color={AMBER} />
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
              placeholder="Ask anything about tax, finance, business..."
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
                    ? AMBER
                    : colors.bg,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor:
                  inputText.trim() && !isStreaming && !isThinking
                    ? AMBER
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
    </KeyboardAvoidingView>
  );
}
