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
  Switch,
} from "react-native";
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
  Star,
  Plus,
  X,
  Trash2,
  Pencil,
  Calendar,
  CircleCheckBig,
  Globe,
  Lock,
} from "lucide-react-native";
import { api } from "@/lib/api/api";
import { LifeGoal } from "@/types";

// ─── Category config ──────────────────────────────────────────────────────────

type CategoryKey =
  | "Dinero"
  | "Negocio"
  | "Salud"
  | "Aprendizaje"
  | "Viajes"
  | "Relaciones"
  | "Libertad"
  | "Otro";

const CATEGORIES: { key: CategoryKey; color: string; bg: string }[] = [
  { key: "Dinero", color: "#4ADE80", bg: "#4ADE801A" },
  { key: "Negocio", color: "#FBBF24", bg: "#FBBF241A" },
  { key: "Salud", color: "#F97316", bg: "#F973161A" },
  { key: "Aprendizaje", color: "#818CF8", bg: "#818CF81A" },
  { key: "Viajes", color: "#60A5FA", bg: "#60A5FA1A" },
  { key: "Relaciones", color: "#F472B6", bg: "#F472B61A" },
  { key: "Libertad", color: "#34D399", bg: "#34D3991A" },
  { key: "Otro", color: "#A3A3A3", bg: "#A3A3A31A" },
];

function getCatStyle(category?: string | null) {
  return (
    CATEGORIES.find((c) => c.key === category) ?? {
      color: "#A3A3A3",
      bg: "#A3A3A31A",
      key: "Otro" as CategoryKey,
    }
  );
}

// ─── Emoji suggestions ────────────────────────────────────────────────────────

const EMOJI_SUGGESTIONS = [
  "💰", "💼", "🏋️", "📚", "✈️", "❤️", "🌟", "🔥",
  "⚡", "🎯", "🏠", "💎", "🚀", "🌍", "🏆", "🎨",
  "🧠", "💪", "🌱", "⭐",
];

// ─── Animated progress bar ────────────────────────────────────────────────────

function GoalProgressBar({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(100, Math.max(0, progress)), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as `${number}%`,
  }));

  return (
    <View style={{ marginTop: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <Text style={{ color: "#737373", fontSize: 11, fontWeight: "500" }}>
          Progreso
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
          height: 6,
          backgroundColor: "#1A1A1A",
          borderRadius: 100,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            {
              height: 6,
              borderRadius: 100,
              backgroundColor: progress >= 100 ? "#4ADE80" : color,
              shadowColor: progress >= 100 ? "#4ADE80" : color,
              shadowOpacity: 0.6,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            },
            barStyle,
          ]}
        />
      </View>
    </View>
  );
}

// ─── Life Goal Card ───────────────────────────────────────────────────────────

