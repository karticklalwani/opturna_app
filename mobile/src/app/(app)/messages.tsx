import React, { useState, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
  Alert, ActionSheetIOS, Linking,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { Chat, Message } from "@/types";
import { useSession } from "@/lib/auth/use-session";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Send, ArrowLeft, Plus, X, MessageCircle, Paperclip, Mic, FileText, Camera } from "lucide-react-native";
import Animated, { FadeInRight, FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { uploadFile } from "@/lib/upload";
import { pickImage, pickDocument, pickPdf, takePhoto } from "@/lib/file-picker";

const DS = {
  bg: "#0A0F1E",
  card: "#111827",
  cardAlt: "#0F172A",
  msgMy: "#0E3A5C",
  msgOther: "#111827",
  cyan: "#00B4D8",
  cyanSoft: "rgba(0,180,216,0.12)",
  cyanBorder: "rgba(0,180,216,0.25)",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
  border: "rgba(255,255,255,0.06)",
};

function FileMessageBubble({ msg, isMe, colors }: { msg: Message; isMe: boolean; colors: any }) {
  const isImage = msg.type === "image" || msg.fileMimeType?.startsWith("image/");
  const isAudio = msg.type === "audio" || msg.fileMimeType?.startsWith("audio/");

  if (isImage && msg.fileUrl) {
    return (
      <TouchableOpacity onPress={() => msg.fileUrl && Linking.openURL(msg.fileUrl)}>
        <Image
          source={{ uri: msg.fileUrl }}
          style={{ width: 200, height: 150, borderRadius: 12 }}
          resizeMode="cover"
        />
        {msg.content ? (
          <Text style={{ color: DS.textPrimary, fontSize: 14, marginTop: 6, paddingHorizontal: 2 }}>
            {msg.content}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  if (isAudio && msg.fileUrl) {
    return (
      <TouchableOpacity
        onPress={() => msg.fileUrl && Linking.openURL(msg.fileUrl)}
        style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 100, backgroundColor: DS.cyanSoft, borderWidth: 1, borderColor: DS.cyanBorder, alignItems: "center", justifyContent: "center" }}>
          <Mic size={16} color={DS.cyan} />
        </View>
        <View>
          <Text style={{ color: DS.textPrimary, fontSize: 13, fontWeight: "600" }}>Audio</Text>
          <Text style={{ color: DS.textMuted, fontSize: 11 }}>{msg.fileName || "audio.m4a"}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (msg.fileUrl) {
    return (
      <TouchableOpacity
        onPress={() => msg.fileUrl && Linking.openURL(msg.fileUrl)}
        style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 100, backgroundColor: DS.cyanSoft, borderWidth: 1, borderColor: DS.cyanBorder, alignItems: "center", justifyContent: "center" }}>
          <FileText size={16} color={DS.cyan} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: DS.textPrimary, fontSize: 13, fontWeight: "600" }} numberOfLines={1}>{msg.fileName || "File"}</Text>
          <Text style={{ color: DS.textMuted, fontSize: 11 }}>Tap to open</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return <Text style={{ color: DS.textPrimary, fontSize: 15, lineHeight: 22 }}>{msg.content}</Text>;
}

function ChatView({ chat, currentUserId, onBack, colors }: { chat: Chat; currentUserId: string; onBack: () => void; colors: any }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const otherMember = chat.members?.find(m => m.user.id !== currentUserId);
  const name = chat.type === "direct" ? otherMember?.user?.name || "?" : (chat.name || "Group");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", chat.id],
    queryFn: () => api.get<Message[]>(`/api/chats/${chat.id}/messages`),
    refetchInterval: 3000,
  });

  const sendMsg = useMutation({
    mutationFn: (payload: { content?: string; type?: string; fileUrl?: string; fileName?: string; fileMimeType?: string }) =>
      api.post(`/api/chats/${chat.id}/messages`, { content: payload.content, type: payload.type || "text", fileUrl: payload.fileUrl, fileName: payload.fileName, fileMimeType: payload.fileMimeType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", chat.id] });
      setMessage("");
    },
  });

  const handleAttach = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t("cancel"), "Camera", t("pickImageLabel"), t("pickPdf"), t("pickFile")],
          cancelButtonIndex: 0,
        },
        async (idx) => {
          if (idx === 1) await handleSendMedia("camera");
          else if (idx === 2) await handleSendMedia("image");
          else if (idx === 3) await handleSendMedia("pdf");
          else if (idx === 4) await handleSendMedia("document");
        }
      );
    } else {
      Alert.alert(t("attachFile"), undefined, [
        { text: "Camera", onPress: () => handleSendMedia("camera") },
        { text: t("pickImageLabel"), onPress: () => handleSendMedia("image") },
        { text: t("pickPdf"), onPress: () => handleSendMedia("pdf") },
        { text: t("pickFile"), onPress: () => handleSendMedia("document") },
        { text: t("cancel"), style: "cancel" },
      ]);
    }
  };

  const handleSendMedia = async (source: "camera" | "image" | "pdf" | "document") => {
    try {
      setUploading(true);
      let picked = null;
      if (source === "camera") picked = await takePhoto();
      else if (source === "image") picked = await pickImage();
      else if (source === "pdf") picked = await pickPdf();
      else picked = await pickDocument();

      if (!picked) { setUploading(false); return; }

      const result = await uploadFile(picked.uri, picked.filename, picked.mimeType);

      const msgType = picked.mimeType.startsWith("image/") ? "image"
        : picked.mimeType.startsWith("audio/") ? "audio"
        : picked.mimeType.startsWith("video/") ? "video"
        : "file";

      await sendMsg.mutateAsync({
        type: msgType,
        fileUrl: result.url,
        fileName: result.name,
        fileMimeType: result.mimeType,
      });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: DS.bg }} testID="chat-view">
      <SafeAreaView edges={["top"]}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: DS.border,
          backgroundColor: DS.card,
        }}>
          <TouchableOpacity
            onPress={onBack}
            style={{
              marginRight: 12,
              width: 36,
              height: 36,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: DS.border,
              alignItems: "center",
              justifyContent: "center",
            }}
            testID="back-button"
          >
            <ArrowLeft size={18} color={DS.textSecondary} />
          </TouchableOpacity>

          {/* Circular avatar */}
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 100,
            borderWidth: 2,
            borderColor: DS.cyan,
            marginRight: 12,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: DS.cardAlt,
          }}>
            {otherMember?.user?.image
              ? <Image source={{ uri: otherMember.user.image }} style={{ width: 40, height: 40 }} />
              : <Text style={{ color: DS.cyan, fontWeight: "700", fontSize: 15 }}>{name[0]?.toUpperCase()}</Text>
            }
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: DS.textPrimary, fontSize: 15, fontWeight: "700" }}>{name}</Text>
            <Text style={{ color: DS.textMuted, fontSize: 11, marginTop: 1 }}>Active</Text>
          </View>

          <View style={{ width: 8, height: 8, borderRadius: 100, backgroundColor: DS.cyan }} />
        </View>
      </SafeAreaView>

      {isLoading
        ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
            <ActivityIndicator color={DS.cyan} />
            <Text style={{ color: DS.textMuted, fontSize: 13, marginTop: 10 }}>Loading messages...</Text>
          </View>
        )
        : (
          <FlatList
            data={messages || []}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => {
              const isMe = item.senderId === currentUserId;
              const hasFile = item.type !== "text" && item.fileUrl;
              return (
                <Animated.View
                  entering={FadeInRight.duration(200)}
                  style={{ padding: 6, paddingHorizontal: 14, alignItems: isMe ? "flex-end" : "flex-start" }}
                >
                  <View style={{
                    maxWidth: "78%",
                    backgroundColor: isMe ? DS.msgMy : DS.msgOther,
                    borderRadius: 20,
                    borderBottomRightRadius: isMe ? 4 : 20,
                    borderBottomLeftRadius: isMe ? 20 : 4,
                    borderWidth: 1,
                    borderColor: isMe ? DS.cyanBorder : DS.border,
                    paddingHorizontal: hasFile ? 12 : 14,
                    paddingVertical: 10,
                    overflow: "hidden",
                  }}>
                    {hasFile
                      ? <FileMessageBubble msg={item} isMe={isMe} colors={colors} />
                      : <Text style={{ color: DS.textPrimary, fontSize: 15, lineHeight: 22 }}>{item.content}</Text>
                    }
                    <Text style={{
                      color: DS.textMuted,
                      fontSize: 10,
                      marginTop: 4,
                      textAlign: isMe ? "right" : "left",
                    }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </Text>
                  </View>
                </Animated.View>
              );
            }}
            contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
            testID="messages-list"
          />
        )
      }

      <SafeAreaView edges={["bottom"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={{
            flexDirection: "row",
            alignItems: "flex-end",
            padding: 12,
            paddingHorizontal: 14,
            borderTopWidth: 1,
            borderTopColor: DS.border,
            backgroundColor: DS.card,
            gap: 8,
          }}>
            <TouchableOpacity
              onPress={handleAttach}
              disabled={uploading}
              testID="attach-button"
              style={{
                width: 40,
                height: 40,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: DS.border,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: DS.cardAlt,
              }}
            >
              {uploading
                ? <ActivityIndicator color={DS.cyan} size="small" />
                : <Paperclip size={17} color={DS.textSecondary} />
              }
            </TouchableOpacity>

            {/* Pill-shaped input */}
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Message..."
              placeholderTextColor={DS.textMuted}
              testID="message-input"
              style={{
                flex: 1,
                backgroundColor: DS.cardAlt,
                borderWidth: 1,
                borderColor: message.length > 0 ? DS.cyanBorder : DS.border,
                borderRadius: 100,
                paddingHorizontal: 18,
                paddingVertical: 11,
                color: DS.textPrimary,
                fontSize: 14,
                maxHeight: 120,
              }}
              multiline
            />

            <TouchableOpacity
              onPress={() => { if (message.trim()) sendMsg.mutate({ content: message, type: "text" }); }}
              disabled={!message.trim() || sendMsg.isPending}
              testID="send-button"
              style={{
                width: 40,
                height: 40,
                borderRadius: 100,
                backgroundColor: message.trim() ? DS.cyan : DS.cardAlt,
                borderWidth: 1,
                borderColor: message.trim() ? DS.cyan : DS.border,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: message.trim() ? DS.cyan : "transparent",
                shadowOpacity: 0.3,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Send size={16} color={message.trim() ? DS.bg : DS.textMuted} />
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
    <View style={{ flex: 1, backgroundColor: DS.bg }} testID="messages-screen">
      <SafeAreaView edges={["top"]}>
        {/* Header */}
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: DS.border,
          backgroundColor: DS.card,
          flexDirection: "row",
          alignItems: "center",
        }}>
          <Text style={{ flex: 1, fontSize: 28, fontWeight: "800", color: DS.textPrimary, letterSpacing: -0.5 }}>
            Messages
          </Text>

          <TouchableOpacity
            onPress={() => setShowNewChat(true)}
            testID="new-chat-button"
            style={{
              width: 40,
              height: 40,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: DS.cyanBorder,
              backgroundColor: DS.cyanSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={20} color={DS.cyan} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading
        ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
            <ActivityIndicator color={DS.cyan} size="large" />
            <Text style={{ color: DS.textMuted, fontSize: 13, marginTop: 12 }}>Loading chats...</Text>
          </View>
        )
        : !chats?.length
          ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 100,
                backgroundColor: DS.cyanSoft,
                borderWidth: 1,
                borderColor: DS.cyanBorder,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}>
                <MessageCircle size={34} color={DS.cyan} />
              </View>
              <Text style={{ color: DS.textPrimary, fontSize: 18, fontWeight: "800", marginBottom: 8, textAlign: "center", letterSpacing: -0.3 }}>
                {t("noMessages")}
              </Text>
              <Text style={{ color: DS.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 20 }}>
                {t("startConversation")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowNewChat(true)}
                style={{
                  marginTop: 24,
                  backgroundColor: DS.cyan,
                  borderRadius: 100,
                  paddingHorizontal: 28,
                  paddingVertical: 13,
                  shadowColor: DS.cyan,
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                <Text style={{ color: DS.bg, fontWeight: "700", fontSize: 14 }}>
                  Start a conversation
                </Text>
              </TouchableOpacity>
            </View>
          )
          : (
            <FlatList
              data={chats}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => {
                const other = item.members?.find(m => m.user.id !== session?.user?.id);
                const name = item.type === "direct" ? other?.user?.name || "?" : (item.name || "Group");
                const lastMsg = item.messages?.[0];
                const lastMsgText = lastMsg?.type !== "text" && lastMsg?.type
                  ? lastMsg.type === "image" ? "Photo"
                    : lastMsg.type === "audio" ? "Voice message"
                    : lastMsg.type === "video" ? "Video"
                    : "File"
                  : lastMsg?.content || t("noMessages");
                const lastMsgTime = lastMsg?.createdAt
                  ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : null;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedChat(item)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      paddingHorizontal: 20,
                      borderBottomWidth: 1,
                      borderBottomColor: DS.border,
                    }}
                    testID="chat-list-item"
                  >
                    {/* Circular avatar */}
                    <View style={{
                      width: 52,
                      height: 52,
                      borderRadius: 100,
                      borderWidth: 2,
                      borderColor: DS.cyanBorder,
                      marginRight: 14,
                      overflow: "hidden",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: DS.cardAlt,
                    }}>
                      {other?.user?.image
                        ? <Image source={{ uri: other.user.image }} style={{ width: 52, height: 52 }} />
                        : <Text style={{ color: DS.cyan, fontWeight: "700", fontSize: 20 }}>{name[0]?.toUpperCase()}</Text>
                      }
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: DS.textPrimary, fontWeight: "700", fontSize: 15, marginBottom: 3 }}>{name}</Text>
                      <Text style={{ color: DS.textSecondary, fontSize: 13 }} numberOfLines={1}>{lastMsgText}</Text>
                    </View>

                    {lastMsgTime ? (
                      <Text style={{ color: DS.textMuted, fontSize: 11 }}>
                        {lastMsgTime}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 100 }}
              testID="chats-list"
            />
          )
      }

      <Modal visible={showNewChat} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: DS.bg, padding: 20 }}>
          {/* Drag indicator */}
          <View style={{ width: 36, height: 4, backgroundColor: DS.border, borderRadius: 100, alignSelf: "center", marginBottom: 20 }} />

          {/* Modal header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ flex: 1, color: DS.textPrimary, fontSize: 17, fontWeight: "700" }}>
              New message
            </Text>
            <TouchableOpacity
              onPress={() => { setShowNewChat(false); setSearchQ(""); }}
              testID="close-new-chat"
              style={{
                width: 36,
                height: 36,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: DS.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={DS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search input - pill shaped */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: DS.card,
            borderWidth: 1,
            borderColor: searchQ.length > 0 ? DS.cyanBorder : DS.border,
            paddingHorizontal: 16,
            gap: 10,
            marginBottom: 16,
            borderRadius: 100,
          }}>
            <Search size={16} color={DS.textMuted} />
            <TextInput
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder={t("searchUsers")}
              placeholderTextColor={DS.textMuted}
              style={{ flex: 1, color: DS.textPrimary, fontSize: 14, paddingVertical: 12 }}
              autoFocus
              testID="search-users-input"
            />
          </View>

          {searchQ.length < 2
            ? (
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <Text style={{ color: DS.textMuted, fontSize: 13, textAlign: "center" }}>
                  {t("selectUser")}
                </Text>
              </View>
            )
            : (
              <FlatList
                data={searchResults || []}
                keyExtractor={(u) => u.id}
                renderItem={({ item }) => {
                  if (item.id === session?.user?.id) return null;
                  return (
                    <TouchableOpacity
                      onPress={() => createChat.mutate(item.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 12,
                        marginBottom: 6,
                        backgroundColor: DS.card,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: DS.border,
                      }}
                      testID="user-search-result"
                    >
                      {/* Circular avatar */}
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 100,
                        borderWidth: 1.5,
                        borderColor: DS.cyanBorder,
                        marginRight: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        backgroundColor: DS.cardAlt,
                      }}>
                        {item.image
                          ? <Image source={{ uri: item.image }} style={{ width: 44, height: 44 }} />
                          : <Text style={{ color: DS.cyan, fontWeight: "700", fontSize: 16 }}>{item.name?.[0]}</Text>
                        }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: DS.textPrimary, fontWeight: "700", fontSize: 14 }}>{item.name}</Text>
                        {item.username ? (
                          <Text style={{ color: DS.textMuted, fontSize: 12 }}>@{item.username}</Text>
                        ) : null}
                      </View>
                      {createChat.isPending ? <ActivityIndicator color={DS.cyan} size="small" /> : null}
                    </TouchableOpacity>
                  );
                }}
              />
            )
          }
        </View>
      </Modal>
    </View>
  );
}
