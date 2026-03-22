import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useMutation } from "@tanstack/react-query";
import {
  Bot,
  Send,
  Sparkles,
  AlertTriangle,
  User,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AIAdvisorResponse {
  response: string;
  topic: string;
  relatedTopics: string[];
  disclaimer: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  relatedTopics?: string[];
}

interface IALiquidezProps {
  financialContext?: {
    savings?: number;
    investments?: number;
    debt?: number;
    pledgedAmount?: number;
  };
}

// ─── Quick Topics ───────────────────────────────────────────────────────────

const QUICK_TOPICS = [
  { label: "Que es pignorar?", topic: "que_es_pignorar" },
  { label: "Ventajas vs desventajas", topic: "ventajas_desventajas" },
  { label: "Cuando conviene?", topic: "cuando_conviene" },
  { label: "Pignorar vs prestamo", topic: "pignorar_vs_prestamo" },
  { label: "Pignorar vs vender", topic: "pignorar_vs_vender" },
  { label: "Estrategias anti-inflacion", topic: "estrategias_anti_inflacion" },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function IALiquidez({ financialContext }: IALiquidezProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");

  // Mutation
  const advisor = useMutation<AIAdvisorResponse, Error, { question: string; topic?: string }>({
    mutationFn: (params) =>
      api.post<AIAdvisorResponse>("/api/inflation/ai-advisor", {
        question: params.question,
        topic: params.topic,
        financialContext,
      }),
    onSuccess: (data, variables) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response,
          relatedTopics: data.relatedTopics,
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  const handleSend = (text?: string, topic?: string) => {
    const question = text ?? inputText.trim();
    if (!question) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    advisor.mutate({ question, topic });
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleQuickTopic = (label: string, topic: string) => {
    handleSend(label, topic);
  };

  const handleRelatedTopic = (topic: string) => {
    handleSend(topic);
  };

  return (
    <View testID="ia-liquidez-container" style={{ gap: 12 }}>
      {/* Header */}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: "#8B5CF615",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={20} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.3 }}>
                IA Liquidez Inteligente
              </Text>
              <Text style={{ color: colors.text3, fontSize: 11 }}>
                Tu asesor financiero con IA
              </Text>
            </View>
            <Sparkles size={16} color="#8B5CF6" />
          </View>

          {/* Quick Topics */}
          {messages.length === 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.text3, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                Temas rapidos
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {QUICK_TOPICS.map((qt) => (
                  <Pressable
                    key={qt.topic}
                    testID={`ia-topic-${qt.topic}`}
                    onPress={() => handleQuickTopic(qt.label, qt.topic)}
                    disabled={advisor.isPending}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: colors.bg3,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.text2, fontSize: 12, fontWeight: "500" }}>
                      {qt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Animated.View>

      {/* Chat Messages */}
      {messages.length > 0 ? (
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              maxHeight: 500,
            }}
          >
            <ScrollView
              ref={scrollRef}
              style={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ gap: 14, paddingBottom: 8 }}>
                {messages.map((msg) => (
                  <Animated.View key={msg.id} entering={FadeIn.duration(300)}>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "flex-start",
                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                      }}
                    >
                      {msg.role === "assistant" ? (
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 10,
                            backgroundColor: "#8B5CF615",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 2,
                          }}
                        >
                          <Bot size={14} color="#8B5CF6" />
                        </View>
                      ) : null}

                      <View
                        style={{
                          maxWidth: "78%",
                          backgroundColor:
                            msg.role === "user" ? "#8B5CF620" : colors.bg3,
                          borderRadius: 16,
                          borderTopLeftRadius: msg.role === "assistant" ? 4 : 16,
                          borderTopRightRadius: msg.role === "user" ? 4 : 16,
                          padding: 14,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 13,
                            lineHeight: 20,
                          }}
                        >
                          {msg.content}
                        </Text>

                        {/* Related Topics */}
                        {msg.relatedTopics && msg.relatedTopics.length > 0 ? (
                          <View style={{ marginTop: 10, gap: 6 }}>
                            <Text style={{ color: colors.text4, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                              Temas relacionados
                            </Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                              {msg.relatedTopics.map((topic, idx) => (
                                <Pressable
                                  key={idx}
                                  testID={`ia-related-${idx}`}
                                  onPress={() => handleRelatedTopic(topic)}
                                  disabled={advisor.isPending}
                                  style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 8,
                                    backgroundColor: `${colors.accent}10`,
                                    borderWidth: 1,
                                    borderColor: `${colors.accent}20`,
                                  }}
                                >
                                  <Text style={{ color: colors.accent, fontSize: 11 }}>
                                    {topic}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        ) : null}
                      </View>

                      {msg.role === "user" ? (
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 10,
                            backgroundColor: `${colors.accent}15`,
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 2,
                          }}
                        >
                          <User size={14} color={colors.accent} />
                        </View>
                      ) : null}
                    </View>
                  </Animated.View>
                ))}

                {/* Loading indicator */}
                {advisor.isPending ? (
                  <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 10,
                        backgroundColor: "#8B5CF615",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Bot size={14} color="#8B5CF6" />
                    </View>
                    <View
                      style={{
                        backgroundColor: colors.bg3,
                        borderRadius: 16,
                        borderTopLeftRadius: 4,
                        padding: 14,
                      }}
                    >
                      <ActivityIndicator size="small" color="#8B5CF6" />
                    </View>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      ) : null}

      {/* Input Bar */}
      <Animated.View entering={FadeInDown.duration(400).delay(messages.length > 0 ? 0 : 200)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TextInput
              testID="ia-input"
              style={{
                flex: 1,
                backgroundColor: colors.bg3,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: colors.text,
                fontSize: 14,
                borderWidth: 1,
                borderColor: colors.border,
                maxHeight: 100,
              }}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Pregunta sobre liquidez y finanzas..."
              placeholderTextColor={colors.text4}
              multiline
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <Pressable
              testID="ia-send-button"
              onPress={() => handleSend()}
              disabled={advisor.isPending || !inputText.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: inputText.trim() ? "#8B5CF6" : colors.bg3,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={18} color={inputText.trim() ? "#FFF" : colors.text4} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Disclaimer */}
      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            paddingHorizontal: 4,
            paddingVertical: 8,
          }}
        >
          <AlertTriangle size={12} color={colors.text4} style={{ marginTop: 2 }} />
          <Text style={{ color: colors.text4, fontSize: 10, flex: 1, lineHeight: 16 }}>
            Este asistente proporciona informacion general sobre finanzas y no constituye asesoramiento financiero profesional. Consulta con un asesor certificado antes de tomar decisiones financieras importantes.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
