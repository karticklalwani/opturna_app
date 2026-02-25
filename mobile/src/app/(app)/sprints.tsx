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

const HUD = {
  bg: "#020B18",
  card: "#041525",
  cyan: "#00B4D8",
  cyanDim: "#00B4D820",
  cyanGlow: "#00B4D840",
  iceBlue: "#C8E8FF",
  statBlue: "#7DB8D9",
  red: "#FF3B30",
  redGlow: "#FF3B3040",
  darkTrack: "#0A2233",
  border: "#0A3550",
  text4: "#3A6680",
  success: "#00E5A0",
  successDim: "#00E5A020",
};

function SprintCard({ sprint, colors, t }: { sprint: Sprint; colors: Colors; t: (key: any) => string }) {
  const queryClient = useQueryClient();
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinContent, setCheckinContent] = useState("");
  const [mood, setMood] = useState(3);

  const daysLeft = Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const progress = sprint.duration > 0 ? Math.min(100, Math.round(((sprint.duration - daysLeft) / sprint.duration) * 100)) : 0;
  const streak = sprint.members?.[0]?.streak || 0;
  const daysPassed = sprint.duration - daysLeft;

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
      <View
        style={{
          backgroundColor: HUD.card,
          borderRadius: 4,
          borderLeftWidth: 2,
          borderLeftColor: HUD.cyan,
          borderTopWidth: 1,
          borderTopColor: HUD.border,
          borderRightWidth: 1,
          borderRightColor: HUD.border,
          borderBottomWidth: 1,
          borderBottomColor: HUD.border,
          padding: 16,
          marginBottom: 12,
        }}
        testID="sprint-card"
      >
        {/* Header row */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: HUD.iceBlue, fontSize: 15, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 }}>
              {sprint.title}
            </Text>
            {sprint.description ? (
              <Text style={{ color: HUD.statBlue, fontSize: 12, lineHeight: 18 }}>{sprint.description}</Text>
            ) : null}
          </View>
          {/* Streak */}
          <View style={{
            alignItems: "center",
            backgroundColor: streak > 0 ? HUD.cyanDim : "transparent",
            borderWidth: 1,
            borderColor: streak > 0 ? HUD.cyan : HUD.border,
            borderRadius: 2,
            paddingHorizontal: 10,
            paddingVertical: 6,
            marginLeft: 12,
          }}>
            <Flame size={14} color={streak > 0 ? HUD.cyan : HUD.text4} />
            <Text style={{ color: streak > 0 ? HUD.cyan : HUD.text4, fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
              {streak}
            </Text>
          </View>
        </View>

        {/* Day counter + progress */}
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Text style={{ color: HUD.cyan, fontSize: 11, fontWeight: "700", letterSpacing: 2, fontVariant: ["tabular-nums"] }}>
              {"DAY " + String(daysPassed).padStart(2, "0") + " / " + String(sprint.duration).padStart(2, "0")}
            </Text>
            <Text style={{ color: HUD.cyan, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>
              {progress}%
            </Text>
          </View>
          {/* Progress bar */}
          <View style={{ height: 4, backgroundColor: HUD.darkTrack, borderRadius: 0 }}>
            <View style={{
              width: `${progress}%`,
              height: 4,
              backgroundColor: HUD.cyan,
              shadowColor: HUD.cyan,
              shadowOpacity: 0.8,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 0 },
            }} />
          </View>
        </View>

        {/* Footer row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Calendar size={12} color={HUD.text4} />
            <Text style={{ color: HUD.statBlue, fontSize: 11, letterSpacing: 1 }}>
              {daysLeft} {t("daysLeft")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={confirmDelete}
              style={{
                width: 32,
                height: 32,
                borderRadius: 2,
                backgroundColor: HUD.redGlow,
                borderWidth: 1,
                borderColor: HUD.red,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={14} color={HUD.red} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCheckin(true)}
              style={{
                backgroundColor: HUD.cyanDim,
                borderWidth: 1,
                borderColor: HUD.cyan,
                borderRadius: 2,
                paddingHorizontal: 14,
                paddingVertical: 7,
                shadowColor: HUD.cyan,
                shadowOpacity: 0.4,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
              }}
              testID="check-in-button"
            >
              <Text style={{ color: HUD.cyan, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 }}>
                {t("checkin")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Check-in Modal */}
      <Modal visible={showCheckin} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: HUD.bg, padding: 24, borderTopWidth: 1, borderTopColor: HUD.cyan }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => setShowCheckin(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: HUD.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color={HUD.statBlue} />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: HUD.iceBlue, fontSize: 13, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              {t("checkInTitle")}
            </Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Dot prefix label */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: HUD.cyan }} />
            <Text style={{ color: HUD.statBlue, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              {t("howWasToday")}
            </Text>
          </View>
          <TextInput
            value={checkinContent}
            onChangeText={setCheckinContent}
            placeholder={t("howWasToday")}
            placeholderTextColor={HUD.text4}
            multiline
            autoFocus
            style={{
              backgroundColor: HUD.card,
              borderWidth: 1,
              borderColor: HUD.border,
              borderRadius: 4,
              padding: 14,
              color: HUD.iceBlue,
              fontSize: 14,
              minHeight: 100,
              marginBottom: 24,
            }}
          />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 6 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: HUD.cyan }} />
            <Text style={{ color: HUD.statBlue, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              {t("mood")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
            {["😞", "😐", "🙂", "😊", "🔥"].map((emoji, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setMood(i + 1)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 2,
                  alignItems: "center",
                  backgroundColor: mood === i + 1 ? HUD.cyanDim : HUD.card,
                  borderWidth: mood === i + 1 ? 1.5 : 1,
                  borderColor: mood === i + 1 ? HUD.cyan : HUD.border,
                  shadowColor: mood === i + 1 ? HUD.cyan : "transparent",
                  shadowOpacity: mood === i + 1 ? 0.6 : 0,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => checkinMutation.mutate()}
            disabled={!checkinContent.trim() || checkinMutation.isPending}
            style={{
              backgroundColor: HUD.cyanDim,
              borderWidth: 1,
              borderColor: HUD.cyan,
              borderRadius: 2,
              paddingVertical: 17,
              alignItems: "center",
              opacity: !checkinContent.trim() ? 0.4 : 1,
              shadowColor: HUD.cyan,
              shadowOpacity: 0.5,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            {checkinMutation.isPending ? (
              <ActivityIndicator color={HUD.cyan} />
            ) : (
              <Text style={{ color: HUD.cyan, fontSize: 13, fontWeight: "700", letterSpacing: 2 }}>
                {t("checkin")}
              </Text>
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

  const barColor = goal.progress >= 100 ? HUD.success : HUD.cyan;

  return (
    <View
      style={{
        backgroundColor: HUD.card,
        borderRadius: 4,
        borderLeftWidth: 2,
        borderLeftColor: goal.isCompleted ? HUD.success : HUD.cyan,
        borderTopWidth: 1,
        borderTopColor: HUD.border,
        borderRightWidth: 1,
        borderRightColor: HUD.border,
        borderBottomWidth: 1,
        borderBottomColor: HUD.border,
        padding: 16,
        marginBottom: 10,
      }}
      testID="goal-card"
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 2,
          marginRight: 12,
          backgroundColor: goal.isCompleted ? HUD.successDim : HUD.cyanDim,
          borderWidth: 1,
          borderColor: goal.isCompleted ? HUD.success : HUD.cyan,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Target size={16} color={goal.isCompleted ? HUD.success : HUD.cyan} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: goal.isCompleted ? HUD.statBlue : HUD.iceBlue,
            fontSize: 14,
            fontWeight: "600",
            letterSpacing: 0.3,
            textDecorationLine: goal.isCompleted ? "line-through" : "none",
          }}>
            {goal.title}
          </Text>
          {goal.category ? (
            <Text style={{ color: HUD.text4, fontSize: 11, marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>
              {goal.category}
            </Text>
          ) : null}
        </View>
        <Text style={{ color: goal.progress >= 100 ? HUD.success : HUD.cyan, fontSize: 14, fontWeight: "700", marginRight: 10, fontVariant: ["tabular-nums"] }}>
          {goal.progress}%
        </Text>
        <TouchableOpacity
          onPress={confirmDelete}
          style={{
            width: 28,
            height: 28,
            borderRadius: 2,
            backgroundColor: HUD.redGlow,
            borderWidth: 1,
            borderColor: HUD.red,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trash2 size={13} color={HUD.red} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: HUD.darkTrack, borderRadius: 0, marginBottom: 12 }}>
        <View style={{
          width: `${goal.progress}%`,
          height: 4,
          backgroundColor: barColor,
          shadowColor: barColor,
          shadowOpacity: 0.8,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        }} />
      </View>

      {/* Quick progress buttons */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {[25, 50, 75, 100].map((val) => (
          <TouchableOpacity
            key={val}
            onPress={() => updateGoal.mutate(val)}
            style={{
              flex: 1,
              paddingVertical: 6,
              borderRadius: 2,
              backgroundColor: goal.progress >= val ? HUD.cyanDim : HUD.darkTrack,
              alignItems: "center",
              borderWidth: 1,
              borderColor: goal.progress >= val ? HUD.cyan : HUD.border,
            }}
          >
            <Text style={{ color: goal.progress >= val ? HUD.cyan : HUD.text4, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
              {val}%
            </Text>
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
    <View style={{ flex: 1, backgroundColor: HUD.bg }} testID="sprints-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
          {/* HUD Title */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <View style={{ width: 3, height: 20, backgroundColor: HUD.cyan }} />
            <Text style={{ fontSize: 18, fontWeight: "800", color: HUD.iceBlue, letterSpacing: 3, textTransform: "uppercase" }}>
              {t("accountability")}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: HUD.border, marginLeft: 4 }} />
          </View>

          {/* Tab switcher */}
          <View style={{
            flexDirection: "row",
            backgroundColor: HUD.card,
            borderWidth: 1,
            borderColor: HUD.border,
            borderRadius: 4,
            padding: 3,
            gap: 3,
          }}>
            {(["sprints", "goals"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                testID={`${tab}-tab`}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 2,
                  alignItems: "center",
                  backgroundColor: activeTab === tab ? HUD.cyanDim : "transparent",
                  borderWidth: activeTab === tab ? 1 : 0,
                  borderColor: HUD.cyan,
                  shadowColor: activeTab === tab ? HUD.cyan : "transparent",
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Text style={{
                  color: activeTab === tab ? HUD.cyan : HUD.text4,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}>
                  {t(tab)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => activeTab === "sprints" ? rs() : rg()}
            tintColor={HUD.cyan}
          />
        }
      >
        {activeTab === "sprints" ? (
          <>
            {/* Stats row */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              <View style={{
                flex: 1,
                backgroundColor: HUD.card,
                borderRadius: 4,
                borderLeftWidth: 2,
                borderLeftColor: HUD.cyan,
                borderTopWidth: 1,
                borderTopColor: HUD.border,
                borderRightWidth: 1,
                borderRightColor: HUD.border,
                borderBottomWidth: 1,
                borderBottomColor: HUD.border,
                padding: 14,
              }}>
                <Flame size={18} color={HUD.cyan} />
                <Text style={{ color: HUD.cyan, fontSize: 24, fontWeight: "700", marginTop: 8, fontVariant: ["tabular-nums"] }}>
                  {sprints?.reduce((max, s) => Math.max(max, s.members?.[0]?.streak || 0), 0) || 0}
                </Text>
                <Text style={{ color: HUD.statBlue, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>
                  {t("bestStreak")}
                </Text>
              </View>
              <View style={{
                flex: 1,
                backgroundColor: HUD.card,
                borderRadius: 4,
                borderLeftWidth: 2,
                borderLeftColor: HUD.statBlue,
                borderTopWidth: 1,
                borderTopColor: HUD.border,
                borderRightWidth: 1,
                borderRightColor: HUD.border,
                borderBottomWidth: 1,
                borderBottomColor: HUD.border,
                padding: 14,
              }}>
                <Zap size={18} color={HUD.statBlue} />
                <Text style={{ color: HUD.cyan, fontSize: 24, fontWeight: "700", marginTop: 8, fontVariant: ["tabular-nums"] }}>
                  {sprints?.length || 0}
                </Text>
                <Text style={{ color: HUD.statBlue, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>
                  {t("activeSprintsLabel")}
                </Text>
              </View>
            </View>

            {/* Section header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: HUD.cyan }} />
              <Text style={{ color: HUD.statBlue, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
                ACTIVE PROTOCOLS
              </Text>
            </View>

            {sl ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <ActivityIndicator color={HUD.cyan} testID="loading-indicator" />
                <Text style={{ color: HUD.statBlue, fontSize: 11, letterSpacing: 2, marginTop: 12, textTransform: "uppercase" }}>
                  INITIALIZING SYSTEMS...
                </Text>
              </View>
            ) : (sprints || []).length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40, borderWidth: 1, borderColor: HUD.border, borderStyle: "dashed", borderRadius: 4, marginBottom: 12 }}>
                <Text style={{ color: HUD.text4, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
                  NO ACTIVE PROTOCOLS
                </Text>
              </View>
            ) : (
              (sprints || []).map((s) => <SprintCard key={s.id} sprint={s} colors={colors} t={t} />)
            )}

            {/* Add new sprint */}
            <TouchableOpacity
              onPress={() => setShowNewSprint(true)}
              testID="new-sprint-button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: HUD.redGlow,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: HUD.red,
                padding: 16,
                shadowColor: HUD.red,
                shadowOpacity: 0.4,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Plus size={16} color={HUD.red} />
              <Text style={{ color: HUD.red, fontSize: 12, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
                {t("newSprint")}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Goals stats */}
            <View style={{
              backgroundColor: HUD.card,
              borderRadius: 4,
              borderLeftWidth: 2,
              borderLeftColor: HUD.cyan,
              borderTopWidth: 1,
              borderTopColor: HUD.border,
              borderRightWidth: 1,
              borderRightColor: HUD.border,
              borderBottomWidth: 1,
              borderBottomColor: HUD.border,
              padding: 14,
              marginBottom: 20,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                {[
                  { value: goals?.length || 0, label: "Total", color: HUD.cyan },
                  { value: goals?.filter(g => g.isCompleted).length || 0, label: t("goalsCompleted"), color: HUD.success },
                  { value: goals?.filter(g => !g.isCompleted).length || 0, label: t("inProgress"), color: HUD.statBlue },
                ].map((stat, i) => (
                  <View key={i} style={{ alignItems: "center" }}>
                    <Text style={{ color: stat.color, fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                      {stat.value}
                    </Text>
                    <Text style={{ color: HUD.text4, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: HUD.cyan }} />
              <Text style={{ color: HUD.statBlue, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
                MISSION OBJECTIVES
              </Text>
            </View>

            {gl ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <ActivityIndicator color={HUD.cyan} testID="loading-indicator" />
                <Text style={{ color: HUD.statBlue, fontSize: 11, letterSpacing: 2, marginTop: 12, textTransform: "uppercase" }}>
                  INITIALIZING SYSTEMS...
                </Text>
              </View>
            ) : (goals || []).length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40, borderWidth: 1, borderColor: HUD.border, borderStyle: "dashed", borderRadius: 4, marginBottom: 12 }}>
                <Text style={{ color: HUD.text4, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
                  NO ACTIVE PROTOCOLS
                </Text>
              </View>
            ) : (
              (goals || []).map((g) => <GoalCard key={g.id} goal={g} colors={colors} t={t} />)
            )}

            <TouchableOpacity
              onPress={() => setShowNewGoal(true)}
              testID="new-goal-button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: HUD.redGlow,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: HUD.red,
                padding: 16,
                shadowColor: HUD.red,
                shadowOpacity: 0.4,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Plus size={16} color={HUD.red} />
              <Text style={{ color: HUD.red, fontSize: 12, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
                {t("newGoal")}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* New Sprint Modal */}
      <Modal visible={showNewSprint} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: HUD.bg, padding: 24, borderTopWidth: 1, borderTopColor: HUD.cyan }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => setShowNewSprint(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: HUD.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color={HUD.statBlue} />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: HUD.iceBlue, fontSize: 13, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              {t("newSprint")}
            </Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: HUD.cyan }} />
            <Text style={{ color: HUD.statBlue, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              {t("sprintTitle")}
            </Text>
          </View>
          <TextInput
            value={newSprint.title}
            onChangeText={(v) => setNewSprint(p => ({ ...p, title: v }))}
            placeholder="ej. Hábito matutino"
            placeholderTextColor={HUD.text4}
            testID="sprint-title-input"
            style={{
              backgroundColor: HUD.card,
              borderWidth: 1,
              borderColor: HUD.border,
              borderRadius: 4,
              padding: 14,
              color: HUD.iceBlue,
              fontSize: 14,
              marginBottom: 20,
            }}
          />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: HUD.cyan }} />
            <Text style={{ color: HUD.statBlue, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              {t("description")}
            </Text>
          </View>
          <TextInput
            value={newSprint.description}
            onChangeText={(v) => setNewSprint(p => ({ ...p, description: v }))}
            placeholder={t("sprintDesc")}
            placeholderTextColor={HUD.text4}
            multiline
            style={{
              backgroundColor: HUD.card,
              borderWidth: 1,
              borderColor: HUD.border,
              borderRadius: 4,
              padding: 14,
              color: HUD.iceBlue,
              fontSize: 14,
              minHeight: 80,
              marginBottom: 20,
            }}
          />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 6 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: HUD.cyan }} />
            <Text style={{ color: HUD.statBlue, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              {t("duration")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
            {[7, 14, 30].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setNewSprint(p => ({ ...p, duration: d }))}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 2,
                  alignItems: "center",
                  backgroundColor: newSprint.duration === d ? HUD.cyanDim : HUD.card,
                  borderWidth: newSprint.duration === d ? 1.5 : 1,
                  borderColor: newSprint.duration === d ? HUD.cyan : HUD.border,
                  shadowColor: newSprint.duration === d ? HUD.cyan : "transparent",
                  shadowOpacity: newSprint.duration === d ? 0.5 : 0,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Text style={{ color: newSprint.duration === d ? HUD.cyan : HUD.statBlue, fontWeight: "700", fontSize: 20, fontVariant: ["tabular-nums"] }}>
                  {d}
                </Text>
                <Text style={{ color: newSprint.duration === d ? HUD.cyan : HUD.text4, fontSize: 10, marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>
                  {t("days")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => createSprint.mutate()}
            disabled={!newSprint.title.trim() || createSprint.isPending}
            testID="start-sprint-button"
            style={{
              backgroundColor: HUD.cyanDim,
              borderWidth: 1,
              borderColor: HUD.cyan,
              borderRadius: 2,
              paddingVertical: 17,
              alignItems: "center",
              opacity: !newSprint.title.trim() ? 0.4 : 1,
              shadowColor: HUD.cyan,
              shadowOpacity: 0.5,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            {createSprint.isPending ? (
              <ActivityIndicator color={HUD.cyan} />
            ) : (
              <Text style={{ color: HUD.cyan, fontSize: 13, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
                {t("startSprint")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* New Goal Modal */}
      <Modal visible={showNewGoal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: HUD.bg, padding: 24, borderTopWidth: 1, borderTopColor: HUD.cyan }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => setShowNewGoal(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: HUD.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color={HUD.statBlue} />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: HUD.iceBlue, fontSize: 13, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              {t("newGoal")}
            </Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: HUD.cyan }} />
            <Text style={{ color: HUD.statBlue, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              {t("goalTitle")}
            </Text>
          </View>
          <TextInput
            value={newGoal.title}
            onChangeText={(v) => setNewGoal(p => ({ ...p, title: v }))}
            placeholder="ej. Lanzar mi primer producto"
            placeholderTextColor={HUD.text4}
            testID="goal-title-input"
            style={{
              backgroundColor: HUD.card,
              borderWidth: 1,
              borderColor: HUD.border,
              borderRadius: 4,
              padding: 14,
              color: HUD.iceBlue,
              fontSize: 14,
              marginBottom: 20,
            }}
          />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: HUD.cyan }} />
            <Text style={{ color: HUD.statBlue, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              {t("goalCategory")}
            </Text>
          </View>
          <TextInput
            value={newGoal.category}
            onChangeText={(v) => setNewGoal(p => ({ ...p, category: v }))}
            placeholder="Negocios, Salud, Aprendizaje..."
            placeholderTextColor={HUD.text4}
            testID="category-input"
            style={{
              backgroundColor: HUD.card,
              borderWidth: 1,
              borderColor: HUD.border,
              borderRadius: 4,
              padding: 14,
              color: HUD.iceBlue,
              fontSize: 14,
              marginBottom: 32,
            }}
          />

          <TouchableOpacity
            onPress={() => createGoal.mutate()}
            disabled={!newGoal.title.trim() || createGoal.isPending}
            testID="create-goal-button"
            style={{
              backgroundColor: HUD.cyanDim,
              borderWidth: 1,
              borderColor: HUD.cyan,
              borderRadius: 2,
              paddingVertical: 17,
              alignItems: "center",
              opacity: !newGoal.title.trim() ? 0.4 : 1,
              shadowColor: HUD.cyan,
              shadowOpacity: 0.5,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            {createGoal.isPending ? (
              <ActivityIndicator color={HUD.cyan} />
            ) : (
              <Text style={{ color: HUD.cyan, fontSize: 13, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
                {t("createGoal")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
