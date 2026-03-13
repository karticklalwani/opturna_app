import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, TextInput, Image, Modal, ScrollView, Pressable, Alert, Share,
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
  Play, Images, Share2, UserCheck, Clock, Flame, Users,
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

// Feed tab definitions
const FEED_TABS = [
  { id: "all", label: "Para Ti", icon: Sparkles, filter: "" },
  { id: "following", label: "Siguiendo", icon: Users, filter: "following" },
  { id: "trending", label: "Tendencias", icon: Flame, filter: "trending" },
  { id: "recent", label: "Recientes", icon: Clock, filter: "recent" },
] as const;

type FeedTabId = typeof FEED_TABS[number]["id"];

const CATEGORY_COLORS_KEYS = {
  progress: "success",
  learning: "accent",
  question: "accent3",
  inspiration: "accent3",
  negocios: "success",
  finanzas: "success",
  lifestyle: "accent",
  trading: "success",
  filosofia: "accent3",
  espiritualidad: "accent3",
  lectura: "accent",
  proyectos: "success",
  disciplina: "accent",
} as const;

// Category display labels
const CATEGORY_LABELS: Record<string, string> = {
  progress: "Negocios/Proyectos",
  learning: "Desarrollo Personal",
  inspiration: "Filosofía/Espiritualidad",
  question: "General",
  negocios: "Negocios",
  finanzas: "Finanzas",
  lifestyle: "Lifestyle",
  trading: "Trading",
  filosofia: "Filosofía",
  espiritualidad: "Espiritualidad",
  lectura: "Lectura",
  proyectos: "Proyectos",
  disciplina: "Disciplina",
};

// Extra categories for compose (beyond the base CATEGORIES list)
const EXTRA_COMPOSE_CATEGORIES = [
  { id: "negocios", label: "Negocios" },
  { id: "finanzas", label: "Finanzas" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "trading", label: "Trading" },
  { id: "filosofia", label: "Filosofía" },
  { id: "espiritualidad", label: "Espiritualidad" },
  { id: "lectura", label: "Lectura" },
  { id: "proyectos", label: "Proyectos" },
  { id: "disciplina", label: "Disciplina" },
];

function Avatar({ uri, name, size = 38, radius = 50, colors }: { uri?: string | null; name?: string | null; size?: number; radius?: number; colors: any }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: "#4ADE8015",
        borderWidth: 1.5,
        borderColor: "#4ADE8040",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ color: "#4ADE80", fontWeight: "700", fontSize: size * 0.38 }}>
          {name?.[0]?.toUpperCase() ?? "?"}
        </Text>
      )}
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={{ height: 1, backgroundColor: "#1F1F1F", marginVertical: 12 }} />;
}

