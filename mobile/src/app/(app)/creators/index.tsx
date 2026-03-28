import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Search,
  ChevronRight,
  BadgeCheck,
  Star,
  Globe,
  Youtube,
  Mic,
  Play,
  Radio,
  Users,
  Briefcase,
  TrendingUp,
  BarChart2,
  Rocket,
  Cpu,
  BookOpen,
  Brain,
  Zap,
  DollarSign,
  Award,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import type {
  CreatorProfile,
  CreatorInterview,
  CreatorLive,
  CreatorCategory,
} from "@/types/creators";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  business: Briefcase,
  finance: TrendingUp,
  trading: BarChart2,
  startups: Rocket,
  ai: Cpu,
  creator: Star,
  education: BookOpen,
  mindset: Brain,
  productivity: Zap,
  investing: DollarSign,
};

const CATEGORY_COLORS: Record<string, string> = {
  business: "#F59E0B",
  finance: "#4ADE80",
  trading: "#60A5FA",
  startups: "#FB923C",
  ai: "#A78BFA",
  creator: "#F472B6",
  education: "#34D399",
  mindset: "#C084FC",
  productivity: "#FBBF24",
  investing: "#4ADE80",
};

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatScheduledDate(dateStr: string | null): string {
  if (!dateStr) return "Próximamente";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (days > 0) return `En ${days} días`;
  if (hours > 0) return `En ${hours}h`;
  return "Pronto";
}

function VerifiedBadge({ size = 14 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size + 4,
        height: size + 4,
        borderRadius: (size + 4) / 2,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <BadgeCheck size={size} color="#000" strokeWidth={2.5} />
    </View>
  );
}

function PartnerBadge() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: "rgba(245,158,11,0.15)",
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(245,158,11,0.3)",
      }}
    >
      <Award size={10} color="#F59E0B" />
      <Text
        style={{
          color: "#F59E0B",
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.5,
        }}
      >
        PARTNER
      </Text>
    </View>
  );
}

