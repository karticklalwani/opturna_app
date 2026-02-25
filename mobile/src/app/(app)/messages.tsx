import React, { useState } from "react";
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
import { Search, Send, ArrowLeft, Plus, X, MessageCircle, Paperclip, Mic, FileText } from "lucide-react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { uploadFile } from "@/lib/upload";
import { pickImage, pickDocument, pickPdf, takePhoto } from "@/lib/file-picker";

function FileMessageBubble({ msg, colors }: { msg: Message; isMe: boolean; colors: any }) {
  const { t } = useI18n();
  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;
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
          <Text style={{ color: colors.text, fontSize: 14, marginTop: 6, paddingHorizontal: 2 }}>
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
        <View style={{ width: 36, height: 36, borderRadius: 100, backgroundColor: accentSoft, borderWidth: 1, borderColor: accentBorder, alignItems: "center", justifyContent: "center" }}>
          <Mic size={16} color={colors.accent} />
        </View>
        <View>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>{t("audio")}</Text>
          <Text style={{ color: colors.text3, fontSize: 11 }}>{msg.fileName || "audio.m4a"}</Text>
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
        <View style={{ width: 36, height: 36, borderRadius: 100, backgroundColor: accentSoft, borderWidth: 1, borderColor: accentBorder, alignItems: "center", justifyContent: "center" }}>
          <FileText size={16} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }} numberOfLines={1}>{msg.fileName || t("file")}</Text>
          <Text style={{ color: colors.text3, fontSize: 11 }}>{t("tapToOpen")}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{msg.content}</Text>;
}

