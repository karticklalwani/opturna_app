import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const contentRouter = new Hono();

// ─── Types ───────────────────────────────────────────────────────────────────

type ContentItem = {
  id: string;
  category: string;
  categoryLabel: string;
  title: string;
  summary: string;
  imageUrl: string;
  readTime: number;
  source: string;
  publishedAt: string;
  isFeatured: boolean;
  url: string;
};

// ─── Mock Data ───────────────────────────────────────────────────────────────

const ALL_CONTENT: ContentItem[] = [
  // finanzas
  {
    id: "fin-001",
    category: "finanzas",
    categoryLabel: "Finanzas",
    title: "Cómo el interés compuesto puede multiplicar tu patrimonio en 20 años",
    summary: "Descubre por qué Einstein llamó al interés compuesto la octava maravilla del mundo y cómo aplicarlo en tu estrategia de inversión personal.",
    imageUrl: "https://images.unsplash.com/photo-1611974030578-86ebacf2ee9f?w=800&q=80",
    readTime: 7,
    source: "Wall Street Journal",
    publishedAt: "2025-02-28T10:00:00Z",
    isFeatured: true,
    url: "https://example.com/interes-compuesto",
  },
  {
    id: "fin-002",
    category: "finanzas",
    categoryLabel: "Finanzas",
    title: "Inflación en 2025: qué esperar y cómo proteger tus ahorros",
    summary: "Los bancos centrales siguen ajustando políticas monetarias. Analizamos las mejores estrategias para que tu dinero no pierda valor este año.",
    imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7a4ab7f8?w=800&q=80",
    readTime: 5,
    source: "Forbes",
    publishedAt: "2025-03-01T09:00:00Z",
    isFeatured: true,
    url: "https://example.com/inflacion-2025",
  },
  {
    id: "fin-003",
    category: "finanzas",
    categoryLabel: "Finanzas",
    title: "ETFs vs fondos activos: cuál da mejores retornos a largo plazo",
    summary: "Un análisis exhaustivo de 15 años de datos muestra que el 87% de los fondos activos no logran superar a su índice de referencia.",
    imageUrl: "https://images.unsplash.com/photo-1611974030578-86ebacf2ee9f?w=800&q=80",
    readTime: 8,
    source: "Bloomberg",
    publishedAt: "2025-02-20T14:00:00Z",
    isFeatured: false,
    url: "https://example.com/etfs-vs-fondos",
  },
  {
    id: "fin-004",
    category: "finanzas",
    categoryLabel: "Finanzas",
    title: "El método 50/30/20: la regla de oro para gestionar tu presupuesto",
    summary: "Aprende cómo dividir tus ingresos entre necesidades, deseos y ahorro para alcanzar la libertad financiera de forma sostenible.",
    imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7a4ab7f8?w=800&q=80",
    readTime: 4,
    source: "Money Magazine",
    publishedAt: "2025-02-15T11:00:00Z",
    isFeatured: false,
    url: "https://example.com/metodo-50-30-20",
  },
  // fitness
  {
    id: "fit-001",
    category: "fitness",
    categoryLabel: "Fitness",
    title: "Los 5 ejercicios compuestos que maximizan el crecimiento muscular",
    summary: "Sentadilla, peso muerto, press de banca, dominadas y press militar: la ciencia detrás de los movimientos que transforman tu cuerpo.",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
    readTime: 6,
    source: "Men's Health",
    publishedAt: "2025-03-02T08:00:00Z",
    isFeatured: true,
    url: "https://example.com/ejercicios-compuestos",
  },
  {
    id: "fit-002",
    category: "fitness",
    categoryLabel: "Fitness",
    title: "Correr en ayunas: mitos y verdades según la ciencia",
    summary: "¿Quemar más grasa o perder masa muscular? Revisamos 12 estudios recientes para darte una respuesta definitiva sobre el cardio matutino.",
    imageUrl: "https://images.unsplash.com/photo-1534258936233-67a2a654c67a?w=800&q=80",
    readTime: 5,
    source: "Runner's World",
    publishedAt: "2025-02-25T07:00:00Z",
    isFeatured: false,
    url: "https://example.com/correr-ayunas",
  },
  {
    id: "fit-003",
    category: "fitness",
    categoryLabel: "Fitness",
    title: "HIIT vs cardio moderado: qué es mejor para perder grasa",
    summary: "El entrenamiento interválico de alta intensidad promete resultados en menos tiempo. Pero ¿es sostenible y adecuado para todos los niveles?",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
    readTime: 7,
    source: "Shape",
    publishedAt: "2025-02-18T09:30:00Z",
    isFeatured: false,
    url: "https://example.com/hiit-vs-cardio",
  },
  // nutricion
  {
    id: "nut-001",
    category: "nutricion",
    categoryLabel: "Nutrición",
    title: "Proteínas vegetales: las mejores fuentes para atletas sin carne",
    summary: "Legumbres, quinoa, tempeh y edamame pueden proporcionar todos los aminoácidos esenciales que tu músculo necesita para crecer.",
    imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
    readTime: 5,
    source: "Harvard Health",
    publishedAt: "2025-03-01T12:00:00Z",
    isFeatured: false,
    url: "https://example.com/proteinas-vegetales",
  },
  {
    id: "nut-002",
    category: "nutricion",
    categoryLabel: "Nutrición",
    title: "Ayuno intermitente 16:8: guía completa para principiantes",
    summary: "Todo lo que necesitas saber para empezar: qué comer, cuándo comer, beneficios comprobados y errores comunes que debes evitar.",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80",
    readTime: 8,
    source: "Healthline",
    publishedAt: "2025-02-22T10:00:00Z",
    isFeatured: false,
    url: "https://example.com/ayuno-intermitente",
  },
  {
    id: "nut-003",
    category: "nutricion",
    categoryLabel: "Nutrición",
    title: "Los 10 alimentos antiinflamatorios que deberías comer cada semana",
    summary: "La inflamación crónica está detrás de muchas enfermedades. Estos superalimentos pueden ayudarte a combatirla de forma natural.",
    imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
    readTime: 4,
    source: "Mayo Clinic",
    publishedAt: "2025-02-10T11:00:00Z",
    isFeatured: false,
    url: "https://example.com/alimentos-antiinflamatorios",
  },
  // meditacion
  {
    id: "med-001",
    category: "meditacion",
    categoryLabel: "Meditación",
    title: "10 minutos de meditación al día pueden cambiar tu cerebro",
    summary: "La neurociencia confirma que la práctica meditativa regular aumenta la materia gris y reduce la actividad de la amígdala relacionada con el estrés.",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    readTime: 5,
    source: "Scientific American",
    publishedAt: "2025-02-28T08:00:00Z",
    isFeatured: true,
    url: "https://example.com/meditacion-cerebro",
  },
  {
    id: "med-002",
    category: "meditacion",
    categoryLabel: "Meditación",
    title: "Mindfulness para principiantes: técnicas que puedes hacer ahora mismo",
    summary: "No necesitas sentarte en posición de loto ni vaciar tu mente. Aprende técnicas accesibles que puedes integrar en tu rutina diaria.",
    imageUrl: "https://images.unsplash.com/photo-1508193638397-1cc4ff6f9c23?w=800&q=80",
    readTime: 6,
    source: "Psychology Today",
    publishedAt: "2025-02-20T09:00:00Z",
    isFeatured: false,
    url: "https://example.com/mindfulness-principiantes",
  },
  // negocios
  {
    id: "neg-001",
    category: "negocios",
    categoryLabel: "Negocios",
    title: "Cómo construir un negocio de 1 millón sin inversión inicial",
    summary: "El modelo bootstrapping ha producido algunos de los negocios más exitosos del mundo. Estas son las estrategias que funcionan en 2025.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    readTime: 9,
    source: "Inc. Magazine",
    publishedAt: "2025-03-03T10:00:00Z",
    isFeatured: false,
    url: "https://example.com/negocio-millon",
  },
  {
    id: "neg-002",
    category: "negocios",
    categoryLabel: "Negocios",
    title: "Las habilidades más demandadas por las empresas en 2025",
    summary: "IA, pensamiento crítico, comunicación asertiva y gestión de datos encabezan la lista de competencias que buscan los empleadores este año.",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    readTime: 5,
    source: "Harvard Business Review",
    publishedAt: "2025-02-27T11:00:00Z",
    isFeatured: false,
    url: "https://example.com/habilidades-2025",
  },
  {
    id: "neg-003",
    category: "negocios",
    categoryLabel: "Negocios",
    title: "El poder del networking: cómo construir relaciones que abren puertas",
    summary: "El 85% de los empleos se consiguen a través de conexiones. Aprende a construir una red de contactos auténtica y de valor.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    readTime: 6,
    source: "Forbes",
    publishedAt: "2025-02-14T09:00:00Z",
    isFeatured: false,
    url: "https://example.com/networking",
  },
  // filosofia
  {
    id: "fil-001",
    category: "filosofia",
    categoryLabel: "Filosofía",
    title: "Estoicismo moderno: las enseñanzas de Marco Aurelio para el siglo XXI",
    summary: "Las Meditaciones escritas hace 1800 años contienen sabiduría práctica sorprendentemente relevante para gestionar el estrés contemporáneo.",
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5571?w=800&q=80",
    readTime: 8,
    source: "Philosophy Now",
    publishedAt: "2025-02-26T10:00:00Z",
    isFeatured: false,
    url: "https://example.com/estoicismo-moderno",
  },
  {
    id: "fil-002",
    category: "filosofia",
    categoryLabel: "Filosofía",
    title: "¿Qué es el Ikigai y cómo puede darte propósito de vida?",
    summary: "El concepto japonés que combina pasión, misión, vocación y profesión puede ser la brújula que necesitas para encontrar tu razón de ser.",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb2515879?w=800&q=80",
    readTime: 5,
    source: "Medium",
    publishedAt: "2025-02-19T08:30:00Z",
    isFeatured: false,
    url: "https://example.com/ikigai",
  },
  // salud
  {
    id: "sal-001",
    category: "salud",
    categoryLabel: "Salud",
    title: "Dormir 8 horas no es suficiente: la calidad del sueño importa más",
    summary: "Investigadores de Stanford explican por qué 6 horas de sueño profundo superan a 9 horas de sueño fragmentado para la salud cerebral.",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&q=80",
    readTime: 6,
    source: "Sleep Foundation",
    publishedAt: "2025-03-04T07:00:00Z",
    isFeatured: false,
    url: "https://example.com/calidad-sueno",
  },
  {
    id: "sal-002",
    category: "salud",
    categoryLabel: "Salud",
    title: "Los biomarcadores que todo adulto debería analizar cada año",
    summary: "Glucosa, HbA1c, vitamina D, ferritina y proteína C-reactiva pueden revelar problemas de salud años antes de que aparezcan síntomas.",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    readTime: 7,
    source: "WebMD",
    publishedAt: "2025-02-23T10:00:00Z",
    isFeatured: false,
    url: "https://example.com/biomarcadores",
  },
  // lecturas
  {
    id: "lec-001",
    category: "lecturas",
    categoryLabel: "Lecturas",
    title: "Los 10 libros de no ficción más recomendados por CEOs en 2025",
    summary: "Desde 'Thinking, Fast and Slow' hasta 'The Psychology of Money', estos títulos aparecen una y otra vez en las bibliografías de los líderes más exitosos.",
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5571?w=800&q=80",
    readTime: 5,
    source: "Business Insider",
    publishedAt: "2025-03-05T09:00:00Z",
    isFeatured: false,
    url: "https://example.com/libros-ceos",
  },
  {
    id: "lec-002",
    category: "lecturas",
    categoryLabel: "Lecturas",
    title: "Atomic Habits: las ideas clave que cambiarán tus rutinas",
    summary: "James Clear explica cómo pequeños cambios del 1% se acumulan para producir resultados extraordinarios. Un resumen de los conceptos más poderosos.",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb2515879?w=800&q=80",
    readTime: 6,
    source: "Blinkist",
    publishedAt: "2025-02-17T11:00:00Z",
    isFeatured: false,
    url: "https://example.com/atomic-habits-resumen",
  },
  // autoayuda
  {
    id: "aut-001",
    category: "autoayuda",
    categoryLabel: "Autoayuda",
    title: "La técnica Pomodoro 2.0: cómo triplicar tu productividad",
    summary: "Investigadores actualizan el clásico método de gestión del tiempo con hallazgos sobre neurociencia cognitiva para maximizar el enfoque profundo.",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    readTime: 4,
    source: "Lifehacker",
    publishedAt: "2025-03-06T08:00:00Z",
    isFeatured: false,
    url: "https://example.com/pomodoro-2",
  },
  {
    id: "aut-002",
    category: "autoayuda",
    categoryLabel: "Autoayuda",
    title: "Cómo desarrollar una mentalidad de crecimiento en 30 días",
    summary: "Carol Dweck demostró que la inteligencia no es fija. Estos 7 ejercicios diarios pueden reprogramar tus creencias limitantes en un mes.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    readTime: 5,
    source: "Psychology Today",
    publishedAt: "2025-02-12T10:00:00Z",
    isFeatured: false,
    url: "https://example.com/mentalidad-crecimiento",
  },
  // personal
  {
    id: "per-001",
    category: "personal",
    categoryLabel: "Personal",
    title: "El diario de gratitud: por qué 5 minutos al día transforman tu vida",
    summary: "Estudios de la Universidad de California demuestran que quienes practican la gratitud duermen mejor, tienen más energía y reportan mayor satisfacción.",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    readTime: 4,
    source: "Greater Good Magazine",
    publishedAt: "2025-03-07T07:30:00Z",
    isFeatured: false,
    url: "https://example.com/diario-gratitud",
  },
  {
    id: "per-002",
    category: "personal",
    categoryLabel: "Personal",
    title: "Cómo establecer límites sanos en el trabajo sin dañar tu carrera",
    summary: "El burnout afecta al 76% de los trabajadores. Aprende a decir no estratégicamente y proteger tu bienestar sin comprometer tu reputación profesional.",
    imageUrl: "https://images.unsplash.com/photo-1508193638397-1cc4ff6f9c23?w=800&q=80",
    readTime: 6,
    source: "Fast Company",
    publishedAt: "2025-02-24T09:00:00Z",
    isFeatured: false,
    url: "https://example.com/limites-trabajo",
  },
];

