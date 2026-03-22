import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Target,
  Plus,
  X,
  Check,
  Trash2,
  TrendingUp,
  Calendar,
  Layers,
  Award,
  SquareCheck,
  Flame,
  Star,
  BookOpen,
} from "lucide-react-native";
import { api } from "@/lib/api/api";
import { Goal } from "@/types";
import { useTheme } from "@/lib/theme";

// ─── Category config ──────────────────────────────────────────────────────────

type CategoryKey =
  | "finanzas"
  | "fitness"
  | "aprendizaje"
  | "negocios"
  | "personal"
  | "hábitos";

const CATEGORIES: { key: CategoryKey; label: string; color: string; bg: string }[] =
  [
    { key: "finanzas", label: "Finanzas", color: "#4ADE80", bg: "#4ADE801A" },
    { key: "fitness", label: "Fitness", color: "#F97316", bg: "#F973161A" },
    { key: "aprendizaje", label: "Aprendizaje", color: "#818CF8", bg: "#818CF81A" },
    { key: "negocios", label: "Negocios", color: "#FBBF24", bg: "#FBBF241A" },
    { key: "personal", label: "Personal", color: "#34D399", bg: "#34D3991A" },
    { key: "hábitos", label: "Hábitos", color: "#F472B6", bg: "#F472B61A" },
  ];

function getCategoryStyle(category: string | null | undefined) {
  const found = CATEGORIES.find(
    (c) => c.key === (category ?? "").toLowerCase()
  );
  return found ?? { color: "#A3A3A3", bg: "#A3A3A31A", label: category ?? "" };
}

// ─── Animated progress bar ────────────────────────────────────────────────────

