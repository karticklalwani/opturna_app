import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Share,
} from "react-native";
import { Image } from "expo-image";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeIn,
} from "react-native-reanimated";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ChevronLeft,
  Play,
  Volume2,
  VolumeX,
  Music2,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import type { MediaPost, MediaComment } from "@/types/media";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;
const DEMO_USER_ID = "current-user";

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Video Player via WebView ─────────────────────────────────────────────────
function VideoPlayer({ url, isActive, muted }: { url: string; isActive: boolean; muted: boolean }) {
  const videoHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #000; width: 100vw; height: 100vh; overflow: hidden; }
        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      </style>
    </head>
    <body>
      <video
        src="${url}"
        ${isActive ? "autoplay" : ""}
        loop
        playsinline
        ${muted ? "muted" : ""}
        webkit-playsinline
        preload="auto"
        id="vid"
      ></video>
      <script>
        var vid = document.getElementById('vid');
        ${isActive ? "vid.play().catch(function(){});" : "vid.pause();"}
      </script>
    </body>
    </html>
  `;

  return (
    <WebView
      source={{ html: videoHtml }}
      style={{ flex: 1, backgroundColor: "#000" }}
      scrollEnabled={false}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      allowsAirPlayForMediaPlayback={false}
      javaScriptEnabled={true}
      domStorageEnabled={false}
    />
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionButton({
  icon: Icon,
  count,
  onPress,
  active = false,
  color,
  activeColor,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number; fill: string }>;
  count?: number;
  onPress?: () => void;
  active?: boolean;
  color?: string;
  activeColor?: string;
}) {
  const colors = useTheme((s) => s.colors);
  const scale = useSharedValue(1);
  const resolvedColor = color ?? colors.text;
  const resolvedActiveColor = activeColor ?? colors.error;

  const handlePress = () => {
    scale.value = withSequence(withSpring(1.3), withSpring(1));
    onPress?.();
  };

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={handlePress} style={{ alignItems: "center", gap: 4 }} testID="action-button">
      <Animated.View style={animStyle}>
        <Icon
          size={30}
          color={active ? resolvedActiveColor : resolvedColor}
          strokeWidth={active ? 2.5 : 2}
          fill={active ? resolvedActiveColor : "transparent"}
        />
      </Animated.View>
      {count !== undefined && (
        <Text
          style={{
            color: colors.text,
            fontSize: 12,
            fontWeight: "700",
            textShadowColor: "rgba(0,0,0,0.5)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {formatCount(count)}
        </Text>
      )}
    </Pressable>
  );
}

// ─── Comments Sheet ───────────────────────────────────────────────────────────
function CommentsSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const colors = useTheme((s) => s.colors);
  const { data } = useQuery({
    queryKey: ["media-comments", postId],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/media/${postId}/comments`);
      const json = await res.json();
      return json.data as MediaComment[];
    },
  });

  const comments = data ?? [];

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.65,
        backgroundColor: colors.bg2,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
          Comentarios ({comments.length})
        </Text>
        <Pressable onPress={onClose}>
          <Text style={{ color: colors.text3, fontSize: 14 }}>Cerrar</Text>
        </Pressable>
      </View>
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.bg2,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                overflow: "hidden",
                backgroundColor: colors.bg4,
              }}
            >
              {item.authorAvatar ? (
                <Image
                  source={{ uri: item.authorAvatar }}
                  style={{ width: 36, height: 36 }}
                  contentFit="cover"
                />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text2, fontSize: 12, fontWeight: "600", marginBottom: 2 }}>
                {item.authorName || "Usuario"}
              </Text>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{item.content}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: colors.text4 }}>Sin comentarios aún</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Single Post Item ─────────────────────────────────────────────────────────
