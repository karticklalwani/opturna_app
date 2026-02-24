import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { Sprint, Goal } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Zap, Target, X, Flame, Calendar } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

function SprintCard({ sprint }: { sprint: Sprint }) {
  const daysLeft = Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const progress = sprint.duration > 0 ? Math.min(100, Math.round(((sprint.duration - daysLeft) / sprint.duration) * 100)) : 0;
  const streak = sprint.members?.[0]?.streak || 0;

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <View style={{ backgroundColor: "#141414", borderRadius: 16, padding: 16, marginBottom: 12 }} testID="sprint-card">
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#FAFAFA", fontSize: 16, fontWeight: "700", marginBottom: 4 }}>{sprint.title}</Text>
            {sprint.description ? (
              <Text style={{ color: "#71717A", fontSize: 13, lineHeight: 20 }}>{sprint.description}</Text>
            ) : null}
          </View>
          <View style={{ alignItems: "center", marginLeft: 12 }}>
            <Flame size={20} color={streak > 0 ? "#F59E0B" : "#3F3F46"} />
            <Text style={{ color: streak > 0 ? "#F59E0B" : "#3F3F46", fontSize: 16, fontWeight: "700" }}>{streak}</Text>
            <Text style={{ color: "#52525B", fontSize: 10 }}>streak</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ color: "#71717A", fontSize: 12 }}>{sprint.duration}-day sprint</Text>
            <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "600" }}>{progress}%</Text>
          </View>
          <View style={{ height: 4, backgroundColor: "#27272A", borderRadius: 2 }}>
            <View style={{ width: `${progress}%`, height: 4, backgroundColor: "#F59E0B", borderRadius: 2 }} />
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Calendar size={13} color="#52525B" />
              <Text style={{ color: "#52525B", fontSize: 12 }}>{daysLeft} days left</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Zap size={13} color="#52525B" />
              <Text style={{ color: "#52525B", fontSize: 12 }}>{sprint._count?.members || 1} members</Text>
            </View>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: "#F59E0B", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}
            testID="check-in-button"
          >
            <Text style={{ color: "#0A0A0A", fontSize: 13, fontWeight: "700" }}>Check In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const queryClient = useQueryClient();
  const updateGoal = useMutation({
    mutationFn: (progress: number) => api.patch(`/api/goals/${goal.id}`, { progress }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  return (
    <View style={{ backgroundColor: "#141414", borderRadius: 16, padding: 16, marginBottom: 10 }} testID="goal-card">
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10, marginRight: 12,
          backgroundColor: goal.isCompleted ? "#052e16" : "#1A1A00",
          alignItems: "center", justifyContent: "center",
        }}>
          <Target size={18} color={goal.isCompleted ? "#22C55E" : "#F59E0B"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: goal.isCompleted ? "#71717A" : "#FAFAFA", fontSize: 15, fontWeight: "600", textDecorationLine: goal.isCompleted ? "line-through" : "none" }}>
            {goal.title}
          </Text>
          {goal.category ? (
            <Text style={{ color: "#52525B", fontSize: 12, marginTop: 2 }}>{goal.category}</Text>
          ) : null}
        </View>
        <Text style={{ color: goal.progress >= 100 ? "#22C55E" : "#F59E0B", fontSize: 16, fontWeight: "700" }}>
          {goal.progress}%
        </Text>
      </View>

      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: "#27272A", borderRadius: 2 }}>
        <View style={{
          width: `${goal.progress}%`, height: 4, borderRadius: 2,
          backgroundColor: goal.progress >= 100 ? "#22C55E" : "#F59E0B"
        }} />
      </View>

      {/* Quick actions */}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        {[25, 50, 75, 100].map((val) => (
          <TouchableOpacity
            key={val}
            onPress={() => updateGoal.mutate(val)}
            style={{
              flex: 1, paddingVertical: 6, borderRadius: 8,
              backgroundColor: goal.progress >= val ? "#1A1A00" : "#1C1C1E",
              alignItems: "center",
              borderWidth: 1,
              borderColor: goal.progress >= val ? "#F59E0B" : "#27272A",
            }}
          >
            <Text style={{ color: goal.progress >= val ? "#F59E0B" : "#52525B", fontSize: 11, fontWeight: "600" }}>
              {val}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function SprintsScreen() {
  const [activeTab, setActiveTab] = useState<"sprints" | "goals">("sprints");
  const [showNewSprint, setShowNewSprint] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newSprint, setNewSprint] = useState({ title: "", description: "", duration: 7 });
  const [newGoal, setNewGoal] = useState({ title: "", description: "", category: "" });
  const queryClient = useQueryClient();

  const { data: sprints, isLoading: sprintsLoading, refetch: refetchSprints } = useQuery({
    queryKey: ["sprints"],
    queryFn: () => api.get<Sprint[]>("/api/sprints"),
  });

  const { data: goals, isLoading: goalsLoading, refetch: refetchGoals } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<Goal[]>("/api/goals"),
  });

  const createSprint = useMutation({
    mutationFn: () => api.post("/api/sprints", newSprint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      setShowNewSprint(false);
      setNewSprint({ title: "", description: "", duration: 7 });
    },
  });

  const createGoal = useMutation({
    mutationFn: () => api.post("/api/goals", newGoal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowNewGoal(false);
      setNewGoal({ title: "", description: "", category: "" });
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} testID="sprints-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#FAFAFA", letterSpacing: -0.5, marginBottom: 16 }}>
            Accountability
          </Text>

          {/* Tabs */}
          <View style={{ flexDirection: "row", backgroundColor: "#141414", borderRadius: 12, padding: 4 }}>
            {(["sprints", "goals"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                testID={`${tab}-tab`}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center",
                  backgroundColor: activeTab === tab ? "#F59E0B" : "transparent",
                }}
              >
                <Text style={{ color: activeTab === tab ? "#0A0A0A" : "#71717A", fontSize: 14, fontWeight: "600", textTransform: "capitalize" }}>
                  {tab}
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
            onRefresh={() => activeTab === "sprints" ? refetchSprints() : refetchGoals()}
            tintColor="#F59E0B"
          />
        }
      >
        {activeTab === "sprints" ? (
          <>
            {/* Stats */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1, backgroundColor: "#141414", borderRadius: 14, padding: 14 }}>
                <Flame size={22} color="#F59E0B" />
                <Text style={{ color: "#FAFAFA", fontSize: 22, fontWeight: "700", marginTop: 8 }}>
                  {sprints?.reduce((max, s) => Math.max(max, s.members?.[0]?.streak || 0), 0) || 0}
                </Text>
                <Text style={{ color: "#71717A", fontSize: 12 }}>Best streak</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "#141414", borderRadius: 14, padding: 14 }}>
                <Zap size={22} color="#3B82F6" />
                <Text style={{ color: "#FAFAFA", fontSize: 22, fontWeight: "700", marginTop: 8 }}>{sprints?.length || 0}</Text>
                <Text style={{ color: "#71717A", fontSize: 12 }}>Active sprints</Text>
              </View>
            </View>

            {sprintsLoading ? (
              <ActivityIndicator color="#F59E0B" testID="loading-indicator" />
            ) : (sprints || []).length === 0 ? (
              <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 32 }}>
                <Text style={{ fontSize: 40, marginBottom: 16 }}>⚡</Text>
                <Text style={{ color: "#FAFAFA", fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>Start your first sprint</Text>
                <Text style={{ color: "#52525B", fontSize: 14, textAlign: "center", lineHeight: 22 }}>Build consistency with 7, 14, or 30-day focused sprints.</Text>
              </View>
            ) : (
              (sprints || []).map((sprint) => <SprintCard key={sprint.id} sprint={sprint} />)
            )}

            <TouchableOpacity
              onPress={() => setShowNewSprint(true)}
              testID="new-sprint-button"
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#141414", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#27272A", borderStyle: "dashed" }}
            >
              <Plus size={18} color="#F59E0B" />
              <Text style={{ color: "#F59E0B", fontWeight: "600" }}>New Sprint</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Goals summary */}
            <View style={{ backgroundColor: "#141414", borderRadius: 14, padding: 14, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: "#FAFAFA", fontSize: 20, fontWeight: "700" }}>{goals?.length || 0}</Text>
                  <Text style={{ color: "#71717A", fontSize: 11 }}>Total</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: "#22C55E", fontSize: 20, fontWeight: "700" }}>
                    {goals?.filter(g => g.isCompleted).length || 0}
                  </Text>
                  <Text style={{ color: "#71717A", fontSize: 11 }}>Completed</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: "#F59E0B", fontSize: 20, fontWeight: "700" }}>
                    {goals?.filter(g => !g.isCompleted).length || 0}
                  </Text>
                  <Text style={{ color: "#71717A", fontSize: 11 }}>In Progress</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: "#3B82F6", fontSize: 20, fontWeight: "700" }}>
                    {goals?.length ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0}%
                  </Text>
                  <Text style={{ color: "#71717A", fontSize: 11 }}>Avg Progress</Text>
                </View>
              </View>
            </View>

            {goalsLoading ? (
              <ActivityIndicator color="#F59E0B" testID="loading-indicator" />
            ) : (
              (goals || []).map((goal) => <GoalCard key={goal.id} goal={goal} />)
            )}

            <TouchableOpacity
              onPress={() => setShowNewGoal(true)}
              testID="new-goal-button"
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#141414", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#27272A", borderStyle: "dashed" }}
            >
              <Plus size={18} color="#F59E0B" />
              <Text style={{ color: "#F59E0B", fontWeight: "600" }}>New Goal</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* New Sprint Modal */}
      <Modal visible={showNewSprint} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: "#0F0F0F", padding: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <TouchableOpacity onPress={() => setShowNewSprint(false)}>
              <X size={22} color="#71717A" />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: "#FAFAFA", fontSize: 17, fontWeight: "600" }}>New Sprint</Text>
          </View>

          <Text style={{ color: "#71717A", fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Sprint Title</Text>
          <TextInput
            value={newSprint.title}
            onChangeText={(t) => setNewSprint(p => ({ ...p, title: t }))}
            placeholder="e.g. Morning workout habit"
            placeholderTextColor="#3F3F46"
            testID="sprint-title-input"
            style={{ backgroundColor: "#1C1C1E", borderRadius: 12, padding: 14, color: "#FAFAFA", fontSize: 15, marginBottom: 20 }}
          />

          <Text style={{ color: "#71717A", fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Description</Text>
          <TextInput
            value={newSprint.description}
            onChangeText={(t) => setNewSprint(p => ({ ...p, description: t }))}
            placeholder="What will you do every day?"
            placeholderTextColor="#3F3F46"
            multiline
            style={{ backgroundColor: "#1C1C1E", borderRadius: 12, padding: 14, color: "#FAFAFA", fontSize: 15, minHeight: 80, marginBottom: 20 }}
          />

          <Text style={{ color: "#71717A", fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Duration</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 32 }}>
            {[7, 14, 30].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setNewSprint(p => ({ ...p, duration: d }))}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center",
                  backgroundColor: newSprint.duration === d ? "#F59E0B" : "#1C1C1E",
                  borderWidth: 1, borderColor: newSprint.duration === d ? "#F59E0B" : "#27272A",
                }}
              >
                <Text style={{ color: newSprint.duration === d ? "#0A0A0A" : "#71717A", fontWeight: "700", fontSize: 18 }}>{d}</Text>
                <Text style={{ color: newSprint.duration === d ? "#0A0A0A" : "#52525B", fontSize: 11, marginTop: 2 }}>days</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => createSprint.mutate()}
            disabled={!newSprint.title.trim() || createSprint.isPending}
            testID="start-sprint-button"
            style={{ backgroundColor: "#F59E0B", borderRadius: 14, paddingVertical: 17, alignItems: "center", opacity: !newSprint.title.trim() ? 0.5 : 1 }}
          >
            {createSprint.isPending ? <ActivityIndicator color="#0A0A0A" /> : (
              <Text style={{ color: "#0A0A0A", fontSize: 16, fontWeight: "700" }}>Start Sprint</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* New Goal Modal */}
      <Modal visible={showNewGoal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: "#0F0F0F", padding: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <TouchableOpacity onPress={() => setShowNewGoal(false)}>
              <X size={22} color="#71717A" />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: "#FAFAFA", fontSize: 17, fontWeight: "600" }}>New Goal</Text>
          </View>

          <Text style={{ color: "#71717A", fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Goal Title</Text>
          <TextInput
            value={newGoal.title}
            onChangeText={(t) => setNewGoal(p => ({ ...p, title: t }))}
            placeholder="e.g. Launch my first product"
            placeholderTextColor="#3F3F46"
            testID="goal-title-input"
            style={{ backgroundColor: "#1C1C1E", borderRadius: 12, padding: 14, color: "#FAFAFA", fontSize: 15, marginBottom: 20 }}
          />

          <Text style={{ color: "#71717A", fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Category</Text>
          <TextInput
            value={newGoal.category}
            onChangeText={(t) => setNewGoal(p => ({ ...p, category: t }))}
            placeholder="Business, Health, Learning..."
            placeholderTextColor="#3F3F46"
            style={{ backgroundColor: "#1C1C1E", borderRadius: 12, padding: 14, color: "#FAFAFA", fontSize: 15, marginBottom: 32 }}
          />

          <TouchableOpacity
            onPress={() => createGoal.mutate()}
            disabled={!newGoal.title.trim() || createGoal.isPending}
            testID="create-goal-button"
            style={{ backgroundColor: "#F59E0B", borderRadius: 14, paddingVertical: 17, alignItems: "center", opacity: !newGoal.title.trim() ? 0.5 : 1 }}
          >
            {createGoal.isPending ? <ActivityIndicator color="#0A0A0A" /> : (
              <Text style={{ color: "#0A0A0A", fontSize: 16, fontWeight: "700" }}>Create Goal</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
