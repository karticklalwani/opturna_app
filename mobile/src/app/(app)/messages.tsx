import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Linking,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { Chat, Message } from "@/types";
import { useSession } from "@/lib/auth/use-session";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MessageCircle,
  Search,
  Plus,
  ChevronLeft,
  Phone,
  Video,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  X,
  FileText,
  Mic,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInLeft,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { uploadFile } from "@/lib/upload";
import { pickImage, pickDocument, pickPdf, takePhoto } from "@/lib/file-picker";

// ─── Color constants ───────────────────────────────────────────────────────────
const C = {
  bg: "#080808",
  surface: "#0F0F0F",
  surface2: "#141414",
  surface3: "#1A1A1A",
  green: "#4ADE80",
  outgoing: "#1C3A29",
  incoming: "#1A1A1A",
  text: "#FFFFFF",
  textSecondary: "#888888",
  timestamp: "#666666",
  border: "#1F1F1F",
  onlineDot: "#4ADE80",
  unread: "#4ADE80",
  inputBg: "#161616",
};

// ─── Date helpers ──────────────────────────────────────────────────────────────
function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (msgDate.getTime() === yesterday.getTime()) {
    return "Ayer";
  }
  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDateSeparatorLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) return "Hoy";
  if (msgDate.getTime() === yesterday.getTime()) return "Ayer";
  return date.toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long" });
}

// ─── Typing dots animation ─────────────────────────────────────────────────────
function TypingDots() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = (sv: typeof dot1, delay: number) => {
      setTimeout(() => {
        sv.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
      }, delay);
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(dot1.value, [0, 1], [0, -5]) }],
    opacity: interpolate(dot1.value, [0, 1], [0.4, 1]),
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(dot2.value, [0, 1], [0, -5]) }],
    opacity: interpolate(dot2.value, [0, 1], [0.4, 1]),
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(dot3.value, [0, 1], [0, -5]) }],
    opacity: interpolate(dot3.value, [0, 1], [0.4, 1]),
  }));

  const dotBase = { width: 7, height: 7, borderRadius: 4, backgroundColor: C.textSecondary };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}>
      <Animated.View style={[dotBase, dot1Style]} />
      <Animated.View style={[dotBase, dot2Style]} />
      <Animated.View style={[dotBase, dot3Style]} />
    </View>
  );
}

// ─── Avatar component ──────────────────────────────────────────────────────────
function Avatar({ image, name, size = 48, showOnline = false }: {
  image?: string | null;
  name: string;
  size?: number;
  showOnline?: boolean;
}) {
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#1A2A1A",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        {image
          ? <Image source={{ uri: image }} style={{ width: size, height: size }} resizeMode="cover" />
          : <Text style={{
            color: C.green,
            fontWeight: "700",
            fontSize: size * 0.38,
            letterSpacing: -0.5,
          }}>{name?.[0]?.toUpperCase() ?? "?"}</Text>
        }
      </View>
      {showOnline === true ? (
        <View style={{
          position: "absolute",
          bottom: 1,
          right: 1,
          width: size * 0.27,
          height: size * 0.27,
          borderRadius: 100,
          backgroundColor: C.onlineDot,
          borderWidth: 2,
          borderColor: C.bg,
        }} />
      ) : null}
    </View>
  );
}

