import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "dark" | "light";

// JARVIS / Iron Man HUD aesthetic
export const DARK = {
  bg: "#020B18",         // Deep navy void
  bg2: "#041525",        // Dark steel
  bg3: "#071E32",        // Panel bg
  bg4: "#0A2540",        // Elevated surface
  text: "#C8E8FF",       // Arc reactor ice blue
  text2: "#7DB8D9",      // Hologram mid
  text3: "#4A7A99",      // Dim hologram
  text4: "#2A4D63",      // Ghost text
  accent: "#00B4D8",     // Arc reactor blue
  accent2: "#FF3B30",    // Iron Man red
  accent3: "#FFD60A",    // Gold highlight
  border: "#0D3A55",     // Circuit border
  card: "#041525",       // Panel
  success: "#00FF87",    // HUD green
  error: "#FF3B30",      // Alert red
  info: "#00B4D8",       // Info blue
  glow: "#00B4D8",       // Glow color
};

export const LIGHT = {
  bg: "#F8F8F8", bg2: "#FFFFFF", bg3: "#F1F1F1", bg4: "#E5E5EA",
  text: "#0A0A0A", text2: "#3A3A3C", text3: "#6C6C70", text4: "#8E8E93",
  accent: "#0077A8", accent2: "#C0392B", accent3: "#D4AC0D", border: "#E5E5EA", card: "#FFFFFF",
  success: "#16A34A", error: "#DC2626", info: "#2563EB", glow: "#0077A8",
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
