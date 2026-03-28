import React, { useState, useEffect, useCallback, useMemo } from "react";
import { WebView } from "react-native-webview";
import CompoundInterestCalculator from "@/components/CompoundInterestCalculator";
import InvestmentAnalysisTool from "@/components/InvestmentAnalysisTool";
import { InvestmentsSection } from "../../components/InvestmentsSection";
import ValorReal from "@/components/ValorReal";
import SimuladorInflacion from "@/components/SimuladorInflacion";
import ComparadorPaises from "@/components/ComparadorPaises";
import PignorarModule from "@/components/PignorarModule";
import GestorPatrimonio from "@/components/GestorPatrimonio";
import IALiquidez from "@/components/IALiquidez";
import PoderAdquisitivo from "@/components/PoderAdquisitivo";
import InflacionPersonal from "@/components/InflacionPersonal";
import EstabilidadFinanciera from "@/components/EstabilidadFinanciera";
import RadarPrecios from "@/components/RadarPrecios";
import NoticiasEconomicas from "@/components/NoticiasEconomicas";
import IndicesInteligentes from "@/components/IndicesInteligentes";
import PlanFinanciero from "@/components/PlanFinanciero";
import SimuladorCasa from "@/components/SimuladorCasa";
import AlquilarVsComprar from "@/components/AlquilarVsComprar";
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
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart,
  Target,
  X,
  ChevronRight,
  CreditCard,
  Home,
  Car,
  Utensils,
  Activity,
  BookOpen,
  Monitor,
  Plus,
  CheckCircle2,
  Zap,
  Clock,
  Shield,
  Globe,
  BarChart3,
  Brain,
  Banknote,
  LineChart,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react-native";
import { useTheme, DARK } from "@/lib/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeColors = typeof DARK;

// ─── Types ───────────────────────────────────────────────────────────────────

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

type TransactionType = "income" | "expense";
type IncomeCategory = "Salario" | "Freelance" | "Inversiones" | "Otros";
type ExpenseCategory =
  | "Comida"
  | "Transporte"
  | "Entretenimiento"
  | "Salud"
  | "Educación"
  | "Vivienda"
  | "Otros";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: IncomeCategory | ExpenseCategory;
  description: string;
  date: string; // ISO date string
}

type InvestmentAssetClass =
  | "Crypto"
  | "Acciones"
  | "ETFs"
  | "Inmuebles"
  | "Efectivo";

interface Investment {
  id: string;
  name: string;
  assetClass: InvestmentAssetClass;
  value: number;
  changePercent: number;
}

interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
}

type FinancialGoalCategory = "emergency" | "investment" | "freedom" | "custom";

interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  category: FinancialGoalCategory;
  color: string;
}

type MainTab =
  | "resumen"
  | "ingresos"
  | "gastos"
  | "inversiones"
  | "ahorro"
  | "objetivos"
  | "analisis"
  | "noticias"
  | "indices"
  | "plan"
  | "simuladores";

// ─── Constants ───────────────────────────────────────────────────────────────

const GOAL_ACCENT_COLORS = ["#4ADE80", "#00B4D8", "#FFD60A"];

const INCOME_CATEGORIES: IncomeCategory[] = [
  "Salario",
  "Freelance",
  "Inversiones",
  "Otros",
];
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Comida",
  "Transporte",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Vivienda",
  "Otros",
];

const ASSET_CLASSES: InvestmentAssetClass[] = [
  "Crypto",
  "Acciones",
  "ETFs",
  "Inmuebles",
  "Efectivo",
];

const ASSET_CLASS_COLORS: Record<InvestmentAssetClass, string> = {
  Crypto: "#F7931A",
  Acciones: "#4ADE80",
  ETFs: "#00B4D8",
  Inmuebles: "#A78BFA",
  Efectivo: "#737373",
};

const SAVINGS_GOAL_COLORS = [
  "#4ADE80",
  "#00B4D8",
  "#FFD60A",
  "#F472B6",
  "#A78BFA",
];

const STORAGE_KEY_TRANSACTIONS = "finance_transactions_v2";
const STORAGE_KEY_INVESTMENTS = "finance_investments_v2";
const STORAGE_KEY_SAVINGS_GOALS = "finance_savings_goals_v2";
const STORAGE_KEY_FINANCIAL_GOALS = "finance_financial_goals_v2";


// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) {
    const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return amount < 0 ? `-${formatted}` : formatted;
  }
  return amount.toFixed(2).replace(".", ",");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}`;
}

function getCurrentMonthLabel(): string {
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  return months[new Date().getMonth()];
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function getCategoryIcon(
  category: IncomeCategory | ExpenseCategory,
  size: number,
  color: string
) {
  switch (category) {
    case "Salario":
      return <DollarSign size={size} color={color} />;
    case "Freelance":
      return <Monitor size={size} color={color} />;
    case "Inversiones":
      return <TrendingUp size={size} color={color} />;
    case "Comida":
      return <Utensils size={size} color={color} />;
    case "Transporte":
      return <Car size={size} color={color} />;
    case "Entretenimiento":
      return <Activity size={size} color={color} />;
    case "Salud":
      return <Activity size={size} color={color} />;
    case "Educación":
      return <BookOpen size={size} color={color} />;
    case "Vivienda":
      return <Home size={size} color={color} />;
    default:
      return <CreditCard size={size} color={color} />;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({
  progress,
  color,
  bgColor,
  height = 6,
}: {
  progress: number;
  color: string;
  bgColor: string;
  height?: number;
}) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: bgColor,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height,
          borderRadius: height / 2,
          width: `${clamped}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function TabBar({
  activeTab,
  onTabChange,
  colors,
}: {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  colors: ThemeColors;
}) {
  const tabs: { key: MainTab; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "ingresos", label: "Ingresos" },
    { key: "gastos", label: "Gastos" },
    { key: "inversiones", label: "Inversiones" },
    { key: "ahorro", label: "Ahorro" },
    { key: "objetivos", label: "Objetivos" },
    { key: "analisis", label: "Análisis" },
    { key: "noticias", label: "Noticias" },
    { key: "indices", label: "Índices" },
    { key: "plan", label: "Plan IA" },
    { key: "simuladores", label: "Simuladores" },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 4 }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            testID={`tab-${tab.key}`}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 100,
              backgroundColor: isActive ? colors.accent : `${colors.accent}10`,
              borderWidth: 1,
              borderColor: isActive ? colors.accent : colors.border,
            }}
          >
            <Text
              style={{
                color: isActive ? "#000" : colors.text3,
                fontSize: 13,
                fontWeight: isActive ? "700" : "500",
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function BalanceCard({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  savingsRate,
  colors,
}: {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  colors: ThemeColors;
}) {
  const isPositive = totalBalance >= 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={{ marginHorizontal: 16, marginBottom: 16 }}
    >
      <View
        style={{
          backgroundColor: colors.bg2,
          borderRadius: 28,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        {/* Top row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              color: colors.text3,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Balance Total
          </Text>
          <View
            style={{
              backgroundColor: `${colors.accent}14`,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Wallet size={11} color={colors.accent} />
            <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}>
              {getCurrentMonthLabel()} 2026
            </Text>
          </View>
        </View>

        {/* Balance amount */}
        <Text
          style={{
            color: isPositive ? colors.text : colors.error,
            fontSize: 44,
            fontWeight: "800",
            letterSpacing: -1.5,
            marginBottom: 4,
          }}
          testID="total-balance"
        >
          {isPositive ? null : "−"}
          {formatCurrency(Math.abs(totalBalance))} €
        </Text>

        {/* Net worth trend placeholder */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
          }}
        >
          <TrendingUp size={14} color={colors.success} />
          <Text style={{ color: colors.success, fontSize: 13, fontWeight: "600" }}>
            +{savingsRate.toFixed(1)}% tasa de ahorro
          </Text>
        </View>

        {/* Mini bar chart — last 5 weeks placeholder */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 4,
            height: 28,
            marginBottom: 20,
          }}
        >
          {[40, 55, 35, 70, 60, 80, 65].map((h, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                borderRadius: 3,
                backgroundColor:
                  i === 6 ? colors.accent : `${colors.accent}30`,
              }}
            />
          ))}
        </View>

        {/* Income / Expenses row */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: `${colors.success}10`,
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: `${colors.success}20`,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <ArrowUpRight size={13} color={colors.success} />
              <Text
                style={{
                  color: colors.success,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                }}
              >
                INGRESOS
              </Text>
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "800",
                letterSpacing: -0.5,
              }}
            >
              +{formatCurrency(monthlyIncome)} €
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: `${colors.error}10`,
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: `${colors.error}20`,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <ArrowDownRight size={13} color={colors.error} />
              <Text
                style={{
                  color: colors.error,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                }}
              >
                GASTOS
              </Text>
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "800",
                letterSpacing: -0.5,
              }}
            >
              -{formatCurrency(monthlyExpenses)} €
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function TransactionCard({
  transaction,
  colors,
  onDelete,
}: {
  transaction: Transaction;
  colors: ThemeColors;
  onDelete?: (id: string) => void;
}) {
  const isIncome = transaction.type === "income";
  const color = isIncome ? colors.success : colors.error;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: `${color}14`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {getCategoryIcon(transaction.category, 18, color)}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 14,
            fontWeight: "600",
            marginBottom: 2,
          }}
        >
          {transaction.description || transaction.category}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: colors.text3, fontSize: 12 }}>
            {transaction.category}
          </Text>
          <View
            style={{
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: colors.text4,
            }}
          />
          <Text style={{ color: colors.text4, fontSize: 12 }}>
            {formatDate(transaction.date)}
          </Text>
        </View>
      </View>

      <Text
        style={{
          color,
          fontSize: 15,
          fontWeight: "700",
          letterSpacing: -0.3,
        }}
      >
        {isIncome ? "+" : "-"}{formatCurrency(transaction.amount)} €
      </Text>

      {onDelete ? (
        <Pressable
          testID={`delete-tx-${transaction.id}`}
          onPress={() => onDelete(transaction.id)}
          hitSlop={8}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: `${colors.error}14`,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 4,
          }}
        >
          <Trash2 size={14} color={colors.error} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Add Transaction Modal ────────────────────────────────────────────────────

