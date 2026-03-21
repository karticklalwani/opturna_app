import { Tabs } from "expo-router";
import { Home, Compass, Radio, Brain, ChartBar, Target, User, FlaskConical } from "lucide-react-native";
import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

type TabIconProps = {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  focused: boolean;
  label: string;
};

function TabIcon({ Icon, focused, label }: TabIconProps) {
  const { colors } = useTheme();
  const activeColor = "#4ADE80";
  const inactiveColor = "#404040";

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 52,
        paddingTop: 2,
        gap: 4,
      }}
    >
      {focused ? (
        <View
          style={{
            position: "absolute",
            top: -6,
            width: 24,
            height: 2,
            borderRadius: 1,
            backgroundColor: activeColor,
          }}
        />
      ) : null}
      <Icon
        size={21}
        color={focused ? activeColor : inactiveColor}
        strokeWidth={focused ? 2.2 : 1.6}
      />
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? "600" : "400",
          color: focused ? activeColor : inactiveColor,
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 30,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#4ADE80",
        tabBarInactiveTintColor: "#404040",
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
        name="live"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Radio} focused={focused} label="Directos" />
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
        name="finance"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={ChartBar} focused={focused} label="Finanzas" />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Target} focused={focused} label="Objetivos" />
          ),
        }}
      />
      <Tabs.Screen
        name="research"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={FlaskConical} focused={focused} label="Research" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} focused={focused} label={t("profile")} />
          ),
        }}
      />

      {/* Hidden screens — still reachable as routes */}
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
    </Tabs>
  );
}
