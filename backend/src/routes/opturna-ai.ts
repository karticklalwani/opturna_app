import { Hono } from "hono";
import OpenAI from "openai";
import { z } from "zod";
import { prisma } from "../prisma";

type Variables = {
  user: { id: string; name: string; email: string } | null;
  session: unknown | null;
};

const opturnaAI = new Hono<{ Variables: Variables }>();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Intent Detection ─────────────────────────────────────────────────────────

type Intent =
  | "finances"
  | "savings"
  | "investment"
  | "business"
  | "fiscal"
  | "productivity"
  | "discover"
  | "collaborations"
  | "liquidity"
  | "general";

async function detectIntent(query: string): Promise<Intent> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Classify the user's query into exactly one of these intents: finances, savings, investment, business, fiscal, productivity, discover, collaborations, liquidity, general.

Rules:
- finances: income, expenses, budget, personal cash flow
- savings: saving money, emergency fund, compound interest
- investment: stocks, crypto, real estate, portfolio, assets
- business: business ideas, startup, monetization, entrepreneurship
- fiscal: taxes, deductions, tax optimization, declaración
- productivity: habits, goals, time management, discipline
- discover: trends, news, market discovery
- collaborations: partnerships, collaborations, joint ventures
- liquidity: need money urgently, pledging assets, pignoration, access to capital
- general: anything else

Respond with ONLY the intent word, nothing else.`,
      },
      { role: "user", content: query },
    ],
    max_tokens: 10,
    temperature: 0,
  });

  const detected = response.choices[0]?.message.content
    ?.trim()
    .toLowerCase() as Intent;
  const validIntents: Intent[] = [
    "finances",
    "savings",
    "investment",
    "business",
    "fiscal",
    "productivity",
    "discover",
    "collaborations",
    "liquidity",
    "general",
  ];
  return validIntents.includes(detected) ? detected : "general";
}

// ─── System Prompts ───────────────────────────────────────────────────────────

function getSystemPrompt(intent: Intent, userContext: string): string {
  const antiInvention = `
REGLAS CRÍTICAS (NO VIOLAR):
- NUNCA inventes datos financieros, precios, ni señales de mercado
- Si no hay suficiente información, di exactamente: "No hay suficiente información para analizar esto con precisión"
- Usa siempre frases como: "Esto es una estimación", "Con los datos actuales...", "Basándome en la información disponible..."
- NO inventes rendimientos, tasas de retorno, ni precios futuros
- Si hay datos del usuario, úsalos. Si no, di que no tienes datos
- Adapta la profundidad a la complejidad de la pregunta
- Responde siempre en español`;

  const baseContext = userContext
    ? `\nCONTEXTO DEL USUARIO:\n${userContext}`
    : "\nNo hay datos personales del usuario disponibles.";

  const prompts: Record<Intent, string> = {
    finances: `Eres el Asistente Financiero Personal de Opturna. Especialista en finanzas personales, presupuestos, control de gastos e ingresos.
${antiInvention}${baseContext}

Cuando analices finanzas:
- Identifica ingresos vs gastos si están disponibles
- Calcula tasas de ahorro reales
- Sugiere mejoras concretas y realizables
- Usa la regla 50/30/20 cuando sea útil
- Formato: resumen → análisis → recomendaciones`,

    savings: `Eres el Asistente de Ahorro de Opturna. Especialista en estrategias de ahorro, interés compuesto y construcción de fondos.
${antiInvention}${baseContext}

Cuando analices ahorro:
- Calcula interés compuesto solo con datos reales del usuario
- Explica el poder del tiempo en el ahorro
- Sugiere automatización del ahorro
- Metas realistas y progresivas
- Formato: estado actual → potencial → plan de acción`,

    investment: `Eres el Asistente de Inversión de Opturna. Especialista en análisis de activos, diversificación y gestión del riesgo.
${antiInvention}${baseContext}

IMPORTANTE PARA INVERSIÓN:
- NUNCA inventes señales de compra/venta
- NUNCA predices precios futuros
- Analiza solo activos que el usuario mencione explícitamente
- Habla de conceptos y principios cuando no hay datos
- Formato: análisis del activo → riesgo → opciones`,

    business: `Eres el Asistente de Negocio de Opturna. Especialista en modelos de negocio, monetización y estrategia empresarial.
${antiInvention}${baseContext}

Cuando analices negocios:
- Evalúa viabilidad realista, no optimista
- Identifica el mercado objetivo
- Estructura: problema → solución → monetización → siguiente paso
- Habla de riesgos reales
- Formato: diagnóstico → estrategia → acción`,

    fiscal: `Eres el Asistente Fiscal de Opturna. Especialista en impuestos básicos, optimización fiscal y planificación tributaria.
${antiInvention}${baseContext}