// ─── File message bubble ───────────────────────────────────────────────────────
function FileMessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  const isImage = msg.type === "image" || msg.fileMimeType?.startsWith("image/");
  const isAudio = msg.type === "audio" || msg.fileMimeType?.startsWith("audio/");

  if (isImage && msg.fileUrl) {
    return (
      <Pressable onPress={() => msg.fileUrl && Linking.openURL(msg.fileUrl)}>
        <Image
          source={{ uri: msg.fileUrl }}
          style={{ width: 200, height: 140, borderRadius: 10 }}
          resizeMode="cover"
        />
        {msg.content ? (
          <Text style={{ color: C.text, fontSize: 14, marginTop: 6 }}>{msg.content}</Text>
        ) : null}
      </Pressable>
    );
  }

  if (isAudio && msg.fileUrl) {
    return (
      <Pressable
        onPress={() => msg.fileUrl && Linking.openURL(msg.fileUrl)}
        style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 }}
      >
        <View style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: isMe ? "#2A5A3A" : "#252525",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Mic size={15} color={C.green} />
        </View>
        <View>
          <Text style={{ color: C.text, fontSize: 13, fontWeight: "600" }}>Audio</Text>
          <Text style={{ color: C.textSecondary, fontSize: 11 }}>{msg.fileName ?? "audio.m4a"}</Text>
        </View>
      </Pressable>
    );
  }

  if (msg.fileUrl) {
    return (
      <Pressable
        onPress={() => msg.fileUrl && Linking.openURL(msg.fileUrl)}
        style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 }}
      >
        <View style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: isMe ? "#2A5A3A" : "#252525",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <FileText size={15} color={C.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontSize: 13, fontWeight: "600" }} numberOfLines={1}>{msg.fileName ?? "Archivo"}</Text>
          <Text style={{ color: C.textSecondary, fontSize: 11 }}>Toca para abrir</Text>
        </View>
      </Pressable>
    );
  }

  return <Text style={{ color: C.text, fontSize: 15, lineHeight: 22 }}>{msg.content}</Text>;
}

