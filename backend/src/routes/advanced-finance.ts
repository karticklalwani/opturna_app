import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const advancedFinanceRouter = new Hono();

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: "inflacion" | "euribor" | "mercados" | "vivienda" | "energia" | "economia";
  impact: "alto" | "medio" | "bajo";
  change: number;
  trend: "up" | "down" | "stable";
  date: string;
  icon: string;
}

interface Alert {
  id: string;
  message: string;
  severity: "critical" | "warning" | "info";
  category: string;
}

interface IndexResult {
  score: number;
  level: string;
  trend: "up" | "down" | "stable";
  description: string;
  tip: string;
}

interface AmortizationPoint {
  year: number;
  capitalPendiente: number;
  capitalAmortizado: number;
}

interface YearlyComparison {
  year: number;
  costAcumuladoCompra: number;
  costAcumuladoAlquiler: number;
  patrimonioCompra: number;
  patrimonioAlquiler: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getLevel(score: number): string {
  if (score <= 30) return "Crítico";
  if (score <= 50) return "Bajo";
  if (score <= 70) return "Moderado";
  if (score <= 85) return "Bueno";
  return "Excelente";
}

function getRiskLevel(score: number): string {
  if (score <= 20) return "Bajo";
  if (score <= 40) return "Moderado";
  if (score <= 60) return "Alto";
  return "Crítico";
}

function dateOffset(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split("T")[0] ?? d.toISOString().substring(0, 10);
}

// ─── GET /news ────────────────────────────────────────────────────────────────

advancedFinanceRouter.get("/news", (c) => {
  const news: NewsItem[] = [
    {
      id: "1",
      title: "IPC España sube al 3.4%",
      summary:
        "El Índice de Precios al Consumo en España registra un incremento del 3.4% interanual, impulsado principalmente por los alimentos y los servicios.",
      category: "inflacion",
      impact: "alto",
      change: 3.4,
      trend: "up",
      date: dateOffset(0),
      icon: "📈",
    },
    {
      id: "2",
      title: "Euribor 12m se sitúa en 3.35%",
      summary:
        "El Euribor a 12 meses continúa su tendencia bajista y se sitúa en el 3.35%, lejos del máximo histórico del 4.2% alcanzado en 2023.",
      category: "euribor",
      impact: "alto",
      change: -0.4,
      trend: "down",
      date: dateOffset(1),
      icon: "🏦",
    },
    {
      id: "3",
      title: "Precio de los alimentos sube un 5.8%",
      summary:
        "La cesta de la compra se encarece un 5.8% respecto al año anterior, siendo uno de los componentes que más presiona la inflación general.",
      category: "inflacion",
      impact: "alto",
      change: 5.8,
      trend: "up",
      date: dateOffset(1),
      icon: "🛒",
    },
    {
      id: "4",
      title: "Alquiler en España sube un 7.4%",
      summary:
        "El mercado del alquiler residencial registra un incremento medio del 7.4% a nivel nacional, con Madrid y Barcelona liderando las subidas.",
      category: "vivienda",
      impact: "alto",
      change: 7.4,
      trend: "up",
      date: dateOffset(2),
      icon: "🏠",
    },
    {
      id: "5",
      title: "Inflación zona euro en 2.6%",
      summary:
        "La inflación en la eurozona desacelera hasta el 2.6%, acercándose al objetivo del 2% del BCE gracias a la bajada de los precios energéticos.",
      category: "inflacion",
      impact: "medio",
      change: 2.6,
      trend: "down",
      date: dateOffset(2),
      icon: "🇪🇺",
    },
    {
      id: "6",
      title: "Precio energía baja un 3.5%",
      summary:
        "Los precios de la energía retroceden un 3.5% interanual, aliviando la presión sobre los hogares y las empresas en sus facturas.",
      category: "energia",
      impact: "medio",
      change: -3.5,
      trend: "down",
      date: dateOffset(3),
      icon: "⚡",
    },
    {
      id: "7",
      title: "Gasolina sube un 8.2% interanual",
      summary:
        "A pesar de la bajada general de la energía, la gasolina en surtidor acumula un encarecimiento del 8.2% en el último año.",
      category: "energia",
      impact: "alto",
      change: 8.2,
      trend: "up",
      date: dateOffset(3),
      icon: "⛽",
    },
    {
      id: "8",
      title: "BCE mantiene tipos al 4%",
      summary:
        "El Banco Central Europeo mantiene los tipos de interés en el 4% a la espera de que la inflación se acerque de forma sostenida al objetivo del 2%.",
      category: "euribor",
      impact: "medio",
      change: 0,
      trend: "stable",
      date: dateOffset(4),
      icon: "🏛️",
    },
    {
      id: "9",
      title: "Inflación mundial en 5.8%",
      summary:
        "El FMI estima la inflación mundial en un 5.8%, con tendencia a la baja respecto al pico del 8.7% de 2022, aunque persiste la presión en economías emergentes.",
      category: "economia",
      impact: "medio",
      change: 5.8,
      trend: "down",
      date: dateOffset(4),
      icon: "🌍",
    },
    {
      id: "10",
      title: "Salarios reales caen un 1.2% por inflación",
      summary:
        "A pesar de las subidas salariales pactadas, la inflación erosiona el poder adquisitivo y los salarios reales caen un 1.2% en términos ajustados.",
      category: "economia",
      impact: "alto",
      change: -1.2,
      trend: "down",
      date: dateOffset(5),
      icon: "💸",
    },
    {
      id: "11",
      title: "Vivienda nueva sube 8% en 2024",
      summary:
        "El precio de la vivienda nueva creció un 8% en 2024 impulsado por la escasez de oferta y la fuerte demanda en las principales ciudades.",
      category: "vivienda",
      impact: "alto",
      change: 8.0,
      trend: "up",
      date: dateOffset(5),
      icon: "🏗️",
    },
    {
      id: "12",
      title: "Transporte público sube 2.1%",
      summary:
        "Las tarifas del transporte público registran una subida moderada del 2.1%, por debajo de la inflación general gracias a las subvenciones públicas.",
      category: "inflacion",
      impact: "bajo",
      change: 2.1,
      trend: "up",
      date: dateOffset(6),
      icon: "🚌",
    },
  ];

  const alerts: Alert[] = [
    {
      id: "alert-1",
      message: "Tus gastos de alquiler pueden estar subiendo más rápido que tu salario",
      severity: "warning",
      category: "vivienda",
    },
    {
      id: "alert-2",
      message: "El Euribor está bajando - buen momento para revisar tu hipoteca",
      severity: "info",
      category: "euribor",
    },
    {
      id: "alert-3",
      message: "La inflación en alimentación supera el 5% - revisa tu presupuesto",
      severity: "critical",
      category: "inflacion",
    },
  ];

  const euribor = {
    current: 3.35,
    previous: 3.78,
    change: -0.43,
    trend: "down" as const,
    monthly: [4.2, 4.1, 3.95, 3.85, 3.78, 3.72, 3.65, 3.58, 3.52, 3.46, 3.40, 3.35],
  };

  return c.json({
    data: {
      news,
      alerts,
      euribor,
      lastUpdated: new Date().toISOString(),
    },
  });
});

// ─── POST /indices ────────────────────────────────────────────────────────────

const indicesSchema = z.object({
  income: z.number().min(0).default(0),
  expenses: z.number().min(0).default(0),
  savings: z.number().min(0).default(0),
  investments: z.number().min(0).default(0),
  debt: z.number().min(0).default(0),
  habitsCompletionRate: z.number().min(0).max(100).default(50),
  goalsCompletionRate: z.number().min(0).max(100).default(50),
  personalInflation: z.number().min(0).max(50).default(3.4),
});

advancedFinanceRouter.post("/indices", zValidator("json", indicesSchema), (c) => {
  const {
    income,
    expenses,
    savings,
    investments,
    debt,
    habitsCompletionRate,
    goalsCompletionRate,
    personalInflation,
  } = c.req.valid("json");

  // 1. Estabilidad Financiera
  const savingsComponent = Math.min(25, (savings / Math.max(income, 1)) * 100);
  const expenseComponent = Math.max(0, Math.min(20, (1 - expenses / Math.max(income, 1)) * 20));
  const investComponent = Math.min(20, (investments / Math.max(income * 12, 1)) * 20);
  const debtComponent = Math.max(0, 20 - (debt / Math.max(income * 12, 1)) * 20);
  const inflationComponent = Math.max(0, 15 - personalInflation * 2);
  const stabilityScore = clamp(
    savingsComponent + expenseComponent + investComponent + debtComponent + inflationComponent,
    0,
    100
  );

  const estabilidad: IndexResult = {
    score: Math.round(stabilityScore),
    level: getLevel(stabilityScore),
    trend: stabilityScore >= 60 ? "up" : stabilityScore >= 40 ? "stable" : "down",
    description: "Mide qué tan sólida es tu base financiera considerando ahorro, deuda e inflación.",
    tip:
      stabilityScore < 50
        ? "Intenta ahorrar al menos el 20% de tus ingresos y reduce deudas pendientes."
        : "Mantén tu fondo de emergencia y diversifica tus inversiones.",
  };

  // 2. Índice de Riesgo
  const debtRisk = Math.min(40, (debt / Math.max(income * 12, 1)) * 40);
  const expenseRisk = Math.min(30, (expenses / Math.max(income, 1)) * 30);
  const inflationRisk = Math.min(20, personalInflation * 3);
  const savingsBuffer = Math.max(0, 10 - (savings / Math.max(income, 1)) * 10);
  const riskScore = clamp(debtRisk + expenseRisk + inflationRisk + savingsBuffer, 0, 100);

  const riesgo: IndexResult = {
    score: Math.round(riskScore),
    level: getRiskLevel(riskScore),
    trend: riskScore <= 30 ? "down" : riskScore <= 60 ? "stable" : "up",
    description: "Evalúa la exposición al riesgo financiero. A menor puntuación, mayor seguridad.",
    tip:
      riskScore > 60
        ? "Reduce tus deudas y aumenta tu colchón de ahorro para bajar el nivel de riesgo."
        : "Buen nivel de riesgo. Sigue monitorizando tu ratio de endeudamiento.",
  };

  // 3. Índice de Progreso
  const habitScore = habitsCompletionRate * 0.5;
  const goalScore = goalsCompletionRate * 0.5;
  const progressScore = clamp(habitScore + goalScore, 0, 100);

  const progreso: IndexResult = {
    score: Math.round(progressScore),
    level: getLevel(progressScore),
    trend: progressScore >= 70 ? "up" : progressScore >= 40 ? "stable" : "down",
    description: "Refleja el avance en tus hábitos financieros y metas establecidas.",
    tip:
      progressScore < 60
        ? "Establece metas concretas y pequeños hábitos diarios para mejorar tu progreso."
        : "Sigue así. La constancia en los hábitos es clave para el éxito financiero.",
  };

  // 4. Índice de Disciplina
  const habitDiscipline = habitsCompletionRate * 0.6;
  const savingsDiscipline = Math.min(40, (savings / Math.max(income * 0.2, 1)) * 40);
  const disciplineScore = clamp(habitDiscipline + savingsDiscipline, 0, 100);

  const disciplina: IndexResult = {
    score: Math.round(disciplineScore),
    level: getLevel(disciplineScore),
    trend: disciplineScore >= 70 ? "up" : disciplineScore >= 40 ? "stable" : "down",
    description: "Mide tu constancia en hábitos y si alcanzas los objetivos de ahorro marcados.",
    tip:
      disciplineScore < 55
        ? "Automatiza transferencias al ahorro el día de cobro para mejorar la disciplina."
        : "Excelente disciplina. Considera aumentar progresivamente tus metas de ahorro.",
  };

  // 5. Índice de Ahorro
  const savingsRate = Math.max(0, Math.min(100, ((income - expenses) / Math.max(income, 1)) * 100));
  const investmentBonus =
    savings > 0 ? Math.min(20, (investments / Math.max(savings + investments, 1)) * 20) : 0;
  const savingsScore = clamp(savingsRate * 2 + investmentBonus, 0, 100);

  const ahorro: IndexResult = {
    score: Math.round(savingsScore),
    level: getLevel(savingsScore),
    trend: savingsScore >= 60 ? "up" : savingsScore >= 35 ? "stable" : "down",
    description: "Evalúa tu tasa de ahorro neta respecto a ingresos e inversiones.",
    tip:
      savingsScore < 50
        ? "Aplica la regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorro e inversión."
        : "Considera invertir parte de tu ahorro para que trabaje por ti.",
  };

  // 6. Salud Económica
  const healthScore = clamp((stabilityScore + savingsScore + (100 - riskScore)) / 3, 0, 100);

  const saludEconomica: IndexResult = {
    score: Math.round(healthScore),
    level: getLevel(healthScore),
    trend: healthScore >= 65 ? "up" : healthScore >= 40 ? "stable" : "down",
    description: "Visión global de tu salud financiera combinando estabilidad, ahorro y riesgo.",
    tip:
      healthScore < 50
        ? "Enfócate primero en reducir gastos innecesarios y crear un fondo de emergencia."
        : "Tu salud económica es buena. Siguiente paso: diversificar y planificar a largo plazo.",
  };

  // Summary
  const scoreMap: Record<string, number> = {
    estabilidad: stabilityScore,
    progreso: progressScore,
    disciplina: disciplineScore,
    ahorro: savingsScore,
    saludEconomica: healthScore,
  };

  const sortedDesc = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);
  const topStrength = sortedDesc[0]?.[0] ?? "estabilidad";
  const topWeakness = sortedDesc[sortedDesc.length - 1]?.[0] ?? "ahorro";

  const overallScore = Math.round(
    (stabilityScore + progressScore + disciplineScore + savingsScore + healthScore) / 5
  );

  return c.json({
    data: {
      indices: {
        estabilidad,
        riesgo,
        progreso,
        disciplina,
        ahorro,
        saludEconomica,
      },
      summary: {
        overallScore,
        topStrength,
        topWeakness,
      },
      lastUpdated: new Date().toISOString(),
    },
  });
});

