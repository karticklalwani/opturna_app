import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import {
  Target,
  SquareCheck,
  Flame,
  Layers,
  TrendingUp,
  Calendar,
  Star,
  Award,
  Zap,
  ChevronRight,
} from "lucide-react-native";
import { api } from "@/lib/api/api";
import { Goal, Task, Habit, Project } from "@/types";

// ─── Local types ──────────────────────────────────────────────────────────────

interface LifeGoal {
  id: string;
  title: string;
  progress: number;
  category?: string | null;
  emoji?: string | null;
  isCompleted: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUOTES = [
  "La disciplina es el puente entre tus metas y tus logros.",
  "No cuentes los días. Haz que los días cuenten.",
  "Cada día es una nueva oportunidad para crecer.",
  "El éxito no llega por casualidad — se construye con intención.",
  "Tu única competencia eres tú de ayer.",
];

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

function getStartOfWeekISO() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Mon
  const mon = new Date(now.setDate(diff));
  return mon.toISOString().split("T")[0];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ─── Skeleton Pulse ───────────────────────────────────────────────────────────

function SkeletonBlock({
  width,
  height,
  borderRadius = 10,
  style,
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width ?? "100%",
          height,
          borderRadius,
          backgroundColor: "#1A1A1A",
        },
        animStyle,
        style,
      ]}
    />
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 16 }}>
      <SkeletonBlock height={28} width="60%" borderRadius={8} />
      <SkeletonBlock height={16} width="40%" borderRadius={6} />
      <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} width={90} height={100} borderRadius={16} />
        ))}
      </View>
      <SkeletonBlock height={180} borderRadius={24} style={{ marginTop: 8 }} />
      <SkeletonBlock height={120} borderRadius={20} />
      <SkeletonBlock height={120} borderRadius={20} />
    </View>
  );
}

// ─── Animated Progress Bar ────────────────────────────────────────────────────

