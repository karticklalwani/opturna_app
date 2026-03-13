import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
  FadeIn,
  Easing,
} from "react-native-reanimated";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ChevronRight,
} from "lucide-react-native";
import { authClient } from "@/lib/auth/auth-client";
import { useInvalidateSession } from "@/lib/auth/use-session";

// ─── Animated Pressable ────────────────────────────────────────────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Types ─────────────────────────────────────────────────────────────────
type Mode = "login" | "register";

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  keyboardType?: "default" | "email-address";
  autoComplete?: "email" | "name" | "password" | "new-password" | "off";
  isPassword?: boolean;
  error?: string | null;
  testID?: string;
  icon: React.ReactNode;
  returnKeyType?: "next" | "done" | "go";
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}

// ─── Input Field Component ─────────────────────────────────────────────────
function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "none",
  keyboardType = "default",
  autoComplete = "off",
  isPassword = false,
  error,
  testID,
  icon,
  returnKeyType = "next",
  onSubmitEditing,
  inputRef,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderColor = error ? "#EF4444" : focused ? "#4ADE80" : "#2A2A2A";

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: focused ? "#4ADE80" : "#666",
          marginBottom: 8,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#141414",
          borderWidth: 1,
          borderColor,
          borderRadius: 12,
          paddingHorizontal: 14,
        }}
      >
        <View style={{ opacity: focused ? 1 : 0.4, marginRight: 10 }}>
          {icon}
        </View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#3A3A3A"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          secureTextEntry={isPassword ? !showPassword : false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          testID={testID}
          style={{
            flex: 1,
            color: "#F5F5F5",
            fontSize: 15,
            paddingVertical: 15,
            fontWeight: "400",
          }}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setShowPassword((s) => !s)}
            hitSlop={8}
            testID={`${testID}-toggle`}
          >
            {showPassword ? (
              <Eye size={18} color="#555" />
            ) : (
              <EyeOff size={18} color="#555" />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          style={{
            marginTop: 6,
            color: "#EF4444",
            fontSize: 12,
            fontWeight: "500",
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Primary Button ────────────────────────────────────────────────────────
function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  testID?: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.4 : 1,
  }));

  return (
    <AnimatedPressable
      style={[animStyle, { marginTop: 8 }]}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <LinearGradient
        colors={["#5BEF90", "#4ADE80", "#38C96A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 52,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#080808" testID="loading-indicator" />
        ) : (
          <>
            <Text
              style={{
                color: "#050505",
                fontWeight: "800",
                fontSize: 16,
                letterSpacing: 0.5,
              }}
            >
              {label}
            </Text>
            <ChevronRight size={18} color="#050505" strokeWidth={3} />
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

// ─── Social Button ─────────────────────────────────────────────────────────
function SocialButton({
  label,
  onPress,
  logo,
  borderColors,
  testID,
}: {
  label: string;
  onPress: () => void;
  logo: React.ReactNode;
  borderColors?: string[];
  testID?: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const inner = (
    <View
      style={{
        height: 50,
        borderRadius: 12,
        backgroundColor: "#141414",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      {logo}
      <Text
        style={{
          color: "#D4D4D4",
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <AnimatedPressable
      style={[animStyle, { marginBottom: 10 }]}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={onPress}
      testID={testID}
    >
      {borderColors && borderColors.length > 1 ? (
        <LinearGradient
          colors={borderColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 13, padding: 1 }}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#2A2A2A",
            borderRadius: 13,
          }}
        >
          {inner}
        </View>
      )}
    </AnimatedPressable>
  );
}

// ─── Google Logo ───────────────────────────────────────────────────────────
function GoogleLogoColored() {
  return (
    <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 15, fontWeight: "900" }}>
        <Text style={{ color: "#4285F4" }}>G</Text>
        <Text style={{ color: "#EA4335" }}>o</Text>
        <Text style={{ color: "#FBBC05" }}>o</Text>
        <Text style={{ color: "#4285F4" }}>g</Text>
        <Text style={{ color: "#34A853" }}>l</Text>
        <Text style={{ color: "#EA4335" }}>e</Text>
      </Text>
    </View>
  );
}

// ─── TikTok Logo ───────────────────────────────────────────────────────────
function TikTokLogo() {
  return (
    <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "relative", width: 18, height: 18 }}>
        <Text style={{ fontSize: 11, fontWeight: "900", color: "#EE1D52", position: "absolute", top: 1, left: 1 }}>
          ♪
        </Text>
        <Text style={{ fontSize: 11, fontWeight: "900", color: "#69C9D0", position: "absolute", top: -1, left: -1 }}>
          ♪
        </Text>
        <Text style={{ fontSize: 11, fontWeight: "900", color: "#ffffff" }}>
          ♪
        </Text>
      </View>
    </View>
  );
}

// ─── Instagram Logo ────────────────────────────────────────────────────────
function InstagramLogo() {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
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
          width: 12,
          height: 12,
          borderRadius: 3,
          borderWidth: 1.5,
          borderColor: "#fff",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 5.5,
          left: 5.5,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          borderWidth: 1.5,
          borderColor: "#fff",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 2,
          height: 2,
          borderRadius: 1,
          backgroundColor: "#fff",
        }}
      />
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function SignIn() {
  const [mode, setMode] = useState<Mode>("login");
  const invalidateSession = useInvalidateSession();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginEmailError, setLoginEmailError] = useState<string | null>(null);
  const [loginPasswordError, setLoginPasswordError] = useState<string | null>(null);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regNameError, setRegNameError] = useState<string | null>(null);
  const [regEmailError, setRegEmailError] = useState<string | null>(null);
  const [regPasswordError, setRegPasswordError] = useState<string | null>(null);
  const [regConfirmError, setRegConfirmError] = useState<string | null>(null);

  // Refs for focus chain
  const loginPasswordRef = useRef<TextInput>(null);
  const regEmailRef = useRef<TextInput>(null);
  const regPasswordRef = useRef<TextInput>(null);
  const regConfirmRef = useRef<TextInput>(null);

  // Tab animation
  const tabProgress = useSharedValue(0);
  const loginTabStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      tabProgress.value === 0 ? "#1E1E1E" : "transparent",
      { duration: 200 }
    ),
  }));
  const registerTabStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      tabProgress.value === 1 ? "#1E1E1E" : "transparent",
      { duration: 200 }
    ),
  }));
  const loginTabTextStyle = useAnimatedStyle(() => ({
    color: withTiming(tabProgress.value === 0 ? "#F5F5F5" : "#555", { duration: 200 }),
  }));
  const registerTabTextStyle = useAnimatedStyle(() => ({
    color: withTiming(tabProgress.value === 1 ? "#F5F5F5" : "#555", { duration: 200 }),
  }));

  const switchMode = useCallback(
    (m: Mode) => {
      Haptics.selectionAsync();
      setMode(m);
      tabProgress.value = m === "login" ? 0 : 1;
      // Clear errors on switch
      setLoginError(null);
      setLoginEmailError(null);
      setLoginPasswordError(null);
      setRegError(null);
      setRegNameError(null);
      setRegEmailError(null);
      setRegPasswordError(null);
      setRegConfirmError(null);
    },
    [tabProgress]
  );

  // ── Login submit ───────────────────────────────────────────────────────
  const handleLogin = async () => {
    let valid = true;
    setLoginError(null);
    setLoginEmailError(null);
    setLoginPasswordError(null);

    if (!loginEmail.trim() || !loginEmail.includes("@")) {
      setLoginEmailError("Ingresa un email válido");
      valid = false;
    }
    if (!loginPassword || loginPassword.length < 1) {
      setLoginPasswordError("Ingresa tu contraseña");
      valid = false;
    }
    if (!valid) return;

    setLoginLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
      if (result.error) {
        const msg = result.error.message ?? "";
        if (
          msg.toLowerCase().includes("invalid") ||
          msg.toLowerCase().includes("password") ||
          msg.toLowerCase().includes("credentials")
        ) {
          setLoginError("Email o contraseña incorrectos");
        } else if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("user")) {
          setLoginError("No encontramos una cuenta con ese email");
        } else {
          setLoginError(msg || "Algo salió mal. Intenta de nuevo.");
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await invalidateSession();
      }
    } catch {
      setLoginError("Algo salió mal. Intenta de nuevo.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Register submit ────────────────────────────────────────────────────
  const handleRegister = async () => {
    let valid = true;
    setRegError(null);
    setRegNameError(null);
    setRegEmailError(null);
    setRegPasswordError(null);
    setRegConfirmError(null);

    if (!regName.trim() || regName.trim().length < 2) {
      setRegNameError("Ingresa tu nombre completo");
      valid = false;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setRegEmailError("Ingresa un email válido");
      valid = false;
    }
    if (!regPassword || regPassword.length < 8) {
      setRegPasswordError("La contraseña debe tener al menos 8 caracteres");
      valid = false;
    }
    if (regPassword !== regConfirm) {
      setRegConfirmError("Las contraseñas no coinciden");
      valid = false;
    }
    if (!valid) return;

    setRegLoading(true);
    try {
      const result = await authClient.signUp.email({
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        name: regName.trim(),
      });
      if (result.error) {
        const msg = result.error.message ?? "";
        if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exist")) {
          setRegError("El email ya está registrado. Inicia sesión.");
        } else {
          setRegError(msg || "No se pudo crear la cuenta. Intenta de nuevo.");
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await invalidateSession();
      }
    } catch {
      setRegError("Algo salió mal. Intenta de nuevo.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRegLoading(false);
    }
  };

  // ── Social handler ─────────────────────────────────────────────────────
  const handleSocial = (provider: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Próximamente", `El inicio de sesión con ${provider} estará disponible muy pronto.`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero Section ─────────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(0).duration(700).easing(Easing.out(Easing.exp))}
            style={{
              alignItems: "center",
              paddingTop: 80,
              paddingBottom: 40,
              paddingHorizontal: 24,
            }}
          >
            {/* Glow behind wordmark */}
            <View
              style={{
                position: "absolute",
                top: 60,
                width: 200,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#4ADE80",
                opacity: 0.07,
                shadowColor: "#4ADE80",
                shadowOpacity: 1,
                shadowRadius: 60,
                shadowOffset: { width: 0, height: 0 },
              }}
            />

            {/* Wordmark */}
            <LinearGradient
              colors={["#FFFFFF", "#A3A3A3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ marginBottom: 10 }}
            >
              <Text
                style={{
                  fontSize: 52,
                  fontWeight: "900",
                  letterSpacing: -2.5,
                  color: "transparent",
                  // LinearGradient wraps it, so it renders white→gray
                }}
              >
                OPTURNA
              </Text>
            </LinearGradient>

            {/* Accent dot + tagline */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: "#4ADE80",
                  shadowColor: "#4ADE80",
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
                }}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  letterSpacing: 1.5,
                  fontWeight: "500",
                  textTransform: "uppercase",
                }}
              >
                La red de los ambiciosos
              </Text>
            </View>
          </Animated.View>

          {/* ── Card Container ────────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(700).easing(Easing.out(Easing.exp))}
            style={{
              marginHorizontal: 16,
              backgroundColor: "#0E0E0E",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#1C1C1C",
              overflow: "hidden",
              shadowColor: "#000",
              shadowOpacity: 0.5,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            {/* Tab Switcher */}
            <View
              style={{
                flexDirection: "row",
                margin: 6,
                backgroundColor: "#080808",
                borderRadius: 14,
                padding: 4,
              }}
            >
              <AnimatedPressable
                style={[
                  loginTabStyle,
                  {
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 11,
                    alignItems: "center",
                  },
                ]}
                onPress={() => switchMode("login")}
                testID="tab-login"
              >
                <Animated.Text
                  style={[
                    loginTabTextStyle,
                    { fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },
                  ]}
                >
                  Iniciar Sesión
                </Animated.Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={[
                  registerTabStyle,
                  {
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 11,
                    alignItems: "center",
                  },
                ]}
                onPress={() => switchMode("register")}
                testID="tab-register"
              >
                <Animated.Text
                  style={[
                    registerTabTextStyle,
                    { fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },
                  ]}
                >
                  Crear Cuenta
                </Animated.Text>
              </AnimatedPressable>
            </View>

            {/* Form Content */}
            <View style={{ padding: 20 }}>
              {mode === "login" ? (
                <Animated.View
                  key="login-form"
                  entering={FadeInDown.duration(300).easing(Easing.out(Easing.quad))}
                >
                  {/* Login Fields */}
                  <InputField
                    label="Email"
                    value={loginEmail}
                    onChangeText={(v) => { setLoginEmail(v); setLoginEmailError(null); setLoginError(null); }}
                    placeholder="tu@email.com"
                    keyboardType="email-address"
                    autoComplete="email"
                    error={loginEmailError}
                    testID="login-email-input"
                    icon={<Mail size={16} color="#4ADE80" />}
                    returnKeyType="next"
                    onSubmitEditing={() => loginPasswordRef.current?.focus()}
                  />
                  <InputField
                    label="Contraseña"
                    value={loginPassword}
                    onChangeText={(v) => { setLoginPassword(v); setLoginPasswordError(null); setLoginError(null); }}
                    placeholder="••••••••"
                    autoComplete="password"
                    isPassword
                    error={loginPasswordError}
                    testID="login-password-input"
                    icon={<Lock size={16} color="#4ADE80" />}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    inputRef={loginPasswordRef}
                  />

                  {/* Forgot password */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: "/verify-otp" as never, params: { email: loginEmail.trim().toLowerCase(), forgotPassword: "true" } });
                    }}
                    style={{ alignSelf: "flex-end", marginBottom: 20, marginTop: -4 }}
                    testID="forgot-password-link"
                  >
                    <Text style={{ color: "#4ADE80", fontSize: 13, fontWeight: "600" }}>
                      ¿Olvidaste tu contraseña?
                    </Text>
                  </Pressable>

                  {/* Global login error */}
                  {loginError ? (
                    <View
                      style={{
                        backgroundColor: "#1A0A0A",
                        borderWidth: 1,
                        borderColor: "#3A1212",
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        marginBottom: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#EF4444" }} />
                      <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "500", flex: 1 }}>
                        {loginError}
                      </Text>
                    </View>
                  ) : null}

                  <PrimaryButton
                    label="ENTRAR"
                    onPress={handleLogin}
                    loading={loginLoading}
                    disabled={loginLoading}
                    testID="login-submit-button"
                  />
                </Animated.View>
              ) : (
                <Animated.View
                  key="register-form"
                  entering={FadeInDown.duration(300).easing(Easing.out(Easing.quad))}
                >
                  {/* Register Fields */}
                  <InputField
                    label="Nombre completo"
                    value={regName}
                    onChangeText={(v) => { setRegName(v); setRegNameError(null); setRegError(null); }}
                    placeholder="Tu nombre"
                    autoCapitalize="words"
                    autoComplete="name"
                    error={regNameError}
                    testID="register-name-input"
                    icon={<User size={16} color="#4ADE80" />}
                    returnKeyType="next"
                    onSubmitEditing={() => regEmailRef.current?.focus()}
                  />
                  <InputField
                    label="Email"
                    value={regEmail}
                    onChangeText={(v) => { setRegEmail(v); setRegEmailError(null); setRegError(null); }}
                    placeholder="tu@email.com"
                    keyboardType="email-address"
                    autoComplete="email"
                    error={regEmailError}
                    testID="register-email-input"
                    icon={<Mail size={16} color="#4ADE80" />}
                    returnKeyType="next"
                    onSubmitEditing={() => regPasswordRef.current?.focus()}
                    inputRef={regEmailRef}
                  />
                  <InputField
                    label="Contraseña"
                    value={regPassword}
                    onChangeText={(v) => { setRegPassword(v); setRegPasswordError(null); setRegError(null); }}
                    placeholder="Mín. 8 caracteres"
                    autoComplete="new-password"
                    isPassword
                    error={regPasswordError}
                    testID="register-password-input"
                    icon={<Lock size={16} color="#4ADE80" />}
                    returnKeyType="next"
                    onSubmitEditing={() => regConfirmRef.current?.focus()}
                    inputRef={regPasswordRef}
                  />
                  <InputField
                    label="Confirmar contraseña"
                    value={regConfirm}
                    onChangeText={(v) => { setRegConfirm(v); setRegConfirmError(null); setRegError(null); }}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    isPassword
                    error={regConfirmError}
                    testID="register-confirm-input"
                    icon={<Lock size={16} color="#4ADE80" />}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    inputRef={regConfirmRef}
                  />

                  {/* Global register error */}
                  {regError ? (
                    <View
                      style={{
                        backgroundColor: "#1A0A0A",
                        borderWidth: 1,
                        borderColor: "#3A1212",
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        marginBottom: 16,
                        marginTop: 4,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#EF4444" }} />
                      <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "500", flex: 1 }}>
                        {regError}
                      </Text>
                    </View>
                  ) : null}

                  <PrimaryButton
                    label="CREAR CUENTA"
                    onPress={handleRegister}
                    loading={regLoading}
                    disabled={regLoading}
                    testID="register-submit-button"
                  />
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* ── Divider ───────────────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(600)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 24,
              marginVertical: 24,
              gap: 12,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: "#1E1E1E" }} />
            <Text style={{ color: "#3A3A3A", fontSize: 12, fontWeight: "600", letterSpacing: 1 }}>
              O CONTINÚA CON
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#1E1E1E" }} />
          </Animated.View>

          {/* ── Social Buttons ────────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={{ paddingHorizontal: 16 }}
          >
            <SocialButton
              label="Continuar con Google"
              onPress={() => handleSocial("Google")}
              logo={<GoogleLogoColored />}
              testID="google-button"
            />
            <SocialButton
              label="Continuar con TikTok"
              onPress={() => handleSocial("TikTok")}
              logo={<TikTokLogo />}
              testID="tiktok-button"
            />
            <SocialButton
              label="Continuar con Instagram"
              onPress={() => handleSocial("Instagram")}
              logo={<InstagramLogo />}
              borderColors={["#833AB4", "#FD1D1D", "#F77737"]}
              testID="instagram-button"
            />
          </Animated.View>

          {/* ── OTP Option ────────────────────────────────────────────── */}
          <Animated.View
            entering={FadeIn.delay(500).duration(500)}
            style={{ alignItems: "center", marginTop: 20, paddingHorizontal: 24 }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/verify-otp" as never, params: { email: mode === "login" ? loginEmail.trim().toLowerCase() : regEmail.trim().toLowerCase() } });
              }}
              testID="otp-link"
            >
              <Text style={{ color: "#3A3A3A", fontSize: 13, textAlign: "center" }}>
                Acceder con{" "}
                <Text style={{ color: "#555", fontWeight: "600", textDecorationLine: "underline" }}>
                  código por email
                </Text>
              </Text>
            </Pressable>
          </Animated.View>

          {/* ── Legal Footer ──────────────────────────────────────────── */}
          <Animated.View
            entering={FadeIn.delay(600).duration(500)}
            style={{ alignItems: "center", marginTop: 28, paddingHorizontal: 32 }}
          >
            <Text
              style={{
                color: "#2E2E2E",
                fontSize: 11,
                textAlign: "center",
                lineHeight: 17,
              }}
            >
              Al continuar, aceptas nuestros{" "}
              <Text style={{ color: "#3D3D3D", textDecorationLine: "underline" }}>Términos de Servicio</Text>
              {" "}y{" "}
              <Text style={{ color: "#3D3D3D", textDecorationLine: "underline" }}>Política de Privacidad</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
