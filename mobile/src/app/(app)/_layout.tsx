import { Tabs } from "expo-router";
import { LayoutDashboard, Rss, Compass, Brain, BarChart3, User, Settings } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { View } from "react-native";

function PillTabIcon({ Icon, color, focused }: { Icon: any; color: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 44, height: 32 }}>
      {focused ? (
        <View
          style={{
            position: "absolute",
            width: 40,
            height: 30,
            borderRadius: 100,
            backgroundColor: "rgba(0, 180, 216, 0.12)",
          }}
        />
      ) : null}
      <Icon
        size={21}
        color={color}
        strokeWidth={focused ? 2.2 : 1.6}
      />
    </View>
  );
}

export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#060D1A",
          borderTopColor: "rgba(0, 180, 216, 0.08)",
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 26,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 16,
        },
        tabBarActiveTintColor: "#00B4D8",
        tabBarInactiveTintColor: "#3A5568",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          letterSpacing: 0.2,
          textTransform: "none",
          marginTop: 2,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={LayoutDashboard} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={Rss} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={Compass} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ai-assistant"
        options={{
          title: "AI",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={Brain} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Finance",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={BarChart3} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={User} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={Settings} color={color} focused={focused} />,
        }}
      />
      {/* Hide legacy screens from tab bar */}
      <Tabs.Screen name="sprints" options={{ href: null }} />
      <Tabs.Screen name="live" options={{ href: null }} />
      <Tabs.Screen name="academy" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
    </Tabs>
  );
}
