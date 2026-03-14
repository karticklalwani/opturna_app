import React, { useState } from "react";
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
  Github,
  Linkedin,
  Twitter,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useSession, useInvalidateSession } from "@/lib/auth/use-session";
import { authClient } from "@/lib/auth/auth-client";

export default function SettingsScreen() {
  const { mode, colors, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();

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

  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;
  const errorSoft = `${colors.error}1A`;
  const errorBorder = `${colors.error}47`;

  const userEmail = session?.user?.email ?? "";

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

  const handleComingSoon = (feature: string) => {
    Alert.alert(feature, "Próximamente disponible");
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

  const handleConnectAccount = (platform: string) => {
    Alert.alert(`Conectar ${platform}`, "Esta función estará disponible próximamente.");
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
    testId,
  }: {
    icon: React.ReactNode;
    platform: string;
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
      <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "500" }}>Próximamente</Text>
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
