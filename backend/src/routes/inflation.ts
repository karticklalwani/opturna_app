import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const inflationRouter = new Hono();

// ─── Types ───────────────────────────────────────────────────────────────────

interface InflationMetric {
  current: number;
  previous: number;
  trend: "up" | "down" | "stable";
}

interface CountryInflation {
  code: string;
  name: string;
  rate: number;
  flag: string;
  trend: "up" | "down" | "stable";
  region: string;
}

interface HistoricalPoint {
  year: number;
  spain: number;
  eurozone: number;
  world: number;
}

interface InflationData {
  spain: InflationMetric;
  eurozone: InflationMetric;
  world: InflationMetric;
  food: InflationMetric;
  byCategory: {
    alimentos: number;
    transporte: number;
    vivienda: number;
    energia: number;
    educacion: number;
    salud: number;
  };
  countries: CountryInflation[];
  historical: HistoricalPoint[];
  lastUpdated: string;
}

// ─── In-Memory Cache ─────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Fallback / Static Data ──────────────────────────────────────────────────

const FALLBACK_SPAIN: InflationMetric = { current: 3.4, previous: 3.6, trend: "down" };
const FALLBACK_EUROZONE: InflationMetric = { current: 2.6, previous: 2.8, trend: "down" };
const FALLBACK_WORLD: InflationMetric = { current: 5.8, previous: 6.5, trend: "down" };
const FALLBACK_FOOD: InflationMetric = { current: 6.2, previous: 7.1, trend: "down" };

const FALLBACK_BY_CATEGORY = {
  alimentos: 5.8,
  transporte: 2.1,
  vivienda: 4.2,
  energia: -3.5,
  educacion: 2.8,
  salud: 3.1,
};

const HISTORICAL_DATA: HistoricalPoint[] = [
  { year: 2015, spain: -0.5, eurozone: 0.0, world: 2.7 },
  { year: 2016, spain: -0.2, eurozone: 0.2, world: 2.8 },
  { year: 2017, spain: 2.0, eurozone: 1.5, world: 3.2 },
  { year: 2018, spain: 1.7, eurozone: 1.8, world: 3.6 },
  { year: 2019, spain: 0.8, eurozone: 1.2, world: 3.5 },
  { year: 2020, spain: -0.3, eurozone: 0.3, world: 3.2 },
  { year: 2021, spain: 3.1, eurozone: 2.6, world: 4.7 },
  { year: 2022, spain: 8.4, eurozone: 8.4, world: 8.8 },
  { year: 2023, spain: 3.5, eurozone: 5.4, world: 6.8 },
  { year: 2024, spain: 3.4, eurozone: 2.6, world: 5.8 },
];

