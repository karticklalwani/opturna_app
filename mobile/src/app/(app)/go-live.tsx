import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageCircle,
  Users,
  Send,
  X,
  Wifi,
  WifiOff,
  Copy,
  Plus,
  LogIn,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  SlideInRight,
  SlideOutRight,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTheme, DARK } from "@/lib/theme";
import { useSession } from "@/lib/auth/use-session";

type ThemeColors = typeof DARK;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Types ──────────────────────────────────────────────────────────────────────

type Participant = {
  id: string;
  name: string;
  isMuted: boolean;
  isCameraOn: boolean;
  isLocal: boolean;
  avatar?: string;
};

type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
};

type RoomPhase = "setup" | "room";

// ─── Mock Participants ──────────────────────────────────────────────────────────

const MOCK_PARTICIPANTS: Participant[] = [
  { id: "p2", name: "Maria Lopez", isMuted: false, isCameraOn: false, isLocal: false },
  { id: "p3", name: "Carlos Ruiz", isMuted: true, isCameraOn: false, isLocal: false },
  { id: "p4", name: "Ana Torres", isMuted: false, isCameraOn: false, isLocal: false },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

const USER_COLORS = [
  "#4ADE80", "#3B82F6", "#A855F7", "#F59E0B", "#EC4899", "#06B6D4", "#EF4444",
];

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── Participant Tile ───────────────────────────────────────────────────────────

function ParticipantTile({
  participant,
  tileSize,
  colors,
  cameraPermission,
}: {
  participant: Participant;
  tileSize: number;
  colors: ThemeColors;
  cameraPermission: boolean;
}) {
  const color = getUserColor(participant.id);
  const initials = getInitials(participant.name);
  const showCamera = participant.isLocal && participant.isCameraOn && cameraPermission;

  return (
    <View
      testID={`participant-tile-${participant.id}`}
      style={{
        width: tileSize,
        height: tileSize,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.bg3,
        borderWidth: 1,
        borderColor: participant.isLocal ? colors.accent : colors.border,
      }}
    >
      {showCamera ? (
        <CameraView
          style={{ flex: 1 }}
          facing="front"
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View
            style={{
              width: tileSize * 0.36,
              height: tileSize * 0.36,
              borderRadius: tileSize * 0.18,
              backgroundColor: `${color}20`,
              borderWidth: 2,
              borderColor: `${color}50`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: color,
                fontWeight: "800",
                fontSize: tileSize * 0.12,
              }}
            >
              {initials}
            </Text>
          </View>
          {!participant.isCameraOn ? (
            <View style={{ marginTop: 8 }}>
              <VideoOff size={16} color={colors.text4} />
            </View>
          ) : null}
        </View>
      )}

      {/* Name + mic indicator at bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 10,
          paddingVertical: 8,
          backgroundColor: "rgba(0,0,0,0.55)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: "#FFFFFF",
            fontSize: 11,
            fontWeight: "700",
            flex: 1,
          }}
        >
          {participant.isLocal ? "Tu" : participant.name}
        </Text>
        {participant.isMuted ? (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "rgba(239,68,68,0.3)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MicOff size={10} color="#EF4444" />
          </View>
        ) : (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "rgba(74,222,128,0.3)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Mic size={10} color="#4ADE80" />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Chat Panel ─────────────────────────────────────────────────────────────────

function ChatPanel({
  messages,
  chatInput,
  setChatInput,
  onSend,
  colors,
  onClose,
}: {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  onSend: () => void;
  colors: ThemeColors;
  onClose: () => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  return (
    <Animated.View
      entering={SlideInRight.duration(250)}
      exiting={SlideOutRight.duration(200)}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: SCREEN_WIDTH * 0.8,
        maxWidth: 340,
        backgroundColor: colors.bg2,
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
        zIndex: 100,
      }}
    >
      {/* Chat header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg2 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
            Chat
          </Text>
          <Pressable
            testID="close-chat-button"
            onPress={onClose}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: pressed ? colors.bg4 : colors.bg3,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <X size={16} color={colors.text2} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View
            style={{
              padding: 20,
              alignItems: "center",
            }}
          >
            <MessageCircle size={28} color={colors.text4} />
            <Text
              style={{
                color: colors.text4,
                fontSize: 13,
                marginTop: 10,
                textAlign: "center",
              }}
            >
              Los mensajes apareceran aqui
            </Text>
          </View>
        ) : null}
        {messages.map((msg) => {
          const color = getUserColor(msg.userId);
          const initials = getInitials(msg.userName);
          return (
            <View
              key={msg.id}
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: `${color}20`,
                  borderWidth: 1,
                  borderColor: `${color}40`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: color, fontSize: 10, fontWeight: "800" }}>
                  {initials}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.bg3,
                  borderRadius: 12,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: color,
                    fontSize: 10,
                    fontWeight: "700",
                    marginBottom: 2,
                  }}
                >
                  {msg.userName}
                </Text>
                <Text style={{ color: colors.text, fontSize: 13 }}>
                  {msg.content}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Chat input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: insets.bottom + 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.bg2,
          }}
        >
          <TextInput
            testID="room-chat-input"
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.text4}
            style={{
              flex: 1,
              backgroundColor: colors.bg3,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: colors.text,
              fontSize: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            returnKeyType="send"
            onSubmitEditing={onSend}
          />
          <Pressable
            testID="room-send-chat"
            onPress={onSend}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: pressed ? colors.accent : `${colors.accent}DD`,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Send size={16} color={colors.bg} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// ─── Room View ──────────────────────────────────────────────────────────────────

function RoomView({
  roomTitle,
  roomCode,
  currentUserId,
  currentUserName,
  onEnd,
}: {
  roomTitle: string;
  roomCode: string;
  currentUserId: string;
  currentUserName: string;
  onEnd: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  // Request permissions on mount
  useEffect(() => {
    requestCameraPermission();
    requestMicPermission();
  }, []);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Build participant list: local user + mock participants
  const localParticipant: Participant = {
    id: currentUserId,
    name: currentUserName,
    isMuted: !isMicOn,
    isCameraOn: isCameraOn,
    isLocal: true,
  };

  const allParticipants = [localParticipant, ...MOCK_PARTICIPANTS];
  const participantCount = allParticipants.length;

  // Calculate grid layout
  const gridPadding = 12;
  const gridGap = 8;
  const availableWidth = SCREEN_WIDTH - gridPadding * 2;
  // Top bar (~100) + bottom toolbar (~90) + banner (~50)
  const availableHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 240;

  let columns: number;
  if (participantCount <= 1) columns = 1;
  else if (participantCount <= 4) columns = 2;
  else columns = 3;

  const rows = Math.ceil(participantCount / columns);
  const tileWidth = (availableWidth - gridGap * (columns - 1)) / columns;
  const tileHeight = (availableHeight - gridGap * (rows - 1)) / rows;
  const tileSize = Math.min(tileWidth, tileHeight);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUserId,
      userName: currentUserName,
      content: chatInput.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
  };

  const handleEnd = () => {
    setIsEnding(true);
    setTimeout(() => onEnd(), 300);
  };

  return (
    <View
      testID="room-view"
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      {/* Top bar */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg2 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          {/* Room info */}
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "800",
                letterSpacing: -0.3,
              }}
            >
              {roomTitle}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginTop: 3,
              }}
            >
              <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600" }}>
                {roomCode}
              </Text>
              <View
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: colors.text4,
                }}
              />
              <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600" }}>
                {formatDuration(elapsedSeconds)}
              </Text>
            </View>
          </View>

          {/* Participant count */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: colors.bg3,
              borderRadius: 100,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Users size={14} color={colors.text2} />
            <Text
              style={{
                color: colors.text2,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {participantCount}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Connecting banner */}
      <Animated.View
        entering={FadeIn.duration(500)}
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: `${colors.accent}15`,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: `${colors.accent}30`,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <ActivityIndicator size="small" color={colors.accent} />
        <Text
          style={{
            color: colors.accent,
            fontSize: 13,
            fontWeight: "600",
            flex: 1,
          }}
        >
          Conectando con otros participantes...
        </Text>
      </Animated.View>

      {/* Participant grid */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: gridPadding,
          paddingTop: 12,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: gridGap,
          }}
        >
          {allParticipants.map((p, idx) => (
            <Animated.View
              key={p.id}
              entering={FadeInDown.duration(300).delay(idx * 80)}
            >
              <ParticipantTile
                participant={p}
                tileSize={tileSize}
                colors={colors}
                cameraPermission={cameraPermission?.granted === true}
              />
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Bottom toolbar */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.bg2 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-evenly",
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {/* Toggle Mic */}
          <Pressable
            testID="toggle-mic-button"
            onPress={() => setIsMicOn((v) => !v)}
            style={({ pressed }) => ({
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: isMicOn
                ? pressed ? colors.bg4 : colors.bg3
                : `${colors.error}20`,
              borderWidth: 1,
              borderColor: isMicOn ? colors.border : `${colors.error}50`,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            {isMicOn ? (
              <Mic size={22} color={colors.text} />
            ) : (
              <MicOff size={22} color={colors.error} />
            )}
          </Pressable>

          {/* Toggle Camera */}
          <Pressable
            testID="toggle-camera-button"
            onPress={() => setIsCameraOn((v) => !v)}
            style={({ pressed }) => ({
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: isCameraOn
                ? pressed ? colors.bg4 : colors.bg3
                : `${colors.error}20`,
              borderWidth: 1,
              borderColor: isCameraOn ? colors.border : `${colors.error}50`,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            {isCameraOn ? (
              <Video size={22} color={colors.text} />
            ) : (
              <VideoOff size={22} color={colors.error} />
            )}
          </Pressable>

          {/* End Call */}
          <Pressable
            testID="end-call-button"
            onPress={handleEnd}
            disabled={isEnding}
            style={({ pressed }) => ({
              width: 60,
              height: 52,
              borderRadius: 26,
              backgroundColor: pressed ? "#CC2E26" : colors.error,
              alignItems: "center",
              justifyContent: "center",
              opacity: isEnding ? 0.6 : 1,
            })}
          >
            <PhoneOff size={22} color="#FFFFFF" />
          </Pressable>

          {/* Chat Toggle */}
          <Pressable
            testID="toggle-chat-button"
            onPress={() => setIsChatOpen((v) => !v)}
            style={({ pressed }) => ({
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: isChatOpen
                ? `${colors.accent}20`
                : pressed ? colors.bg4 : colors.bg3,
              borderWidth: 1,
              borderColor: isChatOpen ? `${colors.accent}50` : colors.border,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <MessageCircle
              size={22}
              color={isChatOpen ? colors.accent : colors.text}
            />
            {messages.length > 0 && !isChatOpen ? (
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.accent,
                }}
              />
            ) : null}
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Chat sidebar */}
      {isChatOpen ? (
        <ChatPanel
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSend={handleSendChat}
          colors={colors}
          onClose={() => setIsChatOpen(false)}
        />
      ) : null}
    </View>
  );
}

// ─── Setup Screen ───────────────────────────────────────────────────────────────

export default function GoLiveScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();

  const [phase, setPhase] = useState<RoomPhase>("setup");
  const [roomTitle, setRoomTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [setupMode, setSetupMode] = useState<"create" | "join">("create");

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const currentUserId = session?.user?.id ?? "local-user";
  const currentUserName = session?.user?.name ?? "Invitado";

  const handleCreateRoom = () => {
    if (!roomTitle.trim()) return;
    const code = generateRoomCode();
    setRoomCode(code);
    setPhase("room");
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return;
    setRoomCode(joinCode.trim().toUpperCase());
    setRoomTitle(`Sala ${joinCode.trim().toUpperCase()}`);
    setPhase("room");
  };

  const handleEndRoom = () => {
    setPhase("setup");
    setRoomTitle("");
    setJoinCode("");
    setRoomCode("");
    router.back();
  };

  // ── Room Phase ──
  if (phase === "room") {
    return (
      <RoomView
        roomTitle={roomTitle}
        roomCode={roomCode}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onEnd={handleEndRoom}
      />
    );
  }

  // ── Setup Phase ──
  const canCreate = roomTitle.trim().length > 0;
  const canJoin = joinCode.trim().length >= 4;

  return (
    <View testID="go-live-screen" style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 16,
          }}
        >
          <Pressable
            testID="go-live-back-button"
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed ? colors.bg4 : colors.bg3,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            })}
          >
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "900",
              letterSpacing: -0.5,
              flex: 1,
            }}
          >
            Sala de Video
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: `${colors.accent}15`,
              borderWidth: 1,
              borderColor: `${colors.accent}30`,
              borderRadius: 100,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Video size={12} color={colors.accent} />
            <Text
              style={{
                color: colors.accent,
                fontSize: 10,
                fontWeight: "700",
              }}
            >
              VIDEO
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Camera preview */}
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={{ marginBottom: 24, alignItems: "center" }}
            >
              <View
                style={{
                  width: SCREEN_WIDTH - 80,
                  height: (SCREEN_WIDTH - 80) * 0.65,
                  borderRadius: 20,
                  overflow: "hidden",
                  backgroundColor: colors.bg3,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                }}
              >
                {cameraPermission?.granted && isCameraEnabled ? (
                  <CameraView style={{ flex: 1 }} facing="front" />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: `${colors.accent}15`,
                        borderWidth: 2,
                        borderColor: `${colors.accent}30`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.accent,
                          fontWeight: "800",
                          fontSize: 22,
                        }}
                      >
                        {getInitials(currentUserName)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.text3,
                        fontSize: 13,
                      }}
                    >
                      {!cameraPermission?.granted
                        ? "Permiso de camara necesario"
                        : "Camara apagada"}
                    </Text>
                  </View>
                )}

                {/* Camera/mic toggles overlay */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: 0,
                    right: 0,
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 16,
                  }}
                >
                  <Pressable
                    testID="setup-toggle-camera"
                    onPress={() => setIsCameraEnabled((v) => !v)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isCameraEnabled
                        ? "rgba(0,0,0,0.5)"
                        : "rgba(239,68,68,0.7)",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.15)",
                    }}
                  >
                    {isCameraEnabled ? (
                      <Video size={20} color="#FFFFFF" />
                    ) : (
                      <VideoOff size={20} color="#FFFFFF" />
                    )}
                  </Pressable>
                  <Pressable
                    testID="setup-toggle-mic"
                    onPress={() => setIsMicEnabled((v) => !v)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isMicEnabled
                        ? "rgba(0,0,0,0.5)"
                        : "rgba(239,68,68,0.7)",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.15)",
                    }}
                  >
                    {isMicEnabled ? (
                      <Mic size={20} color="#FFFFFF" />
                    ) : (
                      <MicOff size={20} color="#FFFFFF" />
                    )}
                  </Pressable>
                </View>
              </View>
            </Animated.View>

            {/* Create / Join toggle */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(60)}
              style={{
                flexDirection: "row",
                backgroundColor: colors.bg3,
                borderRadius: 14,
                padding: 4,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Pressable
                testID="tab-create-room"
                onPress={() => setSetupMode("create")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 11,
                  backgroundColor:
                    setupMode === "create" ? colors.accent : "transparent",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Plus
                  size={16}
                  color={setupMode === "create" ? colors.bg : colors.text3}
                />
                <Text
                  style={{
                    color:
                      setupMode === "create" ? colors.bg : colors.text3,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Crear Sala
                </Text>
              </Pressable>
              <Pressable
                testID="tab-join-room"
                onPress={() => setSetupMode("join")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 11,
                  backgroundColor:
                    setupMode === "join" ? colors.accent : "transparent",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <LogIn
                  size={16}
                  color={setupMode === "join" ? colors.bg : colors.text3}
                />
                <Text
                  style={{
                    color:
                      setupMode === "join" ? colors.bg : colors.text3,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Unirse
                </Text>
              </Pressable>
            </Animated.View>

            {/* Create Room Form */}
            {setupMode === "create" ? (
              <Animated.View
                entering={FadeIn.duration(300)}
                key="create-form"
              >
                <Text
                  style={{
                    color: colors.text2,
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  TITULO DE LA SALA
                </Text>
                <TextInput
                  testID="room-title-input"
                  value={roomTitle}
                  onChangeText={setRoomTitle}
                  placeholder="Ej: Reunion de equipo, Clase de yoga..."
                  placeholderTextColor={colors.text4}
                  style={{
                    backgroundColor: colors.bg2,
                    borderRadius: 14,
                    padding: 16,
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "600",
                    borderWidth: 1.5,
                    borderColor: roomTitle.length > 0
                      ? `${colors.accent}60`
                      : colors.border,
                    marginBottom: 24,
                  }}
                />

                {/* Create button */}
                <Pressable
                  testID="create-room-button"
                  onPress={handleCreateRoom}
                  disabled={!canCreate}
                  style={({ pressed }) => ({
                    borderRadius: 100,
                    overflow: "hidden",
                    opacity: canCreate ? 1 : 0.4,
                  })}
                >
                  <LinearGradient
                    colors={
                      canCreate
                        ? [colors.accent, colors.success]
                        : [colors.bg3, colors.bg4]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 18,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <Video
                      size={20}
                      color={canCreate ? colors.bg : colors.text4}
                    />
                    <Text
                      style={{
                        color: canCreate ? colors.bg : colors.text4,
                        fontSize: 16,
                        fontWeight: "900",
                        letterSpacing: 0.5,
                      }}
                    >
                      CREAR SALA
                    </Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ) : (
              <Animated.View
                entering={FadeIn.duration(300)}
                key="join-form"
              >
                <Text
                  style={{
                    color: colors.text2,
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  CODIGO DE LA SALA
                </Text>
                <TextInput
                  testID="join-code-input"
                  value={joinCode}
                  onChangeText={(t) => setJoinCode(t.toUpperCase())}
                  placeholder="Ej: ABC123"
                  placeholderTextColor={colors.text4}
                  autoCapitalize="characters"
                  maxLength={8}
                  style={{
                    backgroundColor: colors.bg2,
                    borderRadius: 14,
                    padding: 16,
                    color: colors.text,
                    fontSize: 20,
                    fontWeight: "800",
                    letterSpacing: 4,
                    textAlign: "center",
                    borderWidth: 1.5,
                    borderColor: joinCode.length >= 4
                      ? `${colors.accent}60`
                      : colors.border,
                    marginBottom: 24,
                  }}
                />

                {/* Join button */}
                <Pressable
                  testID="join-room-button"
                  onPress={handleJoinRoom}
                  disabled={!canJoin}
                  style={({ pressed }) => ({
                    borderRadius: 100,
                    overflow: "hidden",
                    opacity: canJoin ? 1 : 0.4,
                  })}
                >
                  <LinearGradient
                    colors={
                      canJoin
                        ? [colors.accent, colors.success]
                        : [colors.bg3, colors.bg4]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 18,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <LogIn
                      size={20}
                      color={canJoin ? colors.bg : colors.text4}
                    />
                    <Text
                      style={{
                        color: canJoin ? colors.bg : colors.text4,
                        fontSize: 16,
                        fontWeight: "900",
                        letterSpacing: 0.5,
                      }}
                    >
                      UNIRSE A SALA
                    </Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            {/* Info note */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
              style={{ marginTop: 28 }}
            >
              <View
                style={{
                  backgroundColor: `${colors.info}10`,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: `${colors.info}20`,
                  flexDirection: "row",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <Users size={18} color={colors.info} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text2,
                      fontSize: 13,
                      fontWeight: "700",
                      marginBottom: 4,
                    }}
                  >
                    Videollamada grupal
                  </Text>
                  <Text
                    style={{
                      color: colors.text3,
                      fontSize: 12,
                      lineHeight: 18,
                    }}
                  >
                    Crea una sala o unete con un codigo. Comparte el codigo con otros para que se unan a la llamada.
                  </Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
