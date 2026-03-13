import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import {
  Search,
  TrendingUp,
  Users,
  Compass,
  Play,
  Radio,
  Star,
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
  Eye,
} from "lucide-react-native";
import { useTheme, DARK } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

interface LiveSession {
  id: string;
  host: string;
  hostInitials: string;
  title: string;
  viewers: number;
  category: string;
  gradientStart: string;
  gradientEnd: string;
  avatarColor: string;
}

interface VideoCard {
  id: string;
  title: string;
  author: string;
  authorInitials: string;
  duration: string;
  views: number;
  thumbnail: string;
  accentColor: string;
  category: string;
}

// ─── Static mock data ────────────────────────────────────────────────────────

const LIVE_SESSIONS: LiveSession[] = [
  {
    id: "live-1",
    host: "Elena Márquez",
    hostInitials: "EM",
    title: "Cómo construir un negocio de 7 cifras desde cero",
    viewers: 1247,
    category: "Negocios",
    gradientStart: "#0F2027",
    gradientEnd: "#203A43",
    avatarColor: "#4ADE80",
  },
  {
    id: "live-2",
    host: "Rodrigo Vela",
    hostInitials: "RV",
    title: "Trading en vivo — analizando el mercado ahora",
    viewers: 892,
    category: "Finanzas",
    gradientStart: "#1a1a2e",
    gradientEnd: "#16213e",
    avatarColor: "#F59E0B",
  },
  {
    id: "live-3",
    host: "Sara Domínguez",
    hostInitials: "SD",
    title: "Productividad extrema: sistema de 90 días",
    viewers: 534,
    category: "Desarrollo",
    gradientStart: "#0d1b2a",
    gradientEnd: "#1b263b",
    avatarColor: "#A78BFA",
  },
];

const VIDEO_CARDS: VideoCard[] = [
  {
    id: "vid-1",
    title: "El framework mental para tomar decisiones bajo presión",
    author: "Marcos Ortega",
    authorInitials: "MO",
    duration: "18:34",
    views: 24800,
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80",
    accentColor: "#4ADE80",
    category: "Mindset",
  },
  {
    id: "vid-2",
    title: "Cómo levantar capital sin perder el control de tu empresa",
    author: "Laura Jiménez",
    authorInitials: "LJ",
    duration: "23:17",
    views: 18300,
    thumbnail: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&q=80",
    accentColor: "#F59E0B",
    category: "Finanzas",
  },
  {
    id: "vid-3",
    title: "Deep work en un mundo lleno de distracciones",
    author: "David Ruiz",
    authorInitials: "DR",
    duration: "15:42",
    views: 31200,
    thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80",
    accentColor: "#60A5FA",
    category: "Productividad",
  },
];

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

function PulsingDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.6, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: 10, height: 10, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#EF4444",
          },
          ringStyle,
        ]}
      />
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: "#EF4444",
        }}
      />
    </View>
  );
}

