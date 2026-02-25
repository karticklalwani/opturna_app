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

const DS = {
  bg: "#0A0F1E",
  card: "#111827",
  cardAlt: "#0F172A",
  cyan: "#00B4D8",
  cyanSoft: "rgba(0,180,216,0.12)",
  cyanBorder: "rgba(0,180,216,0.25)",
  red: "#FF3B30",
  redSoft: "rgba(255,59,48,0.12)",
  redBorder: "rgba(255,59,48,0.30)",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
  border: "rgba(255,255,255,0.06)",
};

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
        { width: 8, height: 8, borderRadius: 100, backgroundColor: color },
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
          backgroundColor: DS.redSoft,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 100,
          borderWidth: 1,
          borderColor: DS.redBorder,
          marginTop: 12,
        },
        animStyle,
      ]}
    >
      <View style={{ width: 6, height: 6, borderRadius: 100, backgroundColor: DS.red }} />
      <Text style={{ color: DS.red, fontWeight: "700", fontSize: 13 }}>
        Broadcasting
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
    <View style={{ flex: 1, backgroundColor: DS.bg }} testID="live-screen">
      <SafeAreaView edges={["top"]}>
        {/* Header */}
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 12,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <PulsingDot color={DS.red} />
                <Text style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: DS.textPrimary,
                  letterSpacing: -0.5,
                }}>
                  Live
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
                backgroundColor: pressed ? "#CC2E26" : DS.red,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 100,
                shadowColor: DS.red,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              })}
            >
              <Radio size={14} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                Go live
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* Active lives */}
        {activeLives.length > 0 ? (
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <PulsingDot color={DS.red} />
              <Text style={{ color: DS.red, fontWeight: "700", fontSize: 12 }}>
                Happening now
              </Text>
            </View>
            {activeLives.map((live, i) => (
              <Animated.View key={live.id} entering={FadeInDown.duration(300).delay(i * 60)}>
                <Pressable
                  testID={`live-card-${live.id}`}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#161E2E" : DS.card,
                    borderRadius: 20,
                    marginBottom: 14,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: DS.border,
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 4 },
                  })}
                  onPress={() => Alert.alert(t("livesTitle"), `${t("joinLive")}: ${live.host}`)}
                >
                  {/* Video preview area */}
                  <View
                    style={{
                      height: 140,
                      backgroundColor: DS.cardAlt,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* LIVE badge - red pill with pulse */}
                    <View
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        backgroundColor: DS.red,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 100,
                      }}
                    >
                      <PulsingDot color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>LIVE</Text>
                    </View>

                    {/* Viewer count */}
                    <View
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 52,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 100,
                        borderWidth: 1,
                        borderColor: DS.border,
                      }}
                    >
                      <Users size={10} color={DS.textSecondary} />
                      <Text style={{ color: DS.textPrimary, fontSize: 11, fontWeight: "700" }}>{live.viewers}</Text>
                    </View>

                    {/* Delete button - circular */}
                    <Pressable
                      onPress={() => handleDelete(live.id)}
                      testID={`delete-live-${live.id}`}
                      style={({ pressed }) => ({
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 32,
                        height: 32,
                        borderRadius: 100,
                        backgroundColor: pressed ? DS.redSoft : "rgba(0,0,0,0.6)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: DS.redBorder,
                      })}
                    >
                      <Trash2 size={13} color={DS.red} />
                    </Pressable>

                    {/* Play icon - circular */}
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 100,
                        backgroundColor: DS.cyanSoft,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: DS.cyanBorder,
                      }}
                    >
                      <Play size={22} color={DS.cyan} fill={DS.cyan} />
                    </View>
                  </View>

                  {/* Card info */}
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 100,
                          backgroundColor: DS.cyanSoft,
                          borderWidth: 1,
                          borderColor: DS.cyanBorder,
                        }}
                      >
                        <Text style={{ color: DS.cyan, fontSize: 10, fontWeight: "700" }}>
                          {live.category}
                        </Text>
                      </View>
                      {live.startedAt ? (
                        <Text style={{ color: DS.textMuted, fontSize: 11 }}>{live.startedAt}</Text>
                      ) : null}
                    </View>
                    <Text style={{ color: DS.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: 4, letterSpacing: -0.2 }}>
                      {live.title}
                    </Text>
                    <Text style={{ color: DS.textSecondary, fontSize: 13 }}>by {live.host}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : null}

        {/* Scheduled lives */}
        {scheduledLives.length > 0 ? (
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, marginTop: activeLives.length > 0 ? 8 : 0 }}>
              <Calendar size={13} color={DS.textSecondary} />
              <Text style={{ color: DS.textSecondary, fontWeight: "700", fontSize: 12 }}>
                Coming up
              </Text>
            </View>
            {scheduledLives.map((live, i) => (
              <Animated.View key={live.id} entering={FadeInDown.duration(300).delay(i * 60)}>
                <Pressable
                  testID={`scheduled-card-${live.id}`}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#161E2E" : DS.card,
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: DS.border,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 2 },
                  })}
                  onPress={() => Alert.alert(t("setReminder"), `${t("setReminder")}: "${live.title}"`)}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 100,
                      backgroundColor: DS.cyanSoft,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                      borderWidth: 1,
                      borderColor: DS.cyanBorder,
                    }}
                  >
                    <Clock size={20} color={DS.cyan} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: DS.textPrimary, fontSize: 14, fontWeight: "700", marginBottom: 3, letterSpacing: -0.1 }}>
                      {live.title}
                    </Text>
                    <Text style={{ color: DS.textSecondary, fontSize: 12 }}>by {live.host}</Text>
                    {live.scheduledAt ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <Calendar size={10} color={DS.cyan} />
                        <Text style={{ color: DS.cyan, fontSize: 11, fontWeight: "600" }}>{live.scheduledAt}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => handleDelete(live.id)}
                    testID={`delete-scheduled-${live.id}`}
                    style={({ pressed }) => ({
                      width: 36,
                      height: 36,
                      borderRadius: 100,
                      backgroundColor: pressed ? DS.redSoft : "rgba(255,255,255,0.04)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 8,
                      borderWidth: 1,
                      borderColor: DS.redBorder,
                    })}
                  >
                    <Trash2 size={15} color={DS.red} />
                  </Pressable>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : null}

        {/* Empty state */}
        {activeLives.length === 0 && scheduledLives.length === 0 ? (
          <View
            style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}
            testID="empty-lives"
          >
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 100,
              backgroundColor: DS.redSoft,
              borderWidth: 1,
              borderColor: DS.redBorder,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}>
              <Radio size={34} color={DS.red} />
            </View>
            <Text
              style={{
                color: DS.textPrimary,
                fontSize: 18,
                fontWeight: "800",
                marginBottom: 8,
                textAlign: "center",
                letterSpacing: -0.3,
              }}
            >
              No live streams yet
            </Text>
            <Text style={{ color: DS.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 22 }}>
              {t("noLivesDesc")}
            </Text>

            <Pressable
              testID="go-live-button-empty"
              onPress={() => setShowStartLive(true)}
              style={({ pressed }) => ({
                marginTop: 32,
                width: "100%",
                backgroundColor: pressed ? "#CC2E26" : DS.red,
                paddingVertical: 16,
                borderRadius: 100,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                shadowColor: DS.red,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              })}
            >
              <Radio size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                Start streaming
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Start Live Modal */}
      <Modal visible={showStartLive} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: DS.bg, padding: 24 }}>
          {/* Drag indicator */}
          <View style={{ width: 36, height: 4, backgroundColor: DS.border, borderRadius: 100, alignSelf: "center", marginBottom: 24 }} />

          {/* Modal header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <Pressable
              onPress={() => setShowStartLive(false)}
              testID="close-live-modal"
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 100,
                backgroundColor: pressed ? DS.cyanSoft : "rgba(255,255,255,0.05)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: DS.border,
              })}
            >
              <X size={18} color={DS.textSecondary} />
            </Pressable>
            <Text style={{
              flex: 1,
              textAlign: "center",
              color: DS.textPrimary,
              fontSize: 17,
              fontWeight: "700",
            }}>
              Start a stream
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Avatar / Name */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 100,
                backgroundColor: DS.cyanSoft,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                borderWidth: 2,
                borderColor: DS.cyan,
                shadowColor: DS.cyan,
                shadowOpacity: 0.2,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Text style={{ color: DS.cyan, fontWeight: "800", fontSize: 28 }}>
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <Text style={{ color: DS.textSecondary, fontSize: 12, marginBottom: 4 }}>
              Streaming as
            </Text>
            <Text style={{ color: DS.textPrimary, fontWeight: "700", fontSize: 15 }}>
              {session?.user?.name ?? "Unknown"}
            </Text>

            {isStreaming ? <BroadcastingBadge /> : null}
          </View>

          {/* Title label */}
          <Text style={{ color: DS.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
            {t("liveTitle")}
          </Text>

          {/* Input */}
          <TextInput
            testID="live-title-input"
            value={liveTitle}
            onChangeText={setLiveTitle}
            placeholder="e.g. How to build real discipline"
            placeholderTextColor={DS.textMuted}
            style={{
              backgroundColor: DS.card,
              borderRadius: 12,
              padding: 14,
              color: DS.textPrimary,
              fontSize: 14,
              marginBottom: 32,
              borderWidth: 1,
              borderColor: DS.border,
            }}
            autoFocus
          />

          {/* Submit button */}
          <Pressable
            testID="start-streaming-button"
            onPress={handleGoLive}
            disabled={!liveTitle.trim() || isStreaming}
            style={({ pressed }) => ({
              backgroundColor: !liveTitle.trim() ? DS.redSoft : pressed ? "#CC2E26" : DS.red,
              borderRadius: 100,
              paddingVertical: 17,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
              opacity: !liveTitle.trim() ? 0.5 : 1,
              shadowColor: liveTitle.trim() ? DS.red : "transparent",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 14,
              elevation: liveTitle.trim() ? 8 : 0,
            })}
          >
            {isStreaming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Radio size={18} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                  {t("startStreaming")}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
