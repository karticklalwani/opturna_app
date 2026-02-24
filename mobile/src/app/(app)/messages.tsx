import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { Chat, Message } from "@/types";
import { useSession } from "@/lib/auth/use-session";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Send, ArrowLeft, Plus, X, MessageCircle } from "lucide-react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useTheme, DARK } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

type Colors = typeof DARK;

function ChatView({ chat, currentUserId, onBack, colors }: { chat: Chat; currentUserId: string; onBack: () => void; colors: Colors }) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const otherMember = chat.members?.find(m => m.user.id !== currentUserId);
  const name = chat.type === "direct" ? otherMember?.user?.name || "?" : (chat.name || "Group");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", chat.id],
    queryFn: () => api.get<Message[]>(`/api/chats/${chat.id}/messages`),
    refetchInterval: 3000,
  });

  const sendMsg = useMutation({
    mutationFn: () => api.post(`/api/chats/${chat.id}/messages`, { content: message }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages", chat.id] }); setMessage(""); },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="chat-view">
      <SafeAreaView edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TouchableOpacity onPress={onBack} style={{ marginRight: 14 }} testID="back-button">
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bg3, marginRight: 10, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {otherMember?.user?.image
              ? <Image source={{ uri: otherMember.user.image }} style={{ width: 38, height: 38 }} />
              : <Text style={{ color: colors.accent, fontWeight: "700" }}>{name[0]?.toUpperCase()}</Text>
            }
          </View>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>{name}</Text>
        </View>
      </SafeAreaView>
      {isLoading
        ? <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator"><ActivityIndicator color={colors.accent} /></View>
        : (
          <FlatList
            data={messages || []}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => {
              const isMe = item.senderId === currentUserId;
              return (
                <Animated.View entering={FadeInRight.duration(200)} style={{ padding: 12, alignItems: isMe ? "flex-end" : "flex-start" }}>
                  <View style={{ maxWidth: "75%", backgroundColor: isMe ? colors.accent : colors.bg3, borderRadius: 16, borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4, paddingHorizontal: 14, paddingVertical: 10 }}>
                    <Text style={{ color: isMe ? "#0A0A0A" : colors.text, fontSize: 15, lineHeight: 22 }}>{item.content}</Text>
                  </View>
                </Animated.View>
              );
            }}
            contentContainerStyle={{ padding: 8, paddingBottom: 20 }}
            testID="messages-list"
          />
        )}
      <SafeAreaView edges={["bottom"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 }}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Mensaje..."
              placeholderTextColor={colors.text4}
              testID="message-input"
              style={{ flex: 1, backgroundColor: colors.bg3, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 15 }}
              multiline
            />
            <TouchableOpacity
              onPress={() => sendMsg.mutate()}
              disabled={!message.trim() || sendMsg.isPending}
              testID="send-button"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: message.trim() ? colors.accent : colors.bg3, alignItems: "center", justifyContent: "center" }}
            >
              <Send size={18} color={message.trim() ? "#0A0A0A" : colors.text4} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export default function MessagesScreen() {
  const { data: session } = useSession();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const queryClient = useQueryClient();

  const { data: chats, isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: () => api.get<Chat[]>("/api/chats"),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["user-search", searchQ],
    queryFn: () => api.get<any[]>(`/api/users/search?q=${searchQ}`),
    enabled: searchQ.length > 1,
  });

  const createChat = useMutation({
    mutationFn: (recipientId: string) => api.post<Chat>("/api/chats", { type: "direct", recipientId }),
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setShowNewChat(false);
      setSearchQ("");
      if (chat) setSelectedChat(chat);
    },
  });

  if (selectedChat) {
    return <ChatView chat={selectedChat} currentUserId={session?.user?.id || ""} onBack={() => setSelectedChat(null)} colors={colors} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="messages-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, flex: 1, letterSpacing: -0.5 }}>{t("messages")}</Text>
          <TouchableOpacity onPress={() => setShowNewChat(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
            <Plus size={22} color="#0A0A0A" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading
        ? <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator"><ActivityIndicator color={colors.accent} size="large" /></View>
        : !chats?.length
          ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
              <MessageCircle size={56} color={colors.bg4} />
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8, textAlign: "center" }}>{t("noMessages")}</Text>
              <Text style={{ color: colors.text4, fontSize: 14, textAlign: "center", lineHeight: 22 }}>{t("startConversation")}</Text>
              <TouchableOpacity onPress={() => setShowNewChat(true)} style={{ marginTop: 24, backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
                <Text style={{ color: "#0A0A0A", fontWeight: "700" }}>Nuevo mensaje</Text>
              </TouchableOpacity>
            </View>
          )
          : (
            <FlatList
              data={chats}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => {
                const other = item.members?.find(m => m.user.id !== session?.user?.id);
                const name = item.type === "direct" ? other?.user?.name || "?" : (item.name || "Grupo");
                const lastMsg = item.messages?.[0];
                return (
                  <TouchableOpacity onPress={() => setSelectedChat(item)} style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }} testID="chat-list-item">
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.bg3, marginRight: 14, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                      {other?.user?.image
                        ? <Image source={{ uri: other.user.image }} style={{ width: 50, height: 50 }} />
                        : <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 20 }}>{name[0]?.toUpperCase()}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15, marginBottom: 3 }}>{name}</Text>
                      <Text style={{ color: colors.text4, fontSize: 13 }} numberOfLines={1}>{lastMsg?.content || t("noMessages")}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 100 }}
              testID="chats-list"
            />
          )
      }

      {/* New Chat Modal */}
      <Modal visible={showNewChat} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "600" }}>Nuevo mensaje</Text>
            <TouchableOpacity onPress={() => { setShowNewChat(false); setSearchQ(""); }}>
              <X size={22} color={colors.text3} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.bg3, borderRadius: 12, paddingHorizontal: 14, gap: 10, marginBottom: 16 }}>
            <Search size={18} color={colors.text4} />
            <TextInput
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder={t("searchUsers")}
              placeholderTextColor={colors.text4}
              style={{ flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 }}
              autoFocus
            />
          </View>
          {searchQ.length < 2 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: colors.text3, fontSize: 14, textAlign: "center" }}>{t("selectUser")}</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults || []}
              keyExtractor={(u) => u.id}
              renderItem={({ item }) => {
                if (item.id === session?.user?.id) return null;
                return (
                  <TouchableOpacity
                    onPress={() => createChat.mutate(item.id)}
                    style={{ flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 4, backgroundColor: colors.bg2 }}
                  >
                    <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.bg3, marginRight: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {item.image ? <Image source={{ uri: item.image }} style={{ width: 46, height: 46, borderRadius: 23 }} /> : (
                        <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 18 }}>{item.name?.[0]}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>{item.name}</Text>
                      {item.username ? <Text style={{ color: colors.text3, fontSize: 13 }}>@{item.username}</Text> : null}
                    </View>
                    {createChat.isPending ? <ActivityIndicator color={colors.accent} size="small" /> : null}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