// ─── POST /plan ───────────────────────────────────────────────────────────────

const planSchema = z.object({
  income: z.number().min(0),
  expenses: z.number().min(0),
  savings: z.number().min(0),
  investments: z.number().min(0),
  debt: z.number().min(0).default(0),
  goal: z.enum(["ahorro", "inversion", "deuda", "libertad"]).default("ahorro"),
  timeframe: z.enum(["3meses", "6meses", "1ano", "5anos"]).default("1ano"),
});

advancedFinanceRouter.post("/plan", zValidator("json", planSchema), (c) => {
  const { income, expenses, savings, investments, debt, goal, timeframe } = c.req.valid("json");

  const monthlySavings = income - expenses;
  const savingsRate = income > 0 ? monthlySavings / income : 0;
  const monthsToPayDebt =
    debt > 0 && monthlySavings > 0 ? Math.ceil(debt / (monthlySavings * 0.5)) : null;
  const projectedSavings1Year = savings + Math.max(0, monthlySavings * 12);
  const projectedSavings5Years = savings + Math.max(0, monthlySavings * 60);

  interface PlanAction {
    action: string;
    amount: number | null;
    priority: "alta" | "media" | "baja";
    category: string;
  }

  const monthlyPlan: PlanAction[] = [];

  if (debt > 0) {
    monthlyPlan.push({
      action: `Destinar el 50% del ahorro mensual (${Math.round(monthlySavings * 0.5)}€) a reducir deuda`,
      amount: Math.round(monthlySavings * 0.5),
      priority: "alta",
      category: "deuda",
    });
  }

  const emergencyFundTarget = expenses * 6;
  const emergencyFundGap = Math.max(0, emergencyFundTarget - savings);
  if (emergencyFundGap > 0) {
    monthlyPlan.push({
      action: `Construir fondo de emergencia de ${Math.round(emergencyFundTarget)}€ (6 meses de gastos)`,
      amount: Math.round(Math.min(monthlySavings * 0.3, emergencyFundGap)),
      priority: "alta",
      category: "emergencia",
    });
  }

  if (savingsRate < 0.1) {
    monthlyPlan.push({
      action: "Revisar y reducir gastos variables en al menos un 10%",
      amount: Math.round(expenses * 0.1),
      priority: "alta",
      category: "gastos",
    });
  }

  if (investments < savings * 0.5) {
    monthlyPlan.push({
      action: `Invertir ${Math.round(monthlySavings * 0.2)}€ al mes en fondos indexados`,
      amount: Math.round(Math.max(0, monthlySavings * 0.2)),
      priority: "media",
      category: "inversion",
    });
  }

  monthlyPlan.push({
    action: "Revisar suscripciones y cancelar las que no uses activamente",
    amount: null,
    priority: "baja",
    category: "gastos",
  });

  // Ensure we have at least 5 items
  if (monthlyPlan.length < 5) {
    monthlyPlan.push({
      action: "Automatizar transferencia de ahorro el día de cobro",
      amount: Math.round(Math.max(0, monthlySavings * 0.1)),
      priority: "media",
      category: "ahorro",
    });
  }

  interface AnnualGoal {
    goal: string;
    targetAmount: number | null;
    deadline: string;
    progress: number;
  }

  const annualGoals: AnnualGoal[] = [];

  const deadline1Year = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const deadline3Months = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

  if (goal === "deuda" || debt > 0) {
    annualGoals.push({
      goal: `Reducir deuda en ${Math.round(Math.min(debt, Math.max(0, monthlySavings) * 12))}€`,
      targetAmount: Math.round(Math.min(debt, Math.max(0, monthlySavings) * 12)),
      deadline: deadline1Year,
      progress: 0,
    });
  }

  annualGoals.push({
    goal: `Alcanzar ${Math.round(projectedSavings1Year)}€ en ahorro acumulado`,
    targetAmount: Math.round(projectedSavings1Year),
    deadline: deadline1Year,
    progress: savings > 0 ? Math.round((savings / projectedSavings1Year) * 100) : 0,
  });

  if (goal === "inversion" || investments > 0) {
    annualGoals.push({
      goal: `Incrementar inversiones un 15% hasta ${Math.round(investments * 1.15)}€`,
      targetAmount: Math.round(investments * 1.15),
      deadline: deadline1Year,
      progress: 0,
    });
  }

  annualGoals.push({
    goal: "Completar revisión financiera trimestral",
    targetAmount: null,
    deadline: deadline3Months,
    progress: 0,
  });

  interface Strategy {
    title: string;
    description: string;
    impact: "alto" | "medio" | "bajo";
    effort: "alto" | "medio" | "bajo";
  }

  const strategies: Strategy[] = [];

  if (savingsRate < 0.1) {
    strategies.push({
      title: "Reducir gastos un 10%",
      description:
        "Identifica las tres categorías de gasto más altas y aplica una reducción del 10% en cada una. El impacto en tu ahorro mensual puede ser significativo.",
      impact: "alto",
      effort: "medio",
    });
  }

  if (debt > 0) {
    strategies.push({
      title: "Liquidar deuda con método avalancha",
      description:
        "Paga mínimos en todas las deudas y destina el excedente a la deuda con mayor interés. Reduce el coste total de financiación.",
      impact: "alto",
      effort: "medio",
    });
  }

  if (investments < savings) {
    strategies.push({
      title: "Invertir parte del ahorro",
      description: `Mueve el ${Math.min(50, Math.round(((savings - investments) / Math.max(savings, 1)) * 100))}% del ahorro acumulado a fondos indexados de bajo coste para superar la inflación.`,
      impact: "alto",
      effort: "bajo",
    });
  }

  strategies.push({
    title: "Fondo de emergencia 3-6 meses",
    description: `Mantén entre ${Math.round(expenses * 3)}€ y ${Math.round(expenses * 6)}€ en una cuenta de alta rentabilidad accesible en todo momento.`,
    impact: "alto",
    effort: "bajo",
  });

  strategies.push({
    title: "Optimizar fiscalidad del ahorro",
    description:
      "Aprovecha planes de pensiones o fondos de inversión con ventajas fiscales para reducir la carga tributaria anual.",
    impact: "medio",
    effort: "bajo",
  });

  const insights: string[] = [
    `Con tu ritmo de ahorro actual alcanzarás ${Math.round(projectedSavings1Year).toLocaleString("es-ES")}€ en 1 año.`,
    monthlySavings > 0
      ? `Ahorras el ${Math.round(savingsRate * 100)}% de tus ingresos. El objetivo recomendado es el 20%.`
      : "Tus gastos superan tus ingresos. Prioridad: reducir gastos o aumentar ingresos.",
    monthsToPayDebt !== null
      ? `Con el 50% de tu ahorro mensual, puedes liquidar tu deuda en ${monthsToPayDebt} meses.`
      : "Sin deuda pendiente. Excelente posición para invertir y hacer crecer tu patrimonio.",
    `En 5 años podrías acumular ${Math.round(projectedSavings5Years).toLocaleString("es-ES")}€ manteniendo el ritmo actual.`,
  ];

  const timeframeMonths: Record<string, number> = {
    "3meses": 3,
    "6meses": 6,
    "1ano": 12,
    "5anos": 60,
  };
  const months = timeframeMonths[timeframe] ?? 12;
  const monthlyToTarget =
    months > 0 ? Math.round(Math.max(0, projectedSavings1Year / months)) : 0;

  return c.json({
    data: {
      plan: {
        monthlyPlan: monthlyPlan.slice(0, 5),
        annualGoals,
        strategies,
        insights,
        projections: {
          oneYear: Math.round(projectedSavings1Year),
          fiveYears: Math.round(projectedSavings5Years),
          monthlyToTarget,
        },
      },
      summary: `Tu plan financiero está orientado a ${goal}. Con disciplina y siguiendo estos pasos, en ${timeframe} habrás mejorado significativamente tu situación.`,
    },
  });
});