function AnimatedBar({
  progress,
  color,
  height = 6,
}: {
  progress: number;
  color: string;
  height?: number;
}) {
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withTiming(Math.min(100, Math.max(0, progress)), {
      duration: 900,
      easing: Easing.out(Easing.exp),
    });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${w.value}%` as `${number}%`,
  }));

  return (
    <View
      style={{
        height,
        backgroundColor: "#1A1A1A",
        borderRadius: 100,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            height,
            borderRadius: 100,
            backgroundColor: color,
            shadowColor: color,
            shadowOpacity: 0.6,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          },
          barStyle,
        ]}
      />
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardData {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
  bg: string;
}

function StatCard({ card, index }: { card: StatCardData; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).duration(400)}
      style={{
        width: 92,
        backgroundColor: "#0F0F0F",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#1F1F1F",
        padding: 14,
        alignItems: "center",
        gap: 8,
        marginRight: 10,
      }}
      testID={`stat-card-${index}`}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: card.bg,
          borderWidth: 1,
          borderColor: `${card.color}30`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {card.icon}
      </View>
      <Text
        style={{
          color: card.color,
          fontSize: 24,
          fontWeight: "800",
          letterSpacing: -1,
          lineHeight: 28,
        }}
      >
        {card.value}
      </Text>
      <Text
        style={{
          color: "#737373",
          fontSize: 10,
          fontWeight: "500",
          textAlign: "center",
          lineHeight: 13,
        }}
      >
        {card.label}
      </Text>
    </Animated.View>
  );
}

// ─── Weekly Ring ──────────────────────────────────────────────────────────────

function WeeklyRing({
  tasksCompleted,
  tasksTotal,
  habitsToday,
  habitsTotal,
  overallPct,
}: {
  tasksCompleted: number;
  tasksTotal: number;
  habitsToday: number;
  habitsTotal: number;
  overallPct: number;
}) {
  const size = 140;
  const strokeW = 12;
  const radius = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * radius;

  // Outer ring: tasks this week
  const taskPct = tasksTotal > 0 ? tasksCompleted / tasksTotal : 0;

  // Inner ring: habits today
  const habitPct = habitsTotal > 0 ? habitsToday / habitsTotal : 0;

  // Using border trick for rings
  const outerAngle = taskPct * 360;
  const innerAngle = habitPct * 360;

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(500)}
      style={{
        backgroundColor: "#0F0F0F",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#1F1F1F",
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
        marginBottom: 12,
      }}
      testID="weekly-ring-card"
    >
      {/* Ring visual */}
      <View
        style={{ width: size, height: size, position: "relative", alignItems: "center", justifyContent: "center" }}
      >
        {/* Outer ring bg */}
        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeW,
            borderColor: "#1A1A1A",
          }}
        />
        {/* Outer ring fill - tasks */}
        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeW,
            borderColor: "#4ADE80",
            borderRightColor: taskPct < 0.25 ? "transparent" : "#4ADE80",
            borderBottomColor: taskPct < 0.5 ? "transparent" : "#4ADE80",
            borderLeftColor: taskPct < 0.75 ? "transparent" : "#4ADE80",
            opacity: taskPct > 0 ? 1 : 0,
            transform: [{ rotate: "-90deg" }],
          }}
        />
        {/* Inner ring bg */}
        <View
          style={{
            position: "absolute",
            width: size - strokeW * 3,
            height: size - strokeW * 3,
            borderRadius: (size - strokeW * 3) / 2,
            borderWidth: strokeW,
            borderColor: "#1A1A1A",
          }}
        />
        {/* Inner ring fill - habits */}
        <View
          style={{
            position: "absolute",
            width: size - strokeW * 3,
            height: size - strokeW * 3,
            borderRadius: (size - strokeW * 3) / 2,
            borderWidth: strokeW,
            borderColor: "#F97316",
            borderRightColor: habitPct < 0.25 ? "transparent" : "#F97316",
            borderBottomColor: habitPct < 0.5 ? "transparent" : "#F97316",
            borderLeftColor: habitPct < 0.75 ? "transparent" : "#F97316",
            opacity: habitPct > 0 ? 1 : 0,
            transform: [{ rotate: "-90deg" }],
          }}
        />
        {/* Center */}
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              color: "#4ADE80",
              fontSize: 32,
              fontWeight: "800",
              letterSpacing: -2,
              lineHeight: 36,
            }}
          >
            {overallPct}%
          </Text>
          <Text style={{ color: "#737373", fontSize: 10, fontWeight: "500" }}>
            semana
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={{ flex: 1, gap: 14 }}>
        <View>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#4ADE80",
              }}
            />
            <Text style={{ color: "#A3A3A3", fontSize: 11, fontWeight: "500" }}>
              Tareas esta semana
            </Text>
          </View>
          <Text style={{ color: "#F5F5F5", fontSize: 18, fontWeight: "700", letterSpacing: -0.5 }}>
            {tasksCompleted}
            <Text style={{ color: "#737373", fontSize: 13, fontWeight: "500" }}>
              /{tasksTotal}
            </Text>
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "#1F1F1F",
          }}
        />

        <View>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#F97316",
              }}
            />
            <Text style={{ color: "#A3A3A3", fontSize: 11, fontWeight: "500" }}>
              Hábitos hoy
            </Text>
          </View>
          <Text style={{ color: "#F5F5F5", fontSize: 18, fontWeight: "700", letterSpacing: -0.5 }}>
            {habitsToday}
            <Text style={{ color: "#737373", fontSize: 13, fontWeight: "500" }}>
              /{habitsTotal}
            </Text>
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  count,
  color,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  color: string;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay ?? 0).duration(350)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
        marginTop: 4,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: `${color}18`,
          borderWidth: 1,
          borderColor: `${color}30`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          color: "#F5F5F5",
          fontSize: 17,
          fontWeight: "700",
          letterSpacing: -0.3,
          flex: 1,
        }}
      >
        {title}
      </Text>
      {count !== undefined ? (
        <View
          style={{
            backgroundColor: `${color}18`,
            borderRadius: 100,
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color, fontSize: 12, fontWeight: "600" }}>
            {count}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptySection({
  message,
  color,
}: {
  message: string;
  color: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "#0A0A0A",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1A1A1A",
        borderStyle: "dashed",
        paddingVertical: 24,
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <Text style={{ color: "#404040", fontSize: 13, fontWeight: "500" }}>
        {message}
      </Text>
    </View>
  );
}

// ─── Goal Mini Card ───────────────────────────────────────────────────────────

function GoalMiniCard({ goal, index }: { goal: Goal; index: number }) {
  const catColorMap: Record<string, string> = {
    finanzas: "#4ADE80",
    fitness: "#F97316",
    aprendizaje: "#818CF8",
    negocios: "#FBBF24",
    personal: "#34D399",
    hábitos: "#F472B6",
  };
  const color =
    catColorMap[(goal.category ?? "").toLowerCase()] ?? "#A3A3A3";

  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 60).duration(350)}
      style={{
        backgroundColor: "#0F0F0F",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1F1F1F",
        borderLeftWidth: 3,
        borderLeftColor: goal.isCompleted ? "#4ADE80" : color,
        padding: 14,
        marginBottom: 8,
        gap: 8,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
      >
        <Text
          style={{
            flex: 1,
            color: goal.isCompleted ? "#737373" : "#F5F5F5",
            fontSize: 14,
            fontWeight: "600",
            textDecorationLine: goal.isCompleted ? "line-through" : "none",
          }}
          numberOfLines={1}
        >
          {goal.title}
        </Text>
        <Text
          style={{
            color: goal.isCompleted ? "#4ADE80" : color,
            fontSize: 13,
            fontWeight: "700",
          }}
        >
          {goal.progress}%
        </Text>
      </View>
      <AnimatedBar
        progress={goal.progress}
        color={goal.isCompleted ? "#4ADE80" : color}
        height={5}
      />
    </Animated.View>
  );
}

// ─── Habit Mini Card ──────────────────────────────────────────────────────────

function HabitMiniCard({ habit, index }: { habit: Habit; index: number }) {
  const today = getTodayISO();
  const checkedToday = habit.checkIns.some(
    (c) => c.date.startsWith(today)
  );
  const color = habit.color ?? "#4ADE80";

  return (
    <Animated.View
      entering={FadeInDown.delay(400 + index * 60).duration(350)}
      style={{
        backgroundColor: "#0F0F0F",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1F1F1F",
        padding: 14,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Status dot */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: checkedToday ? `${color}20` : "#141414",
          borderWidth: 2,
          borderColor: checkedToday ? color : "#2A2A2A",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checkedToday ? (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: color,
            }}
          />
        ) : (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#2A2A2A",
            }}
          />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#F5F5F5",
            fontSize: 14,
            fontWeight: "600",
          }}
          numberOfLines={1}
        >
          {habit.title}
        </Text>
        {habit.category ? (
          <Text style={{ color: "#737373", fontSize: 11, marginTop: 1 }}>
            {habit.category}
          </Text>
        ) : null}
      </View>

      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            backgroundColor: `${color}18`,
            borderRadius: 100,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Flame size={10} color={color} />
          <Text style={{ color, fontSize: 11, fontWeight: "700" }}>
            {habit.streak}
          </Text>
        </View>
        <Text
          style={{
            color: checkedToday ? color : "#404040",
            fontSize: 10,
            fontWeight: "500",
          }}
        >
          {checkedToday ? "Hecho hoy" : "Pendiente"}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Project Mini Card ────────────────────────────────────────────────────────

function ProjectMiniCard({ project, index }: { project: Project; index: number }) {
  const statusMap: Record<string, { color: string; label: string }> = {
    active: { color: "#4ADE80", label: "Activo" },
    paused: { color: "#FBBF24", label: "Pausado" },
    completed: { color: "#818CF8", label: "Completado" },
    archived: { color: "#737373", label: "Archivado" },
  };
  const s = statusMap[project.status] ?? { color: "#A3A3A3", label: project.status };

  return (
    <Animated.View
      entering={FadeInDown.delay(500 + index * 60).duration(350)}
      style={{
        backgroundColor: "#0F0F0F",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1F1F1F",
        padding: 14,
        marginBottom: 8,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text
          style={{
            flex: 1,
            color: "#F5F5F5",
            fontSize: 14,
            fontWeight: "600",
          }}
          numberOfLines={1}
        >
          {project.title}
        </Text>
        <View
          style={{
            backgroundColor: `${s.color}18`,
            borderRadius: 100,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderWidth: 1,
            borderColor: `${s.color}30`,
          }}
        >
          <Text style={{ color: s.color, fontSize: 10, fontWeight: "600" }}>
            {s.label}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <AnimatedBar progress={project.progress} color={s.color} height={5} />
        </View>
        <Text
          style={{ color: s.color, fontSize: 12, fontWeight: "700", minWidth: 32 }}
        >
          {project.progress}%
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Life Goal Mini Card ──────────────────────────────────────────────────────

function LifeGoalMiniCard({ goal, index }: { goal: LifeGoal; index: number }) {
  const catColorMap: Record<string, string> = {
    carrera: "#818CF8",
    salud: "#4ADE80",
    relaciones: "#F472B6",
    finanzas: "#FBBF24",
    personal: "#34D399",
    educación: "#60A5FA",
  };
  const color =
    catColorMap[(goal.category ?? "").toLowerCase()] ?? "#A3A3A3";

  return (
    <Animated.View
      entering={FadeInDown.delay(600 + index * 60).duration(350)}
      style={{
        backgroundColor: "#0F0F0F",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1F1F1F",
        padding: 14,
        marginBottom: 8,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {goal.emoji ? (
          <Text style={{ fontSize: 20 }}>{goal.emoji}</Text>
        ) : (
          <Star size={16} color={color} />
        )}
        <Text
          style={{
            flex: 1,
            color: goal.isCompleted ? "#737373" : "#F5F5F5",
            fontSize: 14,
            fontWeight: "600",
          }}
          numberOfLines={1}
        >
          {goal.title}
        </Text>
        <Text style={{ color, fontSize: 13, fontWeight: "700" }}>
          {goal.progress}%
        </Text>
      </View>
      <AnimatedBar
        progress={goal.progress}
        color={goal.isCompleted ? "#4ADE80" : color}
        height={5}
      />
      {goal.category ? (
        <Text style={{ color: "#737373", fontSize: 10, fontWeight: "500" }}>
          {goal.category}
        </Text>
      ) : null}
    </Animated.View>
  );
}

// ─── Activity Feed Item ───────────────────────────────────────────────────────

interface FeedItem {
  id: string;
  text: string;
  time: string;
  color: string;
  icon: React.ReactNode;
}

function ActivityFeedItem({ item, index }: { item: FeedItem; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(700 + index * 50).duration(350)}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: index < 4 ? 1 : 0,
        borderBottomColor: "#141414",
      }}
      testID={`feed-item-${index}`}
    >
      {/* Timeline dot */}
      <View style={{ alignItems: "center", paddingTop: 2 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: `${item.color}18`,
            borderWidth: 1,
            borderColor: `${item.color}30`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {item.icon}
        </View>
      </View>
      <View style={{ flex: 1, paddingTop: 4 }}>
        <Text
          style={{
            color: "#D4D4D4",
            fontSize: 13,
            fontWeight: "500",
            lineHeight: 18,
          }}
        >
          {item.text}
        </Text>
        <Text style={{ color: "#404040", fontSize: 11, marginTop: 2 }}>
          {item.time}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickAction({
  label,
  icon,
  color,
  onPress,
  testId,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onPress: () => void;
  testId: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testId}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: pressed ? `${color}25` : `${color}12`,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: `${color}30`,
        paddingVertical: 12,
        alignItems: "center",
        gap: 6,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon}
      <Text style={{ color, fontSize: 11, fontWeight: "600", textAlign: "center" }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const router = useRouter();
  const [quoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const today = getTodayISO();
  const weekStart = getStartOfWeekISO();

  // ── Queries ─────────────────────────────────────────────────────────────────

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<Goal[]>("/api/goals"),
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.get<Task[]>("/api/tasks"),
  });

  const habitsQuery = useQuery({
    queryKey: ["habits"],
    queryFn: () => api.get<Habit[]>("/api/habits"),
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<Project[]>("/api/projects"),
  });

  const lifeGoalsQuery = useQuery({
    queryKey: ["life-goals"],
    queryFn: () => api.get<LifeGoal[]>("/api/life-goals"),
  });

  const isLoading =
    goalsQuery.isLoading ||
    tasksQuery.isLoading ||
    habitsQuery.isLoading ||
    projectsQuery.isLoading;

  const isRefetching =
    goalsQuery.isRefetching ||
    tasksQuery.isRefetching ||
    habitsQuery.isRefetching ||
    projectsQuery.isRefetching ||
    lifeGoalsQuery.isRefetching;

  const refetchAll = () => {
    goalsQuery.refetch();
    tasksQuery.refetch();
    habitsQuery.refetch();
    projectsQuery.refetch();
    lifeGoalsQuery.refetch();
  };

  // ── Derived data ────────────────────────────────────────────────────────────

  const goals: Goal[] = goalsQuery.data ?? [];
  const tasks: Task[] = tasksQuery.data ?? [];
  const habits: Habit[] = habitsQuery.data ?? [];
  const projects: Project[] = projectsQuery.data ?? [];
  const lifeGoals: LifeGoal[] = lifeGoalsQuery.data ?? [];

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  const activeHabits = habits.filter((h) => h.isActive !== false);
  const totalStreak = habits.reduce((s, h) => s + (h.streak ?? 0), 0);
  const habitsCheckedToday = habits.filter((h) =>
    h.checkIns.some((c) => c.date.startsWith(today))
  );

  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");

  const activeLifeGoals = lifeGoals.filter((g) => !g.isCompleted);
  const completedLifeGoals = lifeGoals.filter((g) => g.isCompleted);

  // Tasks completed this week
  const tasksThisWeek = tasks.filter(
    (t) => t.isCompleted && t.createdAt >= weekStart
  );
  const tasksThisWeekTotal = tasks.filter((t) => t.createdAt >= weekStart);

  // Overall weekly %
  const taskRatio =
    tasksThisWeekTotal.length > 0
      ? tasksThisWeek.length / tasksThisWeekTotal.length
      : 0;
  const habitRatio =
    activeHabits.length > 0
      ? habitsCheckedToday.length / activeHabits.length
      : 0;
  const overallPct = Math.round(((taskRatio + habitRatio) / 2) * 100);

  // ── Stat cards ──────────────────────────────────────────────────────────────

  const statCards: StatCardData[] = [
    {
      icon: <Target size={18} color="#4ADE80" />,
      value: activeGoals.length,
      label: "Objetivos Activos",
      color: "#4ADE80",
      bg: "#4ADE8018",
    },
    {
      icon: <SquareCheck size={18} color="#FBBF24" />,
      value: pendingTasks.length,
      label: "Tareas Pendientes",
      color: "#FBBF24",
      bg: "#FBBF2418",
    },
    {
      icon: <Flame size={18} color="#F97316" />,
      value: activeHabits.length,
      label: "Hábitos Activos",
      color: "#F97316",
      bg: "#F9731618",
    },
    {
      icon: <Layers size={18} color="#60A5FA" />,
      value: activeProjects.length,
      label: "Proyectos",
      color: "#60A5FA",
      bg: "#60A5FA18",
    },
    {
      icon: <Zap size={18} color="#A78BFA" />,
      value: totalStreak,
      label: "Racha Total",
      color: "#A78BFA",
      bg: "#A78BFA18",
    },
  ];

  // ── Activity feed ───────────────────────────────────────────────────────────

  const feedItems: FeedItem[] = [];

  completedTasks
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
    .forEach((t) => {
      feedItems.push({
        id: `task-${t.id}`,
        text: `Completaste "${t.title}"`,
        time: timeAgo(t.createdAt),
        color: "#4ADE80",
        icon: <SquareCheck size={12} color="#4ADE80" />,
      });
    });

  habits
    .filter((h) => h.checkIns.some((c) => c.date.startsWith(today)))
    .slice(0, 2)
    .forEach((h) => {
      const ci = h.checkIns.find((c) => c.date.startsWith(today));
      feedItems.push({
        id: `habit-${h.id}`,
        text: `Check-in en "${h.title}" — ${h.streak} días seguidos`,
        time: ci ? timeAgo(ci.date) : "hoy",
        color: h.color ?? "#F97316",
        icon: <Flame size={12} color={h.color ?? "#F97316"} />,
      });
    });

  feedItems.sort(() => Math.random() - 0.5);
  const displayFeed = feedItems.slice(0, 5);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }} testID="progress-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#080808" }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 }}>
          <Animated.View entering={FadeIn.duration(400)}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 30,
                    fontWeight: "800",
                    color: "#F5F5F5",
                    letterSpacing: -1,
                    lineHeight: 36,
                  }}
                >
                  Mi Progreso
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}
                >
                  <Calendar size={12} color="#737373" />
                  <Text style={{ color: "#737373", fontSize: 12, fontWeight: "500" }}>
                    {formatDate(new Date())}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "#4ADE801A",
                  borderWidth: 1,
                  borderColor: "#4ADE8030",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={20} color="#4ADE80" />
              </View>
            </View>

            {/* Quote */}
            <View
              style={{
                backgroundColor: "#0F0F0F",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                borderLeftWidth: 3,
                borderLeftColor: "#4ADE8050",
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginTop: 14,
              }}
            >
              <Text
                style={{
                  color: "#A3A3A3",
                  fontSize: 12,
                  fontStyle: "italic",
                  lineHeight: 18,
                }}
              >
                "{QUOTES[quoteIndex]}"
              </Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchAll}
            tintColor="#4ADE80"
          />
        }
        testID="progress-scroll"
      >
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* ── Stat Cards Row ───────────────────────────────────────────── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
              testID="stat-cards-scroll"
            >
              {statCards.map((card, i) => (
                <StatCard key={i} card={card} index={i} />
              ))}
            </ScrollView>

            {/* ── Weekly Progress Ring ─────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
              <WeeklyRing
                tasksCompleted={tasksThisWeek.length}
                tasksTotal={Math.max(tasksThisWeekTotal.length, 1)}
                habitsToday={habitsCheckedToday.length}
                habitsTotal={Math.max(activeHabits.length, 1)}
                overallPct={overallPct}
              />
            </View>

            {/* ── Goals Section ────────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <SectionHeader
                icon={<Target size={15} color="#4ADE80" />}
                title="Mis Objetivos"
                count={activeGoals.length}
                color="#4ADE80"
                delay={300}
              />
              {activeGoals.length === 0 ? (
                <EmptySection
                  message="Sin objetivos activos. ¡Crea uno para empezar!"
                  color="#4ADE80"
                />
              ) : (
                activeGoals.slice(0, 3).map((g, i) => (
                  <GoalMiniCard key={g.id} goal={g} index={i} />
                ))
              )}
              {activeGoals.length > 3 ? (
                <Pressable
                  onPress={() =>
                    router.push("/(app)/goals" as Parameters<typeof router.push>[0])
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    marginBottom: 4,
                  }}
                  testID="see-all-goals"
                >
                  <Text style={{ color: "#4ADE80", fontSize: 13, fontWeight: "600" }}>
                    Ver todos ({activeGoals.length})
                  </Text>
                  <ChevronRight size={14} color="#4ADE80" />
                </Pressable>
              ) : null}
            </View>

            {/* ── Habits Section ───────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <SectionHeader
                icon={<Flame size={15} color="#F97316" />}
                title="Mis Hábitos"
                count={habitsCheckedToday.length}
                color="#F97316"
                delay={400}
              />
              {activeHabits.length === 0 ? (
                <EmptySection
                  message="Sin hábitos activos. ¡El cambio empieza con uno!"
                  color="#F97316"
                />
              ) : (
                activeHabits.slice(0, 4).map((h, i) => (
                  <HabitMiniCard key={h.id} habit={h} index={i} />
                ))
              )}
              {activeHabits.length > 4 ? (
                <Pressable
                  onPress={() =>
                    router.push("/(app)/habits" as Parameters<typeof router.push>[0])
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    marginBottom: 4,
                  }}
                  testID="see-all-habits"
                >
                  <Text style={{ color: "#F97316", fontSize: 13, fontWeight: "600" }}>
                    Ver todos ({activeHabits.length})
                  </Text>
                  <ChevronRight size={14} color="#F97316" />
                </Pressable>
              ) : null}
            </View>

            {/* ── Projects Section ─────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <SectionHeader
                icon={<Layers size={15} color="#60A5FA" />}
                title="Mis Proyectos"
                count={activeProjects.length}
                color="#60A5FA"
                delay={500}
              />
              {activeProjects.length === 0 ? (
                <EmptySection
                  message="Sin proyectos activos. ¡Convierte tus ideas en acción!"
                  color="#60A5FA"
                />
              ) : (
                activeProjects.slice(0, 3).map((p, i) => (
                  <ProjectMiniCard key={p.id} project={p} index={i} />
                ))
              )}
              {activeProjects.length > 3 ? (
                <Pressable
                  onPress={() =>
                    router.push("/(app)/projects" as Parameters<typeof router.push>[0])
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    marginBottom: 4,
                  }}
                  testID="see-all-projects"
                >
                  <Text style={{ color: "#60A5FA", fontSize: 13, fontWeight: "600" }}>
                    Ver todos ({activeProjects.length})
                  </Text>
                  <ChevronRight size={14} color="#60A5FA" />
                </Pressable>
              ) : null}
            </View>

            {/* ── Life Goals Section ───────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <SectionHeader
                icon={<Star size={15} color="#FBBF24" />}
                title="Metas de Vida"
                count={activeLifeGoals.length}
                color="#FBBF24"
                delay={600}
              />
              {activeLifeGoals.length === 0 ? (
                <EmptySection
                  message="Sin metas de vida. ¡Define dónde quieres llegar!"
                  color="#FBBF24"
                />
              ) : (
                activeLifeGoals.slice(0, 3).map((g, i) => (
                  <LifeGoalMiniCard key={g.id} goal={g} index={i} />
                ))
              )}
            </View>

            {/* ── Activity Feed ────────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <SectionHeader
                icon={<Zap size={15} color="#A78BFA" />}
                title="Actividad Reciente"
                color="#A78BFA"
                delay={700}
              />
              <Animated.View
                entering={FadeInDown.delay(700).duration(400)}
                style={{
                  backgroundColor: "#0F0F0F",
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#1F1F1F",
                  padding: 16,
                }}
              >
                {displayFeed.length === 0 ? (
                  <View style={{ paddingVertical: 16, alignItems: "center" }}>
                    <Text style={{ color: "#404040", fontSize: 13 }}>
                      Aún sin actividad reciente.
                    </Text>
                    <Text
                      style={{
                        color: "#333",
                        fontSize: 12,
                        marginTop: 4,
                        textAlign: "center",
                      }}
                    >
                      Completa tareas y haz check-ins en tus hábitos para verlos aquí.
                    </Text>
                  </View>
                ) : (
                  displayFeed.map((item, i) => (
                    <ActivityFeedItem key={item.id} item={item} index={i} />
                  ))
                )}
              </Animated.View>
            </View>

            {/* ── Summary Stats Row ────────────────────────────────────────── */}
            <Animated.View
              entering={FadeInDown.delay(800).duration(400)}
              style={{ paddingHorizontal: 20, marginTop: 20 }}
            >
              <View
                style={{
                  backgroundColor: "#0F0F0F",
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#1F1F1F",
                  padding: 18,
                }}
              >
                <Text
                  style={{
                    color: "#A3A3A3",
                    fontSize: 11,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                    marginBottom: 14,
                  }}
                >
                  RESUMEN GLOBAL
                </Text>
                <View style={{ flexDirection: "row", gap: 0 }}>
                  {[
                    {
                      value: completedGoals.length,
                      label: "Objetivos\nlogrados",
                      color: "#4ADE80",
                    },
                    {
                      value: completedTasks.length,
                      label: "Tareas\ncompletadas",
                      color: "#FBBF24",
                    },
                    {
                      value: completedProjects.length,
                      label: "Proyectos\nterminados",
                      color: "#60A5FA",
                    },
                    {
                      value: completedLifeGoals.length,
                      label: "Metas de\nvida",
                      color: "#FBBF24",
                    },
                  ].map((s, i) => (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        borderRightWidth: i < 3 ? 1 : 0,
                        borderRightColor: "#1A1A1A",
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: s.color,
                          fontSize: 26,
                          fontWeight: "800",
                          letterSpacing: -1,
                        }}
                      >
                        {s.value}
                      </Text>
                      <Text
                        style={{
                          color: "#737373",
                          fontSize: 9,
                          textAlign: "center",
                          lineHeight: 12,
                          marginTop: 2,
                        }}
                      >
                        {s.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* ── Quick Actions ────────────────────────────────────────────── */}
            <Animated.View
              entering={FadeInDown.delay(900).duration(400)}
              style={{ paddingHorizontal: 20, marginTop: 20 }}
            >
              <Text
                style={{
                  color: "#A3A3A3",
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                ACCIONES RÁPIDAS
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <QuickAction
                  label={"Nueva\nTarea"}
                  icon={<SquareCheck size={18} color="#FBBF24" />}
                  color="#FBBF24"
                  onPress={() =>
                    router.push("/(app)/tasks" as Parameters<typeof router.push>[0])
                  }
                  testId="quick-action-task"
                />
                <QuickAction
                  label={"Check-in\nHábito"}
                  icon={<Flame size={18} color="#F97316" />}
                  color="#F97316"
                  onPress={() =>
                    router.push("/(app)/habits" as Parameters<typeof router.push>[0])
                  }
                  testId="quick-action-habit"
                />
                <QuickAction
                  label={"Nuevo\nObjetivo"}
                  icon={<Target size={18} color="#4ADE80" />}
                  color="#4ADE80"
                  onPress={() =>
                    router.push("/(app)/goals" as Parameters<typeof router.push>[0])
                  }
                  testId="quick-action-goal"
                />
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
