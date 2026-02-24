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
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <StatusBar style="light" />
      <View style={{ flex: 1, padding: 24, paddingTop: 80 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          testID="back-button"
          style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#1C1C1E", alignItems: "center", justifyContent: "center", marginBottom: 40 }}
        >
          <ArrowLeft size={20} color="#FAFAFA" />
        </TouchableOpacity>

        <Text style={{ fontSize: 28, fontWeight: "700", color: "#FAFAFA", letterSpacing: -0.5, marginBottom: 10 }}>
          Check your inbox
        </Text>
        <Text style={{ fontSize: 16, color: "#71717A", marginBottom: 8, lineHeight: 24 }}>
          We sent a 6-digit code to
        </Text>
        <Text style={{ fontSize: 16, color: "#F59E0B", fontWeight: "600", marginBottom: 48 }}>
          {email}
        </Text>

        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }} testID="loading-indicator">
            <ActivityIndicator color="#F59E0B" size="large" />
            <Text style={{ color: "#71717A", marginTop: 16, fontSize: 14 }}>Verifying...</Text>
          </View>
        ) : (
          <OtpInput
            numberOfDigits={6}
            onFilled={handleVerifyOTP}
            type="numeric"
            focusColor="#F59E0B"
            theme={{
              containerStyle: { gap: 10 },
              pinCodeContainerStyle: {
                flex: 1,
                height: 60,
                borderRadius: 14,
                backgroundColor: "#141414",
                borderWidth: 1.5,
                borderColor: "#27272A",
              },
              pinCodeTextStyle: {
                color: "#FAFAFA",
                fontSize: 22,
                fontWeight: "700",
              },
              focusedPinCodeContainerStyle: {
                borderColor: "#F59E0B",
              },
            }}
          />
        )}

        {error ? (
          <Text style={{ color: "#EF4444", fontSize: 14, marginTop: 20, textAlign: "center" }}>
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 32, alignItems: "center" }}
        >
          <Text style={{ color: "#71717A", fontSize: 14 }}>
            Didn't receive it?{" "}
            <Text style={{ color: "#F59E0B", fontWeight: "600" }}>Resend code</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