function SectionHeader({
  title,
  icon,
  iconColor,
  colors,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  colors: typeof DARK;
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
      <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "500" }}>Ver todos</Text>
        <ChevronRight size={14} color={colors.text3} />
      </Pressable>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [optimisticFollowed, setOptimisticFollowed] = useState<Set<string>>(new Set());
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
    enabled: !isSearching,
  });

  const { data: suggestedUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["users-suggested"],
    queryFn: () => api.get<SearchUser[]>("/api/users/search?q="),
    enabled: !isSearching,
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

  const displayedUsers = (suggestedUsers ?? []).slice(0, 6);

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
              <Text style={{ color: colors.text3, fontSize: 13, marginTop: 1 }}>
                Explora la comunidad
              </Text>
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

          {/* Search bar */}
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
        </View>

        {/* Categories horizontal scroll */}
        {!isSearching ? (
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
        {isSearching ? (
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

                          {/* stats */}
                          <View
                            style={{ flexDirection: "row", alignItems: "center", gap: 18 }}
                          >
                            <View
                              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                            >
                              <Heart size={13} color={colors.text3} />
                              <Text
                                style={{
                                  color: colors.text3,
                                  fontSize: 12,
                                  fontWeight: "500",
                                }}
                              >
                                {formatCount(reactionCount)}
                              </Text>
                            </View>
                            <View
                              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
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
                            </View>
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

            {/* ── Trending Users ── */}
            <Animated.View
              entering={FadeInDown.duration(320).delay(80).springify()}
              style={{ marginBottom: 28 }}
            >
              <SectionHeader
                title="Personas destacadas"
                icon={<Users size={14} color="#60A5FA" />}
                iconColor="#60A5FA"
                colors={colors}
              />

              {usersLoading ? (
                <View
                  style={{ alignItems: "center", paddingVertical: 30 }}
                  testID="users-loading"
                >
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : displayedUsers.length === 0 ? (
                <View
                  style={{
                    marginHorizontal: 20,
                    padding: 24,
                    backgroundColor: colors.card,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Users size={24} color={colors.text4} />
                  <Text style={{ color: colors.text3, fontSize: 13, textAlign: "center" }}>
                    No hay usuarios sugeridos todavía.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0 }}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                >
                  {displayedUsers.map((user, i) => {
                    const isFollowing = optimisticFollowed.has(user.id);
                    const initials = getInitials(user.name ?? "?");
                    const accentColors = [
                      "#4ADE80",
                      "#60A5FA",
                      "#F59E0B",
                      "#A78BFA",
                      "#F87171",
                      "#34D399",
                    ];
                    const userAccent = accentColors[i % accentColors.length]!;
                    const followerCount = user._count?.followers ?? Math.floor(Math.random() * 9000 + 100);
                    return (
                      <Animated.View
                        key={user.id}
                        entering={FadeInDown.duration(280).delay(i * 60).springify()}
                      >
                        <View
                          style={{
                            width: 148,
                            backgroundColor: colors.card,
                            borderRadius: 20,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: colors.border,
                            alignItems: "center",
                            gap: 10,
                          }}
                          testID={`user-card-${user.id}`}
                        >
                          <Avatar
                            initials={initials}
                            image={user.image}
                            size={52}
                            accentColor={userAccent}
                          />
                          <View style={{ alignItems: "center", gap: 2 }}>
                            <Text
                              style={{
                                color: colors.text,
                                fontSize: 13,
                                fontWeight: "700",
                                textAlign: "center",
                              }}
                              numberOfLines={1}
                            >
                              {user.name}
                            </Text>
                            {user.username ? (
                              <Text
                                style={{
                                  color: userAccent,
                                  fontSize: 11,
                                  fontWeight: "500",
                                }}
                              >
                                @{user.username}
                              </Text>
                            ) : null}
                            <Text
                              style={{
                                color: colors.text3,
                                fontSize: 11,
                                marginTop: 2,
                              }}
                            >
                              {formatCount(followerCount)} seguidores
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => followMutation.mutate(user.id)}
                            testID={`follow-suggested-${user.id}`}
                            style={{
                              width: "100%",
                              alignItems: "center",
                              paddingVertical: 8,
                              borderRadius: 100,
                              backgroundColor: isFollowing
                                ? `${userAccent}14`
                                : `${userAccent}22`,
                              borderWidth: 1,
                              borderColor: isFollowing
                                ? `${userAccent}30`
                                : `${userAccent}55`,
                            }}
                          >
                            <Text
                              style={{
                                color: userAccent,
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
                </ScrollView>
              )}
            </Animated.View>

            {/* ── Live Now ── */}
            <Animated.View
              entering={FadeInDown.duration(320).delay(160).springify()}
              style={{ marginBottom: 28 }}
            >
              <SectionHeader
                title="En directo ahora"
                icon={<Radio size={14} color="#EF4444" />}
                iconColor="#EF4444"
                colors={colors}
              />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                {LIVE_SESSIONS.map((session, i) => (
                  <Animated.View
                    key={session.id}
                    entering={FadeInDown.duration(280).delay(i * 70).springify()}
                  >
                    <Pressable
                      testID={`live-card-${session.id}`}
                      style={{
                        width: SCREEN_WIDTH * 0.72,
                        borderRadius: 22,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: "#EF444420",
                      }}
                    >
                      {/* Background gradient via layered views */}
                      <View
                        style={{
                          backgroundColor: session.gradientStart,
                          paddingTop: 20,
                          paddingBottom: 18,
                          paddingHorizontal: 18,
                        }}
                      >
                        {/* Live badge */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 14,
                          }}
                        >
                          <PulsingDot />
                          <Text
                            style={{
                              color: "#EF4444",
                              fontSize: 11,
                              fontWeight: "700",
                              letterSpacing: 1,
                            }}
                          >
                            EN VIVO
                          </Text>
                          <View style={{ flex: 1 }} />
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: "#FFFFFF14",
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 100,
                            }}
                          >
                            <Eye size={11} color="#FFFFFF80" />
                            <Text style={{ color: "#FFFFFF80", fontSize: 11, fontWeight: "500" }}>
                              {formatCount(session.viewers)}
                            </Text>
                          </View>
                        </View>

                        {/* Host row */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 12,
                          }}
                        >
                          <View
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 19,
                              backgroundColor: `${session.avatarColor}20`,
                              borderWidth: 2,
                              borderColor: session.avatarColor,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: session.avatarColor,
                                fontSize: 13,
                                fontWeight: "700",
                              }}
                            >
                              {session.hostInitials}
                            </Text>
                          </View>
                          <View>
                            <Text
                              style={{
                                color: "#FFFFFFCC",
                                fontSize: 13,
                                fontWeight: "600",
                              }}
                            >
                              {session.host}
                            </Text>
                            <Text style={{ color: "#FFFFFF60", fontSize: 11 }}>
                              {session.category}
                            </Text>
                          </View>
                        </View>

                        {/* Title */}
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 15,
                            fontWeight: "700",
                            lineHeight: 21,
                            marginBottom: 14,
                          }}
                          numberOfLines={2}
                        >
                          {session.title}
                        </Text>

                        {/* Join button */}
                        <View
                          style={{
                            backgroundColor: "#EF444422",
                            borderRadius: 100,
                            borderWidth: 1,
                            borderColor: "#EF444450",
                            paddingVertical: 9,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#EF4444",
                              fontSize: 13,
                              fontWeight: "700",
                              letterSpacing: 0.2,
                            }}
                          >
                            Unirse al directo
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>

            {/* ── Trending Videos ── */}
            <Animated.View
              entering={FadeInDown.duration(320).delay(240).springify()}
              style={{ marginBottom: 28 }}
            >
              <SectionHeader
                title="Videos destacados"
                icon={<Play size={14} color="#A78BFA" />}
                iconColor="#A78BFA"
                colors={colors}
              />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                {VIDEO_CARDS.map((video, i) => (
                  <Animated.View
                    key={video.id}
                    entering={FadeInDown.duration(280).delay(i * 70).springify()}
                  >
                    <Pressable
                      testID={`video-card-${video.id}`}
                      style={{
                        width: SCREEN_WIDTH * 0.62,
                        backgroundColor: colors.card,
                        borderRadius: 20,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      {/* Thumbnail */}
                      <View style={{ position: "relative" }}>
                        <Image
                          source={{ uri: video.thumbnail }}
                          style={{ width: "100%", height: 118 }}
                          resizeMode="cover"
                        />
                        {/* Dark overlay */}
                        <View
                          style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: "#00000040",
                          }}
                        />
                        {/* Play button */}
                        <View
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 21,
                              backgroundColor: "#FFFFFF22",
                              borderWidth: 1.5,
                              borderColor: "#FFFFFF60",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                          </View>
                        </View>
                        {/* Duration badge */}
                        <View
                          style={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
                            backgroundColor: "#000000BB",
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>
                            {video.duration}
                          </Text>
                        </View>
                        {/* Category chip */}
                        <View
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            backgroundColor: `${video.accentColor}CC`,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 10,
                              fontWeight: "700",
                            }}
                          >
                            {video.category}
                          </Text>
                        </View>
                      </View>

                      {/* Info */}
                      <View style={{ padding: 12, gap: 8 }}>
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 13,
                            fontWeight: "600",
                            lineHeight: 18,
                          }}
                          numberOfLines={2}
                        >
                          {video.title}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <View
                            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                          >
                            <View
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                backgroundColor: `${video.accentColor}20`,
                                borderWidth: 1,
                                borderColor: `${video.accentColor}40`,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text
                                style={{
                                  color: video.accentColor,
                                  fontSize: 8,
                                  fontWeight: "800",
                                }}
                              >
                                {video.authorInitials}
                              </Text>
                            </View>
                            <Text style={{ color: colors.text3, fontSize: 11 }}>
                              {video.author}
                            </Text>
                          </View>
                          <View
                            style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                          >
                            <Eye size={11} color={colors.text3} />
                            <Text style={{ color: colors.text3, fontSize: 11 }}>
                              {formatCount(video.views)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>

            {/* ── Rising Stars ── */}
            <Animated.View
              entering={FadeInDown.duration(320).delay(300).springify()}
              style={{ marginBottom: 28 }}
            >
              <SectionHeader
                title="Rising Stars"
                icon={<Star size={14} color="#F59E0B" />}
                iconColor="#F59E0B"
                colors={colors}
              />

              <View style={{ paddingHorizontal: 16, gap: 10 }}>
                {(displayedUsers.slice(0, 3)).map((user, i) => {
                  const isFollowing = optimisticFollowed.has(user.id);
                  const initials = getInitials(user.name ?? "?");
                  const accentColors = ["#F59E0B", "#A78BFA", "#60A5FA"];
                  const userAccent = accentColors[i % accentColors.length]!;
                  const followerCount =
                    user._count?.followers ?? Math.floor(Math.random() * 5000 + 500);
                  const growth = ["+142%", "+89%", "+67%"][i] ?? "+50%";
                  return (
                    <Animated.View
                      key={`rising-${user.id}`}
                      entering={FadeInDown.duration(270).delay(i * 60).springify()}
                    >
                      <Pressable
                        testID={`rising-star-${user.id}`}
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
                        {/* rank */}
                        <Text
                          style={{
                            color: userAccent,
                            fontSize: 14,
                            fontWeight: "800",
                            width: 28,
                            textAlign: "center",
                          }}
                        >
                          {i + 1}
                        </Text>

                        <Avatar
                          initials={initials}
                          image={user.image}
                          size={44}
                          accentColor={userAccent}
                        />

                        <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                          <Text
                            style={{
                              color: colors.text,
                              fontSize: 14,
                              fontWeight: "700",
                            }}
                          >
                            {user.name}
                          </Text>
                          <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>
                            {formatCount(followerCount)} seguidores
                          </Text>
                        </View>

                        <View style={{ alignItems: "flex-end", gap: 6 }}>
                          <View
                            style={{
                              backgroundColor: "#4ADE8018",
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                            }}
                          >
                            <Text
                              style={{
                                color: "#4ADE80",
                                fontSize: 11,
                                fontWeight: "700",
                              }}
                            >
                              {growth}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => followMutation.mutate(user.id)}
                            testID={`follow-rising-${user.id}`}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 6,
                              borderRadius: 100,
                              backgroundColor: isFollowing
                                ? `${userAccent}14`
                                : `${userAccent}22`,
                              borderWidth: 1,
                              borderColor: isFollowing
                                ? `${userAccent}30`
                                : `${userAccent}55`,
                            }}
                          >
                            <Text
                              style={{
                                color: userAccent,
                                fontSize: 11,
                                fontWeight: "600",
                              }}
                            >
                              {isFollowing ? "Siguiendo" : "Seguir"}
                            </Text>
                          </Pressable>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}

                {displayedUsers.length === 0 && !usersLoading ? (
                  <View
                    style={{
                      padding: 24,
                      backgroundColor: colors.card,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: colors.text3, fontSize: 13 }}>
                      Sin datos disponibles todavía.
                    </Text>
                  </View>
                ) : null}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
