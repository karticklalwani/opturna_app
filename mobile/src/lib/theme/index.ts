import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "dark" | "light";

export const DARK = {
  bg: "#0A0A0A", bg2: "#141414", bg3: "#1C1C1E", bg4: "#27272A",
  text: "#FAFAFA", text2: "#A1A1AA", text3: "#71717A", text4: "#52525B",
  accent: "#F59E0B", border: "#27272A", card: "#141414",
  success: "#22C55E", error: "#EF4444", info: "#3B82F6",
};

export const LIGHT = {
  bg: "#F8F8F8", bg2: "#FFFFFF", bg3: "#F1F1F1", bg4: "#E5E5EA",
  text: "#0A0A0A", text2: "#3A3A3C", text3: "#6C6C70", text4: "#8E8E93",
  accent: "#D97706", border: "#E5E5EA", card: "#FFFFFF",
  success: "#16A34A", error: "#DC2626", info: "#2563EB",
};

interface ThemeStore {
  mode: ThemeMode;
  colors: typeof DARK;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: "dark",
      colors: DARK,
      toggleTheme: () => set((s) => {
        const newMode = s.mode === "dark" ? "light" : "dark";
        return { mode: newMode, colors: newMode === "dark" ? DARK : LIGHT };
      }),
      setTheme: (mode) => set({ mode, colors: mode === "dark" ? DARK : LIGHT }),
    }),
    { name: "opturna-theme", storage: createJSONStorage(() => AsyncStorage) }
  )
);
