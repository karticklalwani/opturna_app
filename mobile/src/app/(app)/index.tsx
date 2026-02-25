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
  MoreHorizontal, CheckCircle, Send, ImageIcon, UserPlus, FileText,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import * as ImagePicker from "expo-image-picker";
import { uploadFile } from "@/lib/upload";
import { pickPdf } from "@/lib/file-picker";

const REACTION_TYPES = [
  { id: "useful", emoji: "💡" },
  { id: "inspired", emoji: "🔥" },
  { id: "good_progress", emoji: "🎯" },
  { id: "interesting", emoji: "✨" },
];

const CATEGORY_COLORS_KEYS = {
  progress: "success",
  learning: "accent",
  question: "accent3",
  inspiration: "accent3",
} as const;

function Avatar({ uri, name, size = 38, radius = 50, colors }: { uri?: string | null; name?: string | null; size?: number; radius?: number; colors: any }) {
  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: accentSoft,
        borderWidth: 1.5,
        borderColor: accentBorder,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ color: colors.accent, fontWeight: "700", fontSize: size * 0.38 }}>
          {name?.[0]?.toUpperCase() ?? "?"}
        </Text>
      )}
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />;
}

function PostCard({ post, currentUserId, colors }: { post: Post; currentUserId: string; colors: any }) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const myReaction = post.reactions?.[0];
  const isMyPost = post.author?.id === currentUserId;

  const accentSoft = `${colors.accent}1F`;
  const accentMid = `${colors.accent}38`;
  const accentBorder = `${colors.accent}4D`;
  const cardElevated = colors.bg3 || colors.bg2;

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

  const catColor = CATEGORY_COLORS_KEYS[post.category as keyof typeof CATEGORY_COLORS_KEYS]
    ? colors[CATEGORY_COLORS_KEYS[post.category as keyof typeof CATEGORY_COLORS_KEYS]]
    : colors.accent;
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
          backgroundColor: colors.card,
          borderRadius: 20,
          marginHorizontal: 16,
          marginBottom: 12,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
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
            <Avatar uri={post.author?.image} name={post.author?.name} size={40} radius={50} colors={colors} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14, letterSpacing: 0.1 }}>
                  {post.author?.name}
                </Text>
                {post.author?.isVerified ? (
                  <CheckCircle size={13} color={colors.accent} fill={colors.accent} />
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: catColor }} />
                <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "500" }}>{catLabel}</Text>
              </View>
            </View>
            {isMyPost ? (
              <TouchableOpacity onPress={handleMorePress} testID="more-options-button" style={{ padding: 6 }}>
                <MoreHorizontal size={17} color={colors.text3} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 29 }} />
            )}
          </View>

          {/* Content */}
          {post.content ? (
            <Text style={{ color: colors.text2, fontSize: 15, lineHeight: 23, marginBottom: 12 }}>
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
                    <Text key={tag} style={{ color: colors.accent, fontSize: 13, fontWeight: "500" }}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              );
            } catch { return null; }
          })() : null}

          <Divider colors={colors} />

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
                backgroundColor: myReaction ? accentMid : cardElevated,
                borderWidth: 1,
                borderColor: myReaction ? accentBorder : colors.border,
              }}
              testID="react-button"
            >
              <Text style={{ fontSize: 14 }}>
                {myReaction ? REACTION_TYPES.find(r => r.id === myReaction.type)?.emoji || "💡" : "💡"}
              </Text>
              <Text style={{ color: myReaction ? colors.accent : colors.text3, fontSize: 13, fontWeight: "500" }}>
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
                backgroundColor: showComments ? accentMid : cardElevated,
                borderWidth: 1,
                borderColor: showComments ? accentBorder : colors.border,
              }}
              testID="comment-button"
            >
              <MessageCircle size={14} color={showComments ? colors.accent : colors.text3} />
              <Text style={{ color: showComments ? colors.accent : colors.text3, fontSize: 13, fontWeight: "500" }}>
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
                backgroundColor: cardElevated,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              testID="save-button"
            >
              <Bookmark size={14} color={colors.text3} />
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
                    backgroundColor: myReaction?.type === r.id ? accentMid : cardElevated,
                    borderWidth: 1,
                    borderColor: myReaction?.type === r.id ? accentBorder : colors.border,
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
                  <Avatar uri={c.author?.image} name={c.author?.name} size={28} radius={50} colors={colors} />
                  <View style={{ flex: 1, backgroundColor: cardElevated, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.text2, fontSize: 12, fontWeight: "600", marginBottom: 3 }}>{c.author?.name}</Text>
                    <Text style={{ color: colors.text2, fontSize: 13, lineHeight: 18 }}>{c.content}</Text>
                  </View>
                </View>
              ))}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4, alignItems: "center" }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder={t("addComment")}
                  placeholderTextColor={colors.text3}
                  style={{
                    flex: 1,
                    backgroundColor: cardElevated,
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    color: colors.text,
                    fontSize: 13,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
                <TouchableOpacity
                  onPress={() => commentMutation.mutate()}
                  disabled={!commentText.trim()}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 100,
                    backgroundColor: commentText.trim() ? colors.accent : cardElevated,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: commentText.trim() ? colors.accent : colors.border,
                  }}
                >
                  <Send size={14} color={commentText.trim() ? "#fff" : colors.text3} />
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

  const accentSoft = `${colors.accent}1F`;
  const accentMid = `${colors.accent}38`;
  const accentBorder = `${colors.accent}4D`;

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

  const isDocumentMedia = pickedMedia && !pickedMedia.mimeType.startsWith("image/") && !pickedMedia.mimeType.startsWith("video/");

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
      const postType = mediaUrls.length > 0
        ? (isDocumentMedia ? "document" : "media")
        : "text";
      return api.post("/api/posts", {
        content: newPost.content,
        category: newPost.category,
        hashtags: newPost.hashtags ? newPost.hashtags.split(",").map((tag: string) => tag.trim()).filter(Boolean) : [],
        type: postType,
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

  const handlePickPdf = async () => {
    const picked = await pickPdf();
    if (picked) {
      setPickedMedia({ uri: picked.uri, mimeType: picked.mimeType, fileName: picked.filename });
    }
  };

  const { data: notifBadge } = useQuery({
    queryKey: ["notifications-badge"],
    queryFn: () => api.get<Notification[]>("/api/notifications"),
    refetchInterval: 30000,
  });
  const hasUnread = (notifBadge || []).some(n => !n.isRead);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="feed-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            {/* Wordmark */}
            <Text style={{ flex: 1, fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
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
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Search size={17} color={colors.text2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 100,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: hasUnread ? accentSoft : colors.card,
                  borderWidth: 1,
                  borderColor: hasUnread ? accentBorder : colors.border,
                }}
                onPress={() => setShowNotifications(true)}
                testID="bell-button"
              >
                <View>
                  <Bell size={17} color={hasUnread ? colors.accent : colors.text2} />
                  {hasUnread ? (
                    <View style={{
                      position: "absolute",
                      top: -3,
                      right: -3,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.error,
                      borderWidth: 1.5,
                      borderColor: colors.bg,
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
                  backgroundColor: isActive ? accentMid : colors.card,
                  borderWidth: 1,
                  borderColor: isActive ? accentBorder : colors.border,
                }}
              >
                <Icon size={13} color={isActive ? colors.accent : colors.text3} />
                <Text style={{
                  color: isActive ? colors.accent : colors.text3,
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
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={{ color: colors.text3, fontSize: 13, marginTop: 14, fontWeight: "400" }}>
            {t("loadingFeed")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} currentUserId={session?.user?.id || ""} colors={colors} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          testID="posts-list"
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}>
                <Sparkles size={28} color={colors.text3} />
              </View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>
                {t("noFeed")}
              </Text>
              <Text style={{ color: colors.text3, fontSize: 14, textAlign: "center", lineHeight: 22 }}>
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
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.accent,
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
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <Text style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: "700" }}>{t("notifications")}</Text>
            <TouchableOpacity
              onPress={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 100,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                marginRight: 10,
              }}
              testID="mark-all-read-button"
            >
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "500" }}>{t("markAllRead")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <X size={16} color={colors.text2} />
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
                  backgroundColor: item.isRead ? colors.card : accentSoft,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: item.isRead ? colors.border : accentBorder,
                }}
              >
                {!item.isRead ? (
                  <View style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: colors.accent,
                    marginTop: 5,
                    marginRight: 10,
                  }} />
                ) : (
                  <View style={{ width: 7, marginRight: 10 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14, marginBottom: 3 }}>{item.title}</Text>
                  {item.body ? <Text style={{ color: colors.text3, fontSize: 13, lineHeight: 19 }}>{item.body}</Text> : null}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}>
                  <Bell size={26} color={colors.text3} />
                </View>
                <Text style={{ color: colors.text2, fontSize: 16, fontWeight: "600", marginBottom: 6 }}>{t("allCaughtUp")}</Text>
                <Text style={{ color: colors.text3, fontSize: 13 }}>{t("noNewNotifs")}</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20, marginTop: 8 }}>
            <View style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderRadius: 14,
              paddingHorizontal: 12,
              gap: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Search size={15} color={colors.text3} />
              <TextInput
                value={searchQ}
                onChangeText={setSearchQ}
                placeholder={t("searchUsers")}
                placeholderTextColor={colors.text3}
                style={{ flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 }}
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
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <X size={16} color={colors.text2} />
            </TouchableOpacity>
          </View>
          {searchQ.length < 2 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: colors.text3, fontSize: 14 }}>{t("startTyping")}</Text>
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
                  backgroundColor: colors.card,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Avatar uri={item.image} name={item.name} size={44} radius={50} colors={colors} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>{item.name}</Text>
                  {item.username ? (
                    <Text style={{ color: colors.text3, fontSize: 13, marginTop: 1 }}>@{item.username}</Text>
                  ) : null}
                </View>
              </Pressable>
            )}
          />
        </View>
      </Modal>

      {/* User Profile Modal */}
      <Modal visible={!!selectedUser} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <Text style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: "700" }}>{t("profileTitle")}</Text>
            <TouchableOpacity
              onPress={() => setSelectedUser(null)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <X size={16} color={colors.text2} />
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
                    colors={colors}
                  />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 4 }}>
                    <Text style={{ color: colors.text, fontWeight: "700", fontSize: 20 }}>{selectedUserProfile.name}</Text>
                    {selectedUserProfile.isVerified ? (
                      <CheckCircle size={15} color={colors.accent} fill={colors.accent} />
                    ) : null}
                  </View>
                  {selectedUserProfile.username ? (
                    <Text style={{ color: colors.text3, fontSize: 14, marginBottom: 10 }}>@{selectedUserProfile.username}</Text>
                  ) : null}
                  {selectedUserProfile.bio ? (
                    <Text style={{ color: colors.text2, fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20 }}>
                      {selectedUserProfile.bio}
                    </Text>
                  ) : null}

                  {/* Stats */}
                  <View style={{
                    flexDirection: "row",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    overflow: "hidden",
                    backgroundColor: colors.card,
                    marginBottom: 24,
                    width: "100%",
                  }}>
                    {[
                      { labelKey: "followers", value: selectedUserProfile._count?.followers ?? 0 },
                      { labelKey: "following", value: selectedUserProfile._count?.following ?? 0 },
                      { labelKey: "posts", value: selectedUserProfile._count?.posts ?? 0 },
                    ].map((stat, i) => (
                      <View
                        key={stat.labelKey}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          paddingVertical: 14,
                          borderRightWidth: i < 2 ? 1 : 0,
                          borderRightColor: colors.border,
                        }}
                      >
                        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 20 }}>{stat.value}</Text>
                        <Text style={{ color: colors.text3, fontSize: 11, marginTop: 2, fontWeight: "500" }}>{t(stat.labelKey as any)}</Text>
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
                      backgroundColor: colors.accent,
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
                        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>{t("follow")}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <ActivityIndicator color={colors.accent} />
                <Text style={{ color: colors.text3, fontSize: 13, marginTop: 12 }}>{t("loadingProfile")}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <TouchableOpacity
              onPress={() => { setShowCompose(false); setPickedMedia(null); }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                marginRight: 14,
              }}
            >
              <X size={16} color={colors.text2} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "700" }}>{t("newPost")}</Text>
            <TouchableOpacity
              onPress={() => createPost.mutate()}
              disabled={!newPost.content.trim() || createPost.isPending || uploadingMedia}
              testID="submit-post-button"
              style={{
                backgroundColor: !newPost.content.trim() || createPost.isPending ? colors.card : colors.accent,
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
                  color: !newPost.content.trim() ? colors.text3 : "#fff",
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
              <Avatar uri={null} name={session?.user?.name} size={42} radius={50} colors={colors} />
              <View>
                <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>{session?.user?.name}</Text>
                <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>{t("sharingWith")}</Text>
              </View>
            </View>

            <TextInput
              value={newPost.content}
              onChangeText={(text) => setNewPost(p => ({ ...p, content: text }))}
              placeholder={t("shareSomething")}
              placeholderTextColor={colors.text3}
              multiline
              testID="post-content-input"
              style={{
                color: colors.text,
                fontSize: 16,
                lineHeight: 25,
                minHeight: 120,
                marginBottom: 16,
              }}
              autoFocus
            />

            <Divider colors={colors} />

            {/* Media */}
            <View style={{ marginVertical: 16 }}>
              {pickedMedia ? (
                <View style={{ borderRadius: 14, overflow: "hidden", marginBottom: 12, position: "relative" }}>
                  {isDocumentMedia ? (
                    <View style={{
                      backgroundColor: colors.card,
                      borderRadius: 14,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      borderWidth: 1,
                      borderColor: accentBorder,
                    }}>
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: accentSoft,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: accentBorder,
                      }}>
                        <FileText size={22} color={colors.accent} />
                      </View>
                      <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "500", flex: 1 }} numberOfLines={2}>
                        {pickedMedia.fileName}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setPickedMedia(null)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 100,
                          backgroundColor: `${colors.error}1F`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={13} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
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
                    </>
                  )}
                </View>
              ) : null}

              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
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
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <ImageIcon size={14} color={colors.text3} />
                  <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "500" }}>
                    {pickedMedia && !isDocumentMedia ? t("changeMedia") : t("addMedia")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickPdf}
                  testID="pick-pdf-button"
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 100,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <FileText size={14} color={colors.text3} />
                  <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "500" }}>
                    {t("pickPdf")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
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
                    backgroundColor: newPost.category === cat.id ? accentMid : colors.card,
                    borderWidth: 1,
                    borderColor: newPost.category === cat.id ? accentBorder : colors.border,
                  }}
                >
                  <Text style={{
                    color: newPost.category === cat.id ? colors.accent : colors.text3,
                    fontSize: 13,
                    fontWeight: newPost.category === cat.id ? "600" : "400",
                  }}>
                    {t(cat.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
              {t("hashtags")}
            </Text>
            <TextInput
              value={newPost.hashtags}
              onChangeText={(text) => setNewPost(p => ({ ...p, hashtags: text }))}
              placeholder="productivity, mindset, negocios"
              placeholderTextColor={colors.text3}
              testID="hashtags-input"
              style={{
                backgroundColor: colors.card,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                fontSize: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
