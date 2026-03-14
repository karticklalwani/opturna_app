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
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import {
  CheckSquare,
  Plus,
  X,
  Check,
  Trash2,
  Calendar,
  Flag,
  Circle,
  Target,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from "lucide-react-native";
import { api } from "@/lib/api/api";
import { Task, Goal } from "@/types";

// ─── Priority config ───────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high";

const PRIORITIES: { key: Priority; label: string; color: string; bg: string }[] = [
  { key: "high", label: "Alta", color: "#EF4444", bg: "#EF44441A" },
  { key: "medium", label: "Media", color: "#FBBF24", bg: "#FBBF241A" },
  { key: "low", label: "Baja", color: "#737373", bg: "#7373731A" },
];

function getPriorityStyle(priority: Priority) {
  return PRIORITIES.find((p) => p.key === priority) ?? PRIORITIES[2];
}

// ─── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  index,
  onToggle,
  onDelete,
}: {
  task: Task;
  index: number;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const priorityStyle = getPriorityStyle(task.priority);
  const daysLeft = task.dueDate
    ? Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && !task.isCompleted;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <View
        testID="task-card"
        style={{
          backgroundColor: "#0F0F0F",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: task.isCompleted ? "#1A1A1A" : "#1F1F1F",
          borderLeftWidth: 3,
          borderLeftColor: task.isCompleted ? "#2A2A2A" : priorityStyle.color,
          padding: 16,
          marginBottom: 10,
          opacity: task.isCompleted ? 0.65 : 1,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          {/* Checkbox */}
          <Pressable
            testID={`toggle-task-${task.id}`}
            onPress={() => onToggle(task.id, !task.isCompleted)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: task.isCompleted ? "#4ADE80" : priorityStyle.color,
              backgroundColor: task.isCompleted ? "#4ADE801A" : "transparent",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 1,
              flexShrink: 0,
            }}
          >
            {task.isCompleted ? <Check size={14} color="#4ADE80" /> : null}
          </Pressable>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: task.isCompleted ? "#737373" : "#F5F5F5",
                fontSize: 15,
                fontWeight: "600",
                letterSpacing: 0.1,
                textDecorationLine: task.isCompleted ? "line-through" : "none",
                marginBottom: task.description ? 4 : 0,
              }}
            >
              {task.title}
            </Text>
            {task.description ? (
              <Text
                style={{
                  color: "#737373",
                  fontSize: 12,
                  lineHeight: 18,
                  marginBottom: 6,
                }}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            ) : null}

            {/* Meta row */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {/* Priority badge */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: priorityStyle.bg,
                  borderRadius: 100,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Flag size={9} color={priorityStyle.color} />
                <Text style={{ color: priorityStyle.color, fontSize: 10, fontWeight: "600" }}>
                  {priorityStyle.label}
                </Text>
              </View>

              {/* Goal link */}
              {task.goal ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "#4ADE801A",
                    borderRadius: 100,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Target size={9} color="#4ADE80" />
                  <Text style={{ color: "#4ADE80", fontSize: 10, fontWeight: "600" }} numberOfLines={1}>
                    {task.goal.title}
                  </Text>
                </View>
              ) : null}

              {/* Due date */}
              {task.dueDate ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Calendar size={9} color={isOverdue ? "#EF4444" : "#737373"} />
                  <Text style={{ color: isOverdue ? "#EF4444" : "#737373", fontSize: 10 }}>
                    {isOverdue
                      ? `${Math.abs(daysLeft!)}d pasado`
                      : daysLeft === 0
                      ? "Hoy"
                      : `${daysLeft}d restantes`}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Delete */}
          <Pressable
            testID={`delete-task-${task.id}`}
            onPress={() => onDelete(task.id)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 100,
              backgroundColor: "#EF44441A",
              borderWidth: 1,
              borderColor: "#EF444430",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Trash2 size={12} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  color,
  expanded,
  onToggle,
}: {
  title: string;
  count: number;
  color: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
        <Text style={{ color: "#A3A3A3", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>
          {title.toUpperCase()}
        </Text>
        <View
          style={{
            backgroundColor: `${color}22`,
            borderRadius: 100,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderWidth: 1,
            borderColor: `${color}44`,
          }}
        >
          <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{count}</Text>
        </View>
      </View>
      {expanded ? <ChevronUp size={14} color="#404040" /> : <ChevronDown size={14} color="#404040" />}
    </Pressable>
  );
}

// ─── Create Task Modal ─────────────────────────────────────────────────────────

type NewTaskForm = {
  title: string;
  description: string;
  priority: Priority;
  goalId: string;
  dueDate: string;
};

function CreateTaskModal({
  visible,
  onClose,
  onSubmit,
  isPending,
  goals,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: NewTaskForm) => void;
  isPending: boolean;
  goals: Goal[];
}) {
  const [form, setForm] = useState<NewTaskForm>({
    title: "",
    description: "",
    priority: "medium",
    goalId: "",
    dueDate: "",
  });
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const reset = () => {
    setForm({ title: "", description: "", priority: "medium", goalId: "", dueDate: "" });
    setShowGoalPicker(false);
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

  const selectedGoal = goals.find((g) => g.id === form.goalId);

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
              testID="close-task-modal"
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
              Nueva Tarea
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
              placeholder="¿Qué necesitas hacer?"
              placeholderTextColor="#404040"
              testID="task-title-input"
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
              placeholder="Detalles adicionales..."
              placeholderTextColor="#404040"
              multiline
              testID="task-description-input"
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

            {/* Priority */}
            <Text style={{ color: "#A3A3A3", fontSize: 12, fontWeight: "600", marginBottom: 12, letterSpacing: 0.3 }}>
              PRIORIDAD
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
              {PRIORITIES.map((p) => {
                const active = form.priority === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setForm((prev) => ({ ...prev, priority: p.key }))}
                    testID={`priority-${p.key}`}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: active ? p.bg : "#0F0F0F",
                      borderWidth: 1.5,
                      borderColor: active ? p.color : "#1F1F1F",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Flag size={14} color={active ? p.color : "#404040"} />
                    <Text style={{ color: active ? p.color : "#737373", fontSize: 12, fontWeight: "600" }}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Goal (optional) */}
            <Text style={{ color: "#A3A3A3", fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.3 }}>
              OBJETIVO (OPCIONAL)
            </Text>
            <Pressable
              onPress={() => setShowGoalPicker(!showGoalPicker)}
              testID="goal-picker-toggle"
              style={{
                backgroundColor: "#0F0F0F",
                borderWidth: 1,
                borderColor: showGoalPicker ? "#4ADE8060" : "#1F1F1F",
                borderRadius: 14,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: showGoalPicker ? 8 : 20,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Target size={14} color={selectedGoal ? "#4ADE80" : "#404040"} />
                <Text style={{ color: selectedGoal ? "#F5F5F5" : "#404040", fontSize: 14 }}>
                  {selectedGoal ? selectedGoal.title : "Sin objetivo asignado"}
                </Text>
              </View>
              {showGoalPicker ? <ChevronUp size={14} color="#404040" /> : <ChevronDown size={14} color="#404040" />}
            </Pressable>
            {showGoalPicker ? (
              <View
                style={{
                  backgroundColor: "#0F0F0F",
                  borderWidth: 1,
                  borderColor: "#1F1F1F",
                  borderRadius: 14,
                  marginBottom: 20,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  onPress={() => { setForm((p) => ({ ...p, goalId: "" })); setShowGoalPicker(false); }}
                  style={{
                    padding: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "#1A1A1A",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Circle size={14} color="#737373" />
                  <Text style={{ color: "#737373", fontSize: 14 }}>Sin objetivo</Text>
                </Pressable>
                {goals.filter((g) => !g.isCompleted).map((goal) => (
                  <Pressable
                    key={goal.id}
                    onPress={() => { setForm((p) => ({ ...p, goalId: goal.id })); setShowGoalPicker(false); }}
                    style={{
                      padding: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: "#1A1A1A",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      backgroundColor: form.goalId === goal.id ? "#4ADE801A" : "transparent",
                    }}
                  >
                    <Target size={14} color="#4ADE80" />
                    <Text style={{ color: form.goalId === goal.id ? "#4ADE80" : "#F5F5F5", fontSize: 14, flex: 1 }} numberOfLines={1}>
                      {goal.title}
                    </Text>
                    {form.goalId === goal.id ? <Check size={14} color="#4ADE80" /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}

            {/* Due Date */}
            <Text style={{ color: "#A3A3A3", fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.3 }}>
              FECHA LÍMITE
            </Text>
            <TextInput
              value={form.dueDate}
              onChangeText={(v) => setForm((p) => ({ ...p, dueDate: v }))}
              placeholder="AAAA-MM-DD (ej. 2026-04-15)"
              placeholderTextColor="#404040"
              testID="task-date-input"
              style={{
                backgroundColor: "#0F0F0F",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                borderRadius: 14,
                padding: 14,
                color: "#F5F5F5",
                fontSize: 14,
                marginBottom: 32,
              }}
            />

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={!form.title.trim() || isPending}
              testID="create-task-submit"
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
                <ActivityIndicator color="#080808" />
              ) : (
                <Text style={{ color: "#080808", fontSize: 15, fontWeight: "700" }}>
                  Crear Tarea
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

function TaskStatsRow({ tasks }: { tasks: Task[] }) {
  const pending = tasks.filter((t) => !t.isCompleted).length;
  const completed = tasks.filter((t) => t.isCompleted).length;
  const highPriority = tasks.filter((t) => t.priority === "high" && !t.isCompleted).length;

  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
      {[
        { value: pending, label: "Pendientes", color: "#FBBF24" },
        { value: completed, label: "Completadas", color: "#4ADE80" },
        { value: highPriority, label: "Alta prioridad", color: "#EF4444" },
      ].map((stat, i) => (
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
          <Text style={{ color: stat.color, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
            {stat.value}
          </Text>
          <Text style={{ color: "#737373", fontSize: 10, fontWeight: "500", textAlign: "center" }}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [pendingExpanded, setPendingExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const { data: tasks, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.get<Task[]>("/api/tasks"),
  });

  const { data: goals } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<Goal[]>("/api/goals"),
  });

  const createTask = useMutation({
    mutationFn: (form: NewTaskForm) =>
      api.post<Task>("/api/tasks", {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        goalId: form.goalId || undefined,
        dueDate: form.dueDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowCreate(false);
    },
  });

  const toggleTask = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      api.patch<Task>(`/api/tasks/${id}`, { isCompleted }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.delete(`/api/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const allTasks: Task[] = tasks ?? [];
  const pendingTasks = allTasks.filter((t) => !t.isCompleted);
  const completedTasks = allTasks.filter((t) => t.isCompleted);
  const allGoals: Goal[] = goals ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }} testID="tasks-screen">
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
                Tareas
              </Text>
              <Text style={{ color: "#737373", fontSize: 13, marginTop: 2 }}>
                {allTasks.length === 0
                  ? "Sin tareas aún"
                  : `${pendingTasks.length} pendiente${pendingTasks.length !== 1 ? "s" : ""}`}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#0F0F0F",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <CheckSquare size={14} color="#4ADE80" />
              <Text style={{ color: "#4ADE80", fontSize: 13, fontWeight: "700" }}>
                {allTasks.length}
              </Text>
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
        {allTasks.length > 0 ? <TaskStatsRow tasks={allTasks} /> : null}

        {/* Loading */}
        {isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }} testID="loading-indicator">
            <ActivityIndicator color="#4ADE80" />
            <Text style={{ color: "#737373", fontSize: 13, marginTop: 12 }}>Cargando tareas...</Text>
          </View>
        ) : allTasks.length === 0 ? (
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
                width: 64,
                height: 64,
                borderRadius: 100,
                backgroundColor: "#FBBF241A",
                borderWidth: 1,
                borderColor: "#FBBF2430",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <ClipboardList size={28} color="#FBBF24" />
            </View>
            <Text style={{ color: "#F5F5F5", fontSize: 17, fontWeight: "700", marginBottom: 8 }}>
              Sin tareas pendientes
            </Text>
            <Text
              style={{ color: "#737373", fontSize: 13, textAlign: "center", paddingHorizontal: 28, lineHeight: 20 }}
            >
              Organiza tu día creando tu primera tarea. Puedes vincularla a un objetivo.
            </Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              testID="empty-create-task"
              style={{
                marginTop: 20,
                backgroundColor: "#FBBF241A",
                borderWidth: 1,
                borderColor: "#FBBF2430",
                borderRadius: 100,
                paddingHorizontal: 24,
                paddingVertical: 11,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Plus size={14} color="#FBBF24" />
              <Text style={{ color: "#FBBF24", fontSize: 13, fontWeight: "600" }}>
                Crear tarea
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Pending section */}
            {pendingTasks.length > 0 ? (
              <>
                <SectionHeader
                  title="Pendientes"
                  count={pendingTasks.length}
                  color="#FBBF24"
                  expanded={pendingExpanded}
                  onToggle={() => setPendingExpanded(!pendingExpanded)}
                />
                {pendingExpanded
                  ? pendingTasks.map((task, i) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={i}
                        onToggle={(id, val) => toggleTask.mutate({ id, isCompleted: val })}
                        onDelete={(id) => deleteTask.mutate(id)}
                      />
                    ))
                  : null}
              </>
            ) : null}

            {/* Completed section */}
            {completedTasks.length > 0 ? (
              <View style={{ marginTop: pendingTasks.length > 0 ? 12 : 0 }}>
                <SectionHeader
                  title="Completadas"
                  count={completedTasks.length}
                  color="#4ADE80"
                  expanded={completedExpanded}
                  onToggle={() => setCompletedExpanded(!completedExpanded)}
                />
                {completedExpanded
                  ? completedTasks.map((task, i) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={i}
                        onToggle={(id, val) => toggleTask.mutate({ id, isCompleted: val })}
                        onDelete={(id) => deleteTask.mutate(id)}
                      />
                    ))
                  : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setShowCreate(true)}
        testID="fab-create-task"
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

      <CreateTaskModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(form) => createTask.mutate(form)}
        isPending={createTask.isPending}
        goals={allGoals}
      />
    </View>
  );
}
