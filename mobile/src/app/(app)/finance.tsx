import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Target,
  Plus,
  X,
  Clock,
  Zap,
  CheckCircle2,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";

interface Goal {
  id: string;
  title: string;
  progress: number;
  isCompleted: boolean;
  category: string | null;
  description: string | null;
  createdAt: string;
  milestones: string | null;
}

const GOAL_ACCENT_COLORS = ["#00FF87", "#00B4D8", "#FFD60A"];

function ProgressBar({ progress, color, bgColor }: { progress: number; color: string; bgColor: string }) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <View
      style={{
        height: 6,
        borderRadius: 3,
        backgroundColor: bgColor,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: 6,
          borderRadius: 3,
          width: `${clamped}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function MetricSkeletonCard({
  label,
  icon: Icon,
  color,
}: {
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.4 }}>
          {label}
        </Text>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: `${color}18`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={14} color={color} />
        </View>
      </View>
      <Text style={{ color: colors.text4, fontSize: 20, fontWeight: "700", letterSpacing: -0.3 }}>
        —
      </Text>
    </View>
  );
}

export default function FinanceScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [goalTitle, setGoalTitle] = useState<string>("");
  const [goalDescription, setGoalDescription] = useState<string>("");
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<Goal[]>("/api/goals"),
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      api.post<Goal>("/api/goals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setModalVisible(false);
      setGoalTitle("");
      setGoalDescription("");
      setSelectedColorIndex(0);
    },
  });

  const handleCreateGoal = () => {
    if (!goalTitle.trim()) return;
    createGoalMutation.mutate({
      title: goalTitle.trim(),
      description: goalDescription.trim() || undefined,
    });
  };

  const totalGoals = goals?.length ?? 0;
  const completedGoals = goals?.filter((g) => g.isCompleted).length ?? 0;
  const avgProgress =
    totalGoals > 0
      ? Math.round((goals ?? []).reduce((sum, g) => sum + (g.progress ?? 0), 0) / totalGoals)
      : 0;

  const getGoalColor = (index: number) => GOAL_ACCENT_COLORS[index % GOAL_ACCENT_COLORS.length];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="finance-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.6 }}>
            Finance
          </Text>
          <Text style={{ fontSize: 14, color: colors.text3, marginTop: 2, fontWeight: "400" }}>
            Your financial intelligence hub
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
      >
        {/* Net Balance / Goals Summary Card */}
        <Animated.View entering={FadeInDown.duration(300).springify()} style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text style={{ color: colors.text3, fontSize: 13, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
              Goal Progress
            </Text>

            {goalsLoading ? (
              <View style={{ paddingVertical: 8 }}>
                <ActivityIndicator color={colors.accent} testID="goals-balance-loading" />
              </View>
            ) : totalGoals === 0 ? (
              <>
                <Text style={{ color: colors.text4, fontSize: 38, fontWeight: "800", letterSpacing: -1, marginBottom: 10 }}>
                  —
                </Text>
                <Text style={{ color: colors.text3, fontSize: 13, lineHeight: 18 }}>
                  Add your first financial goal below to start tracking your progress.
                </Text>
              </>
            ) : (
              <>
                <Text style={{ color: colors.success, fontSize: 42, fontWeight: "800", letterSpacing: -1, marginBottom: 6 }}>
                  {avgProgress}%
                </Text>
                <Text style={{ color: colors.text3, fontSize: 13, marginBottom: 14 }}>
                  Average progress across {totalGoals} goal{totalGoals !== 1 ? "s" : ""}
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View
                    style={{
                      backgroundColor: `${colors.success}18`,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <CheckCircle2 size={12} color={colors.success} />
                    <Text style={{ color: colors.success, fontSize: 13, fontWeight: "600" }}>
                      {completedGoals} completed
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: `${colors.accent}14`,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Target size={12} color={colors.accent} />
                    <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
                      {totalGoals - completedGoals} in progress
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        {/* Metrics 2x2 Grid — empty/coming soon state */}
        <Animated.View entering={FadeInDown.duration(350).delay(60).springify()} style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <MetricSkeletonCard label="Income" icon={ArrowUpRight} color={colors.success} />
            <MetricSkeletonCard label="Expenses" icon={ArrowDownLeft} color={colors.error} />
          </View>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <MetricSkeletonCard label="Investments" icon={TrendingUp} color={colors.accent} />
            <MetricSkeletonCard label="Savings" icon={Target} color={colors.accent3} />
          </View>
          <View
            style={{
              marginTop: 10,
              backgroundColor: `${colors.accent}08`,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              borderWidth: 1,
              borderColor: `${colors.accent}18`,
            }}
          >
            <Zap size={13} color={colors.accent} />
            <Text style={{ color: colors.text3, fontSize: 12, flex: 1 }}>
              Financial metrics will sync automatically as you track goals and transactions.
            </Text>
          </View>
        </Animated.View>

        {/* Financial Goals */}
        <Animated.View entering={FadeInDown.duration(350).delay(120).springify()} style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", letterSpacing: -0.2 }}>
                Financial Goals
              </Text>
              <Pressable
                onPress={() => setModalVisible(true)}
                testID="add-goal-button"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: `${colors.accent}20`,
                  borderWidth: 1,
                  borderColor: `${colors.accent}40`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={16} color={colors.accent} />
              </Pressable>
            </View>

            {goalsLoading ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <ActivityIndicator size="large" color={colors.accent} testID="goals-loading" />
                <Text style={{ color: colors.text3, fontSize: 13, marginTop: 10 }}>
                  Loading your goals...
                </Text>
              </View>
            ) : (goals ?? []).length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 32, gap: 10 }} testID="goals-empty-state">
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: `${colors.accent3}14`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                  }}
                >
                  <Target size={24} color={colors.accent3} />
                </View>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", textAlign: "center" }}>
                  No goals yet
                </Text>
                <Text style={{ color: colors.text3, fontSize: 13, textAlign: "center", lineHeight: 19, maxWidth: 220 }}>
                  Set your first financial goal to start tracking your wealth-building journey.
                </Text>
                <Pressable
                  onPress={() => setModalVisible(true)}
                  testID="add-first-goal-button"
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 100,
                    backgroundColor: colors.accent,
                  }}
                >
                  <Plus size={14} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                    Add Your First Goal
                  </Text>
                </Pressable>
              </View>
            ) : (
              (goals ?? []).map((goal, index) => {
                const goalColor = getGoalColor(index);
                const progress = goal.progress ?? 0;
                return (
                  <View key={goal.id} style={{ marginBottom: index < (goals ?? []).length - 1 ? 20 : 0 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }} numberOfLines={1}>
                          {goal.title}
                        </Text>
                        {goal.description ? (
                          <Text style={{ color: colors.text3, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                            {goal.description}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {goal.isCompleted ? (
                          <View
                            style={{
                              backgroundColor: `${colors.success}18`,
                              borderRadius: 6,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={11} color={colors.success} />
                            <Text style={{ color: colors.success, fontSize: 11, fontWeight: "700" }}>
                              Done
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              backgroundColor: `${goalColor}18`,
                              borderRadius: 6,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                            }}
                          >
                            <Text style={{ color: goalColor, fontSize: 12, fontWeight: "700" }}>
                              {progress}%
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <ProgressBar
                      progress={progress}
                      color={goal.isCompleted ? colors.success : goalColor}
                      bgColor={colors.border}
                    />
                  </View>
                );
              })
            )}
          </View>
        </Animated.View>

        {/* Transaction Tracking — Coming Soon */}
        <Animated.View entering={FadeInDown.duration(350).delay(180).springify()} style={{ marginHorizontal: 16 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", letterSpacing: -0.2 }}>
                Transaction History
              </Text>
              <View
                style={{
                  backgroundColor: `${colors.accent3}18`,
                  borderRadius: 8,
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ color: colors.accent3, fontSize: 11, fontWeight: "700" }}>
                  SOON
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.text3, fontSize: 12, marginBottom: 20 }}>
              Automatic income and expense tracking
            </Text>

            <View
              style={{
                borderWidth: 1,
                borderColor: `${colors.accent}18`,
                borderRadius: 18,
                padding: 20,
                alignItems: "center",
                gap: 10,
                backgroundColor: `${colors.accent}06`,
              }}
              testID="transactions-coming-soon"
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: `${colors.accent}14`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 2,
                }}
              >
                <Clock size={24} color={colors.accent} />
              </View>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", textAlign: "center" }}>
                Transaction Tracking Coming Soon
              </Text>
              <Text style={{ color: colors.text3, fontSize: 13, textAlign: "center", lineHeight: 19, maxWidth: 260 }}>
                Connect your accounts to automatically sync and categorize income, expenses, and investments in real time.
              </Text>
              <View
                style={{
                  marginTop: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: `${colors.accent}14`,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Zap size={13} color={colors.accent} />
                <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
                  Powered by Finance AI
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        testID="create-goal-modal"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
            onPress={() => setModalVisible(false)}
          />
          <View
            style={{
              backgroundColor: colors.bg2,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: 40,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 }}>
                New Financial Goal
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                testID="close-modal-button"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: colors.card,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} color={colors.text3} />
              </Pressable>
            </View>

            {/* Goal Name */}
            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8 }}>
              GOAL NAME
            </Text>
            <TextInput
              value={goalTitle}
              onChangeText={setGoalTitle}
              placeholder="e.g. Emergency Fund, Business Capital..."
              placeholderTextColor={colors.text4}
              style={{
                backgroundColor: colors.card,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: colors.text,
                fontSize: 15,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 16,
              }}
              testID="goal-title-input"
              autoFocus
            />

            {/* Description */}
            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8 }}>
              DESCRIPTION (OPTIONAL)
            </Text>
            <TextInput
              value={goalDescription}
              onChangeText={setGoalDescription}
              placeholder="What are you saving for?"
              placeholderTextColor={colors.text4}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: colors.card,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: colors.text,
                fontSize: 15,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 16,
                minHeight: 70,
                textAlignVertical: "top",
              }}
              testID="goal-description-input"
            />

            {/* Color Picker */}
            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 10 }}>
              ACCENT COLOR
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              {GOAL_ACCENT_COLORS.map((color, i) => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColorIndex(i)}
                  testID={`color-option-${i}`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: color,
                    borderWidth: selectedColorIndex === i ? 3 : 0,
                    borderColor: colors.text,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedColorIndex === i ? (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#000",
                        opacity: 0.5,
                      }}
                    />
                  ) : null}
                </Pressable>
              ))}
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleCreateGoal}
              disabled={!goalTitle.trim() || createGoalMutation.isPending}
              testID="submit-goal-button"
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                backgroundColor:
                  !goalTitle.trim() || createGoalMutation.isPending
                    ? `${colors.accent}40`
                    : colors.accent,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {createGoalMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" testID="submit-loading" />
              ) : (
                <Plus size={16} color="#fff" />
              )}
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
