import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Dimensions,
  Linking,
  Pressable,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useSession, useInvalidateSession } from "@/lib/auth/use-session";
import { authClient } from "@/lib/auth/auth-client";
import { User, Post } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Edit3,
  Camera,
  CheckCircle,
  Target,
  Globe,
  Link,
  Twitter,
  Linkedin,
  Github,
  Moon,
  Sun,
  Bell,
  Mail,
  UserPlus,
  Heart,
  MessageCircle,
  Eye,
  BarChart2,
  AtSign,
  KeyRound,
  Download,
  LogOut,
  Trash2,
  Lock,
  Shield,
  X,
  ChevronRight,
  Image as ImageIcon,
  Play,
  Bookmark,
  Zap,
  Grid3x3,
  Video,
  Activity,
  Users,
  Star,
  CheckSquare,
  Repeat2,
  FolderOpen,
  Briefcase,
  TrendingUp,
  BookOpen,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { uploadFile } from "@/lib/upload";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COVER_HEIGHT = Math.floor(Dimensions.get("window").height / 3);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ParsedProject {
  title: string;
  description: string;
}

function parseProjects(raw: string): ParsedProject[] {
  if (!raw?.trim()) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((line) => {
      const sep = line.indexOf(":");
      if (sep > -1) {
        return { title: line.slice(0, sep).trim(), description: line.slice(sep + 1).trim() };
      }
      return { title: line, description: "" };
    });
}

