import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, TextInput, Image, Modal, ScrollView, Pressable, Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useSession } from "@/lib/auth/use-session";
import { Post, Notification, User } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  TrendingUp, Lightbulb, HelpCircle, Heart, Sparkles,
  Plus, Bell, Search, X, Bookmark, MessageCircle,
  MoreHorizontal, CheckCircle, Send, ImageIcon, UserPlus,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useTheme, DARK } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import * as ImagePicker from "expo-image-picker";
import { uploadFile } from "@/lib/upload";

type Colors = typeof DARK;

// HUD color palette
const HUD = {
  bg: "#020B18",
  card: "#041525",
  accent: "#00B4D8",
  accentDim: "#0D3A55",
  text: "#C8E8FF",
  text2: "#7DB8D9",
  text3: "#4A7A99",
  border: "#0D3A55",
  error: "#FF3B30",
  success: "#00D9A3",
  warning: "#FFB800",
};

const REACTION_TYPES = [
  { id: "useful", emoji: "💡" },
  { id: "inspired", emoji: "🔥" },
  { id: "good_progress", emoji: "🎯" },
  { id: "interesting", emoji: "✨" },
];

function HudScanLine() {
  return (
    <View style={{ height: 1, marginHorizontal: 0, marginVertical: 0, flexDirection: "row", alignItems: "center" }}>
      <View style={{ flex: 1, height: 1, backgroundColor: HUD.accentDim }} />
      <View style={{ width: 4, height: 4, backgroundColor: HUD.accent, transform: [{ rotate: "45deg" }], marginHorizontal: 6 }} />
      <View style={{ flex: 1, height: 1, backgroundColor: HUD.accentDim }} />
    </View>
  );
}

function HudCornerBox({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ position: "relative" }, style]}>
      {/* Top-left corner */}
      <View style={{ position: "absolute", top: 0, left: 0, width: 10, height: 10, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: HUD.accent, zIndex: 2 }} />
      {/* Top-right corner */}
      <View style={{ position: "absolute", top: 0, right: 0, width: 10, height: 10, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: HUD.accent, zIndex: 2 }} />
      {/* Bottom-left corner */}
      <View style={{ position: "absolute", bottom: 0, left: 0, width: 10, height: 10, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: HUD.accent, zIndex: 2 }} />
      {/* Bottom-right corner */}
      <View style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: HUD.accent, zIndex: 2 }} />
      {children}
    </View>
  );
}