function AddTransactionModal({
  visible,
  onClose,
  onSave,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, "id">) => void;
  colors: ThemeColors;
}) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<IncomeCategory | ExpenseCategory>(
    "Comida"
  );
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const categories =
    type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Reset category when type switches
  useEffect(() => {
    setCategory(type === "income" ? "Salario" : "Comida");
  }, [type]);

  const handleSave = () => {
    const parsed = parseFloat(amount.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) {
      setError("Introduce una cantidad v\u00E1lida");
      return;
    }
    setError(null);
    const isoDate = new Date(dateStr + "T12:00:00").toISOString();
    onSave({ type, amount: parsed, category, description, date: isoDate });
    setAmount("");
    setDescription("");
    setDateStr(new Date().toISOString().slice(0, 10));
  };

  const canSave =
    amount.trim().length > 0 &&
    !isNaN(parseFloat(amount.replace(",", "."))) &&
    parseFloat(amount.replace(",", ".")) > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="add-transaction-modal"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: colors.bg2,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: 48,
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

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: "800",
                letterSpacing: -0.4,
              }}
            >
              Nueva Transacción
            </Text>
            <Pressable
              onPress={onClose}
              testID="close-transaction-modal"
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

          {/* Type toggle */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 4,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {(["income", "expense"] as TransactionType[]).map((t) => {
              const isActive = type === t;
              const label = t === "income" ? "Ingreso" : "Gasto";
              const activeColor = t === "income" ? colors.success : colors.error;
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  testID={`type-toggle-${t}`}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: isActive ? `${activeColor}20` : "transparent",
                    borderWidth: isActive ? 1 : 0,
                    borderColor: isActive ? `${activeColor}50` : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? activeColor : colors.text3,
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Amount */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            IMPORTE (€)
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0,00"
            placeholderTextColor={colors.text4}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: colors.text,
              fontSize: 28,
              fontWeight: "800",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
              letterSpacing: -0.5,
            }}
            testID="transaction-amount-input"
            autoFocus
          />

          {/* Category */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            CATEGORÍA
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginBottom: 16 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {(categories as (IncomeCategory | ExpenseCategory)[]).map((cat) => {
              const isActive = category === cat;
              const activeColor =
                type === "income" ? colors.success : colors.error;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  testID={`category-${cat}`}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 100,
                    backgroundColor: isActive
                      ? `${activeColor}20`
                      : `${colors.accent}08`,
                    borderWidth: 1,
                    borderColor: isActive ? `${activeColor}50` : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? activeColor : colors.text3,
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "500",
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Description */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            DESCRIPCIÓN (OPCIONAL)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Añade una nota..."
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
            testID="transaction-description-input"
          />

          {/* Date */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            FECHA (AAAA-MM-DD)
          </Text>
          <TextInput
            value={dateStr}
            onChangeText={setDateStr}
            placeholder="2026-03-13"
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
              marginBottom: 24,
            }}
            testID="transaction-date-input"
          />

          {/* Save button */}
          {error ? (
            <Text style={{ color: colors.error, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            testID="save-transaction-button"
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: canSave
                ? type === "income"
                  ? colors.success
                  : colors.error
                : `${colors.accent}30`,
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
            >
              Guardar Transacción
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Add Investment Modal ─────────────────────────────────────────────────────

function AddInvestmentModal({
  visible,
  onClose,
  onSave,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (inv: Omit<Investment, "id">) => void;
  colors: ThemeColors;
}) {
  const [name, setName] = useState<string>("");
  const [assetClass, setAssetClass] = useState<InvestmentAssetClass>("Acciones");
  const [value, setValue] = useState<string>("");
  const [changePercent, setChangePercent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const canSave =
    name.trim().length > 0 &&
    !isNaN(parseFloat(value)) &&
    parseFloat(value) > 0;

  const handleSave = () => {
    if (!canSave) {
      setError("Introduce una cantidad v\u00E1lida");
      return;
    }
    setError(null);
    onSave({
      name: name.trim(),
      assetClass,
      value: parseFloat(value),
      changePercent: parseFloat(changePercent) || 0,
    });
    setName("");
    setValue("");
    setChangePercent("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="add-investment-modal"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: colors.bg2,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: 48,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: "800",
                letterSpacing: -0.4,
              }}
            >
              Nueva Inversión
            </Text>
            <Pressable
              onPress={onClose}
              testID="close-investment-modal"
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

          {/* Name */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            NOMBRE
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej: Bitcoin, Apple Inc..."
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
            testID="investment-name-input"
            autoFocus
          />

          {/* Asset class */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            CLASE DE ACTIVO
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginBottom: 16 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {ASSET_CLASSES.map((ac) => {
              const isActive = assetClass === ac;
              const acColor = ASSET_CLASS_COLORS[ac];
              return (
                <Pressable
                  key={ac}
                  onPress={() => setAssetClass(ac)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 100,
                    backgroundColor: isActive ? `${acColor}20` : `${colors.accent}08`,
                    borderWidth: 1,
                    borderColor: isActive ? `${acColor}50` : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? acColor : colors.text3,
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "500",
                    }}
                  >
                    {ac}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Value */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            VALOR (€)
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="0,00"
            placeholderTextColor={colors.text4}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: colors.text,
              fontSize: 18,
              fontWeight: "700",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
            testID="investment-value-input"
          />

          {/* Change % */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            CAMBIO % (OPCIONAL)
          </Text>
          <TextInput
            value={changePercent}
            onChangeText={setChangePercent}
            placeholder="0.0"
            placeholderTextColor={colors.text4}
            keyboardType="numbers-and-punctuation"
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: colors.text,
              fontSize: 15,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 24,
            }}
            testID="investment-change-input"
          />

          {error ? (
            <Text style={{ color: colors.error, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            testID="save-investment-button"
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: canSave ? colors.accent : `${colors.accent}30`,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "700" }}>
              Añadir Inversión
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Add Savings Goal Modal ───────────────────────────────────────────────────

function AddSavingsGoalModal({
  visible,
  onClose,
  onSave,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (sg: Omit<SavingsGoal, "id">) => void;
  colors: ThemeColors;
}) {
  const [title, setTitle] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [currentAmount, setCurrentAmount] = useState<string>("");
  const [colorIdx, setColorIdx] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const canSave =
    title.trim().length > 0 && !isNaN(parseFloat(targetAmount)) && parseFloat(targetAmount) > 0;

  const handleSave = () => {
    if (!canSave) {
      setError("Introduce una cantidad v\u00E1lida");
      return;
    }
    setError(null);
    onSave({
      title: title.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      color: SAVINGS_GOAL_COLORS[colorIdx],
    });
    setTitle("");
    setTargetAmount("");
    setCurrentAmount("");
    setColorIdx(0);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="add-savings-goal-modal"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: colors.bg2,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: 48,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 }}
            >
              Nueva Meta de Ahorro
            </Text>
            <Pressable
              onPress={onClose}
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

          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8 }}>
            NOMBRE
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Vacaciones, Coche nuevo..."
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
            autoFocus
          />

          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8 }}>
            OBJETIVO (€)
          </Text>
          <TextInput
            value={targetAmount}
            onChangeText={setTargetAmount}
            placeholder="0"
            placeholderTextColor={colors.text4}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: colors.text,
              fontSize: 18,
              fontWeight: "700",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
          />

          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8 }}>
            AHORRADO ACTUALMENTE (€)
          </Text>
          <TextInput
            value={currentAmount}
            onChangeText={setCurrentAmount}
            placeholder="0"
            placeholderTextColor={colors.text4}
            keyboardType="decimal-pad"
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
          />

          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 10 }}>
            COLOR
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            {SAVINGS_GOAL_COLORS.map((c, i) => (
              <Pressable
                key={c}
                onPress={() => setColorIdx(i)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: c,
                  borderWidth: colorIdx === i ? 3 : 0,
                  borderColor: "#fff",
                }}
              />
            ))}
          </View>

          {error ? (
            <Text style={{ color: colors.error, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: canSave ? colors.accent : `${colors.accent}30`,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "700" }}>
              Crear Meta
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Add Financial Goal Modal ─────────────────────────────────────────────────

function AddFinancialGoalModal({
  visible,
  onClose,
  onSave,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (fg: Omit<FinancialGoal, "id">) => void;
  colors: ThemeColors;
}) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [currentAmount, setCurrentAmount] = useState<string>("");
  const [colorIdx, setColorIdx] = useState<number>(0);

  const canSave =
    title.trim().length > 0 && !isNaN(parseFloat(targetAmount)) && parseFloat(targetAmount) > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      category: "custom",
      color: SAVINGS_GOAL_COLORS[colorIdx],
    });
    setTitle("");
    setDescription("");
    setTargetAmount("");
    setCurrentAmount("");
    setColorIdx(0);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="add-financial-goal-modal"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }}
          onPress={onClose}
        />
        <ScrollView
          style={{
            backgroundColor: colors.bg2,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
          contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 }}
            >
              Nuevo Objetivo
            </Text>
            <Pressable
              onPress={onClose}
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

          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8 }}>
            NOMBRE
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Libertad Financiera..."
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
            autoFocus
          />

          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8 }}>
            DESCRIPCIÓN (OPCIONAL)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="¿Por qué es importante este objetivo?"
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
          />

          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8 }}>
            OBJETIVO (€)
          </Text>
          <TextInput
            value={targetAmount}
            onChangeText={setTargetAmount}
            placeholder="0"
            placeholderTextColor={colors.text4}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: colors.text,
              fontSize: 18,
              fontWeight: "700",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
          />

          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8 }}>
            PROGRESO ACTUAL (€)
          </Text>
          <TextInput
            value={currentAmount}
            onChangeText={setCurrentAmount}
            placeholder="0"
            placeholderTextColor={colors.text4}
            keyboardType="decimal-pad"
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
          />

          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, marginBottom: 10 }}>
            COLOR
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            {SAVINGS_GOAL_COLORS.map((c, i) => (
              <Pressable
                key={c}
                onPress={() => setColorIdx(i)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: c,
                  borderWidth: colorIdx === i ? 3 : 0,
                  borderColor: "#fff",
                }}
              />
            ))}
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: canSave ? colors.accent : `${colors.accent}30`,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "700" }}>
              Crear Objetivo
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Original Goal Modal (preserved) ─────────────────────────────────────────