function FeaturedCreatorCard({
  creator,
  onPress,
}: {
  creator: CreatorProfile;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const catColor = CATEGORY_COLORS[creator.category || ""] || colors.accent;
  const tags: string[] = creator.tags ? JSON.parse(creator.tags) : [];

  return (
    <Pressable
      onPress={onPress}
      testID={`featured-creator-${creator.slug}`}
      style={{
        width: 200,
        marginRight: 12,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ height: 70, backgroundColor: colors.bg4, position: "relative" }}>
        {creator.bannerUrl ? (
          <Image
            source={{ uri: creator.bannerUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[catColor + "33", colors.bg2]}
            style={{ flex: 1 }}
          />
        )}
        {creator.officialPartner ? (
          <View style={{ position: "absolute", top: 8, right: 8 }}>
            <PartnerBadge />
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
        <View
          style={{
            marginTop: -22,
            marginBottom: 8,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: colors.bg,
              overflow: "hidden",
              backgroundColor: colors.bg4,
            }}
          >
            {creator.avatarUrl ? (
              <Image
                source={{ uri: creator.avatarUrl }}
                style={{ width: 44, height: 44 }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                <Text
                  style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}
                >
                  {creator.name[0]}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Users size={10} color={colors.text3} />
            <Text style={{ color: colors.text3, fontSize: 11 }}>
              {formatCount(creator.followersCount)}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 14,
              fontWeight: "700",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {creator.name}
          </Text>
          {creator.verified ? <VerifiedBadge size={12} /> : null}
        </View>

        <Text
          style={{ color: colors.text3, fontSize: 12, lineHeight: 16 }}
          numberOfLines={2}
        >
          {creator.shortBio}
        </Text>

        {tags.length > 0 ? (
          <View
            style={{
              flexDirection: "row",
              gap: 4,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                backgroundColor: catColor + "22",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: catColor, fontSize: 10, fontWeight: "600" }}>
                {tags[0]}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function CreatorListCard({
  creator,
  onPress,
  index,
}: {
  creator: CreatorProfile;
  onPress: () => void;
  index: number;
}) {
  const { colors } = useTheme();
  const catColor = CATEGORY_COLORS[creator.category || ""] || colors.accent;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Pressable
        onPress={onPress}
        testID={`creator-card-${creator.slug}`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.bg2,
          borderRadius: 14,
          padding: 14,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: colors.bg4,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            overflow: "hidden",
            backgroundColor: colors.bg4,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {creator.avatarUrl ? (
            <Image
              source={{ uri: creator.avatarUrl }}
              style={{ width: 52, height: 52 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <Text
                style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}
              >
                {creator.name[0]}
              </Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 2,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}
              numberOfLines={1}
            >
              {creator.name}
            </Text>
            {creator.verified ? <VerifiedBadge size={12} /> : null}
            {creator.officialPartner ? <PartnerBadge /> : null}
          </View>
          <Text
            style={{ color: colors.text3, fontSize: 13 }}
            numberOfLines={1}
          >
            {creator.shortBio}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            {creator.category ? (
              <View
                style={{
                  backgroundColor: catColor + "22",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 5,
                }}
              >
                <Text
                  style={{ color: catColor, fontSize: 11, fontWeight: "600" }}
                >
                  {creator.category}
                </Text>
              </View>
            ) : null}
            <Text style={{ color: colors.text4, fontSize: 11 }}>
              {formatCount(creator.followersCount)} seguidores
            </Text>
          </View>
        </View>

        <ChevronRight size={16} color={colors.text4} />
      </Pressable>
    </Animated.View>
  );
}

function InterviewCard({
  item,
  onPress,
}: {
  item: CreatorInterview;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      testID={`interview-card-${item.id}`}
      style={{
        width: 240,
        marginRight: 12,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{ height: 130, backgroundColor: colors.bg4, position: "relative" }}
      >
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[colors.bg4, colors.bg2]}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Play size={32} color={colors.accent} />
          </LinearGradient>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "rgba(0,0,0,0.7)",
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 6,
          }}
        >
          {item.interviewType === "podcast" ? (
            <Mic size={10} color={colors.accent} />
          ) : (
            <Play size={10} color={colors.accent} />
          )}
          <Text
            style={{
              color: colors.accent,
              fontSize: 9,
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            {item.interviewType}
          </Text>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        {item.creator ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                overflow: "hidden",
                backgroundColor: colors.border,
              }}
            >
              {item.creator.avatarUrl ? (
                <Image
                  source={{ uri: item.creator.avatarUrl }}
                  style={{ width: 20, height: 20 }}
                  contentFit="cover"
                />
              ) : null}
            </View>
            <Text style={{ color: colors.text2, fontSize: 11 }}>
              {item.creator.name}
            </Text>
            {item.creator.verified ? <VerifiedBadge size={10} /> : null}
          </View>
        ) : null}
        <Text
          style={{
            color: colors.text,
            fontSize: 13,
            fontWeight: "600",
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>
    </Pressable>
  );
}

function LiveCard({ item }: { item: CreatorLive }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.bg2,
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor:
          item.status === "live" ? "rgba(74,222,128,0.3)" : colors.bg4,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          overflow: "hidden",
          backgroundColor: colors.bg4,
        }}
      >
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={{ width: 48, height: 48 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Radio
              size={20}
              color={item.status === "live" ? colors.accent : colors.text3}
            />
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 3,
          }}
        >
          {item.status === "live" ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(239,68,68,0.15)",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 5,
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: colors.error,
                }}
              />
              <Text style={{ color: colors.error, fontSize: 10, fontWeight: "700" }}>
                EN VIVO
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(96,165,250,0.15)",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: "#60A5FA", fontSize: 10, fontWeight: "700" }}>
                PROXIMO
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.creator ? (
          <Text style={{ color: colors.text3, fontSize: 11, marginTop: 2 }}>
            {item.creator.name}
          </Text>
        ) : null}
        <Text style={{ color: colors.text4, fontSize: 11, marginTop: 2 }}>
          {formatScheduledDate(item.scheduledAt)}
        </Text>
      </View>
    </View>
  );
}

function CategoryPill({
  category,
  selected,
  onPress,
}: {
  category: CreatorCategory;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const color = CATEGORY_COLORS[category.slug] || colors.accent;
  const Icon = CATEGORY_ICONS[category.slug] || Star;
  return (
    <Pressable
      onPress={onPress}
      testID={`category-pill-${category.slug}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: selected ? color + "22" : colors.card,
        borderWidth: 1,
        borderColor: selected ? color + "55" : colors.border,
      }}
    >
      <Icon size={12} color={selected ? color : colors.text3} />
      <Text
        style={{
          color: selected ? color : colors.text3,
          fontSize: 12,
          fontWeight: selected ? "700" : "500",
        }}
      >
        {category.name}
      </Text>
    </Pressable>
  );
}

function SectionHeader({
  title,
  subtitle,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <View>
        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: "800",
            letterSpacing: -0.5,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: colors.text3, fontSize: 12, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} testID="see-all-button">
          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
            Ver todos
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function CreatorsHubScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: categoriesData } = useQuery({
    queryKey: ["creator-categories"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/creators/categories`);
      const json = await res.json();
      return json.data as CreatorCategory[];
    },
  });

  const { data: creatorsData, isLoading: loadingCreators, isError: creatorsError, refetch: refetchCreators } = useQuery({
    queryKey: ["creators", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(
        `${BASE_URL}/api/creators?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch creators");
      const json = await res.json();
      return json.data as { creators: CreatorProfile[]; total: number };
    },
  });

  const { data: interviewsData } = useQuery({
    queryKey: ["creator-interviews"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/creators/interviews`);
      const json = await res.json();
      return json.data as CreatorInterview[];
    },
  });

  const { data: livesData } = useQuery({
    queryKey: ["creator-lives"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/creators/lives`);
      const json = await res.json();
      return json.data as CreatorLive[];
    },
  });

  const creators = creatorsData?.creators ?? [];
  const featured = creators.filter((c) => c.featured);
  const partners = creators.filter((c) => c.officialPartner);
  const categories = categoriesData ?? [];
  const interviews = interviewsData ?? [];
  const lives = livesData ?? [];

  const handleCreatorPress = (slug: string) => {
    router.push(`/creator-profile?slug=${slug}` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="creators-hub-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 26,
                  fontWeight: "900",
                  letterSpacing: -1,
                }}
              >
                Creators Hub
              </Text>
              <Text style={{ color: colors.text3, fontSize: 13, marginTop: 2 }}>
                Lideres, fundadores y partners
              </Text>
            </View>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.card,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Users size={18} color={colors.accent} />
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginTop: 12,
            }}
          >
            <Search size={16} color={colors.text4} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar creadores, empresas..."
              placeholderTextColor={colors.text4}
              style={{ flex: 1, color: colors.text, fontSize: 14 }}
              testID="creator-search-input"
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
          style={{ flexGrow: 0 }}
        >
          <CategoryPill
            category={{ slug: "", name: "Todos", icon: "compass" }}
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
          />
          {categories.map((cat) => (
            <CategoryPill
              key={cat.slug}
              category={cat}
              selected={selectedCategory === cat.slug}
              onPress={() =>
                setSelectedCategory(
                  cat.slug === selectedCategory ? null : cat.slug
                )
              }
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {loadingCreators ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator color={colors.accent} testID="creators-loading" />
          </View>
        ) : creatorsError ? (
          <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }} testID="creators-error">
            <Text style={{ color: colors.text3, fontSize: 15 }}>
              Error al cargar creadores
            </Text>
            <Pressable
              onPress={() => refetchCreators()}
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
        ) : (
          <>
            {featured.length > 0 && !selectedCategory && !searchQuery ? (
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingTop: 8,
                  marginBottom: 24,
                }}
              >
                <SectionHeader
                  title="Destacados"
                  subtitle="Perfiles verificados y relevantes"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0 }}
                >
                  {featured.map((creator) => (
                    <FeaturedCreatorCard
                      key={creator.id}
                      creator={creator}
                      onPress={() => handleCreatorPress(creator.slug)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {partners.length > 0 && !selectedCategory && !searchQuery ? (
              <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                <SectionHeader
                  title="Partners Oficiales"
                  subtitle="Colaboraciones estratégicas de Opturna"
                />
                {partners.map((creator, i) => (
                  <CreatorListCard
                    key={creator.id}
                    creator={creator}
                    onPress={() => handleCreatorPress(creator.slug)}
                    index={i}
                  />
                ))}
              </View>
            ) : null}

            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <SectionHeader
                title={
                  selectedCategory || searchQuery
                    ? "Resultados"
                    : "Todos los Creadores"
                }
                subtitle={`${creatorsData?.total ?? 0} perfiles`}
              />
              {creators.length === 0 ? (
                <View
                  style={{ alignItems: "center", paddingVertical: 40 }}
                  testID="creators-empty"
                >
                  <Users size={40} color={colors.text4} />
                  <Text style={{ color: colors.text3, fontSize: 16, fontWeight: "600", marginTop: 16, textAlign: "center" }}>
                    No hay creadores todavia
                  </Text>
                  <Text style={{ color: colors.text4, fontSize: 14, marginTop: 6, textAlign: "center" }}>
                    Se el primero en publicar.
                  </Text>
                </View>
              ) : (
                creators.map((creator, i) => (
                  <CreatorListCard
                    key={creator.id}
                    creator={creator}
                    onPress={() => handleCreatorPress(creator.slug)}
                    index={i}
                  />
                ))
              )}
            </View>

            {lives.length > 0 && !selectedCategory && !searchQuery ? (
              <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                <SectionHeader
                  title="Próximos Directos"
                  subtitle="Eventos en vivo de la comunidad"
                />
                {lives.map((live) => (
                  <LiveCard key={live.id} item={live} />
                ))}
              </View>
            ) : null}

            {interviews.length > 0 && !selectedCategory && !searchQuery ? (
              <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                <SectionHeader
                  title="Entrevistas"
                  subtitle="Conversaciones exclusivas"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0 }}
                >
                  {interviews.map((interview) => (
                    <InterviewCard
                      key={interview.id}
                      item={interview}
                      onPress={() => {
                        if (interview.mediaUrl)
                          Linking.openURL(interview.mediaUrl);
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
