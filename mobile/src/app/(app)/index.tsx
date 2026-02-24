import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
  ScrollView,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useSession } from "@/lib/auth/use-session";
import { Post } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Lightbulb,
  TrendingUp,
  Sparkles,
  HelpCircle,
  Plus,
  Bell,
  Search,
  X,
  CheckCircle,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

const CATEGORIES = [
  { id: "all", label: "For You", icon: Sparkles },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "learning", label: "Learning", icon: Lightbulb },
  { id: "question", label: "Questions", icon: HelpCircle },
  { id: "inspiration", label: "Inspire", icon: Heart },
];

const REACTION_TYPES = [
  { id: "useful", emoji: "💡", label: "Useful" },
  { id: "inspired", emoji: "🔥", label: "Inspired" },
  { id: "good_progress", emoji: "🎯", label: "Progress" },
  { id: "interesting", emoji: "✨", label: "Interesting" },
];

function PostCard({ post, currentUserId }: { post: Post; currentUserId: string }) {
  const queryClient = useQueryClient();
  const [showReactions, setShowReactions] = useState(false);
  const myReaction = post.reactions?.[0];

  const reactMutation = useMutation({
    mutationFn: (type: string) => api.post(`/api/posts/${post.id}/react`, { type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const saveMutation = useMutation({
    mutationFn: () => api.post(`/api/posts/${post.id}/save`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return "";
    }
  })();

  const categoryColors: Record<string, string> = {
    progress: "#22C55E",
    learning: "#3B82F6",
    question: "#8B5CF6",
    inspiration: "#F59E0B",
  };

  // suppress unused variable warning
  void currentUserId;

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <View style={{ backgroundColor: "#141414", borderRadius: 16, marginHorizontal: 16, marginBottom: 12, overflow: "hidden" }} testID="post-card">
        {/* Category indicator */}
        <View style={{ height: 2, backgroundColor: categoryColors[post.category] || "#F59E0B" }} />

        <View style={{ padding: 16 }}>
          {/* Author row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "#27272A", overflow: "hidden",
              marginRight: 12,
            }}>
              {post.author?.image ? (
                <Image source={{ uri: post.author.image }} style={{ width: 40, height: 40 }} />
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#F59E0B", fontWeight: "700", fontSize: 16 }}>
                    {post.author?.name?.[0]?.toUpperCase() || "?"}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: "#FAFAFA", fontWeight: "600", fontSize: 14 }}>
                  {post.author?.name || "Unknown"}
                </Text>
                {post.author?.isVerified ? (
                  <CheckCircle size={13} color="#F59E0B" fill="#F59E0B" />
                ) : null}
                {post.author?.role === "mentor" ? (
                  <View style={{ backgroundColor: "#1A1A00", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "700" }}>MENTOR</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ color: "#52525B", fontSize: 12 }}>{timeAgo}</Text>
            </View>

            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                backgroundColor: `${categoryColors[post.category] || "#F59E0B"}18`,
              }}>
                <Text style={{ color: categoryColors[post.category] || "#F59E0B", fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {post.category}
                </Text>
              </View>
              <TouchableOpacity>
                <MoreHorizontal size={18} color="#52525B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {post.content ? (
            <Text style={{ color: "#E4E4E7", fontSize: 15, lineHeight: 24, marginBottom: 12 }}>
              {post.content}
            </Text>
          ) : null}

          {/* Hashtags */}
          {post.hashtags ? (() => {
            try {
              const tags: string[] = JSON.parse(post.hashtags);
              return (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {tags.map((tag) => (
                    <Text key={tag} style={{ color: "#F59E0B", fontSize: 13, fontWeight: "500" }}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              );
            } catch { return null; }
          })() : null}

          {/* Action bar */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#1C1C1E", gap: 6 }}>
            <TouchableOpacity
              onPress={() => setShowReactions(!showReactions)}
              style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: myReaction ? "#1A1A00" : "transparent" }}
              testID="react-button"
            >
              <Text style={{ fontSize: 16 }}>
                {myReaction ? REACTION_TYPES.find(r => r.id === myReaction.type)?.emoji || "💡" : "💡"}
              </Text>
              <Text style={{ color: myReaction ? "#F59E0B" : "#52525B", fontSize: 13, fontWeight: "600" }}>
                {post._count?.reactions || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 10 }}
              testID="comment-button"
            >
              <MessageCircle size={17} color="#52525B" />
              <Text style={{ color: "#52525B", fontSize: 13, fontWeight: "600" }}>{post._count?.comments || 0}</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              onPress={() => saveMutation.mutate()}
              style={{ padding: 6 }}
              testID="save-button"
            >
              <Bookmark size={17} color="#52525B" />
            </TouchableOpacity>
          </View>

          {/* Reaction picker */}
          {showReactions ? (
            <Animated.View entering={FadeIn.duration(150)}
              style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}
            >
              {REACTION_TYPES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => { reactMutation.mutate(r.id); setShowReactions(false); }}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 5,
                    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
                    backgroundColor: myReaction?.type === r.id ? "#1A1A00" : "#1C1C1E",
                    borderWidth: 1, borderColor: myReaction?.type === r.id ? "#F59E0B" : "#27272A",
                  }}
                >
                  <Text style={{ fontSize: 15 }}>{r.emoji}</Text>
                  <Text style={{ color: "#A1A1AA", fontSize: 12 }}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

export default function FeedScreen() {
  const { data: session } = useSession();
  const [category, setCategory] = useState("all");
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState({ content: "", category: "progress", hashtags: "" });
  const queryClient = useQueryClient();

  const { data: posts, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["posts", category],
    queryFn: () => api.get<Post[]>(`/api/posts${category !== "all" ? `?category=${category}` : ""}`),
  });

  const createPost = useMutation({
    mutationFn: () => api.post("/api/posts", {
      content: newPost.content,
      category: newPost.category,
      hashtags: newPost.hashtags ? newPost.hashtags.split(",").map(t => t.trim()).filter(Boolean) : [],
      type: "text",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setShowCompose(false);
      setNewPost({ content: "", category: "progress", hashtags: "" });
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} testID="feed-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0A0A0A" }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#FAFAFA", flex: 1, letterSpacing: -0.5 }}>
            Opturna
          </Text>
          <TouchableOpacity style={{ padding: 8 }}>
            <Search size={22} color="#71717A" />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 8, marginLeft: 4 }}>
            <Bell size={22} color="#71717A" />
          </TouchableOpacity>
        </View>

        {/* Category tabs */}
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
                  flexDirection: "row", alignItems: "center", gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: isActive ? "#F59E0B" : "#1C1C1E",
                  borderWidth: 1, borderColor: isActive ? "#F59E0B" : "#27272A",
                }}
              >
                <Icon size={14} color={isActive ? "#0A0A0A" : "#71717A"} />
                <Text style={{ color: isActive ? "#0A0A0A" : "#71717A", fontSize: 13, fontWeight: "600" }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Feed */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
          <ActivityIndicator color="#F59E0B" size="large" />
        </View>
      ) : (
        <FlatList
          data={posts || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} currentUserId={session?.user?.id || ""} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#F59E0B"
            />
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          testID="posts-list"
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 40, marginBottom: 16 }}>🌟</Text>
              <Text style={{ color: "#FAFAFA", fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>
                No posts yet
              </Text>
              <Text style={{ color: "#52525B", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
                Be the first to share your progress, goals, or inspiration.
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
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: "#F59E0B",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#F59E0B",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Plus size={24} color="#0A0A0A" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: "#0F0F0F" }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1C1C1E" }}>
            <TouchableOpacity onPress={() => setShowCompose(false)} style={{ marginRight: 16 }}>
              <X size={22} color="#71717A" />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: "#FAFAFA", fontSize: 17, fontWeight: "600" }}>New Post</Text>
            <TouchableOpacity
              onPress={() => createPost.mutate()}
              disabled={!newPost.content.trim() || createPost.isPending}
              testID="submit-post-button"
              style={{
                backgroundColor: "#F59E0B",
                paddingHorizontal: 18,
                paddingVertical: 8,
                borderRadius: 10,
                opacity: !newPost.content.trim() || createPost.isPending ? 0.5 : 1,
              }}
            >
              {createPost.isPending ? (
                <ActivityIndicator color="#0A0A0A" size="small" />
              ) : (
                <Text style={{ color: "#0A0A0A", fontWeight: "700", fontSize: 14 }}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {/* Author */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#F59E0B", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#0A0A0A", fontWeight: "700", fontSize: 18 }}>
                  {session?.user?.name?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
              <View>
                <Text style={{ color: "#FAFAFA", fontWeight: "600", fontSize: 15 }}>{session?.user?.name}</Text>
                <Text style={{ color: "#52525B", fontSize: 12 }}>Sharing with your network</Text>
              </View>
            </View>

            {/* Content input */}
            <TextInput
              value={newPost.content}
              onChangeText={(t) => setNewPost(p => ({ ...p, content: t }))}
              placeholder="What are you working on? Share your progress, insights, or questions..."
              placeholderTextColor="#3F3F46"
              multiline
              testID="post-content-input"
              style={{
                color: "#FAFAFA",
                fontSize: 16,
                lineHeight: 26,
                minHeight: 120,
                marginBottom: 24,
              }}
              autoFocus
            />

            {/* Category */}
            <Text style={{ color: "#71717A", fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
              Category
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {CATEGORIES.filter(c => c.id !== "all").map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setNewPost(p => ({ ...p, category: cat.id }))}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                    backgroundColor: newPost.category === cat.id ? "#F59E0B" : "#1C1C1E",
                    borderWidth: 1,
                    borderColor: newPost.category === cat.id ? "#F59E0B" : "#27272A",
                  }}
                >
                  <Text style={{ color: newPost.category === cat.id ? "#0A0A0A" : "#71717A", fontSize: 13, fontWeight: "600" }}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Hashtags */}
            <Text style={{ color: "#71717A", fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
              Hashtags (optional, comma separated)
            </Text>
            <TextInput
              value={newPost.hashtags}
              onChangeText={(t) => setNewPost(p => ({ ...p, hashtags: t }))}
              placeholder="productivity, mindset, business"
              placeholderTextColor="#3F3F46"
              testID="hashtags-input"
              style={{
                backgroundColor: "#1C1C1E",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: "#FAFAFA",
                fontSize: 14,
              }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