function CreateGoalModal({
  visible,
  onClose,
  onSubmit,
  isPending,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
  isPending: boolean;
  colors: ThemeColors;
}) {
  const [goalTitle, setGoalTitle] = useState<string>("");
  const [goalDescription, setGoalDescription] = useState<string>("");
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);

  const handleSubmit = () => {
    if (!goalTitle.trim()) return;
    onSubmit(goalTitle.trim(), goalDescription.trim());
  };

  const handleClose = () => {
    setGoalTitle("");
    setGoalDescription("");
    setSelectedColorIndex(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      testID="create-goal-modal"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          onPress={handleClose}
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 }}
            >
              New Financial Goal
            </Text>
            <Pressable
              onPress={handleClose}
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

          <Pressable
            onPress={handleSubmit}
            disabled={!goalTitle.trim() || isPending}
            testID="submit-goal-button"
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor:
                !goalTitle.trim() || isPending
                  ? `${colors.accent}40`
                  : colors.accent,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" testID="submit-loading" />
            ) : (
              <Plus size={16} color="#000" />
            )}
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "700" }}>
              {isPending ? "Creating..." : "Create Goal"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Tab content components ───────────────────────────────────────────────────

function ResumenTab({
  transactions,
  investments,
  savingsGoals,
  financialGoals,
  monthlyIncome,
  monthlyExpenses,
  totalBalance,
  savingsRate,
  colors,
}: {
  transactions: Transaction[];
  investments: Investment[];
  savingsGoals: SavingsGoal[];
  financialGoals: FinancialGoal[];
  monthlyIncome: number;
  monthlyExpenses: number;
  totalBalance: number;
  savingsRate: number;
  colors: ThemeColors;
}) {
  const totalInvested = investments.reduce((s, i) => s + i.value, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const recentTxs = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  // Category breakdown for expenses this month
  const monthExpenses = transactions.filter(
    (t) => t.type === "expense" && isThisMonth(t.date)
  );
  const expenseByCategory: Record<string, number> = {};
  for (const t of monthExpenses) {
    expenseByCategory[t.category] = (expenseByCategory[t.category] ?? 0) + t.amount;
  }
  const topExpenses = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <View>
      {/* Metrics grid */}
      <Animated.View
        entering={FadeInDown.duration(350).delay(60).springify()}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* Inversiones */}
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
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 12,
                  fontWeight: "600",
                  letterSpacing: 0.4,
                }}
              >
                Inversiones
              </Text>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: `${colors.accent}18`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={14} color={colors.accent} />
              </View>
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "700",
                letterSpacing: -0.3,
              }}
            >
              {formatCurrency(totalInvested)} €
            </Text>
          </View>

          {/* Ahorro */}
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
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 12,
                  fontWeight: "600",
                  letterSpacing: 0.4,
                }}
              >
                Ahorro
              </Text>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: `${colors.info}18`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Target size={14} color={colors.info} />
              </View>
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "700",
                letterSpacing: -0.3,
              }}
            >
              {formatCurrency(totalSaved)} €
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Expense breakdown */}
      {topExpenses.length > 0 ? (
        <Animated.View
          entering={FadeInDown.duration(350).delay(100).springify()}
          style={{ marginHorizontal: 16, marginBottom: 16 }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 15,
                fontWeight: "700",
                marginBottom: 14,
                letterSpacing: -0.2,
              }}
            >
              Gastos por categoría
            </Text>
            {topExpenses.map(([cat, amt]) => {
              const pct = monthlyExpenses > 0 ? (amt / monthlyExpenses) * 100 : 0;
              return (
                <View key={cat} style={{ marginBottom: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "500" }}>
                      {cat}
                    </Text>
                    <Text style={{ color: colors.error, fontSize: 13, fontWeight: "600" }}>
                      {formatCurrency(amt)} €
                    </Text>
                  </View>
                  <ProgressBar
                    progress={pct}
                    color={colors.error}
                    bgColor={colors.border}
                    height={5}
                  />
                </View>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      {/* Recent transactions */}
      {recentTxs.length > 0 ? (
        <Animated.View
          entering={FadeInDown.duration(350).delay(140).springify()}
          style={{ marginHorizontal: 16, marginBottom: 16 }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 15,
                fontWeight: "700",
                marginBottom: 4,
                letterSpacing: -0.2,
              }}
            >
              Últimas transacciones
            </Text>
            {recentTxs.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} colors={colors} />
            ))}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function TransactionsTab({
  transactions,
  type,
  onAddTransaction,
  onDeleteTransaction,
  colors,
}: {
  transactions: Transaction[];
  type: TransactionType;
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  colors: ThemeColors;
}) {
  const filtered = transactions
    .filter((t) => t.type === type)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = filtered
    .filter((t) => isThisMonth(t.date))
    .reduce((s, t) => s + t.amount, 0);

  const isIncome = type === "income";
  const color = isIncome ? colors.success : colors.error;

  return (
    <View>
      {/* Summary card */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.8 }}>
            {isIncome ? "INGRESOS ESTE MES" : "GASTOS ESTE MES"}
          </Text>
          <Text
            style={{
              color,
              fontSize: 36,
              fontWeight: "800",
              letterSpacing: -1,
              marginTop: 4,
            }}
          >
            {isIncome ? "+" : "-"}{formatCurrency(total)} €
          </Text>
          <Text style={{ color: colors.text3, fontSize: 13, marginTop: 2 }}>
            {filtered.filter((t) => isThisMonth(t.date)).length} transacciones en {getCurrentMonthLabel()}
          </Text>
        </View>
      </Animated.View>

      {/* List */}
      <Animated.View
        entering={FadeInDown.duration(350).delay(60).springify()}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40, gap: 10 }} testID={`${type}-empty`}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: `${color}14`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isIncome ? (
                  <ArrowUpRight size={24} color={color} />
                ) : (
                  <ArrowDownRight size={24} color={color} />
                )}
              </View>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
                {isIncome ? "Sin ingresos" : "Sin gastos"}
              </Text>
              <Text style={{ color: colors.text3, fontSize: 13, textAlign: "center", maxWidth: 220 }}>
                {isIncome
                  ? "Registra tus fuentes de ingresos."
                  : "Registra tus gastos para hacer seguimiento."}
              </Text>
            </View>
          ) : (
            filtered.map((tx, idx) => (
              <View key={tx.id}>
                <TransactionCard transaction={tx} colors={colors} onDelete={onDeleteTransaction} />
              </View>
            ))
          )}
        </View>
      </Animated.View>

      {/* FAB */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <Pressable
          onPress={onAddTransaction}
          testID={`add-${type}-button`}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: color,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 100,
            shadowColor: color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Plus size={18} color={isIncome ? "#000" : "#fff"} />
          <Text
            style={{
              color: isIncome ? "#000" : "#fff",
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            {isIncome ? "Añadir ingreso" : "Añadir gasto"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function InversionesTab({
  investments,
  onAddInvestment,
  colors,
}: {
  investments: Investment[];
  onAddInvestment: () => void;
  colors: ThemeColors;
}) {
  const totalPortfolio = investments.reduce((s, i) => s + i.value, 0);
  const [showSignalAnalysis, setShowSignalAnalysis] = useState<boolean>(false);

  // Asset allocation by class
  const byClass: Record<InvestmentAssetClass, number> = {
    Crypto: 0,
    Acciones: 0,
    ETFs: 0,
    Inmuebles: 0,
    Efectivo: 0,
  };
  for (const inv of investments) {
    byClass[inv.assetClass] = (byClass[inv.assetClass] ?? 0) + inv.value;
  }

  const allocationEntries = Object.entries(byClass).filter(([, v]) => v > 0) as [
    InvestmentAssetClass,
    number
  ][];

  const tradingViewHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { background: #0F0F0F; overflow: hidden; width: 100%; height: 100%; }
      .tradingview-widget-container { height: 100%; width: 100%; }
      .tradingview-widget-container__widget { height: 100%; width: 100%; }
      .tradingview-widget-copyright { display: none; }
    </style>
  </head>
  <body>
    <div class="tradingview-widget-container" style="height:100%;width:100%">
      <div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>
      {
        "allow_symbol_change": true,
        "calendar": false,
        "details": false,
        "hide_side_toolbar": false,
        "hide_top_toolbar": false,
        "hide_legend": false,
        "hide_volume": false,
        "hotlist": false,
        "interval": "D",
        "locale": "es",
        "save_image": true,
        "style": "1",
        "symbol": "NASDAQ:AAPL",
        "theme": "dark",
        "timezone": "Etc/UTC",
        "backgroundColor": "#0F0F0F",
        "gridColor": "rgba(242, 242, 242, 0.06)",
        "watchlist": [],
        "withdateranges": true,
        "compareSymbols": [],
        "studies": [],
        "autosize": true
      }
      </script>
    </div>
  </body>
</html>`;

  return (
    <View>
      {/* Investment Signal Analysis collapsible */}
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <Pressable
          onPress={() => setShowSignalAnalysis(!showSignalAnalysis)}
          testID="toggle-signal-analysis"
          style={{
            backgroundColor: "#0F0F0F",
            borderBottomLeftRadius: showSignalAnalysis ? 0 : 16,
            borderBottomRightRadius: showSignalAnalysis ? 0 : 16,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#1F1F1F",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${"#60A5FA"}18`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={16} color="#60A5FA" />
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                Análisis de Señales
              </Text>
              <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>
                BUY / SELL / EXIT · Terminal de trading
              </Text>
            </View>
          </View>
          <ChevronRight
            size={18}
            color={colors.text3}
            style={{ transform: [{ rotate: showSignalAnalysis ? "90deg" : "0deg" }] }}
          />
        </Pressable>
        {showSignalAnalysis ? (
          <View
            style={{
              backgroundColor: colors.bg2,
              borderWidth: 1,
              borderTopWidth: 0,
              borderColor: colors.border,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              padding: 16,
            }}
          >
            <InvestmentAnalysisTool />
          </View>
        ) : null}
      </View>

      {/* TradingView chart */}
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 15,
            fontWeight: "700",
            marginBottom: 12,
            letterSpacing: -0.2,
          }}
        >
          Gráfico en Tiempo Real
        </Text>
        <Animated.View
          entering={FadeInDown.duration(300).springify()}
          style={{
            borderRadius: 20,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <WebView
            source={{ html: tradingViewHtml }}
            style={{ height: 420, backgroundColor: "#0F0F0F" }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            mixedContentMode="always"
            originWhitelist={["*"]}
            scalesPageToFit={false}
            scrollEnabled={false}
            allowsInlineMediaPlayback={true}
          />
        </Animated.View>
      </View>

      {/* Portfolio overview */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <PieChart size={16} color={colors.accent} />
            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.8 }}>
              PORTAFOLIO TOTAL
            </Text>
          </View>
          <Text
            style={{
              color: colors.text,
              fontSize: 38,
              fontWeight: "800",
              letterSpacing: -1,
              marginBottom: 4,
            }}
          >
            {formatCurrency(totalPortfolio)} €
          </Text>
          <Text style={{ color: colors.text3, fontSize: 13 }}>
            {investments.length} activos
          </Text>
        </View>
      </Animated.View>

      {/* Asset allocation */}
      {allocationEntries.length > 0 ? (
        <Animated.View
          entering={FadeInDown.duration(350).delay(60).springify()}
          style={{ marginHorizontal: 16, marginBottom: 16 }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 15,
                fontWeight: "700",
                marginBottom: 14,
                letterSpacing: -0.2,
              }}
            >
              Distribución de activos
            </Text>

            {/* Visual bar */}
            <View
              style={{
                flexDirection: "row",
                height: 10,
                borderRadius: 5,
                overflow: "hidden",
                marginBottom: 16,
                gap: 2,
              }}
            >
              {allocationEntries.map(([cls, val]) => {
                const pct = totalPortfolio > 0 ? (val / totalPortfolio) * 100 : 0;
                return (
                  <View
                    key={cls}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: ASSET_CLASS_COLORS[cls],
                    }}
                  />
                );
              })}
            </View>

            {allocationEntries.map(([cls, val]) => {
              const pct = totalPortfolio > 0 ? ((val / totalPortfolio) * 100).toFixed(1) : "0";
              const acColor = ASSET_CLASS_COLORS[cls];
              return (
                <View
                  key={cls}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: acColor,
                      }}
                    />
                    <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "500" }}>
                      {cls}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: colors.text3, fontSize: 12 }}>{pct}%</Text>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>
                      {formatCurrency(val)} €
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      {/* Holdings list */}
      {investments.length > 0 ? (
        <Animated.View
          entering={FadeInDown.duration(350).delay(100).springify()}
          style={{ marginHorizontal: 16, marginBottom: 16 }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 15,
                fontWeight: "700",
                marginBottom: 4,
                letterSpacing: -0.2,
              }}
            >
              Posiciones
            </Text>
            {investments.map((inv) => {
              const isPositive = inv.changePercent >= 0;
              const changeColor = isPositive ? colors.success : colors.error;
              const acColor = ASSET_CLASS_COLORS[inv.assetClass];
              return (
                <View
                  key={inv.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: `${acColor}14`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUp size={18} color={acColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                      {inv.name}
                    </Text>
                    <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>
                      {inv.assetClass}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                      {formatCurrency(inv.value)} €
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 3,
                        marginTop: 2,
                      }}
                    >
                      {isPositive ? (
                        <ArrowUpRight size={12} color={changeColor} />
                      ) : (
                        <ArrowDownRight size={12} color={changeColor} />
                      )}
                      <Text style={{ color: changeColor, fontSize: 12, fontWeight: "600" }}>
                        {isPositive ? "+" : ""}
                        {inv.changePercent.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      {/* Add investment button */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <Pressable
          onPress={onAddInvestment}
          testID="add-investment-button"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.accent,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 100,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Plus size={18} color="#000" />
          <Text style={{ color: "#000", fontSize: 15, fontWeight: "700" }}>
            Añadir inversión
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function AhorroTab({
  savingsGoals,
  transactions,
  monthlyIncome,
  monthlyExpenses,
  savingsRate,
  onAddSavingsGoal,
  onDeleteSavingsGoal,
  colors,
}: {
  savingsGoals: SavingsGoal[];
  transactions: Transaction[];
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  onAddSavingsGoal: () => void;
  onDeleteSavingsGoal: (id: string) => void;
  colors: ThemeColors;
}) {
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);

  return (
    <View>
      {/* Monthly savings summary */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.8, marginBottom: 12 }}>
            TASA DE AHORRO MENSUAL
          </Text>

          {/* Savings rate large indicator */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 16 }}>
            <Text
              style={{
                color: savingsRate >= 20 ? colors.success : savingsRate >= 10 ? "#FFD60A" : colors.error,
                fontSize: 48,
                fontWeight: "800",
                letterSpacing: -2,
              }}
            >
              {savingsRate.toFixed(1)}%
            </Text>
            <Text style={{ color: colors.text3, fontSize: 14, marginBottom: 8 }}>
              de tasa de ahorro
            </Text>
          </View>

          <ProgressBar
            progress={Math.min(savingsRate, 50) * 2}
            color={savingsRate >= 20 ? colors.success : savingsRate >= 10 ? "#FFD60A" : colors.error}
            bgColor={colors.border}
            height={8}
          />
          <Text style={{ color: colors.text3, fontSize: 12, marginTop: 8 }}>
            {savingsRate >= 20
              ? "Excelente tasa de ahorro"
              : savingsRate >= 10
              ? "Buen comienzo, puedes mejorar"
              : "Por debajo del objetivo recomendado (20%)"}
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginTop: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text4, fontSize: 12 }}>Ingresos</Text>
              <Text style={{ color: colors.success, fontSize: 14, fontWeight: "700" }}>
                {formatCurrency(monthlyIncome)} €
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text4, fontSize: 12 }}>Gastos</Text>
              <Text style={{ color: colors.error, fontSize: 14, fontWeight: "700" }}>
                {formatCurrency(monthlyExpenses)} €
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text4, fontSize: 12 }}>Ahorrado</Text>
              <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "700" }}>
                {formatCurrency(Math.max(0, monthlyIncome - monthlyExpenses))} €
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Emergency fund */}
      {savingsGoals.length > 0 ? (
        <Animated.View
          entering={FadeInDown.duration(350).delay(60).springify()}
          style={{ marginHorizontal: 16, marginBottom: 16 }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", letterSpacing: -0.2 }}>
                Metas de Ahorro
              </Text>
              <Text style={{ color: colors.text3, fontSize: 12 }}>
                {formatCurrency(totalSaved)} / {formatCurrency(totalTarget)} €
              </Text>
            </View>

            {savingsGoals.map((goal, idx) => {
              const pct =
                goal.targetAmount > 0
                  ? (goal.currentAmount / goal.targetAmount) * 100
                  : 0;
              const isComplete = pct >= 100;
              return (
                <View key={goal.id} style={{ marginBottom: idx < savingsGoals.length - 1 ? 18 : 0 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: goal.color,
                        }}
                      />
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                        {goal.title}
                      </Text>
                      {isComplete ? (
                        <CheckCircle2 size={14} color={colors.success} />
                      ) : null}
                    </View>
                    <Text style={{ color: goal.color, fontSize: 13, fontWeight: "700" }}>
                      {pct.toFixed(0)}%
                    </Text>
                    <Pressable
                      onPress={() => onDeleteSavingsGoal(goal.id)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: `${colors.error}14`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: 6,
                      }}
                    >
                      <Trash2 size={14} color={colors.error} />
                    </Pressable>
                  </View>
                  <ProgressBar
                    progress={pct}
                    color={goal.color}
                    bgColor={colors.border}
                    height={7}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 5,
                    }}
                  >
                    <Text style={{ color: colors.text3, fontSize: 11 }}>
                      {formatCurrency(goal.currentAmount)} € ahorrados
                    </Text>
                    <Text style={{ color: colors.text4, fontSize: 11 }}>
                      Objetivo: {formatCurrency(goal.targetAmount)} €
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      {/* Add savings goal button */}
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <Pressable
          onPress={onAddSavingsGoal}
          testID="add-savings-goal-button"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.accent,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 100,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Plus size={18} color="#000" />
          <Text style={{ color: "#000", fontSize: 15, fontWeight: "700" }}>
            Nueva meta de ahorro
          </Text>
        </Pressable>
      </View>

      {/* Compound Interest Calculator collapsible */}
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <Pressable
          onPress={() => setShowCalculator(!showCalculator)}
          testID="toggle-compound-calculator"
          style={{
            backgroundColor: colors.card,
            borderRadius: showCalculator ? 16 : 16,
            borderBottomLeftRadius: showCalculator ? 0 : 16,
            borderBottomRightRadius: showCalculator ? 0 : 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${colors.accent}18`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={16} color={colors.accent} />
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                Calculadora de Interés Compuesto
              </Text>
              <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>
                Proyecta el crecimiento de tus ahorros
              </Text>
            </View>
          </View>
          <ChevronRight
            size={18}
            color={colors.text3}
            style={{ transform: [{ rotate: showCalculator ? "90deg" : "0deg" }] }}
          />
        </Pressable>
        {showCalculator ? (
          <View
            style={{
              backgroundColor: colors.bg2,
              borderWidth: 1,
              borderTopWidth: 0,
              borderColor: colors.border,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              padding: 16,
            }}
          >
            <CompoundInterestCalculator />
          </View>
        ) : null}
      </View>

      {/* ── Advanced Anti-Inflation Modules ── */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(100).springify()}
        style={{ marginHorizontal: 16, marginBottom: 12, marginTop: 8 }}
      >
        <Text style={{ color: colors.text3, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 12 }}>
          HERRAMIENTAS ANTI-INFLACI{"\u00D3"}N
        </Text>
      </Animated.View>

      {/* Module cards - collapsible */}
      {[
        { key: "valor-real", icon: LineChart, title: "Valor Real del Dinero", desc: "Tu ahorro ajustado por inflaci\u00F3n", color: "#EF4444" },
        { key: "simulador", icon: BarChart3, title: "Simulador Anti-Inflaci\u00F3n", desc: "Proyecta el impacto en tu dinero", color: "#FFD60A" },
        { key: "comparador", icon: Globe, title: "Comparador de Pa\u00EDses", desc: "Inflaci\u00F3n por pa\u00EDs y regi\u00F3n", color: "#00B4D8" },
        { key: "pignorar", icon: Shield, title: "Pignorar", desc: "Simulador de pignoraci\u00F3n", color: "#A78BFA" },
        { key: "gestor", icon: Banknote, title: "Gestor de Patrimonio", desc: "Diagn\u00F3stico financiero inteligente", color: "#4ADE80" },
        { key: "ia-liquidez", icon: Brain, title: "IA Liquidez Inteligente", desc: "Asistente financiero especializado", color: "#F472B6" },
      ].map((mod, idx) => (
        <Animated.View
          key={mod.key}
          entering={FadeInDown.duration(350).delay(150 + idx * 50).springify()}
          style={{ marginHorizontal: 16, marginBottom: activeModule === mod.key ? 0 : 10 }}
        >
          <Pressable
            onPress={() => setActiveModule(activeModule === mod.key ? null : mod.key)}
            testID={`module-${mod.key}`}
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderBottomLeftRadius: activeModule === mod.key ? 0 : 16,
              borderBottomRightRadius: activeModule === mod.key ? 0 : 16,
              padding: 16,
              borderWidth: 1,
              borderColor: activeModule === mod.key ? `${mod.color}40` : colors.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: `${mod.color}15`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <mod.icon size={18} color={mod.color} />
              </View>
              <View>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                  {mod.title}
                </Text>
                <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>
                  {mod.desc}
                </Text>
              </View>
            </View>
            <ChevronRight
              size={18}
              color={colors.text3}
              style={{ transform: [{ rotate: activeModule === mod.key ? "90deg" : "0deg" }] }}
            />
          </Pressable>
          {activeModule === mod.key ? (
            <View
              style={{
                backgroundColor: "#0A0A0A",
                borderWidth: 1,
                borderTopWidth: 0,
                borderColor: `${mod.color}40`,
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
                padding: 8,
                marginBottom: 10,
              }}
            >
              {mod.key === "valor-real" ? <ValorReal savings={totalSaved} /> : null}
              {mod.key === "simulador" ? <SimuladorInflacion /> : null}
              {mod.key === "comparador" ? <ComparadorPaises /> : null}
              {mod.key === "pignorar" ? <PignorarModule /> : null}
              {mod.key === "gestor" ? <GestorPatrimonio /> : null}
              {mod.key === "ia-liquidez" ? <IALiquidez /> : null}
            </View>
          ) : null}
        </Animated.View>
      ))}
    </View>
  );
}

function ObjetivosTab({
  financialGoals,
  backendGoals,
  goalsLoading,
  onAddFinancialGoal,
  onAddBackendGoal,
  onDeleteFinancialGoal,
  colors,
}: {
  financialGoals: FinancialGoal[];
  backendGoals: Goal[];
  goalsLoading: boolean;
  onAddFinancialGoal: () => void;
  onAddBackendGoal: () => void;
  onDeleteFinancialGoal: (id: string) => void;
  colors: ThemeColors;
}) {
  const getGoalColor = (index: number) =>
    GOAL_ACCENT_COLORS[index % GOAL_ACCENT_COLORS.length];

  const totalGoals = backendGoals.length;
  const completedGoals = backendGoals.filter((g) => g.isCompleted).length;
  const avgProgress =
    totalGoals > 0
      ? Math.round(
          backendGoals.reduce((sum, g) => sum + (g.progress ?? 0), 0) / totalGoals
        )
      : 0;

  return (
    <View>
      {/* Financial Goals (local) */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", letterSpacing: -0.2 }}>
              Objetivos Financieros
            </Text>
            <Pressable
              onPress={onAddFinancialGoal}
              testID="add-financial-goal-button"
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

          {financialGoals.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 24, gap: 8 }}>
              <Target size={32} color={colors.text4} />
              <Text style={{ color: colors.text3, fontSize: 13, textAlign: "center" }}>
                Añade objetivos financieros clave como fondo de emergencia o libertad financiera.
              </Text>
            </View>
          ) : (
            financialGoals.map((goal, idx) => {
              const pct =
                goal.targetAmount > 0
                  ? (goal.currentAmount / goal.targetAmount) * 100
                  : 0;
              const isComplete = pct >= 100;
              return (
                <View
                  key={goal.id}
                  style={{ marginBottom: idx < financialGoals.length - 1 ? 20 : 0 }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                          {goal.title}
                        </Text>
                        {isComplete ? (
                          <CheckCircle2 size={14} color={colors.success} />
                        ) : null}
                      </View>
                      {goal.description ? (
                        <Text style={{ color: colors.text3, fontSize: 12, marginTop: 2 }}>
                          {goal.description}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View
                        style={{
                          backgroundColor: `${goal.color}18`,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Text style={{ color: goal.color, fontSize: 12, fontWeight: "700" }}>
                          {pct.toFixed(0)}%
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => onDeleteFinancialGoal(goal.id)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: `${colors.error}14`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={14} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>
                  <ProgressBar
                    progress={pct}
                    color={isComplete ? colors.success : goal.color}
                    bgColor={colors.border}
                    height={7}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 5,
                    }}
                  >
                    <Text style={{ color: colors.text3, fontSize: 11 }}>
                      {formatCurrency(goal.currentAmount)} €
                    </Text>
                    <Text style={{ color: colors.text4, fontSize: 11 }}>
                      de {formatCurrency(goal.targetAmount)} €
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Animated.View>

      {/* Backend Goals (preserved from original) */}
      <Animated.View
        entering={FadeInDown.duration(350).delay(60).springify()}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", letterSpacing: -0.2 }}>
              Objetivos Financieros
            </Text>
            <Pressable
              onPress={onAddBackendGoal}
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
          ) : backendGoals.length === 0 ? (
            <View
              style={{ alignItems: "center", paddingVertical: 32, gap: 10 }}
              testID="goals-empty-state"
            >
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
              <Text
                style={{
                  color: colors.text3,
                  fontSize: 13,
                  textAlign: "center",
                  lineHeight: 19,
                  maxWidth: 220,
                }}
              >
                Set your first financial goal to start tracking your wealth-building journey.
              </Text>
              <Pressable
                onPress={onAddBackendGoal}
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
                <Plus size={14} color="#000" />
                <Text style={{ color: "#000", fontSize: 14, fontWeight: "700" }}>
                  Add Your First Goal
                </Text>
              </Pressable>
            </View>
          ) : (
            backendGoals.map((goal, index) => {
              const goalColor = getGoalColor(index);
              const progress = goal.progress ?? 0;
              return (
                <View
                  key={goal.id}
                  style={{ marginBottom: index < backendGoals.length - 1 ? 20 : 0 }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text
                        style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}
                        numberOfLines={1}
                      >
                        {goal.title}
                      </Text>
                      {goal.description ? (
                        <Text
                          style={{ color: colors.text3, fontSize: 12, marginTop: 2 }}
                          numberOfLines={1}
                        >
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
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function ResetConfirmModal({
  visible,
  onClose,
  onConfirm,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  colors: ThemeColors;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", alignItems: "center", justifyContent: "center" }}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: colors.bg2,
            borderRadius: 24,
            padding: 28,
            marginHorizontal: 40,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: `${colors.error}14`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={28} color={colors.error} />
          </View>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 8, textAlign: "center" }}>
            Resetear datos financieros
          </Text>
          <Text style={{ color: colors.text3, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
            Se eliminarán todas las transacciones, inversiones, metas de ahorro y objetivos. Esta acción no se puede deshacer.
          </Text>
          <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => { onConfirm(); onClose(); }}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: colors.error,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Resetear</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function FinanceScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<MainTab>("resumen");

  // ── Modal visibility ──
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState<boolean>(false);
  const [showSavingsGoalModal, setShowSavingsGoalModal] = useState<boolean>(false);
  const [showFinancialGoalModal, setShowFinancialGoalModal] = useState<boolean>(false);
  const [showCreateGoalModal, setShowCreateGoalModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // ── Local data state ──
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  // ── Load from AsyncStorage on mount ──
  useEffect(() => {
    async function loadData() {
      try {
        const [txRaw, invRaw, sgRaw, fgRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_TRANSACTIONS),
          AsyncStorage.getItem(STORAGE_KEY_INVESTMENTS),
          AsyncStorage.getItem(STORAGE_KEY_SAVINGS_GOALS),
          AsyncStorage.getItem(STORAGE_KEY_FINANCIAL_GOALS),
        ]);

        setTransactions(txRaw ? (JSON.parse(txRaw) as Transaction[]) : []);
        setInvestments(invRaw ? (JSON.parse(invRaw) as Investment[]) : []);
        setSavingsGoals(sgRaw ? (JSON.parse(sgRaw) as SavingsGoal[]) : []);
        setFinancialGoals(fgRaw ? (JSON.parse(fgRaw) as FinancialGoal[]) : []);
      } catch {
        setTransactions([]);
        setInvestments([]);
        setSavingsGoals([]);
        setFinancialGoals([]);
      } finally {
        setDataLoaded(true);
      }
    }
    loadData();
  }, []);

  // ── Persist helpers ──
  const persistTransactions = useCallback(async (data: Transaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(data));
    } catch {}
  }, []);

  const persistInvestments = useCallback(async (data: Investment[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_INVESTMENTS, JSON.stringify(data));
    } catch {}
  }, []);

  const persistSavingsGoals = useCallback(async (data: SavingsGoal[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SAVINGS_GOALS, JSON.stringify(data));
    } catch {}
  }, []);

  const persistFinancialGoals = useCallback(async (data: FinancialGoal[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_FINANCIAL_GOALS, JSON.stringify(data));
    } catch {}
  }, []);

  // ── Add handlers ──
  const handleAddTransaction = useCallback(
    (tx: Omit<Transaction, "id">) => {
      const newTx: Transaction = { ...tx, id: `t_${Date.now()}` };
      setTransactions((prev) => {
        const updated = [newTx, ...prev];
        persistTransactions(updated);
        return updated;
      });
      setShowTransactionModal(false);
    },
    [persistTransactions]
  );

  const handleAddInvestment = useCallback(
    (inv: Omit<Investment, "id">) => {
      const newInv: Investment = { ...inv, id: `i_${Date.now()}` };
      setInvestments((prev) => {
        const updated = [newInv, ...prev];
        persistInvestments(updated);
        return updated;
      });
      setShowInvestmentModal(false);
    },
    [persistInvestments]
  );

  const handleAddSavingsGoal = useCallback(
    (sg: Omit<SavingsGoal, "id">) => {
      const newSg: SavingsGoal = { ...sg, id: `sg_${Date.now()}` };
      setSavingsGoals((prev) => {
        const updated = [...prev, newSg];
        persistSavingsGoals(updated);
        return updated;
      });
      setShowSavingsGoalModal(false);
    },
    [persistSavingsGoals]
  );

  const handleDeleteTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        persistTransactions(updated);
        return updated;
      });
    },
    [persistTransactions]
  );

  const handleDeleteInvestment = useCallback(
    (id: string) => {
      setInvestments((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        persistInvestments(updated);
        return updated;
      });
    },
    [persistInvestments]
  );

  const handleDeleteSavingsGoal = useCallback(
    (id: string) => {
      setSavingsGoals((prev) => {
        const updated = prev.filter((g) => g.id !== id);
        persistSavingsGoals(updated);
        return updated;
      });
    },
    [persistSavingsGoals]
  );

  const handleDeleteFinancialGoal = useCallback(
    (id: string) => {
      setFinancialGoals((prev) => {
        const updated = prev.filter((g) => g.id !== id);
        persistFinancialGoals(updated);
        return updated;
      });
    },
    [persistFinancialGoals]
  );

  const handleResetAllData = useCallback(async () => {
    setTransactions([]);
    setInvestments([]);
    setSavingsGoals([]);
    setFinancialGoals([]);
    await Promise.all([
      AsyncStorage.removeItem("finance_transactions_v2"),
      AsyncStorage.removeItem("finance_investments_v2"),
      AsyncStorage.removeItem("finance_savings_goals_v2"),
      AsyncStorage.removeItem("finance_financial_goals_v2"),
    ]).catch(() => {});
  }, []);

  const handleAddFinancialGoal = useCallback(
    (fg: Omit<FinancialGoal, "id">) => {
      const newFg: FinancialGoal = { ...fg, id: `fg_${Date.now()}` };
      setFinancialGoals((prev) => {
        const updated = [...prev, newFg];
        persistFinancialGoals(updated);
        return updated;
      });
      setShowFinancialGoalModal(false);
    },
    [persistFinancialGoals]
  );

  // ── Backend goals (original functionality) ──
  const { data: backendGoalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<Goal[]>("/api/goals"),
  });
  const backendGoals = backendGoalsData ?? [];

  const createGoalMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      api.post<Goal>("/api/goals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowCreateGoalModal(false);
    },
  });

  // ── Computed metrics ──
  const monthlyIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income" && isThisMonth(t.date))
        .reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const monthlyExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense" && isThisMonth(t.date))
        .reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const totalBalance = useMemo(
    () =>
      transactions.reduce(
        (s, t) => s + (t.type === "income" ? t.amount : -t.amount),
        0
      ),
    [transactions]
  );

  const savingsRate = useMemo(
    () =>
      monthlyIncome > 0
        ? Math.max(0, ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)
        : 0,
    [monthlyIncome, monthlyExpenses]
  );

  const totalSavings = useMemo(
    () => savingsGoals.reduce((s, g) => s + g.currentAmount, 0),
    [savingsGoals]
  );

  const totalInvestments = useMemo(
    () => investments.reduce((s, i) => s + i.value, 0),
    [investments]
  );

  // ── What modal to show for FAB ──
  const handleFabPress = () => {
    if (activeTab === "ingresos" || activeTab === "gastos") {
      setShowTransactionModal(true);
    } else if (activeTab === "inversiones") {
      setShowInvestmentModal(true);
    } else if (activeTab === "ahorro") {
      setShowSavingsGoalModal(true);
    } else if (activeTab === "objetivos") {
      setShowFinancialGoalModal(true);
    }
  };

  if (!dataLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="finance-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: colors.text,
                  letterSpacing: -0.6,
                }}
              >
                Finanzas
              </Text>
              <Text style={{ fontSize: 14, color: colors.text3, marginTop: 2, fontWeight: "400" }}>
                Tu centro de inteligencia financiera
              </Text>
            </View>
            <Pressable
              onPress={() => setShowResetConfirm(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RotateCcw size={18} color={colors.text3} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Tab bar */}
      <View style={{ paddingBottom: 12 }}>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} colors={colors} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Balance card — always visible on resumen + when meaningful */}
        {(activeTab === "resumen" ||
          activeTab === "ingresos" ||
          activeTab === "gastos") ? (
          <BalanceCard
            totalBalance={totalBalance}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            savingsRate={savingsRate}
            colors={colors}
          />
        ) : null}

        {activeTab === "resumen" ? (
          <ResumenTab
            transactions={transactions}
            investments={investments}
            savingsGoals={savingsGoals}
            financialGoals={financialGoals}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            totalBalance={totalBalance}
            savingsRate={savingsRate}
            colors={colors}
          />
        ) : activeTab === "ingresos" ? (
          <TransactionsTab
            transactions={transactions}
            type="income"
            onAddTransaction={() => setShowTransactionModal(true)}
            onDeleteTransaction={handleDeleteTransaction}
            colors={colors}
          />
        ) : activeTab === "gastos" ? (
          <TransactionsTab
            transactions={transactions}
            type="expense"
            onAddTransaction={() => setShowTransactionModal(true)}
            onDeleteTransaction={handleDeleteTransaction}
            colors={colors}
          />
        ) : activeTab === "inversiones" ? (
          <InvestmentsSection />
        ) : activeTab === "ahorro" ? (
          <AhorroTab
            savingsGoals={savingsGoals}
            transactions={transactions}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            savingsRate={savingsRate}
            onAddSavingsGoal={() => setShowSavingsGoalModal(true)}
            onDeleteSavingsGoal={handleDeleteSavingsGoal}
            colors={colors}
          />
        ) : activeTab === "objetivos" ? (
          <ObjetivosTab
            financialGoals={financialGoals}
            backendGoals={backendGoals}
            goalsLoading={goalsLoading}
            onAddFinancialGoal={() => setShowFinancialGoalModal(true)}
            onAddBackendGoal={() => setShowCreateGoalModal(true)}
            onDeleteFinancialGoal={handleDeleteFinancialGoal}
            colors={colors}
          />
        ) : activeTab === "analisis" ? (
          <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 8 }}>
            <RadarPrecios />
            <PoderAdquisitivo />
            <InflacionPersonal transactions={transactions} />
            <EstabilidadFinanciera
              income={monthlyIncome}
              expenses={monthlyExpenses}
              savings={totalSavings}
              investments={totalInvestments}
            />
          </View>
        ) : activeTab === "noticias" ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <NoticiasEconomicas />
          </View>
        ) : activeTab === "indices" ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <IndicesInteligentes
              income={monthlyIncome}
              expenses={monthlyExpenses}
              savings={totalSavings}
              investments={totalInvestments}
            />
          </View>
        ) : activeTab === "plan" ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <PlanFinanciero
              income={monthlyIncome}
              expenses={monthlyExpenses}
              savings={totalSavings}
              investments={totalInvestments}
            />
          </View>
        ) : activeTab === "simuladores" ? (
          <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 8 }}>
            <SimuladorCasa />
            <AlquilarVsComprar />
          </View>
        ) : null}
      </ScrollView>

      {/* Modals */}
      <AddTransactionModal
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSave={handleAddTransaction}
        colors={colors}
      />

      <AddInvestmentModal
        visible={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
        onSave={handleAddInvestment}
        colors={colors}
      />

      <AddSavingsGoalModal
        visible={showSavingsGoalModal}
        onClose={() => setShowSavingsGoalModal(false)}
        onSave={handleAddSavingsGoal}
        colors={colors}
      />

      <AddFinancialGoalModal
        visible={showFinancialGoalModal}
        onClose={() => setShowFinancialGoalModal(false)}
        onSave={handleAddFinancialGoal}
        colors={colors}
      />

      <CreateGoalModal
        visible={showCreateGoalModal}
        onClose={() => setShowCreateGoalModal(false)}
        onSubmit={(title, description) =>
          createGoalMutation.mutate({ title, description: description || undefined })
        }
        isPending={createGoalMutation.isPending}
        colors={colors}
      />

      <ResetConfirmModal
        visible={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetAllData}
        colors={colors}
      />
    </View>
  );
}
