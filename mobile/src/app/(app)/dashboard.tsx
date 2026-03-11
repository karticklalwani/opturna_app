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
      return { Icon: Heart, color: "#FF3B30" };
    case "comment":
      return { Icon: MessageCircle, color: "#FFD60A" };
    case "repost":
      return { Icon: Repeat2, color: "#00FF87" };
    default:
      return { Icon: Star, color: "#FFD60A" };
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
  const accentSoft = `${colors.accent}18`;
  const accentBorder = `${colors.accent}38`;
  const goldSoft = `${colors.accent3}18`;
  const goldBorder = `${colors.accent3}38`;
  const successSoft = `${colors.success}18`;

  const QUICK_ACTIONS = [
    {
      id: "new-post",
      label: "Post",
      icon: Plus,
      color: colors.accent3,
      bg: goldSoft,
      border: goldBorder,
      onPress: () => router.push("/(app)/index" as any),
    },
    {
      id: "ai-assistant",
      label: "AI",
      icon: Cpu,
      color: colors.accent,
      bg: accentSoft,
      border: accentBorder,
      onPress: () => router.push("/(app)/ai-assistant" as any),
    },
    {
      id: "finance",
      label: "Finance",
      icon: TrendingUp,
      color: colors.success,
      bg: successSoft,
      border: `${colors.success}38`,
      onPress: () => router.push("/(app)/finance" as any),
    },
    {
      id: "discover",
      label: "Discover",
      icon: Compass,
      color: "#7DB8D9",
      bg: "#7DB8D918",
      border: "#7DB8D938",
      onPress: () => router.push("/(app)/discover" as any),
    },
  ];

  if (sessionLoading || profileLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}
        testID="dashboard-loading"
      >
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="dashboard-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
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
                fontWeight: "600",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 3,
              }}
            >
              {greeting}
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 26,
                fontWeight: "800",
                letterSpacing: -0.8,
                lineHeight: 30,
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
              width: 42,
              height: 42,
              borderRadius: 100,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: hasUnread ? `${colors.accent}50` : colors.border,
              shadowColor: hasUnread ? colors.accent : "transparent",
              shadowOpacity: 0.3,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Bell size={18} color={hasUnread ? colors.accent : colors.text2} />
            {hasUnread ? (
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.error,
                  borderWidth: 1.5,
                  borderColor: colors.bg,
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
              backgroundColor: colors.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 18,
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            {/* Top accent line */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 24,
                right: 24,
                height: 1,
                backgroundColor: `${colors.accent}30`,
                borderRadius: 1,
              }}
            />

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Avatar */}
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 100,
                  backgroundColor: accentSoft,
                  borderWidth: 2,
                  borderColor: `${colors.accent}60`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 24, fontWeight: "800" }}>
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
                    style={{ color: colors.text4, fontSize: 12, lineHeight: 16, marginBottom: 8, fontStyle: "italic" }}
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
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: accentSoft,
                  borderWidth: 1,
                  borderColor: accentBorder,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}>
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
                    paddingVertical: 16,
                    backgroundColor: pressed ? colors.bg3 : colors.card,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: pressed ? action.border : colors.border,
                    gap: 8,
                  })}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 13,
                      backgroundColor: action.bg,
                      borderWidth: 1,
                      borderColor: action.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={18} color={action.color} />
                  </View>
                  <Text
                    style={{
                      color: colors.text2,
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
                backgroundColor: colors.card,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: `${colors.accent3}30`,
                padding: 22,
                shadowColor: colors.accent3,
                shadowOpacity: 0.08,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
                overflow: "hidden",
              }}
            >
              {/* Decorative corner glow */}
              <View
                style={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: `${colors.accent3}08`,
                }}
              />

              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: goldSoft,
                    borderWidth: 1,
                    borderColor: goldBorder,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Flame size={18} color={colors.accent3} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800", letterSpacing: -0.3 }}>
                    Start your journey
                  </Text>
                  <Text style={{ color: colors.text3, fontSize: 12 }}>
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
                      borderBottomColor: colors.border,
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: goldSoft,
                        borderWidth: 1,
                        borderColor: goldBorder,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <StepIcon size={13} color={colors.accent3} />
                    </View>
                    <Text style={{ flex: 1, color: colors.text2, fontSize: 13, fontWeight: "500" }}>
                      {step.label}
                    </Text>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 1.5,
                        borderColor: colors.border,
                      }}
                    />
                  </View>
                );
              })}

              <Pressable
                testID="start-journey-post-button"
                onPress={() => router.push("/(app)/index" as any)}
                style={{
                  marginTop: 16,
                  backgroundColor: colors.accent3,
                  borderRadius: 13,
                  paddingVertical: 13,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 7,
                  shadowColor: colors.accent3,
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                <Plus size={15} color={colors.bg} />
                <Text style={{ color: colors.bg, fontSize: 14, fontWeight: "800" }}>
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
                backgroundColor: colors.card,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
              }}
            >
              <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
                Your Impact
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {[
                  { label: "Posts", value: postCount, color: colors.accent3 },
                  { label: "Followers", value: followerCount, color: colors.accent },
                  { label: "Following", value: followingCount, color: colors.success },
                ].map((stat) => (
                  <View
                    key={stat.label}
                    style={{
                      flex: 1,
                      backgroundColor: colors.bg3,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 14,
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Text style={{ color: stat.color, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
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
              backgroundColor: colors.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: `${colors.accent}28`,
              padding: 20,
              shadowColor: colors.accent,
              shadowOpacity: 0.07,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 4 },
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
                backgroundColor: `${colors.accent}08`,
              }}
            />

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.accent,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.9,
                    shadowRadius: 5,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                />
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
                  AI Assistant
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 100,
                  backgroundColor: accentSoft,
                  borderWidth: 1,
                  borderColor: accentBorder,
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>
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
                backgroundColor: colors.bg3,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
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
                backgroundColor: pressed ? `${colors.accent}CC` : colors.accent,
                borderRadius: 13,
                paddingVertical: 13,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 7,
                shadowColor: colors.accent,
                shadowOpacity: pressed ? 0.1 : 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              })}
            >
              <Cpu size={15} color={colors.bg} />
              <Text style={{ color: colors.bg, fontSize: 14, fontWeight: "800" }}>
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
                  backgroundColor: `${colors.error}18`,
                  borderWidth: 1,
                  borderColor: `${colors.error}30`,
                }}
              >
                <Text style={{ color: colors.error, fontSize: 10, fontWeight: "700" }}>
                  {unreadCount} new
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colors.border,
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
                      borderBottomColor: colors.border,
                      gap: 12,
                      backgroundColor: !item.isRead ? `${colors.accent}06` : "transparent",
                    }}
                  >
                    {/* Unread indicator */}
                    {!item.isRead ? (
                      <View
                        style={{
                          position: "absolute",
                          left: 6,
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: colors.accent,
                        }}
                      />
                    ) : null}

                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 11,
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
                        color: item.isRead ? colors.text3 : colors.text2,
                        fontSize: 13,
                        lineHeight: 18,
                        fontWeight: item.isRead ? "400" : "500",
                      }}
                      numberOfLines={2}
                    >
                      {item.message}
                    </Text>
                    <Text style={{ color: colors.text4, fontSize: 10, fontWeight: "500" }}>
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
                    borderRadius: 16,
                    backgroundColor: accentSoft,
                    borderWidth: 1,
                    borderColor: accentBorder,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                  }}
                >
                  <Bell size={22} color={colors.accent} />
                </View>
                <Text
                  style={{
                    color: colors.text2,
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
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
                View all {notifications.length} notifications
              </Text>
              <ChevronRight size={13} color={colors.accent} />
            </Pressable>
          ) : null}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
