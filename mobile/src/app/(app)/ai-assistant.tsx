import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import Animated, { FadeInDown, FadeInLeft, FadeInRight } from "react-native-reanimated";
import {
  Cpu,
  ArrowRight,
  Send,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart2,
  Zap,
  Users,
} from "lucide-react-native";

type MessageRole = "user" | "ai";

interface Message {
  id: string;
  role: MessageRole;
  text: string;
}

const CATEGORIES = [
  "Productivity",
  "Business",
  "Finance",
  "Mindset",
  "Strategy",
  "Growth",
];

const SUGGESTED_PROMPTS = [
  {
    id: "1",
    icon: Target,
    text: "Help me organize my week for maximum focus",
    category: "Productivity",
  },
  {
    id: "2",
    icon: TrendingUp,
    text: "Give me a business model for a digital product",
    category: "Business",
  },
  {
    id: "3",
    icon: BarChart2,
    text: "Analyze my personal finance structure",
    category: "Finance",
  },
  {
    id: "4",
    icon: Zap,
    text: "Create a growth strategy for my startup",
    category: "Strategy",
  },
  {
    id: "5",
    icon: Lightbulb,
    text: "How to build discipline and consistency",
    category: "Mindset",
  },
  {
    id: "6",
    icon: Users,
    text: "Help me improve my personal brand",
    category: "Growth",
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "init-1",
    role: "user",
    text: "What's the best way to track my financial goals?",
  },
  {
    id: "init-2",
    role: "ai",
    text: "Great question! Here are 3 key strategies for tracking financial goals:\n\n1) Set clear monthly milestones with specific dollar amounts\n2) Review weekly against your targets every Sunday\n3) Use the Opturna Finance dashboard to visualize progress with charts and trend lines\n\nConsistency is the real edge — small weekly check-ins beat big quarterly reviews every time.",
  },
];

const MOCK_AI_RESPONSES: string[] = [
  "Here's a focused breakdown for you:\n\n1) Start with clarity on your single most important outcome this week\n2) Time-block 2–3 hour deep work sessions each morning\n3) Eliminate decision fatigue by planning tasks the night before\n\nThe goal isn't to do more — it's to do the right things with full focus.",
  "A strong digital product business model starts with:\n\n1) Identify a painful, recurring problem your audience has\n2) Build the minimum viable solution first (days, not months)\n3) Charge for it early to validate real demand\n4) Use profits to fund the next iteration\n\nDistribution beats product at the start — build your audience in parallel.",
  "Three pillars of financial discipline:\n\n1) Track every dollar for 30 days to see your real patterns\n2) Pay yourself first — automate savings before spending\n3) Set a monthly review ritual to measure progress against goals\n\nSmall, consistent actions compound into serious results over 12 months.",
];

