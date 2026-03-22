import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, BookOpen, Calendar } from "lucide-react-native";
import { useTheme, DARK } from "@/lib/theme";
import { api } from "@/lib/api/api";

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

const CATEGORY_COLORS: Record<string, string> = {
  finanzas: "#4ADE80",
  fitness: "#F97316",
  nutricion: "#A78BFA",
  meditacion: "#38BDF8",
  negocios: "#FBBF24",
  filosofia: "#F472B6",
  salud: "#34D399",
  lecturas: "#FB923C",
  autoayuda: "#60A5FA",
  personal: "#E879F9",
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "#4ADE80";
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const nav = useRouter();
  const [imageError, setImageError] = useState(false);

  const { data: item, isLoading, isError } = useQuery<ContentItem>({
    queryKey: ["content-item", id],
    queryFn: () => api.get<ContentItem>(`/api/content/${id}`),
    enabled: !!id,
  });

  const catColor = item ? getCategoryColor(item.category) : "#4ADE80";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={{ height: 300, position: "relative" }}>
          {item && !imageError ? (
            <ExpoImage
              source={{ uri: item.imageUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={{ width: "100%", height: "100%", backgroundColor: `${catColor}15`, alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={48} color={`${catColor}60`} />
            </View>
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.45)", "transparent", "rgba(0,0,0,0.7)"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {/* Back button */}
          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <View style={{ padding: 16 }}>
              <Pressable
                onPress={() => nav.back()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeft size={20} color="#fff" />
              </Pressable>
            </View>
          </SafeAreaView>
          {/* Category badge */}
          {item ? (
            <View
              style={{
                position: "absolute",
                bottom: 16,
                left: 20,
                backgroundColor: `${catColor}ee`,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5,
              }}
            >
              <Text style={{ color: "#000", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
                {item.categoryLabel.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Content */}
        <View style={{ padding: 20 }}>
          {isLoading ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <ActivityIndicator size="large" color={catColor} />
            </View>
          ) : null}

          {isError ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: colors.text3, fontSize: 15 }}>No se pudo cargar el artículo.</Text>
            </View>
          ) : null}

          {item ? (
            <>
              {/* Title */}
              <Text
                style={{
                  color: colors.text,
                  fontSize: 24,
                  fontWeight: "800",
                  lineHeight: 32,
                  marginBottom: 16,
                  letterSpacing: -0.3,
                }}
              >
                {item.title}
              </Text>

              {/* Meta row */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 20,
                  paddingBottom: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  flexWrap: "wrap",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <BookOpen size={13} color={colors.text3} />
                  <Text style={{ color: colors.text3, fontSize: 13 }}>{item.source}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Clock size={13} color={colors.text3} />
                  <Text style={{ color: colors.text3, fontSize: 13 }}>{item.readTime} min de lectura</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Calendar size={13} color={colors.text3} />
                  <Text style={{ color: colors.text3, fontSize: 13 }}>{formatDate(item.publishedAt)}</Text>
                </View>
              </View>

              {/* Colored accent line */}
              <View
                style={{
                  width: 40,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: catColor,
                  marginBottom: 16,
                }}
              />

              {/* Article body — summary as the main content */}
              <Text
                style={{
                  color: colors.text,
                  fontSize: 17,
                  lineHeight: 28,
                  fontWeight: "600",
                  marginBottom: 20,
                }}
              >
                {item.summary}
              </Text>

              {/* Expanded content paragraphs */}
              <ArticleBody item={item} colors={colors} catColor={catColor} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function ArticleBody({
  item,
  colors,
  catColor,
}: {
  item: ContentItem;
  colors: typeof DARK;
  catColor: string;
}) {
  // Generate contextual paragraphs from the article data
  const paragraphs = getArticleParagraphs(item);

  return (
    <View style={{ gap: 16, paddingBottom: 40 }}>
      {paragraphs.map((p, i) => (
        <Text
          key={i}
          style={{
            color: colors.text2,
            fontSize: 16,
            lineHeight: 26,
          }}
        >
          {p}
        </Text>
      ))}
      {/* Source footer */}
      <View
        style={{
          marginTop: 12,
          padding: 16,
          backgroundColor: colors.card,
          borderRadius: 12,
          borderLeftWidth: 3,
          borderLeftColor: catColor,
        }}
      >
        <Text style={{ color: colors.text3, fontSize: 12, marginBottom: 4 }}>FUENTE ORIGINAL</Text>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{item.source}</Text>
      </View>
    </View>
  );
}

function getArticleParagraphs(item: ContentItem): string[] {
  const categoryIntros: Record<string, string[]> = {
    finanzas: [
      "La educación financiera es una de las inversiones más rentables que cualquier persona puede hacer. Entender cómo funciona el dinero, cómo crece y cómo protegerlo es fundamental para alcanzar la libertad económica.",
      "Los expertos coinciden en que comenzar temprano marca la diferencia. El tiempo es el activo más valioso en las finanzas personales, y cada año que pasa sin una estrategia clara representa una oportunidad perdida.",
      "Implementar estos conceptos en tu vida cotidiana no requiere ser un experto en bolsa ni tener grandes sumas de dinero. Con disciplina, conocimiento básico y consistencia, cualquier persona puede mejorar su situación financiera de forma significativa.",
    ],
    fitness: [
      "El entrenamiento físico va mucho más allá de la estética. La ciencia ha demostrado repetidamente que el ejercicio regular tiene beneficios profundos sobre la salud mental, cognitiva y longevidad.",
      "La clave está en la consistencia por encima de la intensidad. Muchos principiantes cometen el error de arrancar con programas demasiado ambiciosos que son insostenibles a largo plazo. Una rutina moderada que se mantiene durante años supera ampliamente a un programa intenso que se abandona en semanas.",
      "Escuchar a tu cuerpo es fundamental. El descanso y la recuperación son tan importantes como el propio entrenamiento. Sin el tiempo adecuado para que los músculos se reparen y crezcan, los resultados se estancan y el riesgo de lesiones aumenta.",
    ],
    nutricion: [
      "Lo que comes tiene un impacto directo en cómo te sientes, piensas y rindes cada día. La nutrición moderna va más allá de contar calorías: se trata de entender cómo los diferentes alimentos afectan a tu metabolismo, energía y salud a largo plazo.",
      "La microbiota intestinal, ese ecosistema de billones de bacterias que habita en nuestro intestino, juega un papel crucial en nuestra salud. Mantenerla diversa y equilibrada a través de una alimentación variada en fibra y fermentados tiene beneficios que van desde la digestión hasta el estado de ánimo.",
      "Más que seguir dietas restrictivas, el objetivo debería ser construir hábitos alimenticios sostenibles. Los cambios radicales rara vez perduran; son las pequeñas mejoras consistentes las que transforman la salud a largo plazo.",
    ],
    meditacion: [
      "La práctica meditativa ha pasado de ser una tradición espiritual milenaria a convertirse en una herramienta respaldada por la neurociencia moderna. Cientos de estudios confirman sus efectos sobre el estrés, la ansiedad, la concentración y el bienestar general.",
      "No es necesario vaciar la mente ni alcanzar ningún estado especial. La meditación es simplemente el ejercicio de llevar la atención al momento presente, observar los pensamientos sin juzgarlos y volver una y otra vez al punto de enfoque elegido.",
      "Los beneficios más documentados incluyen la reducción del cortisol (la hormona del estrés), el aumento de la materia gris en zonas relacionadas con la atención y la regulación emocional, y una mejora significativa en la calidad del sueño.",
    ],
    negocios: [
      "El mundo empresarial está en constante transformación. Las habilidades y estrategias que llevaron al éxito hace una década pueden no ser suficientes hoy. La adaptabilidad y el aprendizaje continuo se han convertido en las competencias más valoradas en el entorno profesional actual.",
      "Los emprendedores y ejecutivos más exitosos comparten una característica común: toman decisiones basadas en datos pero guiadas por intuición forjada en la experiencia. Este equilibrio entre el análisis riguroso y la capacidad de actuar con información incompleta define al líder moderno.",
      "El networking auténtico, no el transaccional, sigue siendo uno de los motores más poderosos del éxito profesional. Las relaciones construidas sobre el valor mutuo y la confianza abren puertas que ninguna habilidad técnica puede abrir por sí sola.",
    ],
    filosofia: [
      "La filosofía no es un lujo intelectual reservado para académicos: es una herramienta práctica para vivir mejor. Las grandes escuelas del pensamiento occidental y oriental ofrecen marcos conceptuales poderosos para enfrentar los desafíos cotidianos.",
      "El estoicismo, el epicureísmo, el budismo y otras tradiciones filosóficas coinciden en algo fundamental: la felicidad no depende de las circunstancias externas, sino de nuestra relación con ellas. Esta idea, aparentemente simple, tiene implicaciones profundas para cómo gestionamos las adversidades.",
      "Dedicar tiempo a reflexionar sobre las grandes preguntas —qué es una buena vida, cómo tratar a los demás, qué vale la pena perseguir— no es tiempo perdido. Es, quizás, la inversión más rentable que cualquier persona puede hacer en su desarrollo personal.",
    ],
    salud: [
      "La salud preventiva es la medicina más eficaz. Detectar y corregir desequilibrios antes de que se conviertan en enfermedades no solo ahorra sufrimiento, sino también los costes económicos y de tiempo que implican los tratamientos curativos.",
      "El enfoque holístico de la salud reconoce que cuerpo y mente están profundamente conectados. El estrés crónico, las relaciones tóxicas y la falta de propósito tienen consecuencias físicas tan reales como cualquier patología orgánica.",
      "Los hábitos del sueño, la actividad física, la alimentación y la gestión del estrés forman los cuatro pilares de la salud óptima. Mejorar en estas áreas no requiere productos caros ni intervenciones complejas, sino consistencia y paciencia.",
    ],
    lecturas: [
      "Los libros son la forma más eficiente de acceder a décadas de experiencia y conocimiento condensados en horas de lectura. Los líderes y pensadores más influyentes del mundo son, sin excepción, lectores voraces.",
      "Leer de forma activa —tomando notas, haciendo conexiones con lo que ya sabes, cuestionando los argumentos del autor— transforma la lectura de un pasatiempo pasivo en una herramienta poderosa de aprendizaje y cambio de perspectiva.",
      "No se trata de la cantidad de libros leídos, sino de la profundidad con la que se integran sus ideas. Un solo libro comprendido y aplicado puede cambiar el rumbo de una vida.",
    ],
    autoayuda: [
      "El desarrollo personal no es una tendencia pasajera: es la búsqueda universal de convertirnos en una versión mejor de nosotros mismos. Las mejores herramientas de autoayuda son las que se basan en evidencia científica y en la sabiduría destilada de miles de años de experiencia humana.",
      "El cambio duradero rara vez ocurre por un golpe de inspiración. Se construye día a día, a través de pequeñas decisiones consistentes que, acumuladas en el tiempo, producen transformaciones extraordinarias.",
      "La autoconciencia —conocer nuestras fortalezas, debilidades, valores y patrones de comportamiento— es el punto de partida de cualquier proceso de mejora personal genuino. Sin ella, cualquier técnica o sistema es una solución superficial.",
    ],
    personal: [
      "El bienestar personal es multidimensional. Incluye la salud física, la salud mental, las relaciones, el trabajo significativo, el crecimiento continuo y la conexión con algo más grande que uno mismo. Descuidar cualquiera de estas dimensiones afecta inevitablemente a las demás.",
      "Las personas más satisfechas con su vida no son necesariamente las más exitosas en términos convencionales. Son las que han encontrado coherencia entre sus valores, sus acciones y su visión de lo que significa vivir bien.",
      "Construir una vida con intención requiere hacer pausas regulares para reflexionar sobre hacia dónde nos dirigimos, si esa dirección sigue teniendo sentido y qué ajustes necesitamos hacer. Esta práctica reflexiva es lo que distingue una vida vivida de una vida diseñada.",
    ],
  };

  return categoryIntros[item.category] ?? [
    "Este tema es fundamental para cualquier persona que desee mejorar en esta área de su vida. La investigación reciente ha arrojado nuevas perspectivas que cambian la forma en que entendemos estos conceptos.",
    "Los expertos coinciden en que la consistencia y la paciencia son las claves del éxito en este campo. No existe un atajo ni una fórmula mágica: los resultados duraderos se construyen con trabajo sostenido y una mentalidad de largo plazo.",
    "Aplicar estos principios en tu vida cotidiana puede parecer desafiante al principio, pero con el tiempo se convierte en algo natural. El primer paso siempre es el más difícil, pero también el más importante.",
  ];
}
