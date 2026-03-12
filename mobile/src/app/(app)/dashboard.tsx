import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/lib/auth/use-session";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Bell,
  Plus,
  Cpu,
  TrendingUp,
  Compass,
  ArrowRight,
  Sparkles,
  UserPlus,
  Heart,
  MessageCircle,
  Repeat2,
  Star,
  ChevronRight,
  Zap,
  Target,
  Flame,
} from "lucide-react-native";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  username: string | null;
  bio: string | null;
  mainAmbition: string | null;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
}

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "follow":
      return { Icon: UserPlus, color: "#00B4D8" };
    case "like":
    case "reaction":
      return { Icon: Heart, color: "#EF4444" };
    case "comment":
      return { Icon: MessageCircle, color: "#F5F5F5" };
    case "repost":
      return { Icon: Repeat2, color: "#4ADE80" };
    default:
      return { Icon: Star, color: "#4ADE80" };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { data: session, isLoading: sessionLoading } = useSession();
  const { colors } = useTheme();
  const router = useRouter();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<UserProfile>("/api/me"),
    enabled: !!session?.user,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<Notification[]>("/api/notifications"),
    enabled: !!session?.user,
  });

  const greeting = useMemo(() => getGreeting(), []);

  const displayName = profile?.name ?? session?.user?.name ?? "there";
  const firstName = displayName.split(" ")[0] ?? displayName;
  const avatarInitial = displayName[0]?.toUpperCase() ?? "U";

  const followerCount = profile?._count?.followers ?? 0;
  const postCount = profile?._count?.posts ?? 0;
  const followingCount = profile?._count?.following ?? 0;
  const userBio = profile?.bio ?? null;
  const isNewUser = postCount === 0;

  const unreadCount = (notifications ?? []).filter((n) => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  // Color utilities
  const accentGreen = "#4ADE80";
  const accentSoft = "#4ADE8015";
  const accentBorder = "#4ADE8040";

  const QUICK_ACTIONS = [
    {
      id: "new-post",
      label: "Post",
      icon: Plus,
      color: accentGreen,
      onPress: () => router.push("/(app)/index" as any),
    },
    {
      id: "ai-assistant",
      label: "AI",
      icon: Cpu,
      color: accentGreen,
      onPress: () => router.push("/(app)/ai-assistant" as any),
    },
    {
      id: "finance",
      label: "Finance",
      icon: TrendingUp,
      color: accentGreen,
      onPress: () => router.push("/(app)/finance" as any),
    },
    {
      id: "discover",
      label: "Discover",
      icon: Compass,
      color: colors.text3,
      onPress: () => router.push("/(app)/discover" as any),
    },
  ];

  if (sessionLoading || profileLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: "#080808", alignItems: "center", justifyContent: "center" }}
        testID="dashboard-loading"
      >
        <ActivityIndicator color={accentGreen} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }} testID="dashboard-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#080808" }}>
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.text3,
                fontSize: 11,
                fontWeight: "500",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {greeting}
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 32,
                fontWeight: "800",
                letterSpacing: -1.5,
                lineHeight: 36,
              }}
            >
              {firstName}
            </Text>
          </View>

          {/* Notification Bell */}
          <Pressable
            testID="notification-bell-button"
            onPress={() => router.push("/(app)/settings" as any)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#141414",
              borderWidth: 1,
              borderColor: hasUnread ? accentGreen : "#1F1F1F",
            }}
          >
            <Bell size={17} color={hasUnread ? accentGreen : colors.text2} />
            {hasUnread ? (
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: "#EF4444",
                  borderWidth: 1.5,
                  borderColor: "#080808",
                }}
              />
            ) : null}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Summary Card ── */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(400).springify()}
          style={{ marginHorizontal: 16, marginTop: 4 }}
        >
          <View
            style={{
              backgroundColor: "#0F0F0F",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#1F1F1F",
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Avatar */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: accentSoft,
                  borderWidth: 2,
                  borderColor: accentBorder,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Text style={{ color: accentGreen, fontSize: 22, fontWeight: "800" }}>
                  {avatarInitial}
                </Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "700",
                    letterSpacing: -0.3,
                    marginBottom: 2,
                  }}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                {userBio ? (
                  <Text
                    style={{ color: colors.text3, fontSize: 12, lineHeight: 16, marginBottom: 8 }}
                    numberOfLines={2}
                  >
                    {userBio}
                  </Text>
                ) : (
                  <Text
                    style={{ color: "#404040", fontSize: 12, lineHeight: 16, marginBottom: 8, fontStyle: "italic" }}
                    numberOfLines={1}
                  >
                    No bio yet
                  </Text>
                )}
                <View style={{ flexDirection: "row", gap: 14 }}>
                  <Text style={{ color: colors.text3, fontSize: 11 }}>
                    <Text style={{ color: colors.text2, fontWeight: "700" }}>{followerCount}</Text>
                    {"  followers"}
                  </Text>
                  <Text style={{ color: colors.text3, fontSize: 11 }}>
                    <Text style={{ color: colors.text2, fontWeight: "700" }}>{followingCount}</Text>
                    {"  following"}
                  </Text>
                  <Text style={{ color: colors.text3, fontSize: 11 }}>
                    <Text style={{ color: colors.text2, fontWeight: "700" }}>{postCount}</Text>
                    {"  posts"}
                  </Text>
                </View>
              </View>

              {/* Edit button */}
              <Pressable
                testID="dashboard-edit-profile-button"
                onPress={() => router.push("/(app)/profile" as any)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: "#141414",
                  borderWidth: 1,
                  borderColor: "#1F1F1F",
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: "#A3A3A3", fontSize: 11, fontWeight: "600" }}>
                  Edit
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* ── Quick Actions ── */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(400).springify()}
          style={{ marginHorizontal: 16, marginTop: 16 }}
        >
          <Text
            style={{
              color: colors.text3,
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Pressable
                  key={action.id}
                  onPress={action.onPress}
                  testID={`quick-action-${action.id}`}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 18,
                    backgroundColor: pressed ? "#141414" : "#0F0F0F",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#1F1F1F",
                    gap: 8,
                  })}
                >
                  <Icon size={20} color={action.color} />
                  <Text
                    style={{
                      color: colors.text3,
                      fontSize: 11,
                      fontWeight: "600",
                      letterSpacing: 0.2,
                    }}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Smart Card: New User Journey OR Stats ── */}
        {isNewUser ? (
          <Animated.View
            entering={FadeInDown.delay(180).duration(400).springify()}
            style={{ marginHorizontal: 16, marginTop: 14 }}
          >
            <View
              style={{
                backgroundColor: "#0F0F0F",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                padding: 20,
                overflow: "hidden",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: accentSoft,
                    borderWidth: 1,
                    borderColor: accentBorder,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Flame size={17} color={accentGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800", letterSpacing: -0.3 }}>
                    Start your journey
                  </Text>
                  <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>
                    Your story begins with one post
                  </Text>
                </View>
              </View>

              {/* Steps */}
              {[
                { icon: Plus, label: "Create your first post", done: false },
                { icon: Target, label: "Set a financial goal", done: false },
                { icon: Zap, label: "Connect with builders", done: false },
              ].map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                      borderBottomWidth: i < 2 ? 1 : 0,
                      borderBottomColor: "#1F1F1F",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: accentSoft,
                        borderWidth: 1,
                        borderColor: accentBorder,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <StepIcon size={13} color={accentGreen} />
                    </View>
                    <Text style={{ flex: 1, color: "#A3A3A3", fontSize: 13, fontWeight: "500" }}>
                      {step.label}
                    </Text>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 1.5,
                        borderColor: "#1F1F1F",
                      }}
                    />
                  </View>
                );
              })}

              <Pressable
                testID="start-journey-post-button"
                onPress={() => router.push("/(app)/index" as any)}
                style={({ pressed }) => ({
                  marginTop: 16,
                  backgroundColor: pressed ? "#3fcf70" : accentGreen,
                  borderRadius: 12,
                  paddingVertical: 13,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 7,
                  shadowColor: accentGreen,
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 4 },
                })}
              >
                <Plus size={15} color="#080808" />
                <Text style={{ color: "#080808", fontSize: 14, fontWeight: "800" }}>
                  Write Your First Post
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(180).duration(400).springify()}
            style={{ marginHorizontal: 16, marginTop: 14 }}
          >
            <View
              style={{
                backgroundColor: "#0F0F0F",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                padding: 18,
              }}
            >
              <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
                Your Impact
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {[
                  { label: "Posts", value: postCount },
                  { label: "Followers", value: followerCount },
                  { label: "Following", value: followingCount },
                ].map((stat) => (
                  <View
                    key={stat.label}
                    style={{
                      flex: 1,
                      backgroundColor: "#141414",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#1F1F1F",
                      padding: 14,
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Text style={{ color: accentGreen, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
                      {stat.value}
                    </Text>
                    <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" }}>
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── AI Assistant Banner ── */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(400).springify()}
          style={{ marginHorizontal: 16, marginTop: 14 }}
        >
          <View
            style={{
              backgroundColor: "#0F0F0F",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#4ADE8020",
              padding: 20,
              overflow: "hidden",
            }}
          >
            {/* Background glow */}
            <View
              style={{
                position: "absolute",
                bottom: -40,
                right: -40,
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "#4ADE8008",
              }}
            />

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                {/* Green dot */}
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: accentGreen,
                    shadowColor: accentGreen,
                    shadowOpacity: 0.9,
                    shadowRadius: 5,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                />
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
                  AI Assistant
                </Text>
              </View>
              {/* LIVE badge */}
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 100,
                  backgroundColor: "#4ADE8012",
                  borderWidth: 1,
                  borderColor: "#4ADE8030",
                }}
              >
                <Text style={{ color: accentGreen, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>
                  LIVE
                </Text>
              </View>
            </View>

            <Text
              style={{
                color: colors.text3,
                fontSize: 13,
                lineHeight: 19,
                marginBottom: 14,
              }}
            >
              Ask anything about business, finance, or personal strategy
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#141414",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                paddingHorizontal: 13,
                paddingVertical: 11,
                marginBottom: 14,
              }}
            >
              <Sparkles size={13} color={colors.text3} />
              <Text style={{ color: colors.text3, fontSize: 13, flex: 1 }}>
                "Help me plan my week"
              </Text>
              <ArrowRight size={13} color={colors.text3} />
            </View>

            <Pressable
              onPress={() => router.push("/(app)/ai-assistant" as any)}
              testID="open-ai-workspace-button"
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#3fcf70" : accentGreen,
                borderRadius: 12,
                paddingVertical: 13,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 7,
                shadowColor: accentGreen,
                shadowOpacity: pressed ? 0.1 : 0.4,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
              })}
            >
              <Cpu size={15} color="#080808" />
              <Text style={{ color: "#080808", fontSize: 14, fontWeight: "800" }}>
                Open Workspace
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Recent Activity ── */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400).springify()}
          style={{ marginHorizontal: 16, marginTop: 16 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                flex: 1,
                color: colors.text3,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Recent Activity
            </Text>
            {hasUnread ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 100,
                  backgroundColor: "#EF444418",
                  borderWidth: 1,
                  borderColor: "#EF444430",
                }}
              >
                <Text style={{ color: "#EF4444", fontSize: 10, fontWeight: "700" }}>
                  {unreadCount} new
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={{
              backgroundColor: "#0F0F0F",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#1F1F1F",
              overflow: "hidden",
            }}
          >
            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 6).map((item, index) => {
                const { Icon, color } = getNotificationIcon(item.type);
                const isLast = index === Math.min(notifications.length, 6) - 1;
                return (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: "#1F1F1F",
                      gap: 12,
                      backgroundColor: !item.isRead ? "#4ADE8006" : "transparent",
                      borderLeftWidth: !item.isRead ? 2 : 0,
                      borderLeftColor: !item.isRead ? accentGreen : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: `${color}18`,
                        borderWidth: 1,
                        borderColor: `${color}30`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={15} color={color} />
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        color: item.isRead ? colors.text3 : "#A3A3A3",
                        fontSize: 13,
                        lineHeight: 18,
                        fontWeight: item.isRead ? "400" : "500",
                      }}
                      numberOfLines={2}
                    >
                      {item.message}
                    </Text>
                    <Text style={{ color: "#404040", fontSize: 10, fontWeight: "500" }}>
                      {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                );
              })
            ) : (
              /* Empty state */
              <View
                style={{
                  paddingVertical: 40,
                  paddingHorizontal: 24,
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: accentSoft,
                    borderWidth: 1,
                    borderColor: accentBorder,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                  }}
                >
                  <Bell size={22} color={accentGreen} />
                </View>
                <Text
                  style={{
                    color: "#A3A3A3",
                    fontSize: 14,
                    fontWeight: "700",
                    letterSpacing: -0.2,
                  }}
                >
                  All clear for now
                </Text>
                <Text
                  style={{
                    color: colors.text3,
                    fontSize: 12,
                    lineHeight: 17,
                    textAlign: "center",
                  }}
                >
                  Your activity will appear here as you start posting and connecting
                </Text>
              </View>
            )}
          </View>

          {/* View all link */}
          {notifications && notifications.length > 6 ? (
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                gap: 4,
              }}
            >
              <Text style={{ color: accentGreen, fontSize: 13, fontWeight: "600" }}>
                View all {notifications.length} notifications
              </Text>
              <ChevronRight size={13} color={accentGreen} />
            </Pressable>
          ) : null}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
