import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { Sprint, Goal } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Zap, Target, X, Flame, Calendar, Trash2 } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme, DARK } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

type Colors = typeof DARK;

function SprintCard({ sprint, colors, t }: { sprint: Sprint; colors: Colors; t: (key: any) => string }) {
  const queryClient = useQueryClient();
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinContent, setCheckinContent] = useState("");
  const [mood, setMood] = useState(3);

  const daysLeft = Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const progress = sprint.duration > 0 ? Math.min(100, Math.round(((sprint.duration - daysLeft) / sprint.duration) * 100)) : 0;
  const streak = sprint.members?.[0]?.streak || 0;

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/sprints/${sprint.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sprints"] }),
  });

  const checkinMutation = useMutation({
    mutationFn: () => api.post(`/api/sprints/${sprint.id}/checkin`, { content: checkinContent, mood }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      setShowCheckin(false);
      setCheckinContent("");
    },
  });

  const confirmDelete = () => {
    Alert.alert(t("deleteSprintConfirm"), t("deleteConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: () => deleteMutation.mutate() },
    ]);
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12 }} testID="sprint-card">
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 4 }}>{sprint.title}</Text>
            {sprint.description ? <Text style={{ color: colors.text3, fontSize: 13, lineHeight: 20 }}>{sprint.description}</Text> : null}
          </View>
          <View style={{ alignItems: "center", marginLeft: 12 }}>
            <Flame size={20} color={streak > 0 ? colors.accent : colors.text4} />
            <Text style={{ color: streak > 0 ? colors.accent : colors.text4, fontSize: 16, fontWeight: "700" }}>{streak}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ color: colors.text3, fontSize: 12 }}>{sprint.duration}-{t("days")} sprint</Text>
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>{progress}%</Text>
          </View>
          <View style={{ height: 4, backgroundColor: colors.bg4, borderRadius: 2 }}>
            <View style={{ width: `${progress}%`, height: 4, backgroundColor: colors.accent, borderRadius: 2 }} />
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Calendar size={13} color={colors.text4} />
              <Text style={{ color: colors.text4, fontSize: 12 }}>{daysLeft} {t("daysLeft")}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={confirmDelete} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${colors.error}18`, alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCheckin(true)}
              style={{ backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}
              testID="check-in-button"
            >
              <Text style={{ color: "#0A0A0A", fontSize: 13, fontWeight: "700" }}>{t("checkin")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={showCheckin} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <TouchableOpacity onPress={() => setShowCheckin(false)}>
              <X size={22} color={colors.text3} />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: colors.text, fontSize: 17, fontWeight: "600" }}>{t("checkInTitle")}</Text>
          </View>
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{t("howWasToday")}</Text>
          <TextInput
            value={checkinContent}
            onChangeText={setCheckinContent}
            placeholder={t("howWasToday")}
            placeholderTextColor={colors.text4}
            multiline
            autoFocus
            style={{ backgroundColor: colors.bg3, borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, minHeight: 100, marginBottom: 24 }}
          />
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>{t("mood")}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 32 }}>
            {["😞", "😐", "🙂", "😊", "🔥"].map((emoji, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setMood(i + 1)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: mood === i + 1 ? `${colors.accent}22` : colors.bg3, borderWidth: 1.5, borderColor: mood === i + 1 ? colors.accent : colors.border }}
              >
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => checkinMutation.mutate()}
            disabled={!checkinContent.trim() || checkinMutation.isPending}
            style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 17, alignItems: "center", opacity: !checkinContent.trim() ? 0.5 : 1 }}
          >
            {checkinMutation.isPending ? <ActivityIndicator color="#0A0A0A" /> : (
              <Text style={{ color: "#0A0A0A", fontSize: 16, fontWeight: "700" }}>{t("checkin")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </Animated.View>
  );
}

function GoalCard({ goal, colors, t }: { goal: Goal; colors: Colors; t: (key: any) => string }) {
  const queryClient = useQueryClient();
  const updateGoal = useMutation({
    mutationFn: (progress: number) => api.patch(`/api/goals/${goal.id}`, { progress }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
  const deleteGoal = useMutation({
    mutationFn: () => api.delete(`/api/goals/${goal.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const confirmDelete = () => {
    Alert.alert(t("deleteGoalConfirm"), t("deleteConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: () => deleteGoal.mutate() },
    ]);
  };

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10 }} testID="goal-card">
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, marginRight: 12, backgroundColor: goal.isCompleted ? `${colors.success}22` : `${colors.accent}22`, alignItems: "center", justifyContent: "center" }}>
          <Target size={18} color={goal.isCompleted ? colors.success : colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: goal.isCompleted ? colors.text3 : colors.text, fontSize: 15, fontWeight: "600", textDecorationLine: goal.isCompleted ? "line-through" : "none" }}>{goal.title}</Text>
          {goal.category ? <Text style={{ color: colors.text4, fontSize: 12, marginTop: 2 }}>{goal.category}</Text> : null}
        </View>
        <Text style={{ color: goal.progress >= 100 ? colors.success : colors.accent, fontSize: 16, fontWeight: "700", marginRight: 8 }}>{goal.progress}%</Text>
        <TouchableOpacity onPress={confirmDelete} style={{ padding: 6 }}>
          <Trash2 size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
      <View style={{ height: 4, backgroundColor: colors.bg4, borderRadius: 2, marginBottom: 12 }}>
        <View style={{ width: `${goal.progress}%`, height: 4, borderRadius: 2, backgroundColor: goal.progress >= 100 ? colors.success : colors.accent }} />
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[25, 50, 75, 100].map((val) => (
          <TouchableOpacity
            key={val}
            onPress={() => updateGoal.mutate(val)}
            style={{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: goal.progress >= val ? `${colors.accent}22` : colors.bg3, alignItems: "center", borderWidth: 1, borderColor: goal.progress >= val ? colors.accent : colors.border }}
          >
            <Text style={{ color: goal.progress >= val ? colors.accent : colors.text4, fontSize: 11, fontWeight: "600" }}>{val}%</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function SprintsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"sprints" | "goals">("sprints");
  const [showNewSprint, setShowNewSprint] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newSprint, setNewSprint] = useState({ title: "", description: "", duration: 7 });
  const [newGoal, setNewGoal] = useState({ title: "", category: "" });
  const queryClient = useQueryClient();

  const { data: sprints, isLoading: sl, refetch: rs } = useQuery({ queryKey: ["sprints"], queryFn: () => api.get<Sprint[]>("/api/sprints") });
  const { data: goals, isLoading: gl, refetch: rg } = useQuery({ queryKey: ["goals"], queryFn: () => api.get<Goal[]>("/api/goals") });

  const createSprint = useMutation({
    mutationFn: () => api.post("/api/sprints", newSprint),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sprints"] }); setShowNewSprint(false); setNewSprint({ title: "", description: "", duration: 7 }); },
  });
  const createGoal = useMutation({
    mutationFn: () => api.post("/api/goals", newGoal),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["goals"] }); setShowNewGoal(false); setNewGoal({ title: "", category: "" }); },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="sprints-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.5, marginBottom: 16 }}>{t("accountability")}</Text>
          <View style={{ flexDirection: "row", backgroundColor: colors.bg2, borderRadius: 12, padding: 4 }}>
            {(["sprints", "goals"] as const).map((tab) => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} testID={`${tab}-tab`} style={{ flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center", backgroundColor: activeTab === tab ? colors.accent : "transparent" }}>
                <Text style={{ color: activeTab === tab ? "#0A0A0A" : colors.text3, fontSize: 14, fontWeight: "600", textTransform: "capitalize" }}>{t(tab)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={false} onRefresh={() => activeTab === "sprints" ? rs() : rg()} tintColor={colors.accent} />}>
        {activeTab === "sprints" ? (
          <>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14 }}>
                <Flame size={22} color={colors.accent} />
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700", marginTop: 8 }}>{sprints?.reduce((max, s) => Math.max(max, s.members?.[0]?.streak || 0), 0) || 0}</Text>
                <Text style={{ color: colors.text3, fontSize: 12 }}>{t("bestStreak")}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14 }}>
                <Zap size={22} color={colors.info} />
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700", marginTop: 8 }}>{sprints?.length || 0}</Text>
                <Text style={{ color: colors.text3, fontSize: 12 }}>{t("activeSprintsLabel")}</Text>
              </View>
            </View>
            {sl ? <ActivityIndicator color={colors.accent} testID="loading-indicator" /> : (sprints || []).map((s) => <SprintCard key={s.id} sprint={s} colors={colors} t={t} />)}
            <TouchableOpacity onPress={() => setShowNewSprint(true)} testID="new-sprint-button" style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" }}>
              <Plus size={18} color={colors.accent} />
              <Text style={{ color: colors.accent, fontWeight: "600" }}>{t("newSprint")}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                {[
                  { value: goals?.length || 0, label: "Total" },
                  { value: goals?.filter(g => g.isCompleted).length || 0, label: t("goalsCompleted"), color: colors.success },
                  { value: goals?.filter(g => !g.isCompleted).length || 0, label: t("inProgress"), color: colors.accent },
                ].map((stat, i) => (
                  <View key={i} style={{ alignItems: "center" }}>
                    <Text style={{ color: stat.color || colors.text, fontSize: 20, fontWeight: "700" }}>{stat.value}</Text>
                    <Text style={{ color: colors.text3, fontSize: 11 }}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            {gl ? <ActivityIndicator color={colors.accent} testID="loading-indicator" /> : (goals || []).map((g) => <GoalCard key={g.id} goal={g} colors={colors} t={t} />)}
            <TouchableOpacity onPress={() => setShowNewGoal(true)} testID="new-goal-button" style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" }}>
              <Plus size={18} color={colors.accent} />
              <Text style={{ color: colors.accent, fontWeight: "600" }}>{t("newGoal")}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* New Sprint Modal */}
      <Modal visible={showNewSprint} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <TouchableOpacity onPress={() => setShowNewSprint(false)}><X size={22} color={colors.text3} /></TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: colors.text, fontSize: 17, fontWeight: "600" }}>{t("newSprint")}</Text>
          </View>
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{t("sprintTitle")}</Text>
          <TextInput value={newSprint.title} onChangeText={(v) => setNewSprint(p => ({ ...p, title: v }))} placeholder="ej. Hábito matutino" placeholderTextColor={colors.text4} testID="sprint-title-input" style={{ backgroundColor: colors.bg3, borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, marginBottom: 20 }} />
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{t("description")}</Text>
          <TextInput value={newSprint.description} onChangeText={(v) => setNewSprint(p => ({ ...p, description: v }))} placeholder={t("sprintDesc")} placeholderTextColor={colors.text4} multiline style={{ backgroundColor: colors.bg3, borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, minHeight: 80, marginBottom: 20 }} />
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{t("duration")}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 32 }}>
            {[7, 14, 30].map((d) => (
              <TouchableOpacity key={d} onPress={() => setNewSprint(p => ({ ...p, duration: d }))} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: newSprint.duration === d ? colors.accent : colors.bg3, borderWidth: 1, borderColor: newSprint.duration === d ? colors.accent : colors.border }}>
                <Text style={{ color: newSprint.duration === d ? "#0A0A0A" : colors.text3, fontWeight: "700", fontSize: 18 }}>{d}</Text>
                <Text style={{ color: newSprint.duration === d ? "#0A0A0A" : colors.text4, fontSize: 11, marginTop: 2 }}>{t("days")}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => createSprint.mutate()} disabled={!newSprint.title.trim() || createSprint.isPending} testID="start-sprint-button" style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 17, alignItems: "center", opacity: !newSprint.title.trim() ? 0.5 : 1 }}>
            {createSprint.isPending ? <ActivityIndicator color="#0A0A0A" /> : <Text style={{ color: "#0A0A0A", fontSize: 16, fontWeight: "700" }}>{t("startSprint")}</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* New Goal Modal */}
      <Modal visible={showNewGoal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <TouchableOpacity onPress={() => setShowNewGoal(false)}><X size={22} color={colors.text3} /></TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: colors.text, fontSize: 17, fontWeight: "600" }}>{t("newGoal")}</Text>
          </View>
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{t("goalTitle")}</Text>
          <TextInput value={newGoal.title} onChangeText={(v) => setNewGoal(p => ({ ...p, title: v }))} placeholder="ej. Lanzar mi primer producto" placeholderTextColor={colors.text4} testID="goal-title-input" style={{ backgroundColor: colors.bg3, borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, marginBottom: 20 }} />
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{t("goalCategory")}</Text>
          <TextInput value={newGoal.category} onChangeText={(v) => setNewGoal(p => ({ ...p, category: v }))} placeholder="Negocios, Salud, Aprendizaje..." placeholderTextColor={colors.text4} testID="category-input" style={{ backgroundColor: colors.bg3, borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, marginBottom: 32 }} />
          <TouchableOpacity onPress={() => createGoal.mutate()} disabled={!newGoal.title.trim() || createGoal.isPending} testID="create-goal-button" style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 17, alignItems: "center", opacity: !newGoal.title.trim() ? 0.5 : 1 }}>
            {createGoal.isPending ? <ActivityIndicator color="#0A0A0A" /> : <Text style={{ color: "#0A0A0A", fontSize: 16, fontWeight: "700" }}>{t("createGoal")}</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
