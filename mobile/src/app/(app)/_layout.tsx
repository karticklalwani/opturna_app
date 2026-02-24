import { Tabs } from "expo-router";
import { Home, Zap, BookOpen, MessageCircle, User, Radio } from "lucide-react-native";
import { useTheme } from "@/lib/theme";

export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text4,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: ({ color, size }: { color: string; size: number }) => <Home size={size - 1} color={color} /> }} />
      <Tabs.Screen name="sprints" options={{ title: "Sprints", tabBarIcon: ({ color, size }: { color: string; size: number }) => <Zap size={size - 1} color={color} /> }} />
      <Tabs.Screen name="live" options={{ title: "Directos", tabBarIcon: ({ color, size }: { color: string; size: number }) => <Radio size={size - 1} color={color} /> }} />
      <Tabs.Screen name="academy" options={{ title: "Academia", tabBarIcon: ({ color, size }: { color: string; size: number }) => <BookOpen size={size - 1} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: "Mensajes", tabBarIcon: ({ color, size }: { color: string; size: number }) => <MessageCircle size={size - 1} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil", tabBarIcon: ({ color, size }: { color: string; size: number }) => <User size={size - 1} color={color} /> }} />
    </Tabs>
  );
}
