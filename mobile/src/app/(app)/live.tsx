import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, Modal, TextInput,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Radio, Calendar, Users, X, Play, Clock, Trash2 } from "lucide-react-native";
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from "react-native-reanimated";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/auth/use-session";

const HUD_BG = "#020B18";
const HUD_CARD = "#041525";
const HUD_ACCENT = "#00B4D8";
const HUD_RED = "#FF3B30";
const HUD_TEXT = "#C8E8FF";
const HUD_TEXT_DIM = "#7DB8D9";
const HUD_BORDER = "#0A2A40";

interface LiveItem {
  id: string;
  title: string;
  host: string;
  viewers: number;
  isLive: boolean;
  category: string;
  startedAt?: string;
  scheduledAt?: string;
}

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: 8, height: 8, borderRadius: 4, backgroundColor: color },
        animStyle,
      ]}
    />
  );
}

function BroadcastingBadge() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: "rgba(255,59,48,0.15)",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: HUD_RED,
        },
        animStyle,
      ]}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: HUD_RED }} />
      <Text style={{ color: HUD_RED, fontWeight: "700", fontSize: 12, letterSpacing: 2 }}>
        BROADCASTING
      </Text>
    </Animated.View>
  );
}

export default function LiveScreen() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const [showStartLive, setShowStartLive] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [lives, setLives] = useState<LiveItem[]>([]);

  const activeLives = lives.filter(l => l.isLive);
  const scheduledLives = lives.filter(l => !l.isLive);

  const handleGoLive = () => {
    if (!liveTitle.trim()) return;
    setIsStreaming(true);
    setTimeout(() => {
      const newLive: LiveItem = {
        id: Date.now().toString(),
        title: liveTitle.trim(),
        host: session?.user?.name || "You",
        viewers: 0,
        isLive: true,
        category: "General",
        startedAt: "hace 0 min",
      };
      setLives(prev => [newLive, ...prev]);
      setIsStreaming(false);
      setShowStartLive(false);
      setLiveTitle("");
    }, 1500);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t("deleteLive"),
      t("deleteLiveMsg"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => setLives(prev => prev.filter(l => l.id !== id)),
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: HUD_BG }} testID="live-screen">
      {/* Scanline overlay top accent */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: HUD_ACCENT,
          opacity: 0.4,
          zIndex: 10,
        }}
      />

      <SafeAreaView edges={["top"]}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: HUD_BORDER,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: HUD_ACCENT,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                BROADCAST NETWORK
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <PulsingDot color={HUD_RED} />
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: HUD_TEXT,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  LIVE FEED
                </Text>
              </View>
            </View>

            <Pressable
              testID="go-live-button"
              onPress={() => setShowStartLive(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: pressed ? "#CC2E26" : HUD_RED,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 2,
                shadowColor: HUD_RED,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 8,
                elevation: 6,
              })}
            >
              <Radio size={13} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
                INITIATE BROADCAST
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* Active Transmissions */}
        {activeLives.length > 0 ? (
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <PulsingDot color={HUD_RED} />
              <Text
                style={{
                  color: HUD_RED,
                  fontWeight: "800",
                  fontSize: 10,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                }}
              >
                ACTIVE TRANSMISSIONS
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: HUD_BORDER, marginLeft: 4 }} />
            </View>
            {activeLives.map((live, i) => (
              <Animated.View key={live.id} entering={FadeInDown.duration(300).delay(i * 60)}>
                <Pressable
                  testID={`live-card-${live.id}`}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#062035" : HUD_CARD,
                    borderRadius: 4,
                    marginBottom: 12,
                    overflow: "hidden",
                    borderLeftWidth: 2,
                    borderLeftColor: HUD_RED,
                    borderWidth: 1,
                    borderColor: HUD_BORDER,
                  })}
                  onPress={() => Alert.alert(t("livesTitle"), `${t("joinLive")}: ${live.host}`)}
                >
                  {/* Video preview area */}
                  <View
                    style={{
                      height: 140,
                      backgroundColor: "#020D18",
                      alignItems: "center",
                      justifyContent: "center",
                      borderBottomWidth: 1,
                      borderBottomColor: HUD_BORDER,
                    }}
                  >
                    {/* Corner brackets */}
                    <View style={{ position: "absolute", top: 8, left: 8, width: 16, height: 16, borderTopWidth: 2, borderLeftWidth: 2, borderColor: HUD_ACCENT, opacity: 0.7 }} />
                    <View style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderTopWidth: 2, borderRightWidth: 2, borderColor: HUD_ACCENT, opacity: 0.7 }} />
                    <View style={{ position: "absolute", bottom: 8, left: 8, width: 16, height: 16, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: HUD_ACCENT, opacity: 0.7 }} />
                    <View style={{ position: "absolute", bottom: 8, right: 8, width: 16, height: 16, borderBottomWidth: 2, borderRightWidth: 2, borderColor: HUD_ACCENT, opacity: 0.7 }} />

                    {/* LIVE badge */}
                    <View
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        backgroundColor: HUD_RED,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 2,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>● LIVE</Text>
                    </View>

                    {/* Viewer count */}
                    <View
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 44,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: "rgba(0,0,0,0.7)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: HUD_BORDER,
                      }}
                    >
                      <Users size={10} color={HUD_ACCENT} />
                      <Text style={{ color: HUD_TEXT, fontSize: 11, fontWeight: "700" }}>{live.viewers}</Text>
                    </View>

                    {/* Delete button */}
                    <Pressable
                      onPress={() => handleDelete(live.id)}
                      testID={`delete-live-${live.id}`}
                      style={({ pressed }) => ({
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 30,
                        height: 30,
                        borderRadius: 2,
                        backgroundColor: pressed ? "rgba(255,59,48,0.2)" : "rgba(0,0,0,0.6)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "rgba(255,59,48,0.4)",
                      })}
                    >
                      <Trash2 size={13} color={HUD_RED} />
                    </Pressable>

                    {/* Play icon */}
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        backgroundColor: "rgba(0,180,216,0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: HUD_ACCENT,
                      }}
                    >
                      <Play size={22} color={HUD_ACCENT} fill={HUD_ACCENT} />
                    </View>
                  </View>

                  {/* Card info */}
                  <View style={{ padding: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 2,
                          backgroundColor: "rgba(0,180,216,0.12)",
                          borderWidth: 1,
                          borderColor: "rgba(0,180,216,0.3)",
                        }}
                      >
                        <Text style={{ color: HUD_ACCENT, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 }}>
                          {live.category.toUpperCase()}
                        </Text>
                      </View>
                      {live.startedAt ? (
                        <Text style={{ color: HUD_TEXT_DIM, fontSize: 11 }}>{live.startedAt}</Text>
                      ) : null}
                    </View>
                    <Text style={{ color: HUD_TEXT, fontSize: 14, fontWeight: "700", marginBottom: 4, letterSpacing: 0.3 }}>
                      {live.title}
                    </Text>
                    <Text style={{ color: HUD_TEXT_DIM, fontSize: 12 }}>por {live.host}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : null}

        {/* Queued Transmissions */}
        {scheduledLives.length > 0 ? (
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, marginTop: activeLives.length > 0 ? 8 : 0 }}>
              <Calendar size={12} color={HUD_ACCENT} />
              <Text
                style={{
                  color: HUD_ACCENT,
                  fontWeight: "800",
                  fontSize: 10,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                }}
              >
                QUEUED TRANSMISSIONS
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: HUD_BORDER, marginLeft: 4 }} />
            </View>
            {scheduledLives.map((live, i) => (
              <Animated.View key={live.id} entering={FadeInDown.duration(300).delay(i * 60)}>
                <Pressable
                  testID={`scheduled-card-${live.id}`}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#062035" : HUD_CARD,
                    borderRadius: 4,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    borderLeftWidth: 2,
                    borderLeftColor: HUD_ACCENT,
                    borderWidth: 1,
                    borderColor: HUD_BORDER,
                  })}
                  onPress={() => Alert.alert(t("setReminder"), `${t("setReminder")}: "${live.title}"`)}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      backgroundColor: "rgba(0,180,216,0.08)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                      borderWidth: 1,
                      borderColor: "rgba(0,180,216,0.25)",
                    }}
                  >
                    <Clock size={20} color={HUD_ACCENT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: HUD_TEXT, fontSize: 14, fontWeight: "700", marginBottom: 3, letterSpacing: 0.3 }}>
                      {live.title}
                    </Text>
                    <Text style={{ color: HUD_TEXT_DIM, fontSize: 12 }}>por {live.host}</Text>
                    {live.scheduledAt ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <Calendar size={10} color={HUD_ACCENT} />
                        <Text style={{ color: HUD_ACCENT, fontSize: 11, fontWeight: "600" }}>{live.scheduledAt}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => handleDelete(live.id)}
                    testID={`delete-scheduled-${live.id}`}
                    style={({ pressed }) => ({
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      backgroundColor: pressed ? "rgba(255,59,48,0.15)" : "rgba(255,59,48,0.06)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 8,
                      borderWidth: 1,
                      borderColor: "rgba(255,59,48,0.25)",
                    })}
                  >
                    <Trash2 size={15} color={HUD_RED} />
                  </Pressable>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : null}

        {/* Empty State */}
        {activeLives.length === 0 && scheduledLives.length === 0 ? (
          <View
            style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}
            testID="empty-lives"
          >
            {/* HUD reticle */}
            <View style={{ width: 72, height: 72, alignItems: "center", justifyContent: "center", position: "relative" }}>
              <View style={{ position: "absolute", top: 0, left: 0, width: 16, height: 16, borderTopWidth: 2, borderLeftWidth: 2, borderColor: HUD_ACCENT, opacity: 0.5 }} />
              <View style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, borderTopWidth: 2, borderRightWidth: 2, borderColor: HUD_ACCENT, opacity: 0.5 }} />
              <View style={{ position: "absolute", bottom: 0, left: 0, width: 16, height: 16, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: HUD_ACCENT, opacity: 0.5 }} />
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderBottomWidth: 2, borderRightWidth: 2, borderColor: HUD_ACCENT, opacity: 0.5 }} />
              <Radio size={32} color={HUD_ACCENT} style={{ opacity: 0.4 }} />
            </View>
            <Text
              style={{
                color: HUD_TEXT,
                fontSize: 14,
                fontWeight: "800",
                marginTop: 20,
                marginBottom: 8,
                textAlign: "center",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              NO ACTIVE SIGNALS
            </Text>
            <Text style={{ color: HUD_TEXT_DIM, fontSize: 13, textAlign: "center", lineHeight: 22, opacity: 0.7 }}>
              {t("noLivesDesc")}
            </Text>

            {/* Full-width broadcast button in empty state */}
            <Pressable
              testID="go-live-button-empty"
              onPress={() => setShowStartLive(true)}
              style={({ pressed }) => ({
                marginTop: 32,
                width: "100%",
                backgroundColor: pressed ? "#CC2E26" : HUD_RED,
                paddingVertical: 16,
                borderRadius: 2,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                shadowColor: HUD_RED,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 12,
                elevation: 8,
              })}
            >
              <Radio size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
                INITIATE BROADCAST
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Start Live Modal */}
      <Modal visible={showStartLive} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: HUD_BG, padding: 24 }}>
          {/* Modal top accent line */}
          <View style={{ height: 1, backgroundColor: HUD_ACCENT, marginBottom: 28, opacity: 0.5 }} />

          {/* Modal header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 36 }}>
            <Pressable
              onPress={() => setShowStartLive(false)}
              testID="close-live-modal"
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 2,
                backgroundColor: pressed ? "rgba(0,180,216,0.15)" : "rgba(0,180,216,0.07)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(0,180,216,0.25)",
              })}
            >
              <X size={18} color={HUD_ACCENT} />
            </Pressable>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: HUD_ACCENT,
                  fontSize: 10,
                  fontWeight: "800",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                BROADCAST NETWORK
              </Text>
              <Text
                style={{
                  color: HUD_TEXT,
                  fontSize: 16,
                  fontWeight: "800",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                LAUNCH BROADCAST
              </Text>
            </View>
            {/* Spacer to balance close button */}
            <View style={{ width: 34 }} />
          </View>

          {/* Avatar / Operator ID */}
          <View style={{ alignItems: "center", marginBottom: 36 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 2,
                backgroundColor: "rgba(0,180,216,0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
                borderWidth: 1,
                borderColor: HUD_ACCENT,
              }}
            >
              <Text style={{ color: HUD_ACCENT, fontWeight: "800", fontSize: 28 }}>
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <Text
              style={{
                color: HUD_TEXT_DIM,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              OPERATOR
            </Text>
            <Text style={{ color: HUD_TEXT, fontWeight: "700", fontSize: 15, letterSpacing: 0.5 }}>
              {session?.user?.name ?? "Unknown"}
            </Text>

            {isStreaming ? <BroadcastingBadge /> : null}
          </View>

          {/* Title label */}
          <Text
            style={{
              color: HUD_ACCENT,
              fontSize: 9,
              fontWeight: "800",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {t("liveTitle")}
          </Text>

          {/* Input */}
          <TextInput
            testID="live-title-input"
            value={liveTitle}
            onChangeText={setLiveTitle}
            placeholder="ej. Cómo construir disciplina real"
            placeholderTextColor="rgba(0,180,216,0.3)"
            style={{
              backgroundColor: HUD_CARD,
              borderRadius: 2,
              padding: 14,
              color: HUD_TEXT,
              fontSize: 14,
              marginBottom: 36,
              borderWidth: 1,
              borderColor: HUD_ACCENT,
              letterSpacing: 0.3,
            }}
            autoFocus
          />

          {/* Submit button */}
          <Pressable
            testID="start-streaming-button"
            onPress={handleGoLive}
            disabled={!liveTitle.trim() || isStreaming}
            style={({ pressed }) => ({
              backgroundColor: !liveTitle.trim() ? "rgba(255,59,48,0.3)" : pressed ? "#CC2E26" : HUD_RED,
              borderRadius: 2,
              paddingVertical: 17,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
              shadowColor: liveTitle.trim() ? HUD_RED : "transparent",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 14,
              elevation: liveTitle.trim() ? 8 : 0,
            })}
          >
            {isStreaming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Radio size={18} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase" }}>
                  {t("startStreaming")}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Bottom grid lines for aesthetic */}
          <View style={{ flexDirection: "row", gap: 4, marginTop: 28, opacity: 0.15 }}>
            {[...Array(12)].map((_, i) => (
              <View key={i} style={{ flex: 1, height: 1, backgroundColor: HUD_ACCENT }} />
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}
