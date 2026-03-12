import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { OtpInput } from "react-native-otp-entry";
import { authClient } from "@/lib/auth/auth-client";
import { useInvalidateSession } from "@/lib/auth/use-session";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";

export default function VerifyOTP() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalidateSession = useInvalidateSession();

  const handleVerifyOTP = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp,
      });
      if (result.error) {
        setError(result.error.message || "Invalid code. Try again.");
        setLoading(false);
      } else {
        await invalidateSession();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      <StatusBar style="light" />

      <View style={{ flex: 1, padding: 24, paddingTop: 72 }}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          testID="back-button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "#0F0F0F",
            borderWidth: 1,
            borderColor: "#1F1F1F",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 48,
          }}
        >
          <ArrowLeft size={18} color="#A3A3A3" />
        </TouchableOpacity>

        {/* Header */}
        <View style={{ marginBottom: 48 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: "#F5F5F5",
              letterSpacing: -1,
              marginBottom: 8,
            }}
          >
            Check your{"\n"}email
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: "#737373",
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            We sent a 6-digit code to
          </Text>

          {/* Email display */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#0F0F0F",
              borderWidth: 1,
              borderColor: "#1F1F1F",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80", marginRight: 10 }} />
            <Text
              style={{
                fontSize: 14,
                color: "#F5F5F5",
                fontWeight: "500",
              }}
            >
              {email}
            </Text>
          </View>
        </View>

        {/* OTP input or loading */}
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }} testID="loading-indicator">
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: "#0F0F0F",
                borderWidth: 1,
                borderColor: "#4ADE8030",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <ActivityIndicator color="#4ADE80" size="large" />
            </View>
            <Text
              style={{
                color: "#737373",
                fontSize: 13,
                fontWeight: "500",
              }}
            >
              Verifying...
            </Text>
          </View>
        ) : (
          <OtpInput
            numberOfDigits={6}
            onFilled={handleVerifyOTP}
            type="numeric"
            focusColor="#4ADE80"
            theme={{
              containerStyle: { gap: 8 },
              pinCodeContainerStyle: {
                flex: 1,
                height: 64,
                borderRadius: 12,
                backgroundColor: "#0F0F0F",
                borderWidth: 1,
                borderColor: "#1F1F1F",
              },
              pinCodeTextStyle: {
                color: "#F5F5F5",
                fontSize: 22,
                fontWeight: "700",
              },
              focusedPinCodeContainerStyle: {
                borderColor: "#4ADE80",
                backgroundColor: "#0F0F0F",
              },
            }}
          />
        )}

        {error ? (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16, gap: 8 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#EF4444" }} />
            <Text
              style={{
                color: "#EF4444",
                fontSize: 13,
                fontWeight: "500",
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {/* Resend */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 32, alignItems: "center" }}
        >
          <Text
            style={{
              color: "#737373",
              fontSize: 13,
            }}
          >
            Didn't receive a code?{" "}
            <Text style={{ color: "#4ADE80", fontWeight: "600" }}>Resend</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
