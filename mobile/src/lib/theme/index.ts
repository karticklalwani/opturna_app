import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "dark" | "light";

// Ultra-dark minimal fintech/crypto terminal aesthetic
export const DARK = {
  bg: "#080808",         // Almost pure black
  bg2: "#0F0F0F",        // Slightly elevated
  bg3: "#141414",        // Card surfaces
  bg4: "#1A1A1A",        // Elevated panels
  text: "#F5F5F5",       // Near white
  text2: "#A3A3A3",      // Secondary
  text3: "#737373",      // Muted
  text4: "#404040",      // Very muted
  accent: "#4ADE80",     // Green accent (primary)
  accent2: "#EF4444",    // Red (destructive only)
  accent3: "#F5F5F5",    // White accent (secondary)
  border: "#1F1F1F",     // Subtle border
  card: "#0F0F0F",       // Card bg
  success: "#4ADE80",    // Same as accent
  error: "#EF4444",      // Red
  info: "#A3A3A3",       // Gray info
  glow: "#4ADE80",       // Green glow
};

export const LIGHT = {
  bg: "#F8F8F8", bg2: "#FFFFFF", bg3: "#F1F1F1", bg4: "#E5E5EA",
  text: "#0A0A0A", text2: "#3A3A3C", text3: "#6C6C70", text4: "#8E8E93",
  accent: "#16A34A", accent2: "#DC2626", accent3: "#0A0A0A", border: "#E5E5EA", card: "#FFFFFF",
  success: "#16A34A", error: "#DC2626", info: "#2563EB", glow: "#16A34A",
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