function parseSkills(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Reputation / Level helpers
// ---------------------------------------------------------------------------

interface ReputationLevel {
  level: number;
  name: string;
  points: number;
  color: string;
}

function calcReputation(opts: {
  posts: number;
  followers: number;
  following: number;
  hasBio: boolean;
  hasSkills: boolean;
  hasUsername: boolean;
}): ReputationLevel {
  const points =
    opts.posts * 10 +
    opts.followers * 5 +
    opts.following * 1 +
    (opts.hasBio ? 20 : 0) +
    (opts.hasSkills ? 20 : 0) +
    (opts.hasUsername ? 10 : 0);

  let level = 1;
  let name = "Explorador";
  let color = "#A3A3A3";

  if (points >= 1000) {
    level = 5; name = "Elite"; color = "#F59E0B";
  } else if (points >= 500) {
    level = 4; name = "Líder"; color = "#4ADE80";
  } else if (points >= 250) {
    level = 3; name = "Progresista"; color = "#60A5FA";
  } else if (points >= 100) {
    level = 2; name = "Ambicioso"; color = "#C084FC";
  }

  return { level, name, points, color };
}

// Skill chip colors palette
const SKILL_COLORS: Array<{ bg: string; border: string; text: string }> = [
  { bg: "#4ADE8018", border: "#4ADE8040", text: "#4ADE80" },
  { bg: "#60A5FA18", border: "#60A5FA40", text: "#60A5FA" },
  { bg: "#F59E0B18", border: "#F59E0B40", text: "#F59E0B" },
  { bg: "#C084FC18", border: "#C084FC40", text: "#C084FC" },
  { bg: "#FB718518", border: "#FB718540", text: "#FB7185" },
  { bg: "#34D39918", border: "#34D39940", text: "#34D399" },
  { bg: "#FBBF2418", border: "#FBBF2440", text: "#FBBF24" },
  { bg: "#818CF818", border: "#818CF840", text: "#818CF8" },
];

// ---------------------------------------------------------------------------
// EditData interface
// ---------------------------------------------------------------------------

interface EditData {
  name: string;
  bio: string;
  mainAmbition: string;
  currentGoals: string;
  username: string;
  skills: string;
  projects: string;
  twitterHandle: string;
  linkedinUrl: string;
  githubUsername: string;
  website: string;
  location: string;
}

// ---------------------------------------------------------------------------
// Profile type with extra fields
// ---------------------------------------------------------------------------

interface ProfileUser extends User {
  skills?: string | null;
  projects?: string | null;
  twitterHandle?: string | null;
  linkedinUrl?: string | null;
  githubUsername?: string | null;
  website?: string | null;
  location?: string | null;
}

// ---------------------------------------------------------------------------
// Tab IDs
// ---------------------------------------------------------------------------

type TabId = "posts" | "videos" | "saved" | "activity";

const TABS: { id: TabId; labelEs: string; labelEn: string; icon: React.FC<any> }[] = [
  { id: "posts", labelEs: "Publicaciones", labelEn: "Posts", icon: Grid3x3 },
  { id: "videos", labelEs: "Videos", labelEn: "Videos", icon: Video },
  { id: "saved", labelEs: "Guardados", labelEn: "Saved", icon: Bookmark },
  { id: "activity", labelEs: "Actividad", labelEn: "Activity", icon: Activity },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();
  const queryClient = useQueryClient();
  const { mode, colors, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const router = useRouter();

  // Modal
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [editData, setEditData] = useState<EditData>({
    name: "",
    bio: "",
    mainAmbition: "",
    currentGoals: "",
    username: "",
    skills: "",
    projects: "",
    twitterHandle: "",
    linkedinUrl: "",
    githubUsername: "",
    website: "",
    location: "",
  });

  // Active tab
  const [activeTab, setActiveTab] = useState<TabId>("posts");

  // Image uploading
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [uploadingCover, setUploadingCover] = useState<boolean>(false);

  // Settings toggles (from settings.tsx)
  const [profilePublic, setProfilePublic] = useState<boolean>(true);
  const [showEmailSetting, setShowEmailSetting] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(true);
  const [pushNotifs, setPushNotifs] = useState<boolean>(true);
  const [emailNotifs, setEmailNotifs] = useState<boolean>(true);
  const [newFollowers, setNewFollowers] = useState<boolean>(true);
  const [postReactions, setPostReactions] = useState<boolean>(true);
  const [comments, setComments] = useState<boolean>(true);
  const [allowMessages, setAllowMessages] = useState<boolean>(true);
  const [showOnline, setShowOnline] = useState<boolean>(true);
  const [dataAnalytics, setDataAnalytics] = useState<boolean>(false);

  // Colors
  const accentSoft = `${colors.accent}20`;
  const accentBorder = `${colors.accent}40`;
  const errorSoft = `${colors.error}1A`;
  const errorBorder = `${colors.error}47`;

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<ProfileUser>("/api/me"),
    enabled: !!session?.user,
  });

  const { data: userPosts } = useQuery({
    queryKey: ["user-posts", session?.user?.id],
    queryFn: () => api.get<Post[]>(`/api/posts?userId=${session?.user?.id}`),
    enabled: !!session?.user?.id,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const updateProfile = useMutation({
    mutationFn: (data: Record<string, string>) => api.patch("/api/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setShowEdit(false);
    },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSignOut = () => {
    Alert.alert(t("signOut"), t("signOutMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("signOut"),
        style: "destructive",
        onPress: async () => {
          await authClient.signOut();
          await invalidateSession();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "Esta acción no se puede deshacer. Se eliminarán todos tus datos, publicaciones y metas permanentemente.",
      [
        { text: t("cancel"), style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => {} },
      ]
    );
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(feature, "Próximamente disponible");
  };

  const handleConnectAccount = (platform: string) => {
    Alert.alert(`Conectar ${platform}`, "Próximamente disponible");
  };

  const openEdit = () => {
    setEditData({
      name: profile?.name || session?.user?.name || "",
      bio: profile?.bio || "",
      mainAmbition: profile?.mainAmbition || "",
      currentGoals: profile?.currentGoals || "",
      username: profile?.username || "",
      skills: profile?.skills || "",
      projects: profile?.projects || "",
      twitterHandle: profile?.twitterHandle || "",
      linkedinUrl: profile?.linkedinUrl || "",
      githubUsername: profile?.githubUsername || "",
      website: profile?.website || "",
      location: profile?.location || "",
    });
    setShowEdit(true);
  };

  const handleAvatarPress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() || "jpg";
      const mimeType = `image/${ext}`;
      const fileName = asset.fileName || `avatar.${ext}`;
      setUploadingAvatar(true);
      try {
        const uploaded = await uploadFile(asset.uri, fileName, mimeType);
        await api.patch("/api/me", { image: uploaded.url });
        queryClient.invalidateQueries({ queryKey: ["me"] });
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleCoverPress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() || "jpg";
      const mimeType = `image/${ext}`;
      const fileName = asset.fileName || `cover.${ext}`;
      setUploadingCover(true);
      try {
        const uploaded = await uploadFile(asset.uri, fileName, mimeType);
        await api.patch("/api/me", { coverImage: uploaded.url });
        queryClient.invalidateQueries({ queryKey: ["me"] });
      } finally {
        setUploadingCover(false);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const skills = parseSkills(profile?.skills || "");
  const projects = parseProjects(profile?.projects || "");
  const displayName = profile?.name || session?.user?.name || "User";
  const avatarImage = profile?.image || session?.user?.image;
  const userEmail = session?.user?.email ?? "";

  const postsAll = userPosts || [];
  const videoPosts = postsAll.filter((p) => p.type === "video");

  // Reputation
  const reputation = calcReputation({
    posts: profile?._count?.posts ?? 0,
    followers: profile?._count?.followers ?? 0,
    following: profile?._count?.following ?? 0,
    hasBio: !!(profile?.bio?.trim()),
    hasSkills: !!(profile?.skills?.trim()),
    hasUsername: !!(profile?.username?.trim()),
  });

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (profileLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}
        testID="loading-indicator"
      >
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Sub-components (defined inside to access colors/helpers)
  // ---------------------------------------------------------------------------

  const Divider = () => (
    <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />
  );

  const SectionLabel = ({ label }: { label: string }) => (
    <Text
      style={{
        color: colors.text3,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.2,
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {label}
    </Text>
  );

  const SettingsCard = ({ children }: { children: React.ReactNode }) => (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      {children}
    </View>
  );

  const SwitchRow = ({
    icon,
    label,
    value,
    onValueChange,
    testId,
  }: {
    icon: React.ReactNode;
    label: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
    testId: string;
  }) => (
    <View
      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 }}
      testID={testId}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.bg}
        testID={`${testId}-switch`}
      />
    </View>
  );

  const ChevronRow = ({
    icon,
    label,
    subtitle,
    onPress,
    testId,
    iconBgColor,
  }: {
    icon: React.ReactNode;
    label: string;
    subtitle?: string;
    onPress: () => void;
    testId: string;
    iconBgColor?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      testID={testId}
      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: iconBgColor ?? accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{label}</Text>
        {subtitle ? (
          <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>{subtitle}</Text>
        ) : null}
      </View>
      <ChevronRight size={16} color={colors.text3} />
    </TouchableOpacity>
  );

  const DisplayRow = ({
    icon,
    label,
    value,
    testId,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    testId: string;
  }) => (
    <View
      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 }}
      testID={testId}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" }}>{label}</Text>
      <Text style={{ color: colors.text3, fontSize: 13 }}>{value}</Text>
    </View>
  );

  const PillToggle = ({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.bg,
        borderRadius: 100,
        padding: 3,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 3,
      }}
    >
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          testID={`toggle-${opt.value}`}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 100,
            backgroundColor: value === opt.value ? colors.accent : "transparent",
          }}
        >
          <Text
            style={{
              color: value === opt.value ? colors.bg : colors.text3,
              fontWeight: "700",
              fontSize: 13,
            }}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const ToggleRow = ({
    icon,
    label,
    options,
    value,
    onChange,
  }: {
    icon: React.ReactNode;
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <View
      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" }}>{label}</Text>
      <PillToggle options={options} value={value} onChange={onChange} />
    </View>
  );

  const ConnectedAccountRow = ({
    icon,
    platform,
    testId,
  }: {
    icon: React.ReactNode;
    platform: string;
    testId: string;
  }) => (
    <View
      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{platform}</Text>
        <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>No conectado</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleConnectAccount(platform)}
        testID={testId}
        style={{
          backgroundColor: accentSoft,
          borderWidth: 1,
          borderColor: accentBorder,
          borderRadius: 100,
          paddingHorizontal: 14,
          paddingVertical: 6,
        }}
      >
        <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700" }}>Conectar</Text>
      </TouchableOpacity>
    </View>
  );

  // Tab content renderer
  const renderTabContent = () => {
    const CELL_SIZE = (SCREEN_WIDTH - 4) / 3;

    if (activeTab === "posts") {
      const mediaUrls = postsAll
        .map((p) => {
          if (!p.mediaUrls) return null;
          try {
            const parsed = JSON.parse(p.mediaUrls);
            return Array.isArray(parsed) ? parsed[0] : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as string[];

      const textOnly = postsAll.filter((p) => !p.mediaUrls || p.mediaUrls === "[]");

      if (postsAll.length === 0) {
        return (
          <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 }}>
            <View style={{ marginBottom: 12 }}>
              <Grid3x3 size={36} color={colors.text4} />
            </View>
            <Text style={{ color: colors.text3, fontSize: 15, fontWeight: "600", marginBottom: 6 }}>
              Sin publicaciones
            </Text>
            <Text style={{ color: colors.text4, fontSize: 13, textAlign: "center" }}>
              Tus publicaciones aparecerán aquí.
            </Text>
          </View>
        );
      }

      // Show grid of images and cards for text posts
      return (
        <View>
          {mediaUrls.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2, marginBottom: 2 }}>
              {mediaUrls.map((url, i) => (
                <View
                  key={i}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: colors.bg2,
                  }}
                >
                  <Image source={{ uri: url }} style={{ width: CELL_SIZE, height: CELL_SIZE }} resizeMode="cover" />
                </View>
              ))}
            </View>
          ) : null}
          {textOnly.map((post, i) => (
            <View
              key={post.id}
              style={{
                marginHorizontal: 16,
                marginBottom: 10,
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }} numberOfLines={3}>
                {post.content}
              </Text>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Heart size={12} color={colors.text3} />
                  <Text style={{ color: colors.text3, fontSize: 12 }}>{post._count?.reactions || 0}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <MessageCircle size={12} color={colors.text3} />
                  <Text style={{ color: colors.text3, fontSize: 12 }}>{post._count?.comments || 0}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (activeTab === "videos") {
      if (videoPosts.length === 0) {
        return (
          <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 }}>
            <View style={{ marginBottom: 12 }}>
              <Video size={36} color={colors.text4} />
            </View>
            <Text style={{ color: colors.text3, fontSize: 15, fontWeight: "600", marginBottom: 6 }}>
              Sin videos
            </Text>
            <Text style={{ color: colors.text4, fontSize: 13, textAlign: "center" }}>
              Tus videos aparecerán aquí.
            </Text>
          </View>
        );
      }

      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
          {videoPosts.map((post) => {
            let thumb: string | null = null;
            try {
              const parsed = post.mediaUrls ? JSON.parse(post.mediaUrls) : [];
              thumb = Array.isArray(parsed) ? parsed[0] : null;
            } catch {
              thumb = null;
            }
            return (
              <View
                key={post.id}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: colors.bg2,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={{ width: CELL_SIZE, height: CELL_SIZE }} resizeMode="cover" />
                ) : (
                  <Video size={24} color={colors.text4} />
                )}
                <View
                  style={{
                    position: "absolute",
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Play size={14} color="#fff" fill="#fff" />
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    if (activeTab === "saved") {
      return (
        <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 }}>
          <View style={{ marginBottom: 12 }}>
            <Bookmark size={36} color={colors.text4} />
          </View>
          <Text style={{ color: colors.text3, fontSize: 15, fontWeight: "600", marginBottom: 6 }}>
            Guardados
          </Text>
          <Text style={{ color: colors.text4, fontSize: 13, textAlign: "center" }}>
            Las publicaciones que guardes aparecerán aquí.
          </Text>
        </View>
      );
    }

    if (activeTab === "activity") {
      return (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {postsAll.slice(0, 5).map((post) => (
            <View
              key={post.id}
              style={{
                flexDirection: "row",
                gap: 12,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }} numberOfLines={2}>
                  {post.content || "Nueva publicación"}
                </Text>
                <Text style={{ color: colors.text3, fontSize: 11, marginTop: 3 }}>
                  {new Date(post.createdAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>
          ))}
          {postsAll.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Activity size={36} color={colors.text4} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.text3, fontSize: 15, fontWeight: "600", marginBottom: 6 }}>
                Sin actividad reciente
              </Text>
            </View>
          ) : null}
        </View>
      );
    }

    return null;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="profile-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* ---- COVER PHOTO ---- */}
        <View style={{ position: "relative" }}>
          <View style={{ width: SCREEN_WIDTH, height: COVER_HEIGHT, overflow: "hidden" }}>
            {profile?.coverImage ? (
              <Image
                source={{ uri: profile.coverImage }}
                style={{ width: SCREEN_WIDTH, height: COVER_HEIGHT }}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={["#0a1a10", "#0F2318", "#1a3a22", "#0a1a10"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: SCREEN_WIDTH, height: COVER_HEIGHT }}
              />
            )}
            {/* Subtle pattern lines */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  width: 1.5,
                  height: COVER_HEIGHT * 2.5,
                  backgroundColor: colors.accent,
                  opacity: 0.045,
                  top: -COVER_HEIGHT * 0.7,
                  left: i * 44 - 10,
                  transform: [{ rotate: "25deg" }],
                }}
              />
            ))}
            {/* Bottom gradient overlay */}
            <LinearGradient
              colors={["transparent", `${colors.bg}E0`, colors.bg]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90 }}
            />
            {/* Uploading overlay */}
            {uploadingCover ? (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color={colors.accent} size="large" />
              </View>
            ) : null}
          </View>

          {/* SafeArea top buttons */}
          <SafeAreaView
            edges={["top"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, backgroundColor: "transparent" }}
          >
            <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 16, paddingTop: 8 }}>
              {/* Change cover button */}
              <TouchableOpacity
                onPress={handleCoverPress}
                testID="change-cover-button"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: 100,
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                  marginRight: 8,
                }}
              >
                <Camera size={12} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
                  {lang === "es" ? "Portada" : "Cover"}
                </Text>
              </TouchableOpacity>
              {/* Edit pen button */}
              <TouchableOpacity
                onPress={openEdit}
                testID="edit-cover-pen-button"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 100,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Edit3 size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* ---- AVATAR overlapping cover ---- */}
        <View style={{ marginTop: -48, paddingHorizontal: 20, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
            {/* Avatar */}
            <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
              testID="avatar-button"
            >
              <View
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 43,
                  backgroundColor: colors.bg2,
                  borderWidth: 3,
                  borderColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  shadowColor: colors.accent,
                  shadowOpacity: 0.35,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator color={colors.accent} />
                ) : avatarImage ? (
                  <Image source={{ uri: avatarImage }} style={{ width: 86, height: 86 }} resizeMode="cover" />
                ) : (
                  <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 32 }}>
                    {displayName[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
              {/* Camera badge */}
              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: colors.bg,
                }}
              >
                <Camera size={12} color={colors.bg} />
              </View>
            </TouchableOpacity>

            {/* Edit profile button */}
            <TouchableOpacity
              onPress={openEdit}
              testID="edit-profile-button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: accentSoft,
                borderWidth: 1,
                borderColor: accentBorder,
                borderRadius: 100,
                paddingHorizontal: 16,
                paddingVertical: 9,
              }}
            >
              <Edit3 size={13} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "700" }}>
                {t("editProfile")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---- PROFILE INFO ---- */}
        <Animated.View entering={FadeInDown.duration(300)} style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          {/* Name + verified */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 }}>
              {displayName}
            </Text>
            {profile?.isVerified ? (
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle size={14} color={colors.bg} fill={colors.bg} />
              </View>
            ) : null}
            {profile?.role === "mentor" ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: accentBorder,
                  backgroundColor: accentSoft,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  borderRadius: 100,
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 0.6 }}>
                  MENTOR
                </Text>
              </View>
            ) : null}
          </View>

          {/* Reputation badge */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: `${reputation.color}18`,
                borderWidth: 1,
                borderColor: `${reputation.color}40`,
                borderRadius: 100,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Star size={10} color={reputation.color} fill={reputation.color} />
              <Text style={{ color: reputation.color, fontSize: 11, fontWeight: "700" }}>
                Nivel {reputation.level} · {reputation.name}
              </Text>
            </View>
            <Text style={{ color: colors.text4 ?? colors.text3, fontSize: 10 }}>{reputation.points} pts</Text>
          </View>

          {/* @username */}
          {profile?.username ? (
            <Text style={{ color: colors.text3, fontSize: 14, marginBottom: 8 }}>@{profile.username}</Text>
          ) : null}

          {/* Bio */}
          {profile?.bio ? (
            <Text
              style={{ color: colors.text2, fontSize: 14, lineHeight: 21, marginBottom: 10 }}
              numberOfLines={3}
            >
              {profile.bio}
            </Text>
          ) : null}

          {/* Location + Website */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 12 }}>
            {profile?.location ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Globe size={12} color={colors.text3} />
                <Text style={{ color: colors.text3, fontSize: 13 }}>{profile.location}</Text>
              </View>
            ) : null}
            {profile?.website ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(profile.website!).catch(() => {})}
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <Link size={12} color={colors.accent} />
                <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
                  {profile.website.replace(/^https?:\/\//, "")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Social link chips */}
          {(profile?.twitterHandle || profile?.linkedinUrl || profile?.githubUsername) ? (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {profile?.twitterHandle ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://twitter.com/${profile.twitterHandle}`).catch(() => {})}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#1DA1F21A",
                    borderWidth: 1,
                    borderColor: "#1DA1F240",
                    borderRadius: 100,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Twitter size={12} color="#1DA1F2" />
                  <Text style={{ color: "#1DA1F2", fontSize: 12, fontWeight: "600" }}>
                    @{profile.twitterHandle}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {profile?.linkedinUrl ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(profile.linkedinUrl!).catch(() => {})}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#0077B51A",
                    borderWidth: 1,
                    borderColor: "#0077B540",
                    borderRadius: 100,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Linkedin size={12} color="#0077B5" />
                  <Text style={{ color: "#0077B5", fontSize: 12, fontWeight: "600" }}>LinkedIn</Text>
                </TouchableOpacity>
              ) : null}
              {profile?.githubUsername ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://github.com/${profile.githubUsername}`).catch(() => {})}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: `${colors.text}1A`,
                    borderWidth: 1,
                    borderColor: `${colors.text}30`,
                    borderRadius: 100,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Github size={12} color={colors.text} />
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
                    {profile.githubUsername}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Skill chips - Marca Personal preview */}
          {skills.length > 0 ? (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Briefcase size={11} color={colors.text3} />
                <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" }}>
                  Habilidades
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
                {skills.map((skill, idx) => {
                  const palette = SKILL_COLORS[idx % SKILL_COLORS.length];
                  return (
                    <View
                      key={skill}
                      style={{
                        paddingHorizontal: 11,
                        paddingVertical: 5,
                        borderWidth: 1,
                        borderColor: palette.border,
                        backgroundColor: palette.bg,
                        borderRadius: 100,
                      }}
                    >
                      <Text style={{ color: palette.text, fontSize: 11, fontWeight: "600" }}>{skill}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={openEdit}
              style={{ flexDirection: "row", alignItems: "center" }}
              testID="add-skills-button"
            >
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 100,
                  borderStyle: "dashed",
                }}
              >
                <Text style={{ color: colors.text3, fontSize: 12 }}>+ Añadir habilidades</Text>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ---- STATS ROW ---- */}
        <Animated.View
          entering={FadeInDown.duration(320).delay(40)}
          style={{
            flexDirection: "row",
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: "#0F0F0F",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          {[
            { labelEs: "Seguidores", labelEn: "Followers", value: profile?._count?.followers ?? 0, testId: "stat-followers" },
            { labelEs: "Siguiendo", labelEn: "Following", value: profile?._count?.following ?? 0, testId: "stat-following" },
            { labelEs: "Publicaciones", labelEn: "Posts", value: profile?._count?.posts ?? 0, testId: "stat-posts" },
          ].map((item, idx) => (
            <View
              key={item.testId}
              testID={item.testId}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 16,
                borderLeftWidth: idx > 0 ? 1 : 0,
                borderLeftColor: "#1F1F1F",
              }}
            >
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
                {item.value}
              </Text>
              <Text style={{ color: colors.text3, fontSize: 11, marginTop: 3, fontWeight: "500" }}>
                {lang === "es" ? item.labelEs : item.labelEn}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* ---- TABS ---- */}
        <Animated.View entering={FadeInDown.duration(320).delay(60)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  testID={`tab-${tab.id}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    marginRight: 4,
                    borderBottomWidth: 2,
                    borderBottomColor: isActive ? colors.accent : "transparent",
                  }}
                >
                  <Icon size={14} color={isActive ? colors.accent : colors.text3} />
                  <Text
                    style={{
                      color: isActive ? colors.accent : colors.text3,
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "500",
                    }}
                  >
                    {lang === "es" ? tab.labelEs : tab.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {/* Tab underline bar */}
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 12 }} />

          {/* Tab content */}
          {renderTabContent()}
        </Animated.View>

        {/* ---- MI PRODUCTIVIDAD ---- */}
        <Animated.View
          entering={FadeInDown.duration(320).delay(70)}
          style={{ marginHorizontal: 16, marginBottom: 16, marginTop: 8 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                backgroundColor: accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={12} color={colors.accent} />
            </View>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Mi productividad</Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[
              {
                label: "Tareas",
                subtitle: "Gestiona tus pendientes",
                icon: CheckSquare,
                color: colors.accent,
                route: "/(app)/tasks",
                testId: "nav-tasks-button",
              },
              {
                label: "Hábitos",
                subtitle: "Rutinas diarias",
                icon: Repeat2,
                color: "#818CF8",
                route: "/(app)/habits",
                testId: "nav-habits-button",
              },
              {
                label: "Proyectos",
                subtitle: "Tus iniciativas",
                icon: Briefcase,
                color: "#F59E0B",
                route: "/(app)/projects",
                testId: "nav-projects-button",
              },
              {
                label: "Progreso",
                subtitle: "Tus métricas",
                icon: TrendingUp,
                color: "#4ADE80",
                route: "/(app)/progress",
                testId: "nav-progress-button",
              },
              {
                label: "Metas",
                subtitle: "Metas de vida",
                icon: Star,
                color: "#818CF8",
                route: "/(app)/life-goals",
                testId: "nav-life-goals-button",
              },
              {
                label: "Diario",
                subtitle: "Reflexiones diarias",
                icon: BookOpen,
                color: "#F472B6",
                route: "/(app)/journal",
                testId: "nav-journal-button",
              },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <Pressable
                  key={item.route}
                  onPress={() => router.push(item.route as any)}
                  testID={item.testId}
                  style={({ pressed }) => ({
                    width: "30%",
                    flexGrow: 1,
                    backgroundColor: pressed ? `${item.color}18` : colors.card,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: `${item.color}30`,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    alignItems: "flex-start",
                    gap: 8,
                  })}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: `${item.color}20`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconComp size={15} color={item.color} />
                  </View>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>{item.label}</Text>
                    <Text style={{ color: colors.text3, fontSize: 10, marginTop: 2 }}>{item.subtitle}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ---- About / Ambition / Projects (shown below tabs) ---- */}        {(profile?.mainAmbition || profile?.currentGoals) ? (
          <Animated.View
            entering={FadeInDown.duration(320).delay(80)}
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 12,
              overflow: "hidden",
            }}
          >
            <View style={{ padding: 18 }}>
              {profile?.mainAmbition ? (
                <View style={{ marginBottom: profile?.currentGoals ? 14 : 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Target size={13} color={colors.accent} />
                    <SectionLabel label="Ambición" />
                  </View>
                  <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>
                    {profile.mainAmbition}
                  </Text>
                </View>
              ) : null}
              {profile?.currentGoals ? (
                <View>
                  {profile?.mainAmbition ? (
                    <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 14 }} />
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Zap size={13} color={colors.accent} />
                    <SectionLabel label="Enfoque Actual" />
                  </View>
                  <Text style={{ color: colors.text2, fontSize: 14, lineHeight: 22 }}>
                    {profile.currentGoals}
                  </Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {/* ---- MARCA PERSONAL ---- */}
        {(skills.length > 0 || projects.length > 0) ? (
          <Animated.View
            entering={FadeInDown.duration(320).delay(100)}
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              marginHorizontal: 16,
              marginBottom: 12,
              overflow: "hidden",
            }}
          >
            <View style={{ padding: 18 }}>
              {/* Section header */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: "#F59E0B20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Star size={13} color="#F59E0B" fill="#F59E0B" />
                </View>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", flex: 1 }}>Marca Personal</Text>
                <TouchableOpacity onPress={openEdit} testID="edit-marca-personal-button">
                  <Edit3 size={13} color={colors.text3} />
                </TouchableOpacity>
              </View>

              {/* Skills chips with colors */}
              {skills.length > 0 ? (
                <View style={{ marginBottom: projects.length > 0 ? 16 : 0 }}>
                  <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
                    Habilidades &amp; Especialidades
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
                    {skills.map((skill, idx) => {
                      const palette = SKILL_COLORS[idx % SKILL_COLORS.length];
                      return (
                        <View
                          key={skill}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderWidth: 1,
                            borderColor: palette.border,
                            backgroundColor: palette.bg,
                            borderRadius: 100,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <View
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: 3,
                              backgroundColor: palette.text,
                            }}
                          />
                          <Text style={{ color: palette.text, fontSize: 12, fontWeight: "600" }}>{skill}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* Divider between skills and projects */}
              {skills.length > 0 && projects.length > 0 ? (
                <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />
              ) : null}

              {/* Projects as cards with status dots */}
              {projects.length > 0 ? (
                <View>
                  <Text style={{ color: colors.text3, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>
                    Proyectos activos
                  </Text>
                  <View style={{ gap: 10 }}>
                    {projects.map((project, idx) => {
                      const dotColors = ["#4ADE80", "#60A5FA", "#F59E0B", "#C084FC", "#FB7185", "#34D399"];
                      const dotColor = dotColors[idx % dotColors.length];
                      return (
                        <View
                          key={idx}
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: 12,
                            backgroundColor: colors.bg,
                            borderRadius: 14,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          {/* Status dot + initial */}
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              backgroundColor: `${dotColor}18`,
                              borderWidth: 1,
                              borderColor: `${dotColor}40`,
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                            }}
                          >
                            <Text style={{ color: dotColor, fontSize: 15, fontWeight: "800" }}>
                              {project.title[0]?.toUpperCase() ?? "P"}
                            </Text>
                            {/* Active dot */}
                            <View
                              style={{
                                position: "absolute",
                                top: -2,
                                right: -2,
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: dotColor,
                                borderWidth: 2,
                                borderColor: colors.bg,
                              }}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: 3 }}>
                              {project.title}
                            </Text>
                            {project.description ? (
                              <Text style={{ color: colors.text2, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>
                                {project.description}
                              </Text>
                            ) : null}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }} />
                              <Text style={{ color: dotColor, fontSize: 10, fontWeight: "600" }}>En progreso</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {/* ---- SETTINGS SECTION ---- */}
        <Animated.View
          entering={FadeInDown.duration(350).delay(120)}
          style={{ marginHorizontal: 16, marginTop: 6, marginBottom: 6 }}
        >
          {/* Section title card header */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, marginTop: 8 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={13} color={colors.accent} />
            </View>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>
              {lang === "es" ? "Configuración" : "Settings"}
            </Text>
          </View>

          {/* Appearance */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.8,
              marginBottom: 8,
              marginTop: 4,
              paddingHorizontal: 4,
            }}
          >
            {lang === "es" ? "APARIENCIA" : "APPEARANCE"}
          </Text>
          <SettingsCard>
            <ToggleRow
              icon={mode === "dark" ? <Moon size={15} color={colors.accent} /> : <Sun size={15} color={colors.accent} />}
              label={t("displayMode")}
              options={[
                { label: t("dark"), value: "dark" },
                { label: t("light"), value: "light" },
              ]}
              value={mode}
              onChange={(v) => setTheme(v as "dark" | "light")}
            />
            <Divider />
            <ToggleRow
              icon={<Globe size={15} color={colors.accent} />}
              label={t("language")}
              options={[
                { label: "EN", value: "en" },
                { label: "ES", value: "es" },
              ]}
              value={lang}
              onChange={(v) => setLang(v as "en" | "es")}
            />
          </SettingsCard>

          {/* Notifications */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.8,
              marginBottom: 8,
              marginTop: 20,
              paddingHorizontal: 4,
            }}
          >
            {lang === "es" ? "NOTIFICACIONES" : "NOTIFICATIONS"}
          </Text>
          <SettingsCard>
            <SwitchRow
              icon={<Bell size={15} color={colors.accent} />}
              label={lang === "es" ? "Notificaciones Push" : "Push Notifications"}
              value={pushNotifs}
              onValueChange={setPushNotifs}
              testId="push-notifs"
            />
            <Divider />
            <SwitchRow
              icon={<Mail size={15} color={colors.accent} />}
              label={lang === "es" ? "Notificaciones Email" : "Email Notifications"}
              value={emailNotifs}
              onValueChange={setEmailNotifs}
              testId="email-notifs"
            />
            <Divider />
            <SwitchRow
              icon={<UserPlus size={15} color={colors.accent} />}
              label={lang === "es" ? "Nuevos seguidores" : "New Followers"}
              value={newFollowers}
              onValueChange={setNewFollowers}
              testId="new-followers"
            />
            <Divider />
            <SwitchRow
              icon={<Heart size={15} color={colors.accent} />}
              label={lang === "es" ? "Reacciones" : "Post Reactions"}
              value={postReactions}
              onValueChange={setPostReactions}
              testId="post-reactions"
            />
            <Divider />
            <SwitchRow
              icon={<MessageCircle size={15} color={colors.accent} />}
              label={lang === "es" ? "Comentarios" : "Comments"}
              value={comments}
              onValueChange={setComments}
              testId="comments-notif"
            />
          </SettingsCard>

          {/* Privacy */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.8,
              marginBottom: 8,
              marginTop: 20,
              paddingHorizontal: 4,
            }}
          >
            {lang === "es" ? "PRIVACIDAD" : "PRIVACY"}
          </Text>
          <SettingsCard>
            <SwitchRow
              icon={<MessageCircle size={15} color={colors.accent} />}
              label={lang === "es" ? "Permitir mensajes" : "Allow Messages from Anyone"}
              value={allowMessages}
              onValueChange={setAllowMessages}
              testId="allow-messages"
            />
            <Divider />
            <SwitchRow
              icon={<Eye size={15} color={colors.accent} />}
              label={lang === "es" ? "Mostrar estado en línea" : "Show Online Status"}
              value={showOnline}
              onValueChange={setShowOnline}
              testId="show-online"
            />
            <Divider />
            <SwitchRow
              icon={<BarChart2 size={15} color={colors.accent} />}
              label={lang === "es" ? "Analíticas" : "Data Usage & Analytics"}
              value={dataAnalytics}
              onValueChange={setDataAnalytics}
              testId="data-analytics"
            />
          </SettingsCard>

          {/* Account */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.8,
              marginBottom: 8,
              marginTop: 20,
              paddingHorizontal: 4,
            }}
          >
            {lang === "es" ? "CUENTA" : "ACCOUNT"}
          </Text>
          <SettingsCard>
            <DisplayRow
              icon={<AtSign size={15} color={colors.accent} />}
              label={lang === "es" ? "Email" : "Email"}
              value={userEmail}
              testId="account-email"
            />
            <Divider />
            <ChevronRow
              icon={<KeyRound size={15} color={colors.accent} />}
              label={lang === "es" ? "Contraseña" : "Change Password"}
              onPress={() => handleComingSoon(lang === "es" ? "Cambiar Contraseña" : "Change Password")}
              testId="change-password"
            />
            <Divider />
            <ChevronRow
              icon={<Download size={15} color={colors.accent} />}
              label={lang === "es" ? "Exportar datos" : "Export Data"}
              onPress={() => handleComingSoon(lang === "es" ? "Exportar Datos" : "Export Data")}
              testId="export-data"
            />
          </SettingsCard>

          {/* Connected Accounts */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.8,
              marginBottom: 8,
              marginTop: 20,
              paddingHorizontal: 4,
            }}
          >
            {lang === "es" ? "CUENTAS CONECTADAS" : "CONNECTED ACCOUNTS"}
          </Text>
          <SettingsCard>
            <ConnectedAccountRow
              icon={<Twitter size={15} color={colors.accent} />}
              platform="Twitter / X"
              testId="connect-twitter"
            />
            <Divider />
            <ConnectedAccountRow
              icon={<Linkedin size={15} color={colors.accent} />}
              platform="LinkedIn"
              testId="connect-linkedin"
            />
            <Divider />
            <ConnectedAccountRow
              icon={<Github size={15} color={colors.accent} />}
              platform="GitHub"
              testId="connect-github"
            />
          </SettingsCard>

          {/* Danger Zone */}
          <Text
            style={{
              color: colors.text3,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.8,
              marginBottom: 8,
              marginTop: 20,
              paddingHorizontal: 4,
            }}
          >
            {lang === "es" ? "ZONA DE PELIGRO" : "DANGER ZONE"}
          </Text>
          <View style={{ gap: 10, marginBottom: 10 }}>
            <TouchableOpacity
              onPress={handleSignOut}
              testID="sign-out-button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: errorSoft,
                borderWidth: 1,
                borderColor: errorBorder,
                borderRadius: 18,
                paddingVertical: 16,
              }}
            >
              <LogOut size={16} color={colors.error} />
              <Text style={{ color: colors.error, fontSize: 15, fontWeight: "700" }}>
                {lang === "es" ? "Cerrar sesión" : "Sign Out"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              testID="delete-account-button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: "transparent",
                borderWidth: 1.5,
                borderColor: errorBorder,
                borderRadius: 18,
                paddingVertical: 16,
              }}
            >
              <Trash2 size={16} color={colors.error} />
              <Text style={{ color: colors.error, fontSize: 15, fontWeight: "700" }}>
                {lang === "es" ? "Eliminar cuenta" : "Delete Account"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ---- EDIT PROFILE MODAL ---- */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          {/* Drag handle */}
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: colors.border,
              borderRadius: 100,
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 4,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowEdit(false)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <X size={18} color={colors.text2} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "700" }}>
              {t("editProfile")}
            </Text>
            <TouchableOpacity
              onPress={() => updateProfile.mutate(editData as unknown as Record<string, string>)}
              disabled={updateProfile.isPending}
              testID="save-profile-button"
              style={{
                backgroundColor: colors.accent,
                borderRadius: 100,
                paddingHorizontal: 20,
                paddingVertical: 9,
              }}
            >
              {updateProfile.isPending ? (
                <ActivityIndicator color={colors.bg} size="small" />
              ) : (
                <Text style={{ color: colors.bg, fontWeight: "700", fontSize: 14 }}>{t("save")}</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {/* Basic Info */}
            <Text
              style={{
                color: colors.text3,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              {lang === "es" ? "Información básica" : "Basic Info"}
            </Text>

            {(
              [
                { key: "name" as const, label: t("fullName"), placeholder: "Tu nombre completo" },
                { key: "username" as const, label: t("username"), placeholder: "@usuario" },
                { key: "location" as const, label: lang === "es" ? "Ubicación" : "Location", placeholder: "Ciudad, País" },
                { key: "website" as const, label: lang === "es" ? "Sitio web" : "Website", placeholder: "https://tuweb.com" },
                { key: "bio" as const, label: t("bio"), placeholder: "Cuéntanos sobre ti...", multiline: true },
                { key: "mainAmbition" as const, label: t("mainAmbition"), placeholder: "¿Cuál es tu mayor ambición?", multiline: true },
                { key: "currentGoals" as const, label: t("currentFocus"), placeholder: "¿En qué estás trabajando ahora?", multiline: true },
              ] as Array<{ key: keyof EditData; label: string; placeholder: string; multiline?: boolean }>
            ).map(({ key, label, placeholder, multiline }) => (
              <View key={key} style={{ marginBottom: 18 }}>
                <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
                  {label}
                </Text>
                <TextInput
                  value={editData[key]}
                  onChangeText={(txt) => setEditData((p) => ({ ...p, [key]: txt }))}
                  placeholder={placeholder}
                  placeholderTextColor={colors.text3}
                  multiline={multiline}
                  testID={`edit-${key}-input`}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 14,
                    color: colors.text,
                    fontSize: 14,
                    lineHeight: 20,
                    ...(multiline ? { minHeight: 80, textAlignVertical: "top" as const } : {}),
                  }}
                />
              </View>
            ))}

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 20 }} />

            {/* Showcase */}
            <Text
              style={{
                color: colors.text3,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              {lang === "es" ? "Showcase" : "Showcase"}
            </Text>

            {/* Skills */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 4 }}>
                {lang === "es" ? "Habilidades" : "Skills"}
              </Text>
              <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 8 }}>
                {lang === "es" ? "Separadas por comas, ej: Diseño, Trading, AI" : "Comma-separated, e.g. Design, Trading, AI"}
              </Text>
              <TextInput
                value={editData.skills}
                onChangeText={(txt) => setEditData((p) => ({ ...p, skills: txt }))}
                placeholder={lang === "es" ? "ej: Diseño, Trading, Estrategia, AI" : "e.g. Design, Trading, Strategy, AI"}
                placeholderTextColor={colors.text3}
                testID="edit-skills-input"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 14,
                  color: colors.text,
                  fontSize: 14,
                }}
              />
            </View>

            {/* Projects */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 4 }}>
                {lang === "es" ? "Proyectos" : "Projects"}
              </Text>
              <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 8 }}>
                {lang === "es"
                  ? "Uno por línea. Formato: \"Título: Descripción\""
                  : "One per line. Format: \"Title: Description\""}
              </Text>
              <TextInput
                value={editData.projects}
                onChangeText={(txt) => setEditData((p) => ({ ...p, projects: txt }))}
                placeholder={lang === "es"
                  ? "ej: Mi App: Una plataforma premium\nJournal: Seguimiento diario"
                  : "e.g. My App: A premium platform\nJournal: Daily tracker"}
                placeholderTextColor={colors.text3}
                multiline
                testID="edit-projects-input"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 14,
                  color: colors.text,
                  fontSize: 14,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
              />
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 20 }} />

            {/* Social Links */}
            <Text
              style={{
                color: colors.text3,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              {lang === "es" ? "Redes Sociales" : "Social Links"}
            </Text>

            {(
              [
                { key: "twitterHandle" as const, label: "Twitter / X", placeholder: "tu_usuario (sin @)", icon: <Twitter size={14} color="#1DA1F2" /> },
                { key: "linkedinUrl" as const, label: "LinkedIn", placeholder: "https://linkedin.com/in/...", icon: <Linkedin size={14} color="#0077B5" /> },
                { key: "githubUsername" as const, label: "GitHub", placeholder: "tu_usuario", icon: <Github size={14} color={colors.text} /> },
              ] as Array<{ key: keyof EditData; label: string; placeholder: string; icon: React.ReactNode }>
            ).map(({ key, label, placeholder, icon }) => (
              <View key={key} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  {icon}
                  <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600" }}>{label}</Text>
                </View>
                <TextInput
                  value={editData[key]}
                  onChangeText={(txt) => setEditData((p) => ({ ...p, [key]: txt }))}
                  placeholder={placeholder}
                  placeholderTextColor={colors.text3}
                  autoCapitalize="none"
                  testID={`edit-${key}-input`}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 14,
                    color: colors.text,
                    fontSize: 14,
                  }}
                />
              </View>
            ))}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
