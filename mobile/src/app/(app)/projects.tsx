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
  Linking,
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
  FolderKanban,
  Plus,
  X,
  Trash2,
  ExternalLink,
  Globe,
  Lock,
  TrendingUp,
  CheckCircle2,
  PauseCircle,
  Archive,
  Pencil,
  Layers,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api/api";
import { Project } from "@/types";

// ─── Status config ─────────────────────────────────────────────────────────────

type ProjectStatus = "active" | "paused" | "completed" | "archived";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; Icon: React.ComponentType<{ size: number; color: string }> }
> = {
  active: {
    label: "Activo",
    color: "#4ADE80",
    bg: "#4ADE801A",
    Icon: TrendingUp,
  },
  paused: {
    label: "Pausado",
    color: "#FBBF24",
    bg: "#FBBF241A",
    Icon: PauseCircle,
  },
  completed: {
    label: "Completado",
    color: "#818CF8",
    bg: "#818CF81A",
    Icon: CheckCircle2,
  },
  archived: {
    label: "Archivado",
    color: "#737373",
    bg: "#7373731A",
    Icon: Archive,
  },
};

// ─── Animated progress bar ─────────────────────────────────────────────────────

function ProgressBar({ progress, color }: { progress: number; color: string }) {
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
    <View style={{ marginTop: 10 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <Text style={{ color: "#A3A3A3", fontSize: 11, fontWeight: "500" }}>
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

// ─── Project Card ──────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  index,
  onEdit,
  onDelete,
}: {
  project: Project;
  index: number;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[project.status];
  const StatusIcon = cfg.Icon;

  const handleOpenUrl = () => {
    if (project.url) {
      const url = project.url.startsWith("http")
        ? project.url
        : `https://${project.url}`;
      Linking.openURL(url);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      <View
        testID="project-card"
        style={{
          backgroundColor: "#0F0F0F",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#1F1F1F",
          borderLeftWidth: 3,
          borderLeftColor: cfg.color,
          padding: 18,
          marginBottom: 12,
        }}
      >
        {/* Header row */}
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
        >
          {/* Icon */}
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 100,
              backgroundColor: cfg.bg,
              borderWidth: 1,
              borderColor: `${cfg.color}4D`,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <StatusIcon size={16} color={cfg.color} />
          </View>

          {/* Title + badges */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: project.status === "archived" ? "#737373" : "#F5F5F5",
                fontSize: 15,
                fontWeight: "700",
                letterSpacing: 0.1,
                marginBottom: 4,
              }}
            >
              {project.title}
            </Text>
            {project.description ? (
              <Text
                style={{
                  color: "#737373",
                  fontSize: 12,
                  lineHeight: 18,
                  marginBottom: 6,
                }}
                numberOfLines={2}
              >
                {project.description}
              </Text>
            ) : null}
            {/* Status + visibility badges */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  backgroundColor: cfg.bg,
                  borderRadius: 100,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <StatusIcon size={10} color={cfg.color} />
                <Text
                  style={{
                    color: cfg.color,
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 0.2,
                  }}
                >
                  {cfg.label}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 100,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                {project.isPublic ? (
                  <Globe size={9} color="#A3A3A3" />
                ) : (
                  <Lock size={9} color="#A3A3A3" />
                )}
                <Text
                  style={{
                    color: "#737373",
                    fontSize: 10,
                    fontWeight: "500",
                  }}
                >
                  {project.isPublic ? "Público" : "Privado"}
                </Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Pressable
              testID={`edit-project-${project.id}`}
              onPress={() => onEdit(project)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 100,
                backgroundColor: "#1A1A1A",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pencil size={13} color="#A3A3A3" />
            </Pressable>
            <Pressable
              testID={`delete-project-${project.id}`}
              onPress={() => onDelete(project.id)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 100,
                backgroundColor: "#EF44441A",
                borderWidth: 1,
                borderColor: "#EF444430",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={13} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        {/* Progress bar */}
        <ProgressBar progress={project.progress} color={cfg.color} />

        {/* URL link */}
        {project.url ? (
          <Pressable
            testID={`open-url-${project.id}`}
            onPress={handleOpenUrl}
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start",
              backgroundColor: "#1A1A1A",
              borderRadius: 100,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: "#2A2A2A",
            }}
          >
            <ExternalLink size={12} color="#818CF8" />
            <Text
              style={{ color: "#818CF8", fontSize: 11, fontWeight: "500" }}
              numberOfLines={1}
            >
              {project.url.replace(/^https?:\/\//, "")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ─── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteModal({
  visible,
  projectTitle,
  onConfirm,
  onCancel,
  isPending,
}: {
  visible: boolean;
  projectTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
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
          backgroundColor: "rgba(0,0,0,0.7)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#0F0F0F",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#1F1F1F",
            padding: 24,
            width: "100%",
            maxWidth: 360,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 100,
              backgroundColor: "#EF44441A",
              borderWidth: 1,
              borderColor: "#EF444430",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              marginBottom: 16,
            }}
          >
            <Trash2 size={22} color="#EF4444" />
          </View>
          <Text
            style={{
              color: "#F5F5F5",
              fontSize: 18,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Eliminar proyecto
          </Text>
          <Text
            style={{
              color: "#737373",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 20,
              marginBottom: 24,
            }}
          >
            {"¿Eliminar "}
            <Text style={{ color: "#A3A3A3", fontWeight: "600" }}>
              {projectTitle}
            </Text>
            {"? Esta acción no se puede deshacer."}
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={onCancel}
              testID="cancel-delete-button"
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
              <Text
                style={{ color: "#A3A3A3", fontSize: 14, fontWeight: "600" }}
              >
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={isPending}
              testID="confirm-delete-button"
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 100,
                backgroundColor: "#EF4444",
                alignItems: "center",
              }}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text
                  style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                >
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

// ─── Project form modal ────────────────────────────────────────────────────────

type ProjectFormData = {
  title: string;
  description: string;
  status: ProjectStatus;
  progress: string;
  url: string;
  isPublic: boolean;
};

const EMPTY_FORM: ProjectFormData = {
  title: "",
  description: "",
  status: "active",
  progress: "0",
  url: "",
  isPublic: false,
};

function ProjectFormModal({
  visible,
  onClose,
  onSubmit,
  isPending,
  editProject,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: ProjectFormData) => void;
  isPending: boolean;
  editProject: Project | null;
}) {
  const [form, setForm] = useState<ProjectFormData>(EMPTY_FORM);

  useEffect(() => {
    if (visible) {
      if (editProject) {
        setForm({
          title: editProject.title,
          description: editProject.description ?? "",
          status: editProject.status,
          progress: String(editProject.progress),
          url: editProject.url ?? "",
          isPublic: editProject.isPublic,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [visible, editProject]);

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  const isEdit = editProject !== null;

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
              testID="close-project-modal"
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
              {isEdit ? "Editar Proyecto" : "Nuevo Proyecto"}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={labelStyle}>TÍTULO *</Text>
            <TextInput
              value={form.title}
              onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              placeholder="Ej. App de productividad"
              placeholderTextColor="#404040"
              testID="project-title-input"
              style={inputStyle}
            />

            {/* Description */}
            <Text style={labelStyle}>DESCRIPCIÓN</Text>
            <TextInput
              value={form.description}
              onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
              placeholder="¿En qué consiste este proyecto?"
              placeholderTextColor="#404040"
              multiline
              testID="project-description-input"
              style={[inputStyle, { minHeight: 90, textAlignVertical: "top" }]}
            />

            {/* Status */}
            <Text style={labelStyle}>ESTADO</Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {(
                Object.entries(STATUS_CONFIG) as [
                  ProjectStatus,
                  (typeof STATUS_CONFIG)[ProjectStatus]
                ][]
              ).map(([key, cfg]) => {
                const active = form.status === key;
                const Ico = cfg.Icon;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setForm((p) => ({ ...p, status: key }))}
                    testID={`status-${key}`}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 100,
                      backgroundColor: active ? cfg.bg : "#0F0F0F",
                      borderWidth: 1.5,
                      borderColor: active ? cfg.color : "#1F1F1F",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Ico size={12} color={active ? cfg.color : "#737373"} />
                    <Text
                      style={{
                        color: active ? cfg.color : "#737373",
                        fontSize: 13,
                        fontWeight: active ? "600" : "400",
                      }}
                    >
                      {cfg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Progress */}
            <Text style={labelStyle}>PROGRESO (0-100)</Text>
            <TextInput
              value={form.progress}
              onChangeText={(v) => {
                const num = parseInt(v, 10);
                if (v === "" || (!isNaN(num) && num >= 0 && num <= 100)) {
                  setForm((p) => ({ ...p, progress: v }));
                }
              }}
              placeholder="0"
              placeholderTextColor="#404040"
              keyboardType="number-pad"
              testID="project-progress-input"
              style={inputStyle}
            />

            {/* URL */}
            <Text style={labelStyle}>ENLACE (URL)</Text>
            <TextInput
              value={form.url}
              onChangeText={(v) => setForm((p) => ({ ...p, url: v }))}
              placeholder="https://miproyecto.com"
              placeholderTextColor="#404040"
              keyboardType="url"
              autoCapitalize="none"
              testID="project-url-input"
              style={inputStyle}
            />

            {/* isPublic toggle */}
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
                  <Globe size={18} color="#4ADE80" />
                ) : (
                  <Lock size={18} color="#737373" />
                )}
                <View>
                  <Text
                    style={{
                      color: "#F5F5F5",
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {form.isPublic ? "Proyecto público" : "Proyecto privado"}
                  </Text>
                  <Text style={{ color: "#737373", fontSize: 12, marginTop: 1 }}>
                    {form.isPublic
                      ? "Visible para todos"
                      : "Solo tú puedes verlo"}
                  </Text>
                </View>
              </View>
              <Switch
                value={form.isPublic}
                onValueChange={(v) => setForm((p) => ({ ...p, isPublic: v }))}
                testID="project-public-toggle"
                trackColor={{ false: "#1F1F1F", true: "#4ADE8050" }}
                thumbColor={form.isPublic ? "#4ADE80" : "#404040"}
              />
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={!form.title.trim() || isPending}
              testID="submit-project-button"
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
                <Text
                  style={{
                    color: "#080808",
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  {isEdit ? "Guardar Cambios" : "Crear Proyecto"}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const labelStyle = {
  color: "#A3A3A3",
  fontSize: 12,
  fontWeight: "600" as const,
  marginBottom: 8,
  letterSpacing: 0.3,
};

const inputStyle = {
  backgroundColor: "#0F0F0F",
  borderWidth: 1,
  borderColor: "#1F1F1F",
  borderRadius: 14,
  padding: 14,
  color: "#F5F5F5",
  fontSize: 15,
  marginBottom: 20,
};

// ─── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({ projects }: { projects: Project[] }) {
  const active = projects.filter((p) => p.status === "active").length;
  const completed = projects.filter((p) => p.status === "completed").length;
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
        )
      : 0;

  const stats = [
    { value: active, label: "Activos", color: "#4ADE80" },
    { value: `${avgProgress}%`, label: "Progreso medio", color: "#818CF8" },
    { value: completed, label: "Completados", color: "#FBBF24" },
  ];

  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
      {stats.map((s, i) => (
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
            gap: 4,
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

// ─── Main Screen ───────────────────────────────────────────────────────────────

type StatusFilter = ProjectStatus | "all";

export default function ProjectsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const {
    data: projects,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<Project[]>("/api/projects"),
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const createProject = useMutation({
    mutationFn: (form: ProjectFormData) =>
      api.post<Project>("/api/projects", {
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        progress: parseInt(form.progress, 10) || 0,
        url: form.url || undefined,
        isPublic: form.isPublic,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowForm(false);
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, form }: { id: string; form: ProjectFormData }) =>
      api.patch<Project>(`/api/projects/${id}`, {
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        progress: parseInt(form.progress, 10) || 0,
        url: form.url || undefined,
        isPublic: form.isPublic,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowForm(false);
      setEditProject(null);
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => api.delete(`/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteTarget(null);
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const allProjects: Project[] = projects ?? [];
  const filtered =
    statusFilter === "all"
      ? allProjects
      : allProjects.filter((p) => p.status === statusFilter);

  const handleEdit = (project: Project) => {
    setEditProject(project);
    setShowForm(true);
  };

  const handleFormSubmit = (form: ProjectFormData) => {
    if (editProject) {
      updateProject.mutate({ id: editProject.id, form });
    } else {
      createProject.mutate(form);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditProject(null);
  };

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Activos" },
    { key: "paused", label: "Pausados" },
    { key: "completed", label: "Completados" },
    { key: "archived", label: "Archivados" },
  ];

  const isPending = createProject.isPending || updateProject.isPending;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View
      style={{ flex: 1, backgroundColor: "#080808" }}
      testID="projects-screen"
    >
      <SafeAreaView edges={["top"]}>
        <View
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
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
                Proyectos
              </Text>
              <Text style={{ color: "#737373", fontSize: 13, marginTop: 2 }}>
                {allProjects.length === 0
                  ? "Sin proyectos aún"
                  : `${allProjects.length} proyecto${allProjects.length !== 1 ? "s" : ""} en total`}
              </Text>
            </View>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 100,
                backgroundColor: "#4ADE801A",
                borderWidth: 1,
                borderColor: "#4ADE8030",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FolderKanban size={18} color="#4ADE80" />
            </View>
          </View>

          {/* Productivity nav strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
          >
            {[
              { label: "Objetivos", route: "/(app)/goals" },
              { label: "Tareas", route: "/(app)/tasks" },
              { label: "Hábitos", route: "/(app)/habits" },
              { label: "Proyectos", route: null },
            ].map((item) => {
              const isCurrent = item.route === null;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    if (item.route) {
                      router.push(item.route as Parameters<typeof router.push>[0]);
                    }
                  }}
                  testID={`nav-${item.label.toLowerCase()}`}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 100,
                    backgroundColor: isCurrent ? "#4ADE80" : "#0F0F0F",
                    borderWidth: 1,
                    borderColor: isCurrent ? "#4ADE80" : "#1F1F1F",
                  }}
                >
                  <Text
                    style={{
                      color: isCurrent ? "#080808" : "#737373",
                      fontSize: 13,
                      fontWeight: isCurrent ? "700" : "500",
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Status filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          >
            {filterTabs.map((ft) => {
              const active = statusFilter === ft.key;
              const color =
                ft.key === "all"
                  ? "#A3A3A3"
                  : STATUS_CONFIG[ft.key as ProjectStatus]?.color ?? "#A3A3A3";
              return (
                <Pressable
                  key={ft.key}
                  onPress={() => setStatusFilter(ft.key)}
                  testID={`filter-${ft.key}`}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor: active
                      ? ft.key === "all"
                        ? "#1F1F1F"
                        : `${color}1F`
                      : "transparent",
                    borderWidth: 1,
                    borderColor: active
                      ? ft.key === "all"
                        ? "#2A2A2A"
                        : `${color}4D`
                      : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: active ? (ft.key === "all" ? "#F5F5F5" : color) : "#404040",
                      fontSize: 12,
                      fontWeight: active ? "600" : "400",
                    }}
                  >
                    {ft.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
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
        {allProjects.length > 0 ? <StatsRow projects={allProjects} /> : null}

        {/* Loading */}
        {isLoading ? (
          <View
            style={{ alignItems: "center", paddingVertical: 48 }}
            testID="loading-indicator"
          >
            <ActivityIndicator color="#4ADE80" />
            <Text style={{ color: "#737373", fontSize: 13, marginTop: 12 }}>
              Cargando proyectos...
            </Text>
          </View>
        ) : filtered.length === 0 ? (
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
                backgroundColor: "#4ADE801A",
                borderWidth: 1,
                borderColor: "#4ADE8030",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <FolderKanban size={28} color="#4ADE80" />
            </View>
            <Text
              style={{
                color: "#F5F5F5",
                fontSize: 17,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              {statusFilter === "all"
                ? "Sin proyectos aún"
                : `Sin proyectos ${STATUS_CONFIG[statusFilter as ProjectStatus]?.label.toLowerCase() ?? ""}`}
            </Text>
            <Text
              style={{
                color: "#737373",
                fontSize: 13,
                textAlign: "center",
                paddingHorizontal: 28,
                lineHeight: 20,
              }}
            >
              {statusFilter === "all"
                ? "Crea tu primer proyecto y empieza a hacer seguimiento de tu progreso."
                : "No hay proyectos con este estado aún."}
            </Text>
            {statusFilter === "all" ? (
              <Pressable
                onPress={() => {
                  setEditProject(null);
                  setShowForm(true);
                }}
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
                  style={{ color: "#4ADE80", fontSize: 13, fontWeight: "600" }}
                >
                  Crear proyecto
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          /* Project list */
          filtered.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              onEdit={handleEdit}
              onDelete={(id) => {
                const target = allProjects.find((p) => p.id === id);
                if (target) setDeleteTarget(target);
              }}
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          setEditProject(null);
          setShowForm(true);
        }}
        testID="fab-create-project"
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

      {/* Form modal */}
      <ProjectFormModal
        visible={showForm}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isPending={isPending}
        editProject={editProject}
      />

      {/* Delete confirmation */}
      <DeleteModal
        visible={deleteTarget !== null}
        projectTitle={deleteTarget?.title ?? ""}
        onConfirm={() => {
          if (deleteTarget) deleteProject.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteProject.isPending}
      />
    </View>
  );
}
