import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  Search,
  UserPlus,
  Check,
  Heart,
  MessageCircle,
  TrendingUp,
  Users,
  Compass,
  Sparkles,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";

interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  role: string | null;
  isVerified: boolean;
}

interface Post {
  id: string;
  content: string | null;
  category: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    role: string | null;
    isVerified: boolean;
  };
  _count: {
    reactions: number;
    comments: number;
  };
}

const CATEGORIES = ["All", "Business", "Finance", "Trading", "Productivity", "Startups", "Growth"];

const CATEGORY_COLORS: Record<string, string> = {
  Business: "#00B4D8",
  Finance: "#00FF87",
  Trading: "#FF3B30",
  Growth: "#FFD60A",
  Startups: "#00B4D8",
  Productivity: "#FFD60A",
  progress: "#00FF87",
  mindset: "#FFD60A",
  challenge: "#FF3B30",
  milestone: "#00B4D8",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getTagColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#00B4D8";
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function InitialsAvatar({
  initials,
  size = 44,
  accentColor,
}: {
  initials: string;
  size?: number;
  accentColor: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${accentColor}18`,
        borderWidth: 1.5,
        borderColor: `${accentColor}40`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: accentColor, fontSize: size * 0.34, fontWeight: "700" }}>
        {initials}
      </Text>
    </View>
  );
}

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [optimisticFollowed, setOptimisticFollowed] = useState<Set<string>>(new Set());

  const isSearching = searchQuery.length > 1;

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["users-search", searchQuery],
    queryFn: () => api.get<SearchUser[]>(`/api/users/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: isSearching,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => api.get<Post[]>("/api/posts"),
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/api/users/${userId}/follow`, {}),
    onMutate: (userId: string) => {
      setOptimisticFollowed((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) {
          next.delete(userId);
        } else {
          next.add(userId);
        }
        return next;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (_err, userId: string) => {
      setOptimisticFollowed((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) {
          next.delete(userId);
        } else {
          next.add(userId);
        }
        return next;
      });
    },
  });

  const trendingPosts = posts
    ? [...posts]
        .sort((a, b) => b._count.reactions - a._count.reactions)
        .filter((p) => {
          if (activeCategory === "All") return true;
          return p.category?.toLowerCase() === activeCategory.toLowerCase();
        })
        .slice(0, 4)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="discover-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.6, marginBottom: 14 }}>
            Discover
          </Text>

          {/* Search Bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderRadius: 14,
              paddingHorizontal: 14,
              gap: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Search size={16} color={colors.text3} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search people, topics..."
              placeholderTextColor={colors.text3}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 15,
                paddingVertical: 12,
              }}
              testID="discover-search-input"
            />
            {searchLoading ? (
              <ActivityIndicator size="small" color={colors.accent} testID="search-loading" />
            ) : null}
          </View>
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                testID={`category-${cat}`}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 100,
                  backgroundColor: isActive ? `${colors.accent}28` : colors.card,
                  borderWidth: 1,
                  borderColor: isActive ? `${colors.accent}50` : colors.border,
                }}
              >
                <Text
                  style={{
                    color: isActive ? colors.accent : colors.text3,
                    fontSize: 13,
                    fontWeight: isActive ? "600" : "400",
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {isSearching ? (
          /* Search Results */
          <Animated.View entering={FadeIn.duration(200)} style={{ paddingHorizontal: 16 }}>
            <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "500", marginBottom: 14, letterSpacing: 0.4 }}>
              {searchLoading ? "Searching..." : `${(searchResults ?? []).length} people found`}
            </Text>

            {searchLoading ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : (searchResults ?? []).length === 0 ? (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: 60,
                  gap: 12,
                }}
                testID="search-empty-state"
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: `${colors.accent}14`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                  }}
                >
                  <Users size={28} color={colors.accent} />
                </View>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", textAlign: "center" }}>
                  No people found
                </Text>
                <Text style={{ color: colors.text3, fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 260 }}>
                  Try a different name or username to find someone in the community.
                </Text>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}
              >
                {(searchResults ?? []).map((user, index) => {
                  const isFollowing = optimisticFollowed.has(user.id);
                  const initials = getInitials(user.name ?? "?");
                  return (
                    <View key={user.id}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 16,
                        }}
                      >
                        <InitialsAvatar
                          initials={initials}
                          size={46}
                          accentColor={colors.accent}
                        />
                        <View style={{ flex: 1, marginLeft: 12, marginRight: 10 }}>
                          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 1 }}>
                            {user.name}
                          </Text>
                          {user.username ? (
                            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "500", marginBottom: 2 }}>
                              @{user.username}
                            </Text>
                          ) : null}
                          {user.role ? (
                            <Text style={{ color: colors.text3, fontSize: 12 }} numberOfLines={1}>
                              {user.role}
                            </Text>
                          ) : null}
                        </View>
                        <Pressable
                          onPress={() => followMutation.mutate(user.id)}
                          testID={`follow-user-${user.id}`}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 100,
                            backgroundColor: isFollowing ? `${colors.accent}18` : `${colors.accent}28`,
                            borderWidth: 1,
                            borderColor: isFollowing ? `${colors.accent}30` : `${colors.accent}50`,
                          }}
                        >
                          {isFollowing ? (
                            <Check size={12} color={colors.accent} strokeWidth={2.5} />
                          ) : (
                            <UserPlus size={12} color={colors.accent} />
                          )}
                          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>
                            {isFollowing ? "Following" : "Follow"}
                          </Text>
                        </Pressable>
                      </View>
                      {index < (searchResults ?? []).length - 1 ? (
                        <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 74 }} />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        ) : (
          /* Explore / Trending View */
          <>
            {/* Hero Banner */}
            <Animated.View entering={FadeInDown.duration(300).springify()} style={{ marginHorizontal: 16, marginBottom: 24 }}>
              <View
                style={{
                  borderRadius: 24,
                  padding: 24,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: `${colors.accent}28`,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    top: -30,
                    right: -30,
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: `${colors.accent}08`,
                  }}
                />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: `${colors.accent}18`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Compass size={20} color={colors.accent} />
                  </View>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", letterSpacing: -0.2 }}>
                      Explore the Community
                    </Text>
                    <Text style={{ color: colors.text3, fontSize: 12 }}>
                      Connect with ambitious builders
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.text2, fontSize: 14, lineHeight: 20, marginBottom: 14 }}>
                  Search for people by name or username to connect, follow, and grow your network.
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      backgroundColor: `${colors.success}14`,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Sparkles size={12} color={colors.success} />
                    <Text style={{ color: colors.success, fontSize: 12, fontWeight: "600" }}>
                      Live community
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Trending Posts */}
            <Animated.View entering={FadeInDown.duration(350).delay(80).springify()} style={{ marginHorizontal: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", letterSpacing: -0.2 }}>
                  Trending in the Community
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={14} color={colors.accent} />
                  <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
                    Top posts
                  </Text>
                </View>
              </View>

              {postsLoading ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color={colors.accent} testID="posts-loading" />
                  <Text style={{ color: colors.text3, fontSize: 14, marginTop: 12 }}>
                    Loading community posts...
                  </Text>
                </View>
              ) : trendingPosts.length === 0 ? (
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 24,
                    padding: 36,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    gap: 12,
                  }}
                  testID="posts-empty-state"
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: `${colors.accent}12`,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 4,
                    }}
                  >
                    <MessageCircle size={28} color={colors.accent} />
                  </View>
                  <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", textAlign: "center" }}>
                    No posts yet
                  </Text>
                  <Text style={{ color: colors.text3, fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 240 }}>
                    Be the first to start a conversation. Share a milestone, insight, or challenge.
                  </Text>
                </View>
              ) : (
                trendingPosts.map((post, index) => {
                  const initials = getInitials(post.author?.name ?? "?");
                  const tagColor = getTagColor(post.category);
                  const reactionCount = post._count?.reactions ?? 0;
                  const commentCount = post._count?.comments ?? 0;
                  return (
                    <Animated.View
                      key={post.id}
                      entering={FadeInDown.duration(280).delay(index * 60).springify()}
                    >
                      <View
                        style={{
                          backgroundColor: colors.card,
                          borderRadius: 20,
                          padding: 16,
                          marginBottom: 12,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <InitialsAvatar
                              initials={initials}
                              size={36}
                              accentColor={colors.accent}
                            />
                            <View>
                              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                                {post.author?.name ?? "Unknown"}
                              </Text>
                              <Text style={{ color: colors.text3, fontSize: 12 }}>
                                {formatTimeAgo(post.createdAt)}
                              </Text>
                            </View>
                          </View>
                          <View
                            style={{
                              backgroundColor: `${tagColor}18`,
                              borderRadius: 8,
                              paddingHorizontal: 9,
                              paddingVertical: 4,
                            }}
                          >
                            <Text style={{ color: tagColor, fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>
                              {post.category}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={{ color: colors.text2, fontSize: 14, lineHeight: 21, marginBottom: 14 }}
                          numberOfLines={2}
                        >
                          {post.content}
                        </Text>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <Heart size={14} color={colors.text3} />
                            <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "500" }}>
                              {reactionCount >= 1000 ? `${(reactionCount / 1000).toFixed(1)}K` : reactionCount}
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <MessageCircle size={14} color={colors.text3} />
                            <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "500" }}>
                              {commentCount}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
