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

// Dark iOS Premium palette
const P = {
  bg: "#080D1A",
  card: "#0D1526",
  cardElevated: "#121A2E",
  accent: "#00B4D8",
  accentSoft: "rgba(0, 180, 216, 0.12)",
  accentMid: "rgba(0, 180, 216, 0.22)",
  text: "#EDF2F7",
  text2: "#94A3B8",
  text3: "#4A5C72",
  border: "rgba(255,255,255,0.06)",
  borderAccent: "rgba(0, 180, 216, 0.3)",
  error: "#FF453A",
  success: "#30D158",
  warning: "#FFD60A",
  purple: "#BF5AF2",
};

const REACTION_TYPES = [
  { id: "useful", emoji: "💡" },
  { id: "inspired", emoji: "🔥" },
  { id: "good_progress", emoji: "🎯" },
  { id: "interesting", emoji: "✨" },
];

const categoryColors: Record<string, string> = {
  progress: P.success,
  learning: P.accent,
  question: P.purple,
  inspiration: P.warning,
};

function Avatar({ uri, name, size = 38, radius = 50 }: { uri?: string | null; name?: string | null; size?: number; radius?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: P.accentSoft,
        borderWidth: 1.5,
        borderColor: P.borderAccent,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ color: P.accent, fontWeight: "700", fontSize: size * 0.38 }}>
          {name?.[0]?.toUpperCase() ?? "?"}
        </Text>
      )}
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: P.border, marginVertical: 12 }} />;
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

  const catColor = categoryColors[post.category] || P.accent;
  const catLabel = post.category
    ? post.category.charAt(0).toUpperCase() + post.category.slice(1)
    : "Post";

  const mediaUrls: string[] = (() => {
    try { return post.mediaUrls ? JSON.parse(post.mediaUrls) : []; } catch { return []; }
  })();

  return (
    <Animated.View entering={FadeInDown.duration(280).springify()}>
      <View
        style={{
          backgroundColor: P.card,
          borderRadius: 20,
          marginHorizontal: 16,
          marginBottom: 12,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: P.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
        }}
        testID="post-card"
      >
        <View style={{ padding: 16 }}>
          {/* Author row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Avatar uri={post.author?.image} name={post.author?.name} size={40} radius={50} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text style={{ color: P.text, fontWeight: "600", fontSize: 14, letterSpacing: 0.1 }}>
                  {post.author?.name}
                </Text>
                {post.author?.isVerified ? (
                  <CheckCircle size={13} color={P.accent} fill={P.accent} />
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: catColor }} />
                <Text style={{ color: P.text3, fontSize: 12, fontWeight: "500" }}>{catLabel}</Text>
              </View>
            </View>
            {isMyPost ? (
              <TouchableOpacity onPress={handleMorePress} testID="more-options-button" style={{ padding: 6 }}>
                <MoreHorizontal size={17} color={P.text3} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 29 }} />
            )}
          </View>

          {/* Content */}
          {post.content ? (
            <Text style={{ color: P.text2, fontSize: 15, lineHeight: 23, marginBottom: 12 }}>
              {post.content}
            </Text>
          ) : null}

          {/* Media */}
          {mediaUrls.length > 0 ? (
            <View style={{ marginBottom: 12, borderRadius: 12, overflow: "hidden" }}>
              <Image source={{ uri: mediaUrls[0] }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
            </View>
          ) : null}

          {/* Hashtags */}
          {post.hashtags ? (() => {
            try {
              const tags: string[] = JSON.parse(post.hashtags);
              return (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {tags.map((tag) => (
                    <Text key={tag} style={{ color: P.accent, fontSize: 13, fontWeight: "500" }}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              );
            } catch { return null; }
          })() : null}

          <Divider />

          {/* Actions row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <TouchableOpacity
              onPress={() => setShowReactions(!showReactions)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 100,
                backgroundColor: myReaction ? P.accentMid : P.cardElevated,
                borderWidth: 1,
                borderColor: myReaction ? P.borderAccent : P.border,
              }}
              testID="react-button"
            >
              <Text style={{ fontSize: 14 }}>
                {myReaction ? REACTION_TYPES.find(r => r.id === myReaction.type)?.emoji || "💡" : "💡"}
              </Text>
              <Text style={{ color: myReaction ? P.accent : P.text3, fontSize: 13, fontWeight: "500" }}>
                {post._count?.reactions || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowComments(!showComments)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 100,
                backgroundColor: showComments ? P.accentMid : P.cardElevated,
                borderWidth: 1,
                borderColor: showComments ? P.borderAccent : P.border,
              }}
              testID="comment-button"
            >
              <MessageCircle size={14} color={showComments ? P.accent : P.text3} />
              <Text style={{ color: showComments ? P.accent : P.text3, fontSize: 13, fontWeight: "500" }}>
                {post._count?.comments || 0}
              </Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              onPress={() => saveMutation.mutate()}
              style={{
                width: 34,
                height: 34,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: P.cardElevated,
                borderWidth: 1,
                borderColor: P.border,
              }}
              testID="save-button"
            >
              <Bookmark size={14} color={P.text3} />
            </TouchableOpacity>
          </View>

          {/* Reaction picker */}
          {showReactions ? (
            <Animated.View entering={FadeIn.duration(150)} style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {REACTION_TYPES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => { reactMutation.mutate(r.id); setShowReactions(false); }}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 100,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: myReaction?.type === r.id ? P.accentMid : P.cardElevated,
                    borderWidth: 1,
                    borderColor: myReaction?.type === r.id ? P.borderAccent : P.border,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{r.emoji}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          ) : null}

          {/* Comments */}
          {showComments ? (
            <View style={{ marginTop: 14 }}>
              {(comments || []).map((c: any) => (
                <View key={c.id} style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                  <Avatar uri={c.author?.image} name={c.author?.name} size={28} radius={50} />
                  <View style={{ flex: 1, backgroundColor: P.cardElevated, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: P.border }}>
                    <Text style={{ color: P.text2, fontSize: 12, fontWeight: "600", marginBottom: 3 }}>{c.author?.name}</Text>
                    <Text style={{ color: P.text2, fontSize: 13, lineHeight: 18 }}>{c.content}</Text>
                  </View>
                </View>
              ))}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4, alignItems: "center" }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor={P.text3}
                  style={{
                    flex: 1,
                    backgroundColor: P.cardElevated,
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    color: P.text,
                    fontSize: 13,
                    borderWidth: 1,
                    borderColor: P.border,
                  }}
                />
                <TouchableOpacity
                  onPress={() => commentMutation.mutate()}
                  disabled={!commentText.trim()}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 100,
                    backgroundColor: commentText.trim() ? P.accent : P.cardElevated,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: commentText.trim() ? P.accent : P.border,
                  }}
                >
                  <Send size={14} color={commentText.trim() ? "#fff" : P.text3} />
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

  const { data: notifBadge } = useQuery({
    queryKey: ["notifications-badge"],
    queryFn: () => api.get<Notification[]>("/api/notifications"),
    refetchInterval: 30000,
  });
  const hasUnread = (notifBadge || []).some(n => !n.isRead);

  return (
    <View style={{ flex: 1, backgroundColor: P.bg }} testID="feed-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: P.bg }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            {/* Wordmark */}
            <Text style={{ flex: 1, fontSize: 24, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 }}>
              OPTURNA
            </Text>

            {/* Right icon buttons */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <TouchableOpacity
                onPress={() => setShowSearch(true)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 100,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: P.card,
                  borderWidth: 1,
                  borderColor: P.border,
                }}
              >
                <Search size={17} color={P.text2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 100,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: hasUnread ? P.accentSoft : P.card,
                  borderWidth: 1,
                  borderColor: hasUnread ? P.borderAccent : P.border,
                }}
                onPress={() => setShowNotifications(true)}
                testID="bell-button"
              >
                <View>
                  <Bell size={17} color={hasUnread ? P.accent : P.text2} />
                  {hasUnread ? (
                    <View style={{
                      position: "absolute",
                      top: -3,
                      right: -3,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: P.error,
                      borderWidth: 1.5,
                      borderColor: P.bg,
                    }} />
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Category filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: isActive ? P.accentMid : P.card,
                  borderWidth: 1,
                  borderColor: isActive ? P.borderAccent : P.border,
                }}
              >
                <Icon size={13} color={isActive ? P.accent : P.text3} />
                <Text style={{
                  color: isActive ? P.accent : P.text3,
                  fontSize: 13,
                  fontWeight: isActive ? "600" : "400",
                }}>
                  {t(cat.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
          <ActivityIndicator color={P.accent} size="large" />
          <Text style={{ color: P.text3, fontSize: 13, marginTop: 14, fontWeight: "400" }}>
            Loading your feed...
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} currentUserId={session?.user?.id || ""} colors={colors} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={P.accent} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          testID="posts-list"
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: P.card,
                borderWidth: 1,
                borderColor: P.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}>
                <Sparkles size={28} color={P.text3} />
              </View>
              <Text style={{ color: P.text, fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>
                {t("noFeed")}
              </Text>
              <Text style={{ color: P.text3, fontSize: 14, textAlign: "center", lineHeight: 22 }}>
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
          position: "absolute",
          bottom: 104,
          right: 18,
          width: 52,
          height: 52,
          borderRadius: 100,
          backgroundColor: P.accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: P.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: P.bg }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: P.border,
          }}>
            <Text style={{ flex: 1, color: P.text, fontSize: 20, fontWeight: "700" }}>Notifications</Text>
            <TouchableOpacity
              onPress={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 100,
                backgroundColor: P.card,
                borderWidth: 1,
                borderColor: P.border,
                marginRight: 10,
              }}
              testID="mark-all-read-button"
            >
              <Text style={{ color: P.accent, fontSize: 13, fontWeight: "500" }}>Mark all read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: P.card,
                borderWidth: 1,
                borderColor: P.border,
              }}
            >
              <X size={16} color={P.text2} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={notifications || []}
            keyExtractor={(n) => n.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View
                testID={`notification-${item.id}`}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: item.isRead ? P.card : "rgba(0,180,216,0.07)",
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: item.isRead ? P.border : P.borderAccent,
                }}
              >
                {!item.isRead ? (
                  <View style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: P.accent,
                    marginTop: 5,
                    marginRight: 10,
                  }} />
                ) : (
                  <View style={{ width: 7, marginRight: 10 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: P.text, fontWeight: "600", fontSize: 14, marginBottom: 3 }}>{item.title}</Text>
                  {item.body ? <Text style={{ color: P.text3, fontSize: 13, lineHeight: 19 }}>{item.body}</Text> : null}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: P.card,
                  borderWidth: 1,
                  borderColor: P.border,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}>
                  <Bell size={26} color={P.text3} />
                </View>
                <Text style={{ color: P.text2, fontSize: 16, fontWeight: "600", marginBottom: 6 }}>All caught up</Text>
                <Text style={{ color: P.text3, fontSize: 13 }}>No new notifications</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: P.bg, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20, marginTop: 8 }}>
            <View style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: P.card,
              borderRadius: 14,
              paddingHorizontal: 12,
              gap: 8,
              borderWidth: 1,
              borderColor: P.border,
            }}>
              <Search size={15} color={P.text3} />
              <TextInput
                value={searchQ}
                onChangeText={setSearchQ}
                placeholder={t("searchUsers")}
                placeholderTextColor={P.text3}
                style={{ flex: 1, color: P.text, fontSize: 15, paddingVertical: 12 }}
                autoFocus
              />
            </View>
            <TouchableOpacity
              onPress={() => { setShowSearch(false); setSearchQ(""); }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: P.card,
                borderWidth: 1,
                borderColor: P.border,
              }}
            >
              <X size={16} color={P.text2} />
            </TouchableOpacity>
          </View>
          {searchQ.length < 2 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: P.text3, fontSize: 14 }}>Start typing to find people</Text>
            </View>
          ) : null}
          <FlatList
            data={searchResults || []}
            keyExtractor={(u) => u.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { setSelectedUser(item); setShowSearch(false); }}
                testID={`search-result-${item.id}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: P.card,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: P.border,
                }}
              >
                <Avatar uri={item.image} name={item.name} size={44} radius={50} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: P.text, fontWeight: "600", fontSize: 15 }}>{item.name}</Text>
                  {item.username ? (
                    <Text style={{ color: P.text3, fontSize: 13, marginTop: 1 }}>@{item.username}</Text>
                  ) : null}
                </View>
              </Pressable>
            )}
          />
        </View>
      </Modal>

      {/* User Profile Modal */}
      <Modal visible={!!selectedUser} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: P.bg }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: P.border,
          }}>
            <Text style={{ flex: 1, color: P.text, fontSize: 20, fontWeight: "700" }}>Profile</Text>
            <TouchableOpacity
              onPress={() => setSelectedUser(null)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: P.card,
                borderWidth: 1,
                borderColor: P.border,
              }}
            >
              <X size={16} color={P.text2} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            {selectedUserProfile ? (
              <>
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                  <Avatar
                    uri={selectedUserProfile.image}
                    name={selectedUserProfile.name}
                    size={86}
                    radius={50}
                  />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 4 }}>
                    <Text style={{ color: P.text, fontWeight: "700", fontSize: 20 }}>{selectedUserProfile.name}</Text>
                    {selectedUserProfile.isVerified ? (
                      <CheckCircle size={15} color={P.accent} fill={P.accent} />
                    ) : null}
                  </View>
                  {selectedUserProfile.username ? (
                    <Text style={{ color: P.text3, fontSize: 14, marginBottom: 10 }}>@{selectedUserProfile.username}</Text>
                  ) : null}
                  {selectedUserProfile.bio ? (
                    <Text style={{ color: P.text2, fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20 }}>
                      {selectedUserProfile.bio}
                    </Text>
                  ) : null}

                  {/* Stats */}
                  <View style={{
                    flexDirection: "row",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: P.border,
                    overflow: "hidden",
                    backgroundColor: P.card,
                    marginBottom: 24,
                    width: "100%",
                  }}>
                    {[
                      { label: "Followers", value: selectedUserProfile._count?.followers ?? 0 },
                      { label: "Following", value: selectedUserProfile._count?.following ?? 0 },
                      { label: "Posts", value: selectedUserProfile._count?.posts ?? 0 },
                    ].map((stat, i) => (
                      <View
                        key={stat.label}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          paddingVertical: 14,
                          borderRightWidth: i < 2 ? 1 : 0,
                          borderRightColor: P.border,
                        }}
                      >
                        <Text style={{ color: P.text, fontWeight: "700", fontSize: 20 }}>{stat.value}</Text>
                        <Text style={{ color: P.text3, fontSize: 11, marginTop: 2, fontWeight: "500" }}>{stat.label}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() => followMutation.mutate(selectedUserProfile.id)}
                    disabled={followMutation.isPending}
                    testID="follow-button"
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      backgroundColor: P.accent,
                      paddingHorizontal: 32,
                      paddingVertical: 13,
                      borderRadius: 100,
                    }}
                  >
                    {followMutation.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <UserPlus size={15} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Follow</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <ActivityIndicator color={P.accent} />
                <Text style={{ color: P.text3, fontSize: 13, marginTop: 12 }}>Loading profile...</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: P.bg }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: P.border,
          }}>
            <TouchableOpacity
              onPress={() => { setShowCompose(false); setPickedMedia(null); }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: P.card,
                borderWidth: 1,
                borderColor: P.border,
                marginRight: 14,
              }}
            >
              <X size={16} color={P.text2} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: P.text, fontSize: 17, fontWeight: "700" }}>{t("newPost")}</Text>
            <TouchableOpacity
              onPress={() => createPost.mutate()}
              disabled={!newPost.content.trim() || createPost.isPending || uploadingMedia}
              testID="submit-post-button"
              style={{
                backgroundColor: !newPost.content.trim() || createPost.isPending ? P.card : P.accent,
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: 100,
                opacity: !newPost.content.trim() ? 0.5 : 1,
              }}
            >
              {createPost.isPending || uploadingMedia ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{
                  color: !newPost.content.trim() ? P.text3 : "#fff",
                  fontWeight: "600",
                  fontSize: 14,
                }}>
                  {t("post")}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {/* Author row */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Avatar uri={null} name={session?.user?.name} size={42} radius={50} />
              <View>
                <Text style={{ color: P.text, fontWeight: "600", fontSize: 15 }}>{session?.user?.name}</Text>
                <Text style={{ color: P.text3, fontSize: 12, marginTop: 1 }}>{t("sharingWith")}</Text>
              </View>
            </View>

            <TextInput
              value={newPost.content}
              onChangeText={(text) => setNewPost(p => ({ ...p, content: text }))}
              placeholder={t("shareSomething")}
              placeholderTextColor={P.text3}
              multiline
              testID="post-content-input"
              style={{
                color: P.text,
                fontSize: 16,
                lineHeight: 25,
                minHeight: 120,
                marginBottom: 16,
              }}
              autoFocus
            />

            <Divider />

            {/* Media */}
            <View style={{ marginVertical: 16 }}>
              {pickedMedia ? (
                <View style={{ borderRadius: 14, overflow: "hidden", marginBottom: 12, position: "relative" }}>
                  <Image source={{ uri: pickedMedia.uri }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => setPickedMedia(null)}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 28,
                      height: 28,
                      borderRadius: 100,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={13} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : null}
              <TouchableOpacity
                onPress={pickMedia}
                testID="pick-media-button"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 100,
                  backgroundColor: P.card,
                  borderWidth: 1,
                  borderColor: P.border,
                  alignSelf: "flex-start",
                }}
              >
                <ImageIcon size={14} color={P.text3} />
                <Text style={{ color: P.text3, fontSize: 13, fontWeight: "500" }}>
                  {pickedMedia ? "Change media" : "Add media"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: P.text3, fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
              {t("category")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {CATEGORIES.filter(c => c.id !== "all").map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setNewPost(p => ({ ...p, category: cat.id }))}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 100,
                    backgroundColor: newPost.category === cat.id ? P.accentMid : P.card,
                    borderWidth: 1,
                    borderColor: newPost.category === cat.id ? P.borderAccent : P.border,
                  }}
                >
                  <Text style={{
                    color: newPost.category === cat.id ? P.accent : P.text3,
                    fontSize: 13,
                    fontWeight: newPost.category === cat.id ? "600" : "400",
                  }}>
                    {t(cat.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: P.text3, fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
              {t("hashtags")}
            </Text>
            <TextInput
              value={newPost.hashtags}
              onChangeText={(text) => setNewPost(p => ({ ...p, hashtags: text }))}
              placeholder="productivity, mindset, negocios"
              placeholderTextColor={P.text3}
              testID="hashtags-input"
              style={{
                backgroundColor: P.card,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: P.text,
                fontSize: 14,
                borderWidth: 1,
                borderColor: P.border,
              }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
