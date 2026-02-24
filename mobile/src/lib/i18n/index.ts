import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Lang = "es" | "en";

const translations = {
  en: {
    feed: "Feed", forYou: "For You", progress: "Progress", learning: "Learning",
    questions: "Questions", inspiration: "Inspiration", newPost: "New Post",
    post: "Post", category: "Category", hashtags: "Hashtags (optional, comma separated)",
    sprints: "Sprints", goals: "Goals", accountability: "Accountability",
    academy: "Academy", messages: "Messages", profile: "Profile",
    directos: "Live", settings: "Settings", signOut: "Sign Out",
    save: "Save", cancel: "Cancel", delete: "Delete",
    startSprint: "Start Sprint", createGoal: "Create Goal",
    newSprint: "New Sprint", newGoal: "New Goal", duration: "Duration", days: "days",
    sprintTitle: "Sprint Title", goalTitle: "Goal Title", description: "Description",
    bestStreak: "Best streak", activeSprintsLabel: "Active sprints",
    goalsCompleted: "Goals done", inProgress: "In progress", avgProgress: "Avg Progress",
    currentFocus: "Current Focus", mainAmbition: "Main Ambition",
    followers: "Followers", following: "Following", posts: "Posts",
    editProfile: "Edit Profile", fullName: "Full Name", username: "Username",
    bio: "Bio", send: "Send", noMessages: "No messages yet",
    startConversation: "Start a conversation with someone in your network.",
    searchUsers: "Search users...", selectUser: "Select a user to message",
    noCourses: "No courses yet", coursesDesc: "Courses from expert creators will appear here.",
    noFeed: "No posts yet", noFeedDesc: "Be the first to share your progress, goals, or inspiration.",
    checkin: "Check In", checkInTitle: "Daily Check-in", howWasToday: "How was today?",
    evidence: "Evidence (optional)", mood: "Mood",
    deleteConfirm: "Are you sure you want to delete this?",
    deleteSprintConfirm: "Delete Sprint?", deleteGoalConfirm: "Delete Goal?",
    theme: "Theme", language: "Language", dark: "Dark", light: "Light",
    useful: "Useful", inspired: "Inspired", goodProgress: "Progress", interesting: "Interesting",
    shareSomething: "What are you working on? Share your progress, insights, or questions...",
    sharingWith: "Sharing with your network",
    continueWithEmail: "Continue with Email →", enterEmail: "Email Address",
    checkInbox: "Check your inbox", sentTo: "We sent a 6-digit code to",
    didntReceive: "Didn't receive it?", resend: "Resend code",
    noOrdinaire: "The network for those who\nrefuse to stay ordinary.",
    sprintDesc: "What will you do every day?", goalCategory: "Category",
    daysLeft: "days left", members: "members",
    createCourse: "Create Course", courseTitle: "Course Title",
    courseDesc: "Course Description", courseCategory: "Course Category",
    courseAccess: "Access Level", free: "Free", followersOnly: "Followers Only", pro: "Pro",
    publish: "Publish", livesTitle: "Live", startLive: "Go Live",
    scheduleLive: "Schedule", noLives: "No lives scheduled", noLivesDesc: "Go live or schedule a broadcast for your followers.",
    liveTitle: "Stream Title", startStreaming: "Start Streaming",
  },
  es: {
    feed: "Inicio", forYou: "Para Ti", progress: "Progreso", learning: "Aprendizaje",
    questions: "Preguntas", inspiration: "Inspiración", newPost: "Nueva Publicación",
    post: "Publicar", category: "Categoría", hashtags: "Hashtags (opcional, separados por comas)",
    sprints: "Sprints", goals: "Metas", accountability: "Rendición de Cuentas",
    academy: "Academia", messages: "Mensajes", profile: "Perfil",
    directos: "Directos", settings: "Ajustes", signOut: "Cerrar Sesión",
    save: "Guardar", cancel: "Cancelar", delete: "Eliminar",
    startSprint: "Iniciar Sprint", createGoal: "Crear Meta",
    newSprint: "Nuevo Sprint", newGoal: "Nueva Meta", duration: "Duración", days: "días",
    sprintTitle: "Nombre del Sprint", goalTitle: "Título de la Meta", description: "Descripción",
    bestStreak: "Mejor racha", activeSprintsLabel: "Sprints activos",
    goalsCompleted: "Metas completadas", inProgress: "En progreso", avgProgress: "Progreso medio",
    currentFocus: "Enfoque Actual", mainAmbition: "Ambición Principal",
    followers: "Seguidores", following: "Siguiendo", posts: "Publicaciones",
    editProfile: "Editar Perfil", fullName: "Nombre Completo", username: "Usuario",
    bio: "Biografía", send: "Enviar", noMessages: "Sin mensajes",
    startConversation: "Empieza una conversación con alguien de tu red.",
    searchUsers: "Buscar usuarios...", selectUser: "Selecciona un usuario",
    noCourses: "Sin cursos todavía", coursesDesc: "Los cursos de creadores expertos aparecerán aquí.",
    noFeed: "Sin publicaciones", noFeedDesc: "Sé el primero en compartir tu progreso, ideas o inspiración.",
    checkin: "Check-in", checkInTitle: "Check-in Diario", howWasToday: "¿Cómo fue hoy?",
    evidence: "Evidencia (opcional)", mood: "Estado de ánimo",
    deleteConfirm: "¿Estás seguro de que quieres eliminar esto?",
    deleteSprintConfirm: "¿Eliminar Sprint?", deleteGoalConfirm: "¿Eliminar Meta?",
    theme: "Tema", language: "Idioma", dark: "Oscuro", light: "Claro",
    useful: "Útil", inspired: "Me inspiró", goodProgress: "Buen progreso", interesting: "Interesante",
    shareSomething: "¿En qué estás trabajando? Comparte tu progreso, aprendizajes o preguntas...",
    sharingWith: "Compartiendo con tu red",
    continueWithEmail: "Continuar con Email →", enterEmail: "Correo Electrónico",
    checkInbox: "Revisa tu bandeja", sentTo: "Enviamos un código de 6 dígitos a",
    didntReceive: "¿No lo recibiste?", resend: "Reenviar código",
    noOrdinaire: "La red para quienes se niegan\na quedarse en la mediocridad.",
    sprintDesc: "¿Qué harás cada día?", goalCategory: "Categoría",
    daysLeft: "días restantes", members: "miembros",
    createCourse: "Crear Curso", courseTitle: "Título del Curso",
    courseDesc: "Descripción del Curso", courseCategory: "Categoría",
    courseAccess: "Nivel de acceso", free: "Gratis", followersOnly: "Solo seguidores", pro: "Pro",
    publish: "Publicar", livesTitle: "Directos", startLive: "Iniciar Directo",
    scheduleLive: "Programar", noLives: "Sin directos programados", noLivesDesc: "Inicia un directo o programa una transmisión para tus seguidores.",
    liveTitle: "Título del Directo", startStreaming: "Empezar a Transmitir",
  }
};

type TranslationKeys = keyof typeof translations.en;

interface I18nStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKeys) => string;
}

export const useI18n = create<I18nStore>()(
  persist(
    (set, get) => ({
      lang: "es",
      setLang: (lang) => set({ lang }),
      t: (key) => translations[get().lang][key] || translations.en[key] || key,
    }),
    { name: "opturna-lang", storage: createJSONStorage(() => AsyncStorage) }
  )
);
