import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Search,
  Plus,
  Users,
  Send,
  ArrowLeft,
  Image as ImageIcon,
  Paperclip,
  Crown,
  MessageCircle,
  Hash,
  X,
  ChevronRight,
} from "lucide-react-native";
import { useTheme, DARK } from "@/lib/theme";

type ThemeColors = typeof DARK;
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import * as ImagePicker from "expo-image-picker";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Community {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  _count?: { members: number };
  myRole?: string | null;
}

interface CommunityMessage {
  id: string;
  content: string;
  fileUrl: string | null;
  fileType: string | null;
  userName: string | null;
  userImage: string | null;
  createdAt: string;
  user?: { name: string | null; image: string | null };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Finanzas",
  "Negocios",
  "Trading",
  "Tecnologia",
  "Desarrollo Personal",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Finanzas: "#4ADE80",
  Negocios: "#F59E0B",
  Trading: "#F87171",
  Tecnologia: "#60A5FA",
  "Desarrollo Personal": "#A78BFA",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w?.[0] ?? "")
    .join("")
    .toUpperCase();
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mes`;
}

function getCategoryColor(cat: string | null): string {
  return CATEGORY_COLORS[cat ?? ""] ?? "#4ADE80";
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CommunitiesScreen() {
  const { colors, mode } = useTheme();
  const queryClient = useQueryClient();

  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  if (selectedCommunity) {
    return (
      <CommunityChat
        community={selectedCommunity}
        onBack={() => setSelectedCommunity(null)}
        colors={colors}
        mode={mode}
      />
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      testID="communities-screen"
    >
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: colors.text,
            letterSpacing: -0.8,
          }}
        >
          Comunidades
        </Text>
        <Pressable
          testID="create-community-button"
          onPress={() => setShowCreateModal(true)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={20} color={mode === "dark" ? "#000" : "#fff"} strokeWidth={2.5} />
        </Pressable>
      </Animated.View>

      {/* Search */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(40).springify()}
        style={{ paddingHorizontal: 20, marginBottom: 12 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.bg3,
            borderRadius: 14,
            paddingHorizontal: 14,
            height: 44,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Search size={18} color={colors.text3} strokeWidth={2} />
          <TextInput
            testID="community-search-input"
            placeholder="Buscar comunidades..."
            placeholderTextColor={colors.text4}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              color: colors.text,
            }}
          />
          {searchQuery.length > 0 ? (
            <Pressable
              testID="clear-search-button"
              onPress={() => setSearchQuery("")}
            >
              <X size={16} color={colors.text3} />
            </Pressable>
          ) : null}
        </View>
      </Animated.View>

      {/* Category Pills */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(80).springify()}
        style={{ marginBottom: 8 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          style={{ flexGrow: 0 }}
        >
          <Pressable
            testID="category-pill-all"
            onPress={() => setSelectedCategory(null)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor:
                selectedCategory === null
                  ? colors.accent
                  : colors.bg3,
              borderWidth: 1,
              borderColor:
                selectedCategory === null
                  ? colors.accent
                  : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color:
                  selectedCategory === null
                    ? mode === "dark"
                      ? "#000"
                      : "#fff"
                    : colors.text2,
              }}
            >
              Todas
            </Text>
          </Pressable>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              testID={`category-pill-${cat.toLowerCase().replace(/\s+/g, "-")}`}
              onPress={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  selectedCategory === cat
                    ? getCategoryColor(cat)
                    : colors.bg3,
                borderWidth: 1,
                borderColor:
                  selectedCategory === cat
                    ? getCategoryColor(cat)
                    : colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color:
                    selectedCategory === cat
                      ? "#000"
                      : colors.text2,
                }}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Community List */}
      <CommunityList
        searchQuery={searchQuery}
        category={selectedCategory}
        colors={colors}
        mode={mode}
        onSelect={setSelectedCommunity}
        onCreatePress={() => setShowCreateModal(true)}
      />

      {/* Create Community Modal */}
      <CreateCommunityModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        colors={colors}
        mode={mode}
      />
    </SafeAreaView>
  );
}

// ─── Community List ─────────────────────────────────────────────────────────

function CommunityList({
  searchQuery,
  category,
  colors,
  mode,
  onSelect,
  onCreatePress,
}: {
  searchQuery: string;
  category: string | null;
  colors: ThemeColors;
  mode: string;
  onSelect: (c: Community) => void;
  onCreatePress: () => void;
}) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["communities", searchQuery, category],
    queryFn: () =>
      api.get<Community[]>(
        `/api/communities?search=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(category ?? "")}&limit=20&offset=0`
      ),
  });

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        testID="communities-loading"
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.text3, marginTop: 12, fontSize: 14 }}>
          Cargando comunidades...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}
        testID="communities-error"
      >
        <MessageCircle size={40} color={colors.text4} />
        <Text
          style={{
            color: colors.text2,
            fontSize: 16,
            fontWeight: "600",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Error al cargar comunidades
        </Text>
        <Pressable
          testID="retry-button"
          onPress={() => refetch()}
          style={{
            marginTop: 16,
            backgroundColor: colors.accent,
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: mode === "dark" ? "#000" : "#fff",
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            Reintentar
          </Text>
        </Pressable>
      </View>
    );
  }

  const communities = data ?? [];

  if (communities.length === 0) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}
        testID="communities-empty"
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: `${colors.accent}15`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Users size={32} color={colors.accent} />
        </View>
        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          No hay comunidades
        </Text>
        <Text
          style={{
            color: colors.text3,
            fontSize: 14,
            textAlign: "center",
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          {searchQuery
            ? "No se encontraron resultados para tu busqueda."
            : "Se el primero en crear una comunidad."}
        </Text>
        <Pressable
          testID="create-first-community-button"
          onPress={onCreatePress}
          style={{
            backgroundColor: colors.accent,
            paddingHorizontal: 28,
            paddingVertical: 12,
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              color: mode === "dark" ? "#000" : "#fff",
              fontWeight: "700",
              fontSize: 15,
            }}
          >
            Crear Comunidad
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      testID="communities-list"
      data={communities}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <CommunityCard
          community={item}
          index={index}
          colors={colors}
          mode={mode}
          onPress={() => onSelect(item)}
        />
      )}
    />
  );
}

// ─── Community Card ─────────────────────────────────────────────────────────

function CommunityCard({
  community,
  index,
  colors,
  mode,
  onPress,
}: {
  community: Community;
  index: number;
  colors: ThemeColors;
  mode: string;
  onPress: () => void;
}) {
  const catColor = getCategoryColor(community.category);
  const memberCount = community._count?.members ?? 0;

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(index * 40).springify()}>
      <Pressable
        testID={`community-card-${community.id}`}
        onPress={onPress}
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
          {/* Avatar */}
          {community.imageUrl ? (
            <Image
              source={{ uri: community.imageUrl }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: `${catColor}30`,
              }}
            />
          ) : (
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: `${catColor}18`,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: `${catColor}30`,
              }}
            >
              <Hash size={22} color={catColor} strokeWidth={2} />
            </View>
          )}

          {/* Content */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.text,
                  flex: 1,
                  letterSpacing: -0.3,
                }}
              >
                {community.name}
              </Text>
              {community.myRole === "admin" || community.myRole === "owner" ? (
                <Crown size={14} color="#F59E0B" />
              ) : null}
            </View>

            {community.description ? (
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 13,
                  color: colors.text3,
                  marginTop: 4,
                  lineHeight: 18,
                }}
              >
                {community.description}
              </Text>
            ) : null}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginTop: 10,
              }}
            >
              {/* Category Badge */}
              {community.category ? (
                <View
                  style={{
                    backgroundColor: `${catColor}18`,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: catColor,
                    }}
                  >
                    {community.category}
                  </Text>
                </View>
              ) : null}

              {/* Member Count */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Users size={12} color={colors.text4} />
                <Text style={{ fontSize: 12, color: colors.text3, fontWeight: "500" }}>
                  {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
                </Text>
              </View>
            </View>
          </View>

          {/* Chevron */}
          <ChevronRight size={18} color={colors.text4} style={{ marginTop: 4 }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Community Chat ─────────────────────────────────────────────────────────

function CommunityChat({
  community,
  onBack,
  colors,
  mode,
}: {
  community: Community;
  onBack: () => void;
  colors: ThemeColors;
  mode: string;
}) {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState<string>("");
  const flatListRef = useRef<FlatList<CommunityMessage>>(null);
  const [communityDetail, setCommunityDetail] = useState<Community>(community);

  // Fetch community detail
  const detailQuery = useQuery({
    queryKey: ["community-detail", community.id],
    queryFn: () => api.get<Community>(`/api/communities/${community.id}`),
  });

  useEffect(() => {
    if (detailQuery.data) {
      setCommunityDetail(detailQuery.data);
    }
  }, [detailQuery.data]);

  // Fetch messages
  const messagesQuery = useQuery({
    queryKey: ["community-messages", community.id],
    queryFn: () =>
      api.get<CommunityMessage[]>(
        `/api/communities/${community.id}/messages?limit=30`
      ),
    refetchInterval: 5000,
  });

  const messages = messagesQuery.data ?? [];
  const isMember =
    communityDetail.myRole === "member" ||
    communityDetail.myRole === "admin" ||
    communityDetail.myRole === "owner";
  const memberCount = communityDetail._count?.members ?? 0;

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: () =>
      api.post<void>(`/api/communities/${community.id}/join`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["community-detail", community.id],
      });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: () =>
      api.post<void>(`/api/communities/${community.id}/leave`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["community-detail", community.id],
      });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (body: { content: string; fileUrl?: string; fileType?: string }) =>
      api.post<CommunityMessage>(
        `/api/communities/${community.id}/messages`,
        body
      ),
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({
        queryKey: ["community-messages", community.id],
      });
    },
  });

  const { mutate: sendMessage } = sendMutation;

  const handleSend = useCallback(() => {
    const trimmed = messageText.trim();
    if (!trimmed) return;
    sendMessage({ content: trimmed });
  }, [messageText, sendMessage]);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        sendMessage({
          content: "Imagen compartida",
          fileUrl: asset.uri,
          fileType: asset.mimeType ?? "image/jpeg",
        });
      }
    } catch {
      // Silent fail
    }
  }, [sendMessage]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      testID="community-chat-screen"
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 12,
        }}
      >
        <Pressable testID="chat-back-button" onPress={onBack}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: colors.text,
              letterSpacing: -0.3,
            }}
          >
            {communityDetail.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.text3, marginTop: 1 }}>
            {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
          </Text>
        </View>
        {isMember ? (
          <Pressable
            testID="leave-community-button"
            onPress={() => leaveMutation.mutate()}
            disabled={leaveMutation.isPending}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: colors.accent2,
              opacity: leaveMutation.isPending ? 0.6 : 1,
            }}
          >
            <Text style={{ color: colors.accent2, fontSize: 12, fontWeight: "700" }}>
              Salir
            </Text>
          </Pressable>
        ) : (
          <Pressable
            testID="join-community-button"
            onPress={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 10,
              backgroundColor: colors.accent,
              opacity: joinMutation.isPending ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                color: mode === "dark" ? "#000" : "#fff",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              Unirse
            </Text>
          </Pressable>
        )}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {messagesQuery.isLoading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            testID="messages-loading"
          >
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : messagesQuery.isError ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}
            testID="messages-error"
          >
            <Text style={{ color: colors.text2, fontSize: 14, textAlign: "center" }}>
              Error al cargar mensajes
            </Text>
            <Pressable
              testID="retry-messages-button"
              onPress={() => messagesQuery.refetch()}
              style={{
                marginTop: 12,
                backgroundColor: colors.accent,
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  color: mode === "dark" ? "#000" : "#fff",
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : messages.length === 0 ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}
            testID="messages-empty"
          >
            <MessageCircle size={36} color={colors.text4} />
            <Text
              style={{
                color: colors.text3,
                fontSize: 14,
                textAlign: "center",
                marginTop: 12,
              }}
            >
              {isMember
                ? "No hay mensajes aun. Se el primero en escribir."
                : "Unete a la comunidad para ver y enviar mensajes."}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            testID="messages-list"
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 6 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item }) => (
              <MessageBubble message={item} colors={colors} mode={mode} />
            )}
          />
        )}

        {/* Message Input */}
        {isMember ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.bg,
              gap: 10,
            }}
          >
            <Pressable
              testID="attach-image-button"
              onPress={handlePickImage}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.bg3,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 1,
              }}
            >
              <ImageIcon size={18} color={colors.text3} />
            </Pressable>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.bg3,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === "ios" ? 10 : 6,
                maxHeight: 120,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <TextInput
                testID="message-input"
                placeholder="Escribe un mensaje..."
                placeholderTextColor={colors.text4}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                style={{
                  fontSize: 15,
                  color: colors.text,
                  maxHeight: 100,
                }}
              />
            </View>
            <Pressable
              testID="send-message-button"
              onPress={handleSend}
              disabled={!messageText.trim() || sendMutation.isPending}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor:
                  messageText.trim() ? colors.accent : colors.bg3,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 1,
                opacity: messageText.trim() ? 1 : 0.5,
              }}
            >
              {sendMutation.isPending ? (
                <ActivityIndicator size="small" color={mode === "dark" ? "#000" : "#fff"} />
              ) : (
                <Send
                  size={17}
                  color={
                    messageText.trim()
                      ? mode === "dark"
                        ? "#000"
                        : "#fff"
                      : colors.text4
                  }
                  strokeWidth={2.2}
                />
              )}
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({
  message,
  colors,
  mode,
}: {
  message: CommunityMessage;
  colors: ThemeColors;
  mode: string;
}) {
  const userName = message.user?.name ?? message.userName ?? "Usuario";
  const userImage = message.user?.image ?? message.userImage;
  const initials = getInitials(userName);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingVertical: 6,
      }}
    >
      {/* Avatar */}
      {userImage ? (
        <Image
          source={{ uri: userImage }}
          style={{ width: 34, height: 34, borderRadius: 17 }}
        />
      ) : (
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: `${colors.accent}20`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colors.accent,
            }}
          >
            {initials}
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {userName}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: colors.text4,
            }}
          >
            {formatTimeAgo(message.createdAt)}
          </Text>
        </View>

        {/* File Attachment */}
        {message.fileUrl && message.fileType?.startsWith("image") ? (
          <Image
            source={{ uri: message.fileUrl }}
            style={{
              width: 200,
              height: 150,
              borderRadius: 12,
              marginTop: 6,
              backgroundColor: colors.bg3,
            }}
            resizeMode="cover"
          />
        ) : message.fileUrl ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: colors.bg3,
              padding: 10,
              borderRadius: 10,
              marginTop: 6,
              alignSelf: "flex-start",
            }}
          >
            <Paperclip size={14} color={colors.text3} />
            <Text style={{ fontSize: 12, color: colors.text2 }}>Archivo adjunto</Text>
          </View>
        ) : null}

        {/* Text Content */}
        {message.content && !(message.fileUrl && message.content === "Imagen compartida") ? (
          <Text
            style={{
              fontSize: 14,
              color: colors.text2,
              marginTop: 3,
              lineHeight: 20,
            }}
          >
            {message.content}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Create Community Modal ─────────────────────────────────────────────────

function CreateCommunityModal({
  visible,
  onClose,
  colors,
  mode,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
  mode: string;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("Finanzas");
  const [isPublic, setIsPublic] = useState<boolean>(true);

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Community>("/api/communities", {
        name: name.trim(),
        description: description.trim() || null,
        category,
        isPublic,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      setName("");
      setDescription("");
      setCategory("Finanzas");
      setIsPublic(true);
      onClose();
    },
  });

  const canCreate = name.trim().length >= 2;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg }}
        testID="create-community-modal"
      >
        {/* Modal Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable testID="close-create-modal-button" onPress={onClose}>
            <X size={24} color={colors.text} />
          </Pressable>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            Nueva Comunidad
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.text2,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Nombre
            </Text>
            <TextInput
              testID="community-name-input"
              placeholder="Nombre de la comunidad"
              placeholderTextColor={colors.text4}
              value={name}
              onChangeText={setName}
              maxLength={60}
              style={{
                backgroundColor: colors.bg3,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          {/* Description */}
          <View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.text2,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Descripcion
            </Text>
            <TextInput
              testID="community-description-input"
              placeholder="Describe tu comunidad..."
              placeholderTextColor={colors.text4}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              style={{
                backgroundColor: colors.bg3,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: 100,
                textAlignVertical: "top",
              }}
            />
          </View>

          {/* Category */}
          <View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.text2,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Categoria
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const catColor = getCategoryColor(cat);
                return (
                  <Pressable
                    key={cat}
                    testID={`create-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                    onPress={() => setCategory(cat)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 9,
                      borderRadius: 20,
                      backgroundColor: isSelected ? catColor : colors.bg3,
                      borderWidth: 1,
                      borderColor: isSelected ? catColor : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: isSelected ? "#000" : colors.text2,
                      }}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Public/Private */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.bg3,
              padding: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: colors.text,
                }}
              >
                Comunidad publica
              </Text>
              <Text style={{ fontSize: 12, color: colors.text3, marginTop: 2 }}>
                {isPublic
                  ? "Cualquiera puede unirse"
                  : "Solo por invitacion"}
              </Text>
            </View>
            <Switch
              testID="public-toggle"
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{
                false: colors.bg4,
                true: `${colors.accent}60`,
              }}
              thumbColor={isPublic ? colors.accent : colors.text4}
            />
          </View>

          {/* Create Button */}
          <Pressable
            testID="submit-create-community-button"
            onPress={() => createMutation.mutate()}
            disabled={!canCreate || createMutation.isPending}
            style={{
              backgroundColor: canCreate ? colors.accent : colors.bg4,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
              opacity: createMutation.isPending ? 0.7 : 1,
            }}
          >
            {createMutation.isPending ? (
              <ActivityIndicator
                size="small"
                color={mode === "dark" ? "#000" : "#fff"}
              />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: canCreate
                    ? mode === "dark"
                      ? "#000"
                      : "#fff"
                    : colors.text4,
                }}
              >
                Crear Comunidad
              </Text>
            )}
          </Pressable>

          {/* Error */}
          {createMutation.isError ? (
            <Text
              style={{
                color: colors.error,
                fontSize: 13,
                textAlign: "center",
              }}
              testID="create-error-message"
            >
              Error al crear la comunidad. Intentalo de nuevo.
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
