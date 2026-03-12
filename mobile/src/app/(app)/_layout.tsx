import { Tabs } from "expo-router";
import { LayoutDashboard, Rss, Compass, Brain, BarChart3, User, Settings } from "lucide-react-native";
import { View } from "react-native";

function TabIcon({ Icon, focused }: { Icon: any; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 44, height: 36, gap: 5 }}>
      <Icon size={22} color={focused ? "#4ADE80" : "#404040"} strokeWidth={focused ? 2 : 1.5} />
      {focused ? (
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#4ADE80" }} />
      ) : (
        <View style={{ width: 4, height: 4 }} />
      )}
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#080808",
          borderTopColor: "#1F1F1F",
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#4ADE80",
        tabBarInactiveTintColor: "#404040",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={LayoutDashboard} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Rss} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Compass} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ai-assistant"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Brain} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={BarChart3} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Settings} focused={focused} />,
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
