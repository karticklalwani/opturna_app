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

const HUD = {
  bg: "#020B18",
  bgCard: "#041525",
  bgInput: "#030E1A",
  bgMyMsg: "#0A2540",
  bgRecvMsg: "#041525",
  cyan: "#00B4D8",
  cyanDim: "#4A7A99",
  cyanFaint: "#7DB8D9",
  textPrimary: "#C8E8FF",
  textSecondary: "#7DB8D9",
  textMuted: "#4A7A99",
  border: "#0A2F47",
  borderBright: "#00B4D8",
};

function FileMessageBubble({ msg, isMe, colors }: { msg: Message; isMe: boolean; colors: any }) {
  const isImage = msg.type === "image" || msg.fileMimeType?.startsWith("image/");
  const isAudio = msg.type === "audio" || msg.fileMimeType?.startsWith("audio/");

  if (isImage && msg.fileUrl) {
    return (
      <TouchableOpacity onPress={() => msg.fileUrl && Linking.openURL(msg.fileUrl)}>
        <Image
          source={{ uri: msg.fileUrl }}
          style={{ width: 200, height: 150, borderRadius: 2 }}
          resizeMode="cover"
        />
        {msg.content ? (
          <Text style={{ color: isMe ? HUD.textPrimary : HUD.textPrimary, fontSize: 14, marginTop: 6, paddingHorizontal: 2, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>
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
        <View style={{ width: 36, height: 36, borderRadius: 2, backgroundColor: "#041525", borderWidth: 1, borderColor: HUD.cyan, alignItems: "center", justifyContent: "center" }}>
          <Mic size={18} color={HUD.cyan} />
        </View>
        <View>
          <Text style={{ color: HUD.textPrimary, fontSize: 13, fontWeight: "700", letterSpacing: 1, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>AUDIO</Text>
          <Text style={{ color: HUD.textMuted, fontSize: 11, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>{msg.fileName || "audio.m4a"}</Text>
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
        <View style={{ width: 36, height: 36, borderRadius: 2, backgroundColor: "#041525", borderWidth: 1, borderColor: HUD.cyan, alignItems: "center", justifyContent: "center" }}>
          <FileText size={18} color={HUD.cyan} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: HUD.textPrimary, fontSize: 13, fontWeight: "700", letterSpacing: 1, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }} numberOfLines={1}>{msg.fileName || "ARCHIVO"}</Text>
          <Text style={{ color: HUD.textMuted, fontSize: 11, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>TAP TO OPEN</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return <Text style={{ color: HUD.textPrimary, fontSize: 15, lineHeight: 22, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>{msg.content}</Text>;
}

function ChatView({ chat, currentUserId, onBack, colors }: { chat: Chat; currentUserId: string; onBack: () => void; colors: any }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useI18n();
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
          options: [t("cancel"), "Foto de la cámara", t("pickImageLabel"), t("pickPdf"), t("pickFile")],
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
        { text: "Cámara", onPress: () => handleSendMedia("camera") },
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
      Alert.alert("Error", e.message || "No se pudo subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: HUD.bg }} testID="chat-view">
      <SafeAreaView edges={["top"]}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: HUD.border,
          backgroundColor: HUD.bgCard,
        }}>
          <TouchableOpacity
            onPress={onBack}
            style={{
              marginRight: 14,
              width: 34,
              height: 34,
              borderWidth: 1,
              borderColor: HUD.cyan,
              alignItems: "center",
              justifyContent: "center",
            }}
            testID="back-button"
          >
            <ArrowLeft size={18} color={HUD.cyan} />
          </TouchableOpacity>

          <View style={{
            width: 38,
            height: 38,
            borderWidth: 2,
            borderColor: HUD.cyan,
            marginRight: 10,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: HUD.bgCard,
          }}>
            {otherMember?.user?.image
              ? <Image source={{ uri: otherMember.user.image }} style={{ width: 38, height: 38 }} />
              : <Text style={{ color: HUD.cyan, fontWeight: "700", fontSize: 14, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>{name[0]?.toUpperCase()}</Text>
            }
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: HUD.textPrimary, fontSize: 14, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>{name}</Text>
            <Text style={{ color: HUD.cyan, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>ENCRYPTED TRANSMISSION</Text>
          </View>

          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: HUD.cyan }} />
        </View>
      </SafeAreaView>

      {isLoading
        ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
            <ActivityIndicator color={HUD.cyan} />
            <Text style={{ color: HUD.textMuted, fontSize: 10, letterSpacing: 2, marginTop: 10, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>LOADING DATA...</Text>
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
                  style={{ padding: 8, paddingHorizontal: 16, alignItems: isMe ? "flex-end" : "flex-start" }}
                >
                  <View style={{
                    maxWidth: "78%",
                    backgroundColor: isMe ? HUD.bgMyMsg : HUD.bgRecvMsg,
                    borderRadius: 0,
                    borderRightWidth: isMe ? 2 : 0,
                    borderLeftWidth: isMe ? 0 : 2,
                    borderRightColor: HUD.cyan,
                    borderLeftColor: HUD.cyan,
                    paddingHorizontal: hasFile ? 10 : 14,
                    paddingVertical: 10,
                    overflow: "hidden",
                  }}>
                    {hasFile
                      ? <FileMessageBubble msg={item} isMe={isMe} colors={colors} />
                      : <Text style={{ color: HUD.textPrimary, fontSize: 14, lineHeight: 22, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>{item.content}</Text>
                    }
                    <Text style={{
                      color: HUD.textMuted,
                      fontSize: 9,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      marginTop: 4,
                      textAlign: isMe ? "right" : "left",
                      fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
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
            borderTopWidth: 1,
            borderTopColor: HUD.border,
            backgroundColor: HUD.bgCard,
            gap: 8,
          }}>
            <TouchableOpacity
              onPress={handleAttach}
              disabled={uploading}
              testID="attach-button"
              style={{
                width: 42,
                height: 42,
                borderWidth: 1,
                borderColor: HUD.cyan,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: HUD.bgInput,
              }}
            >
              {uploading
                ? <ActivityIndicator color={HUD.cyan} size="small" />
                : <Paperclip size={18} color={HUD.cyan} />
              }
            </TouchableOpacity>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="TRANSMIT..."
              placeholderTextColor={HUD.textMuted}
              testID="message-input"
              style={{
                flex: 1,
                backgroundColor: HUD.bgInput,
                borderWidth: 1,
                borderColor: message.length > 0 ? HUD.cyan : HUD.border,
                borderRadius: 0,
                paddingHorizontal: 14,
                paddingVertical: 11,
                color: HUD.textPrimary,
                fontSize: 13,
                maxHeight: 120,
                fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
                letterSpacing: 0.5,
              }}
              multiline
            />

            <TouchableOpacity
              onPress={() => { if (message.trim()) sendMsg.mutate({ content: message, type: "text" }); }}
              disabled={!message.trim() || sendMsg.isPending}
              testID="send-button"
              style={{
                width: 42,
                height: 42,
                borderWidth: 1,
                borderColor: message.trim() ? HUD.cyan : HUD.border,
                backgroundColor: message.trim() ? "rgba(0,180,216,0.15)" : HUD.bgInput,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={18} color={message.trim() ? HUD.cyan : HUD.textMuted} />
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
    <View style={{ flex: 1, backgroundColor: HUD.bg }} testID="messages-screen">
      <SafeAreaView edges={["top"]}>
        {/* Header */}
        <View style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: HUD.border,
          backgroundColor: HUD.bgCard,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Corner brackets decoration */}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: "800",
                color: HUD.textPrimary,
                letterSpacing: 4,
                textTransform: "uppercase",
                fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
              }}>
                COMMS CENTER
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: HUD.cyan }} />
                <Text style={{
                  color: HUD.cyan,
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
                }}>
                  SECURE CHANNEL
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowNewChat(true)}
              testID="new-chat-button"
              style={{
                width: 40,
                height: 40,
                borderWidth: 1,
                borderColor: HUD.cyan,
                backgroundColor: "rgba(0,180,216,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={20} color={HUD.cyan} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {isLoading
        ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
            <ActivityIndicator color={HUD.cyan} size="large" />
            <Text style={{ color: HUD.textMuted, fontSize: 10, letterSpacing: 2, marginTop: 12, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>SCANNING CHANNELS...</Text>
          </View>
        )
        : !chats?.length
          ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
              <View style={{ borderWidth: 1, borderColor: HUD.border, padding: 20, marginBottom: 24 }}>
                <MessageCircle size={48} color={HUD.cyanDim} />
              </View>
              <Text style={{ color: HUD.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 8, textAlign: "center", letterSpacing: 3, textTransform: "uppercase", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>
                {t("noMessages")}
              </Text>
              <Text style={{ color: HUD.textMuted, fontSize: 12, textAlign: "center", lineHeight: 20, letterSpacing: 1, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>
                {t("startConversation")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowNewChat(true)}
                style={{
                  marginTop: 24,
                  borderWidth: 1,
                  borderColor: HUD.cyan,
                  backgroundColor: "rgba(0,180,216,0.1)",
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: HUD.cyan, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", fontSize: 13, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>
                  INITIATE CONTACT
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
                const name = item.type === "direct" ? other?.user?.name || "?" : (item.name || "Grupo");
                const lastMsg = item.messages?.[0];
                const lastMsgText = lastMsg?.type !== "text" && lastMsg?.type
                  ? lastMsg.type === "image" ? "[IMAGE]"
                    : lastMsg.type === "audio" ? "[AUDIO]"
                    : lastMsg.type === "video" ? "[VIDEO]"
                    : "[FILE]"
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
                      paddingHorizontal: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: HUD.border,
                      backgroundColor: HUD.bgCard,
                      borderLeftWidth: 2,
                      borderLeftColor: HUD.cyan,
                    }}
                    testID="chat-list-item"
                  >
                    <View style={{
                      width: 50,
                      height: 50,
                      borderWidth: 2,
                      borderColor: HUD.cyan,
                      marginRight: 14,
                      overflow: "hidden",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: HUD.bg,
                    }}>
                      {other?.user?.image
                        ? <Image source={{ uri: other.user.image }} style={{ width: 50, height: 50 }} />
                        : <Text style={{ color: HUD.cyan, fontWeight: "700", fontSize: 18, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>{name[0]?.toUpperCase()}</Text>
                      }
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: HUD.textPrimary, fontWeight: "700", fontSize: 14, marginBottom: 4, letterSpacing: 1, textTransform: "uppercase", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>{name}</Text>
                      <Text style={{ color: HUD.textSecondary, fontSize: 12, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }} numberOfLines={1}>{lastMsgText}</Text>
                    </View>

                    {lastMsgTime ? (
                      <Text style={{ color: HUD.textMuted, fontSize: 9, letterSpacing: 1, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace", textTransform: "uppercase" }}>
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
        <View style={{ flex: 1, backgroundColor: HUD.bg, padding: 16 }}>
          {/* Modal header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: HUD.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: HUD.textPrimary, fontSize: 16, fontWeight: "800", letterSpacing: 3, textTransform: "uppercase", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>
                INITIATE CONTACT
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: HUD.cyan }} />
                <Text style={{ color: HUD.cyan, fontSize: 9, letterSpacing: 2, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>
                  SCANNING NETWORK
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => { setShowNewChat(false); setSearchQ(""); }}
              testID="close-new-chat"
              style={{ width: 34, height: 34, borderWidth: 1, borderColor: HUD.border, alignItems: "center", justifyContent: "center" }}
            >
              <X size={18} color={HUD.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: HUD.bgInput,
            borderWidth: 1,
            borderColor: searchQ.length > 0 ? HUD.cyan : HUD.border,
            paddingHorizontal: 14,
            gap: 10,
            marginBottom: 16,
          }}>
            <Search size={16} color={HUD.textMuted} />
            <TextInput
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder={t("searchUsers")}
              placeholderTextColor={HUD.textMuted}
              style={{ flex: 1, color: HUD.textPrimary, fontSize: 13, paddingVertical: 12, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace", letterSpacing: 0.5 }}
              autoFocus
              testID="search-users-input"
            />
          </View>

          {searchQ.length < 2
            ? (
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <Text style={{ color: HUD.textMuted, fontSize: 11, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>
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
                        marginBottom: 4,
                        backgroundColor: HUD.bgCard,
                        borderLeftWidth: 2,
                        borderLeftColor: HUD.cyan,
                      }}
                      testID="user-search-result"
                    >
                      <View style={{
                        width: 44,
                        height: 44,
                        borderWidth: 1,
                        borderColor: HUD.cyan,
                        marginRight: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        backgroundColor: HUD.bg,
                      }}>
                        {item.image
                          ? <Image source={{ uri: item.image }} style={{ width: 44, height: 44 }} />
                          : <Text style={{ color: HUD.cyan, fontWeight: "700", fontSize: 16, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>{item.name?.[0]}</Text>
                        }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: HUD.textPrimary, fontWeight: "700", fontSize: 14, letterSpacing: 1, textTransform: "uppercase", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>{item.name}</Text>
                        {item.username ? (
                          <Text style={{ color: HUD.textMuted, fontSize: 11, letterSpacing: 1, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" }}>@{item.username}</Text>
                        ) : null}
                      </View>
                      {createChat.isPending ? <ActivityIndicator color={HUD.cyan} size="small" /> : null}
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
