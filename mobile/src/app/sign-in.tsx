import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { authClient } from "@/lib/auth/auth-client";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

// Arc reactor ring: concentric circle with tick marks using Views only
function ArcReactorRing({
  size,
  color,
  tickCount,
  rotation,
  opacity = 1,
}: {
  size: number;
  color: string;
  tickCount: number;
  rotation: Animated.SharedValue<number>;
  opacity?: number;
}) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const ticks = Array.from({ length: tickCount });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: color,
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
          opacity,
        },
        animStyle,
      ]}
    >
      {ticks.map((_, i) => {
        const angle = (i / tickCount) * 360;
        const rad = (angle * Math.PI) / 180;
        const r = size / 2;
        // position tick on the circumference
        const tx = r + r * Math.sin(rad) - 1;
        const ty = r - r * Math.cos(rad) - 3;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              width: 2,
              height: 6,
              backgroundColor: color,
              left: tx,
              top: ty,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
    </Animated.View>
  );
}

function ArcReactor() {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const rot3 = useSharedValue(0);
  const rot4 = useSharedValue(0);
  const pulse = useSharedValue(0.7);

  useEffect(() => {
    rot1.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    rot2.value = withRepeat(
      withTiming(-360, { duration: 5000, easing: Easing.linear }),
      -1,
      false
    );
    rot3.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
    rot4.value = withRepeat(
      withTiming(-360, { duration: 3500, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const coreStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    shadowOpacity: pulse.value * 0.9,
  }));

  return (
    <View style={{ width: 160, height: 160, alignItems: "center", justifyContent: "center" }}>
      {/* Outer rings */}
      <ArcReactorRing size={160} color="#00B4D8" tickCount={24} rotation={rot3} opacity={0.3} />
      <ArcReactorRing size={130} color="#0096B4" tickCount={16} rotation={rot1} opacity={0.5} />
      <ArcReactorRing size={100} color="#00D4FF" tickCount={12} rotation={rot2} opacity={0.7} />
      <ArcReactorRing size={72} color="#00E5FF" tickCount={8} rotation={rot4} opacity={0.9} />

      {/* Inner solid ring */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          borderWidth: 2,
          borderColor: "#00E5FF",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
        }}
      >
        {/* Core glow */}
        <Animated.View
          style={[
            {
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "#00B4D8",
              shadowColor: "#00E5FF",
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 14,
              elevation: 10,
            },
            coreStyle,
          ]}
        />
      </View>
    </View>
  );
}

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });
      if (result.error) {
        setError(result.error.message || "Failed to send code. Try again.");
      } else {
        router.push({ pathname: "/verify-otp" as never, params: { email: email.trim().toLowerCase() } });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#020B18" }}>
      <StatusBar style="light" />

      {/* HUD grid overlay lines */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`h${i}`}
            style={{
              position: "absolute",
              top: i * 42,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: "#00B4D8",
            }}
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={`v${i}`}
            style={{
              position: "absolute",
              left: i * 36,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: "#00B4D8",
            }}
          />
        ))}
      </View>

      {/* Top corner brackets */}
      <View style={{ position: "absolute", top: 52, left: 20, width: 24, height: 24, borderTopWidth: 2, borderLeftWidth: 2, borderColor: "#00B4D8", opacity: 0.6 }} />
      <View style={{ position: "absolute", top: 52, right: 20, width: 24, height: 24, borderTopWidth: 2, borderRightWidth: 2, borderColor: "#00B4D8", opacity: 0.6 }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Arc Reactor Logo */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <ArcReactor />

            <Text
              style={{
                marginTop: 24,
                fontSize: 28,
                fontWeight: "800",
                color: "#C8E8FF",
                letterSpacing: 6,
                textTransform: "uppercase",
              }}
            >
              OPTURNA
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "#4A7A99",
                letterSpacing: 3,
                fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
                textTransform: "uppercase",
              }}
            >
              JARVIS INTERFACE v4.2
            </Text>

            {/* Divider bar */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, width: "80%" }}>
              <View style={{ flex: 1, height: 1, backgroundColor: "#00B4D8", opacity: 0.3 }} />
              <View style={{ width: 6, height: 6, backgroundColor: "#00B4D8", marginHorizontal: 8, opacity: 0.7 }} />
              <View style={{ flex: 1, height: 1, backgroundColor: "#00B4D8", opacity: 0.3 }} />
            </View>
          </View>

          {/* Form */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "#4A7A99",
                marginBottom: 8,
                letterSpacing: 3,
                textTransform: "uppercase",
                fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
              }}
            >
              ACCESS CREDENTIALS
            </Text>
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              placeholder="AGENT EMAIL ADDRESS"
              placeholderTextColor="#1E4060"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              testID="email-input"
              style={{
                backgroundColor: "#041525",
                borderWidth: 1,
                borderColor: error ? "#FF3B30" : "#00B4D8",
                borderRadius: 0,
                paddingHorizontal: 16,
                paddingVertical: 16,
                color: "#C8E8FF",
                fontSize: 13,
                letterSpacing: 2,
                fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
              }}
            />
            {error ? (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                <View style={{ width: 6, height: 6, backgroundColor: "#FF3B30", marginRight: 8 }} />
                <Text
                  style={{
                    color: "#FF3B30",
                    fontSize: 11,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
                  }}
                >
                  {error}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Corner-bracket wrapper for button */}
          <View style={{ marginBottom: 20 }}>
            {/* Top-left bracket */}
            <View style={{ position: "absolute", top: -4, left: -4, width: 12, height: 12, borderTopWidth: 2, borderLeftWidth: 2, borderColor: "#FF3B30", zIndex: 1 }} />
            {/* Top-right bracket */}
            <View style={{ position: "absolute", top: -4, right: -4, width: 12, height: 12, borderTopWidth: 2, borderRightWidth: 2, borderColor: "#FF3B30", zIndex: 1 }} />
            {/* Bottom-left bracket */}
            <View style={{ position: "absolute", bottom: -4, left: -4, width: 12, height: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: "#FF3B30", zIndex: 1 }} />
            {/* Bottom-right bracket */}
            <View style={{ position: "absolute", bottom: -4, right: -4, width: 12, height: 12, borderBottomWidth: 2, borderRightWidth: 2, borderColor: "#FF3B30", zIndex: 1 }} />

            <TouchableOpacity
              onPress={handleSendOTP}
              disabled={loading || !email.trim()}
              testID="continue-button"
              style={{
                backgroundColor: "#FF3B30",
                borderRadius: 0,
                paddingVertical: 17,
                alignItems: "center",
                opacity: loading || !email.trim() ? 0.5 : 1,
                shadowColor: "#FF3B30",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#020B18" testID="loading-indicator" />
              ) : (
                <Text
                  style={{
                    color: "#020B18",
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 4,
                    textTransform: "uppercase",
                    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
                  }}
                >
                  INITIALIZE ACCESS
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text
            style={{
              color: "#4A7A99",
              fontSize: 9,
              textAlign: "center",
              letterSpacing: 3,
              textTransform: "uppercase",
              fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
            }}
          >
            SECURE ENCRYPTED LOGIN
          </Text>

          {/* Bottom status bar */}
          <View style={{ marginTop: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#00B4D8" }} />
              <Text
                style={{
                  color: "#1E4060",
                  fontSize: 9,
                  letterSpacing: 2,
                  fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
                }}
              >
                SYSTEM ONLINE
              </Text>
            </View>
            <Text
              style={{
                color: "#1E4060",
                fontSize: 9,
                letterSpacing: 2,
                fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
              }}
            >
              AUTH MODULE v4.2
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom corner brackets */}
      <View style={{ position: "absolute", bottom: 32, left: 20, width: 24, height: 24, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: "#00B4D8", opacity: 0.6 }} />
      <View style={{ position: "absolute", bottom: 32, right: 20, width: 24, height: 24, borderBottomWidth: 2, borderRightWidth: 2, borderColor: "#00B4D8", opacity: 0.6 }} />
    </View>
  );
}