const COUNTRIES_DATA: CountryInflation[] = [
  // Europa
  { code: "ES", name: "España", rate: 3.4, flag: "🇪🇸", trend: "down", region: "Europa" },
  { code: "DE", name: "Alemania", rate: 2.9, flag: "🇩🇪", trend: "down", region: "Europa" },
  { code: "FR", name: "Francia", rate: 2.3, flag: "🇫🇷", trend: "down", region: "Europa" },
  { code: "IT", name: "Italia", rate: 1.8, flag: "🇮🇹", trend: "down", region: "Europa" },
  { code: "PT", name: "Portugal", rate: 2.4, flag: "🇵🇹", trend: "down", region: "Europa" },
  { code: "NL", name: "Países Bajos", rate: 2.7, flag: "🇳🇱", trend: "stable", region: "Europa" },
  { code: "BE", name: "Bélgica", rate: 3.1, flag: "🇧🇪", trend: "down", region: "Europa" },
  { code: "GR", name: "Grecia", rate: 2.8, flag: "🇬🇷", trend: "down", region: "Europa" },
  { code: "PL", name: "Polonia", rate: 5.2, flag: "🇵🇱", trend: "down", region: "Europa" },
  { code: "GB", name: "Reino Unido", rate: 4.0, flag: "🇬🇧", trend: "down", region: "Europa" },
  { code: "CH", name: "Suiza", rate: 1.4, flag: "🇨🇭", trend: "stable", region: "Europa" },
  { code: "SE", name: "Suecia", rate: 2.2, flag: "🇸🇪", trend: "down", region: "Europa" },
  // América
  { code: "US", name: "Estados Unidos", rate: 3.1, flag: "🇺🇸", trend: "down", region: "América" },
  { code: "MX", name: "México", rate: 4.6, flag: "🇲🇽", trend: "down", region: "América" },
  { code: "BR", name: "Brasil", rate: 4.5, flag: "🇧🇷", trend: "stable", region: "América" },
  { code: "AR", name: "Argentina", rate: 211.0, flag: "🇦🇷", trend: "down", region: "América" },
  { code: "CL", name: "Chile", rate: 3.9, flag: "🇨🇱", trend: "down", region: "América" },
  { code: "CO", name: "Colombia", rate: 7.2, flag: "🇨🇴", trend: "down", region: "América" },
  { code: "PE", name: "Perú", rate: 3.0, flag: "🇵🇪", trend: "down", region: "América" },
  { code: "CA", name: "Canadá", rate: 2.8, flag: "🇨🇦", trend: "down", region: "América" },
  // Asia
  { code: "CN", name: "China", rate: 0.2, flag: "🇨🇳", trend: "down", region: "Asia" },
  { code: "JP", name: "Japón", rate: 2.8, flag: "🇯🇵", trend: "up", region: "Asia" },
  { code: "IN", name: "India", rate: 5.1, flag: "🇮🇳", trend: "stable", region: "Asia" },
  { code: "KR", name: "Corea del Sur", rate: 3.2, flag: "🇰🇷", trend: "down", region: "Asia" },
  { code: "TR", name: "Turquía", rate: 61.5, flag: "🇹🇷", trend: "down", region: "Asia" },
  { code: "SA", name: "Arabia Saudí", rate: 1.6, flag: "🇸🇦", trend: "stable", region: "Asia" },
  // África
  { code: "ZA", name: "Sudáfrica", rate: 5.3, flag: "🇿🇦", trend: "stable", region: "África" },
  { code: "NG", name: "Nigeria", rate: 28.9, flag: "🇳🇬", trend: "up", region: "África" },
  { code: "EG", name: "Egipto", rate: 35.7, flag: "🇪🇬", trend: "up", region: "África" },
  // Oceanía
  { code: "AU", name: "Australia", rate: 3.4, flag: "🇦🇺", trend: "down", region: "Oceanía" },
  { code: "NZ", name: "Nueva Zelanda", rate: 3.3, flag: "🇳🇿", trend: "down", region: "Oceanía" },
];

// ─── API Fetchers ────────────────────────────────────────────────────────────

function determineTrend(current: number, previous: number): "up" | "down" | "stable" {
  const diff = current - previous;
  if (Math.abs(diff) < 0.15) return "stable";
  return diff > 0 ? "up" : "down";
}

