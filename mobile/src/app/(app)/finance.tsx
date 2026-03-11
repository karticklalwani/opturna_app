import React from "react";
import {
  View,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Target,
  DollarSign,
  ShoppingCart,
  Briefcase,
  BookOpen,
  Coffee,
  PiggyBank,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";

interface MetricCard {
  label: string;
  value: string;
  color: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

interface FinancialGoal {
  name: string;
  progress: number;
  target: string;
  color: string;
}

interface Transaction {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: string;
  isPositive: boolean;
  icon: React.ComponentType<{ size: number; color: string }>;
}

const GOALS: FinancialGoal[] = [
  { name: "Emergency Fund", progress: 68, target: "$15,000", color: "#00FF87" },
  { name: "Business Capital", progress: 34, target: "$50,000", color: "#00B4D8" },
  { name: "Investment Growth", progress: 82, target: "$100,000", color: "#FFD60A" },
];

const TRANSACTIONS: Transaction[] = [
  { id: "1", title: "Salary", category: "Income", date: "Jan 15", amount: "+$4,200", isPositive: true, icon: DollarSign },
  { id: "2", title: "AWS Services", category: "Business", date: "Jan 14", amount: "-$320", isPositive: false, icon: Briefcase },
  { id: "3", title: "Stock Purchase", category: "Investment", date: "Jan 12", amount: "-$1,500", isPositive: false, icon: TrendingUp },
  { id: "4", title: "Freelance Project", category: "Business", date: "Jan 10", amount: "+$2,800", isPositive: true, icon: Briefcase },
  { id: "5", title: "Learning Course", category: "Education", date: "Jan 8", amount: "-$199", isPositive: false, icon: BookOpen },
  { id: "6", title: "Coffee & Food", category: "Lifestyle", date: "Jan 7", amount: "-$180", isPositive: false, icon: Coffee },
  { id: "7", title: "Savings Transfer", category: "Savings", date: "Jan 5", amount: "+$500", isPositive: true, icon: PiggyBank },
];

function ProgressBar({ progress, color, bgColor }: { progress: number; color: string; bgColor: string }) {
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
          width: `${progress}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export default function FinanceScreen() {
  const { colors } = useTheme();

  const metrics: MetricCard[] = [
    { label: "Income", value: "$8,400", color: colors.success, icon: ArrowUpRight },
    { label: "Expenses", value: "$3,200", color: colors.error, icon: ArrowDownLeft },
    { label: "Investments", value: "$12,800", color: colors.accent, icon: TrendingUp },
    { label: "Savings", value: "$6,250", color: colors.accent3, icon: Target },
  ];

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
        {/* Net Balance Card */}
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
              Net Balance
            </Text>
            <Text style={{ color: colors.success, fontSize: 42, fontWeight: "800", letterSpacing: -1, marginBottom: 10 }}>
              $24,850
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View
                style={{
                  backgroundColor: `${colors.success}18`,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <ArrowUpRight size={12} color={colors.success} />
                <Text style={{ color: colors.success, fontSize: 13, fontWeight: "600" }}>
                  +$1,240 this month
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Metrics 2x2 Grid */}
        <Animated.View entering={FadeInDown.duration(350).delay(60).springify()} style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {metrics.slice(0, 2).map((m) => {
              const Icon = m.icon;
              return (
                <View
                  key={m.label}
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
                      {m.label}
                    </Text>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: `${m.color}18`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={14} color={m.color} />
                    </View>
                  </View>
                  <Text style={{ color: m.color, fontSize: 20, fontWeight: "700", letterSpacing: -0.3 }}>
                    {m.value}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            {metrics.slice(2, 4).map((m) => {
              const Icon = m.icon;
              return (
                <View
                  key={m.label}
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
                      {m.label}
                    </Text>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: `${m.color}18`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={14} color={m.color} />
                    </View>
                  </View>
                  <Text style={{ color: m.color, fontSize: 20, fontWeight: "700", letterSpacing: -0.3 }}>
                    {m.value}
                  </Text>
                </View>
              );
            })}
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
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 18, letterSpacing: -0.2 }}>
              Financial Goals
            </Text>
            {GOALS.map((goal, index) => (
              <View key={goal.name} style={{ marginBottom: index < GOALS.length - 1 ? 20 : 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                    {goal.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "500" }}>
                      {goal.target}
                    </Text>
                    <View
                      style={{
                        backgroundColor: `${goal.color}18`,
                        borderRadius: 6,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ color: goal.color, fontSize: 12, fontWeight: "700" }}>
                        {goal.progress}%
                      </Text>
                    </View>
                  </View>
                </View>
                <ProgressBar
                  progress={goal.progress}
                  color={goal.color}
                  bgColor={colors.border}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Transactions */}
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
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 4, letterSpacing: -0.2 }}>
              Recent Transactions
            </Text>
            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "400", marginBottom: 18 }}>
              January 2025
            </Text>
            {TRANSACTIONS.map((tx, index) => {
              const Icon = tx.icon;
              const amountColor = tx.isPositive ? colors.success : colors.error;
              return (
                <View key={tx.id}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: `${amountColor}14`,
                        borderWidth: 1,
                        borderColor: `${amountColor}28`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Icon size={16} color={amountColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 2 }}>
                        {tx.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ color: colors.text3, fontSize: 12 }}>
                          {tx.category}
                        </Text>
                        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.text3 }} />
                        <Text style={{ color: colors.text3, fontSize: 12 }}>
                          {tx.date}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: amountColor, fontSize: 15, fontWeight: "700" }}>
                      {tx.amount}
                    </Text>
                  </View>
                  {index < TRANSACTIONS.length - 1 ? (
                    <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 52 }} />
                  ) : null}
                </View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