const CATEGORIES = [
  { key: "finanzas", label: "Finanzas" },
  { key: "fitness", label: "Fitness" },
  { key: "nutricion", label: "Nutrición" },
  { key: "meditacion", label: "Meditación" },
  { key: "negocios", label: "Negocios" },
  { key: "filosofia", label: "Filosofía" },
  { key: "salud", label: "Salud" },
  { key: "lecturas", label: "Lecturas" },
  { key: "autoayuda", label: "Autoayuda" },
  { key: "personal", label: "Personal" },
];

const feedQuerySchema = z.object({
  category: z.string().optional(),
});

contentRouter.get(
  "/feed",
  zValidator("query", feedQuerySchema),
  (c) => {
    const { category } = c.req.valid("query");

    const filtered =
      !category || category === "all"
        ? ALL_CONTENT
        : ALL_CONTENT.filter((item) => item.category === category);

    const featured = filtered.filter((item) => item.isFeatured).slice(0, 4);
    const latest = filtered
      .slice()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 8);
    const recommended = filtered
      .filter((item) => !item.isFeatured)
      .slice(0, 5);

    const categories = CATEGORIES.map((cat) => ({
      key: cat.key,
      label: cat.label,
      count: ALL_CONTENT.filter((item) => item.category === cat.key).length,
    }));

    return c.json({
      data: {
        featured,
        latest,
        recommended,
        categories,
      },
    });
  }
);

contentRouter.get("/:id", (c) => {
  const { id } = c.req.param();
  const item = ALL_CONTENT.find((i) => i.id === id);
  if (!item) return c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404);
  return c.json({ data: item });
});

export default contentRouter;
