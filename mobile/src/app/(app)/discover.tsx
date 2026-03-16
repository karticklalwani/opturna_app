import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import {
  Search,
  TrendingUp,
  Users,
  Compass,
  ChevronRight,
  X,
  Heart,
  MessageCircle,
  UserPlus,
  Check,
  Flame,
  Zap,
  BookOpen,
  DollarSign,
  Dumbbell,
  Code2,
  Leaf,
  Briefcase,
  Lightbulb,
  Star,
  FileText,
  Clock,
  Apple,
  Book,
  User,
  Newspaper,
  Sparkles,
  Grid3x3,
} from "lucide-react-native";
import { useTheme, DARK } from "@/lib/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useRouter } from "expo-router";

// ─── Types ─────────────────────────────────────────────────────────────────

interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  role: string | null;
  isVerified: boolean;
  _count?: { followers?: number; following?: number };
}

interface Post {
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
    isVerified: boolean;
  };
  _count: { reactions: number; comments: number };
}

interface ContentItem {
  id: string;
  category: string;
  categoryLabel: string;
  title: string;
  summary: string;
  imageUrl: string;
  readTime: number;
  source: string;
  publishedAt: string;
  isFeatured: boolean;
  url: string;
}

interface ContentFeedData {
  featured: ContentItem[];
  latest: ContentItem[];
  recommended: ContentItem[];
  categories: Array<{ key: string; label: string; count: number }>;
}

// ─── Community categories ──────────────────────────────────────────────────

const CATEGORIES = [
  { key: "Todos", icon: Compass, color: "#4ADE80" },
  { key: "Negocios", icon: Briefcase, color: "#F59E0B" },
  { key: "Finanzas", icon: DollarSign, color: "#4ADE80" },
  { key: "Lifestyle", icon: Leaf, color: "#A78BFA" },
  { key: "Desarrollo Personal", icon: Lightbulb, color: "#F59E0B" },
  { key: "Filosofía", icon: BookOpen, color: "#60A5FA" },
  { key: "Tecnología", icon: Code2, color: "#34D399" },
  { key: "Fitness", icon: Dumbbell, color: "#F87171" },
  { key: "Espiritualidad", icon: Star, color: "#C084FC" },
  { key: "Proyectos", icon: Zap, color: "#FB923C" },
];

// ─── Content categories ────────────────────────────────────────────────────

const CONTENT_CATEGORY_ICONS: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  finanzas: DollarSign,
  fitness: Dumbbell,
  nutricion: Apple,
  meditacion: Leaf,
  negocios: Briefcase,
  filosofia: BookOpen,
  salud: Heart,
  lecturas: Book,
  autoayuda: Lightbulb,
  personal: User,
};

const CONTENT_CATEGORY_COLORS: Record<string, string> = {
  finanzas: "#4ADE80",
  fitness: "#F87171",
  nutricion: "#FB923C",
  meditacion: "#A78BFA",
  negocios: "#F59E0B",
  filosofia: "#60A5FA",
  salud: "#EF4444",
  lecturas: "#34D399",
  autoayuda: "#FBBF24",
  personal: "#C084FC",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
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

const CATEGORY_POST_COLORS: Record<string, string> = {
  negocios: "#F59E0B",
  finanzas: "#4ADE80",
  lifestyle: "#A78BFA",
  "desarrollo personal": "#F59E0B",
  filosofía: "#60A5FA",
  tecnología: "#34D399",
  fitness: "#F87171",
  espiritualidad: "#C084FC",
  proyectos: "#FB923C",
  progress: "#4ADE80",
  mindset: "#F59E0B",
  challenge: "#F87171",
  milestone: "#60A5FA",
  business: "#F59E0B",
  finance: "#4ADE80",
  trading: "#F87171",
  growth: "#34D399",
  startups: "#60A5FA",
  productivity: "#A78BFA",
};

function getCategoryColor(cat: string): string {
  return CATEGORY_POST_COLORS[cat?.toLowerCase()] ?? "#4ADE80";
}

function getContentCategoryColor(cat: string): string {
  return CONTENT_CATEGORY_COLORS[cat?.toLowerCase()] ?? "#4ADE80";
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  colors,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  colors: typeof DARK;
}) {
  return (
    <View
      style={{
        width: width as number,
        height,
        borderRadius,
        backgroundColor: colors.bg4,
        opacity: 0.6,
      }}
    />
  );
}