// ─── Date separator ────────────────────────────────────────────────────────────
function DateSeparator({ label }: { label: string }) {
  return (
    <View style={{ alignItems: "center", marginVertical: 14 }}>
      <View style={{
        backgroundColor: "#1A1A1A",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 5,
      }}>
        <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: "500" }}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isMe, showAvatar, prevSameUser }: {
  msg: Message;
  isMe: boolean;
  showAvatar: boolean;
  prevSameUser: boolean;
}) {
  const hasFile = msg.type !== "text" && msg.fileUrl;

  return (
    <Animated.View
      entering={isMe ? FadeInRight.duration(250).springify() : FadeInLeft.duration(250).springify()}
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: isMe ? "flex-end" : "flex-start",
        paddingHorizontal: 12,
        marginBottom: prevSameUser ? 2 : 10,
        gap: 8,
      }}
    >
      {!isMe && (
        <View style={{ width: 32 }}>
          {showAvatar ? (
            <Avatar image={msg.sender?.image} name={msg.sender?.name ?? "?"} size={30} />
          ) : null}
        </View>
      )}

      <View style={{
        maxWidth: "72%",
        backgroundColor: isMe ? C.outgoing : C.incoming,
        borderRadius: 18,
        borderBottomRightRadius: isMe ? 4 : 18,
        borderBottomLeftRadius: isMe ? 18 : 4,
        paddingHorizontal: hasFile ? 10 : 14,
        paddingVertical: 9,
        overflow: "hidden",
        borderWidth: 0.5,
        borderColor: isMe ? "#2E5C3E" : "#282828",
      }}>
        {hasFile
          ? <FileMessageBubble msg={msg} isMe={isMe} />
          : <Text style={{ color: C.text, fontSize: 15, lineHeight: 22 }}>{msg.content}</Text>
        }
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: isMe ? "flex-end" : "flex-end",
          marginTop: 4,
          gap: 4,
        }}>
          <Text style={{ color: C.timestamp, fontSize: 11 }}>
            {msg.createdAt ? formatMessageTime(msg.createdAt) : ""}
          </Text>
          {isMe ? (
            <Check size={13} color={C.timestamp} strokeWidth={2.5} />
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Types for enriched messages ───────────────────────────────────────────────
type MessageRow =
  | { kind: "separator"; label: string; key: string }
  | { kind: "message"; msg: Message; showAvatar: boolean; prevSameUser: boolean; key: string };

function buildMessageRows(messages: Message[], currentUserId: string): MessageRow[] {
  const rows: MessageRow[] = [];
  let lastDate = "";

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const dateLabel = getDateSeparatorLabel(msg.createdAt);

    if (dateLabel !== lastDate) {
      rows.push({ kind: "separator", label: dateLabel, key: `sep-${msg.id}` });
      lastDate = dateLabel;
    }

    const isMe = msg.senderId === currentUserId;
    const next = messages[i + 1];
    const nextSameUser = !!next && next.senderId === msg.senderId;
    const showAvatar = !isMe && !nextSameUser;
    const prev = i > 0 ? messages[i - 1] : null;
    const prevSameUser = !!prev && prev.senderId === msg.senderId && getDateSeparatorLabel(prev.createdAt) === dateLabel;

    rows.push({ kind: "message", msg, showAvatar, prevSameUser, key: msg.id });
  }

  return rows;
}

// ─── ChatView ──────────────────────────────────────────────────────────────────
function ChatView({ chat, currentUserId, currentUser, onBack }: {
  chat: Chat;
  currentUserId: string;
  currentUser: { id: string; name: string; image?: string | null } | null;
  onBack: () => void;
}) {
  const [message, setMessage] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const otherMember = chat.members?.find(m => m.user.id !== currentUserId);
  const name = chat.type === "direct" ? (otherMember?.user?.name ?? "?") : (chat.name ?? "Group");
  const otherImage = otherMember?.user?.image;

  const { data: fetchedMessages, isLoading } = useQuery({
    queryKey: ["messages", chat.id],
    queryFn: () => api.get<Message[]>(`/api/chats/${chat.id}/messages`),
    staleTime: 5000,
  });

  useEffect(() => {
    if (fetchedMessages) {
      setLocalMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  // Mark messages as read
  useEffect(() => {
    api.patch(`/api/chats/${chat.id}/messages/read`, {}).catch(() => null);
  }, [chat.id]);

  // WebSocket connection
  useEffect(() => {
    const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
    const wsUrl = baseUrl.replace("https://", "wss://").replace("http://", "ws://");
    const userId = encodeURIComponent(currentUserId);
    const userName = encodeURIComponent(currentUser?.name ?? "User");
    const userImage = encodeURIComponent(currentUser?.image ?? "");

    const url = `${wsUrl}/ws/chat/${chat.id}?userId=${userId}&userName=${userName}&userImage=${userImage}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "message" && data.message) {
            const newMsg: Message = data.message;
            setLocalMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
          } else if (data.type === "typing") {
            if (data.userId === currentUserId) return;
            setTypingUsers(prev => {
              if (data.typing) {
                if (prev.some(u => u.userId === data.userId)) return prev;
                return [...prev, { userId: data.userId, userName: data.userName }];
              } else {
                return prev.filter(u => u.userId !== data.userId);
              }
            });
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => null;
      ws.onclose = () => null;
    } catch {
      // WebSocket unavailable
    }

    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [chat.id, currentUserId]);

  const sendWsTyping = useCallback((typing: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: typing ? "typing_start" : "typing_stop" }));
    }
  }, []);

  const handleTyping = useCallback((text: string) => {
    setMessage(text);
    if (!isTypingRef.current && text.length > 0) {
      isTypingRef.current = true;
      sendWsTyping(true);
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendWsTyping(false);
      }
    }, 1500);
  }, [sendWsTyping]);

  const sendMsg = useMutation({
    mutationFn: (payload: { content?: string; type?: string; fileUrl?: string; fileName?: string; fileMimeType?: string }) =>
      api.post<Message>(`/api/chats/${chat.id}/messages`, {
        content: payload.content,
        type: payload.type ?? "text",
        fileUrl: payload.fileUrl,
        fileName: payload.fileName,
        fileMimeType: payload.fileMimeType,
      }),
    onSuccess: (newMsg) => {
      if (newMsg) {
        setLocalMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      }
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setMessage("");
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendWsTyping(false);
      }
    },
  });

  const { mutate: sendMsgMutate } = sendMsg;

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMsgMutate({ content: trimmed, type: "text" });
  }, [message, sendMsgMutate]);

  const handleAttach = async () => {
    try {
      setUploading(true);
      const picked = await pickImage();
      if (!picked) { setUploading(false); return; }
      const result = await uploadFile(picked.uri, picked.filename, picked.mimeType);
      const msgType = picked.mimeType.startsWith("image/") ? "image"
        : picked.mimeType.startsWith("audio/") ? "audio"
        : picked.mimeType.startsWith("video/") ? "video"
        : "file";
      await sendMsg.mutateAsync({ type: msgType, fileUrl: result.url, fileName: result.name, fileMimeType: result.mimeType });
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  };

  const messages = localMessages;
  const rows = buildMessageRows(messages, currentUserId);

  const typingLabel = typingUsers.length > 0
    ? `${typingUsers[0].userName} está escribiendo...`
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }} testID="chat-view">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.surface }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
          paddingVertical: 10,
          borderBottomWidth: 0.5,
          borderBottomColor: C.border,
          backgroundColor: C.surface,
          gap: 6,
        }}>
          <Pressable
            onPress={onBack}
            testID="back-button"
            style={({ pressed }) => ({
              padding: 8,
              borderRadius: 20,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <ChevronLeft size={26} color={C.green} strokeWidth={2} />
          </Pressable>

          <Avatar image={otherImage} name={name} size={40} showOnline />

          <View style={{ flex: 1, marginLeft: 4 }}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "600", letterSpacing: -0.3 }}>{name}</Text>
            {typingLabel ? (
              <Text style={{ color: C.green, fontSize: 12 }}>{typingLabel}</Text>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.onlineDot }} />
                <Text style={{ color: C.textSecondary, fontSize: 12 }}>En línea</Text>
              </View>
            )}
          </View>

          <Pressable
            style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
          >
            <Phone size={20} color={C.textSecondary} strokeWidth={1.8} />
          </Pressable>
          <Pressable
            style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
          >
            <Video size={20} color={C.textSecondary} strokeWidth={1.8} />
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {isLoading && localMessages.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
            <ActivityIndicator color={C.green} size="large" />
            <Text style={{ color: C.textSecondary, fontSize: 13, marginTop: 10 }}>Cargando mensajes...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={rows}
            keyExtractor={(row) => row.key}
            renderItem={({ item }) => {
              if (item.kind === "separator") {
                return <DateSeparator label={item.label} />;
              }
              const isMe = item.msg.senderId === currentUserId;
              return (
                <MessageBubble
                  msg={item.msg}
                  isMe={isMe}
                  showAvatar={item.showAvatar}
                  prevSameUser={item.prevSameUser}
                />
              );
            }}
            contentContainerStyle={{ paddingVertical: 12, paddingBottom: 8 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            testID="messages-list"
          />
        )}

        {typingLabel ? (
          <View style={{
            paddingHorizontal: 24,
            paddingBottom: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}>
            <TypingDots />
            <Text style={{ color: C.textSecondary, fontSize: 12 }}>{typingLabel}</Text>
          </View>
        ) : null}

        {/* Input bar */}
        <View style={{
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 24 : 14,
          borderTopWidth: 0.5,
          borderTopColor: C.border,
          backgroundColor: C.surface,
          gap: 8,
        }}>
          <Pressable
            onPress={handleAttach}
            disabled={uploading}
            testID="attach-button"
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: C.surface3,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {uploading
              ? <ActivityIndicator color={C.green} size="small" />
              : <Paperclip size={18} color={C.textSecondary} strokeWidth={1.8} />
            }
          </Pressable>

          <TextInput
            value={message}
            onChangeText={handleTyping}
            placeholder="Mensaje..."
            placeholderTextColor={C.textSecondary}
            testID="message-input"
            style={{
              flex: 1,
              backgroundColor: C.inputBg,
              borderWidth: 1,
              borderColor: message.length > 0 ? "#2A5A3A" : C.border,
              borderRadius: 22,
              paddingHorizontal: 18,
              paddingVertical: 11,
              paddingTop: 11,
              color: C.text,
              fontSize: 15,
              maxHeight: 120,
            }}
            multiline
          />

          {message.trim().length > 0 ? (
            <Animated.View entering={FadeIn.duration(150).springify()}>
              <Pressable
                onPress={handleSend}
                disabled={sendMsg.isPending}
                testID="send-button"
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: C.green,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                  shadowColor: C.green,
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 2 },
                })}
              >
                <Send size={18} color="#000" strokeWidth={2.5} style={{ marginLeft: 2 }} />
              </Pressable>
            </Animated.View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Chat list item ────────────────────────────────────────────────────────────
function ChatListItem({ chat, currentUserId, onPress }: {
  chat: Chat;
  currentUserId: string;
  onPress: () => void;
}) {
  const other = chat.members?.find(m => m.user.id !== currentUserId);
  const name = chat.type === "direct" ? (other?.user?.name ?? "?") : (chat.name ?? "Group");
  const lastMsg = chat.messages?.[0];

  let lastMsgText = "Sin mensajes";
  if (lastMsg) {
    if (lastMsg.type === "image") lastMsgText = "Foto";
    else if (lastMsg.type === "audio") lastMsgText = "Mensaje de voz";
    else if (lastMsg.type === "video") lastMsgText = "Vídeo";
    else if (lastMsg.type === "file") lastMsgText = "Archivo";
    else lastMsgText = lastMsg.content ?? "Sin mensajes";
  }

  const lastMsgTime = lastMsg?.createdAt ? formatChatTime(lastMsg.createdAt) : null;
  const unreadCount = 0;

  return (
    <Pressable
      onPress={onPress}
      testID="chat-list-item"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 13,
        backgroundColor: pressed ? "#0F0F0F" : C.bg,
      })}
    >
      <Avatar image={other?.user?.image} name={name} size={54} showOnline />

      <View style={{ flex: 1, marginLeft: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{
            color: C.text,
            fontSize: 16,
            fontWeight: "600",
            letterSpacing: -0.2,
            flex: 1,
            marginRight: 8,
          }} numberOfLines={1}>{name}</Text>
          {lastMsgTime ? (
            <Text style={{
              color: unreadCount > 0 ? C.green : C.timestamp,
              fontSize: 12,
              fontWeight: unreadCount > 0 ? "600" : "400",
            }}>{lastMsgTime}</Text>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{
            color: unreadCount > 0 ? "#BBBBBB" : C.textSecondary,
            fontSize: 14,
            flex: 1,
            marginRight: 8,
            fontWeight: unreadCount > 0 ? "500" : "400",
          }} numberOfLines={1}>{lastMsgText}</Text>
          {unreadCount > 0 ? (
            <View style={{
              backgroundColor: C.unread,
              borderRadius: 12,
              minWidth: 22,
              height: 22,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 6,
            }}>
              <Text style={{ color: "#000", fontSize: 12, fontWeight: "700" }}>{unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// ─── NewChatModal ──────────────────────────────────────────────────────────────
function NewChatModal({ visible, currentUserId, onClose, onChatCreated }: {
  visible: boolean;
  currentUserId: string;
  onClose: () => void;
  onChatCreated: (chat: Chat) => void;
}) {
  const [searchQ, setSearchQ] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: searchResults } = useQuery({
    queryKey: ["user-search", searchQ],
    queryFn: () => api.get<any[]>(`/api/users/search?q=${searchQ}`),
    enabled: searchQ.length > 1,
  });

  const createChat = useMutation({
    mutationFn: (recipientId: string) =>
      api.post<Chat>("/api/chats", { type: "direct", memberIds: [recipientId] }),
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setSearchQ("");
      if (chat) onChatCreated(chat);
    },
  });

  const handleClose = () => {
    setSearchQ("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: C.surface }}>
        {/* Drag handle */}
        <View style={{ width: 36, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 16 }} />

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 18, marginBottom: 18 }}>
          <Text style={{ flex: 1, color: C.text, fontSize: 18, fontWeight: "700", letterSpacing: -0.4 }}>
            Nuevo mensaje
          </Text>
          <Pressable
            onPress={handleClose}
            testID="close-new-chat"
            style={({ pressed }) => ({
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: C.surface3,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <X size={17} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Search input */}
        <View style={{ paddingHorizontal: 18, marginBottom: 14 }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: C.surface3,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: searchQ.length > 0 ? "#2A5A3A" : C.border,
            paddingHorizontal: 14,
            gap: 10,
          }}>
            <Search size={16} color={C.textSecondary} />
            <TextInput
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder="Buscar usuarios..."
              placeholderTextColor={C.textSecondary}
              style={{ flex: 1, color: C.text, fontSize: 15, paddingVertical: 13 }}
              autoFocus
              testID="search-users-input"
            />
            {searchQ.length > 0 ? (
              <Pressable onPress={() => setSearchQ("")}>
                <X size={14} color={C.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {searchQ.length < 2 ? (
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 32 }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#1A2A1A",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}>
              <Search size={24} color={C.green} />
            </View>
            <Text style={{ color: C.textSecondary, fontSize: 14, textAlign: "center" }}>
              Escribe para buscar personas
            </Text>
          </View>
        ) : (
          <FlatList
            data={(searchResults ?? []).filter(u => u.id !== currentUserId)}
            keyExtractor={(u) => u.id}
            contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.duration(200).delay(index * 40)}>
                <Pressable
                  onPress={() => createChat.mutate(item.id)}
                  testID="user-search-result"
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    marginBottom: 6,
                    backgroundColor: pressed ? C.surface3 : "#141414",
                    borderRadius: 16,
                    borderWidth: 0.5,
                    borderColor: C.border,
                  })}
                >
                  <Avatar image={item.image} name={item.name ?? "?"} size={46} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: C.text, fontWeight: "600", fontSize: 15 }}>{item.name}</Text>
                    {item.username ? (
                      <Text style={{ color: C.textSecondary, fontSize: 13 }}>@{item.username}</Text>
                    ) : null}
                  </View>
                  {createChat.isPending
                    ? <ActivityIndicator color={C.green} size="small" />
                    : (
                      <View style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 100,
                        backgroundColor: "#1A2A1A",
                        borderWidth: 0.5,
                        borderColor: "#2A5A3A",
                      }}>
                        <Text style={{ color: C.green, fontSize: 13, fontWeight: "600" }}>Mensaje</Text>
                      </View>
                    )
                  }
                </Pressable>
              </Animated.View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <Text style={{ color: C.textSecondary, fontSize: 14 }}>Sin resultados</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function MessagesScreen() {
  const { data: session } = useSession();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showNewChat, setShowNewChat] = useState<boolean>(false);
  const [searchVisible, setSearchVisible] = useState<boolean>(false);
  const [searchQ, setSearchQ] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const searchInputRef = useRef<TextInput>(null);

  const currentUserId = session?.user?.id ?? "";
  const currentUser = session?.user
    ? { id: session.user.id, name: session.user.name, image: session.user.image }
    : null;

  const { data: chats, isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: () => api.get<Chat[]>("/api/chats"),
    refetchInterval: 8000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["chats"] });
    setRefreshing(false);
  };

  const toggleSearch = () => {
    const next = !searchVisible;
    setSearchVisible(next);
    if (!next) setSearchQ("");
    else setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const filteredChats = (chats ?? []).filter(chat => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    const other = chat.members?.find(m => m.user.id !== currentUserId);
    const name = chat.type === "direct" ? other?.user?.name ?? "" : chat.name ?? "";
    return name.toLowerCase().includes(q);
  });

  if (selectedChat) {
    return (
      <ChatView
        chat={selectedChat}
        currentUserId={currentUserId}
        currentUser={currentUser}
        onBack={() => setSelectedChat(null)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }} testID="messages-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.surface }}>
        {/* Header */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: C.border,
          backgroundColor: C.surface,
        }}>
          <Text style={{
            flex: 1,
            fontSize: 26,
            fontWeight: "800",
            color: C.text,
            letterSpacing: -0.6,
          }}>
            Mensajes
          </Text>

          <Pressable
            onPress={toggleSearch}
            testID="search-button"
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: searchVisible ? "#1A2A1A" : C.surface3,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
              opacity: pressed ? 0.7 : 1,
              borderWidth: searchVisible ? 1 : 0,
              borderColor: searchVisible ? "#2A5A3A" : "transparent",
            })}
          >
            <Search size={18} color={searchVisible ? C.green : C.textSecondary} strokeWidth={2} />
          </Pressable>

          <Pressable
            onPress={() => setShowNewChat(true)}
            testID="new-chat-button"
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#1A2A1A",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
              borderWidth: 1,
              borderColor: "#2A5A3A",
            })}
          >
            <Plus size={20} color={C.green} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Search bar */}
        {searchVisible ? (
          <Animated.View
            entering={SlideInDown.duration(200)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: C.surface,
              borderBottomWidth: 0.5,
              borderBottomColor: C.border,
            }}
          >
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: C.surface3,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: searchQ.length > 0 ? "#2A5A3A" : C.border,
              paddingHorizontal: 12,
              gap: 8,
            }}>
              <Search size={15} color={C.textSecondary} />
              <TextInput
                ref={searchInputRef}
                value={searchQ}
                onChangeText={setSearchQ}
                placeholder="Buscar conversaciones..."
                placeholderTextColor={C.textSecondary}
                testID="chat-search-input"
                style={{ flex: 1, color: C.text, fontSize: 15, paddingVertical: 11 }}
              />
              {searchQ.length > 0 ? (
                <Pressable onPress={() => setSearchQ("")}>
                  <X size={14} color={C.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        ) : null}
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
          <ActivityIndicator color={C.green} size="large" />
          <Text style={{ color: C.textSecondary, fontSize: 13, marginTop: 12 }}>Cargando chats...</Text>
        </View>
      ) : filteredChats.length === 0 && !searchQ ? (
        /* Empty state */
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36 }}
        >
          <View style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: "#1A2A1A",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#2A5A3A",
          }}>
            <MessageCircle size={38} color={C.green} strokeWidth={1.5} />
          </View>
          <Text style={{
            color: C.text,
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 10,
            textAlign: "center",
            letterSpacing: -0.4,
          }}>
            No tienes conversaciones aun
          </Text>
          <Text style={{ color: C.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 21 }}>
            Empieza una conversacion con alguien de tu red.
          </Text>
          <Pressable
            onPress={() => setShowNewChat(true)}
            testID="start-chat-button"
            style={({ pressed }) => ({
              marginTop: 28,
              backgroundColor: C.green,
              borderRadius: 100,
              paddingHorizontal: 28,
              paddingVertical: 14,
              opacity: pressed ? 0.85 : 1,
              shadowColor: C.green,
              shadowOpacity: 0.35,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 4 },
            })}
          >
            <Text style={{ color: "#000", fontWeight: "700", fontSize: 15 }}>
              Iniciar conversacion
            </Text>
          </Pressable>
        </Animated.View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(c) => c.id}
          testID="chats-list"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.green}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(250).delay(index * 30)}>
              <ChatListItem
                chat={item}
                currentUserId={currentUserId}
                onPress={() => setSelectedChat(item)}
              />
            </Animated.View>
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: 0.5, backgroundColor: C.border, marginLeft: 84 }} />
          )}
          ListEmptyComponent={
            searchQ ? (
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <Text style={{ color: C.textSecondary, fontSize: 14 }}>Sin resultados para "{searchQ}"</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      {!isLoading && filteredChats.length > 0 ? (
        <Animated.View
          entering={FadeIn.duration(300).delay(200)}
          style={{
            position: "absolute",
            bottom: 100,
            right: 20,
          }}
        >
          <Pressable
            onPress={() => setShowNewChat(true)}
            testID="fab-new-chat"
            style={({ pressed }) => ({
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: C.green,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
              shadowColor: C.green,
              shadowOpacity: 0.5,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            })}
          >
            <Plus size={24} color="#000" strokeWidth={2.5} />
          </Pressable>
        </Animated.View>
      ) : null}

      <NewChatModal
        visible={showNewChat}
        currentUserId={currentUserId}
        onClose={() => setShowNewChat(false)}
        onChatCreated={(chat) => {
          setShowNewChat(false);
          setSelectedChat(chat);
        }}
      />
    </View>
  );
}
