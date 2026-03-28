import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Play,
  TrendingUp,
  Plus,
  Heart,
  Eye,
  ChevronRight,
  Sparkles,
  Video,
  Zap,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import type { MediaPost, Story } from "@/types/media";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;
const THUMB_SIZE = (SCREEN_WIDTH - 48) / 3;

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Stories Bar ──────────────────────────────────────────────────────────────
function StoriesBar({ stories }: { stories: Story[] }) {
  const router = useRouter();
  const colors = useTheme((s) => s.colors);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingVertical: 4 }}
      style={{ flexGrow: 0 }}
    >
      {/* Add story button */}
      <Pressable
        onPress={() => router.push("/media-upload" as any)}
        style={{ alignItems: "center", gap: 6 }}
        testID="add-story-button"
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.bg3,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={24} color={colors.accent} strokeWidth={2} />
        </View>
        <Text style={{ color: colors.text2, fontSize: 11 }}>Tu historia</Text>
      </Pressable>

      {stories.map((story) => (
        <Pressable key={story.id} style={{ alignItems: "center", gap: 6 }}>
          <LinearGradient
            colors={[colors.accent, "#3B82F6", "#A78BFA"]}
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              padding: 2,
              alignItems: "center",
              justifyContent: "center",
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: colors.bg,
                backgroundColor: colors.bg4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {story.authorAvatar ? (
                <Image
                  source={{ uri: story.authorAvatar }}
                  style={{ width: 62, height: 62 }}
                  contentFit="cover"
                />
              ) : (
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
                  {(story.authorName || "?")[0]}
                </Text>
              )}
            </View>
          </LinearGradient>
          <Text style={{ color: colors.text2, fontSize: 11 }} numberOfLines={1}>
            {story.authorName?.split(" ")[0] ?? "Usuario"}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Video Thumbnail Grid Item ────────────────────────────────────────────────
function GridVideoItem({
  item,
  index,
  onPress,
}: {
  item: MediaPost;
  index: number;
  onPress: () => void;
}) {
  const colors = useTheme((s) => s.colors);
  const isVideo = item.type === "video" || item.type === "reel";
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
      <Pressable
        onPress={onPress}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE * 1.4,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: colors.bg4,
        }}
        testID="grid-video-item"
      >
        <Image
          source={{ uri: item.thumbnailUrl ?? item.url }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48 }}
        />
        {isVideo ? (
          <View style={{ position: "absolute", top: 6, left: 6 }}>
            <Play size={12} color={colors.text} fill={colors.text} strokeWidth={2} />
          </View>
        ) : null}
        <View
          style={{
            position: "absolute",
            bottom: 6,
            left: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Heart size={10} color={colors.text} strokeWidth={2} />
          <Text style={{ color: colors.text, fontSize: 10, fontWeight: "600" }}>
            {formatCount(item.likesCount)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Trending Card ────────────────────────────────────────────────────────────
function TrendingCard({ item, onPress }: { item: MediaPost; onPress: () => void }) {
  const colors = useTheme((s) => s.colors);
  const isVideo = item.type === "video" || item.type === "reel";
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 160,
        marginRight: 12,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: colors.bg3,
      }}
      testID="trending-card"
    >
      <View style={{ height: 200, position: "relative" }}>
        <Image
          source={{ uri: item.thumbnailUrl ?? item.url }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80 }}
        />
        {isVideo ? (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={12} color={colors.text} fill={colors.text} strokeWidth={2} />
          </View>
        ) : null}
        <View style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                overflow: "hidden",
                backgroundColor: colors.bg4,
              }}
            >
              {item.authorAvatar ? (
                <Image
                  source={{ uri: item.authorAvatar }}
                  style={{ width: 20, height: 20 }}
                  contentFit="cover"
                />
              ) : null}
            </View>
            <Text
              style={{ color: colors.text, fontSize: 11, fontWeight: "600" }}
              numberOfLines={1}
            >
              {item.authorName ?? ""}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ padding: 8 }}>
        <Text
          style={{ color: colors.text, fontSize: 12, fontWeight: "600", lineHeight: 16 }}
          numberOfLines={2}
        >
          {item.caption ?? ""}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Eye size={10} color={colors.text3} strokeWidth={2} />
            <Text style={{ color: colors.text3, fontSize: 10 }}>{formatCount(item.views)}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Heart size={10} color={colors.text3} strokeWidth={2} />
            <Text style={{ color: colors.text3, fontSize: 10 }}>{formatCount(item.likesCount)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  icon: Icon,
  iconColor,
  onSeeAll,
}: {
  title: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  iconColor: string;
  onSeeAll?: () => void;
}) {
  const colors = useTheme((s) => s.colors);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: iconColor + "22",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={14} color={iconColor} strokeWidth={2} />
        </View>
        <Text
          style={{
            color: colors.text,
            fontSize: 17,
            fontWeight: "800",
            letterSpacing: -0.5,
          }}
        >
          {title}
        </Text>
      </View>
      {onSeeAll ? (
        <Pressable
          onPress={onSeeAll}
          style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
          testID="see-all-button"
        >
          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>Ver todos</Text>
          <ChevronRight size={14} color={colors.accent} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function MediaDiscoverScreen() {
  const router = useRouter();
  const colors = useTheme((s) => s.colors);

  const { data: storiesData } = useQuery({
    queryKey: ["media-stories"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/media/stories`);
      if (!res.ok) throw new Error("Failed to fetch stories");
      const json = await res.json();
      return json.data as Story[];
    },
  });

  const { data: discoverData, isLoading, isError, refetch } = useQuery({
    queryKey: ["media-discover"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/media/discover`);
      if (!res.ok) throw new Error("Failed to fetch discover");
      const json = await res.json();
      return json.data as { trending: MediaPost[]; recent: MediaPost[]; images: MediaPost[] };
    },
  });

  const { data: reelsData } = useQuery({
    queryKey: ["media-reels-preview"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/media/reels?limit=9`);
      if (!res.ok) throw new Error("Failed to fetch reels");
      const json = await res.json();
      return json.data as { posts: MediaPost[] };
    },
  });

  const stories = storiesData ?? [];
  const trending = discoverData?.trending ?? [];
  const recent = discoverData?.recent ?? [];
  const reels = reelsData?.posts ?? [];

  const openReels = (startIndex: number = 0) => {
    router.push(`/reels-feed?startIndex=${startIndex}` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="media-discover-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 26,
                  fontWeight: "900",
                  letterSpacing: -1,
                }}
              >
                Media
              </Text>
              <Text style={{ color: colors.text3, fontSize: 13, marginTop: 2 }}>
                Videos · Reels · Stories
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/media-upload" as any)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
              testID="upload-button"
            >
              <Plus size={20} color={colors.bg} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Stories */}
        {stories.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.accent,
                  }}
                />
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
                  Historias activas
                </Text>
              </View>
            </View>
            <StoriesBar stories={stories} />
          </View>
        ) : null}

        {/* Hero — Open Reels Feed */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Pressable
            onPress={() => openReels(0)}
            style={{ borderRadius: 18, overflow: "hidden", height: 180 }}
            testID="open-reels-hero"
          >
            {trending[0] ? (
              <Image
                source={{ uri: trending[0].thumbnailUrl ?? trending[0].url }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <LinearGradient colors={[colors.bg2, colors.bg4]} style={{ flex: 1 }} />
            )}
            <LinearGradient
              colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.8)"]}
              style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
            />
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: colors.accent + "33",
                  borderWidth: 2,
                  borderColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Play size={28} color={colors.accent} fill={colors.accent} strokeWidth={2} />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "900",
                  letterSpacing: -0.5,
                }}
              >
                Abrir Reels
              </Text>
              <Text style={{ color: colors.text2, fontSize: 13, marginTop: 4 }}>
                Feed vertical · {reels.length} videos
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Trending */}
        {trending.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <SectionHeader
              title="Trending"
              icon={TrendingUp}
              iconColor="#F59E0B"
              onSeeAll={() => openReels(0)}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              {trending.map((item) => (
                <TrendingCard key={item.id} item={item} onPress={() => openReels(0)} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Reels Grid */}
        {reels.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <SectionHeader
              title="Reels"
              icon={Zap}
              iconColor={colors.accent}
              onSeeAll={() => openReels(0)}
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {reels.slice(0, 9).map((item, index) => (
                <GridVideoItem
                  key={item.id}
                  item={item}
                  index={index}
                  onPress={() => openReels(index)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Recent */}
        {recent.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <SectionHeader title="Recientes" icon={Sparkles} iconColor="#A78BFA" />
            {recent.slice(0, 5).map((item, i) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(i * 60).springify()}>
                <Pressable
                  onPress={() => openReels(0)}
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    backgroundColor: colors.bg2,
                    borderRadius: 14,
                    overflow: "hidden",
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.bg4,
                  }}
                  testID="recent-item"
                >
                  <View style={{ width: 90, height: 90, backgroundColor: colors.bg4 }}>
                    <Image
                      source={{ uri: item.thumbnailUrl ?? item.url }}
                      style={{ width: 90, height: 90 }}
                      contentFit="cover"
                    />
                    {item.type === "video" || item.type === "reel" ? (
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          left: 0,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Play size={16} color={colors.text} fill={colors.text} strokeWidth={2} />
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1, padding: 10, justifyContent: "center" }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 13,
                        fontWeight: "700",
                        marginBottom: 4,
                      }}
                      numberOfLines={2}
                    >
                      {item.caption ?? ""}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          overflow: "hidden",
                          backgroundColor: colors.bg4,
                        }}
                      >
                        {item.authorAvatar ? (
                          <Image
                            source={{ uri: item.authorAvatar }}
                            style={{ width: 18, height: 18 }}
                            contentFit="cover"
                          />
                        ) : null}
                      </View>
                      <Text style={{ color: colors.text3, fontSize: 11 }}>{item.authorName ?? ""}</Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 6,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Heart size={11} color={colors.text2} strokeWidth={2} />
                        <Text style={{ color: colors.text3, fontSize: 11 }}>
                          {formatCount(item.likesCount)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Eye size={11} color={colors.text2} strokeWidth={2} />
                        <Text style={{ color: colors.text3, fontSize: 11 }}>
                          {formatCount(item.views)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : null}

        {/* Error state */}
        {isError ? (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }} testID="error-view">
            <Text style={{ color: colors.text3, fontSize: 15 }}>Error al cargar contenido</Text>
            <Pressable
              onPress={() => refetch()}
              style={{
                backgroundColor: colors.accent,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 10,
              }}
              testID="retry-button"
            >
              <Text style={{ color: colors.bg, fontSize: 14, fontWeight: "700" }}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Upload prompt when empty */}
        {!isLoading && !isError && trending.length === 0 && reels.length === 0 ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Pressable
              onPress={() => router.push("/media-upload" as any)}
              style={{
                backgroundColor: colors.bg3,
                borderRadius: 18,
                padding: 32,
                alignItems: "center",
                gap: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              testID="upload-prompt"
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.accent + "1A",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.accent + "4D",
                }}
              >
                <Video size={24} color={colors.accent} strokeWidth={2} />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                No hay contenido todavia
              </Text>
              <Text style={{ color: colors.text3, fontSize: 13, textAlign: "center" }}>
                Comparte un video o imagen con la comunidad
              </Text>
              <View
                style={{
                  backgroundColor: colors.accent,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: colors.bg, fontSize: 14, fontWeight: "700" }}>Subir ahora</Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }} testID="loading-indicator">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