function PostCard({ post, currentUserId, colors, onFollowUser }: { post: Post; currentUserId: string; colors: any; onFollowUser?: (userId: string) => void }) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const myReaction = post.reactions?.[0];
  const isMyPost = post.author?.id === currentUserId;
  const isLiked = myReaction?.type === "like";

  const accentGreen = "#4ADE80";
  const accentSoft = "#4ADE8015";
  const accentMid = "#4ADE8025";
  const accentBorder = "#4ADE8040";
  const accentRed = "#EF4444";
  const accentRedSoft = "#EF444415";
  const accentRedBorder = "#EF444440";

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

  const followInPostMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/api/users/${userId}/follow`, {}),
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

  const handleShare = async () => {
    try {
      const shareContent = post.content
        ? `${post.content}${post.author?.name ? `\n\n— ${post.author.name}` : ""}`
        : `Post by ${post.author?.name ?? "someone"} on Opturna`;
      await Share.share({
        message: shareContent,
        title: "Compartir desde Opturna",
      });
    } catch {
      // User cancelled or error — ignore
    }
  };

  const handleLike = () => {
    reactMutation.mutate("like");
  };

  const catColorKey = CATEGORY_COLORS_KEYS[post.category as keyof typeof CATEGORY_COLORS_KEYS];
  const catColor = catColorKey ? colors[catColorKey] : accentGreen;
  const catLabel = post.category
    ? (CATEGORY_LABELS[post.category] ?? (post.category.charAt(0).toUpperCase() + post.category.slice(1)))
    : "Post";

  const mediaUrls: string[] = (() => {
    try { return post.mediaUrls ? JSON.parse(post.mediaUrls) : []; } catch { return []; }
  })();

  const isVideo = post.type === "video" || (mediaUrls[0] && (mediaUrls[0].includes(".mp4") || mediaUrls[0].includes(".mov") || mediaUrls[0].includes("video")));
  const isCarousel = mediaUrls.length > 1;

  return (
    <Animated.View entering={FadeInDown.duration(280).springify()}>
      <View
        style={{
          backgroundColor: "#0F0F0F",
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 10,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#1F1F1F",
        }}
        testID="post-card"
      >
        <View style={{ padding: 16 }}>
          {/* Author row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Avatar uri={post.author?.image} name={post.author?.name} size={40} radius={50} colors={colors} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 14, letterSpacing: -0.2 }}>
                  {post.author?.name}
                </Text>
                {post.author?.isVerified ? (
                  <CheckCircle size={13} color={accentGreen} fill={accentGreen} />
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: catColor }} />
                <Text style={{ color: "#737373", fontSize: 12, fontWeight: "500" }}>{catLabel}</Text>
              </View>
            </View>

            {/* Follow button (only for other users' posts) */}
            {!isMyPost && post.author?.id ? (
              <TouchableOpacity
                onPress={() => followInPostMutation.mutate(post.author!.id)}
                disabled={followInPostMutation.isPending}
                testID={`follow-in-post-${post.id}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: accentSoft,
                  borderWidth: 1,
                  borderColor: accentBorder,
                  marginRight: 6,
                }}
              >
                {followInPostMutation.isPending ? (
                  <ActivityIndicator size="small" color={accentGreen} style={{ width: 12, height: 12 }} />
                ) : (
                  <UserCheck size={11} color={accentGreen} />
                )}
                <Text style={{ color: accentGreen, fontSize: 11, fontWeight: "600" }}>Seguir</Text>
              </TouchableOpacity>
            ) : null}

            {isMyPost ? (
              <TouchableOpacity onPress={handleMorePress} testID="more-options-button" style={{ padding: 6 }}>
                <MoreHorizontal size={17} color="#737373" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 29 }} />
            )}
          </View>

          {/* Content */}
          {post.content ? (
            <Text style={{ color: "#A3A3A3", fontSize: 15, lineHeight: 23, marginBottom: 12 }}>
              {post.content}
            </Text>
          ) : null}

          {/* Media — full-width with video/carousel overlays */}
          {mediaUrls.length > 0 ? (
            <View style={{ marginBottom: 12, borderRadius: 12, overflow: "hidden", position: "relative" }}>
              <Image
                source={{ uri: mediaUrls[0] }}
                style={{ width: "100%", height: 220 }}
                resizeMode="cover"
              />
              {/* Video play button overlay */}
              {isVideo ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.3)",
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: "rgba(0,0,0,0.65)",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: "rgba(255,255,255,0.6)",
                    }}
                  >
                    <Play size={22} color="#ffffff" fill="#ffffff" />
                  </View>
                </View>
              ) : null}
              {/* Carousel indicator */}
              {isCarousel ? (
                <View
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "rgba(0,0,0,0.65)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 100,
                  }}
                >
                  <Images size={11} color="#ffffff" />
                  <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "600" }}>
                    {mediaUrls.length}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Hashtags */}
          {post.hashtags ? (() => {
            try {
              const tags: string[] = JSON.parse(post.hashtags);
              return (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {tags.map((tag) => (
                    <Text key={tag} style={{ color: accentGreen, fontSize: 13, fontWeight: "500" }}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              );
            } catch { return null; }
          })() : null}

          <Divider colors={colors} />

          {/* Actions row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {/* Like (Heart) quick action */}
            <TouchableOpacity
              onPress={handleLike}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 100,
                backgroundColor: isLiked ? accentRedSoft : "#141414",
                borderWidth: 1,
                borderColor: isLiked ? accentRedBorder : "#1F1F1F",
              }}
              testID="like-button"
            >
              <Heart
                size={14}
                color={isLiked ? accentRed : "#737373"}
                fill={isLiked ? accentRed : "transparent"}
              />
              <Text style={{ color: isLiked ? accentRed : "#737373", fontSize: 13, fontWeight: "500" }}>
                {post._count?.reactions || 0}
              </Text>
            </TouchableOpacity>

            {/* Reaction button — emoji picker */}
            <TouchableOpacity
              onPress={() => setShowReactions(!showReactions)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 100,
                backgroundColor: (myReaction && myReaction.type !== "like") ? accentMid : "#141414",
                borderWidth: 1,
                borderColor: (myReaction && myReaction.type !== "like") ? accentBorder : "#1F1F1F",
              }}
              testID="react-button"
            >
              <Text style={{ fontSize: 14 }}>
                {(myReaction && myReaction.type !== "like")
                  ? (REACTION_TYPES.find(r => r.id === myReaction.type)?.emoji || "💡")
                  : "💡"}
              </Text>
            </TouchableOpacity>

            {/* Comment button */}
            <TouchableOpacity
              onPress={() => setShowComments(!showComments)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 100,
                backgroundColor: showComments ? accentMid : "#141414",
                borderWidth: 1,
                borderColor: showComments ? accentBorder : "#1F1F1F",
              }}
              testID="comment-button"
            >
              <MessageCircle size={14} color={showComments ? accentGreen : "#737373"} />
              <Text style={{ color: showComments ? accentGreen : "#737373", fontSize: 13, fontWeight: "500" }}>
                {post._count?.comments || 0}
              </Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            {/* Share button */}
            <TouchableOpacity
              onPress={handleShare}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#1F1F1F",
              }}
              testID="share-button"
            >
              <Share2 size={14} color="#737373" />
            </TouchableOpacity>

            {/* Save button */}
            <TouchableOpacity
              onPress={() => saveMutation.mutate()}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#1F1F1F",
              }}
              testID="save-button"
            >
              <Bookmark size={14} color="#737373" />
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
                    backgroundColor: myReaction?.type === r.id ? accentMid : "#141414",
                    borderWidth: 1,
                    borderColor: myReaction?.type === r.id ? accentBorder : "#1F1F1F",
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
                  <View style={{ flex: 1, backgroundColor: "#141414", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#1F1F1F" }}>
                    <Text style={{ color: "#A3A3A3", fontSize: 12, fontWeight: "600", marginBottom: 3 }}>{c.author?.name}</Text>
                    <Text style={{ color: "#A3A3A3", fontSize: 13, lineHeight: 18 }}>{c.content}</Text>
                  </View>
                </View>
              ))}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4, alignItems: "center" }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder={t("addComment")}
                  placeholderTextColor="#737373"
                  style={{
                    flex: 1,
                    backgroundColor: "#141414",
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    color: colors.text,
                    fontSize: 13,
                    borderWidth: 1,
                    borderColor: "#1F1F1F",
                  }}
                />
                <TouchableOpacity
                  onPress={() => commentMutation.mutate()}
                  disabled={!commentText.trim()}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 100,
                    backgroundColor: commentText.trim() ? accentGreen : "#141414",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: commentText.trim() ? accentGreen : "#1F1F1F",
                  }}
                >
                  <Send size={14} color={commentText.trim() ? "#080808" : "#737373"} />
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