export default function AiAssistantScreen() {
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string>("Business");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const responseIndexRef = useRef<number>(0);

  const accentSoft = `${colors.accent}18`;
  const accentBorder = `${colors.accent}38`;
  const accent3Soft = `${colors.accent3}18`;
  const accent3Border = `${colors.accent3}38`;

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isThinking) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsThinking(true);

    setTimeout(() => {
      const responseText =
        MOCK_AI_RESPONSES[responseIndexRef.current % MOCK_AI_RESPONSES.length] ??
        MOCK_AI_RESPONSES[0];
      responseIndexRef.current += 1;

      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "ai",
        text: responseText,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsThinking(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 2000);
  };

  const handlePromptPress = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      testID="ai-assistant-screen"
    >
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 6,
              gap: 10,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: accentSoft,
                borderWidth: 1,
                borderColor: accentBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cpu size={17} color={colors.accent} />
            </View>
            <Text
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 22,
                fontWeight: "800",
                letterSpacing: -0.5,
              }}
            >
              AI Assistant
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 100,
                backgroundColor: accent3Soft,
                borderWidth: 1,
                borderColor: accent3Border,
              }}
            >
              <Text
                style={{
                  color: colors.accent3,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 0.4,
                }}
              >
                OPTURNA AI
              </Text>
            </View>
          </View>
          <Text
            style={{
              color: colors.text3,
              fontSize: 13,
              fontWeight: "400",
            }}
          >
            Your intelligent growth companion
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Categories Row */}
        <Animated.View entering={FadeInDown.delay(60).duration(350).springify()}>
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
                      color: isActive ? colors.bg : colors.text3,
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

        {/* Suggested Prompts Grid */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(350).springify()}
          style={{ marginHorizontal: 16, marginTop: 16 }}
        >
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.6,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Suggested Prompts
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {SUGGESTED_PROMPTS.map((prompt, index) => {
              const Icon = prompt.icon;
              return (
                <Animated.View
                  key={prompt.id}
                  entering={FadeInDown.delay(140 + index * 40).duration(300).springify()}
                  style={{ width: "47.5%" }}
                >
                  <Pressable
                    onPress={() => handlePromptPress(prompt.text)}
                    testID={`prompt-${prompt.id}`}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 14,
                      minHeight: 90,
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
                      <Icon size={13} color={colors.accent} />
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
                      <Text
                        style={{
                          flex: 1,
                          color: colors.text2,
                          fontSize: 12,
                          lineHeight: 17,
                          fontWeight: "500",
                        }}
                        numberOfLines={3}
                      >
                        {prompt.text}
                      </Text>
                      <ArrowRight size={12} color={colors.text3} />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Chat Interface */}
        <Animated.View
          entering={FadeInDown.delay(380).duration(350).springify()}
          style={{ marginHorizontal: 16, marginTop: 20 }}
        >
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.6,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Conversation
          </Text>

          <View style={{ gap: 10 }}>
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <Animated.View
                  key={message.id}
                  entering={isUser ? FadeInRight.duration(280) : FadeInLeft.duration(280)}
                  style={{
                    alignItems: isUser ? "flex-end" : "flex-start",
                  }}
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
                          fontWeight: "600",
                          letterSpacing: 0.3,
                        }}
                      >
                        OPTURNA AI
                      </Text>
                    </View>
                  ) : null}
                  <View
                    style={{
                      maxWidth: "80%",
                      backgroundColor: isUser ? colors.accent : colors.card,
                      borderRadius: isUser ? 18 : 14,
                      borderBottomRightRadius: isUser ? 4 : 14,
                      borderBottomLeftRadius: isUser ? 14 : 4,
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      borderWidth: isUser ? 0 : 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: isUser ? colors.bg : colors.text2,
                        fontSize: 14,
                        lineHeight: 21,
                        fontWeight: isUser ? "500" : "400",
                      }}
                    >
                      {message.text}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}

            {/* Thinking indicator */}
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
                      fontWeight: "600",
                      letterSpacing: 0.3,
                    }}
                  >
                    OPTURNA AI
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    borderBottomLeftRadius: 4,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={{ color: colors.text3, fontSize: 13 }}>Thinking...</Text>
                </View>
              </Animated.View>
            ) : null}
          </View>
        </Animated.View>

        {/* Input Area */}
        <Animated.View
          entering={FadeInDown.delay(440).duration(350).springify()}
          style={{ marginHorizontal: 16, marginTop: 16 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 10,
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask anything..."
              placeholderTextColor={colors.text3}
              multiline
              testID="ai-input"
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
              onPress={handleSend}
              disabled={!inputText.trim() || isThinking}
              testID="send-button"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor:
                  inputText.trim() && !isThinking ? colors.accent : colors.bg3,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor:
                  inputText.trim() && !isThinking ? colors.accent : colors.border,
              }}
            >
              <Send
                size={15}
                color={
                  inputText.trim() && !isThinking ? colors.bg : colors.text3
                }
              />
            </Pressable>
          </View>
          <Text
            style={{
              color: colors.text3,
              fontSize: 10,
              textAlign: "center",
              marginTop: 8,
              fontWeight: "400",
            }}
          >
            Opturna AI may produce inaccurate information. Verify important facts.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
