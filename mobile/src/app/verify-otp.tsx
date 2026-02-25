import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { OtpInput } from "react-native-otp-entry";
import { authClient } from "@/lib/auth/auth-client";
import { useInvalidateSession } from "@/lib/auth/use-session";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";

const MONO: string = Platform.OS === "ios" ? "Courier New" : "monospace";

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
    <View style={{ flex: 1, backgroundColor: "#020B18" }}>
      <StatusBar style="light" />

      {/* HUD grid overlay */}
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

      {/* Bottom corner brackets */}
      <View style={{ position: "absolute", bottom: 32, left: 20, width: 24, height: 24, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: "#00B4D8", opacity: 0.6 }} />
      <View style={{ position: "absolute", bottom: 32, right: 20, width: 24, height: 24, borderBottomWidth: 2, borderRightWidth: 2, borderColor: "#00B4D8", opacity: 0.6 }} />

      <View style={{ flex: 1, padding: 24, paddingTop: 80 }}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          testID="back-button"
          style={{
            width: 44,
            height: 44,
            borderWidth: 1,
            borderColor: "#00B4D8",
            borderRadius: 0,
            backgroundColor: "#041525",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <ArrowLeft size={18} color="#00B4D8" />
        </TouchableOpacity>

        {/* Header */}
        <View style={{ marginBottom: 48 }}>
          {/* Scan line accent */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 20, height: 2, backgroundColor: "#00B4D8", marginRight: 8 }} />
            <Text
              style={{
                fontSize: 9,
                color: "#4A7A99",
                letterSpacing: 3,
                fontFamily: MONO,
                textTransform: "uppercase",
              }}
            >
              IDENTITY VERIFICATION
            </Text>
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: "#C8E8FF",
              letterSpacing: 4,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            VERIFY IDENTITY
          </Text>

          <Text
            style={{
              fontSize: 11,
              color: "#4A7A99",
              letterSpacing: 2,
              fontFamily: MONO,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            ENTER AUTHORIZATION CODE
          </Text>

          {/* Email display */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#041525",
              borderWidth: 1,
              borderColor: "#0D3352",
              borderRadius: 0,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <View style={{ width: 6, height: 6, backgroundColor: "#00B4D8", marginRight: 10, opacity: 0.8 }} />
            <Text
              style={{
                fontSize: 12,
                color: "#00B4D8",
                letterSpacing: 1,
                fontFamily: MONO,
              }}
            >
              {email}
            </Text>
          </View>
        </View>

        {/* OTP input or loading */}
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }} testID="loading-indicator">
            {/* Scanning animation frame */}
            <View
              style={{
                width: 80,
                height: 80,
                borderWidth: 1,
                borderColor: "#00B4D8",
                borderRadius: 0,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <View style={{ position: "absolute", top: -1, left: -1, width: 12, height: 12, borderTopWidth: 2, borderLeftWidth: 2, borderColor: "#00B4D8" }} />
              <View style={{ position: "absolute", top: -1, right: -1, width: 12, height: 12, borderTopWidth: 2, borderRightWidth: 2, borderColor: "#00B4D8" }} />
              <View style={{ position: "absolute", bottom: -1, left: -1, width: 12, height: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: "#00B4D8" }} />
              <View style={{ position: "absolute", bottom: -1, right: -1, width: 12, height: 12, borderBottomWidth: 2, borderRightWidth: 2, borderColor: "#00B4D8" }} />
              <ActivityIndicator color="#00B4D8" size="large" />
            </View>
            <Text
              style={{
                color: "#4A7A99",
                fontSize: 10,
                letterSpacing: 3,
                fontFamily: MONO,
                textTransform: "uppercase",
              }}
            >
              AUTHENTICATING...
            </Text>
          </View>
        ) : (
          <OtpInput
            numberOfDigits={6}
            onFilled={handleVerifyOTP}
            type="numeric"
            focusColor="#00B4D8"
            theme={{
              containerStyle: { gap: 8 },
              pinCodeContainerStyle: {
                flex: 1,
                height: 64,
                borderRadius: 0,
                backgroundColor: "#041525",
                borderWidth: 1,
                borderColor: "#0D3352",
              },
              pinCodeTextStyle: {
                color: "#C8E8FF",
                fontSize: 22,
                fontWeight: "700",
                fontFamily: MONO,
              },
              focusedPinCodeContainerStyle: {
                borderColor: "#00B4D8",
                backgroundColor: "#051E36",
              },
            }}
          />
        )}

        {error ? (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>
            <View style={{ width: 6, height: 6, backgroundColor: "#FF3B30", marginRight: 8 }} />
            <Text
              style={{
                color: "#FF3B30",
                fontSize: 11,
                letterSpacing: 1.5,
                fontFamily: MONO,
                textTransform: "uppercase",
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {/* Resend */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 36, alignItems: "center" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "#0D3352" }} />
            <Text
              style={{
                color: "#4A7A99",
                fontSize: 10,
                letterSpacing: 2,
                fontFamily: MONO,
                textTransform: "uppercase",
              }}
            >
              CODE NOT RECEIVED?{" "}
              <Text style={{ color: "#00B4D8", fontWeight: "700" }}>RESEND</Text>
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#0D3352" }} />
          </View>
        </TouchableOpacity>

        {/* Bottom status */}
        <View style={{ marginTop: 48, flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#00B4D8", opacity: 0.7 }} />
            <Text style={{ color: "#1E4060", fontSize: 9, letterSpacing: 2, fontFamily: MONO }}>
              CHANNEL SECURE
            </Text>
          </View>
          <Text style={{ color: "#1E4060", fontSize: 9, letterSpacing: 2, fontFamily: MONO }}>
            OTP MODULE v4.2
          </Text>
        </View>
      </View>
    </View>
  );
}
