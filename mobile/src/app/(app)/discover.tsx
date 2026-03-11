import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Search,
  UserPlus,
  Check,
  Heart,
  MessageCircle,
  TrendingUp,
  Users,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";

interface Profile {
  id: string;
  initials: string;
  name: string;
  role: string;
  followers: string;
  tags: string[];
}

interface Connection {
  id: string;
  initials: string;
  name: string;
  role: string;
  bio: string;
  sharedGoals: number;
}

interface TrendingPost {
  id: string;
  authorInitials: string;
  authorName: string;
  time: string;
  excerpt: string;
  reactions: number;
  comments: number;
  tag: string;
  tagColor: string;
}

const CATEGORIES = ["All", "Business", "Finance", "Trading", "Productivity", "Startups", "Growth"];

const PROFILES: Profile[] = [
  { id: "1", initials: "AC", name: "Alex Chen", role: "Startup Founder", followers: "12.4K", tags: ["B2B SaaS", "Fundraising", "GTM"] },
  { id: "2", initials: "SR", name: "Sofia Reyes", role: "Finance Analyst", followers: "8.7K", tags: ["Markets", "Equity", "Options"] },
  { id: "3", initials: "MJ", name: "Marcus Johnson", role: "Growth Strategist", followers: "21.1K", tags: ["Funnels", "Retention", "PLG"] },
  { id: "4", initials: "EK", name: "Elena Kovacs", role: "Product Designer", followers: "5.2K", tags: ["UX", "Mobile", "Systems"] },
  { id: "5", initials: "DP", name: "David Park", role: "Crypto Trader", followers: "18.9K", tags: ["DeFi", "Alts", "On-chain"] },
];

const CONNECTIONS: Connection[] = [
  { id: "1", initials: "RT", name: "Rachel Torres", role: "Serial Entrepreneur", bio: "Built 3 companies from scratch. Currently scaling a fintech in LATAM.", sharedGoals: 5 },
  { id: "2", initials: "JL", name: "James Liu", role: "Angel Investor", bio: "25+ portfolio companies. Focused on enterprise and AI infrastructure.", sharedGoals: 3 },
  { id: "3", initials: "NK", name: "Nina Kowalski", role: "Growth Lead at Stripe", bio: "Obsessed with B2B growth loops and product-led acquisition models.", sharedGoals: 4 },
  { id: "4", initials: "OA", name: "Omar Al-Hassan", role: "Quant Trader", bio: "Algorithmic systems, risk modeling, and volatility strategies.", sharedGoals: 2 },
];

const TRENDING_POSTS: TrendingPost[] = [
  {
    id: "1",
    authorInitials: "AC",
    authorName: "Alex Chen",
    time: "2h ago",
    excerpt: "After 18 months of building in stealth, we just closed our Series A. Here's what I wish someone had told me about the fundraising process...",
    reactions: 284,
    comments: 47,
    tag: "Startups",
    tagColor: "#00B4D8",
  },
  {
    id: "2",
    authorInitials: "SR",
    authorName: "Sofia Reyes",
    time: "5h ago",
    excerpt: "The macro setup heading into Q2 is unlike anything I've seen in a decade. Three charts that explain why the next 60 days matter more than the last 12 months...",
    reactions: 516,
    comments: 93,
    tag: "Finance",
    tagColor: "#00FF87",
  },
  {
    id: "3",
    authorInitials: "MJ",
    authorName: "Marcus Johnson",
    time: "1d ago",
    excerpt: "We doubled retention from 30% to 61% in 90 days without changing the product. The only thing we changed was our onboarding email sequence...",
    reactions: 1203,
    comments: 158,
    tag: "Growth",
    tagColor: "#FFD60A",
  },
  {
    id: "4",
    authorInitials: "DP",
    authorName: "David Park",
    time: "1d ago",
    excerpt: "On-chain data is showing accumulation patterns I haven't seen since the last cycle. Here's the wallet activity that has my attention right now...",
    reactions: 741,
    comments: 89,
    tag: "Trading",
    tagColor: "#FF3B30",
  },
];

