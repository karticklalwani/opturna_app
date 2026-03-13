import "../../global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/use-session";
import { View } from "react-native";
import { useTheme } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function RootLayoutNav() {
  const { data: session, isLoading } = useSession();
  const { mode, colors } = useTheme();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  const navTheme = mode === "dark" ? DarkTheme : {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bg2, text: colors.text, border: colors.border },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!!session?.user}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session?.user}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="verify-otp" />
        </Stack.Protected>
      </Stack>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <RootLayoutNav />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
