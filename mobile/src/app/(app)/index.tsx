import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, TextInput, Image, Modal, ScrollView,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useSession } from "@/lib/auth/use-session";
import { Post } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  TrendingUp, Lightbulb, HelpCircle, Heart, Sparkles,
  Plus, Bell, Search, X, Bookmark, MessageCircle,
  MoreHorizontal, CheckCircle, Send,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useTheme, DARK } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

type Colors = typeof DARK;

const REACTION_TYPES = [
  { id: "useful", emoji: "💡" },
  { id: "inspired", emoji: "🔥" },
  { id: "good_progress", emoji: "🎯" },
  { id: "interesting", emoji: "✨" },
];

function PostCard({ post, currentUserId, colors }: { post: Post; currentUserId: string; colors: Colors }) {
  const queryClient = useQueryClient();
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const myReaction = post.reactions?.[0];

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

  const { data: comments } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => api.get<any[]>(`/api/posts/${post.id}/comments`),
    enabled: showComments,
  });

  const categoryColors: Record<string, string> = {
    progress: colors.success, learning: colors.info,
    question: "#8B5CF6", inspiration: colors.accent,
  };
  const catColor = categoryColors[post.category] || colors.accent;

  // suppress unused variable warning
  void currentUserId;

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <View style={{ backgroundColor: colors.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, overflow: "hidden" }} testID="post-card">
        <View style={{ height: 2, backgroundColor: catColor }} />
        <View style={{ padding: 16 }}>
          {/* Author */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg3, overflow: "hidden", marginRight: 12, alignItems: "center", justifyContent: "center" }}>
              {post.author?.image
                ? <Image source={{ uri: post.author.image }} style={{ width: 40, height: 40 }} />
                : <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 16 }}>{post.author?.name?.[0]?.toUpperCase()}</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>{post.author?.name}</Text>
                {post.author?.isVerified ? <CheckCircle size={13} color={colors.accent} fill={colors.accent} /> : null}
              </View>
              <Text style={{ color: colors.text4, fontSize: 12 }}>{post.category}</Text>
            </View>
            <TouchableOpacity><MoreHorizontal size={18} color={colors.text4} /></TouchableOpacity>
          </View>

          {/* Content */}
          {post.content ? (
            <Text style={{ color: colors.text2, fontSize: 15, lineHeight: 24, marginBottom: 10 }}>
              {post.content}
            </Text>
          ) : null}

          {/* Hashtags */}
          {post.hashtags ? (() => {
            try {
              const tags: string[] = JSON.parse(post.hashtags);
              return (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {tags.map((tag) => <Text key={tag} style={{ color: colors.accent, fontSize: 13 }}>#{tag}</Text>)}
                </View>
              );
            } catch { return null; }
          })() : null}

          {/* Actions */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 4 }}>
            <TouchableOpacity
              onPress={() => setShowReactions(!showReactions)}
              style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: myReaction ? `${colors.accent}22` : "transparent" }}
              testID="react-button"
            >
              <Text style={{ fontSize: 16 }}>{myReaction ? REACTION_TYPES.find(r => r.id === myReaction.type)?.emoji || "💡" : "💡"}</Text>
              <Text style={{ color: myReaction ? colors.accent : colors.text4, fontSize: 13, fontWeight: "600" }}>{post._count?.reactions || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowComments(!showComments)}
              style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 10 }}
              testID="comment-button"
            >
              <MessageCircle size={17} color={showComments ? colors.accent : colors.text4} />
              <Text style={{ color: showComments ? colors.accent : colors.text4, fontSize: 13, fontWeight: "600" }}>{post._count?.comments || 0}</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => saveMutation.mutate()} style={{ padding: 6 }} testID="save-button">
              <Bookmark size={17} color={colors.text4} />
            </TouchableOpacity>
          </View>

          {/* Reaction picker */}
          {showReactions ? (
            <Animated.View entering={FadeIn.duration(150)} style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {REACTION_TYPES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => { reactMutation.mutate(r.id); setShowReactions(false); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: myReaction?.type === r.id ? `${colors.accent}22` : colors.bg3, borderWidth: 1, borderColor: myReaction?.type === r.id ? colors.accent : colors.border }}
                >
                  <Text style={{ fontSize: 16 }}>{r.emoji}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          ) : null}

          {/* Comments */}
          {showComments ? (
            <View style={{ marginTop: 12 }}>
              {(comments || []).map((c: any) => (
                <View key={c.id} style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bg3, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}>{c.author?.name?.[0]}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: colors.bg3, borderRadius: 10, padding: 8 }}>
                    <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "600", marginBottom: 2 }}>{c.author?.name}</Text>
                    <Text style={{ color: colors.text2, fontSize: 13 }}>{c.content}</Text>
                  </View>
                </View>
              ))}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.text4}
                  style={{ flex: 1, backgroundColor: colors.bg3, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: colors.text, fontSize: 13 }}
                />
                <TouchableOpacity
                  onPress={() => commentMutation.mutate()}
                  disabled={!commentText.trim()}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: commentText.trim() ? colors.accent : colors.bg3, alignItems: "center", justifyContent: "center" }}
                >
                  <Send size={15} color={commentText.trim() ? "#0A0A0A" : colors.text4} />
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
  const [searchQ, setSearchQ] = useState("");
  const [newPost, setNewPost] = useState({ content: "", category: "progress", hashtags: "" });
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

  const createPost = useMutation({
    mutationFn: () => api.post("/api/posts", {
      content: newPost.content,
      category: newPost.category,
      hashtags: newPost.hashtags ? newPost.hashtags.split(",").map((tag: string) => tag.trim()).filter(Boolean) : [],
      type: "text",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setShowCompose(false);
      setNewPost({ content: "", category: "progress", hashtags: "" });
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="feed-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, flex: 1, letterSpacing: -0.5 }}>Opturna</Text>
          <TouchableOpacity onPress={() => setShowSearch(true)} style={{ padding: 8 }}>
            <Search size={22} color={colors.text3} />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 8, marginLeft: 4 }}>
            <Bell size={22} color={colors.text3} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: isActive ? colors.accent : colors.bg3, borderWidth: 1, borderColor: isActive ? colors.accent : colors.border }}
              >
                <Icon size={14} color={isActive ? "#0A0A0A" : colors.text3} />
                <Text style={{ color: isActive ? "#0A0A0A" : colors.text3, fontSize: 13, fontWeight: "600" }}>{t(cat.labelKey)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
          <ActivityIndicator color={colors.accent} size="large" />
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
              <Text style={{ fontSize: 40, marginBottom: 16 }}>🌟</Text>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>{t("noFeed")}</Text>
              <Text style={{ color: colors.text4, fontSize: 14, textAlign: "center", lineHeight: 22 }}>{t("noFeedDesc")}</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowCompose(true)}
        testID="compose-button"
        style={{ position: "absolute", bottom: 100, right: 20, width: 56, height: 56, borderRadius: 18, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}
      >
        <Plus size={24} color="#0A0A0A" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.bg3, borderRadius: 12, paddingHorizontal: 14, gap: 10 }}>
              <Search size={18} color={colors.text4} />
              <TextInput
                value={searchQ}
                onChangeText={setSearchQ}
                placeholder={t("searchUsers")}
                placeholderTextColor={colors.text4}
                style={{ flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 }}
                autoFocus
              />
            </View>
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQ(""); }}>
              <X size={22} color={colors.text3} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchResults || []}
            keyExtractor={(u) => u.id}
            renderItem={({ item }) => (
              <View style={{ flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg3, marginRight: 14, alignItems: "center", justifyContent: "center" }}>
                  {item.image ? <Image source={{ uri: item.image }} style={{ width: 44, height: 44, borderRadius: 22 }} /> : (
                    <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 17 }}>{item.name?.[0]}</Text>
                  )}
                </View>
                <View>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>{item.name}</Text>
                  {item.username ? <Text style={{ color: colors.text3, fontSize: 13 }}>@{item.username}</Text> : null}
                </View>
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={() => setShowCompose(false)} style={{ marginRight: 16 }}>
              <X size={22} color={colors.text3} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "600" }}>{t("newPost")}</Text>
            <TouchableOpacity
              onPress={() => createPost.mutate()}
              disabled={!newPost.content.trim() || createPost.isPending}
              testID="submit-post-button"
              style={{ backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, opacity: !newPost.content.trim() || createPost.isPending ? 0.5 : 1 }}
            >
              {createPost.isPending ? <ActivityIndicator color="#0A0A0A" size="small" /> : (
                <Text style={{ color: "#0A0A0A", fontWeight: "700", fontSize: 14 }}>{t("post")}</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#0A0A0A", fontWeight: "700", fontSize: 18 }}>{session?.user?.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View>
                <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>{session?.user?.name}</Text>
                <Text style={{ color: colors.text4, fontSize: 12 }}>{t("sharingWith")}</Text>
              </View>
            </View>

            <TextInput
              value={newPost.content}
              onChangeText={(text) => setNewPost(p => ({ ...p, content: text }))}
              placeholder={t("shareSomething")}
              placeholderTextColor={colors.text4}
              multiline
              testID="post-content-input"
              style={{ color: colors.text, fontSize: 16, lineHeight: 26, minHeight: 120, marginBottom: 24 }}
              autoFocus
            />

            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>{t("category")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {CATEGORIES.filter(c => c.id !== "all").map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setNewPost(p => ({ ...p, category: cat.id }))}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: newPost.category === cat.id ? colors.accent : colors.bg3, borderWidth: 1, borderColor: newPost.category === cat.id ? colors.accent : colors.border }}
                >
                  <Text style={{ color: newPost.category === cat.id ? "#0A0A0A" : colors.text3, fontSize: 13, fontWeight: "600" }}>{t(cat.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>{t("hashtags")}</Text>
            <TextInput
              value={newPost.hashtags}
              onChangeText={(text) => setNewPost(p => ({ ...p, hashtags: text }))}
              placeholder="productivity, mindset, negocios"
              placeholderTextColor={colors.text4}
              testID="hashtags-input"
              style={{ backgroundColor: colors.bg3, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14 }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
