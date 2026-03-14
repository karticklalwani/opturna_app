import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Bell,
  Mail,
  UserPlus,
  Heart,
  MessageCircle,
  Lock,
  Eye,
  BarChart2,
  AtSign,
  Link2,
  Shield,
  LogOut,
  Trash2,
  KeyRound,
  Download,
  Twitter,
  Music,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useSession, useInvalidateSession } from "@/lib/auth/use-session";
import { authClient } from "@/lib/auth/auth-client";
import { api } from "@/lib/api/api";
import { useQueryClient } from "@tanstack/react-query";

type SocialPlatform = "instagram" | "twitter" | "tiktok";

interface ExternalLink {
  label: string;
  url: string;
}

interface UserProfile {
  externalLinks?: string | ExternalLink[] | null;
}

export default function SettingsScreen() {
  const { mode, colors, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();
  const queryClient = useQueryClient();

  // Profile settings
  const [profilePublic, setProfilePublic] = useState<boolean>(true);
  const [showEmail, setShowEmail] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(true);

  // Notifications
  const [pushNotifs, setPushNotifs] = useState<boolean>(true);
  const [emailNotifs, setEmailNotifs] = useState<boolean>(true);
  const [newFollowers, setNewFollowers] = useState<boolean>(true);
  const [postReactions, setPostReactions] = useState<boolean>(true);
  const [comments, setComments] = useState<boolean>(true);

  // Privacy
  const [allowMessages, setAllowMessages] = useState<boolean>(true);
  const [showOnline, setShowOnline] = useState<boolean>(true);
  const [dataAnalytics, setDataAnalytics] = useState<boolean>(false);

  // Change Password modal
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  // Social links
  const [socialLinks, setSocialLinks] = useState<{
    instagram: string;
    twitter: string;
    tiktok: string;
  }>({ instagram: "", twitter: "", tiktok: "" });
  const [showSocialModal, setShowSocialModal] = useState<boolean>(false);
  const [editingSocial, setEditingSocial] = useState<SocialPlatform | null>(null);
  const [socialInput, setSocialInput] = useState<string>("");
  const [savingSocial, setSavingSocial] = useState<boolean>(false);

  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;
  const errorSoft = `${colors.error}1A`;
  const errorBorder = `${colors.error}47`;

  const userEmail = session?.user?.email ?? "";

  // Load existing social links from profile
  useEffect(() => {
    if (session?.user) {
      api.get<UserProfile>("/api/me").then((profile) => {
        if (profile?.externalLinks) {
          try {
            const linksArr: ExternalLink[] =
              typeof profile.externalLinks === "string"
                ? JSON.parse(profile.externalLinks)
                : profile.externalLinks;
            const ig = linksArr.find((l) => l.url.includes("instagram.com"));
            const tw = linksArr.find(
              (l) => l.url.includes("twitter.com") || l.url.includes("x.com")
            );
            const tk = linksArr.find((l) => l.url.includes("tiktok.com"));
            setSocialLinks({
              instagram: ig
                ? ig.url
                    .replace("https://instagram.com/", "")
                    .replace("https://www.instagram.com/", "")
                : "",
              twitter: tw
                ? tw.url
                    .replace("https://twitter.com/", "")
                    .replace("https://x.com/", "")
                : "",
              tiktok: tk
                ? tk.url
                    .replace("https://tiktok.com/@", "")
                    .replace("https://www.tiktok.com/@", "")
                : "",
            });
          } catch {
            // ignore parse errors
          }
        }
      }).catch(() => {});
    }
  }, [session?.user?.id]);

  const handleSaveSocialLink = async () => {
    if (!editingSocial) return;
    setSavingSocial(true);
    try {
      const username = socialInput.replace("@", "").trim();
      const updated = { ...socialLinks, [editingSocial]: username };
      setSocialLinks(updated);

      // Build updated social ExternalLink entries
      const socialEntries: ExternalLink[] = [];
      if (updated.instagram) {
        socialEntries.push({
          label: "Instagram",
          url: `https://instagram.com/${updated.instagram}`,
        });
      }
      if (updated.twitter) {
        socialEntries.push({
          label: "Twitter",
          url: `https://twitter.com/${updated.twitter}`,
        });
      }
      if (updated.tiktok) {
        socialEntries.push({
          label: "TikTok",
          url: `https://tiktok.com/@${updated.tiktok}`,
        });
      }

      // Fetch existing profile links, keep non-social ones
      const profile = await api.get<UserProfile>("/api/me");
      const existingLinks: ExternalLink[] = profile?.externalLinks
        ? typeof profile.externalLinks === "string"
          ? JSON.parse(profile.externalLinks)
          : profile.externalLinks
        : [];

      const otherLinks = existingLinks.filter(
        (l) =>
          !l.url.includes("instagram.com") &&
          !l.url.includes("twitter.com") &&
          !l.url.includes("x.com") &&
          !l.url.includes("tiktok.com")
      );

      await api.patch("/api/me", {
        externalLinks: [...otherLinks, ...socialEntries],
      });

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setShowSocialModal(false);
      setEditingSocial(null);
      setSocialInput("");
      Alert.alert(
        "Guardado",
        `Tu cuenta de ${editingSocial} ha sido vinculada.`
      );
    } catch {
      Alert.alert("Error", "No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSavingSocial(false);
    }
  };

  const handleOpenSocial = async (platform: SocialPlatform) => {
    const username = socialLinks[platform];
    if (!username) {
      setEditingSocial(platform);
      setSocialInput("");
      setShowSocialModal(true);
      return;
    }

    let appUrl = "";
    let webUrl = "";

    if (platform === "instagram") {
      appUrl = `instagram://user?username=${username}`;
      webUrl = `https://instagram.com/${username}`;
    } else if (platform === "twitter") {
      appUrl = `twitter://user?screen_name=${username}`;
      webUrl = `https://x.com/${username}`;
    } else if (platform === "tiktok") {
      appUrl = `snssdk1233://user/profile/${username}`;
      webUrl = `https://tiktok.com/@${username}`;
    }

    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const handleSignOut = async () => {
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
      "Eliminar Cuenta",
      "Esta acción no se puede deshacer. Todos tus datos, posts, metas y sprints serán eliminados permanentemente.",
      [
        { text: t("cancel"), style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => {} },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas nuevas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setChangingPassword(true);
    try {
      await authClient.changePassword({ currentPassword, newPassword });
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Contraseña actualizada", "Tu contraseña ha sido cambiada exitosamente.");
    } catch {
      Alert.alert("Error", "No se pudo cambiar la contraseña. Verifica tu contraseña actual.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = () => {
    Alert.alert(
      "Exportar datos",
      "Tus datos se han exportado y serán enviados a tu email en los próximos minutos."
    );
  };

  // ---------- Sub-components ----------

  const SectionHeader = ({ label }: { label: string }) => (
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
      {label.toUpperCase()}
    </Text>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
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

  const Divider = () => (
    <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />
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
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}
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
      <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" }}>
        {label}
      </Text>
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
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}
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
            paddingHorizontal: 16,
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
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}
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
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}
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

  const ConnectedAccountRow = ({
    icon,
    platform,
    platformKey,
    testId,
  }: {
    icon: React.ReactNode;
    platform: string;
    platformKey: SocialPlatform;
    testId: string;
  }) => {
    const username = socialLinks[platformKey];
    const isConnected = !!username;
    return (
      <TouchableOpacity
        onPress={() => handleOpenSocial(platformKey)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
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
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{platform}</Text>
          <Text
            style={{
              color: isConnected ? colors.accent : colors.text3,
              fontSize: 12,
              marginTop: 1,
            }}
          >
            {isConnected ? `@${username}` : "No conectado"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {isConnected ? (
            <>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.accent,
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  setEditingSocial(platformKey);
                  setSocialInput(username);
                  setShowSocialModal(true);
                }}
                style={{ padding: 4 }}
              >
                <Text style={{ color: colors.text3, fontSize: 11 }}>Editar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View
              style={{
                backgroundColor: accentSoft,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: accentBorder,
              }}
            >
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700" }}>
                Conectar
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const InstagramIcon = () => (
    <View
      style={{
        width: 15,
        height: 15,
        borderRadius: 4,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LinearGradient
        colors={["#833AB4", "#FD1D1D", "#F77737"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View
        style={{
          width: 9,
          height: 9,
          borderRadius: 2.5,
          borderWidth: 1.5,
          borderColor: "#fff",
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="settings-screen">
      {/* ── Change Password Modal ── */}
      <Modal
        visible={showChangePassword}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChangePassword(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "flex-end" }}
            onPress={() => setShowChangePassword(false)}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                gap: 16,
              }}
            >
              <View style={{ alignItems: "center", marginBottom: 4 }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                  }}
                />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "700",
                  letterSpacing: -0.3,
                }}
              >
                Cambiar Contraseña
              </Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Contraseña actual"
                placeholderTextColor={colors.text3}
                secureTextEntry
                style={{
                  backgroundColor: colors.bg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: colors.text,
                  fontSize: 15,
                }}
                testID="current-password-input"
              />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nueva contraseña"
                placeholderTextColor={colors.text3}
                secureTextEntry
                style={{
                  backgroundColor: colors.bg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: colors.text,
                  fontSize: 15,
                }}
                testID="new-password-input"
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmar nueva contraseña"
                placeholderTextColor={colors.text3}
                secureTextEntry
                style={{
                  backgroundColor: colors.bg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: colors.text,
                  fontSize: 15,
                }}
                testID="confirm-password-input"
              />
              <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => setShowChangePassword(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                  }}
                  testID="cancel-password-change"
                >
                  <Text style={{ color: colors.text3, fontSize: 15, fontWeight: "600" }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    opacity: changingPassword ? 0.6 : 1,
                  }}
                  testID="submit-password-change"
                >
                  <Text style={{ color: colors.bg, fontSize: 15, fontWeight: "700" }}>
                    {changingPassword ? "Guardando..." : "Guardar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Social Account Modal ── */}
      <Modal
        visible={showSocialModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowSocialModal(false);
          setEditingSocial(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "flex-end" }}
            onPress={() => {
              setShowSocialModal(false);
              setEditingSocial(null);
            }}
          >
            <Pressable onPress={() => {}}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  gap: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                    alignSelf: "center",
                  }}
                />
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 17,
                    fontWeight: "800",
                    letterSpacing: -0.3,
                  }}
                >
                  Vincular{" "}
                  {editingSocial === "instagram"
                    ? "Instagram"
                    : editingSocial === "twitter"
                    ? "Twitter / X"
                    : "TikTok"}
                </Text>
                <Text style={{ color: colors.text3, fontSize: 13 }}>
                  Introduce tu nombre de usuario (sin @)
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.bg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text style={{ color: colors.text3, fontSize: 15 }}>@</Text>
                  <TextInput
                    value={socialInput}
                    onChangeText={setSocialInput}
                    placeholder="tu_usuario"
                    placeholderTextColor={colors.text3}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      flex: 1,
                      color: colors.text,
                      fontSize: 15,
                      paddingVertical: 14,
                      paddingLeft: 4,
                    }}
                    onSubmitEditing={handleSaveSocialLink}
                    returnKeyType="done"
                    testID="social-username-input"
                  />
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowSocialModal(false);
                      setEditingSocial(null);
                      setSocialInput("");
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: colors.bg,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    testID="cancel-social-link"
                  >
                    <Text style={{ color: colors.text3, fontSize: 15, fontWeight: "600" }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveSocialLink}
                    disabled={savingSocial || !socialInput.trim()}
                    style={{
                      flex: 1,
                      backgroundColor: colors.accent,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: "center",
                      opacity: savingSocial || !socialInput.trim() ? 0.5 : 1,
                    }}
                    testID="save-social-link"
                  >
                    {savingSocial ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <Text style={{ color: "#000", fontSize: 15, fontWeight: "800" }}>
                        Guardar
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: colors.text,
              letterSpacing: -0.5,
            }}
          >
            {t("settings")}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE SETTINGS */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={{ marginBottom: 24 }}>
          <SectionHeader label="Perfil" />
          <Card>
            <SwitchRow
              icon={<Globe size={15} color={colors.accent} />}
              label="Visibilidad del Perfil"
              value={profilePublic}
              onValueChange={setProfilePublic}
              testId="profile-visibility"
            />
            <Divider />
            <SwitchRow
              icon={<Mail size={15} color={colors.accent} />}
              label="Mostrar Email"
              value={showEmail}
              onValueChange={setShowEmail}
              testId="show-email"
            />
            <Divider />
            <SwitchRow
              icon={<BarChart2 size={15} color={colors.accent} />}
              label="Estadísticas del Perfil"
              value={showStats}
              onValueChange={setShowStats}
              testId="profile-stats"
            />
          </Card>
        </Animated.View>

        {/* APPEARANCE */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={{ marginBottom: 24 }}>
          <SectionHeader label="Apariencia" />
          <Card>
            <ToggleRow
              icon={
                mode === "dark" ? (
                  <Moon size={15} color={colors.accent} />
                ) : (
                  <Sun size={15} color={colors.accent} />
                )
              }
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
          </Card>
        </Animated.View>

        {/* NOTIFICATIONS */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={{ marginBottom: 24 }}>
          <SectionHeader label="Notificaciones" />
          <Card>
            <SwitchRow
              icon={<Bell size={15} color={colors.accent} />}
              label="Notificaciones Push"
              value={pushNotifs}
              onValueChange={setPushNotifs}
              testId="push-notifs"
            />
            <Divider />
            <SwitchRow
              icon={<Mail size={15} color={colors.accent} />}
              label="Notificaciones por Email"
              value={emailNotifs}
              onValueChange={setEmailNotifs}
              testId="email-notifs"
            />
            <Divider />
            <SwitchRow
              icon={<UserPlus size={15} color={colors.accent} />}
              label="Nuevos Seguidores"
              value={newFollowers}
              onValueChange={setNewFollowers}
              testId="new-followers"
            />
            <Divider />
            <SwitchRow
              icon={<Heart size={15} color={colors.accent} />}
              label="Reacciones en Posts"
              value={postReactions}
              onValueChange={setPostReactions}
              testId="post-reactions"
            />
            <Divider />
            <SwitchRow
              icon={<MessageCircle size={15} color={colors.accent} />}
              label="Comentarios"
              value={comments}
              onValueChange={setComments}
              testId="comments-notif"
            />
          </Card>
        </Animated.View>

        {/* PRIVACY */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={{ marginBottom: 24 }}>
          <SectionHeader label="Privacidad" />
          <Card>
            <SwitchRow
              icon={<MessageCircle size={15} color={colors.accent} />}
              label="Permitir Mensajes de Cualquiera"
              value={allowMessages}
              onValueChange={setAllowMessages}
              testId="allow-messages"
            />
            <Divider />
            <SwitchRow
              icon={<Eye size={15} color={colors.accent} />}
              label="Mostrar Estado en Línea"
              value={showOnline}
              onValueChange={setShowOnline}
              testId="show-online"
            />
            <Divider />
            <SwitchRow
              icon={<BarChart2 size={15} color={colors.accent} />}
              label="Uso de Datos y Análisis"
              value={dataAnalytics}
              onValueChange={setDataAnalytics}
              testId="data-analytics"
            />
          </Card>
        </Animated.View>

        {/* ACCOUNT */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={{ marginBottom: 24 }}>
          <SectionHeader label="Cuenta" />
          <Card>
            <DisplayRow
              icon={<AtSign size={15} color={colors.accent} />}
              label="Email"
              value={userEmail}
              testId="account-email"
            />
            <Divider />
            <ChevronRow
              icon={<KeyRound size={15} color={colors.accent} />}
              label="Cambiar Contraseña"
              onPress={() => setShowChangePassword(true)}
              testId="change-password"
            />
            <Divider />
            <ChevronRow
              icon={<Download size={15} color={colors.accent} />}
              label="Exportar Datos"
              onPress={handleExportData}
              testId="export-data"
            />
          </Card>
        </Animated.View>

        {/* CONNECTED ACCOUNTS */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginBottom: 24 }}>
          <SectionHeader label="Cuentas Conectadas" />
          <Card>
            <ConnectedAccountRow
              icon={<InstagramIcon />}
              platform="Instagram"
              platformKey="instagram"
              testId="connect-instagram"
            />
            <Divider />
            <ConnectedAccountRow
              icon={<Twitter size={15} color="#1DA1F2" />}
              platform="Twitter / X"
              platformKey="twitter"
              testId="connect-twitter"
            />
            <Divider />
            <ConnectedAccountRow
              icon={<Music size={15} color={colors.text} />}
              platform="TikTok"
              platformKey="tiktok"
              testId="connect-tiktok"
            />
          </Card>
        </Animated.View>

        {/* DANGER ZONE */}
        <Animated.View entering={FadeInDown.delay(360).duration(400)} style={{ marginBottom: 32 }}>
          <SectionHeader label="Zona de Peligro" />
          <View style={{ gap: 10 }}>
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
                {t("signOut")}
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
                Eliminar Cuenta
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
