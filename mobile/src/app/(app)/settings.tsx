import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
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
      "Delete Account",
      "This action cannot be undone. All your data, posts, goals, and sprints will be permanently deleted.",
      [
        { text: t("cancel"), style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {} },
      ]
    );
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(feature, "Feature coming soon");
  };

  const handleConnectAccount = (platform: string) => {
    Alert.alert(`Connect ${platform}`, "Feature coming soon");
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
        <Text style={{ color: colors.text3, fontSize: 12, marginTop: 1 }}>Not connected</Text>
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
        <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700" }}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="settings-screen">
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
          <SectionHeader label="Profile" />
          <Card>
            <SwitchRow
              icon={<Globe size={15} color={colors.accent} />}
              label="Profile Visibility"
              value={profilePublic}
              onValueChange={setProfilePublic}
              testId="profile-visibility"
            />
            <Divider />
            <SwitchRow
              icon={<Mail size={15} color={colors.accent} />}
              label="Show Email"
              value={showEmail}
              onValueChange={setShowEmail}
              testId="show-email"
            />
            <Divider />
            <SwitchRow
              icon={<BarChart2 size={15} color={colors.accent} />}
              label="Profile Stats"
              value={showStats}
              onValueChange={setShowStats}
              testId="profile-stats"
            />
          </Card>
        </Animated.View>

        {/* APPEARANCE */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={{ marginBottom: 24 }}>
          <SectionHeader label="Appearance" />
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
          <SectionHeader label="Notifications" />
          <Card>
            <SwitchRow
              icon={<Bell size={15} color={colors.accent} />}
              label="Push Notifications"
              value={pushNotifs}
              onValueChange={setPushNotifs}
              testId="push-notifs"
            />
            <Divider />
            <SwitchRow
              icon={<Mail size={15} color={colors.accent} />}
              label="Email Notifications"
              value={emailNotifs}
              onValueChange={setEmailNotifs}
              testId="email-notifs"
            />
            <Divider />
            <SwitchRow
              icon={<UserPlus size={15} color={colors.accent} />}
              label="New Followers"
              value={newFollowers}
              onValueChange={setNewFollowers}
              testId="new-followers"
            />
            <Divider />
            <SwitchRow
              icon={<Heart size={15} color={colors.accent} />}
              label="Post Reactions"
              value={postReactions}
              onValueChange={setPostReactions}
              testId="post-reactions"
            />
            <Divider />
            <SwitchRow
              icon={<MessageCircle size={15} color={colors.accent} />}
              label="Comments"
              value={comments}
              onValueChange={setComments}
              testId="comments-notif"
            />
          </Card>
        </Animated.View>

        {/* PRIVACY */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={{ marginBottom: 24 }}>
          <SectionHeader label="Privacy" />
          <Card>
            <SwitchRow
              icon={<MessageCircle size={15} color={colors.accent} />}
              label="Allow Messages from Anyone"
              value={allowMessages}
              onValueChange={setAllowMessages}
              testId="allow-messages"
            />
            <Divider />
            <SwitchRow
              icon={<Eye size={15} color={colors.accent} />}
              label="Show Online Status"
              value={showOnline}
              onValueChange={setShowOnline}
              testId="show-online"
            />
            <Divider />
            <SwitchRow
              icon={<BarChart2 size={15} color={colors.accent} />}
              label="Data Usage & Analytics"
              value={dataAnalytics}
              onValueChange={setDataAnalytics}
              testId="data-analytics"
            />
          </Card>
        </Animated.View>

        {/* ACCOUNT */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={{ marginBottom: 24 }}>
          <SectionHeader label="Account" />
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
              label="Change Password"
              onPress={() => handleComingSoon("Change Password")}
              testId="change-password"
            />
            <Divider />
            <ChevronRow
              icon={<Download size={15} color={colors.accent} />}
              label="Export Data"
              onPress={() => handleComingSoon("Export Data")}
              testId="export-data"
            />
          </Card>
        </Animated.View>

        {/* CONNECTED ACCOUNTS */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginBottom: 24 }}>
          <SectionHeader label="Connected Accounts" />
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
          <SectionHeader label="Danger Zone" />
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
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