function ContentLoadingSkeleton({ colors }: { colors: typeof DARK }) {
  return (
    <View style={{ paddingBottom: 40 }}>
      {/* Featured skeleton */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <SkeletonBox width={120} height={16} borderRadius={6} colors={colors} />
        <View style={{ marginTop: 12, flexDirection: "row", gap: 12 }}>
          <SkeletonBox width={280} height={180} borderRadius={16} colors={colors} />
          <SkeletonBox width={280} height={180} borderRadius={16} colors={colors} />
        </View>
      </View>
      {/* Latest skeleton */}
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        <SkeletonBox width={140} height={16} borderRadius={6} colors={colors} />
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              gap: 12,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <SkeletonBox width={80} height={80} borderRadius={10} colors={colors} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBox width="90%" height={14} borderRadius={4} colors={colors} />
              <SkeletonBox width="70%" height={12} borderRadius={4} colors={colors} />
              <SkeletonBox width="50%" height={10} borderRadius={4} colors={colors} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Avatar({
  initials,
  image,
  size = 44,
  accentColor,
}: {
  initials: string;
  image?: string | null;
  size?: number;
  accentColor: string;
}) {
  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: `${accentColor}40`,
        }}
      />
    );
  }
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
      <Text style={{ color: accentColor, fontSize: size * 0.33, fontWeight: "700" }}>
        {initials}
      </Text>
    </View>
  );
}

function SectionHeader({
  title,
  icon,
  iconColor,
  colors,
  onSeeAll,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  colors: typeof DARK;
  onSeeAll?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
        paddingHorizontal: 20,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: `${iconColor}18`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.3 }}>
          {title}
        </Text>
      </View>
      <Pressable
        style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
        onPress={onSeeAll}
      >
        <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "500" }}>Ver todos</Text>
        <ChevronRight size={14} color={colors.text3} />
      </Pressable>
    </View>
  );
}

// ─── Content Card Components ──────────────────────────────────────────────────

function FeaturedCard({
  item,
  colors,
}: {
  item: ContentItem;
  colors: typeof DARK;
}) {
  const catColor = getContentCategoryColor(item.category);
  return (
    <Pressable
      onPress={() => item.url ? Linking.openURL(item.url) : null}
      style={{
        width: 280,
        height: 180,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: catColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <ExpoImage
        source={{ uri: item.imageUrl }}
        style={{ position: "absolute", width: "100%", height: "100%" }}
        contentFit="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.92)"]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 140 }}
      />
      {/* Category badge top-right */}
      <View
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          backgroundColor: `${catColor}dd`,
          borderRadius: 100,
          paddingHorizontal: 9,
          paddingVertical: 4,
        }}
      >
        <Text style={{ color: "#000", fontSize: 10, fontWeight: "700" }}>
          {item.categoryLabel}
        </Text>
      </View>
      {item.isFeatured ? (
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            backgroundColor: "rgba(245,158,11,0.85)",
            borderRadius: 100,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Flame size={10} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>Destacado</Text>
        </View>
      ) : null}
      {/* Bottom content */}
      <View style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
        <Text
          style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "500", marginBottom: 4 }}
        >
          {item.source}
        </Text>
        <Text
          style={{ color: "#fff", fontSize: 15, fontWeight: "800", lineHeight: 20, letterSpacing: -0.3 }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: 100,
            paddingHorizontal: 8,
            paddingVertical: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Clock size={10} color="rgba(255,255,255,0.7)" />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "600" }}>
            {item.readTime} min
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function NewsCard({
  item,
  colors,
}: {
  item: ContentItem;
  colors: typeof DARK;
}) {
  const catColor = getContentCategoryColor(item.category);
  return (
    <Pressable
      onPress={() => item.url ? Linking.openURL(item.url) : null}
      style={{
        flexDirection: "row",
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
      }}
    >
      <ExpoImage
        source={{ uri: item.imageUrl }}
        style={{ width: 80, height: 80, borderRadius: 10 }}
        contentFit="cover"
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 19, marginBottom: 4 }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={{ color: colors.text3, fontSize: 12, lineHeight: 17, marginBottom: 6 }}
          numberOfLines={1}
        >
          {item.summary}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Text style={{ color: colors.text4, fontSize: 11 }}>{item.source}</Text>
          <Text style={{ color: colors.text4, fontSize: 11 }}>·</Text>
          <Text style={{ color: colors.text4, fontSize: 11 }}>{formatTimeAgo(item.publishedAt)}</Text>
          <View
            style={{
              backgroundColor: `${catColor}20`,
              borderRadius: 6,
              paddingHorizontal: 7,
              paddingVertical: 2,
              marginLeft: 2,
            }}
          >
            <Text style={{ color: catColor, fontSize: 10, fontWeight: "600" }}>
              {item.categoryLabel}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function RecommendedCard({
  item,
  colors,
}: {
  item: ContentItem;
  colors: typeof DARK;
}) {
  const catColor = getContentCategoryColor(item.category);
  return (
    <Pressable
      onPress={() => item.url ? Linking.openURL(item.url) : null}
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      <View style={{ position: "relative" }}>
        <ExpoImage
          source={{ uri: item.imageUrl }}
          style={{ width: "100%", aspectRatio: 4 / 3 }}
          contentFit="cover"
        />
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: `${catColor}dd`,
            borderRadius: 100,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color: "#000", fontSize: 9, fontWeight: "700" }}>
            {item.categoryLabel}
          </Text>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <Text
          style={{ color: colors.text, fontSize: 13, fontWeight: "700", lineHeight: 18, marginBottom: 6 }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: colors.text4, fontSize: 11 }} numberOfLines={1}>{item.source}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Clock size={10} color={colors.text4} />
            <Text style={{ color: colors.text4, fontSize: 11 }}>{item.readTime}m</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Content Feed component ───────────────────────────────────────────────────

