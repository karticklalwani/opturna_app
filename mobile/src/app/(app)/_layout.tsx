import { Tabs } from "expo-router";
import { Home, Zap, BookOpen, MessageCircle, User } from "lucide-react-native";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0F0F0F",
          borderTopColor: "#1C1C1E",
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#F59E0B",
        tabBarInactiveTintColor: "#52525B",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Home size={size - 1} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sprints"
        options={{
          title: "Sprints",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Zap size={size - 1} color={color} />,
        }}
      />
      <Tabs.Screen
        name="academy"
        options={{
          title: "Academy",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <BookOpen size={size - 1} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <MessageCircle size={size - 1} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <User size={size - 1} color={color} />,
        }}
      />
    </Tabs>
  );
}