IMPORTANTE FISCAL:
- Indica siempre que esto no sustituye asesoría fiscal profesional
- Da información general y principios fiscales
- Para casos complejos, recomienda un asesor fiscal
- Habla de conceptos: IRPF, IVA, deducciones, etc.
- Formato: situación → opciones → recomendación`,

    productivity: `Eres el Asistente de Productividad de Opturna. Especialista en hábitos, disciplina, gestión del tiempo y rendimiento personal.
${antiInvention}${baseContext}

Cuando analices productividad:
- Usa el progreso real del usuario si está disponible
- Sugiere hábitos específicos y medibles
- Aplica principios: Pareto, Deep Work, bloques de tiempo
- Realista sobre el cambio de comportamiento
- Formato: evaluación → estrategia → primeros pasos`,

    discover: `Eres el Asistente de Descubrimiento de Opturna. Ayudas a descubrir tendencias, oportunidades y contenido relevante.
${antiInvention}${baseContext}

IMPORTANTE:
- Solo habla de tendencias si tienes datos reales
- No inventes noticias ni eventos del mercado
- Sugiere áreas de exploración, no afirmaciones
- Formato: observación → contexto → exploración sugerida`,

    collaborations: `Eres el Asistente de Colaboraciones de Opturna. Especialista en partnerships, joint ventures y alianzas estratégicas.
${antiInvention}${baseContext}

Cuando analices colaboraciones:
- Evalúa fit estratégico y cultural
- Estructura legal básica de partnerships
- Identifica valor mutuo
- Habla de riesgos y protecciones
- Formato: análisis → estructura propuesta → siguientes pasos`,

    liquidity: `Eres el Asistente de Liquidez de Opturna. Especialista en acceso a liquidez, pignoración de activos y gestión de necesidades urgentes de capital.
${antiInvention}${baseContext}

Cuando analices liquidez:
1. Primero analiza si el usuario tiene activos disponibles
2. Compara opciones: vender vs pignorar (sin forzar ninguna)
3. Explica pignoración: LTV típico 50-70%, riesgos de margin call
4. Alternativas: líneas de crédito, deuda estructurada
5. Siempre explica riesgos claramente
6. Formato: situación → opciones → comparativa → recomendación

Si el usuario quiere simular una pignoración, indícale que puede usar el simulador de pignoración.`,

    general: `Eres Opturna AI, un sistema inteligente de decisión financiera y personal.
${antiInvention}${baseContext}

