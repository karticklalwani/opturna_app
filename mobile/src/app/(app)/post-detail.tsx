import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useTheme } from "@/lib/theme";
import { ChevronLeft, Heart, MessageCircle, Send, FileText } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface PostDetail {
  id: string;
  content: string | null;
  category: string;
  createdAt: string;
  imageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  author: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    role: string | null;
  };
  _count: { reactions: number; comments: number };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["post-detail", postId],
    queryFn: () => api.get<PostDetail>(`/api/posts/${postId}`),
    enabled: !!postId,
  });

  const { data: comments } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () => api.get<Comment[]>(`/api/posts/${postId}/comments`),
    enabled: !!postId,
  });

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/api/posts/${postId}/react`, { type: "like" }),
    onMutate: () => setLiked((prev) => !prev),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/api/posts/${postId}/comments`, { content }),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
  });

  if (isLoading || !post) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}
        testID="post-detail-loading"
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const commentList = comments ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="post-detail-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable onPress={() => router.back()} style={{ marginRight: 12 }} testID="post-detail-back">
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", flex: 1 }}>
            Publicación
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={{
            backgroundColor: colors.card,
            margin: 16,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Author */}
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}
          >
            {post.author?.image ? (
              <Image
                source={{ uri: post.author.image }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            ) : (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${colors.accent}18`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.accent, fontWeight: "700" }}>
                  {getInitials(post.author?.name ?? "?")}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
                {post.author?.name}
              </Text>
              <Text style={{ color: colors.text3, fontSize: 12 }}>
                {formatTimeAgo(post.createdAt)} · {post.author?.role ?? "Miembro"}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: `${colors.accent}18`,
                borderRadius: 8,
                paddingHorizontal: 9,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  color: colors.accent,
                  fontSize: 10,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {post.category}
              </Text>
            </View>
          </View>

          {/* Content */}
          {post.content ? (
            <Text
              style={{ color: colors.text2, fontSize: 15, lineHeight: 23, marginBottom: 14 }}
            >
              {post.content}
            </Text>
          ) : null}

          {/* Image */}
          {post.imageUrl ? (
            <Image
              source={{ uri: post.imageUrl }}
              style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 14 }}
              resizeMode="cover"
            />
          ) : null}

          {/* File */}
          {post.fileUrl && !post.imageUrl ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: `${colors.accent}12`,
                borderRadius: 10,
                padding: 10,
                marginBottom: 14,
              }}
            >
              <FileText size={14} color={colors.accent} />
              <Text
                style={{ color: colors.accent, fontSize: 12, fontWeight: "500", flex: 1 }}
                numberOfLines={1}
              >
                {post.fileName ?? "Archivo adjunto"}
              </Text>
            </View>
          ) : null}

          {/* Actions */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => likeMutation.mutate()}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              testID="post-detail-like-button"
            >
              <Heart
                size={18}
                color={liked ? "#EF4444" : colors.text3}
                fill={liked ? "#EF4444" : "none"}
              />
              <Text
                style={{ color: liked ? "#EF4444" : colors.text3, fontSize: 13, fontWeight: "600" }}
              >
                {(post._count?.reactions ?? 0) + (liked ? 1 : 0)}
              </Text>
            </Pressable>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MessageCircle size={18} color={colors.text3} />
              <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "600" }}>
                {commentList.length}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Comments */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
            Comentarios ({commentList.length})
          </Text>
          {commentList.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 32,
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              testID="comments-empty-state"
            >
              <MessageCircle size={24} color={colors.text4} />
              <Text style={{ color: colors.text3, fontSize: 14, marginTop: 8 }}>
                Sin comentarios aún. ¡Sé el primero!
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {commentList.map((comment, i) => (
                <Animated.View
                  key={comment.id}
                  entering={FadeInDown.delay(i * 50).duration(260)}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}
                  >
                    {comment.author?.image ? (
                      <Image
                        source={{ uri: comment.author.image }}
                        style={{ width: 32, height: 32, borderRadius: 16 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: `${colors.accent}18`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}
                        >
                          {getInitials(comment.author?.name ?? "?")}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>
                        {comment.author?.name}
                      </Text>
                      <Text style={{ color: colors.text3, fontSize: 11 }}>
                        {formatTimeAgo(comment.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.text2, fontSize: 14, lineHeight: 20 }}>
                    {comment.content}
                  </Text>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Comment input */}
      <SafeAreaView
        edges={["bottom"]}
        style={{ backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Escribe un comentario..."
            placeholderTextColor={colors.text3}
            style={{
              flex: 1,
              color: colors.text,
              fontSize: 14,
              backgroundColor: colors.card,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            testID="comment-input"
          />
          <Pressable
            onPress={() => commentText.trim() && commentMutation.mutate(commentText.trim())}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
            testID="comment-send-button"
          >
            <Send size={16} color={colors.bg} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
