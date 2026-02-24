import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { Chat, Message } from "@/types";
import { useSession } from "@/lib/auth/use-session";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle, Search, Send, ArrowLeft, Plus } from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import Animated, { FadeInRight } from "react-native-reanimated";

function ChatListItem({ chat, currentUserId, onPress }: { chat: Chat; currentUserId: string; onPress: () => void }) {
  const otherMember = chat.members?.find(m => m.user.id !== currentUserId);
  const lastMessage = chat.messages?.[0];
  const name = chat.type === "direct" ? (otherMember?.user?.name || "Unknown") : (chat.name || "Group");

  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1C1C1E" }} testID="chat-list-item">
      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#27272A", marginRight: 14, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
        {otherMember?.user?.image ? (
          <Image source={{ uri: otherMember.user.image }} style={{ width: 50, height: 50 }} />
        ) : (
          <Text style={{ color: "#F59E0B", fontWeight: "700", fontSize: 20 }}>
            {name[0]?.toUpperCase()}
          </Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#FAFAFA", fontWeight: "600", fontSize: 15, marginBottom: 3 }}>{name}</Text>
        <Text style={{ color: "#52525B", fontSize: 13 }} numberOfLines={1}>
          {lastMessage?.content || "No messages yet"}
        </Text>
      </View>
      {lastMessage?.createdAt ? (
        <Text style={{ color: "#3F3F46", fontSize: 11 }}>
          {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

function ChatView({ chat, currentUserId, onBack }: { chat: Chat; currentUserId: string; onBack: () => void }) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const otherMember = chat.members?.find(m => m.user.id !== currentUserId);
  const name = chat.type === "direct" ? (otherMember?.user?.name || "Unknown") : (chat.name || "Group");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", chat.id],
    queryFn: () => api.get<Message[]>(`/api/chats/${chat.id}/messages`),
    refetchInterval: 3000,
  });

  const sendMessage = useMutation({
    mutationFn: () => api.post(`/api/chats/${chat.id}/messages`, { content: message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", chat.id] });
      setMessage("");
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} testID="chat-view">
      <SafeAreaView edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1C1C1E" }}>
          <TouchableOpacity onPress={onBack} style={{ marginRight: 14 }} testID="back-button">
            <ArrowLeft size={22} color="#FAFAFA" />
          </TouchableOpacity>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#27272A", marginRight: 10, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {otherMember?.user?.image ? (
              <Image source={{ uri: otherMember.user.image }} style={{ width: 38, height: 38 }} />
            ) : (
              <Text style={{ color: "#F59E0B", fontWeight: "700" }}>{name[0]?.toUpperCase()}</Text>
            )}
          </View>
          <Text style={{ color: "#FAFAFA", fontSize: 16, fontWeight: "600" }}>{name}</Text>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
          <ActivityIndicator color="#F59E0B" />
        </View>
      ) : (
        <FlatList
          data={messages || []}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUserId;
            return (
              <Animated.View entering={FadeInRight.duration(200)} style={{ padding: 12, alignItems: isMe ? "flex-end" : "flex-start" }}>
                <View style={{
                  maxWidth: "75%",
                  backgroundColor: isMe ? "#F59E0B" : "#1C1C1E",
                  borderRadius: 16,
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 4,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}>
                  <Text style={{ color: isMe ? "#0A0A0A" : "#FAFAFA", fontSize: 15, lineHeight: 22 }}>
                    {item.content}
                  </Text>
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
          <View style={{ flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, borderTopColor: "#1C1C1E", gap: 10 }}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Message..."
              placeholderTextColor="#3F3F46"
              testID="message-input"
              style={{ flex: 1, backgroundColor: "#1C1C1E", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, color: "#FAFAFA", fontSize: 15 }}
              multiline
            />
            <TouchableOpacity
              onPress={() => sendMessage.mutate()}
              disabled={!message.trim() || sendMessage.isPending}
              testID="send-button"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: message.trim() ? "#F59E0B" : "#27272A", alignItems: "center", justifyContent: "center" }}
            >
              <Send size={18} color={message.trim() ? "#0A0A0A" : "#52525B"} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export default function MessagesScreen() {
  const { data: session } = useSession();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  const { data: chats, isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: () => api.get<Chat[]>("/api/chats"),
  });

  if (selectedChat) {
    return (
      <ChatView
        chat={selectedChat}
        currentUserId={session?.user?.id || ""}
        onBack={() => setSelectedChat(null)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} testID="messages-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#FAFAFA", flex: 1, letterSpacing: -0.5 }}>Messages</Text>
          <TouchableOpacity style={{ padding: 8 }}>
            <Search size={22} color="#71717A" />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 8 }}>
            <Plus size={22} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
          <ActivityIndicator color="#F59E0B" size="large" />
        </View>
      ) : !chats?.length ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <MessageCircle size={56} color="#27272A" />
          <Text style={{ color: "#FAFAFA", fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8, textAlign: "center" }}>No messages yet</Text>
          <Text style={{ color: "#52525B", fontSize: 14, textAlign: "center", lineHeight: 22 }}>Start a conversation with someone in your network.</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ChatListItem
              chat={item}
              currentUserId={session?.user?.id || ""}
              onPress={() => setSelectedChat(item)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          testID="chats-list"
        />
      )}
    </View>
  );
}