function InitialsAvatar({
  initials,
  size = 44,
  accentColor,
  bgColor,
}: {
  initials: string;
  size?: number;
  accentColor: string;
  bgColor: string;
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredProfiles = PROFILES.filter((p) =>
    searchQuery.length === 0 ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConnections = CONNECTIONS.filter((c) =>
    searchQuery.length === 0 ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* Rising Creators */}
        <Animated.View entering={FadeInDown.duration(300).springify()} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 14 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", letterSpacing: -0.2 }}>
              Rising Creators
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <TrendingUp size={14} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
                Trending
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {filteredProfiles.map((profile) => {
              const isFollowing = followedIds.has(profile.id);
              return (
                <View
                  key={profile.id}
                  style={{
                    width: 175,
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <InitialsAvatar
                    initials={profile.initials}
                    size={52}
                    accentColor={colors.accent}
                    bgColor={colors.bg}
                  />
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 10, marginBottom: 2 }}>
                    {profile.name}
                  </Text>
                  <Text style={{ color: colors.text3, fontSize: 12, marginBottom: 4 }}>
                    {profile.role}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 }}>
                    <Users size={11} color={colors.text3} />
                    <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "500" }}>
                      {profile.followers}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => toggleFollow(profile.id)}
                    testID={`follow-creator-${profile.id}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      paddingVertical: 8,
                      borderRadius: 100,
                      backgroundColor: isFollowing ? `${colors.accent}20` : colors.accent,
                      marginBottom: 12,
                    }}
                  >
                    {isFollowing ? (
                      <Check size={12} color={colors.accent} strokeWidth={2.5} />
                    ) : (
                      <UserPlus size={12} color="#fff" />
                    )}
                    <Text
                      style={{
                        color: isFollowing ? colors.accent : "#fff",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </Pressable>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                    {profile.tags.map((tag) => (
                      <View
                        key={tag}
                        style={{
                          backgroundColor: `${colors.accent}12`,
                          borderRadius: 6,
                          paddingHorizontal: 7,
                          paddingVertical: 3,
                        }}
                      >
                        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "500" }}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Suggested Connections */}
        <Animated.View entering={FadeInDown.duration(350).delay(80).springify()} style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 14, letterSpacing: -0.2 }}>
            People With Similar Goals
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
            }}
          >
            {filteredConnections.map((conn, index) => {
              const isFollowing = followedIds.has(`conn-${conn.id}`);
              return (
                <View key={conn.id}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      padding: 16,
                    }}
                  >
                    <InitialsAvatar
                      initials={conn.initials}
                      size={46}
                      accentColor={colors.accent}
                      bgColor={colors.bg}
                    />
                    <View style={{ flex: 1, marginLeft: 12, marginRight: 10 }}>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 1 }}>
                        {conn.name}
                      </Text>
                      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "500", marginBottom: 5 }}>
                        {conn.role}
                      </Text>
                      <Text style={{ color: colors.text3, fontSize: 12, lineHeight: 18, marginBottom: 8 }} numberOfLines={2}>
                        {conn.bio}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: `${colors.success}14`,
                          borderRadius: 6,
                          paddingHorizontal: 7,
                          paddingVertical: 3,
                          alignSelf: "flex-start",
                        }}
                      >
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.success }} />
                        <Text style={{ color: colors.success, fontSize: 11, fontWeight: "600" }}>
                          {conn.sharedGoals} shared goals
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => toggleFollow(`conn-${conn.id}`)}
                      testID={`follow-conn-${conn.id}`}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 100,
                        backgroundColor: isFollowing ? `${colors.accent}18` : `${colors.accent}28`,
                        borderWidth: 1,
                        borderColor: isFollowing ? `${colors.accent}30` : `${colors.accent}50`,
                      }}
                    >
                      {isFollowing ? (
                        <Check size={11} color={colors.accent} strokeWidth={2.5} />
                      ) : (
                        <UserPlus size={11} color={colors.accent} />
                      )}
                      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>
                        {isFollowing ? "Following" : "Follow"}
                      </Text>
                    </Pressable>
                  </View>
                  {index < filteredConnections.length - 1 ? (
                    <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 74 }} />
                  ) : null}
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Trending Posts */}
        <Animated.View entering={FadeInDown.duration(350).delay(160).springify()} style={{ marginHorizontal: 16 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 14, letterSpacing: -0.2 }}>
            Trending in the Community
          </Text>
          {TRENDING_POSTS.map((post, index) => (
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
                      initials={post.authorInitials}
                      size={36}
                      accentColor={colors.accent}
                      bgColor={colors.bg}
                    />
                    <View>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                        {post.authorName}
                      </Text>
                      <Text style={{ color: colors.text3, fontSize: 12 }}>
                        {post.time}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor: `${post.tagColor}18`,
                      borderRadius: 8,
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: post.tagColor, fontSize: 11, fontWeight: "600" }}>
                      {post.tag}
                    </Text>
                  </View>
                </View>

                <Text
                  style={{ color: colors.text2, fontSize: 14, lineHeight: 21, marginBottom: 14 }}
                  numberOfLines={2}
                >
                  {post.excerpt}
                </Text>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Heart size={14} color={colors.text3} />
                    <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "500" }}>
                      {post.reactions >= 1000 ? `${(post.reactions / 1000).toFixed(1)}K` : post.reactions}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <MessageCircle size={14} color={colors.text3} />
                    <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "500" }}>
                      {post.comments}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