function LifeGoalCard({
  goal,
  index,
  onEdit,
  onDelete,
  onUpdateProgress,
  onComplete,
}: {
  goal: LifeGoal;
  index: number;
  onEdit: (goal: LifeGoal) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onComplete: (id: string) => void;
}) {
  const catStyle = getCatStyle(goal.category);
  const accentColor = goal.isCompleted ? "#4ADE80" : catStyle.color;

  const daysLeft = goal.targetDate
    ? Math.ceil(
        (new Date(goal.targetDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(380)}>
      <View
        testID={`life-goal-card-${goal.id}`}
        style={{
          backgroundColor: "#0F0F0F",
          borderRadius: 24,
          borderWidth: 1,
          borderColor: "#1F1F1F",
          padding: 20,
          marginBottom: 14,
          overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: accentColor,
            opacity: 0.6,
          }}
        />

        {/* Header row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          {/* Emoji */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: `${accentColor}15`,
              borderWidth: 1,
              borderColor: `${accentColor}30`,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {goal.emoji ? (
              <Text style={{ fontSize: 28 }}>{goal.emoji}</Text>
            ) : (
              <Star size={22} color={accentColor} />
            )}
          </View>

          {/* Title + meta */}
          <View style={{ flex: 1, paddingTop: 2 }}>
            <Text
              style={{
                color: goal.isCompleted ? "#737373" : "#F5F5F5",
                fontSize: 16,
                fontWeight: "800",
                letterSpacing: -0.2,
                textDecorationLine: goal.isCompleted ? "line-through" : "none",
                marginBottom: 6,
              }}
            >
              {goal.title}
            </Text>

            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {/* Category badge */}
              {goal.category ? (
                <View
                  style={{
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
                      fontWeight: "700",
                      letterSpacing: 0.2,
                    }}
                  >
                    {goal.category}
                  </Text>
                </View>
              ) : null}

              {/* Visibility badge */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                  backgroundColor: "#1A1A1A",
                  borderRadius: 100,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                {goal.isPublic ? (
                  <Globe size={9} color="#737373" />
                ) : (
                  <Lock size={9} color="#737373" />
                )}
                <Text style={{ color: "#737373", fontSize: 10 }}>
                  {goal.isPublic ? "Público" : "Privado"}
                </Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: "column", gap: 6 }}>
            <Pressable
              testID={`edit-life-goal-${goal.id}`}
              onPress={() => onEdit(goal)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 100,
                backgroundColor: "#1A1A1A",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pencil size={12} color="#A3A3A3" />
            </Pressable>
            <Pressable
              testID={`delete-life-goal-${goal.id}`}
              onPress={() => onDelete(goal.id)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 100,
                backgroundColor: "#EF44441A",
                borderWidth: 1,
                borderColor: "#EF444430",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={12} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        {/* Description */}
        {goal.description ? (
          <Text
            style={{
              color: "#737373",
              fontSize: 13,
              lineHeight: 19,
              marginTop: 12,
            }}
            numberOfLines={2}
          >
            {goal.description}
          </Text>
        ) : null}

        {/* Target date */}
        {goal.targetDate && daysLeft !== null ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginTop: 10,
            }}
          >
            <Calendar size={11} color="#737373" />
            <Text style={{ color: "#737373", fontSize: 11 }}>
              {daysLeft > 0
                ? `${daysLeft} días restantes`
                : daysLeft === 0
                ? "Hoy"
                : "Fecha superada"}
            </Text>
          </View>
        ) : null}

        {/* Progress bar */}
        {!goal.isCompleted ? (
          <GoalProgressBar progress={goal.progress} color={catStyle.color} />
        ) : null}

        {/* Progress buttons or completed badge */}
        {!goal.isCompleted ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            {/* Progress increment buttons */}
            <View style={{ flexDirection: "row", gap: 6 }}>
              {[25, 50, 75, 100].map((val) => (
                <Pressable
                  key={val}
                  testID={`progress-btn-${val}-${goal.id}`}
                  onPress={() => onUpdateProgress(goal.id, val)}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor:
                      goal.progress >= val
                        ? `${catStyle.color}1F`
                        : "#1A1A1A",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor:
                      goal.progress >= val
                        ? `${catStyle.color}4D`
                        : "#2A2A2A",
                  }}
                >
                  <Text
                    style={{
                      color:
                        goal.progress >= val ? catStyle.color : "#404040",
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {val}%
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Mark complete */}
            <Pressable
              testID={`complete-life-goal-${goal.id}`}
              onPress={() => onComplete(goal.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 11,
                borderRadius: 100,
                backgroundColor: "#4ADE801A",
                borderWidth: 1,
                borderColor: "#4ADE8030",
              }}
            >
              <CircleCheckBig size={14} color="#4ADE80" />
              <Text
                style={{ color: "#4ADE80", fontSize: 13, fontWeight: "700" }}
              >
                Marcar como lograda
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 12,
              backgroundColor: "#4ADE801A",
              borderRadius: 100,
              paddingHorizontal: 16,
              paddingVertical: 8,
              alignSelf: "flex-start",
              borderWidth: 1,
              borderColor: "#4ADE8030",
            }}
          >
            <CircleCheckBig size={14} color="#4ADE80" />
            <Text style={{ color: "#4ADE80", fontSize: 13, fontWeight: "700" }}>
              Meta lograda
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Goal Form Modal ──────────────────────────────────────────────────────────

type GoalForm = {
  title: string;
  description: string;
  category: CategoryKey | "";
  emoji: string;
  targetDate: string;
  isPublic: boolean;
};

function GoalFormModal({
  visible,
  onClose,
  onSubmit,
  isPending,
  initial,
  isEdit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: GoalForm) => void;
  isPending: boolean;
  initial?: GoalForm;
  isEdit?: boolean;
}) {
  const [form, setForm] = useState<GoalForm>(
    initial ?? {
      title: "",
      description: "",
      category: "",
      emoji: "",
      targetDate: "",
      isPublic: false,
    }
  );

  React.useEffect(() => {
    if (visible) {
      setForm(
        initial ?? {
          title: "",
          description: "",
          category: "",
          emoji: "",
          targetDate: "",
          isPublic: false,
        }
      );
    }
  }, [visible, initial]);

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
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
              marginBottom: 16,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              marginBottom: 20,
            }}
          >
            <Pressable
              onPress={onClose}
              testID="close-goal-form-modal"
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
              {isEdit ? "Editar meta" : "Nueva meta de vida"}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Emoji picker */}
            <Text
              style={{
                color: "#A3A3A3",
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.4,
                marginBottom: 10,
              }}
            >
              ÍCONO
            </Text>
            {/* Selected emoji display */}
            {form.emoji ? (
              <View
                style={{
                  alignSelf: "center",
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: "#141414",
                  borderWidth: 2,
                  borderColor: "#4ADE80",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 36 }}>{form.emoji}</Text>
              </View>
            ) : null}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {EMOJI_SUGGESTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  testID={`emoji-${emoji}`}
                  onPress={() =>
                    setForm((p) => ({
                      ...p,
                      emoji: p.emoji === emoji ? "" : emoji,
                    }))
                  }
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor:
                      form.emoji === emoji ? "#4ADE801A" : "#141414",
                    borderWidth: 1.5,
                    borderColor:
                      form.emoji === emoji ? "#4ADE80" : "#1F1F1F",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            {/* Title */}
            <Text
              style={{
                color: "#A3A3A3",
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.4,
                marginBottom: 8,
              }}
            >
              TÍTULO *
            </Text>
            <TextInput
              value={form.title}
              onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              placeholder="Ej. Alcanzar la independencia financiera"
              placeholderTextColor="#404040"
              testID="life-goal-title-input"
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
            <Text
              style={{
                color: "#A3A3A3",
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.4,
                marginBottom: 8,
              }}
            >
              DESCRIPCIÓN
            </Text>
            <TextInput
              value={form.description}
              onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
              placeholder="¿Qué significa esta meta para ti?"
              placeholderTextColor="#404040"
              multiline
              testID="life-goal-description-input"
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
            <Text
              style={{
                color: "#A3A3A3",
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.4,
                marginBottom: 12,
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
                    testID={`life-cat-${cat.key}`}
                    onPress={() =>
                      setForm((p) => ({
                        ...p,
                        category: active ? "" : cat.key,
                      }))
                    }
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 100,
                      backgroundColor: active ? cat.bg : "#0F0F0F",
                      borderWidth: 1.5,
                      borderColor: active ? cat.color : "#1F1F1F",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? cat.color : "#737373",
                        fontSize: 13,
                        fontWeight: active ? "700" : "400",
                      }}
                    >
                      {cat.key}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Target date */}
            <Text
              style={{
                color: "#A3A3A3",
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.4,
                marginBottom: 8,
              }}
            >
              FECHA OBJETIVO
            </Text>
            <TextInput
              value={form.targetDate}
              onChangeText={(v) => setForm((p) => ({ ...p, targetDate: v }))}
              placeholder="AAAA-MM-DD (ej. 2030-01-01)"
              placeholderTextColor="#404040"
              testID="life-goal-date-input"
              style={{
                backgroundColor: "#0F0F0F",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                borderRadius: 14,
                padding: 14,
                color: "#F5F5F5",
                fontSize: 14,
                marginBottom: 20,
              }}
            />

            {/* Visibility */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#0F0F0F",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                borderRadius: 14,
                padding: 16,
                marginBottom: 32,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {form.isPublic ? (
                  <Globe size={16} color="#737373" />
                ) : (
                  <Lock size={16} color="#737373" />
                )}
                <View>
                  <Text style={{ color: "#F5F5F5", fontSize: 14, fontWeight: "600" }}>
                    {form.isPublic ? "Pública" : "Privada"}
                  </Text>
                  <Text style={{ color: "#737373", fontSize: 11, marginTop: 1 }}>
                    {form.isPublic
                      ? "Otros pueden verla"
                      : "Solo tú puedes verla"}
                  </Text>
                </View>
              </View>
              <Switch
                value={form.isPublic}
                onValueChange={(v) => setForm((p) => ({ ...p, isPublic: v }))}
                trackColor={{ false: "#1A1A1A", true: "#4ADE8040" }}
                thumbColor={form.isPublic ? "#4ADE80" : "#404040"}
                testID="visibility-toggle"
              />
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={!form.title.trim() || isPending}
              testID="submit-life-goal-button"
              style={{
                backgroundColor: "#4ADE80",
                borderRadius: 100,
                paddingVertical: 17,
                alignItems: "center",
                opacity: !form.title.trim() ? 0.4 : 1,
                shadowColor: "#4ADE80",
                shadowOpacity: 0.3,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              {isPending ? (
                <ActivityIndicator color="#080808" />
              ) : (
                <Text
                  style={{
                    color: "#080808",
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  {isEdit ? "Guardar cambios" : "Crear meta de vida"}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  visible,
  onCancel,
  onConfirm,
  isPending,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.75)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            backgroundColor: "#141414",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#2A2A2A",
            padding: 28,
            width: "100%",
          }}
        >
          <Text
            style={{
              color: "#F5F5F5",
              fontSize: 18,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Eliminar meta
          </Text>
          <Text
            style={{
              color: "#737373",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 21,
              marginBottom: 24,
            }}
          >
            Esta meta de vida se eliminará de forma permanente.
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={onCancel}
              testID="cancel-delete-goal-button"
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 100,
                backgroundColor: "#1A1A1A",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#A3A3A3", fontSize: 14, fontWeight: "600" }}>
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={isPending}
              testID="confirm-delete-goal-button"
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 100,
                backgroundColor: "#EF44441A",
                borderWidth: 1,
                borderColor: "#EF444430",
                alignItems: "center",
              }}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Text style={{ color: "#EF4444", fontSize: 14, fontWeight: "700" }}>
                  Eliminar
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({ goals }: { goals: LifeGoal[] }) {
  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);
  const avgProgress =
    active.length > 0
      ? Math.round(
          active.reduce((sum, g) => sum + g.progress, 0) / active.length
        )
      : 0;

  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
      {[
        { value: active.length, label: "Activas", color: "#4ADE80" },
        { value: `${avgProgress}%`, label: "Progreso medio", color: "#818CF8" },
        { value: completed.length, label: "Logradas", color: "#FBBF24" },
      ].map((s, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: "#0F0F0F",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#1F1F1F",
            padding: 14,
            alignItems: "center",
            gap: 5,
          }}
        >
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
              color: "#737373",
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

type TabFilter = "activas" | "completadas";

export default function LifeGoalsScreen() {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabFilter>("activas");
  const [showCreate, setShowCreate] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LifeGoal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: goals,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["life-goals"],
    queryFn: () => api.get<LifeGoal[]>("/api/life-goals"),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createGoal = useMutation({
    mutationFn: (form: GoalForm) =>
      api.post<LifeGoal>("/api/life-goals", {
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        emoji: form.emoji || undefined,
        targetDate: form.targetDate || undefined,
        isPublic: form.isPublic,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-goals"] });
      setShowCreate(false);
    },
  });

  const updateGoal = useMutation({
    mutationFn: ({ id, form }: { id: string; form: GoalForm }) =>
      api.patch<LifeGoal>(`/api/life-goals/${id}`, {
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        emoji: form.emoji || undefined,
        targetDate: form.targetDate || undefined,
        isPublic: form.isPublic,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-goals"] });
      setEditingGoal(null);
    },
  });

  const updateProgress = useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      api.patch<LifeGoal>(`/api/life-goals/${id}`, { progress }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["life-goals"] }),
  });

  const completeGoal = useMutation({
    mutationFn: (id: string) =>
      api.patch<LifeGoal>(`/api/life-goals/${id}`, {
        isCompleted: true,
        progress: 100,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["life-goals"] }),
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) => api.delete(`/api/life-goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-goals"] });
      setDeleteId(null);
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const allGoals: LifeGoal[] = goals ?? [];
  const filtered = allGoals.filter((g) =>
    tab === "activas" ? !g.isCompleted : g.isCompleted
  );

  const getEditForm = (goal: LifeGoal): GoalForm => ({
    title: goal.title,
    description: goal.description ?? "",
    category: (goal.category as CategoryKey) ?? "",
    emoji: goal.emoji ?? "",
    targetDate: goal.targetDate ?? "",
    isPublic: goal.isPublic,
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View
      style={{ flex: 1, backgroundColor: "#080808" }}
      testID="life-goals-screen"
    >
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
                  color: "#F5F5F5",
                  letterSpacing: -0.8,
                }}
              >
                Metas de Vida
              </Text>
              <Text style={{ color: "#737373", fontSize: 13, marginTop: 2 }}>
                {allGoals.length === 0
                  ? "Tu visión a largo plazo"
                  : `${allGoals.length} meta${allGoals.length !== 1 ? "s" : ""} en total`}
              </Text>
            </View>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 100,
                backgroundColor: "#4ADE801A",
                borderWidth: 1,
                borderColor: "#4ADE8030",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Star size={18} color="#4ADE80" />
            </View>
          </View>

          {/* Stats */}
          {allGoals.length > 0 ? <StatsRow goals={allGoals} /> : null}

          {/* Tab switcher */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#0F0F0F",
              borderWidth: 1,
              borderColor: "#1F1F1F",
              borderRadius: 100,
              padding: 4,
              gap: 4,
            }}
          >
            {(["activas", "completadas"] as TabFilter[]).map((tabKey) => (
              <Pressable
                key={tabKey}
                onPress={() => setTab(tabKey)}
                testID={`tab-life-${tabKey}`}
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
                    color: tab === tabKey ? "#080808" : "#737373",
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {tabKey === "activas" ? "Activas" : "Completadas"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 120,
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
        {/* Loading */}
        {isLoading ? (
          <View
            style={{ alignItems: "center", paddingVertical: 48 }}
            testID="loading-indicator"
          >
            <ActivityIndicator color="#4ADE80" />
            <Text style={{ color: "#737373", fontSize: 13, marginTop: 12 }}>
              Cargando metas...
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 64,
              backgroundColor: "#0F0F0F",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#1F1F1F",
              borderStyle: "dashed",
            }}
            testID="empty-state"
          >
            <Text style={{ fontSize: 52, marginBottom: 16 }}>🌟</Text>
            <Text
              style={{
                color: "#F5F5F5",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              {tab === "activas"
                ? "Sin metas activas"
                : "Nada logrado aún"}
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
              {tab === "activas"
                ? "Define tus grandes ambiciones. Lo que quieres ser, tener y lograr en la vida."
                : "Completa una meta activa para verla aquí."}
            </Text>
            {tab === "activas" ? (
              <Pressable
                onPress={() => setShowCreate(true)}
                testID="empty-create-goal-button"
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
                  Crear primera meta
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          filtered.map((goal, i) => (
            <LifeGoalCard
              key={goal.id}
              goal={goal}
              index={i}
              onEdit={setEditingGoal}
              onDelete={(id) => setDeleteId(id)}
              onUpdateProgress={(id, progress) =>
                updateProgress.mutate({ id, progress })
              }
              onComplete={(id) => completeGoal.mutate(id)}
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setShowCreate(true)}
        testID="fab-create-life-goal"
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
        <Plus size={24} color="#080808" strokeWidth={2.5} />
      </Pressable>

      {/* Create modal */}
      <GoalFormModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(form) => createGoal.mutate(form)}
        isPending={createGoal.isPending}
      />

      {/* Edit modal */}
      <GoalFormModal
        visible={editingGoal !== null}
        onClose={() => setEditingGoal(null)}
        onSubmit={(form) => {
          if (editingGoal) updateGoal.mutate({ id: editingGoal.id, form });
        }}
        isPending={updateGoal.isPending}
        initial={editingGoal ? getEditForm(editingGoal) : undefined}
        isEdit
      />

      {/* Delete confirm */}
      <DeleteConfirmModal
        visible={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteGoal.mutate(deleteId);
        }}
        isPending={deleteGoal.isPending}
      />
    </View>
  );
}
