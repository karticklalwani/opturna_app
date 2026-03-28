import { Tabs } from "expo-router";
import { Home, Compass, Brain, ChartBar, User } from "lucide-react-native";
import { View, Text, Platform } from "react-native";
import { useTheme } from "@/lib/theme";

type TabIconProps = {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  focused: boolean;
  label: string;
};

function TabIcon({ Icon, focused, label }: TabIconProps) {
  const { colors, mode } = useTheme();
  const activeColor = colors.accent;
  const inactiveColor = colors.text3;

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 8,
        gap: 4,
        minWidth: 56,
      }}
    >
      <View
        style={{
          width: 48,
          height: 30,
          borderRadius: 15,
          backgroundColor: focused ? `${activeColor}18` : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          size={22}
          color={focused ? activeColor : inactiveColor}
          strokeWidth={focused ? 2.4 : 1.8}
        />
      </View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? "700" : "500",
          color: focused ? activeColor : inactiveColor,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const { colors, mode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: mode === "dark" ? `${colors.bg}F2` : `${colors.bg}F8`,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === "ios" ? 88 : 72,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 4,
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text3,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Home} focused={focused} label="Inicio" />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Compass} focused={focused} label="Descubrir" />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={ChartBar} focused={focused} label="Finanzas" />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-assistant"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Brain} focused={focused} label="IA" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} focused={focused} label="Perfil" />
          ),
        }}
      />

      {/* Hidden screens — still reachable via router.push() */}
      <Tabs.Screen name="live" options={{ href: null }} />
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="research" options={{ href: null }} />
      <Tabs.Screen name="post-detail" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="sprints" options={{ href: null }} />
      <Tabs.Screen name="academy" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="go-live" options={{ href: null }} />
      <Tabs.Screen name="tasks" options={{ href: null }} />
      <Tabs.Screen name="habits" options={{ href: null }} />
      <Tabs.Screen name="projects" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
      <Tabs.Screen name="journal" options={{ href: null }} />
      <Tabs.Screen name="life-goals" options={{ href: null }} />
      <Tabs.Screen name="article-detail" options={{ href: null }} />
      <Tabs.Screen name="creators" options={{ href: null }} />
      <Tabs.Screen name="creator-profile" options={{ href: null }} />
      <Tabs.Screen name="reels-feed" options={{ href: null }} />
      <Tabs.Screen name="media-discover" options={{ href: null }} />
      <Tabs.Screen name="media-upload" options={{ href: null }} />
      <Tabs.Screen name="communities" options={{ href: null }} />
    </Tabs>
  );
}