function PostItem({ item, isActive }: { item: MediaPost; isActive: boolean }) {
  const colors = useTheme((s) => s.colors);
  const [liked, setLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(item.likesCount);
  const [saved, setSaved] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(true);
  const [showComments, setShowComments] = useState<boolean>(false);
  const router = useRouter();

  const isVideo = item.type === "video" || item.type === "reel";
  const tags: string[] = item.tags
    ? (() => { try { return JSON.parse(item.tags!); } catch { return []; } })()
    : [];

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE_URL}/api/media/${item.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEMO_USER_ID }),
      });
      return res.json();
    },
    onMutate: () => {
      const wasLiked = liked;
      setLiked((prev) => !prev);
      setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE_URL}/api/media/${item.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEMO_USER_ID }),
      });
      return res.json();
    },
    onMutate: () => setSaved((prev) => !prev),
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.caption || "Mira este vídeo en Opturna"} \n${item.url}`,
        url: item.url,
      });
    } catch {}
  };

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: colors.bg }} testID="post-item">
      {/* Media Content */}
      {isVideo && isActive ? (
        <VideoPlayer url={item.url} isActive={isActive} muted={muted} />
      ) : (
        <View style={{ flex: 1 }}>
          <Image
            source={{ uri: item.thumbnailUrl || item.url }}
            style={{ flex: 1 }}
            contentFit="cover"
          />
          {isVideo && !isActive ? (
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
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Play size={28} color={colors.text} fill={colors.text} strokeWidth={2} />
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* Gradient overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "transparent", "transparent", "rgba(0,0,0,0.85)"]}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        pointerEvents="none"
      />

      {/* Right side actions */}
      <View
        style={{
          position: "absolute",
          right: 12,
          bottom: 120,
          gap: 24,
          alignItems: "center",
        }}
      >
        {/* Author avatar */}
        <View style={{ position: "relative" }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              borderWidth: 2,
              borderColor: colors.text,
              overflow: "hidden",
              backgroundColor: colors.bg4,
            }}
          >
            {item.authorAvatar ? (
              <Image
                source={{ uri: item.authorAvatar }}
                style={{ width: 48, height: 48 }}
                contentFit="cover"
              />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                  {(item.authorName || "?")[0]}
                </Text>
              </View>
            )}
          </View>
          <View
            style={{
              position: "absolute",
              bottom: -8,
              alignSelf: "center",
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.bg, fontSize: 14, fontWeight: "900" }}>+</Text>
          </View>
        </View>

        {/* Like */}
        <ActionButton
          icon={Heart as any}
          count={likesCount}
          onPress={() => likeMutation.mutate()}
          active={liked}
          activeColor={colors.error}
        />

        {/* Comment */}
        <ActionButton
          icon={MessageCircle as any}
          count={item.commentsCount}
          onPress={() => setShowComments(true)}
        />

        {/* Save */}
        <ActionButton
          icon={Bookmark as any}
          count={item.savesCount}
          onPress={() => saveMutation.mutate()}
          active={saved}
          activeColor={colors.accent}
        />

        {/* Share */}
        <ActionButton icon={Share2 as any} onPress={handleShare} />

        {/* Mute toggle (video only) */}
        {isVideo ? (
          <Pressable
            onPress={() => setMuted((m) => !m)}
            style={{ alignItems: "center" }}
            testID="mute-toggle"
          >
            {muted ? (
              <VolumeX size={26} color={colors.text} strokeWidth={2} />
            ) : (
              <Volume2 size={26} color={colors.text} strokeWidth={2} />
            )}
          </Pressable>
        ) : null}
      </View>

      {/* Bottom info */}
      <View
        style={{
          position: "absolute",
          left: 12,
          bottom: 32,
          right: 80,
          gap: 8,
        }}
      >
        {/* Author */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
            @{item.authorUsername || "usuario"}
          </Text>
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.bg, fontSize: 9, fontWeight: "900" }}>✓</Text>
          </View>
        </View>

        {/* Caption */}
        {item.caption ? (
          <Text
            style={{ color: colors.text, fontSize: 14, lineHeight: 20, maxWidth: "90%" }}
            numberOfLines={3}
          >
            {item.caption}
          </Text>
        ) : null}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {tags.slice(0, 3).map((tag: string) => (
              <Text key={tag} style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
                #{tag.replace(/\s/g, "")}{" "}
              </Text>
            ))}
          </View>
        )}

        {/* Music / category */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Music2 size={12} color={colors.text2} strokeWidth={2} />
          <Text style={{ color: colors.text2, fontSize: 12 }}>
            {item.category || "Opturna"}
            {item.views > 0 ? ` · ${formatCount(item.views)} vistas` : ""}
          </Text>
        </View>
      </View>

      {/* Comments overlay */}
      {showComments ? (
        <Animated.View
          entering={FadeIn}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setShowComments(false)} />
          <CommentsSheet postId={item.id} onClose={() => setShowComments(false)} />
        </Animated.View>
      ) : null}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ReelsFeedScreen() {
  const router = useRouter();
  const colors = useTheme((s) => s.colors);
  const { startIndex } = useLocalSearchParams<{ startIndex?: string }>();
  const [activeIndex, setActiveIndex] = useState<number>(parseInt(startIndex || "0"));
  const flatListRef = useRef<FlatList>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["media-reels-feed"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/media/reels?limit=20`);
      if (!res.ok) throw new Error("Failed to fetch reels");
      const json = await res.json();
      return json.data as { posts: MediaPost[]; total: number };
    },
  });

  const posts = data?.posts ?? [];

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 });

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}
        testID="loading-indicator"
      >
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12 }}
        testID="error-view"
      >
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
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="reels-feed-screen">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Back button */}
      <SafeAreaView
        edges={["top"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          pointerEvents: "box-none",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 4,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems: "center",
              justifyContent: "center",
            }}
            testID="back-button"
          >
            <ChevronLeft size={20} color={colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Reels</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <PostItem item={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        initialScrollIndex={parseInt(startIndex || "0")}
        ListEmptyComponent={
          <View
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.text4, fontSize: 16 }}>No hay contenido todavia</Text>
          </View>
        }
        testID="reels-flatlist"
      />
    </View>
  );
}
