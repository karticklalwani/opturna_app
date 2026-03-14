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
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  BookOpen,
  Plus,
  X,
  Trash2,
  Pencil,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { api } from "@/lib/api/api";
import { JournalEntry } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

type Mood = "great" | "good" | "okay" | "bad" | "terrible";

const MOODS: { key: Mood; emoji: string; label: string; color: string }[] = [
  { key: "great", emoji: "😁", label: "Genial", color: "#4ADE80" },
  { key: "good", emoji: "😊", label: "Bien", color: "#60A5FA" },
  { key: "okay", emoji: "😐", label: "Regular", color: "#FBBF24" },
  { key: "bad", emoji: "😔", label: "Mal", color: "#F97316" },
  { key: "terrible", emoji: "😞", label: "Terrible", color: "#EF4444" },
];

const MOOD_COLORS: Record<string, string> = {
  great: "#4ADE80",
  good: "#60A5FA",
  okay: "#FBBF24",
  bad: "#F97316",
  terrible: "#EF4444",
};

function getMoodColor(mood?: string | null): string {
  return MOOD_COLORS[mood ?? ""] ?? "#404040";
}

function getMoodEmoji(mood?: string | null): string {
  return MOODS.find((m) => m.key === mood)?.emoji ?? "";
}

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateHeader(dateStr: string): string {
  const today = getTodayDate();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  })();

  if (dateStr === today) return "Hoy";
  if (dateStr === yesterday) return "Ayer";

  const date = new Date(dateStr + "T12:00:00");
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function parseTags(tagsJson?: string | null): string[] {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Tag Chips ────────────────────────────────────────────────────────────────

function TagChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
      {tags.map((tag, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            backgroundColor: "#1A1A1A",
            borderRadius: 100,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: "#2A2A2A",
          }}
        >
          <Tag size={9} color="#737373" />
          <Text style={{ color: "#737373", fontSize: 10, fontWeight: "500" }}>
            {tag}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Entry Card ───────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  index,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  index: number;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const moodColor = getMoodColor(entry.mood);
  const moodEmoji = getMoodEmoji(entry.mood);
  const tags = parseTags(entry.tags);
  const isLong = entry.content.length > 120;
  const preview = isLong && !expanded
    ? entry.content.slice(0, 120) + "..."
    : entry.content;

  return (
    <Animated.View entering={FadeInDown.delay(index * 55).duration(340)}>
      <Pressable
        testID={`journal-entry-${entry.id}`}
        onPress={() => isLong && setExpanded((v) => !v)}
        style={{
          backgroundColor: "#0F0F0F",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "#1F1F1F",
          borderLeftWidth: 3,
          borderLeftColor: moodColor,
          padding: 16,
          marginBottom: 10,
        }}
      >
        {/* Top row */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {moodEmoji ? (
                <Text style={{ fontSize: 18 }}>{moodEmoji}</Text>
              ) : null}
              <Text
                style={{
                  color: moodColor,
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                {MOODS.find((m) => m.key === entry.mood)?.label ?? "Sin estado"}
              </Text>
            </View>
            <Text
              style={{
                color: "#D4D4D4",
                fontSize: 14,
                lineHeight: 22,
                letterSpacing: 0.1,
              }}
            >
              {preview}
            </Text>
            {isLong ? (
              <Pressable
                onPress={() => setExpanded((v) => !v)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}
                testID={`expand-entry-${entry.id}`}
              >
                {expanded ? (
                  <ChevronUp size={12} color="#737373" />
                ) : (
                  <ChevronDown size={12} color="#737373" />
                )}
                <Text style={{ color: "#737373", fontSize: 11 }}>
                  {expanded ? "Mostrar menos" : "Leer más"}
                </Text>
              </Pressable>
            ) : null}
            <TagChips tags={tags} />
          </View>

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 6, marginLeft: 10 }}>
            <Pressable
              testID={`edit-entry-${entry.id}`}
              onPress={() => onEdit(entry)}
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
              testID={`delete-entry-${entry.id}`}
              onPress={() => onDelete(entry.id)}
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
      </Pressable>
    </Animated.View>
  );
}

// ─── Entry Form Modal ─────────────────────────────────────────────────────────

type EntryForm = {
  content: string;
  mood: Mood | "";
  tagsInput: string;
  date: string;
};

function EntryModal({
  visible,
  onClose,
  onSubmit,
  isPending,
  initial,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: EntryForm) => void;
  isPending: boolean;
  initial?: EntryForm;
}) {
  const [form, setForm] = useState<EntryForm>(
    initial ?? { content: "", mood: "", tagsInput: "", date: getTodayDate() }
  );

  React.useEffect(() => {
    if (visible) {
      setForm(initial ?? { content: "", mood: "", tagsInput: "", date: getTodayDate() });
    }
  }, [visible, initial]);

  const handleSubmit = () => {
    if (!form.content.trim()) return;
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
        <View style={{ flex: 1, backgroundColor: "#0A0907" }}>
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
              testID="close-entry-modal"
              style={{
                width: 36,
                height: 36,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: "#2A2A2A",
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
              {initial ? "Editar entrada" : "Nueva entrada"}
            </Text>
            <Pressable
              onPress={handleSubmit}
              disabled={!form.content.trim() || isPending}
              testID="submit-entry-button"
              style={{
                backgroundColor: form.content.trim() ? "#4ADE80" : "#1A1A1A",
                borderRadius: 100,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#080808" />
              ) : (
                <Text
                  style={{
                    color: form.content.trim() ? "#080808" : "#404040",
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  Guardar
                </Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Date */}
            <Text
              style={{
                color: "#737373",
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.4,
                marginBottom: 6,
              }}
            >
              FECHA
            </Text>
            <TextInput
              value={form.date}
              onChangeText={(v) => setForm((p) => ({ ...p, date: v }))}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#404040"
              testID="entry-date-input"
              style={{
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                borderRadius: 12,
                padding: 12,
                color: "#F5F5F5",
                fontSize: 14,
                marginBottom: 20,
              }}
            />

            {/* Mood selector */}
            <Text
              style={{
                color: "#737373",
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.4,
                marginBottom: 10,
              }}
            >
              ESTADO DE ÁNIMO
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {MOODS.map((m) => {
                const active = form.mood === m.key;
                return (
                  <Pressable
                    key={m.key}
                    testID={`mood-${m.key}`}
                    onPress={() =>
                      setForm((p) => ({ ...p, mood: active ? "" : m.key }))
                    }
                    style={{
                      flex: 1,
                      alignItems: "center",
                      gap: 4,
                      paddingVertical: 10,
                      borderRadius: 14,
                      backgroundColor: active ? `${m.color}1A` : "#141414",
                      borderWidth: 1.5,
                      borderColor: active ? m.color : "#2A2A2A",
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                    <Text
                      style={{
                        color: active ? m.color : "#404040",
                        fontSize: 9,
                        fontWeight: "600",
                      }}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Content */}
            <Text
              style={{
                color: "#737373",
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.4,
                marginBottom: 8,
              }}
            >
              TUS PENSAMIENTOS *
            </Text>
            <TextInput
              value={form.content}
              onChangeText={(v) => setForm((p) => ({ ...p, content: v }))}
              placeholder="¿Qué tienes en mente hoy?..."
              placeholderTextColor="#404040"
              multiline
              testID="entry-content-input"
              style={{
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                borderRadius: 14,
                padding: 16,
                color: "#E5E5E5",
                fontSize: 15,
                lineHeight: 24,
                minHeight: 160,
                marginBottom: 20,
                textAlignVertical: "top",
                letterSpacing: 0.1,
              }}
            />

            {/* Tags */}
            <Text
              style={{
                color: "#737373",
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.4,
                marginBottom: 8,
              }}
            >
              ETIQUETAS (separadas por comas)
            </Text>
            <TextInput
              value={form.tagsInput}
              onChangeText={(v) => setForm((p) => ({ ...p, tagsInput: v }))}
              placeholder="gratitud, trabajo, familia..."
              placeholderTextColor="#404040"
              testID="entry-tags-input"
              style={{
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                borderRadius: 12,
                padding: 12,
                color: "#F5F5F5",
                fontSize: 14,
                marginBottom: 32,
              }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
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
          backgroundColor: "rgba(0,0,0,0.7)",
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
            Eliminar entrada
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
            Esta entrada se eliminará de forma permanente. No se puede deshacer.
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
              <Text style={{ color: "#A3A3A3", fontSize: 14, fontWeight: "600" }}>
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

// ─── Group entries by date ────────────────────────────────────────────────────

function groupByDate(entries: JournalEntry[]): { date: string; items: JournalEntry[] }[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }));
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function JournalScreen() {
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: entries,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["journal"],
    queryFn: () => api.get<JournalEntry[]>("/api/journal"),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createEntry = useMutation({
    mutationFn: (form: EntryForm) => {
      const tags = form.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      return api.post<JournalEntry>("/api/journal", {
        content: form.content,
        mood: form.mood || undefined,
        tags: tags.length > 0 ? tags : undefined,
        date: form.date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      setShowForm(false);
    },
  });

  const updateEntry = useMutation({
    mutationFn: ({ id, form }: { id: string; form: EntryForm }) => {
      const tags = form.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      return api.patch<JournalEntry>(`/api/journal/${id}`, {
        content: form.content,
        mood: form.mood || undefined,
        tags: tags.length > 0 ? tags : undefined,
        date: form.date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      setEditingEntry(null);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: (id: string) => api.delete(`/api/journal/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      setDeleteId(null);
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const allEntries: JournalEntry[] = entries ?? [];
  const groups = groupByDate(allEntries);

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
  };

  const getEditForm = (entry: JournalEntry): EntryForm => ({
    content: entry.content,
    mood: (entry.mood as Mood) ?? "",
    tagsInput: parseTags(entry.tags).join(", "),
    date: entry.date,
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View
      style={{ flex: 1, backgroundColor: "#090806" }}
      testID="journal-screen"
    >
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: "#F0EDE8",
                  letterSpacing: -0.8,
                }}
              >
                Mi Diario
              </Text>
              <Text style={{ color: "#7A6F63", fontSize: 13, marginTop: 2 }}>
                {allEntries.length === 0
                  ? "Escribe tu primera entrada"
                  : `${allEntries.length} entrada${allEntries.length !== 1 ? "s" : ""}`}
              </Text>
            </View>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 100,
                backgroundColor: "#141210",
                borderWidth: 1,
                borderColor: "#2A2520",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={18} color="#9C8E7F" />
            </View>
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
            tintColor="#9C8E7F"
          />
        }
      >
        {/* Loading */}
        {isLoading ? (
          <View
            style={{ alignItems: "center", paddingVertical: 48 }}
            testID="loading-indicator"
          >
            <ActivityIndicator color="#9C8E7F" />
            <Text style={{ color: "#7A6F63", fontSize: 13, marginTop: 12 }}>
              Cargando entradas...
            </Text>
          </View>
        ) : allEntries.length === 0 ? (
          /* Empty state */
          <View
            style={{
              alignItems: "center",
              paddingVertical: 64,
              backgroundColor: "#0F0C0A",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#2A2520",
              borderStyle: "dashed",
            }}
            testID="empty-state"
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📖</Text>
            <Text
              style={{
                color: "#F0EDE8",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              Aún no hay entradas
            </Text>
            <Text
              style={{
                color: "#7A6F63",
                fontSize: 13,
                textAlign: "center",
                paddingHorizontal: 32,
                lineHeight: 20,
              }}
            >
              Escribe cómo te sientes hoy. Solo tú puedes leer esto.
            </Text>
          </View>
        ) : (
          groups.map((group, gi) => (
            <View key={group.date}>
              {/* Date header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                  marginTop: gi > 0 ? 18 : 0,
                }}
              >
                <Text
                  style={{
                    color: "#9C8E7F",
                    fontSize: 12,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  {formatDateHeader(group.date)}
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: "#2A2520",
                  }}
                />
              </View>

              {group.items.map((entry, i) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  index={gi * 10 + i}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setShowForm(true)}
        testID="fab-create-entry"
        style={{
          position: "absolute",
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 100,
          backgroundColor: "#C8B89A",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#C8B89A",
          shadowOpacity: 0.4,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Plus size={24} color="#0A0806" strokeWidth={2.5} />
      </Pressable>

      {/* Create modal */}
      <EntryModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(form) => createEntry.mutate(form)}
        isPending={createEntry.isPending}
      />

      {/* Edit modal */}
      <EntryModal
        visible={editingEntry !== null}
        onClose={() => setEditingEntry(null)}
        onSubmit={(form) => {
          if (editingEntry) updateEntry.mutate({ id: editingEntry.id, form });
        }}
        isPending={updateEntry.isPending}
        initial={editingEntry ? getEditForm(editingEntry) : undefined}
      />

      {/* Delete confirm modal */}
      <DeleteModal
        visible={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteEntry.mutate(deleteId);
        }}
        isPending={deleteEntry.isPending}
      />
    </View>
  );
}