// ─── POST /simulador-casa ─────────────────────────────────────────────────────

const simuladorCasaSchema = z.object({
  precio: z.number().min(0),
  entrada: z.number().min(0).max(100),
  interes: z.number().min(0).max(30).default(3.5),
  anos: z.number().int().min(5).max(40).default(30),
  ingresos: z.number().min(0),
  gastos: z.number().min(0).default(0),
});

advancedFinanceRouter.post("/simulador-casa", zValidator("json", simuladorCasaSchema), (c) => {
  const { precio, entrada, interes, anos, ingresos, gastos } = c.req.valid("json");

  const capitalPrestado = precio * (1 - entrada / 100);
  const r = interes / 100 / 12;
  const n = anos * 12;

  let cuotaMensual: number;
  if (r === 0) {
    cuotaMensual = capitalPrestado / n;
  } else {
    cuotaMensual = (capitalPrestado * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  const entradaEuros = precio * (entrada / 100);
  const totalPagado = cuotaMensual * n + entradaEuros;
  const totalIntereses = totalPagado - precio;
  const ingresoNecesario = cuotaMensual * 3;
  const ratioEsfuerzo = ingresos > 0 ? (cuotaMensual / ingresos) * 100 : 100;
  const asequible = ratioEsfuerzo <= 33;

  // Amortization points: 6 checkpoints
  const checkYears = [0, Math.floor(anos / 5), Math.floor(anos / 3), Math.floor(anos / 2), Math.floor((anos * 3) / 4), anos];
  const uniqueYears = [...new Set(checkYears)].filter((y) => y <= anos);

  const amortizationPoints: AmortizationPoint[] = uniqueYears.map((year) => {
    const monthsPaid = year * 12;
    let capitalPendiente: number;
    if (r === 0) {
      capitalPendiente = Math.max(0, capitalPrestado - (capitalPrestado / n) * monthsPaid);
    } else {
      capitalPendiente = Math.max(
        0,
        capitalPrestado * (Math.pow(1 + r, n) - Math.pow(1 + r, monthsPaid)) / (Math.pow(1 + r, n) - 1)
      );
    }
    return {
      year,
      capitalPendiente: Math.round(capitalPendiente),
      capitalAmortizado: Math.round(capitalPrestado - capitalPendiente),
    };
  });

  const advice: string[] = [];
  if (!asequible) {
    advice.push(
      `La cuota mensual de ${Math.round(cuotaMensual)}€ supera el 33% de tus ingresos. Necesitarías ingresos de al menos ${Math.round(ingresoNecesario)}€/mes.`
    );
  } else {
    advice.push(
      `La cuota de ${Math.round(cuotaMensual)}€ representa el ${Math.round(ratioEsfuerzo)}% de tus ingresos. Dentro del límite recomendado del 33%.`
    );
  }
  advice.push(
    `En ${anos} años pagarás ${Math.round(totalIntereses).toLocaleString("es-ES")}€ en intereses adicionales al precio de la vivienda.`
  );
  if (interes > 3.5) {
    advice.push(
      "Con la bajada del Euribor, considera revisar la hipoteca a tipo variable o negociar una mejora del diferencial."
    );
  }
  advice.push(
    `Recuerda añadir gastos de compraventa: ITP/IVA (6-10%), notaría, gestoría y registro (aprox. 2%). Total adicional estimado: ${Math.round(precio * 0.1).toLocaleString("es-ES")}€.`
  );

  return c.json({
    data: {
      cuotaMensual: Math.round(cuotaMensual * 100) / 100,
      totalPagado: Math.round(totalPagado),
      totalIntereses: Math.round(totalIntereses),
      capitalPrestado: Math.round(capitalPrestado),
      ratioEsfuerzo: Math.round(ratioEsfuerzo * 10) / 10,
      asequible,
      ingresoNecesario: Math.round(ingresoNecesario),
      amortizationPoints,
      advice,
    },
  });
});

// ─── POST /alquilar-vs-comprar ────────────────────────────────────────────────

const alquilarVsComprarSchema = z.object({
  precioVivienda: z.number().min(0),
  alquilerMensual: z.number().min(0),
  entrada: z.number().min(0).max(100).default(20),
  interes: z.number().min(0).max(30).default(3.5),
  anos: z.number().int().min(5).max(40).default(30),
  revalorizacion: z.number().min(-10).max(20).default(3),
  inflacionAlquiler: z.number().min(0).max(20).default(4),
  rentabilidadAlternativa: z.number().min(0).max(30).default(5),
});

advancedFinanceRouter.post(
  "/alquilar-vs-comprar",
  zValidator("json", alquilarVsComprarSchema),
  (c) => {
    const {
      precioVivienda,
      alquilerMensual,
      entrada: entradaPct,
      interes,
      anos,
      revalorizacion,
      inflacionAlquiler,
      rentabilidadAlternativa,
    } = c.req.valid("json");

    const entradaEuros = precioVivienda * (entradaPct / 100);
    const capitalPrestado = precioVivienda - entradaEuros;
    const r = interes / 100 / 12;
    const n = anos * 12;

    let cuotaMensual: number;
    if (r === 0) {
      cuotaMensual = capitalPrestado / n;
    } else {
      cuotaMensual = (capitalPrestado * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const maintenanceMonthly = (precioVivienda * 0.005) / 12;

    // Year-by-year simulation
    let costAcumCompra = entradaEuros; // initial outflow
    let costAcumAlquiler = 0;
    let currentRent = alquilerMensual;
    let investedDownPayment = entradaEuros;
    let capitalPendiente = capitalPrestado;

    let breakEvenYear: number | null = null;

    const checkpoints = new Set([0, 5, 10, 15, 20, 25, 30].filter((y) => y <= anos));
    checkpoints.add(anos);

    const yearlyComparison: YearlyComparison[] = [];

    for (let year = 0; year <= anos; year++) {
      // Compute property value
      const propertyValue = precioVivienda * Math.pow(1 + revalorizacion / 100, year);
      const patrimonioCompra = propertyValue - capitalPendiente;

      // Portfolio value (renter invests down payment)
      const patrimonioAlquiler = investedDownPayment;

      if (checkpoints.has(year)) {
        yearlyComparison.push({
          year,
          costAcumuladoCompra: Math.round(costAcumCompra),
          costAcumuladoAlquiler: Math.round(costAcumAlquiler),
          patrimonioCompra: Math.round(patrimonioCompra),
          patrimonioAlquiler: Math.round(patrimonioAlquiler),
        });
      }

      // Break-even: buying patrimony exceeds renting patrimony and buyer has paid less net
      if (
        breakEvenYear === null &&
        year > 0 &&
        patrimonioCompra > patrimonioAlquiler &&
        costAcumCompra < costAcumAlquiler + patrimonioAlquiler
      ) {
        breakEvenYear = year;
      }

      if (year < anos) {
        // Advance one year
        for (let m = 0; m < 12; m++) {
          // Mortgage payment
          const interestPayment = capitalPendiente * r;
          const principalPayment = Math.max(0, cuotaMensual - interestPayment);
          capitalPendiente = Math.max(0, capitalPendiente - principalPayment);

          costAcumCompra += cuotaMensual + maintenanceMonthly;
          costAcumAlquiler += currentRent;
        }

        // Annual rent increase
        currentRent *= 1 + inflacionAlquiler / 100;

        // Investment growth
        investedDownPayment *= 1 + rentabilidadAlternativa / 100;
      }
    }

    const finalPropertyValue = precioVivienda * Math.pow(1 + revalorizacion / 100, anos);
    const patrimonioCompraFinal = finalPropertyValue - Math.max(0, capitalPendiente);
    const patrimonioAlquilerFinal = investedDownPayment;

    let recommendation: "comprar" | "alquilar" | "depende";
    const advantage = patrimonioCompraFinal - patrimonioAlquilerFinal;
    if (advantage > precioVivienda * 0.1) {
      recommendation = "comprar";
    } else if (advantage < -precioVivienda * 0.1) {
      recommendation = "alquilar";
    } else {
      recommendation = "depende";
    }

    const advice: string[] = [];
    if (recommendation === "comprar") {
      advice.push(
        `Comprar es más ventajoso en tu caso. A los ${anos} años el patrimonio inmobiliario supera en ${Math.round(advantage).toLocaleString("es-ES")}€ al del inversor en bolsa.`
      );
    } else if (recommendation === "alquilar") {
      advice.push(
        `Alquilar e invertir la entrada puede ser más rentable. El inversor acumula ${Math.round(-advantage).toLocaleString("es-ES")}€ más en ${anos} años.`
      );
    } else {
      advice.push(
        "La diferencia entre comprar y alquilar es pequeña. Tu decisión debe basarse en estabilidad, flexibilidad y preferencia personal."
      );
    }

    if (breakEvenYear !== null) {
      advice.push(
        `El punto de equilibrio financiero se alcanza aproximadamente en el año ${breakEvenYear}.`
      );
    } else {
      advice.push(
        "Con estos parámetros, alquilar mantiene ventaja financiera durante todo el periodo analizado."
      );
    }

    advice.push(
      `Recuerda: comprar aporta estabilidad y un activo tangible; alquilar da flexibilidad y liquidez. No todo es rentabilidad.`
    );

    return c.json({
      data: {
        recommendation,
        breakEvenYear,
        costeTotalCompra: Math.round(costAcumCompra),
        costeTotalAlquiler: Math.round(costAcumAlquiler),
        patrimonioCompra: Math.round(patrimonioCompraFinal),
        patrimonioAlquiler: Math.round(patrimonioAlquilerFinal),
        yearlyComparison,
        advice,
      },
    });
  }
);

export default advancedFinanceRouter;