Responde de forma clara y útil. Si la pregunta es sobre finanzas, inversión, ahorro, negocio o productividad, aplica los principios de esas áreas. Para preguntas generales, sé conciso y práctico. Formato adaptado a la complejidad.`,
  };

  return prompts[intent];
}

// ─── Format Detection ─────────────────────────────────────────────────────────

function determineFormat(
  intent: Intent,
  query: string
): "resumen" | "análisis" | "simulación" | "estrategia" {
  const queryLower = query.toLowerCase();
  if (
    queryLower.includes("simul") ||
    queryLower.includes("calcul") ||
    queryLower.includes("cuánto")
  )
    return "simulación";
  if (
    queryLower.includes("estrategi") ||
    queryLower.includes("plan") ||
    queryLower.includes("cómo")
  )
    return "estrategia";
  if (
    queryLower.includes("analiz") ||
    queryLower.includes("compara") ||
    queryLower.includes("diferencia")
  )
    return "análisis";
  // intent is used to allow future format differentiation per intent
  void intent;
  return "resumen";
}

// ─── POST /api/opturna-ai/query ───────────────────────────────────────────────

const querySchema = z.object({
  query: z.string().min(1).max(2000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

opturnaAI.post("/query", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  if (!process.env.OPENAI_API_KEY) {
    return c.json(
      { error: { message: "OpenAI API key not configured", code: "NO_API_KEY" } },
      503
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { message: "Invalid JSON body" } }, 400);
  }

  const parsed = querySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { message: "Invalid request body" } }, 400);
  }
  const { query, conversationHistory } = parsed.data;

  // Build user context from available data
  let userContext = "";
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      take: 5,
      orderBy: { createdAt: "desc" },
    });
    if (goals.length > 0) {
      userContext += `Metas del usuario:\n${goals
        .map((g) => `- ${g.title}: ${g.progress ?? 0}% completado`)
        .join("\n")}\n\n`;
    }

    const habits = await prisma.habit.findMany({
      where: { userId: user.id },
      take: 5,
    });
    if (habits.length > 0) {
      userContext += `Hábitos del usuario:\n${habits
        .map((h) => `- ${h.title}: racha de ${h.streak ?? 0} días`)
        .join("\n")}\n\n`;
    }
  } catch {
    // Silently continue if db queries fail
  }

  // Detect intent
  const intent = await detectIntent(query);

  // Get system prompt
  const systemPrompt = getSystemPrompt(intent, userContext);

  // Determine format
  const format = determineFormat(intent, query);

  // Build messages
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: query },
  ];

  // Generate response
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: 1000,
    temperature: 0.3,
  });

  const responseText = response.choices[0]?.message.content ?? "";

  return c.json({
    data: {
      response: responseText,
      intent,
      format,
      model: "gpt-4o",
    },
  });
});

// ─── POST /api/opturna-ai/simulate/loan ──────────────────────────────────────

const loanSchema = z.object({
  assetValue: z.number().positive(),
  ltv: z.number().min(0.1).max(0.9).default(0.6),
  interestRate: z.number().min(0.1).max(30).default(8),
  durationMonths: z.number().int().min(1).max(120).default(12),
  assetName: z.string().optional().default("Activo"),
});

opturnaAI.post("/simulate/loan", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { message: "Invalid JSON body" } }, 400);
  }

  const parsed = loanSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { message: "Invalid request body" } }, 400);
  }
  const { assetValue, ltv, interestRate, durationMonths, assetName } =
    parsed.data;

  // Calculate loan simulation
  const availableLiquidity = assetValue * ltv;
  const monthlyRate = interestRate / 100 / 12;

  let monthlyPayment = 0;
  let totalCost = 0;
  let totalInterest = 0;

  if (monthlyRate > 0) {
    monthlyPayment =
      (availableLiquidity *
        (monthlyRate * Math.pow(1 + monthlyRate, durationMonths))) /
      (Math.pow(1 + monthlyRate, durationMonths) - 1);
    totalCost = monthlyPayment * durationMonths;
    totalInterest = totalCost - availableLiquidity;
  } else {
    monthlyPayment = availableLiquidity / durationMonths;
    totalCost = availableLiquidity;
    totalInterest = 0;
  }

  // Risk assessment
  let riskLevel: "bajo" | "medio" | "alto" | "muy_alto";
  if (ltv <= 0.5) riskLevel = "bajo";
  else if (ltv <= 0.65) riskLevel = "medio";
  else if (ltv <= 0.8) riskLevel = "alto";
  else riskLevel = "muy_alto";

  // Cost of selling vs pledging
  const estimatedSellingCosts = assetValue * 0.03;
  const netFromSelling = assetValue - estimatedSellingCosts;

  const risks: string[] = [
    ltv > 0.65
      ? "LTV elevado: riesgo de margin call si el activo cae de valor"
      : null,
    "El activo queda como garantía durante el préstamo",
    interestRate > 10
      ? "Tipo de interés alto: evalúa alternativas más baratas"
      : null,
    durationMonths > 36
      ? "Plazo largo: mayor coste total en intereses"
      : null,
  ].filter((r): r is string => r !== null);

  return c.json({
    data: {
      simulation: {
        assetName,
        assetValue,
        ltv: ltv * 100,
        availableLiquidity: Math.round(availableLiquidity * 100) / 100,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        interestRate,
        durationMonths,
        riskLevel,
        costAsPercentage:
          Math.round((totalInterest / availableLiquidity) * 1000) / 10,
      },
      comparison: {
        pledging: {
          liquidityObtained: Math.round(availableLiquidity * 100) / 100,
          totalCost: Math.round(totalInterest * 100) / 100,
          keepAsset: true,
          note: "Mantienes el activo pero pagas intereses",
        },
        selling: {
          liquidityObtained: Math.round(netFromSelling * 100) / 100,
          totalCost: Math.round(estimatedSellingCosts * 100) / 100,
          keepAsset: false,
          note: "Obtienes más liquidez pero pierdes el activo",
        },
      },
      risks,
      disclaimer:
        "Esta es una simulación orientativa. Los términos reales dependen del prestamista y del activo específico.",
    },
  });
});

// ─── GET /api/opturna-ai/suggestions ─────────────────────────────────────────

opturnaAI.get("/suggestions", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const suggestions = [
    {
      intent: "finances",
      text: "¿Cómo puedo optimizar mis gastos mensuales?",
      category: "Finanzas",
    },
    {
      intent: "savings",
      text: "¿Cuánto tendré si ahorro 500€/mes durante 10 años?",
      category: "Ahorro",
    },
    {
      intent: "investment",
      text: "¿Qué debo considerar antes de invertir en ETFs?",
      category: "Inversión",
    },
    {
      intent: "liquidity",
      text: "Necesito liquidez urgente, tengo activos ¿qué hago?",
      category: "Liquidez",
    },
    {
      intent: "business",
      text: "¿Cómo puedo monetizar mis habilidades?",
      category: "Negocio",
    },
    {
      intent: "fiscal",
      text: "¿Cómo puedo reducir mi carga fiscal legalmente?",
      category: "Fiscal",
    },
    {
      intent: "productivity",
      text: "¿Cómo puedo ser más constante con mis hábitos?",
      category: "Productividad",
    },
    {
      intent: "collaborations",
      text: "¿Cómo estructura un acuerdo de colaboración?",
      category: "Colaboraciones",
    },
  ];

  return c.json({ data: suggestions });
});

export default opturnaAI;