function ContentFeed({ colors }: { colors: typeof DARK }) {
  const [activeContentCategory, setActiveContentCategory] = useState<string>("todo");

  const { data: feedData, isLoading, isError } = useQuery({
    queryKey: ["content-feed"],
    queryFn: () => api.get<ContentFeedData>("/api/content/feed"),
  });

  const dynamicCategories = feedData?.categories ?? [];
  const allCategoryOption = { key: "todo", label: "Todo", count: 0 };
  const allCategories = [allCategoryOption, ...dynamicCategories];

  const isAll = activeContentCategory === "todo";

  const filterItems = (items: ContentItem[]): ContentItem[] => {
    if (isAll) return items;
    return items.filter((item) => item.category?.toLowerCase() === activeContentCategory.toLowerCase());
  };

  const featuredItems = filterItems(feedData?.featured ?? []);
  const latestItems = filterItems(feedData?.latest ?? []);
  const recommendedItems = filterItems(feedData?.recommended ?? []);

  return (
    <View testID="content-feed-mode">
      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12, paddingTop: 4 }}
      >
        {allCategories.map((cat) => {
          const isActive = activeContentCategory === cat.key;
          const IconComp = CONTENT_CATEGORY_ICONS[cat.key] ?? Compass;
          const catColor = CONTENT_CATEGORY_COLORS[cat.key] ?? "#4ADE80";
          return (
            <Pressable
              key={cat.key}
              onPress={() => setActiveContentCategory(cat.key)}
              testID={`content-category-${cat.key}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 100,
                backgroundColor: isActive ? "#4ADE80" : colors.card,
                borderWidth: 1,
                borderColor: isActive ? "#4ADE80" : colors.border,
              }}
            >
              {cat.key !== "todo" ? (
                <IconComp
                  size={13}
                  color={isActive ? "#000" : colors.text3}
                  strokeWidth={2}
                />
              ) : null}
              <Text
                style={{
                  color: isActive ? "#000" : colors.text3,
                  fontSize: 13,
                  fontWeight: isActive ? "700" : "400",
                }}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ContentLoadingSkeleton colors={colors} />
      ) : isError || (!feedData) ? (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={{
            alignItems: "center",
            paddingVertical: 70,
            paddingHorizontal: 32,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: `${colors.accent}12`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 4,
            }}
          >
            <Newspaper size={30} color={colors.accent} />
          </View>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", textAlign: "center" }}>
            Sin contenido disponible
          </Text>
          <Text style={{ color: colors.text3, fontSize: 14, textAlign: "center", lineHeight: 21 }}>
            No hay contenido disponible en este momento. Vuelve pronto.
          </Text>
        </Animated.View>
      ) : (
        <>
          {/* Destacado section - only when "Todo" */}
          {isAll && featuredItems.length > 0 ? (
            <Animated.View
              entering={FadeInDown.duration(320).delay(0).springify()}
              style={{ marginBottom: 28 }}
              testID="content-featured"
            >
              <SectionHeader
                title="Destacado"
                icon={<Flame size={14} color="#F59E0B" />}
                iconColor="#F59E0B"
                colors={colors}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 4 }}
              >
                {featuredItems.map((item) => (
                  <FeaturedCard key={item.id} item={item} colors={colors} />
                ))}
              </ScrollView>
            </Animated.View>
          ) : null}

          {/* Ultimas Noticias */}
          {latestItems.length > 0 ? (
            <Animated.View
              entering={FadeInDown.duration(320).delay(80).springify()}
              style={{ marginBottom: 28 }}
              testID="content-latest"
            >
              <SectionHeader
                title="Últimas Noticias"
                icon={<Newspaper size={14} color="#60A5FA" />}
                iconColor="#60A5FA"
                colors={colors}
              />
              <View style={{ paddingHorizontal: 16, gap: 10 }}>
                {latestItems.slice(0, 5).map((item, i) => (
                  <Animated.View key={item.id} entering={FadeInDown.duration(260).delay(i * 50)}>
                    <NewsCard item={item} colors={colors} />
                  </Animated.View>
                ))}
              </View>
              {latestItems.length > 5 ? (
                <Pressable
                  style={{ alignItems: "center", marginTop: 14, paddingVertical: 6 }}
                >
                  <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
                    Ver más
                  </Text>
                </Pressable>
              ) : null}
            </Animated.View>
          ) : null}

          {/* Recomendado para ti */}
          {recommendedItems.length > 0 ? (
            <Animated.View
              entering={FadeInDown.duration(320).delay(160).springify()}
              style={{ marginBottom: 28, paddingHorizontal: 16 }}
              testID="content-recommended"
            >
              <View style={{ marginBottom: 14, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: `${"#C084FC"}18`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sparkles size={14} color="#C084FC" />
                    </View>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.3 }}>
                      Recomendado para ti
                    </Text>
                  </View>
                  <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "500" }}>Ver todos</Text>
                    <ChevronRight size={14} color={colors.text3} />
                  </Pressable>
                </View>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {recommendedItems.slice(0, 6).map((item, i) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.duration(260).delay(i * 60)}
                    style={{ width: "47%" }}
                  >
                    <RecommendedCard item={item} colors={colors} />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {featuredItems.length === 0 && latestItems.length === 0 && recommendedItems.length === 0 ? (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 10 }}
            >
              <Grid3x3 size={28} color={colors.text4} />
              <Text style={{ color: colors.text3, fontSize: 14, textAlign: "center" }}>
                No hay contenido en esta categoría.
              </Text>
            </Animated.View>
          ) : null}
        </>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [mode, setMode] = useState<"comunidad" | "contenido">("comunidad");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [optimisticFollowed, setOptimisticFollowed] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<TextInput>(null);

  const isSearching = searchQuery.length > 1;

  // ── Queries ────────────────────────────────────────────────────────────

  const { data: searchUsers, isLoading: searchLoading } = useQuery({
    queryKey: ["users-search", searchQuery],
    queryFn: () =>
      api.get<SearchUser[]>(`/api/users/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: isSearching,
  });

  const { data: trendingPostsData, isLoading: postsLoading } = useQuery({
    queryKey: ["posts-trending"],
    queryFn: async () => {
      try {
        const data = await api.get<Post[]>("/api/posts?filter=trending");
        return data;
      } catch {
        return api.get<Post[]>("/api/posts");
      }
    },
    enabled: !isSearching && mode === "comunidad",
  });

  // ── Mutations ──────────────────────────────────────────────────────────

  const followMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/api/users/${userId}/follow`, {}),
    onMutate: (userId: string) => {
      setOptimisticFollowed((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        return next;
      });
    },
    onError: (_err, userId: string) => {
      setOptimisticFollowed((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        return next;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-suggested"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId: string) => api.post(`/api/posts/${postId}/react`, { type: "like" }),
    onMutate: (postId: string) => {
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (next.has(postId)) next.delete(postId);
        else next.add(postId);
        return next;
      });
    },
  });

  // ── Derived data ───────────────────────────────────────────────────────

  const topPosts = trendingPostsData
    ? [...trendingPostsData]
        .sort((a, b) => (b._count?.reactions ?? 0) - (a._count?.reactions ?? 0))
        .filter((p) => {
          if (activeCategory === "Todos") return true;
          return p.category?.toLowerCase() === activeCategory.toLowerCase();
        })
        .slice(0, 5)
    : [];

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="discover-screen">
      {/* ── Sticky Header ── */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
          {/* Title row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 27,
                  fontWeight: "800",
                  color: colors.text,
                  letterSpacing: -0.8,
                }}
              >
                Descubrir
              </Text>
              {/* Mode toggle replaces subtitle */}
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 8,
                  backgroundColor: colors.card,
                  borderRadius: 100,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 3,
                  gap: 0,
                }}
              >
                <Pressable
                  onPress={() => setMode("comunidad")}
                  testID="community-mode"
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor: mode === "comunidad" ? "#4ADE80" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: mode === "comunidad" ? "#000" : colors.text3,
                      fontSize: 13,
                      fontWeight: mode === "comunidad" ? "700" : "400",
                    }}
                  >
                    Comunidad
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMode("contenido")}
                  testID="content-feed-mode"
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor: mode === "contenido" ? "#4ADE80" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: mode === "contenido" ? "#000" : colors.text3,
                      fontSize: 13,
                      fontWeight: mode === "contenido" ? "700" : "400",
                    }}
                  >
                    Contenido
                  </Text>
                </Pressable>
              </View>
            </View>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Compass size={18} color={colors.accent} />
            </View>
          </View>

          {/* Search bar - only in Comunidad mode */}
          {mode === "comunidad" ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.card,
                borderRadius: 14,
                paddingHorizontal: 14,
                gap: 10,
                borderWidth: 1,
                borderColor: isSearching ? `${colors.accent}50` : colors.border,
              }}
            >
              <Search size={16} color={isSearching ? colors.accent : colors.text3} />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar personas, temas, posts..."
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
              ) : searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")} testID="search-clear">
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: colors.text4,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={11} color={colors.bg} strokeWidth={2.5} />
                  </View>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Categories horizontal scroll - Comunidad mode only, not searching */}
        {mode === "comunidad" && !isSearching ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              const IconComp = cat.icon;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setActiveCategory(cat.key)}
                  testID={`category-${cat.key}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 100,
                    backgroundColor: isActive ? `${cat.color}20` : colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? `${cat.color}60` : colors.border,
                  }}
                >
                  <IconComp
                    size={13}
                    color={isActive ? cat.color : colors.text3}
                    strokeWidth={2}
                  />
                  <Text
                    style={{
                      color: isActive ? cat.color : colors.text3,
                      fontSize: 13,
                      fontWeight: isActive ? "600" : "400",
                    }}
                  >
                    {cat.key}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </SafeAreaView>

      {/* ── Scrollable Body ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardDismissMode="on-drag"
      >
        {mode === "contenido" ? (
          /* ─────────────────── CONTENT FEED ──────────────────── */
          <Animated.View entering={FadeIn.duration(200)}>
            <ContentFeed colors={colors} />
          </Animated.View>
        ) : isSearching ? (
          /* ─────────────────── SEARCH RESULTS ──────────────────── */
          <Animated.View entering={FadeIn.duration(180)} style={{ paddingTop: 4 }}>
            <Text
              style={{
                color: colors.text3,
                fontSize: 12,
                fontWeight: "500",
                letterSpacing: 0.5,
                paddingHorizontal: 20,
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              {searchLoading
                ? "Buscando..."
                : `${(searchUsers ?? []).length} resultado${(searchUsers ?? []).length !== 1 ? "s" : ""}`}
            </Text>

            {searchLoading ? (
              <View style={{ alignItems: "center", paddingVertical: 60 }} testID="search-loading-state">
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={{ color: colors.text3, fontSize: 14, marginTop: 14 }}>
                  Buscando en la comunidad...
                </Text>
              </View>
            ) : (searchUsers ?? []).length === 0 ? (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={{
                  alignItems: "center",
                  paddingVertical: 70,
                  paddingHorizontal: 32,
                  gap: 12,
                }}
                testID="search-empty-state"
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: `${colors.accent}12`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                  }}
                >
                  <Users size={30} color={colors.accent} />
                </View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  Sin resultados
                </Text>
                <Text
                  style={{
                    color: colors.text3,
                    fontSize: 14,
                    textAlign: "center",
                    lineHeight: 21,
                  }}
                >
                  Prueba otro nombre o usuario para encontrar alguien en la comunidad.
                </Text>
              </Animated.View>
            ) : (
              <View style={{ paddingHorizontal: 16, gap: 10 }}>
                {(searchUsers ?? []).map((user, i) => {
                  const isFollowing = optimisticFollowed.has(user.id);
                  const initials = getInitials(user.name ?? "?");
                  return (
                    <Animated.View
                      key={user.id}
                      entering={FadeInDown.duration(260).delay(i * 50)}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: colors.card,
                          borderRadius: 18,
                          padding: 14,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Avatar
                          initials={initials}
                          image={user.image}
                          size={48}
                          accentColor={colors.accent}
                        />
                        <View style={{ flex: 1, marginLeft: 12, marginRight: 10 }}>
                          <Text
                            style={{
                              color: colors.text,
                              fontSize: 15,
                              fontWeight: "700",
                              marginBottom: 1,
                            }}
                          >
                            {user.name}
                          </Text>
                          {user.username ? (
                            <Text
                              style={{
                                color: colors.accent,
                                fontSize: 12,
                                fontWeight: "500",
                                marginBottom: 2,
                              }}
                            >
                              @{user.username}
                            </Text>
                          ) : null}
                          {user.role ? (
                            <Text
                              style={{ color: colors.text3, fontSize: 12 }}
                              numberOfLines={1}
                            >
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
                            gap: 5,
                            paddingHorizontal: 14,
                            paddingVertical: 9,
                            borderRadius: 100,
                            backgroundColor: isFollowing
                              ? `${colors.accent}14`
                              : `${colors.accent}22`,
                            borderWidth: 1,
                            borderColor: isFollowing
                              ? `${colors.accent}30`
                              : `${colors.accent}55`,
                          }}
                        >
                          {isFollowing ? (
                            <Check size={12} color={colors.accent} strokeWidth={2.5} />
                          ) : (
                            <UserPlus size={12} color={colors.accent} />
                          )}
                          <Text
                            style={{
                              color: colors.accent,
                              fontSize: 12,
                              fontWeight: "600",
                            }}
                          >
                            {isFollowing ? "Siguiendo" : "Seguir"}
                          </Text>
                        </Pressable>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        ) : (
          /* ─────────────────── EXPLORE VIEW ──────────────────── */
          <>
            {/* ── Trending Posts ── */}
            <Animated.View
              entering={FadeInDown.duration(320).delay(0).springify()}
              style={{ marginTop: 4, marginBottom: 28 }}
            >
              <SectionHeader
                title="Tendencias"
                icon={<TrendingUp size={14} color="#F59E0B" />}
                iconColor="#F59E0B"
                colors={colors}
              />

              {postsLoading ? (
                <View
                  style={{ alignItems: "center", paddingVertical: 40 }}
                  testID="posts-loading"
                >
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={{ color: colors.text3, fontSize: 14, marginTop: 12 }}>
                    Cargando posts...
                  </Text>
                </View>
              ) : topPosts.length === 0 ? (
                <View
                  style={{
                    marginHorizontal: 20,
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    padding: 32,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    gap: 10,
                  }}
                  testID="posts-empty-state"
                >
                  <MessageCircle size={28} color={colors.text4} />
                  <Text style={{ color: colors.text3, fontSize: 14, textAlign: "center" }}>
                    No hay posts en esta categoría todavía.
                  </Text>
                </View>
              ) : (
                <View style={{ paddingHorizontal: 16, gap: 10 }}>
                  {topPosts.map((post, index) => {
                    const initials = getInitials(post.author?.name ?? "?");
                    const tagColor = getCategoryColor(post.category);
                    const reactionCount = post._count?.reactions ?? 0;
                    const commentCount = post._count?.comments ?? 0;
                    return (
                      <Animated.View
                        key={post.id}
                        entering={FadeInDown.duration(280).delay(index * 55).springify()}
                      >
                        <Pressable
                          testID={`post-card-${post.id}`}
                          onPress={() => router.push(`/post-detail?postId=${post.id}` as any)}
                          style={{
                            backgroundColor: colors.card,
                            borderRadius: 20,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: colors.border,
                            overflow: "hidden",
                          }}
                        >
                          {/* rank badge */}
                          {index < 3 ? (
                            <View
                              style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                backgroundColor:
                                  index === 0
                                    ? "#F59E0B18"
                                    : index === 1
                                    ? "#9CA3AF18"
                                    : "#CD7F3218",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: "800",
                                  color:
                                    index === 0
                                      ? "#F59E0B"
                                      : index === 1
                                      ? "#9CA3AF"
                                      : "#CD7F32",
                                }}
                              >
                                #{index + 1}
                              </Text>
                            </View>
                          ) : null}

                          {/* author row */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 12,
                            }}
                          >
                            <Avatar
                              initials={initials}
                              image={post.author?.image}
                              size={36}
                              accentColor={tagColor}
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  color: colors.text,
                                  fontSize: 14,
                                  fontWeight: "600",
                                }}
                              >
                                {post.author?.name ?? "Usuario"}
                              </Text>
                              <Text style={{ color: colors.text3, fontSize: 11 }}>
                                {formatTimeAgo(post.createdAt)} ·{" "}
                                {post.author?.role ?? "Miembro"}
                              </Text>
                            </View>
                            <View
                              style={{
                                backgroundColor: `${tagColor}18`,
                                borderRadius: 8,
                                paddingHorizontal: 9,
                                paddingVertical: 4,
                              }}
                            >
                              <Text
                                style={{
                                  color: tagColor,
                                  fontSize: 10,
                                  fontWeight: "600",
                                  textTransform: "capitalize",
                                }}
                              >
                                {post.category}
                              </Text>
                            </View>
                          </View>

                          {/* content */}
                          <Text
                            style={{
                              color: colors.text2,
                              fontSize: 14,
                              lineHeight: 21,
                              marginBottom: 14,
                            }}
                            numberOfLines={2}
                          >
                            {post.content}
                          </Text>

                          {/* image */}
                          {post.imageUrl ? (
                            <Image
                              source={{ uri: post.imageUrl }}
                              style={{
                                width: "100%",
                                height: 180,
                                borderRadius: 12,
                                marginBottom: 12,
                              }}
                              resizeMode="cover"
                            />
                          ) : null}
                          {post.fileUrl && !post.imageUrl ? (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                                backgroundColor: `${colors.accent}12`,
                                borderRadius: 10,
                                padding: 10,
                                marginBottom: 12,
                              }}
                            >
                              <FileText size={14} color={colors.accent} />
                              <Text
                                style={{
                                  color: colors.accent,
                                  fontSize: 12,
                                  fontWeight: "500",
                                  flex: 1,
                                }}
                                numberOfLines={1}
                              >
                                {post.fileName ?? "Archivo adjunto"}
                              </Text>
                            </View>
                          ) : null}

                          {/* stats */}
                          <View
                            style={{ flexDirection: "row", alignItems: "center", gap: 18 }}
                          >
                            <Pressable
                              onPress={() => likeMutation.mutate(post.id)}
                              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                              testID={`like-button-${post.id}`}
                            >
                              <Heart
                                size={13}
                                color={likedPosts.has(post.id) ? "#EF4444" : colors.text3}
                                fill={likedPosts.has(post.id) ? "#EF4444" : "none"}
                              />
                              <Text
                                style={{
                                  color: likedPosts.has(post.id) ? "#EF4444" : colors.text3,
                                  fontSize: 12,
                                  fontWeight: "500",
                                }}
                              >
                                {formatCount(reactionCount + (likedPosts.has(post.id) ? 1 : 0))}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => router.push(`/post-detail?postId=${post.id}`)}
                              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                              testID={`comment-button-${post.id}`}
                            >
                              <MessageCircle size={13} color={colors.text3} />
                              <Text
                                style={{
                                  color: colors.text3,
                                  fontSize: 12,
                                  fontWeight: "500",
                                }}
                              >
                                {formatCount(commentCount)}
                              </Text>
                            </Pressable>
                            {reactionCount > 20 ? (
                              <View
                                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                              >
                                <Flame size={12} color="#F59E0B" />
                                <Text
                                  style={{
                                    color: "#F59E0B",
                                    fontSize: 11,
                                    fontWeight: "600",
                                  }}
                                >
                                  Trending
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
