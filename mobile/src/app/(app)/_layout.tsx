import { Tabs } from "expo-router";
import { Home, Zap, BookOpen, MessageCircle, User, Radio } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { View } from "react-native";

function HudTabIcon({ Icon, color, focused }: { Icon: any; color: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 44, height: 44 }}>
      {focused ? (
        <View style={{
          position: "absolute",
          width: 36, height: 36, borderRadius: 8,
          backgroundColor: `${color}18`,
          borderWidth: 1,
          borderColor: `${color}44`,
        }} />
      ) : null}
      <Icon size={20} color={color} strokeWidth={focused ? 2.2 : 1.5} />
      {focused ? (
        <View style={{
          position: "absolute",
          bottom: 4,
          width: 16, height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 4,
        }} />
      ) : null}
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
          backgroundColor: "#020B18",
          borderTopColor: "#0D3A55",
          borderTopWidth: 1,
          height: 86,
          paddingBottom: 24,
          paddingTop: 6,
          shadowColor: "#00B4D8",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 20,
        },
        tabBarActiveTintColor: "#00B4D8",
        tabBarInactiveTintColor: "#2A4D63",
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "700",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginTop: -2,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "FEED",
          tabBarIcon: ({ color, focused }) => <HudTabIcon Icon={Home} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sprints"
        options={{
          title: "SPRINTS",
          tabBarIcon: ({ color, focused }) => <HudTabIcon Icon={Zap} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: "LIVE",
          tabBarIcon: ({ color, focused }) => <HudTabIcon Icon={Radio} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="academy"
        options={{
          title: "ACADEMY",
          tabBarIcon: ({ color, focused }) => <HudTabIcon Icon={BookOpen} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "COMMS",
          tabBarIcon: ({ color, focused }) => <HudTabIcon Icon={MessageCircle} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "AGENT",
          tabBarIcon: ({ color, focused }) => <HudTabIcon Icon={User} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
