import React, { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

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
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#1A0A00", "#0A0A0A", "#0A0A0A"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400 }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo area */}
          <View style={{ alignItems: "center", marginBottom: 56 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: "#F59E0B",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                shadowColor: "#F59E0B",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 12,
              }}
            >
              <Text style={{ fontSize: 32, fontWeight: "800", color: "#0A0A0A" }}>O</Text>
            </View>
            <Text style={{ fontSize: 32, fontWeight: "700", color: "#FAFAFA", letterSpacing: -1, marginBottom: 8 }}>
              Opturna
            </Text>
            <Text style={{ fontSize: 16, color: "#71717A", textAlign: "center", lineHeight: 24 }}>
              The network for those who{"\n"}refuse to stay ordinary.
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#A1A1AA", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              placeholder="you@example.com"
              placeholderTextColor="#3F3F46"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              testID="email-input"
              style={{
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: error ? "#EF4444" : "#27272A",
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 16,
                color: "#FAFAFA",
                fontSize: 16,
              }}
            />
            {error ? (
              <Text style={{ color: "#EF4444", fontSize: 13, marginTop: 8 }}>{error}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={handleSendOTP}
            disabled={loading || !email.trim()}
            testID="continue-button"
            style={{
              backgroundColor: "#F59E0B",
              borderRadius: 14,
              paddingVertical: 17,
              alignItems: "center",
              opacity: loading || !email.trim() ? 0.6 : 1,
              shadowColor: "#F59E0B",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0A" testID="loading-indicator" />
            ) : (
              <Text style={{ color: "#0A0A0A", fontSize: 16, fontWeight: "700" }}>
                Continue with Email →
              </Text>
            )}
          </TouchableOpacity>

          <Text style={{ color: "#52525B", fontSize: 13, textAlign: "center", marginTop: 24, lineHeight: 20 }}>
            We'll send you a 6-digit code.{"\n"}No password needed.
          </Text>

          {/* Values */}
          <View style={{ marginTop: 56, gap: 16 }}>
            {[
              { icon: "🎯", text: "Track your goals and sprints" },
              { icon: "🔥", text: "Build accountability streaks" },
              { icon: "📚", text: "Learn from top creators" },
            ].map((item) => (
              <View key={item.text} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#1C1C1E", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 17 }}>{item.icon}</Text>
                </View>
                <Text style={{ color: "#71717A", fontSize: 14 }}>{item.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
