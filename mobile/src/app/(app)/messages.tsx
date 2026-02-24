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
import { pickImage, pickDocument, takePhoto } from "@/lib/file-picker";

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
          <Text style={{ color: isMe ? "#0A0A0A" : colors.text, fontSize: 14, marginTop: 6, paddingHorizontal: 2 }}>
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
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMe ? "rgba(0,0,0,0.2)" : colors.bg4, alignItems: "center", justifyContent: "center" }}>
          <Mic size={18} color={isMe ? "#0A0A0A" : colors.accent} />
        </View>
        <View>
          <Text style={{ color: isMe ? "#0A0A0A" : colors.text, fontSize: 14, fontWeight: "600" }}>Audio</Text>
          <Text style={{ color: isMe ? "rgba(0,0,0,0.6)" : colors.text3, fontSize: 11 }}>{msg.fileName || "audio.m4a"}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Generic file
  if (msg.fileUrl) {
    return (
      <TouchableOpacity
        onPress={() => msg.fileUrl && Linking.openURL(msg.fileUrl)}
        style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isMe ? "rgba(0,0,0,0.2)" : colors.bg4, alignItems: "center", justifyContent: "center" }}>
          <FileText size={18} color={isMe ? "#0A0A0A" : colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: isMe ? "#0A0A0A" : colors.text, fontSize: 14, fontWeight: "600" }} numberOfLines={1}>{msg.fileName || "Archivo"}</Text>
          <Text style={{ color: isMe ? "rgba(0,0,0,0.6)" : colors.text3, fontSize: 11 }}>Toca para abrir</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return <Text style={{ color: isMe ? "#0A0A0A" : colors.text, fontSize: 15, lineHeight: 22 }}>{msg.content}</Text>;
}

function ChatView({ chat, currentUserId, onBack, colors }: { chat: Chat; currentUserId: string; onBack: () => void; colors: any }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const otherMember = chat.members?.find(m => m.user.id !== currentUserId);
  const name = chat.type === "direct" ? otherMember?.user?.name || "?" : (chat.name || "Grupo");

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
          options: ["Cancelar", "Foto de la cámara", "Imagen de la galería", "Archivo / Documento"],
          cancelButtonIndex: 0,
        },
        async (idx) => {
          if (idx === 1) await handleSendMedia("camera");
          else if (idx === 2) await handleSendMedia("image");
          else if (idx === 3) await handleSendMedia("document");
        }
      );
    } else {
      Alert.alert("Adjuntar", "Selecciona el tipo de archivo", [
        { text: "Cámara", onPress: () => handleSendMedia("camera") },
        { text: "Imagen", onPress: () => handleSendMedia("image") },
        { text: "Archivo", onPress: () => handleSendMedia("document") },
        { text: "Cancelar", style: "cancel" },
      ]);
    }
  };

  const handleSendMedia = async (source: "camera" | "image" | "document") => {
    try {
      setUploading(true);
      let picked = null;
      if (source === "camera") picked = await takePhoto();
      else if (source === "image") picked = await pickImage();
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
      Alert.alert("Error", e.message || "No se pudo subir el archivo");
    } finally {
      setUploading(false);
    }
  };

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
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>{name}</Text>
            <Text style={{ color: colors.text4, fontSize: 12 }}>En línea</Text>
          </View>
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
              const hasFile = item.type !== "text" && item.fileUrl;
              return (
                <Animated.View entering={FadeInRight.duration(200)} style={{ padding: 8, paddingHorizontal: 16, alignItems: isMe ? "flex-end" : "flex-start" }}>
                  <View style={{
                    maxWidth: "78%",
                    backgroundColor: isMe ? colors.accent : colors.bg3,
                    borderRadius: 18,
                    borderBottomRightRadius: isMe ? 4 : 18,
                    borderBottomLeftRadius: isMe ? 18 : 4,
                    paddingHorizontal: hasFile ? 10 : 14,
                    paddingVertical: 10,
                    overflow: "hidden",
                  }}>
                    {hasFile
                      ? <FileMessageBubble msg={item} isMe={isMe} colors={colors} />
                      : <Text style={{ color: isMe ? "#0A0A0A" : colors.text, fontSize: 15, lineHeight: 22 }}>{item.content}</Text>
                    }
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
          <View style={{ flexDirection: "row", alignItems: "flex-end", padding: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 }}>
            <TouchableOpacity
              onPress={handleAttach}
              disabled={uploading}
              testID="attach-button"
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bg3, alignItems: "center", justifyContent: "center" }}
            >
              {uploading
                ? <ActivityIndicator color={colors.accent} size="small" />
                : <Paperclip size={20} color={colors.text3} />
              }
            </TouchableOpacity>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Mensaje..."
              placeholderTextColor={colors.text4}
              testID="message-input"
              style={{ flex: 1, backgroundColor: colors.bg3, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, color: colors.text, fontSize: 15, maxHeight: 120 }}
              multiline
            />

            <TouchableOpacity
              onPress={() => { if (message.trim()) sendMsg.mutate({ content: message, type: "text" }); }}
              disabled={!message.trim() || sendMsg.isPending}
              testID="send-button"
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: message.trim() ? colors.accent : colors.bg3, alignItems: "center", justifyContent: "center" }}
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
          <TouchableOpacity
            onPress={() => setShowNewChat(true)}
            testID="new-chat-button"
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}
          >
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
                const lastMsgText = lastMsg?.type !== "text" && lastMsg?.type
                  ? lastMsg.type === "image" ? "Imagen"
                    : lastMsg.type === "audio" ? "Audio"
                    : lastMsg.type === "video" ? "Video"
                    : "Archivo"
                  : lastMsg?.content || t("noMessages");
                return (
                  <TouchableOpacity onPress={() => setSelectedChat(item)} style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }} testID="chat-list-item">
                    <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bg3, marginRight: 14, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                      {other?.user?.image
                        ? <Image source={{ uri: other.user.image }} style={{ width: 52, height: 52 }} />
                        : <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 20 }}>{name[0]?.toUpperCase()}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15, marginBottom: 3 }}>{name}</Text>
                      <Text style={{ color: colors.text4, fontSize: 13 }} numberOfLines={1}>{lastMsgText}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 100 }}
              testID="chats-list"
            />
          )
      }

      <Modal visible={showNewChat} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "600" }}>Nuevo mensaje</Text>
            <TouchableOpacity onPress={() => { setShowNewChat(false); setSearchQ(""); }} testID="close-new-chat">
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
              testID="search-users-input"
            />
          </View>
          {searchQ.length < 2
            ? <View style={{ alignItems: "center", paddingTop: 60 }}><Text style={{ color: colors.text3, fontSize: 14, textAlign: "center" }}>{t("selectUser")}</Text></View>
            : (
              <FlatList
                data={searchResults || []}
                keyExtractor={(u) => u.id}
                renderItem={({ item }) => {
                  if (item.id === session?.user?.id) return null;
                  return (
                    <TouchableOpacity
                      onPress={() => createChat.mutate(item.id)}
                      style={{ flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 4, backgroundColor: colors.bg2 }}
                      testID="user-search-result"
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
            )
          }
        </View>
      </Modal>
    </View>
  );
}
