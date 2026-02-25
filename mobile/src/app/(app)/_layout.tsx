import { Tabs } from "expo-router";
import { Home, Zap, BookOpen, MessageCircle, User, Radio } from "lucide-react-native";
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
          backgroundColor: "#0A0F1E",
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
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={Home} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sprints"
        options={{
          title: "Sprints",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={Zap} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: "Live",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={Radio} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="academy"
        options={{
          title: "Academy",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={BookOpen} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={MessageCircle} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => <PillTabIcon Icon={User} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
