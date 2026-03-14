import React, { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import {
  Flame,
  Plus,
  X,
  Check,
  Trash2,
  Zap,
  Star,
  Activity,
  BookOpen,
  Briefcase,
  DollarSign,
  Heart,
  User,
} from "lucide-react-native";
import { api } from "@/lib/api/api";
import { Habit } from "@/types";

// ─── Category config ───────────────────────────────────────────────────────────

type HabitCategory =
  | "Salud"
  | "Fitness"
  | "Aprendizaje"
  | "Negocios"
  | "Finanzas"
  | "Bienestar"
  | "Personal";

const HABIT_CATEGORIES: {
  key: HabitCategory;
  label: string;
  color: string;
  bg: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
}[] = [
  { key: "Salud", label: "Salud", color: "#4ADE80", bg: "#4ADE801A", Icon: Heart },
  { key: "Fitness", label: "Fitness", color: "#F97316", bg: "#F973161A", Icon: Activity },
  { key: "Aprendizaje", label: "Aprendizaje", color: "#818CF8", bg: "#818CF81A", Icon: BookOpen },
  { key: "Negocios", label: "Negocios", color: "#FBBF24", bg: "#FBBF241A", Icon: Briefcase },
  { key: "Finanzas", label: "Finanzas", color: "#34D399", bg: "#34D3991A", Icon: DollarSign },
  { key: "Bienestar", label: "Bienestar", color: "#F472B6", bg: "#F472B61A", Icon: Star },
  { key: "Personal", label: "Personal", color: "#60A5FA", bg: "#60A5FA1A", Icon: User },
];

const HABIT_COLORS = [
  "#4ADE80",
  "#F97316",
  "#818CF8",
  "#FBBF24",
  "#34D399",
  "#F472B6",
  "#60A5FA",
  "#EF4444",
  "#A78BFA",
  "#FB923C",
];

function getCategoryStyle(category: string | null | undefined) {
  return (
    HABIT_CATEGORIES.find((c) => c.key === category) ?? {
      color: "#A3A3A3",
      bg: "#A3A3A31A",
      label: category ?? "",
      Icon: Zap,
    }
  );
}

// ─── Calendar Grid (28 days) ───────────────────────────────────────────────────

function HabitCalendarGrid({ checkIns }: { checkIns: string[] }) {
  const today = new Date();
  const days: { date: string; isChecked: boolean; isToday: boolean }[] = [];

  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      date: dateStr,
      isChecked: checkIns.includes(dateStr),
      isToday: i === 0,
    });
  }

  // Day labels (Mon-Sun)
  const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <View style={{ marginTop: 12 }}>
      {/* Week labels */}
      <View style={{ flexDirection: "row", gap: 4, marginBottom: 4 }}>
        {dayLabels.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: "#404040", fontSize: 9, fontWeight: "600" }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid rows - 4 rows of 7 */}
      {Array.from({ length: 4 }).map((_, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: "row", gap: 4, marginBottom: 4 }}>
          {days.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => (
            <View
              key={colIdx}
              style={{
                flex: 1,
                aspectRatio: 1,
                borderRadius: 5,
                backgroundColor: day.isChecked
                  ? "#4ADE80"
                  : day.isToday
                  ? "#1F1F1F"
                  : "#141414",
                borderWidth: day.isToday ? 1.5 : 0,
                borderColor: day.isToday ? "#4ADE8060" : "transparent",
                opacity: day.isChecked ? 1 : 0.6,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Check-in Button ───────────────────────────────────────────────────────────

function CheckInButton({
  isChecked,
  color,
  onPress,
  isLoading,
}: {
  isChecked: boolean;
  color: string;
  onPress: () => void;
  isLoading: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.88, { damping: 12 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        disabled={isLoading}
        testID="checkin-button"
        style={{
          width: 48,
          height: 48,
          borderRadius: 100,
          backgroundColor: isChecked ? "#4ADE80" : `${color}1A`,
          borderWidth: 2,
          borderColor: isChecked ? "#4ADE80" : `${color}60`,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: isChecked ? "#4ADE80" : color,
          shadowOpacity: isChecked ? 0.5 : 0.1,
          shadowRadius: isChecked ? 12 : 4,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isChecked ? "#080808" : color} />
        ) : (
          <Check size={20} color={isChecked ? "#080808" : color} strokeWidth={2.5} />
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Habit Card ────────────────────────────────────────────────────────────────

function HabitCard({
  habit,
  index,
  onCheckIn,
  onDelete,
  isCheckingIn,
}: {
  habit: Habit;
  index: number;
  onCheckIn: (id: string) => void;
  onDelete: (id: string) => void;
  isCheckingIn: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const catStyle = getCategoryStyle(habit.category);
  const color = habit.color ?? catStyle.color;
  const today = new Date().toISOString().slice(0, 10);
  const isCheckedToday = habit.checkIns?.some((c) => c.date === today) ?? false;
  const checkInDates = habit.checkIns?.map((c) => c.date) ?? [];

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      <View
        testID="habit-card"
        style={{
          backgroundColor: "#0F0F0F",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#1F1F1F",
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        {/* Color accent bar */}
        <View
          style={{
            height: 3,
            backgroundColor: color,
            opacity: 0.7,
          }}
        />

        <View style={{ padding: 16 }}>
          {/* Main row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {/* Color dot */}
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: color,
                shadowColor: color,
                shadowOpacity: 0.6,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
              }}
            />

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#F5F5F5", fontSize: 15, fontWeight: "700", letterSpacing: 0.1 }}>
                {habit.title}
              </Text>
              {habit.category ? (
                <Text style={{ color: catStyle.color, fontSize: 11, marginTop: 2, fontWeight: "500" }}>
                  {habit.category}
                </Text>
              ) : null}
            </View>

            {/* Streak */}
            <View style={{ alignItems: "center", marginRight: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Flame size={16} color="#F97316" />
                <Text style={{ color: "#F97316", fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}>
                  {habit.streak}
                </Text>
              </View>
              <Text style={{ color: "#737373", fontSize: 9, fontWeight: "500" }}>racha</Text>
            </View>

            {/* Check-in button */}
            <CheckInButton
              isChecked={isCheckedToday}
              color={color}
              onPress={() => onCheckIn(habit.id)}
              isLoading={isCheckingIn}
            />
          </View>

          {/* Best streak + expand toggle */}
          <Pressable
            onPress={() => setExpanded(!expanded)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 12,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: "#1A1A1A",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Star size={11} color="#FBBF24" />
                <Text style={{ color: "#737373", fontSize: 11 }}>
                  Mejor racha: <Text style={{ color: "#FBBF24", fontWeight: "700" }}>{habit.bestStreak}</Text>
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Activity size={11} color="#737373" />
                <Text style={{ color: "#737373", fontSize: 11 }}>
                  {checkInDates.length} días completados
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Pressable
                onPress={() => onDelete(habit.id)}
                testID={`delete-habit-${habit.id}`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 100,
                  backgroundColor: "#EF44441A",
                  borderWidth: 1,
                  borderColor: "#EF444430",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={11} color="#EF4444" />
              </Pressable>
              <Text style={{ color: "#404040", fontSize: 11 }}>{expanded ? "Ocultar" : "Historial"}</Text>
            </View>
          </Pressable>

          {/* Calendar grid */}
          {expanded ? <HabitCalendarGrid checkIns={checkInDates} /> : null}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Create Habit Modal ────────────────────────────────────────────────────────

type NewHabitForm = {
  title: string;
  description: string;
  category: HabitCategory | "";
  color: string;
};

function CreateHabitModal({
  visible,
  onClose,
  onSubmit,
  isPending,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: NewHabitForm) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<NewHabitForm>({
    title: "",
    description: "",
    category: "",
    color: "#4ADE80",
  });

  const reset = () => {
    setForm({ title: "", description: "", category: "", color: "#4ADE80" });
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
        <View style={{ flex: 1, backgroundColor: "#080808" }}>
          {/* Drag handle */}
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: "#2A2A2A",
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
              testID="close-habit-modal"
              style={{
                width: 36,
                height: 36,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: "#1F1F1F",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color="#A3A3A3" />
            </Pressable>
            <Text
              style={{
                flex: 1,
                textAlign: "center",
                color: "#F5F5F5",
                fontSize: 17,
                fontWeight: "700",
              }}
            >
              Nuevo Hábito
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <Text style={{ color: "#A3A3A3", fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.3 }}>
              TÍTULO *
            </Text>
            <TextInput
              value={form.title}
              onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              placeholder="Ej. Meditar 10 minutos"
              placeholderTextColor="#404040"
              testID="habit-title-input"
              style={{
                backgroundColor: "#0F0F0F",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                borderRadius: 14,
                padding: 14,
                color: "#F5F5F5",
                fontSize: 15,
                marginBottom: 20,
              }}
            />

            {/* Description */}
            <Text style={{ color: "#A3A3A3", fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.3 }}>
              DESCRIPCIÓN
            </Text>
            <TextInput
              value={form.description}
              onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
              placeholder="¿Por qué es importante este hábito?"
              placeholderTextColor="#404040"
              multiline
              testID="habit-description-input"
              style={{
                backgroundColor: "#0F0F0F",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                borderRadius: 14,
                padding: 14,
                color: "#F5F5F5",
                fontSize: 14,
                lineHeight: 21,
                minHeight: 80,
                marginBottom: 20,
                textAlignVertical: "top",
              }}
            />

            {/* Category */}
            <Text style={{ color: "#A3A3A3", fontSize: 12, fontWeight: "600", marginBottom: 12, letterSpacing: 0.3 }}>
              CATEGORÍA
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {HABIT_CATEGORIES.map((cat) => {
                const active = form.category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => setForm((p) => ({ ...p, category: active ? "" : cat.key }))}
                    testID={`habit-category-${cat.key}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 100,
                      backgroundColor: active ? cat.bg : "#0F0F0F",
                      borderWidth: 1.5,
                      borderColor: active ? cat.color : "#1F1F1F",
                    }}
                  >
                    <cat.Icon size={12} color={active ? cat.color : "#737373"} />
                    <Text style={{ color: active ? cat.color : "#737373", fontSize: 12, fontWeight: active ? "600" : "400" }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Color */}
            <Text style={{ color: "#A3A3A3", fontSize: 12, fontWeight: "600", marginBottom: 12, letterSpacing: 0.3 }}>
              COLOR
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
              {HABIT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setForm((p) => ({ ...p, color: c }))}
                  testID={`color-${c}`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 100,
                    backgroundColor: c,
                    borderWidth: form.color === c ? 3 : 0,
                    borderColor: "#F5F5F5",
                    shadowColor: c,
                    shadowOpacity: form.color === c ? 0.6 : 0,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {form.color === c ? <Check size={16} color="#080808" strokeWidth={3} /> : null}
                </Pressable>
              ))}
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={!form.title.trim() || isPending}
              testID="create-habit-submit"
              style={{
                backgroundColor: form.color,
                borderRadius: 100,
                paddingVertical: 17,
                alignItems: "center",
                opacity: !form.title.trim() ? 0.4 : 1,
                shadowColor: form.color,
                shadowOpacity: 0.4,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              {isPending ? (
                <ActivityIndicator color="#080808" />
              ) : (
                <Text style={{ color: "#080808", fontSize: 15, fontWeight: "700" }}>
                  Crear Hábito
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Stats Row ─────────────────────────────────────────────────────────────────

function HabitStatsRow({ habits }: { habits: Habit[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const checkedToday = habits.filter((h) => h.checkIns?.some((c) => c.date === today)).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);

  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
      {[
        { value: `${checkedToday}/${habits.length}`, label: "Completados hoy", color: "#4ADE80" },
        { value: totalStreak, label: "Rachas totales", color: "#F97316" },
        { value: bestStreak, label: "Mejor racha", color: "#FBBF24" },
      ].map((s, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: "#0F0F0F",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#1F1F1F",
            padding: 12,
            alignItems: "center",
            gap: 4,
          }}
        >
          <Text style={{ color: s.color, fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}>
            {s.value}
          </Text>
          <Text style={{ color: "#737373", fontSize: 10, fontWeight: "500", textAlign: "center" }}>
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function HabitsScreen() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const { data: habits, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["habits"],
    queryFn: () => api.get<Habit[]>("/api/habits"),
  });

  const createHabit = useMutation({
    mutationFn: (form: NewHabitForm) =>
      api.post<Habit>("/api/habits", {
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        color: form.color,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setShowCreate(false);
    },
  });

  const checkIn = useMutation({
    mutationFn: (id: string) => api.post<Habit>(`/api/habits/${id}/checkin`, {}),
    onMutate: (id) => setCheckingInId(id),
    onSettled: () => setCheckingInId(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });

  const deleteHabit = useMutation({
    mutationFn: (id: string) => api.delete(`/api/habits/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });

  const allHabits: Habit[] = (habits ?? []).filter((h) => h.isActive);
  const today = new Date().toISOString().slice(0, 10);
  const checkedTodayCount = allHabits.filter((h) => h.checkIns?.some((c) => c.date === today)).length;

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }} testID="habits-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <View>
              <Text style={{ fontSize: 28, fontWeight: "800", color: "#F5F5F5", letterSpacing: -0.8 }}>
                Hábitos
              </Text>
              <Text style={{ color: "#737373", fontSize: 13, marginTop: 2 }}>
                {allHabits.length === 0
                  ? "Construye tu rutina diaria"
                  : `${checkedTodayCount}/${allHabits.length} completados hoy`}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Flame size={18} color="#F97316" />
                <Text style={{ color: "#F97316", fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
                  {allHabits.reduce((max, h) => Math.max(max, h.streak), 0)}
                </Text>
              </View>
              <Text style={{ color: "#737373", fontSize: 10 }}>mejor racha</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4ADE80" />
        }
      >
        {/* Stats */}
        {allHabits.length > 0 ? <HabitStatsRow habits={allHabits} /> : null}

        {/* Loading */}
        {isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }} testID="loading-indicator">
            <ActivityIndicator color="#4ADE80" />
            <Text style={{ color: "#737373", fontSize: 13, marginTop: 12 }}>Cargando hábitos...</Text>
          </View>
        ) : allHabits.length === 0 ? (
          /* Empty state */
          <View
            style={{
              alignItems: "center",
              paddingVertical: 56,
              backgroundColor: "#0F0F0F",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#1F1F1F",
              borderStyle: "dashed",
            }}
            testID="empty-state"
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 100,
                backgroundColor: "#F973161A",
                borderWidth: 1,
                borderColor: "#F9731630",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Flame size={32} color="#F97316" />
            </View>
            <Text style={{ color: "#F5F5F5", fontSize: 17, fontWeight: "700", marginBottom: 8 }}>
              Sin hábitos activos
            </Text>
            <Text
              style={{
                color: "#737373",
                fontSize: 13,
                textAlign: "center",
                paddingHorizontal: 32,
                lineHeight: 20,
              }}
            >
              Los grandes logros nacen de pequenas acciones diarias. Empieza hoy.
            </Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              testID="empty-create-habit"
              style={{
                marginTop: 20,
                backgroundColor: "#F973161A",
                borderWidth: 1,
                borderColor: "#F9731630",
                borderRadius: 100,
                paddingHorizontal: 24,
                paddingVertical: 11,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Flame size={14} color="#F97316" />
              <Text style={{ color: "#F97316", fontSize: 13, fontWeight: "600" }}>
                Crear hábito
              </Text>
            </Pressable>
          </View>
        ) : (
          allHabits.map((habit, i) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              index={i}
              onCheckIn={(id) => checkIn.mutate(id)}
              onDelete={(id) => deleteHabit.mutate(id)}
              isCheckingIn={checkingInId === habit.id}
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setShowCreate(true)}
        testID="fab-create-habit"
        style={{
          position: "absolute",
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 100,
          backgroundColor: "#F97316",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#F97316",
          shadowOpacity: 0.5,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>

      <CreateHabitModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(form) => createHabit.mutate(form)}
        isPending={createHabit.isPending}
      />
    </View>
  );
}
