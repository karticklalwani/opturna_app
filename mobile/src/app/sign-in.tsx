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
import { StatusBar } from "expo-status-bar";

export default function SignIn() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<boolean>(false);

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

  const isDisabled = loading || !email.trim();

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top half: wordmark + tagline */}
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: 48,
              paddingHorizontal: 32,
            }}
          >
            <Text
              style={{
                fontSize: 56,
                fontWeight: "800",
                color: "#F5F5F5",
                letterSpacing: -2,
                textAlign: "center",
              }}
            >
              OPTURNA
            </Text>
            <Text
              style={{
                marginTop: 12,
                fontSize: 16,
                color: "#737373",
                textAlign: "center",
                letterSpacing: 0.2,
              }}
            >
              Your ambition, amplified.
            </Text>
          </View>

          {/* Thin separator */}
          <View
            style={{
              height: 1,
              backgroundColor: "#1F1F1F",
              marginHorizontal: 0,
            }}
          />

          {/* Bottom half: form */}
          <View
            style={{
              flex: 1,
              paddingHorizontal: 24,
              paddingTop: 40,
              paddingBottom: 40,
              justifyContent: "space-between",
            }}
          >
            <View>
              {/* Email field */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: "#737373",
                    marginBottom: 10,
                    letterSpacing: 0.5,
                  }}
                >
                  Email address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(null); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="you@example.com"
                  placeholderTextColor="#404040"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  testID="email-input"
                  style={{
                    backgroundColor: "#0F0F0F",
                    borderWidth: 1,
                    borderColor: error ? "#EF4444" : focused ? "#4ADE80" : "#1F1F1F",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 15,
                    color: "#F5F5F5",
                    fontSize: 15,
                  }}
                />
                {error ? (
                  <Text
                    style={{
                      marginTop: 8,
                      color: "#EF4444",
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </Text>
                ) : null}
              </View>

              {/* CTA button */}
              <TouchableOpacity
                onPress={handleSendOTP}
                disabled={isDisabled}
                testID="continue-button"
                style={{
                  backgroundColor: "#4ADE80",
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: isDisabled ? 0.4 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#080808" testID="loading-indicator" />
                ) : (
                  <Text
                    style={{
                      color: "#080808",
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    Continue
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Legal footer */}
            <Text
              style={{
                color: "#404040",
                fontSize: 11,
                textAlign: "center",
                lineHeight: 16,
                marginTop: 32,
              }}
            >
              By continuing, you agree to our Terms & Privacy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
