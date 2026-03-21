import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  ActivityIndicator, RefreshControl, Alert, Pressable,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { Sprint, Goal } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Zap, Target, X, Flame, Calendar, Trash2, ChevronLeft } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "expo-router";

function SprintCard({ sprint, colors, t }: { sprint: Sprint; colors: any; t: (key: any) => string }) {
  const queryClient = useQueryClient();
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinContent, setCheckinContent] = useState("");
  const [mood, setMood] = useState(3);

  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;
  const errorSoft = `${colors.error}1A`;
  const errorBorder = `${colors.error}47`;

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
          backgroundColor: colors.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
          padding: 18,
          marginBottom: 14,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 4 },
        }}
        testID="sprint-card"
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 4, letterSpacing: 0.2 }}>
              {sprint.title}
            </Text>
            {sprint.description ? (
              <Text style={{ color: colors.text2, fontSize: 13, lineHeight: 19 }}>{sprint.description}</Text>
            ) : null}
          </View>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: streak > 0 ? accentSoft : `${colors.text}0A`,
            borderWidth: 1,
            borderColor: streak > 0 ? accentBorder : colors.border,
            borderRadius: 100,
            paddingHorizontal: 12,
            paddingVertical: 6,
            marginLeft: 12,
          }}>
            <Flame size={13} color={streak > 0 ? colors.accent : colors.text3} />
            <Text style={{ color: streak > 0 ? colors.accent : colors.text3, fontSize: 13, fontWeight: "700" }}>
              {streak}
            </Text>
          </View>
        </View>

        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: colors.text2, fontSize: 12, fontWeight: "500" }}>
              Day {daysPassed} of {sprint.duration}
            </Text>
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700" }}>
              {progress}%
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: colors.bg2, borderRadius: 100 }}>
            <View style={{
              width: `${progress}%`,
              height: 6,
              backgroundColor: colors.accent,
              borderRadius: 100,
              shadowColor: colors.accent,
              shadowOpacity: 0.4,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            }} />
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Calendar size={12} color={colors.text3} />
            <Text style={{ color: colors.text2, fontSize: 12 }}>
              {daysLeft} {t("daysLeft")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={confirmDelete}
              style={{
                width: 36,
                height: 36,
                borderRadius: 100,
                backgroundColor: errorSoft,
                borderWidth: 1,
                borderColor: errorBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={14} color={colors.error} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCheckin(true)}
              style={{
                backgroundColor: accentSoft,
                borderWidth: 1,
                borderColor: accentBorder,
                borderRadius: 100,
                paddingHorizontal: 18,
                paddingVertical: 8,
              }}
              testID="check-in-button"
            >
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
                {t("checkin")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={showCheckin} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
          <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 100, alignSelf: "center", marginBottom: 24 }} />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28 }}>
            <TouchableOpacity
              onPress={() => setShowCheckin(false)}
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
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: colors.text, fontSize: 17, fontWeight: "700" }}>
              {t("checkInTitle")}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
            {t("howWasToday")}
          </Text>
          <TextInput
            value={checkinContent}
            onChangeText={setCheckinContent}
            placeholder={t("howWasToday")}
            placeholderTextColor={colors.text3}
            multiline
            autoFocus
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              color: colors.text,
              fontSize: 14,
              lineHeight: 20,
              minHeight: 100,
              marginBottom: 24,
              textAlignVertical: "top",
            }}
          />

          <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 12 }}>
            {t("mood")}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
            {["😞", "😐", "🙂", "😊", "🔥"].map((emoji, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setMood(i + 1)}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  backgroundColor: mood === i + 1 ? accentSoft : colors.card,
                  borderWidth: 1.5,
                  borderColor: mood === i + 1 ? colors.accent : colors.border,
                }}
              >
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => checkinMutation.mutate()}
            disabled={!checkinContent.trim() || checkinMutation.isPending}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 100,
              paddingVertical: 17,
              alignItems: "center",
              opacity: !checkinContent.trim() ? 0.4 : 1,
              shadowColor: colors.accent,
              shadowOpacity: 0.3,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            {checkinMutation.isPending ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={{ color: colors.bg, fontSize: 15, fontWeight: "700" }}>
                {t("checkin")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </Animated.View>
  );
}