async function fetchSpainINE(): Promise<InflationMetric | null> {
  try {
    const res = await fetch("https://servicios.ine.es/wstempus/js/es/DATOS_TABLA/50902", {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{
      Nombre: string;
      Data: Array<{ Valor: number; Fecha: number }>;
    }>;
    if (!Array.isArray(json) || json.length === 0) return null;

    // Find the "Índice general" series or use the first one
    const generalSeries =
      json.find((s) => s.Nombre?.toLowerCase().includes("general")) ?? json[0];
    if (!generalSeries?.Data || generalSeries.Data.length < 2) return null;

    // Data is sorted by date desc typically
    const sorted = [...generalSeries.Data].sort((a, b) => b.Fecha - a.Fecha);
    const current = sorted[0]?.Valor ?? 0;
    const previous = sorted[1]?.Valor ?? 0;

    return { current: parseFloat(current.toFixed(1)), previous: parseFloat(previous.toFixed(1)), trend: determineTrend(current, previous) };
  } catch {
    return null;
  }
}

async function fetchEurostat(): Promise<InflationMetric | null> {
  try {
    const res = await fetch(
      "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr?geo=EA&coicop=CP00&format=JSON",
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      value: Record<string, number>;
      dimension: { time: { category: { index: Record<string, number> } } };
    };
    if (!json?.value) return null;

    const timeIndex = json.dimension?.time?.category?.index ?? {};
    const timeKeys = Object.keys(timeIndex).sort();
    if (timeKeys.length < 2) return null;

    const latestKey = timeKeys[timeKeys.length - 1]!;
    const prevKey = timeKeys[timeKeys.length - 2]!;
    const latestIdx = timeIndex[latestKey];
    const prevIdx = timeIndex[prevKey];

    const current = json.value[String(latestIdx)] ?? 0;
    const previous = json.value[String(prevIdx)] ?? 0;

    return {
      current: parseFloat(current.toFixed(1)),
      previous: parseFloat(previous.toFixed(1)),
      trend: determineTrend(current, previous),
    };
  } catch {
    return null;
  }
}

async function fetchWorldBank(
  indicator: string
): Promise<{ metric: InflationMetric; countries: CountryInflation[] } | null> {
  try {
    const res = await fetch(
      `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=300&date=2023`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as [unknown, Array<{ country: { id: string; value: string }; value: number | null }>];
    if (!Array.isArray(json) || !Array.isArray(json[1])) return null;

    const entries = json[1].filter((e) => e.value !== null && e.value !== undefined);
    // World aggregate
    const worldEntry = entries.find((e) => e.country.id === "WLD");
    const currentVal = worldEntry?.value ?? 0;

    return {
      metric: {
        current: parseFloat(currentVal.toFixed(1)),
        previous: parseFloat((currentVal + 0.7).toFixed(1)),
        trend: "down",
      },
      countries: [],
    };
  } catch {
    return null;
  }
}

// ─── GET /real-time ──────────────────────────────────────────────────────────

inflationRouter.get("/real-time", async (c) => {
  const cached = getCached<InflationData>("inflation-realtime");
  if (cached) {
    return c.json({ data: cached });
  }

  // Fetch all sources in parallel with fallbacks
  const [spainResult, eurozoneResult, worldResult, foodResult] = await Promise.all([
    fetchSpainINE(),
    fetchEurostat(),
    fetchWorldBank("FP.CPI.TOTL.ZG"),
    fetchWorldBank("FP.CPI.FOOD.ZG"),
  ]);

  const result: InflationData = {
    spain: spainResult ?? FALLBACK_SPAIN,
    eurozone: eurozoneResult ?? FALLBACK_EUROZONE,
    world: worldResult?.metric ?? FALLBACK_WORLD,
    food: foodResult?.metric ?? FALLBACK_FOOD,
    byCategory: FALLBACK_BY_CATEGORY,
    countries: COUNTRIES_DATA,
    historical: HISTORICAL_DATA,
    lastUpdated: new Date().toISOString(),
  };

  setCache("inflation-realtime", result);
  return c.json({ data: result });
});

// ─── POST /simulate ──────────────────────────────────────────────────────────

const simulateSchema = z.object({
  savings: z.number().min(0),
  inflationRate: z.number().min(0).max(100),
  years: z.number().int().min(1).max(50),
  investmentReturn: z.number().min(0).max(100).optional(),
  country: z.string().optional(),
});

interface SimulationYearPoint {
  year: number;
  nominalValue: number;
  realValue: number;
  inflationLoss: number;
  investmentValue: number | null;
}

inflationRouter.post("/simulate", zValidator("json", simulateSchema), (c) => {
  const { savings, inflationRate, years, investmentReturn } = c.req.valid("json");

  const inflationDecimal = inflationRate / 100;
  const investReturnDecimal = investmentReturn ? investmentReturn / 100 : null;

  const chartData: SimulationYearPoint[] = [];

  for (let y = 0; y <= years; y++) {
    const realValue = savings / Math.pow(1 + inflationDecimal, y);
    const inflationLoss = savings - realValue;
    const investmentValue = investReturnDecimal !== null
      ? savings * Math.pow(1 + investReturnDecimal, y)
      : null;

    chartData.push({
      year: y,
      nominalValue: savings,
      realValue: parseFloat(realValue.toFixed(2)),
      inflationLoss: parseFloat(inflationLoss.toFixed(2)),
      investmentValue: investmentValue !== null ? parseFloat(investmentValue.toFixed(2)) : null,
    });
  }

  const finalReal = chartData[chartData.length - 1]!;

  const summary = {
    initialSavings: savings,
    inflationRate,
    years,
    futureNominalValue: savings,
    futureRealValue: finalReal.realValue,
    totalInflationLoss: finalReal.inflationLoss,
    purchasingPowerLostPct: parseFloat(((finalReal.inflationLoss / savings) * 100).toFixed(1)),
    investmentReturn: investmentReturn ?? null,
    investmentFinalValue: finalReal.investmentValue,
    investmentGain: finalReal.investmentValue !== null
      ? parseFloat((finalReal.investmentValue - savings).toFixed(2))
      : null,
    investmentVsInflation: finalReal.investmentValue !== null
      ? parseFloat((finalReal.investmentValue - finalReal.realValue).toFixed(2))
      : null,
    message: `En ${years} años, tus ${savings.toLocaleString("es-ES")}€ tendrán un poder adquisitivo de ${finalReal.realValue.toLocaleString("es-ES")}€. Perderás ${finalReal.inflationLoss.toLocaleString("es-ES")}€ en poder de compra.`,
  };

  return c.json({ data: { summary, chartData } });
});

// ─── POST /pignorar ──────────────────────────────────────────────────────────

const pignorarSchema = z.object({
  balance: z.number().min(0),
  pledgeAmount: z.number().min(0),
  ltvRatio: z.number().min(0.1).max(0.95).optional().default(0.8),
  annualCost: z.number().min(0).max(50).optional().default(2.5),
  inflationRate: z.number().min(0).max(100).optional().default(3.0),
  years: z.number().int().min(1).max(30).optional().default(5),
});

inflationRouter.post("/pignorar", zValidator("json", pignorarSchema), (c) => {
  const { balance, pledgeAmount, ltvRatio, annualCost, inflationRate, years } = c.req.valid("json");

  const effectivePledge = Math.min(pledgeAmount, balance);
  const liquidityObtained = parseFloat((effectivePledge * ltvRatio).toFixed(2));
  const annualCostDecimal = annualCost / 100;
  const annualCostAmount = parseFloat((effectivePledge * annualCostDecimal).toFixed(2));
  const totalCost = parseFloat((annualCostAmount * years).toFixed(2));
  const inflationDecimal = inflationRate / 100;

  // Compare scenarios
  const sellingScenario = {
    method: "Vender activos",
    liquidityObtained: effectivePledge,
    costOverYears: 0,
    netResult: effectivePledge,
    description: "Obtienes el 100% pero pierdes los activos y su potencial revalorización.",
  };

  const traditionalLoanRate = 7.5;
  const traditionalLoanCost = parseFloat(
    (liquidityObtained * (traditionalLoanRate / 100) * years).toFixed(2)
  );
  const traditionalLoanScenario = {
    method: "Préstamo tradicional",
    liquidityObtained,
    costOverYears: traditionalLoanCost,
    netResult: parseFloat((liquidityObtained - traditionalLoanCost).toFixed(2)),
    description: `Préstamo personal al ${traditionalLoanRate}% TAE. Mayor coste y posible impacto en scoring crediticio.`,
  };

  const pignorarScenario = {
    method: "Pignorar",
    liquidityObtained,
    costOverYears: totalCost,
    netResult: parseFloat((liquidityObtained - totalCost).toFixed(2)),
    description: `Obtienes liquidez al ${annualCost}% anual manteniendo tus activos.`,
  };

  // Inflation impact on pledged assets
  const assetFutureValue = parseFloat(
    (effectivePledge * Math.pow(1 + inflationDecimal, years)).toFixed(2)
  );
  const assetAppreciation = parseFloat((assetFutureValue - effectivePledge).toFixed(2));

  // Risk assessment
  let riskLevel: "bajo" | "medio" | "alto";
  let riskDescription: string;
  if (ltvRatio <= 0.5) {
    riskLevel = "bajo";
    riskDescription = "Ratio LTV conservador. Amplio margen antes de margin call.";
  } else if (ltvRatio <= 0.75) {
    riskLevel = "medio";
    riskDescription = "Ratio LTV moderado. Monitorizar regularmente el valor de los activos.";
  } else {
    riskLevel = "alto";
    riskDescription = "Ratio LTV agresivo. Riesgo elevado de margin call si los activos bajan de valor.";
  }

  return c.json({
    data: {
      pledgeDetails: {
        pledgedAmount: effectivePledge,
        ltvRatio,
        liquidityObtained,
        annualCostPct: annualCost,
        annualCostAmount,
        totalCostOverYears: totalCost,
        years,
      },
      comparison: [pignorarScenario, sellingScenario, traditionalLoanScenario],
      inflationImpact: {
        currentAssetValue: effectivePledge,
        futureAssetValue: assetFutureValue,
        assetAppreciation,
        inflationRate,
        message: `Si tus activos crecen al ritmo de la inflación (${inflationRate}%), en ${years} años valdrán ${assetFutureValue.toLocaleString("es-ES")}€, una ganancia de ${assetAppreciation.toLocaleString("es-ES")}€ que no perderías al pignorar en vez de vender.`,
      },
      risk: {
        level: riskLevel,
        description: riskDescription,
        marginCallThreshold: parseFloat(
          (liquidityObtained / 0.95).toFixed(2)
        ),
      },
    },
  });
});

// ─── POST /patrimonio ────────────────────────────────────────────────────────

const patrimonioSchema = z.object({
  income: z.number().min(0),
  expenses: z.number().min(0),
  savings: z.number().min(0),
  investments: z.number().min(0),
  debt: z.number().min(0),
  pledged: z.number().min(0),
});

inflationRouter.post("/patrimonio", zValidator("json", patrimonioSchema), (c) => {
  const { income, expenses, savings, investments, debt, pledged } = c.req.valid("json");

  const monthlySavings = income - expenses;
  const savingsRate = income > 0 ? parseFloat(((monthlySavings / income) * 100).toFixed(1)) : 0;
  const debtToIncomeRatio = income > 0 ? parseFloat(((debt / (income * 12)) * 100).toFixed(1)) : 0;
  const emergencyFundMonths = expenses > 0 ? parseFloat((savings / expenses).toFixed(1)) : 0;
  const totalPatrimonio = savings + investments + pledged - debt;
  const inflationExposure = parseFloat(
    (((savings) / Math.max(totalPatrimonio, 1)) * 100).toFixed(1)
  );

  // Financial health score (0-100)
  let score = 50;

  // Savings rate impact (+/- 15 points)
  if (savingsRate >= 20) score += 15;
  else if (savingsRate >= 10) score += 8;
  else if (savingsRate >= 0) score += 0;
  else score -= 15;

  // Emergency fund impact (+/- 15 points)
  if (emergencyFundMonths >= 6) score += 15;
  else if (emergencyFundMonths >= 3) score += 8;
  else score -= 10;

  // Debt ratio impact (+/- 10 points)
  if (debtToIncomeRatio <= 20) score += 10;
  else if (debtToIncomeRatio <= 40) score += 0;
  else score -= 10;

  // Investment diversification (+/- 10 points)
  if (investments > 0) score += 10;
  if (pledged > 0) score += 5; // Using pignorar = financially savvy

  // Clamp
  score = Math.max(0, Math.min(100, score));

  let riskLevel: "bajo" | "medio" | "alto" | "muy alto";
  if (score >= 75) riskLevel = "bajo";
  else if (score >= 50) riskLevel = "medio";
  else if (score >= 25) riskLevel = "alto";
  else riskLevel = "muy alto";

  // Recommendations
  const recommendations: string[] = [];

  if (savingsRate < 10) {
    recommendations.push("Intenta ahorrar al menos un 10% de tus ingresos mensuales. Revisa gastos no esenciales.");
  }
  if (emergencyFundMonths < 6) {
    recommendations.push(`Tu fondo de emergencia cubre ${emergencyFundMonths} meses. Objetivo: 6 meses de gastos.`);
  }
  if (debtToIncomeRatio > 30) {
    recommendations.push("Tu ratio de deuda es elevado. Prioriza reducir deudas de alto interés.");
  }
  if (inflationExposure > 60) {
    recommendations.push("Tienes mucho efectivo expuesto a la inflación. Considera diversificar en inversiones.");
  }
  if (investments === 0) {
    recommendations.push("No tienes inversiones. Considera fondos indexados o ETFs para proteger tu patrimonio.");
  }
  if (pledged === 0 && investments > 0) {
    recommendations.push("Podrías considerar pignorar parte de tus inversiones para obtener liquidez sin vender.");
  }
  if (monthlySavings > 0 && investments === 0) {
    recommendations.push("Tienes capacidad de ahorro. Automatiza transferencias mensuales a una cartera de inversión.");
  }
  if (score >= 75) {
    recommendations.push("Tu salud financiera es excelente. Mantén tu disciplina y considera optimización fiscal.");
  }

  const monthlyPlan = {
    savingsTarget: parseFloat((income * 0.2).toFixed(2)),
    investmentTarget: parseFloat((income * 0.1).toFixed(2)),
    emergencyTarget: parseFloat((expenses * 6).toFixed(2)),
    debtPaymentTarget: debt > 0 ? parseFloat((debt / 12).toFixed(2)) : 0,
  };

  const yearlyPlan = {
    savingsTarget: parseFloat((income * 12 * 0.2).toFixed(2)),
    investmentTarget: parseFloat((income * 12 * 0.1).toFixed(2)),
    projectedPatrimonio: parseFloat(
      (totalPatrimonio + monthlySavings * 12).toFixed(2)
    ),
    inflationLoss: parseFloat((savings * 0.034).toFixed(2)),
  };

  return c.json({
    data: {
      score,
      riskLevel,
      metrics: {
        totalPatrimonio: parseFloat(totalPatrimonio.toFixed(2)),
        monthlySavings: parseFloat(monthlySavings.toFixed(2)),
        savingsRate,
        debtToIncomeRatio,
        emergencyFundMonths,
        inflationExposure,
      },
      monthlyPlan,
      yearlyPlan,
      recommendations,
    },
  });
});

// ─── POST /ai-advisor ────────────────────────────────────────────────────────

const aiAdvisorSchema = z.object({
  question: z.string().min(1).max(1000),
  context: z.object({
    savings: z.number().optional(),
    investments: z.number().optional(),
    debt: z.number().optional(),
  }).optional(),
});

const KNOWLEDGE_BASE: Record<string, string> = {
  "pignorar": `**¿Qué es pignorar?**

Pignorar significa ofrecer un activo financiero (acciones, fondos, bonos, criptomonedas) como garantía para obtener un préstamo, sin necesidad de vender esos activos.

**Ventajas:**
• Obtienes liquidez inmediata sin vender tus inversiones
• Mantienes la exposición al mercado y posibles revalorizaciones
• Costes generalmente inferiores a préstamos personales (1-4% vs 7-15%)
• No generas un evento fiscal (no pagas impuestos por plusvalías)
• Proceso rápido, generalmente 24-48 horas

**Desventajas:**
• Riesgo de margin call si el valor de los activos cae significativamente
• Necesitas mantener un ratio LTV (Loan-to-Value) adecuado
• Los activos pignorados no pueden venderse hasta devolver el préstamo
• Coste de intereses aunque sea bajo

**¿Cuándo usar pignorar?**
• Cuando necesitas liquidez temporal pero crees que tus activos se revalorizarán
• Para evitar vender en un momento de mercado bajo
• Para financiar una oportunidad sin deshacer tu cartera
• Cuando el coste del préstamo es menor que la rentabilidad esperada de tus activos`,

  "inflacion": `**Estrategias contra la inflación:**

1. **Inversión en activos reales**: Inmobiliario, materias primas y oro históricamente protegen contra la inflación.

2. **Renta variable**: Las acciones de empresas con poder de fijación de precios tienden a superar la inflación a largo plazo.

3. **Bonos indexados a la inflación**: Los bonos ligados al IPC (como los TIPS en EEUU o bonos indexados del Tesoro) ajustan su valor con la inflación.

4. **Diversificación geográfica**: Invertir en diferentes países reduce el impacto de la inflación local.

5. **Reducir efectivo ocioso**: El dinero en cuenta corriente pierde valor cada día. Mantén solo lo necesario para emergencias.

6. **Pignorar vs. vender**: En entornos inflacionarios, pignorar permite mantener activos que se revalorizan mientras obtienes liquidez.

7. **Revisar periódicamente**: Ajusta tu estrategia cada 6-12 meses según el entorno económico.`,

  "planificacion": `**Planificación financiera básica:**

1. **Fondo de emergencia**: Ahorra 3-6 meses de gastos en una cuenta de alta remuneración.

2. **Regla 50/30/20**: 50% necesidades, 30% deseos, 20% ahorro e inversión.

3. **Elimina deuda cara**: Prioriza pagar deudas con interés superior al 5%.

4. **Automatiza**: Configura transferencias automáticas el día de cobro.

5. **Diversifica inversiones**: No pongas todos los huevos en la misma cesta.

6. **Revisa seguros**: Asegúrate de tener cobertura adecuada sin pagar de más.

7. **Planifica fiscalmente**: Aprovecha deducciones y vehículos de inversión eficientes fiscalmente (planes de pensiones, etc.).`,

  "prestamos": `**Pignorar vs. Préstamos tradicionales:**

| Aspecto | Pignorar | Préstamo personal |
|---------|----------|-------------------|
| Interés | 1-4% anual | 7-15% anual |
| Garantía | Activos financieros | Solvencia personal |
| Plazo | Flexible | Fijo |
| Aprobación | Rápida (24-48h) | Lenta (días-semanas) |
| Impacto fiscal | Ninguno | Ninguno |
| Riesgo | Margin call | Impago |
| Activos | Los mantienes | No aplica |

**¿Cuándo elegir pignorar?** Cuando tienes activos financieros y quieres mantenerlos.
**¿Cuándo elegir préstamo?** Cuando no tienes activos para pignorar o el importe es pequeño.`,

  "vender": `**Pignorar vs. Vender activos:**

**Vender:**
• Obtienes el 100% del valor
• Generas un evento fiscal (pagas impuestos sobre plusvalías, 19-26% en España)
• Pierdes exposición al mercado
• Sin costes futuros
• Irreversible en cuanto al precio

**Pignorar:**
• Obtienes 50-80% del valor como liquidez
• Sin evento fiscal
• Mantienes la propiedad y exposición al mercado
• Coste anual de 1-4%
• Reversible: devuelves el préstamo y recuperas tus activos

**Ejemplo práctico:**
Si tienes 100.000€ en acciones con 30.000€ de plusvalía:
- Vender: pagas ~6.600€ en impuestos, recibes ~93.400€
- Pignorar al 70% LTV: obtienes 70.000€, pagas ~2.100€/año de interés, mantienes las acciones`,
};

function findBestResponse(question: string, context?: { savings?: number; investments?: number; debt?: number }): string {
  const q = question.toLowerCase();

  // Check knowledge base
  if (q.includes("pignorar") || q.includes("pignor") || q.includes("pledge") || q.includes("colateral") || q.includes("garantía")) {
    return KNOWLEDGE_BASE["pignorar"]!;
  }
  if (q.includes("inflaci") || q.includes("ipc") || q.includes("precio")) {
    return KNOWLEDGE_BASE["inflacion"]!;
  }
  if (q.includes("préstamo") || q.includes("prestamo") || q.includes("crédito") || q.includes("credito") || q.includes("loan")) {
    return KNOWLEDGE_BASE["prestamos"]!;
  }
  if (q.includes("vender") || q.includes("venta") || q.includes("sell")) {
    return KNOWLEDGE_BASE["vender"]!;
  }
  if (q.includes("planific") || q.includes("ahorro") || q.includes("presupuesto") || q.includes("plan financiero")) {
    return KNOWLEDGE_BASE["planificacion"]!;
  }

  // Context-aware responses
  if (context) {
    const parts: string[] = [];
    if (context.savings !== undefined && context.investments !== undefined) {
      const total = context.savings + context.investments;
      const cashPct = total > 0 ? ((context.savings / total) * 100).toFixed(0) : "0";
      parts.push(`Tienes un ${cashPct}% de tu patrimonio en efectivo.`);
      if (Number(cashPct) > 50) {
        parts.push("Considera mover parte a inversiones para protegerte de la inflación.");
      }
    }
    if (context.debt !== undefined && context.debt > 0) {
      parts.push(`Con ${context.debt.toLocaleString("es-ES")}€ de deuda, prioriza reducirla si el interés supera el 5%.`);
    }
    if (parts.length > 0) {
      return `Basándome en tu situación financiera:\n\n${parts.join("\n")}\n\n${KNOWLEDGE_BASE["planificacion"]}`;
    }
  }

  // Default
  return `Soy tu asesor financiero virtual. Puedo ayudarte con:\n\n• **Pignorar**: Qué es, ventajas, desventajas y cuándo usarlo\n• **Inflación**: Estrategias para proteger tu dinero\n• **Préstamos**: Comparativa de opciones de financiación\n• **Vender vs. Pignorar**: Cuándo conviene cada opción\n• **Planificación financiera**: Consejos para organizar tus finanzas\n\nHaz tu pregunta sobre cualquiera de estos temas.`;
}

inflationRouter.post("/ai-advisor", zValidator("json", aiAdvisorSchema), async (c) => {
  const { question, context } = c.req.valid("json");
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: openaiKey });

      const systemPrompt = `Eres un asesor financiero experto español especializado en pignoración de activos, inflación y planificación financiera.
Responde siempre en español. Sé conciso pero informativo.
Usa datos reales cuando sea posible. No des consejos de inversión específicos, sino educación financiera general.
Si el usuario proporciona contexto financiero, personaliza tu respuesta.`;

      let userContent = question;
      if (context) {
        userContent += `\n\nContexto financiero del usuario: ${JSON.stringify(context)}`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content ?? findBestResponse(question, context);

      return c.json({
        data: {
          response,
          source: "ai" as const,
          disclaimer: "Esta información es educativa y no constituye asesoramiento financiero profesional.",
        },
      });
    } catch {
      // Fall through to rule-based
    }
  }

  // Rule-based fallback
  const response = findBestResponse(question, context);
  return c.json({
    data: {
      response,
      source: "knowledge-base" as const,
      disclaimer: "Esta información es educativa y no constituye asesoramiento financiero profesional.",
    },
  });
});

// ─── GET /countries ──────────────────────────────────────────────────────────

inflationRouter.get("/countries", (c) => {
  const byRegion: Record<string, CountryInflation[]> = {};
  for (const country of COUNTRIES_DATA) {
    if (!byRegion[country.region]) {
      byRegion[country.region] = [];
    }
    byRegion[country.region]!.push(country);
  }

  // Sort each region by rate descending
  for (const region of Object.keys(byRegion)) {
    byRegion[region]!.sort((a, b) => b.rate - a.rate);
  }

  return c.json({
    data: {
      countries: COUNTRIES_DATA,
      byRegion,
      total: COUNTRIES_DATA.length,
      averageGlobal: parseFloat(
        (COUNTRIES_DATA.reduce((sum, c) => sum + c.rate, 0) / COUNTRIES_DATA.length).toFixed(1)
      ),
    },
  });
});

export default inflationRouter;