function ProgressBar({
  progress,
  color,
  daysLeft,
  trackColor,
  labelColor,
}: {
  progress: number;
  color: string;
  daysLeft: number | null;
  trackColor?: string;
  labelColor?: string;
}) {
  const { colors } = useTheme();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(100, Math.max(0, progress)), {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as `${number}%`,
  }));

  return (
    <View style={{ marginTop: 10, marginBottom: 6 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <Text
          style={{ color: labelColor ?? colors.text3, fontSize: 11, fontWeight: "500" }}
        >
          {daysLeft !== null
            ? daysLeft > 0
              ? `${daysLeft} días restantes`
              : "Fecha límite pasada"
            : "Sin fecha límite"}
        </Text>
        <Text
          style={{
            color: progress >= 100 ? "#4ADE80" : color,
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {progress}%
        </Text>
      </View>
      <View
        style={{
          height: 7,
          backgroundColor: trackColor ?? colors.bg4,
          borderRadius: 100,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            {
              height: 7,
              borderRadius: 100,
              backgroundColor: progress >= 100 ? "#4ADE80" : color,
              shadowColor: progress >= 100 ? "#4ADE80" : color,
              shadowOpacity: 0.5,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            },
            barStyle,
          ]}
        />
      </View>
    </View>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  index,
  onComplete,
  onDelete,
  onUpdateProgress,
}: {
  goal: Goal;
  index: number;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
}) {
  const { colors: themeColors } = useTheme();
  const catStyle = getCategoryStyle(goal.category);
  const daysLeft =
    goal.dueDate
      ? Math.ceil(
          (new Date(goal.dueDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  const accentColor = goal.isCompleted ? "#4ADE80" : catStyle.color;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      <View
        testID="goal-card"
        style={{
          backgroundColor: themeColors.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: themeColors.border,
          borderLeftWidth: 3,
          borderLeftColor: accentColor,
          padding: 18,
          marginBottom: 12,
        }}
      >
        {/* Header row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 100,
              backgroundColor: goal.isCompleted ? "#4ADE801A" : catStyle.bg,
              borderWidth: 1,
              borderColor: goal.isCompleted ? "#4ADE804D" : `${catStyle.color}4D`,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {goal.isCompleted ? (
              <Award size={16} color="#4ADE80" />
            ) : (
              <Target size={16} color={catStyle.color} />
            )}
          </View>

          {/* Title + category */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: goal.isCompleted ? themeColors.text3 : themeColors.text,
                fontSize: 15,
                fontWeight: "700",
                letterSpacing: 0.1,
                textDecorationLine: goal.isCompleted ? "line-through" : "none",
                marginBottom: 4,
              }}
            >
              {goal.title}
            </Text>
            {goal.description ? (
              <Text
                style={{
                  color: themeColors.text3,
                  fontSize: 12,
                  lineHeight: 18,
                  marginBottom: 4,
                }}
                numberOfLines={2}
              >
                {goal.description}
              </Text>
            ) : null}
            {goal.category ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: catStyle.bg,
                  borderRadius: 100,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    color: catStyle.color,
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 0.2,
                  }}
                >
                  {catStyle.label || goal.category}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Delete button */}
          <Pressable
            testID={`delete-goal-${goal.id}`}
            onPress={() => onDelete(goal.id)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 100,
              backgroundColor: "#EF44441A",
              borderWidth: 1,
              borderColor: "#EF444430",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Trash2 size={13} color="#EF4444" />
          </Pressable>
        </View>

        {/* Progress bar */}
        <ProgressBar
          progress={goal.progress}
          color={catStyle.color}
          daysLeft={daysLeft}
        />

        {/* Progress buttons + complete action */}
        {!goal.isCompleted ? (
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              marginTop: 4,
            }}
          >
            {[25, 50, 75, 100].map((val) => (
              <Pressable
                key={val}
                testID={`progress-${val}-${goal.id}`}
                onPress={() => onUpdateProgress(goal.id, val)}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor:
                    goal.progress >= val
                      ? `${catStyle.color}1F`
                      : themeColors.bg4,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor:
                    goal.progress >= val
                      ? `${catStyle.color}4D`
                      : themeColors.border,
                }}
              >
                <Text
                  style={{
                    color:
                      goal.progress >= val ? catStyle.color : themeColors.text4,
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  {val}%
                </Text>
              </Pressable>
            ))}
            <Pressable
              testID={`complete-goal-${goal.id}`}
              onPress={() => onComplete(goal.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 100,
                backgroundColor: "#4ADE801A",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#4ADE8030",
                flexDirection: "row",
                gap: 4,
              }}
            >
              <Check size={12} color="#4ADE80" />
              <Text
                style={{ color: "#4ADE80", fontSize: 11, fontWeight: "600" }}
              >
                Hecho
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#4ADE801A",
                borderRadius: 100,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: "#4ADE8030",
              }}
            >
              <Award size={12} color="#4ADE80" />
              <Text
                style={{ color: "#4ADE80", fontSize: 12, fontWeight: "600" }}
              >
                Completado
              </Text>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Create Goal Modal ────────────────────────────────────────────────────────

type NewGoalForm = {
  title: string;
  description: string;
  category: CategoryKey | "";
  targetDate: string;
};

function CreateGoalModal({
  visible,
  onClose,
  onSubmit,
  isPending,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: NewGoalForm) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<NewGoalForm>({
    title: "",
    description: "",
    category: "",
    targetDate: "",
  });
  const { colors } = useTheme();

  const reset = () => {
    setForm({ title: "", description: "", category: "", targetDate: "" });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSubmit(form);
    reset();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          {/* Drag handle */}
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: colors.border,
              borderRadius: 100,
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 20,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              marginBottom: 24,
            }}
          >
            <Pressable
              onPress={handleClose}
              testID="close-modal-button"
              style={{
                width: 36,
                height: 36,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color={colors.text2} />
            </Pressable>
            <Text
              style={{
                flex: 1,
                textAlign: "center",
                color: colors.text,
                fontSize: 17,
                fontWeight: "700",
              }}
            >
              Nuevo Objetivo
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text
              style={{
                color: colors.text2,
                fontSize: 12,
                fontWeight: "600",
                marginBottom: 8,
                letterSpacing: 0.3,
              }}
            >
              TÍTULO *
            </Text>
            <TextInput
              value={form.title}
              onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              placeholder="Ej. Lanzar mi primer producto"
              placeholderTextColor={colors.text4}
              testID="goal-title-input"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 14,
                color: colors.text,
                fontSize: 15,
                marginBottom: 20,
              }}
            />

            {/* Description */}
            <Text
              style={{
                color: colors.text2,
                fontSize: 12,
                fontWeight: "600",
                marginBottom: 8,
                letterSpacing: 0.3,
              }}
            >
              DESCRIPCIÓN
            </Text>
            <TextInput
              value={form.description}
              onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
              placeholder="¿Qué quieres lograr exactamente?"
              placeholderTextColor={colors.text4}
              multiline
              testID="goal-description-input"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 14,
                color: colors.text,
                fontSize: 14,
                lineHeight: 21,
                minHeight: 90,
                marginBottom: 20,
                textAlignVertical: "top",
              }}
            />

            {/* Category */}
            <Text
              style={{
                color: colors.text2,
                fontSize: 12,
                fontWeight: "600",
                marginBottom: 12,
                letterSpacing: 0.3,
              }}
            >
              CATEGORÍA
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {CATEGORIES.map((cat) => {
                const active = form.category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() =>
                      setForm((p) => ({
                        ...p,
                        category: active ? "" : cat.key,
                      }))
                    }
                    testID={`category-${cat.key}`}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 100,
                      backgroundColor: active ? cat.bg : colors.card,
                      borderWidth: 1.5,
                      borderColor: active ? cat.color : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? cat.color : colors.text3,
                        fontSize: 13,
                        fontWeight: active ? "600" : "400",
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Target date */}
            <Text
              style={{
                color: colors.text2,
                fontSize: 12,
                fontWeight: "600",
                marginBottom: 8,
                letterSpacing: 0.3,
              }}
            >
              FECHA LÍMITE
            </Text>
            <TextInput
              value={form.targetDate}
              onChangeText={(v) => setForm((p) => ({ ...p, targetDate: v }))}
              placeholder="AAAA-MM-DD (ej. 2026-06-30)"
              placeholderTextColor={colors.text4}
              testID="goal-date-input"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 14,
                color: colors.text,
                fontSize: 14,
                marginBottom: 32,
              }}
            />

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={!form.title.trim() || isPending}
              testID="create-goal-button"
              style={{
                backgroundColor: "#4ADE80",
                borderRadius: 100,
                paddingVertical: 17,
                alignItems: "center",
                opacity: !form.title.trim() ? 0.4 : 1,
                shadowColor: "#4ADE80",
                shadowOpacity: 0.3,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              {isPending ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text
                  style={{
                    color: colors.bg,
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Crear Objetivo
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatsRow({ goals }: { goals: Goal[] }) {
  const { colors } = useTheme();
  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);
  const avgProgress =
    active.length > 0
      ? Math.round(
          active.reduce((sum, g) => sum + g.progress, 0) / active.length
        )
      : 0;

  const stats = [
    {
      icon: <Layers size={16} color="#4ADE80" />,
      value: active.length,
      label: "Activos",
      color: "#4ADE80",
    },
    {
      icon: <TrendingUp size={16} color="#818CF8" />,
      value: `${avgProgress}%`,
      label: "Progreso medio",
      color: "#818CF8",
    },
    {
      icon: <Award size={16} color="#FBBF24" />,
      value: completed.length,
      label: "Completados",
      color: "#FBBF24",
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
      }}
    >
      {stats.map((s, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            alignItems: "center",
            gap: 6,
          }}
        >
          {s.icon}
          <Text
            style={{
              color: s.color,
              fontSize: 22,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}
          >
            {s.value}
          </Text>
          <Text
            style={{
              color: colors.text3,
              fontSize: 10,
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type TabFilter = "activos" | "completados";

export default function GoalsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const [tab, setTab] = useState<TabFilter>("activos");
  const [showCreate, setShowCreate] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: goals,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<Goal[]>("/api/goals"),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createGoal = useMutation({
    mutationFn: (form: NewGoalForm) =>
      api.post<Goal>("/api/goals", {
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        targetDate: form.targetDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowCreate(false);
    },
  });

  const updateProgress = useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      api.patch<Goal>(`/api/goals/${id}`, { progress }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const completeGoal = useMutation({
    mutationFn: (id: string) =>
      api.patch<Goal>(`/api/goals/${id}`, { progress: 100 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) => api.delete(`/api/goals/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  // ── Filtered data ──────────────────────────────────────────────────────────

  const allGoals: Goal[] = goals ?? [];
  const filtered = allGoals.filter((g) =>
    tab === "activos" ? !g.isCompleted : g.isCompleted
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="goals-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: colors.text,
                  letterSpacing: -0.8,
                }}
              >
                Objetivos
              </Text>
              <Text
                style={{ color: colors.text3, fontSize: 13, marginTop: 2 }}
              >
                {allGoals.length === 0
                  ? "Sin objetivos aún"
                  : `${allGoals.length} objetivo${allGoals.length !== 1 ? "s" : ""} en total`}
              </Text>
            </View>
            <Pressable
              testID="calendar-icon-header"
              style={{
                width: 40,
                height: 40,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.card,
              }}
            >
              <Calendar size={17} color={colors.text3} />
            </Pressable>
          </View>

          {/* Tab switcher */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 100,
              padding: 4,
              gap: 4,
              marginBottom: 0,
            }}
          >
            {(["activos", "completados"] as TabFilter[]).map((tabKey) => (
              <Pressable
                key={tabKey}
                onPress={() => setTab(tabKey)}
                testID={`tab-${tabKey}`}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 100,
                  alignItems: "center",
                  backgroundColor:
                    tab === tabKey ? "#4ADE80" : "transparent",
                }}
              >
                <Text
                  style={{
                    color: tab === tabKey ? colors.bg : colors.text3,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {tabKey === "activos" ? "Activos" : "Completados"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Productivity hub navigation */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 0, gap: 10, paddingTop: 14, paddingBottom: 2 }}
          >
            {[
              { label: "Hábitos", subtitle: "Rutinas", icon: Flame, route: "/(app)/habits", color: "#F97316" },
              { label: "Progreso", subtitle: "Avance", icon: TrendingUp, route: "/(app)/progress", color: "#4ADE80" },
              { label: "Metas de Vida", subtitle: "Sueños", icon: Star, route: "/(app)/life-goals", color: "#FBBF24" },
              { label: "Tareas", subtitle: "Pendientes", icon: SquareCheck, route: "/(app)/tasks", color: "#60A5FA" },
              { label: "Diario", subtitle: "Reflexión", icon: BookOpen, route: "/(app)/journal", color: "#F472B6" },
              { label: "Proyectos", subtitle: "Iniciativas", icon: Layers, route: "/(app)/projects", color: "#60A5FA" },
            ].map((item) => (
              <Pressable
                key={item.route}
                onPress={() => router.push(item.route as any)}
                testID={`productivity-nav-${item.label.toLowerCase()}`}
                style={{
                  width: 90,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 100,
                    backgroundColor: `${item.color}20`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <item.icon size={14} color={item.color} />
                </View>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    color: colors.text3,
                    fontSize: 10,
                    textAlign: "center",
                  }}
                >
                  {item.subtitle}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 110,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#4ADE80"
          />
        }
      >
        {/* Stats */}
        {allGoals.length > 0 ? (
          <StatsRow goals={allGoals} />
        ) : null}

        {/* Loading */}
        {isLoading ? (
          <View
            style={{ alignItems: "center", paddingVertical: 48 }}
            testID="loading-indicator"
          >
            <ActivityIndicator color="#4ADE80" />
            <Text
              style={{ color: colors.text3, fontSize: 13, marginTop: 12 }}
            >
              Cargando objetivos...
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <View
            style={{
              alignItems: "center",
              paddingVertical: 56,
              backgroundColor: colors.card,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: "dashed",
            }}
            testID="empty-state"
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 100,
                backgroundColor: "#4ADE801A",
                borderWidth: 1,
                borderColor: "#4ADE8030",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Target size={26} color="#4ADE80" />
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 17,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              {tab === "activos"
                ? "Sin objetivos activos"
                : "Nada completado aún"}
            </Text>
            <Text
              style={{
                color: colors.text3,
                fontSize: 13,
                textAlign: "center",
                paddingHorizontal: 28,
                lineHeight: 20,
              }}
            >
              {tab === "activos"
                ? "Crea tu primer objetivo y empieza a medir tu progreso."
                : "Completa un objetivo activo para verlo aquí."}
            </Text>
            {tab === "activos" ? (
              <Pressable
                onPress={() => setShowCreate(true)}
                testID="empty-create-button"
                style={{
                  marginTop: 20,
                  backgroundColor: "#4ADE801A",
                  borderWidth: 1,
                  borderColor: "#4ADE8030",
                  borderRadius: 100,
                  paddingHorizontal: 24,
                  paddingVertical: 11,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus size={14} color="#4ADE80" />
                <Text
                  style={{
                    color: "#4ADE80",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Crear objetivo
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          /* Goal list */
          filtered.map((goal, i) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={i}
              onComplete={(id) => completeGoal.mutate(id)}
              onDelete={(id) => deleteGoal.mutate(id)}
              onUpdateProgress={(id, progress) =>
                updateProgress.mutate({ id, progress })
              }
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setShowCreate(true)}
        testID="fab-create-goal"
        style={{
          position: "absolute",
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 100,
          backgroundColor: "#4ADE80",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#4ADE80",
          shadowOpacity: 0.45,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Plus size={24} color={colors.bg} strokeWidth={2.5} />
      </Pressable>

      {/* Create modal */}
      <CreateGoalModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(form) => createGoal.mutate(form)}
        isPending={createGoal.isPending}
      />
    </View>
  );
}