function PostCard({ post, currentUserId, colors }: { post: Post; currentUserId: string; colors: Colors }) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const myReaction = post.reactions?.[0];
  const isMyPost = post.author?.id === currentUserId;

  const reactMutation = useMutation({
    mutationFn: (type: string) => api.post(`/api/posts/${post.id}/react`, { type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
  const saveMutation = useMutation({
    mutationFn: () => api.post(`/api/posts/${post.id}/save`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
  const commentMutation = useMutation({
    mutationFn: () => api.post(`/api/posts/${post.id}/comments`, { content: commentText }),
    onSuccess: () => { setCommentText(""); queryClient.invalidateQueries({ queryKey: ["comments", post.id] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/posts/${post.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => api.get<any[]>(`/api/posts/${post.id}/comments`),
    enabled: showComments,
  });

  const handleMorePress = () => {
    if (!isMyPost) return;
    Alert.alert(t("post"), undefined, [
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          Alert.alert(t("deletePost"), t("deletePostMsg"), [
            { text: t("cancel"), style: "cancel" },
            { text: t("delete"), style: "destructive", onPress: () => deleteMutation.mutate() },
          ]);
        },
      },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  const categoryColors: Record<string, string> = {
    progress: HUD.success,
    learning: HUD.accent,
    question: "#A78BFA",
    inspiration: HUD.warning,
  };
  const catColor = categoryColors[post.category] || HUD.accent;

  // Parse media urls
  const mediaUrls: string[] = (() => {
    try { return post.mediaUrls ? JSON.parse(post.mediaUrls) : []; } catch { return []; }
  })();

  const categoryLabel = post.category ? post.category.toUpperCase() : "DATA";

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <View
        style={{
          backgroundColor: HUD.card,
          borderRadius: 4,
          marginHorizontal: 12,
          marginBottom: 10,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: HUD.border,
        }}
        testID="post-card"
      >
        {/* Glowing cyan top border */}
        <View style={{ height: 2, backgroundColor: catColor, shadowColor: catColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6 }} />

        <View style={{ padding: 14 }}>
          {/* Author row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            {/* Avatar with cyan ring */}
            <View style={{ width: 38, height: 38, borderRadius: 4, borderWidth: 1.5, borderColor: HUD.accent, overflow: "hidden", marginRight: 10, alignItems: "center", justifyContent: "center", backgroundColor: HUD.accentDim, shadowColor: HUD.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4 }}>
              {post.author?.image
                ? <Image source={{ uri: post.author.image }} style={{ width: 38, height: 38 }} />
                : <Text style={{ color: HUD.accent, fontWeight: "700", fontSize: 15, fontVariant: ["small-caps"] }}>{post.author?.name?.[0]?.toUpperCase()}</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text style={{ color: HUD.text, fontWeight: "700", fontSize: 13, letterSpacing: 0.5 }}>{post.author?.name}</Text>
                {post.author?.isVerified ? <CheckCircle size={12} color={HUD.accent} fill={HUD.accent} /> : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}>
                <View style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: catColor }} />
                <Text style={{ color: HUD.text3, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "600" }}>{categoryLabel}</Text>
              </View>
            </View>
            {isMyPost ? (
              <TouchableOpacity onPress={handleMorePress} testID="more-options-button" style={{ padding: 4 }}>
                <MoreHorizontal size={16} color={HUD.text3} />
              </TouchableOpacity>
            ) : (
              <MoreHorizontal size={16} color="transparent" />
            )}
          </View>

          {/* Content */}
          {post.content ? (
            <Text style={{ color: HUD.text2, fontSize: 14, lineHeight: 22, marginBottom: 10, letterSpacing: 0.2 }}>
              {post.content}
            </Text>
          ) : null}

          {/* Media */}
          {mediaUrls.length > 0 ? (
            <View style={{ marginBottom: 10, borderRadius: 4, overflow: "hidden", borderWidth: 1, borderColor: HUD.border }}>
              <Image source={{ uri: mediaUrls[0] }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
            </View>
          ) : null}

          {/* Hashtags */}
          {post.hashtags ? (() => {
            try {
              const tags: string[] = JSON.parse(post.hashtags);
              return (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {tags.map((tag) => (
                    <Text key={tag} style={{ color: HUD.accent, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: "600" }}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              );
            } catch { return null; }
          })() : null}

          {/* Circuit divider */}
          <HudScanLine />

          {/* Actions */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 10, gap: 4 }}>
            <TouchableOpacity
              onPress={() => setShowReactions(!showReactions)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                paddingVertical: 5, paddingHorizontal: 10,
                borderRadius: 2,
                backgroundColor: myReaction ? `${HUD.accent}18` : "transparent",
                borderWidth: 1,
                borderColor: myReaction ? HUD.accent : HUD.border,
              }}
              testID="react-button"
            >
              <Text style={{ fontSize: 13 }}>{myReaction ? REACTION_TYPES.find(r => r.id === myReaction.type)?.emoji || "💡" : "💡"}</Text>
              <Text style={{ color: myReaction ? HUD.accent : HUD.text3, fontSize: 11, fontWeight: "700", fontVariant: ["tabular-nums"], letterSpacing: 0.5 }}>
                SYS:{post._count?.reactions || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowComments(!showComments)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                paddingVertical: 5, paddingHorizontal: 10,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: showComments ? HUD.accent : HUD.border,
                backgroundColor: showComments ? `${HUD.accent}18` : "transparent",
              }}
              testID="comment-button"
            >
              <MessageCircle size={13} color={showComments ? HUD.accent : HUD.text3} />
              <Text style={{ color: showComments ? HUD.accent : HUD.text3, fontSize: 11, fontWeight: "700", fontVariant: ["tabular-nums"], letterSpacing: 0.5 }}>
                COM:{post._count?.comments || 0}
              </Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => saveMutation.mutate()}
              style={{ padding: 6, borderRadius: 2, borderWidth: 1, borderColor: HUD.border }}
              testID="save-button"
            >
              <Bookmark size={14} color={HUD.text3} />
            </TouchableOpacity>
          </View>

          {/* Reaction picker */}
          {showReactions ? (
            <Animated.View entering={FadeIn.duration(150)} style={{ flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {REACTION_TYPES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => { reactMutation.mutate(r.id); setShowReactions(false); }}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 4,
                    paddingHorizontal: 12, paddingVertical: 7,
                    borderRadius: 2,
                    backgroundColor: myReaction?.type === r.id ? `${HUD.accent}22` : HUD.bg,
                    borderWidth: 1,
                    borderColor: myReaction?.type === r.id ? HUD.accent : HUD.border,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{r.emoji}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          ) : null}

          {/* Comments */}
          {showComments ? (
            <View style={{ marginTop: 12 }}>
              {(comments || []).map((c: any) => (
                <View key={c.id} style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 2, backgroundColor: HUD.accentDim, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: HUD.border }}>
                    <Text style={{ color: HUD.accent, fontSize: 10, fontWeight: "700" }}>{c.author?.name?.[0]}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: HUD.bg, borderRadius: 2, padding: 8, borderWidth: 1, borderColor: HUD.border }}>
                    <Text style={{ color: HUD.text3, fontSize: 10, fontWeight: "700", marginBottom: 2, letterSpacing: 0.8, textTransform: "uppercase" }}>{c.author?.name}</Text>
                    <Text style={{ color: HUD.text2, fontSize: 12 }}>{c.content}</Text>
                  </View>
                </View>
              ))}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="TRANSMIT MESSAGE..."
                  placeholderTextColor={HUD.text3}
                  style={{ flex: 1, backgroundColor: HUD.bg, borderRadius: 2, paddingHorizontal: 12, paddingVertical: 8, color: HUD.text, fontSize: 12, letterSpacing: 0.5, borderWidth: 1, borderColor: HUD.border }}
                />
                <TouchableOpacity
                  onPress={() => commentMutation.mutate()}
                  disabled={!commentText.trim()}
                  style={{ width: 36, height: 36, borderRadius: 2, backgroundColor: commentText.trim() ? HUD.accent : HUD.accentDim, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: commentText.trim() ? HUD.accent : HUD.border }}
                >
                  <Send size={13} color={commentText.trim() ? HUD.bg : HUD.text3} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const CATEGORIES = [
  { id: "all", labelKey: "forYou" as const, icon: Sparkles },
  { id: "progress", labelKey: "progress" as const, icon: TrendingUp },
  { id: "learning", labelKey: "learning" as const, icon: Lightbulb },
  { id: "question", labelKey: "questions" as const, icon: HelpCircle },
  { id: "inspiration", labelKey: "inspiration" as const, icon: Heart },
];

export default function FeedScreen() {
  const { data: session } = useSession();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [category, setCategory] = useState("all");
  const [showCompose, setShowCompose] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [newPost, setNewPost] = useState({ content: "", category: "progress", hashtags: "" });
  const [pickedMedia, setPickedMedia] = useState<{ uri: string; mimeType: string; fileName: string } | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: posts, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["posts", category],
    queryFn: () => api.get<Post[]>(`/api/posts${category !== "all" ? `?category=${category}` : ""}`),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["search-users", searchQ],
    queryFn: () => api.get<any[]>(`/api/users/search?q=${searchQ}`),
    enabled: searchQ.length > 1,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<Notification[]>("/api/notifications"),
    enabled: showNotifications,
  });

  const { data: selectedUserProfile } = useQuery({
    queryKey: ["user-profile", selectedUser?.id],
    queryFn: () => api.get<User>(`/api/users/${selectedUser!.id}`),
    enabled: !!selectedUser,
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch("/api/notifications/read-all", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/api/users/${userId}/follow`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-profile", selectedUser?.id] }),
  });

  const createPost = useMutation({
    mutationFn: async () => {
      let mediaUrls: string[] = [];
      if (pickedMedia) {
        setUploadingMedia(true);
        try {
          const result = await uploadFile(pickedMedia.uri, pickedMedia.fileName, pickedMedia.mimeType);
          mediaUrls = [result.url];
        } finally {
          setUploadingMedia(false);
        }
      }
      return api.post("/api/posts", {
        content: newPost.content,
        category: newPost.category,
        hashtags: newPost.hashtags ? newPost.hashtags.split(",").map((tag: string) => tag.trim()).filter(Boolean) : [],
        type: mediaUrls.length > 0 ? "media" : "text",
        ...(mediaUrls.length > 0 ? { mediaUrls } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setShowCompose(false);
      setNewPost({ content: "", category: "progress", hashtags: "" });
      setPickedMedia(null);
    },
  });

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() || "jpg";
      const mimeType = asset.type === "video" ? `video/${ext}` : `image/${ext}`;
      const fileName = asset.fileName || `media.${ext}`;
      setPickedMedia({ uri: asset.uri, mimeType, fileName });
    }
  };

  // Check if there are unread notifications (we use a background query for the badge)
  const { data: notifBadge } = useQuery({
    queryKey: ["notifications-badge"],
    queryFn: () => api.get<Notification[]>("/api/notifications"),
    refetchInterval: 30000,
  });
  const hasUnread = (notifBadge || []).some(n => !n.isRead);

  return (
    <View style={{ flex: 1, backgroundColor: HUD.bg }} testID="feed-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: HUD.bg }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            {/* Left: system label + title */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: HUD.text3, fontSize: 9, letterSpacing: 3, textTransform: "uppercase", fontWeight: "700", marginBottom: 2 }}>
                ARC REACTOR DATA FEED
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: HUD.accent, shadowColor: HUD.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 }} />
                <Text style={{ fontSize: 20, fontWeight: "800", color: HUD.text, letterSpacing: 4, textTransform: "uppercase" }}>
                  OPTURNA
                </Text>
                <View style={{ backgroundColor: `${HUD.accent}22`, borderWidth: 1, borderColor: HUD.accent, borderRadius: 2, paddingHorizontal: 5, paddingVertical: 1 }}>
                  <Text style={{ color: HUD.accent, fontSize: 8, letterSpacing: 1.5, fontWeight: "700" }}>LIVE</Text>
                </View>
              </View>
            </View>

            {/* Right: action buttons */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <TouchableOpacity
                onPress={() => setShowSearch(true)}
                style={{ padding: 8, borderRadius: 2, borderWidth: 1, borderColor: HUD.border, backgroundColor: HUD.card }}
              >
                <Search size={18} color={HUD.text2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 8, borderRadius: 2, borderWidth: 1, borderColor: hasUnread ? HUD.accent : HUD.border, backgroundColor: hasUnread ? `${HUD.accent}14` : HUD.card, marginLeft: 2 }}
                onPress={() => setShowNotifications(true)}
                testID="bell-button"
              >
                <View>
                  <Bell size={18} color={hasUnread ? HUD.accent : HUD.text2} />
                  {hasUnread ? (
                    <View style={{ position: "absolute", top: -3, right: -3, width: 7, height: 7, borderRadius: 1, backgroundColor: HUD.error, borderWidth: 1, borderColor: HUD.bg }} />
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Scan-line divider */}
          <HudScanLine />
        </View>

        {/* Category filter bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 6, paddingVertical: 10 }}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 5,
                  paddingHorizontal: 12, paddingVertical: 6,
                  borderRadius: 2,
                  backgroundColor: isActive ? `${HUD.accent}22` : HUD.card,
                  borderWidth: 1,
                  borderColor: isActive ? HUD.accent : HUD.border,
                  shadowColor: isActive ? HUD.accent : "transparent",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isActive ? 0.5 : 0,
                  shadowRadius: isActive ? 8 : 0,
                }}
              >
                <Icon size={12} color={isActive ? HUD.accent : HUD.text3} />
                <Text style={{ color: isActive ? HUD.accent : HUD.text3, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" }}>
                  {t(cat.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
          <ActivityIndicator color={HUD.accent} size="large" />
          <Text style={{ color: HUD.text3, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", marginTop: 12, fontWeight: "600" }}>
            LOADING INTEL...
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} currentUserId={session?.user?.id || ""} colors={colors} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={HUD.accent} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          testID="posts-list"
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
              <View style={{ width: 60, height: 60, borderRadius: 4, borderWidth: 1, borderColor: HUD.accentDim, alignItems: "center", justifyContent: "center", marginBottom: 20, backgroundColor: `${HUD.accent}0A` }}>
                <Sparkles size={28} color={HUD.text3} />
              </View>
              <Text style={{ color: HUD.text3, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", fontWeight: "700", marginBottom: 8 }}>
                NO DATA STREAMS
              </Text>
              <Text style={{ color: HUD.text, fontSize: 16, fontWeight: "700", marginBottom: 8, textAlign: "center", letterSpacing: 0.5 }}>
                {t("noFeed")}
              </Text>
              <Text style={{ color: HUD.text3, fontSize: 13, textAlign: "center", lineHeight: 22, letterSpacing: 0.3 }}>
                {t("noFeedDesc")}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowCompose(true)}
        testID="compose-button"
        style={{
          position: "absolute", bottom: 100, right: 16,
          width: 52, height: 52, borderRadius: 4,
          backgroundColor: HUD.error,
          alignItems: "center", justifyContent: "center",
          borderWidth: 1, borderColor: "#FF6B63",
          shadowColor: HUD.error,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 14,
          elevation: 10,
        }}
      >
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: HUD.bg }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: HUD.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: HUD.text3, fontSize: 9, letterSpacing: 3, textTransform: "uppercase", fontWeight: "700", marginBottom: 2 }}>SYSTEM</Text>
              <Text style={{ color: HUD.text, fontSize: 16, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>ALERTS</Text>
            </View>
            <TouchableOpacity
              onPress={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2, backgroundColor: HUD.card, borderWidth: 1, borderColor: HUD.accentDim, marginRight: 10 }}
              testID="mark-all-read-button"
            >
              <Text style={{ color: HUD.accent, fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>CLEAR ALL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              style={{ padding: 6, borderRadius: 2, borderWidth: 1, borderColor: HUD.border, backgroundColor: HUD.card }}
            >
              <X size={18} color={HUD.text2} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={notifications || []}
            keyExtractor={(n) => n.id}
            contentContainerStyle={{ padding: 14 }}
            renderItem={({ item }) => (
              <View
                testID={`notification-${item.id}`}
                style={{
                  flexDirection: "row", alignItems: "flex-start",
                  padding: 12, borderRadius: 2,
                  backgroundColor: item.isRead ? HUD.card : `${HUD.accent}0F`,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: item.isRead ? HUD.border : `${HUD.accent}44`,
                  borderLeftWidth: item.isRead ? 1 : 2,
                  borderLeftColor: item.isRead ? HUD.border : HUD.accent,
                }}
              >
                {!item.isRead ? (
                  <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: HUD.accent, marginTop: 4, marginRight: 10, shadowColor: HUD.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 }} />
                ) : (
                  <View style={{ width: 6, marginRight: 10 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: HUD.text, fontWeight: "700", fontSize: 13, marginBottom: 2, letterSpacing: 0.3 }}>{item.title}</Text>
                  {item.body ? <Text style={{ color: HUD.text3, fontSize: 12, lineHeight: 18, letterSpacing: 0.2 }}>{item.body}</Text> : null}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <View style={{ width: 52, height: 52, borderRadius: 4, borderWidth: 1, borderColor: HUD.accentDim, alignItems: "center", justifyContent: "center", marginBottom: 14, backgroundColor: `${HUD.accent}08` }}>
                  <Bell size={26} color={HUD.text3} />
                </View>
                <Text style={{ color: HUD.text3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: "600" }}>
                  NO INCOMING SIGNALS
                </Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: HUD.bg, padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: HUD.card, borderRadius: 2, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: HUD.accentDim }}>
              <Search size={15} color={HUD.accent} />
              <TextInput
                value={searchQ}
                onChangeText={setSearchQ}
                placeholder={t("searchUsers").toUpperCase()}
                placeholderTextColor={HUD.text3}
                style={{ flex: 1, color: HUD.text, fontSize: 13, paddingVertical: 11, letterSpacing: 1 }}
                autoFocus
              />
            </View>
            <TouchableOpacity
              onPress={() => { setShowSearch(false); setSearchQ(""); }}
              style={{ padding: 8, borderRadius: 2, borderWidth: 1, borderColor: HUD.border, backgroundColor: HUD.card }}
            >
              <X size={18} color={HUD.text2} />
            </TouchableOpacity>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: HUD.text3, fontSize: 9, letterSpacing: 3, textTransform: "uppercase", fontWeight: "700" }}>
              AGENT DIRECTORY
            </Text>
          </View>
          <FlatList
            data={searchResults || []}
            keyExtractor={(u) => u.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { setSelectedUser(item); setShowSearch(false); }}
                testID={`search-result-${item.id}`}
                style={{ flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: HUD.border }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 2, borderWidth: 1.5, borderColor: HUD.accent, marginRight: 12, alignItems: "center", justifyContent: "center", backgroundColor: HUD.accentDim, overflow: "hidden" }}>
                  {item.image ? <Image source={{ uri: item.image }} style={{ width: 40, height: 40 }} /> : (
                    <Text style={{ color: HUD.accent, fontWeight: "700", fontSize: 15 }}>{item.name?.[0]}</Text>
                  )}
                </View>
                <View>
                  <Text style={{ color: HUD.text, fontWeight: "700", fontSize: 14, letterSpacing: 0.5 }}>{item.name}</Text>
                  {item.username ? <Text style={{ color: HUD.text3, fontSize: 11, letterSpacing: 0.5 }}>@{item.username}</Text> : null}
                </View>
              </Pressable>
            )}
          />
        </View>
      </Modal>

      {/* User Profile Modal (from search) */}
      <Modal visible={!!selectedUser} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: HUD.bg }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: HUD.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: HUD.text3, fontSize: 9, letterSpacing: 3, textTransform: "uppercase", fontWeight: "700", marginBottom: 2 }}>AGENT</Text>
              <Text style={{ color: HUD.text, fontSize: 16, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>PROFILE</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedUser(null)}
              style={{ padding: 8, borderRadius: 2, borderWidth: 1, borderColor: HUD.border, backgroundColor: HUD.card }}
            >
              <X size={18} color={HUD.text2} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {selectedUserProfile ? (
              <>
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  {/* Avatar with HUD ring */}
                  <View style={{ position: "relative", marginBottom: 14 }}>
                    <View style={{ width: 84, height: 84, borderRadius: 4, borderWidth: 2, borderColor: HUD.accent, alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: HUD.accentDim, shadowColor: HUD.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10 }}>
                      {selectedUserProfile.image
                        ? <Image source={{ uri: selectedUserProfile.image }} style={{ width: 84, height: 84 }} />
                        : <Text style={{ color: HUD.accent, fontWeight: "800", fontSize: 32 }}>{selectedUserProfile.name?.[0]?.toUpperCase()}</Text>
                      }
                    </View>
                    {/* Corner accents */}
                    <View style={{ position: "absolute", top: -3, left: -3, width: 10, height: 10, borderTopWidth: 2, borderLeftWidth: 2, borderColor: HUD.accent }} />
                    <View style={{ position: "absolute", top: -3, right: -3, width: 10, height: 10, borderTopWidth: 2, borderRightWidth: 2, borderColor: HUD.accent }} />
                    <View style={{ position: "absolute", bottom: -3, left: -3, width: 10, height: 10, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: HUD.accent }} />
                    <View style={{ position: "absolute", bottom: -3, right: -3, width: 10, height: 10, borderBottomWidth: 2, borderRightWidth: 2, borderColor: HUD.accent }} />
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Text style={{ color: HUD.text, fontWeight: "800", fontSize: 18, letterSpacing: 1 }}>{selectedUserProfile.name}</Text>
                    {selectedUserProfile.isVerified ? <CheckCircle size={14} color={HUD.accent} fill={HUD.accent} /> : null}
                  </View>
                  {selectedUserProfile.username ? (
                    <Text style={{ color: HUD.text3, fontSize: 12, marginBottom: 8, letterSpacing: 1 }}>@{selectedUserProfile.username}</Text>
                  ) : null}
                  {selectedUserProfile.bio ? (
                    <Text style={{ color: HUD.text2, fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 16, letterSpacing: 0.2 }}>{selectedUserProfile.bio}</Text>
                  ) : null}

                  {/* Stats */}
                  <View style={{ flexDirection: "row", gap: 1, marginBottom: 20, borderWidth: 1, borderColor: HUD.border, borderRadius: 2, overflow: "hidden" }}>
                    {[
                      { label: "FOLLOWERS", value: selectedUserProfile._count?.followers ?? 0 },
                      { label: "FOLLOWING", value: selectedUserProfile._count?.following ?? 0 },
                      { label: "POSTS", value: selectedUserProfile._count?.posts ?? 0 },
                    ].map((stat, i) => (
                      <View key={stat.label} style={{ flex: 1, alignItems: "center", paddingVertical: 12, backgroundColor: HUD.card, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: HUD.border }}>
                        <Text style={{ color: HUD.accent, fontWeight: "800", fontSize: 18, fontVariant: ["tabular-nums"] }}>{stat.value}</Text>
                        <Text style={{ color: HUD.text3, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2, fontWeight: "600" }}>{stat.label}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() => followMutation.mutate(selectedUserProfile.id)}
                    disabled={followMutation.isPending}
                    testID="follow-button"
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 8,
                      backgroundColor: `${HUD.accent}22`,
                      paddingHorizontal: 28, paddingVertical: 12,
                      borderRadius: 2,
                      borderWidth: 1, borderColor: HUD.accent,
                      shadowColor: HUD.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10,
                    }}
                  >
                    {followMutation.isPending
                      ? <ActivityIndicator color={HUD.accent} size="small" />
                      : (
                        <>
                          <UserPlus size={15} color={HUD.accent} />
                          <Text style={{ color: HUD.accent, fontWeight: "700", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>FOLLOW</Text>
                        </>
                      )
                    }
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <ActivityIndicator color={HUD.accent} />
                <Text style={{ color: HUD.text3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginTop: 10, fontWeight: "600" }}>
                  LOADING AGENT DATA...
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: HUD.bg }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: HUD.border }}>
            <TouchableOpacity
              onPress={() => { setShowCompose(false); setPickedMedia(null); }}
              style={{ marginRight: 14, padding: 6, borderRadius: 2, borderWidth: 1, borderColor: HUD.border, backgroundColor: HUD.card }}
            >
              <X size={16} color={HUD.text2} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: HUD.text3, fontSize: 9, letterSpacing: 3, textTransform: "uppercase", fontWeight: "700", marginBottom: 1 }}>TRANSMIT</Text>
              <Text style={{ color: HUD.text, fontSize: 14, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>{t("newPost")}</Text>
            </View>
            <TouchableOpacity
              onPress={() => createPost.mutate()}
              disabled={!newPost.content.trim() || createPost.isPending || uploadingMedia}
              testID="submit-post-button"
              style={{
                backgroundColor: !newPost.content.trim() || createPost.isPending ? HUD.card : `${HUD.accent}22`,
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 2,
                borderWidth: 1,
                borderColor: !newPost.content.trim() || createPost.isPending ? HUD.border : HUD.accent,
                opacity: !newPost.content.trim() || createPost.isPending ? 0.5 : 1,
                shadowColor: HUD.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: newPost.content.trim() ? 0.4 : 0,
                shadowRadius: 8,
              }}
            >
              {createPost.isPending || uploadingMedia ? <ActivityIndicator color={HUD.accent} size="small" /> : (
                <Text style={{ color: HUD.accent, fontWeight: "700", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>{t("post")}</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {/* Author row */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <View style={{ width: 40, height: 40, borderRadius: 2, borderWidth: 1.5, borderColor: HUD.accent, alignItems: "center", justifyContent: "center", backgroundColor: HUD.accentDim }}>
                <Text style={{ color: HUD.accent, fontWeight: "700", fontSize: 16 }}>{session?.user?.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View>
                <Text style={{ color: HUD.text, fontWeight: "700", fontSize: 14, letterSpacing: 0.5 }}>{session?.user?.name}</Text>
                <Text style={{ color: HUD.text3, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>{t("sharingWith")}</Text>
              </View>
            </View>

            <TextInput
              value={newPost.content}
              onChangeText={(text) => setNewPost(p => ({ ...p, content: text }))}
              placeholder={t("shareSomething")}
              placeholderTextColor={HUD.text3}
              multiline
              testID="post-content-input"
              style={{ color: HUD.text, fontSize: 15, lineHeight: 24, minHeight: 120, marginBottom: 16, letterSpacing: 0.3 }}
              autoFocus
            />

            <HudScanLine />

            {/* Media picker */}
            <View style={{ marginVertical: 18 }}>
              {pickedMedia ? (
                <View style={{ borderRadius: 4, overflow: "hidden", marginBottom: 10, position: "relative", borderWidth: 1, borderColor: HUD.accentDim }}>
                  <Image source={{ uri: pickedMedia.uri }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => setPickedMedia(null)}
                    style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 2, backgroundColor: "rgba(2,11,24,0.85)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: HUD.error }}
                  >
                    <X size={12} color={HUD.error} />
                  </TouchableOpacity>
                </View>
              ) : null}
              <TouchableOpacity
                onPress={pickMedia}
                testID="pick-media-button"
                style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 2, backgroundColor: HUD.card, borderWidth: 1, borderColor: HUD.border, alignSelf: "flex-start" }}
              >
                <ImageIcon size={14} color={HUD.text3} />
                <Text style={{ color: HUD.text3, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>
                  {pickedMedia ? "CHANGE MEDIA" : "ATTACH MEDIA"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: HUD.text3, fontSize: 9, fontWeight: "700", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
              CLASSIFY // {t("category")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 24 }}>
              {CATEGORIES.filter(c => c.id !== "all").map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setNewPost(p => ({ ...p, category: cat.id }))}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 2,
                    backgroundColor: newPost.category === cat.id ? `${HUD.accent}22` : HUD.card,
                    borderWidth: 1,
                    borderColor: newPost.category === cat.id ? HUD.accent : HUD.border,
                    shadowColor: newPost.category === cat.id ? HUD.accent : "transparent",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: newPost.category === cat.id ? 0.4 : 0,
                    shadowRadius: 6,
                  }}
                >
                  <Text style={{ color: newPost.category === cat.id ? HUD.accent : HUD.text3, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>
                    {t(cat.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: HUD.text3, fontSize: 9, fontWeight: "700", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
              TAG PROTOCOLS // {t("hashtags")}
            </Text>
            <TextInput
              value={newPost.hashtags}
              onChangeText={(text) => setNewPost(p => ({ ...p, hashtags: text }))}
              placeholder="productivity, mindset, negocios"
              placeholderTextColor={HUD.text3}
              testID="hashtags-input"
              style={{ backgroundColor: HUD.card, borderRadius: 2, paddingHorizontal: 12, paddingVertical: 11, color: HUD.text, fontSize: 13, letterSpacing: 0.5, borderWidth: 1, borderColor: HUD.border }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