function ChatView({ chat, currentUserId, onBack, colors }: { chat: Chat; currentUserId: string; onBack: () => void; colors: any }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const otherMember = chat.members?.find(m => m.user.id !== currentUserId);
  const name = chat.type === "direct" ? otherMember?.user?.name || "?" : (chat.name || "Group");

  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;
  const msgMyBg = "#0E3A5C";

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
          options: [t("cancel"), t("camera"), t("pickImageLabel"), t("pickPdf"), t("pickFile")],
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
        { text: t("camera"), onPress: () => handleSendMedia("camera") },
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
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="chat-view">
      <SafeAreaView edges={["top"]}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
        }}>
          <TouchableOpacity
            onPress={onBack}
            style={{
              marginRight: 12,
              width: 36,
              height: 36,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
            testID="back-button"
          >
            <ArrowLeft size={18} color={colors.text2} />
          </TouchableOpacity>

          <View style={{
            width: 40,
            height: 40,
            borderRadius: 100,
            borderWidth: 2,
            borderColor: colors.accent,
            marginRight: 12,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: colors.bg2,
          }}>
            {otherMember?.user?.image
              ? <Image source={{ uri: otherMember.user.image }} style={{ width: 40, height: 40 }} />
              : <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 15 }}>{name[0]?.toUpperCase()}</Text>
            }
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>{name}</Text>
            <Text style={{ color: colors.text3, fontSize: 11, marginTop: 1 }}>{t("active")}</Text>
          </View>

          <View style={{ width: 8, height: 8, borderRadius: 100, backgroundColor: colors.accent }} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
          <ActivityIndicator color={colors.accent} />
          <Text style={{ color: colors.text3, fontSize: 13, marginTop: 10 }}>{t("loadingMessages")}</Text>
        </View>
      ) : (
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
                  backgroundColor: isMe ? msgMyBg : colors.card,
                  borderRadius: 20,
                  borderBottomRightRadius: isMe ? 4 : 20,
                  borderBottomLeftRadius: isMe ? 20 : 4,
                  borderWidth: 1,
                  borderColor: isMe ? accentBorder : colors.border,
                  paddingHorizontal: hasFile ? 12 : 14,
                  paddingVertical: 10,
                  overflow: "hidden",
                }}>
                  {hasFile
                    ? <FileMessageBubble msg={item} isMe={isMe} colors={colors} />
                    : <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{item.content}</Text>
                  }
                  <Text style={{
                    color: colors.text3,
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
      )}

      <SafeAreaView edges={["bottom"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={{
            flexDirection: "row",
            alignItems: "flex-end",
            padding: 12,
            paddingHorizontal: 14,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
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
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.bg2,
              }}
            >
              {uploading
                ? <ActivityIndicator color={colors.accent} size="small" />
                : <Paperclip size={17} color={colors.text2} />
              }
            </TouchableOpacity>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={`${t("messagesTitle")}...`}
              placeholderTextColor={colors.text3}
              testID="message-input"
              style={{
                flex: 1,
                backgroundColor: colors.bg2,
                borderWidth: 1,
                borderColor: message.length > 0 ? accentBorder : colors.border,
                borderRadius: 100,
                paddingHorizontal: 18,
                paddingVertical: 11,
                color: colors.text,
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
                backgroundColor: message.trim() ? colors.accent : colors.bg2,
                borderWidth: 1,
                borderColor: message.trim() ? colors.accent : colors.border,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: message.trim() ? colors.accent : "transparent",
                shadowOpacity: 0.3,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Send size={16} color={message.trim() ? colors.bg : colors.text3} />
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

  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;

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
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
          flexDirection: "row",
          alignItems: "center",
        }}>
          <Text style={{ flex: 1, fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
            {t("messagesTitle")}
          </Text>

          <TouchableOpacity
            onPress={() => setShowNewChat(true)}
            testID="new-chat-button"
            style={{
              width: 40,
              height: 40,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: accentBorder,
              backgroundColor: accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={{ color: colors.text3, fontSize: 13, marginTop: 12 }}>{t("loadingChats")}</Text>
        </View>
      ) : !chats?.length ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 100,
            backgroundColor: accentSoft,
            borderWidth: 1,
            borderColor: accentBorder,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}>
            <MessageCircle size={34} color={colors.accent} />
          </View>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 8, textAlign: "center", letterSpacing: -0.3 }}>
            {t("noMessages")}
          </Text>
          <Text style={{ color: colors.text2, fontSize: 13, textAlign: "center", lineHeight: 20 }}>
            {t("startConversation")}
          </Text>
          <TouchableOpacity
            onPress={() => setShowNewChat(true)}
            style={{
              marginTop: 24,
              backgroundColor: colors.accent,
              borderRadius: 100,
              paddingHorizontal: 28,
              paddingVertical: 13,
              shadowColor: colors.accent,
              shadowOpacity: 0.3,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <Text style={{ color: colors.bg, fontWeight: "700", fontSize: 14 }}>
              {t("startConversationBtn")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => {
            const other = item.members?.find(m => m.user.id !== session?.user?.id);
            const name = item.type === "direct" ? other?.user?.name || "?" : (item.name || "Group");
            const lastMsg = item.messages?.[0];
            const lastMsgText = lastMsg?.type !== "text" && lastMsg?.type
              ? lastMsg.type === "image" ? t("photo")
                : lastMsg.type === "audio" ? t("voiceMessage")
                : lastMsg.type === "video" ? t("video")
                : t("file")
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
                  borderBottomColor: colors.border,
                }}
                testID="chat-list-item"
              >
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 100,
                  borderWidth: 2,
                  borderColor: accentBorder,
                  marginRight: 14,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.bg2,
                }}>
                  {other?.user?.image
                    ? <Image source={{ uri: other.user.image }} style={{ width: 52, height: 52 }} />
                    : <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 20 }}>{name[0]?.toUpperCase()}</Text>
                  }
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15, marginBottom: 3 }}>{name}</Text>
                  <Text style={{ color: colors.text2, fontSize: 13 }} numberOfLines={1}>{lastMsgText}</Text>
                </View>

                {lastMsgTime ? (
                  <Text style={{ color: colors.text3, fontSize: 11 }}>{lastMsgTime}</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 100 }}
          testID="chats-list"
        />
      )}

      <Modal visible={showNewChat} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20 }}>
          <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 100, alignSelf: "center", marginBottom: 20 }} />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "700" }}>
              {t("newMessage")}
            </Text>
            <TouchableOpacity
              onPress={() => { setShowNewChat(false); setSearchQ(""); }}
              testID="close-new-chat"
              style={{
                width: 36,
                height: 36,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={colors.text2} />
            </TouchableOpacity>
          </View>

          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: searchQ.length > 0 ? accentBorder : colors.border,
            paddingHorizontal: 16,
            gap: 10,
            marginBottom: 16,
            borderRadius: 100,
          }}>
            <Search size={16} color={colors.text3} />
            <TextInput
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder={t("searchUsers")}
              placeholderTextColor={colors.text3}
              style={{ flex: 1, color: colors.text, fontSize: 14, paddingVertical: 12 }}
              autoFocus
              testID="search-users-input"
            />
          </View>

          {searchQ.length < 2 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: colors.text3, fontSize: 13, textAlign: "center" }}>
                {t("selectUser")}
              </Text>
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
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      marginBottom: 6,
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    testID="user-search-result"
                  >
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 100,
                      borderWidth: 1.5,
                      borderColor: accentBorder,
                      marginRight: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      backgroundColor: colors.bg2,
                    }}>
                      {item.image
                        ? <Image source={{ uri: item.image }} style={{ width: 44, height: 44 }} />
                        : <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 16 }}>{item.name?.[0]}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "700", fontSize: 14 }}>{item.name}</Text>
                      {item.username ? (
                        <Text style={{ color: colors.text3, fontSize: 12 }}>@{item.username}</Text>
                      ) : null}
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
