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
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Bell,
  Plus,
  Cpu,
  TrendingUp,
  Compass,
  ArrowRight,
  UserPlus,
  FileText,
  CheckCircle,
  DollarSign,
  ChevronRight,
} from "lucide-react-native";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const ACTIVITY_ITEMS = [
  {
    id: "1",
    icon: UserPlus,
    text: "Alex Rivera started following you",
    time: "2m ago",
    iconColor: "#00B4D8",
  },
  {
    id: "2",
    icon: FileText,
    text: "You posted a business update",
    time: "1h ago",
    iconColor: "#FFD60A",
  },
  {
    id: "3",
    icon: CheckCircle,
    text: "Financial goal reached: $5K savings",
    time: "3h ago",
    iconColor: "#00FF87",
  },
  {
    id: "4",
    icon: TrendingUp,
    text: "Your post reached 200 views",
    time: "Yesterday",
    iconColor: "#00B4D8",
  },
];

export default function DashboardScreen() {
  const { data: session, isLoading } = useSession();
  const { colors } = useTheme();
  const router = useRouter();

  const greeting = useMemo(() => getGreeting(), []);
  const displayName = session?.user?.name ?? "there";
  const firstName = displayName.split(" ")[0] ?? displayName;
  const avatarInitial = displayName[0]?.toUpperCase() ?? "U";

  const accentSoft = `${colors.accent}18`;
  const accentBorder = `${colors.accent}38`;
  const successSoft = `${colors.success}18`;
  const errorSoft = `${colors.error}18`;

  const QUICK_ACTIONS = [
    {
      id: "new-post",
      label: "New Post",
      icon: Plus,
      color: colors.accent,
      bg: accentSoft,
      border: accentBorder,
      onPress: () => {},
    },
    {
      id: "ai-assistant",
      label: "AI",
      icon: Cpu,
      color: colors.accent3,
      bg: `${colors.accent3}18`,
      border: `${colors.accent3}38`,
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
      color: "#A78BFA",
      bg: "#A78BFA18",
      border: "#A78BFA38",
      onPress: () => router.push("/(app)/discover" as any),
    },
  ];

  if (isLoading) {
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
        {/* Header */}
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
                fontSize: 12,
                fontWeight: "500",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              {greeting}
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 24,
                fontWeight: "800",
                letterSpacing: -0.5,
              }}
            >
              {firstName}
            </Text>
          </View>
          <Pressable
            testID="notification-bell-button"
            style={{
              width: 40,
              height: 40,
              borderRadius: 100,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Bell size={18} color={colors.text2} />
          </Pressable>
        </View>

        {/* Tagline */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 4 }}>
          <Text
            style={{
              color: colors.text3,
              fontSize: 13,
              lineHeight: 18,
              fontWeight: "400",
            }}
          >
            Your ecosystem for growth, clarity, and execution
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Summary Card */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(400).springify()}
          style={{ marginHorizontal: 16, marginTop: 16 }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 18,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Avatar */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 100,
                  backgroundColor: accentSoft,
                  borderWidth: 2,
                  borderColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 22, fontWeight: "800" }}>
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
                    letterSpacing: -0.2,
                    marginBottom: 1,
                  }}
                >
                  {displayName}
                </Text>
                <Text style={{ color: colors.text3, fontSize: 12, marginBottom: 6 }}>
                  Building in public. Founder mindset.
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Text style={{ color: colors.text3, fontSize: 11 }}>
                    <Text style={{ color: colors.text2, fontWeight: "600" }}>248</Text> followers
                  </Text>
                  <Text style={{ color: colors.text3, fontSize: 11 }}>
                    <Text style={{ color: colors.text2, fontWeight: "600" }}>12</Text> posts
                  </Text>
                </View>
              </View>

              {/* Edit button */}
              <Pressable
                testID="dashboard-edit-profile-button"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: accentSoft,
                  borderWidth: 1,
                  borderColor: accentBorder,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>
                  Edit
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions Row */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(400).springify()}
          style={{ marginHorizontal: 16, marginTop: 14 }}
        >
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.6,
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
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 16,
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: action.bg,
                      borderWidth: 1,
                      borderColor: action.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={17} color={action.color} />
                  </View>
                  <Text
                    style={{
                      color: colors.text2,
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Financial Snapshot */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(400).springify()}
          style={{ marginHorizontal: 16, marginTop: 14 }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: successSoft,
                  borderWidth: 1,
                  borderColor: `${colors.success}38`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <DollarSign size={15} color={colors.success} />
              </View>
              <Text style={{ flex: 1, color: colors.text2, fontSize: 13, fontWeight: "600" }}>
                Financial Snapshot
              </Text>
              <Pressable
                testID="finance-view-details-button"
                onPress={() => router.push("/(app)/finance" as any)}
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>
                  View Details
                </Text>
                <ChevronRight size={13} color={colors.accent} />
              </Pressable>
            </View>

            <Text
              style={{
                color: colors.text,
                fontSize: 32,
                fontWeight: "800",
                letterSpacing: -1,
                marginBottom: 14,
              }}
            >
              $24,850
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.success,
                  }}
                />
                <View>
                  <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "500", marginBottom: 1 }}>
                    INCOME
                  </Text>
                  <Text style={{ color: colors.success, fontSize: 14, fontWeight: "700" }}>
                    +$6,200
                  </Text>
                </View>
              </View>
              <View
                style={{
                  width: 1,
                  backgroundColor: colors.border,
                  alignSelf: "stretch",
                }}
              />
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.error,
                  }}
                />
                <View>
                  <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "500", marginBottom: 1 }}>
                    EXPENSES
                  </Text>
                  <Text style={{ color: colors.error, fontSize: 14, fontWeight: "700" }}>
                    -$1,340
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* AI Assistant Shortcut */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(400).springify()}
          style={{ marginHorizontal: 16, marginTop: 14 }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: `${colors.accent}28`,
              padding: 20,
              shadowColor: colors.accent,
              shadowOpacity: 0.06,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            {/* Header row */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                {/* Pulsing dot */}
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.accent,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                />
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
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
                <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700" }}>
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
              Ask anything about business, finance, or strategy
            </Text>

            {/* Sample prompt chip */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: colors.bg3,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 14,
              }}
            >
              <Text style={{ color: colors.text3, fontSize: 13, flex: 1 }}>
                "Help me plan my week"
              </Text>
              <ArrowRight size={13} color={colors.text3} />
            </View>

            <Pressable
              onPress={() => router.push("/(app)/ai-assistant" as any)}
              testID="open-ai-workspace-button"
              style={{
                backgroundColor: colors.accent,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Cpu size={15} color={colors.bg} />
              <Text style={{ color: colors.bg, fontSize: 14, fontWeight: "700" }}>
                Open Workspace
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400).springify()}
          style={{ marginHorizontal: 16, marginTop: 14 }}
        >
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.6,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Recent Activity
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
            }}
          >
            {ACTIVITY_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    borderBottomWidth: index < ACTIVITY_ITEMS.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: `${item.iconColor}18`,
                      borderWidth: 1,
                      borderColor: `${item.iconColor}30`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={15} color={item.iconColor} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      color: colors.text2,
                      fontSize: 13,
                      lineHeight: 18,
                    }}
                    numberOfLines={2}
                  >
                    {item.text}
                  </Text>
                  <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "500" }}>
                    {item.time}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