function GoalCard({ goal, colors, t }: { goal: Goal; colors: any; t: (key: any) => string }) {
  const queryClient = useQueryClient();

  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;
  const errorSoft = `${colors.error}1A`;
  const errorBorder = `${colors.error}47`;
  const successSoft = `${colors.success}1A`;
  const successBorder = `${colors.success}4D`;

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

  const barColor = goal.progress >= 100 ? colors.success : colors.accent;
  const accentColor = goal.isCompleted ? colors.success : colors.accent;
  const iconBg = goal.isCompleted ? successSoft : accentSoft;
  const iconBorder = goal.isCompleted ? successBorder : accentBorder;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
        padding: 18,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      }}
      testID="goal-card"
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 100,
          marginRight: 12,
          backgroundColor: iconBg,
          borderWidth: 1,
          borderColor: iconBorder,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Target size={16} color={accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: goal.isCompleted ? colors.text2 : colors.text,
            fontSize: 14,
            fontWeight: "600",
            textDecorationLine: goal.isCompleted ? "line-through" : "none",
          }}>
            {goal.title}
          </Text>
          {goal.category ? (
            <Text style={{ color: colors.text3, fontSize: 11, marginTop: 2 }}>
              {goal.category}
            </Text>
          ) : null}
        </View>
        <Text style={{ color: barColor, fontSize: 14, fontWeight: "700", marginRight: 10 }}>
          {goal.progress}%
        </Text>
        <TouchableOpacity
          onPress={confirmDelete}
          style={{
            width: 32,
            height: 32,
            borderRadius: 100,
            backgroundColor: errorSoft,
            borderWidth: 1,
            borderColor: errorBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trash2 size={13} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 6, backgroundColor: colors.bg2, borderRadius: 100, marginBottom: 12 }}>
        <View style={{
          width: `${goal.progress}%`,
          height: 6,
          backgroundColor: barColor,
          borderRadius: 100,
        }} />
      </View>

      <View style={{ flexDirection: "row", gap: 6 }}>
        {[25, 50, 75, 100].map((val) => (
          <TouchableOpacity
            key={val}
            onPress={() => updateGoal.mutate(val)}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: 100,
              backgroundColor: goal.progress >= val ? accentSoft : `${colors.text}0A`,
              alignItems: "center",
              borderWidth: 1,
              borderColor: goal.progress >= val ? accentBorder : colors.border,
            }}
          >
            <Text style={{ color: goal.progress >= val ? colors.accent : colors.text3, fontSize: 11, fontWeight: "600" }}>
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sprints" | "goals">("sprints");
  const [showNewSprint, setShowNewSprint] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newSprint, setNewSprint] = useState({ title: "", description: "", duration: 7 });
  const [newGoal, setNewGoal] = useState({ title: "", category: "" });
  const queryClient = useQueryClient();

  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;

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
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 100, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
            >
              <ChevronLeft size={20} color={colors.text} />
            </Pressable>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
              {t("accountability")}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={{
            flexDirection: "row",
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 100,
            padding: 4,
            gap: 4,
          }}>
            {(["sprints", "goals"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                testID={`${tab}-tab`}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 100,
                  alignItems: "center",
                  backgroundColor: activeTab === tab ? colors.accent : "transparent",
                }}
              >
                <Text style={{
                  color: activeTab === tab ? colors.bg : colors.text3,
                  fontSize: 13,
                  fontWeight: "700",
                }}>
                  {t(tab)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => activeTab === "sprints" ? rs() : rg()}
            tintColor={colors.accent}
          />
        }
      >
        {activeTab === "sprints" ? (
          <>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
              <View style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 2 },
              }}>
                <Flame size={18} color={colors.accent} />
                <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 8, letterSpacing: -1 }}>
                  {sprints?.reduce((max, s) => Math.max(max, s.members?.[0]?.streak || 0), 0) || 0}
                </Text>
                <Text style={{ color: colors.text2, fontSize: 11, marginTop: 2 }}>
                  {t("bestStreak")}
                </Text>
              </View>
              <View style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 2 },
              }}>
                <Zap size={18} color={colors.accent} />
                <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 8, letterSpacing: -1 }}>
                  {sprints?.length || 0}
                </Text>
                <Text style={{ color: colors.text2, fontSize: 11, marginTop: 2 }}>
                  {t("activeSprintsLabel")}
                </Text>
              </View>
            </View>

            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", marginBottom: 12, letterSpacing: 0.3 }}>
              {t("sprints")}
            </Text>

            {sl ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <ActivityIndicator color={colors.accent} testID="loading-indicator" />
                <Text style={{ color: colors.text3, fontSize: 13, marginTop: 12 }}>{t("loadingFeed")}</Text>
              </View>
            ) : (sprints || []).length === 0 ? (
              <View style={{
                alignItems: "center",
                paddingVertical: 48,
                backgroundColor: colors.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: "dashed",
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>🏃</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 6 }}>{t("noFeed")}</Text>
                <Text style={{ color: colors.text2, fontSize: 13, textAlign: "center", paddingHorizontal: 24 }}>{t("noFeedDesc")}</Text>
              </View>
            ) : (
              (sprints || []).map((s) => <SprintCard key={s.id} sprint={s} colors={colors} t={t} />)
            )}

            <TouchableOpacity
              onPress={() => setShowNewSprint(true)}
              testID="new-sprint-button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: colors.accent,
                borderRadius: 100,
                padding: 17,
                shadowColor: colors.accent,
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Plus size={18} color={colors.bg} />
              <Text style={{ color: colors.bg, fontSize: 15, fontWeight: "700" }}>
                {t("newSprint")}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 18,
              marginBottom: 24,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                {[
                  { value: goals?.length || 0, label: "Total", color: colors.accent },
                  { value: goals?.filter(g => g.isCompleted).length || 0, label: t("goalsCompleted"), color: colors.success },
                  { value: goals?.filter(g => !g.isCompleted).length || 0, label: t("inProgress"), color: colors.text2 },
                ].map((stat, i) => (
                  <View key={i} style={{ alignItems: "center" }}>
                    <Text style={{ color: stat.color, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 }}>
                      {stat.value}
                    </Text>
                    <Text style={{ color: colors.text3, fontSize: 11, marginTop: 3 }}>
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", marginBottom: 12, letterSpacing: 0.3 }}>
              {t("goals")}
            </Text>

            {gl ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <ActivityIndicator color={colors.accent} testID="loading-indicator" />
                <Text style={{ color: colors.text3, fontSize: 13, marginTop: 12 }}>{t("loadingFeed")}</Text>
              </View>
            ) : (goals || []).length === 0 ? (
              <View style={{
                alignItems: "center",
                paddingVertical: 48,
                backgroundColor: colors.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: "dashed",
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>🎯</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 6 }}>{t("noFeed")}</Text>
                <Text style={{ color: colors.text2, fontSize: 13, textAlign: "center", paddingHorizontal: 24 }}>{t("noFeedDesc")}</Text>
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
                backgroundColor: colors.accent,
                borderRadius: 100,
                padding: 17,
                shadowColor: colors.accent,
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Plus size={18} color={colors.bg} />
              <Text style={{ color: colors.bg, fontSize: 15, fontWeight: "700" }}>
                {t("newGoal")}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* New Sprint Modal */}
      <Modal visible={showNewSprint} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
          <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 100, alignSelf: "center", marginBottom: 24 }} />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28 }}>
            <TouchableOpacity
              onPress={() => setShowNewSprint(false)}
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
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: colors.text, fontSize: 17, fontWeight: "700" }}>
              {t("newSprint")}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
            {t("sprintTitle")}
          </Text>
          <TextInput
            value={newSprint.title}
            onChangeText={(v) => setNewSprint(p => ({ ...p, title: v }))}
            placeholder="e.g. Morning habit"
            placeholderTextColor={colors.text3}
            testID="sprint-title-input"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              color: colors.text,
              fontSize: 14,
              marginBottom: 20,
            }}
          />

          <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
            {t("description")}
          </Text>
          <TextInput
            value={newSprint.description}
            onChangeText={(v) => setNewSprint(p => ({ ...p, description: v }))}
            placeholder={t("sprintDesc")}
            placeholderTextColor={colors.text3}
            multiline
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              color: colors.text,
              fontSize: 14,
              minHeight: 80,
              marginBottom: 20,
              textAlignVertical: "top",
            }}
          />

          <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 12 }}>
            {t("duration")}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 32 }}>
            {[7, 14, 30].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setNewSprint(p => ({ ...p, duration: d }))}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  backgroundColor: newSprint.duration === d ? accentSoft : colors.card,
                  borderWidth: 1.5,
                  borderColor: newSprint.duration === d ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: newSprint.duration === d ? colors.accent : colors.text, fontWeight: "800", fontSize: 22, letterSpacing: -0.5 }}>
                  {d}
                </Text>
                <Text style={{ color: newSprint.duration === d ? colors.accent : colors.text3, fontSize: 12, marginTop: 2 }}>
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
              backgroundColor: colors.accent,
              borderRadius: 100,
              paddingVertical: 17,
              alignItems: "center",
              opacity: !newSprint.title.trim() ? 0.4 : 1,
              shadowColor: colors.accent,
              shadowOpacity: 0.3,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            {createSprint.isPending ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={{ color: colors.bg, fontSize: 15, fontWeight: "700" }}>
                {t("startSprint")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* New Goal Modal */}
      <Modal visible={showNewGoal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
          <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 100, alignSelf: "center", marginBottom: 24 }} />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28 }}>
            <TouchableOpacity
              onPress={() => setShowNewGoal(false)}
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
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: colors.text, fontSize: 17, fontWeight: "700" }}>
              {t("newGoal")}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
            {t("goalTitle")}
          </Text>
          <TextInput
            value={newGoal.title}
            onChangeText={(v) => setNewGoal(p => ({ ...p, title: v }))}
            placeholder="e.g. Launch my first product"
            placeholderTextColor={colors.text3}
            testID="goal-title-input"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              color: colors.text,
              fontSize: 14,
              marginBottom: 20,
            }}
          />

          <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
            {t("goalCategory")}
          </Text>
          <TextInput
            value={newGoal.category}
            onChangeText={(v) => setNewGoal(p => ({ ...p, category: v }))}
            placeholder="Business, Health, Learning..."
            placeholderTextColor={colors.text3}
            testID="category-input"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              color: colors.text,
              fontSize: 14,
              marginBottom: 32,
            }}
          />

          <TouchableOpacity
            onPress={() => createGoal.mutate()}
            disabled={!newGoal.title.trim() || createGoal.isPending}
            testID="create-goal-button"
            style={{
              backgroundColor: colors.accent,
              borderRadius: 100,
              paddingVertical: 17,
              alignItems: "center",
              opacity: !newGoal.title.trim() ? 0.4 : 1,
              shadowColor: colors.accent,
              shadowOpacity: 0.3,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            {createGoal.isPending ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={{ color: colors.bg, fontSize: 15, fontWeight: "700" }}>
                {t("createGoal")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