// All compose categories (base + extra)
const ALL_COMPOSE_CATEGORIES = [
  { id: "progress", label: "Progreso" },
  { id: "learning", label: "Aprendizaje" },
  { id: "question", label: "Pregunta" },
  { id: "inspiration", label: "Inspiración" },
  ...EXTRA_COMPOSE_CATEGORIES,
];

export default function FeedScreen() {
  const { data: session } = useSession();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [feedTab, setFeedTab] = useState<FeedTabId>("all");
  const [showCompose, setShowCompose] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [newPost, setNewPost] = useState({ content: "", category: "progress", hashtags: "" });
  const [pickedMedia, setPickedMedia] = useState<{ uri: string; mimeType: string; fileName: string } | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const accentGreen = "#4ADE80";
  const accentSoft = "#4ADE8015";
  const accentMid = "#4ADE8025";
  const accentBorder = "#4ADE8040";

  // Build the API URL based on feed tab filter
  const buildPostsUrl = () => {
    const tab = FEED_TABS.find(t => t.id === feedTab);
    return `/api/posts${tab && tab.filter ? `?filter=${tab.filter}` : ""}`;
  };

  const { data: posts, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["posts", feedTab],
    queryFn: () => api.get<Post[]>(buildPostsUrl()),
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
    <View style={{ flex: 1, backgroundColor: "#080808" }} testID="feed-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#080808" }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            {/* Wordmark */}
            <Text style={{ flex: 1, fontSize: 22, fontWeight: "900", color: colors.text, letterSpacing: -1 }}>
              OPTURNA
            </Text>

            {/* Right icon buttons */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <TouchableOpacity
                onPress={() => setShowSearch(true)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#141414",
                  borderWidth: 1,
                  borderColor: "#1F1F1F",
                }}
              >
                <Search size={17} color="#A3A3A3" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: hasUnread ? accentSoft : "#141414",
                  borderWidth: 1,
                  borderColor: hasUnread ? accentBorder : "#1F1F1F",
                }}
                onPress={() => setShowNotifications(true)}
                testID="bell-button"
              >
                <View>
                  <Bell size={17} color={hasUnread ? accentGreen : "#A3A3A3"} />
                  {hasUnread ? (
                    <View style={{
                      position: "absolute",
                      top: -3,
                      right: -3,
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: "#EF4444",
                      borderWidth: 1.5,
                      borderColor: "#080808",
                    }} />
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Feed tabs — Para Ti / Siguiendo / Tendencias / Recientes */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
          testID="feed-tabs"
        >
          {FEED_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = feedTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFeedTab(tab.id)}
                testID={`feed-tab-${tab.id}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: isActive ? "#4ADE8015" : "#141414",
                  borderWidth: 1,
                  borderColor: isActive ? "#4ADE8040" : "#1F1F1F",
                }}
              >
                <Icon size={13} color={isActive ? accentGreen : "#737373"} />
                <Text style={{
                  color: isActive ? accentGreen : "#737373",
                  fontSize: 13,
                  fontWeight: isActive ? "600" : "400",
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
          <ActivityIndicator color={accentGreen} size="large" />
          <Text style={{ color: "#737373", fontSize: 13, marginTop: 14, fontWeight: "400" }}>
            {t("loadingFeed")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={session?.user?.id || ""}
              colors={colors}
              onFollowUser={(userId) => followMutation.mutate(userId)}
            />
          )}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={accentGreen} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          testID="posts-list"
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                backgroundColor: "#0F0F0F",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}>
                <Sparkles size={28} color="#737373" />
              </View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>
                {t("noFeed")}
              </Text>
              <Text style={{ color: "#737373", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
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
          borderRadius: 26,
          backgroundColor: accentGreen,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: accentGreen,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        <Plus size={22} color="#080808" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: "#080808" }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#1F1F1F",
          }}>
            <Text style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: "700" }}>{t("notifications")}</Text>
            <TouchableOpacity
              onPress={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 100,
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                marginRight: 10,
              }}
              testID="mark-all-read-button"
            >
              <Text style={{ color: accentGreen, fontSize: 13, fontWeight: "500" }}>{t("markAllRead")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#1F1F1F",
              }}
            >
              <X size={16} color="#A3A3A3" />
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
                  borderRadius: 14,
                  backgroundColor: item.isRead ? "#0F0F0F" : accentSoft,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: item.isRead ? "#1F1F1F" : accentBorder,
                }}
              >
                {!item.isRead ? (
                  <View style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: accentGreen,
                    marginTop: 5,
                    marginRight: 10,
                  }} />
                ) : (
                  <View style={{ width: 7, marginRight: 10 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14, marginBottom: 3 }}>{item.title}</Text>
                  {item.body ? <Text style={{ color: "#737373", fontSize: 13, lineHeight: 19 }}>{item.body}</Text> : null}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "#0F0F0F",
                  borderWidth: 1,
                  borderColor: "#1F1F1F",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}>
                  <Bell size={26} color="#737373" />
                </View>
                <Text style={{ color: "#A3A3A3", fontSize: 16, fontWeight: "600", marginBottom: 6 }}>{t("allCaughtUp")}</Text>
                <Text style={{ color: "#737373", fontSize: 13 }}>{t("noNewNotifs")}</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: "#080808", padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20, marginTop: 8 }}>
            <View style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#0F0F0F",
              borderRadius: 12,
              paddingHorizontal: 12,
              gap: 8,
              borderWidth: 1,
              borderColor: "#1F1F1F",
            }}>
              <Search size={15} color="#737373" />
              <TextInput
                value={searchQ}
                onChangeText={setSearchQ}
                placeholder={t("searchUsers")}
                placeholderTextColor="#737373"
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
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#1F1F1F",
              }}
            >
              <X size={16} color="#A3A3A3" />
            </TouchableOpacity>
          </View>
          {searchQ.length < 2 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: "#737373", fontSize: 14 }}>{t("startTyping")}</Text>
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
                  backgroundColor: "#0F0F0F",
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: "#1F1F1F",
                }}
              >
                <Avatar uri={item.image} name={item.name} size={44} radius={50} colors={colors} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>{item.name}</Text>
                  {item.username ? (
                    <Text style={{ color: "#737373", fontSize: 13, marginTop: 1 }}>@{item.username}</Text>
                  ) : null}
                </View>
              </Pressable>
            )}
          />
        </View>
      </Modal>

      {/* User Profile Modal */}
      <Modal visible={!!selectedUser} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: "#080808" }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#1F1F1F",
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
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#1F1F1F",
              }}
            >
              <X size={16} color="#A3A3A3" />
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
                      <CheckCircle size={15} color={accentGreen} fill={accentGreen} />
                    ) : null}
                  </View>
                  {selectedUserProfile.username ? (
                    <Text style={{ color: "#737373", fontSize: 14, marginBottom: 10 }}>@{selectedUserProfile.username}</Text>
                  ) : null}
                  {selectedUserProfile.bio ? (
                    <Text style={{ color: "#A3A3A3", fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20 }}>
                      {selectedUserProfile.bio}
                    </Text>
                  ) : null}

                  {/* Stats */}
                  <View style={{
                    flexDirection: "row",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#1F1F1F",
                    overflow: "hidden",
                    backgroundColor: "#0F0F0F",
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
                          borderRightColor: "#1F1F1F",
                        }}
                      >
                        <Text style={{ color: accentGreen, fontWeight: "800", fontSize: 20 }}>{stat.value}</Text>
                        <Text style={{ color: "#737373", fontSize: 11, marginTop: 2, fontWeight: "500" }}>{t(stat.labelKey as any)}</Text>
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
                      backgroundColor: accentGreen,
                      paddingHorizontal: 32,
                      paddingVertical: 13,
                      borderRadius: 100,
                      shadowColor: accentGreen,
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                      shadowOffset: { width: 0, height: 4 },
                    }}
                  >
                    {followMutation.isPending ? (
                      <ActivityIndicator color="#080808" size="small" />
                    ) : (
                      <>
                        <UserPlus size={15} color="#080808" />
                        <Text style={{ color: "#080808", fontWeight: "700", fontSize: 15 }}>{t("follow")}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <ActivityIndicator color={accentGreen} />
                <Text style={{ color: "#737373", fontSize: 13, marginTop: 12 }}>{t("loadingProfile")}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: "#080808" }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: "#1F1F1F",
          }}>
            <TouchableOpacity
              onPress={() => { setShowCompose(false); setPickedMedia(null); }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                marginRight: 14,
              }}
            >
              <X size={16} color="#A3A3A3" />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "700" }}>{t("newPost")}</Text>
            <TouchableOpacity
              onPress={() => createPost.mutate()}
              disabled={!newPost.content.trim() || createPost.isPending || uploadingMedia}
              testID="submit-post-button"
              style={{
                backgroundColor: !newPost.content.trim() || createPost.isPending ? "#141414" : accentGreen,
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: 100,
                opacity: !newPost.content.trim() ? 0.5 : 1,
              }}
            >
              {createPost.isPending || uploadingMedia ? (
                <ActivityIndicator color="#080808" size="small" />
              ) : (
                <Text style={{
                  color: !newPost.content.trim() ? "#737373" : "#080808",
                  fontWeight: "700",
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
                <Text style={{ color: "#737373", fontSize: 12, marginTop: 1 }}>{t("sharingWith")}</Text>
              </View>
            </View>

            <TextInput
              value={newPost.content}
              onChangeText={(text) => setNewPost(p => ({ ...p, content: text }))}
              placeholder={t("shareSomething")}
              placeholderTextColor="#737373"
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

            <View style={{ height: 1, backgroundColor: "#1F1F1F", marginVertical: 12 }} />

            {/* Media */}
            <View style={{ marginVertical: 16 }}>
              {pickedMedia ? (
                <View style={{ borderRadius: 14, overflow: "hidden", marginBottom: 12, position: "relative" }}>
                  {isDocumentMedia ? (
                    <View style={{
                      backgroundColor: "#0F0F0F",
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
                        <FileText size={22} color={accentGreen} />
                      </View>
                      <Text style={{ color: "#A3A3A3", fontSize: 13, fontWeight: "500", flex: 1 }} numberOfLines={2}>
                        {pickedMedia.fileName}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setPickedMedia(null)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 100,
                          backgroundColor: "#EF444420",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={13} color="#EF4444" />
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
                    backgroundColor: "#141414",
                    borderWidth: 1,
                    borderColor: "#1F1F1F",
                  }}
                >
                  <ImageIcon size={14} color="#737373" />
                  <Text style={{ color: "#737373", fontSize: 13, fontWeight: "500" }}>
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
                    backgroundColor: "#141414",
                    borderWidth: 1,
                    borderColor: "#1F1F1F",
                  }}
                >
                  <FileText size={14} color="#737373" />
                  <Text style={{ color: "#737373", fontSize: 13, fontWeight: "500" }}>
                    {t("pickPdf")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={{ color: "#737373", fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
              {t("category")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {ALL_COMPOSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setNewPost(p => ({ ...p, category: cat.id }))}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 100,
                    backgroundColor: newPost.category === cat.id ? accentMid : "#141414",
                    borderWidth: 1,
                    borderColor: newPost.category === cat.id ? accentBorder : "#1F1F1F",
                  }}
                >
                  <Text style={{
                    color: newPost.category === cat.id ? accentGreen : "#737373",
                    fontSize: 13,
                    fontWeight: newPost.category === cat.id ? "600" : "400",
                  }}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: "#737373", fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
              {t("hashtags")}
            </Text>
            <TextInput
              value={newPost.hashtags}
              onChangeText={(text) => setNewPost(p => ({ ...p, hashtags: text }))}
              placeholder="productivity, mindset, negocios"
              placeholderTextColor="#737373"
              testID="hashtags-input"
              style={{
                backgroundColor: "#0F0F0F",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                fontSize: 14,
                borderWidth: 1,
                borderColor: "#1F1F1F",
              }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
