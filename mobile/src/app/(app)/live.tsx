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
import { useTheme } from "@/lib/theme";

// Static live-specific colors (not theme-dependent — red is always "danger/live")
const LIVE_RED = "#FF3B30";
const LIVE_RED_SOFT = "rgba(255,59,48,0.12)";
const LIVE_RED_BORDER = "rgba(255,59,48,0.30)";

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

function BroadcastingBadge({ t }: { t: (key: any) => string }) {
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
          backgroundColor: LIVE_RED_SOFT,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 100,
          borderWidth: 1,
          borderColor: LIVE_RED_BORDER,
          marginTop: 12,
        },
        animStyle,
      ]}
    >
      <View style={{ width: 6, height: 6, borderRadius: 100, backgroundColor: LIVE_RED }} />
      <Text style={{ color: LIVE_RED, fontWeight: "700", fontSize: 13 }}>
        {t("startStreaming")}
      </Text>
    </Animated.View>
  );
}

export default function LiveScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { data: session } = useSession();
  const [showStartLive, setShowStartLive] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [lives, setLives] = useState<LiveItem[]>([]);

  const activeLives = lives.filter(l => l.isLive);
  const scheduledLives = lives.filter(l => !l.isLive);

  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;

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
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="live-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <PulsingDot color={LIVE_RED} />
                <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
                  {t("livesTitle")}
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
                backgroundColor: pressed ? "#CC2E26" : LIVE_RED,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 100,
                shadowColor: LIVE_RED,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              })}
            >
              <Radio size={14} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                {t("startLive")}
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
              <PulsingDot color={LIVE_RED} />
              <Text style={{ color: LIVE_RED, fontWeight: "700", fontSize: 12 }}>
                {t("liveNow")}
              </Text>
            </View>
            {activeLives.map((live, i) => (
              <Animated.View key={live.id} entering={FadeInDown.duration(300).delay(i * 60)}>
                <Pressable
                  testID={`live-card-${live.id}`}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.bg2 : colors.card,
                    borderRadius: 20,
                    marginBottom: 14,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 4 },
                  })}
                  onPress={() => Alert.alert(t("livesTitle"), `${t("joinLive")}: ${live.host}`)}
                >
                  {/* Video preview area */}
                  <View style={{ height: 140, backgroundColor: colors.bg2, alignItems: "center", justifyContent: "center" }}>
                    {/* LIVE badge */}
                    <View style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      backgroundColor: LIVE_RED,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 100,
                    }}>
                      <PulsingDot color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>LIVE</Text>
                    </View>

                    {/* Viewer count */}
                    <View style={{
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
                      borderColor: colors.border,
                    }}>
                      <Users size={10} color={colors.text2} />
                      <Text style={{ color: colors.text, fontSize: 11, fontWeight: "700" }}>{live.viewers}</Text>
                    </View>

                    {/* Delete button */}
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
                        backgroundColor: pressed ? LIVE_RED_SOFT : "rgba(0,0,0,0.6)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: LIVE_RED_BORDER,
                      })}
                    >
                      <Trash2 size={13} color={LIVE_RED} />
                    </Pressable>

                    {/* Play icon */}
                    <View style={{
                      width: 52,
                      height: 52,
                      borderRadius: 100,
                      backgroundColor: accentSoft,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: accentBorder,
                    }}>
                      <Play size={22} color={colors.accent} fill={colors.accent} />
                    </View>
                  </View>

                  {/* Card info */}
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 100,
                        backgroundColor: accentSoft,
                        borderWidth: 1,
                        borderColor: accentBorder,
                      }}>
                        <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700" }}>
                          {live.category}
                        </Text>
                      </View>
                      {live.startedAt ? (
                        <Text style={{ color: colors.text3, fontSize: 11 }}>{live.startedAt}</Text>
                      ) : null}
                    </View>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: 4, letterSpacing: -0.2 }}>
                      {live.title}
                    </Text>
                    <Text style={{ color: colors.text2, fontSize: 13 }}>by {live.host}</Text>
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
              <Calendar size={13} color={colors.text2} />
              <Text style={{ color: colors.text2, fontWeight: "700", fontSize: 12 }}>
                {t("scheduled")}
              </Text>
            </View>
            {scheduledLives.map((live, i) => (
              <Animated.View key={live.id} entering={FadeInDown.duration(300).delay(i * 60)}>
                <Pressable
                  testID={`scheduled-card-${live.id}`}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.bg2 : colors.card,
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 2 },
                  })}
                  onPress={() => Alert.alert(t("setReminder"), `${t("setReminder")}: "${live.title}"`)}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 100,
                    backgroundColor: accentSoft,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                    borderWidth: 1,
                    borderColor: accentBorder,
                  }}>
                    <Clock size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 3, letterSpacing: -0.1 }}>
                      {live.title}
                    </Text>
                    <Text style={{ color: colors.text2, fontSize: 12 }}>by {live.host}</Text>
                    {live.scheduledAt ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <Calendar size={10} color={colors.accent} />
                        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "600" }}>{live.scheduledAt}</Text>
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
                      backgroundColor: pressed ? LIVE_RED_SOFT : `${colors.text}0A`,
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 8,
                      borderWidth: 1,
                      borderColor: LIVE_RED_BORDER,
                    })}
                  >
                    <Trash2 size={15} color={LIVE_RED} />
                  </Pressable>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : null}

        {/* Empty state */}
        {activeLives.length === 0 && scheduledLives.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }} testID="empty-lives">
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 100,
              backgroundColor: LIVE_RED_SOFT,
              borderWidth: 1,
              borderColor: LIVE_RED_BORDER,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}>
              <Radio size={34} color={LIVE_RED} />
            </View>
            <Text style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "800",
              marginBottom: 8,
              textAlign: "center",
              letterSpacing: -0.3,
            }}>
              {t("noLives")}
            </Text>
            <Text style={{ color: colors.text2, fontSize: 13, textAlign: "center", lineHeight: 22 }}>
              {t("noLivesDesc")}
            </Text>

            <Pressable
              testID="go-live-button-empty"
              onPress={() => setShowStartLive(true)}
              style={({ pressed }) => ({
                marginTop: 32,
                width: "100%",
                backgroundColor: pressed ? "#CC2E26" : LIVE_RED,
                paddingVertical: 16,
                borderRadius: 100,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                shadowColor: LIVE_RED,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              })}
            >
              <Radio size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                {t("startLive")}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Start Live Modal */}
      <Modal visible={showStartLive} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
          <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 100, alignSelf: "center", marginBottom: 24 }} />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <Pressable
              onPress={() => setShowStartLive(false)}
              testID="close-live-modal"
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 100,
                backgroundColor: pressed ? accentSoft : `${colors.text}0A`,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
              })}
            >
              <X size={18} color={colors.text2} />
            </Pressable>
            <Text style={{ flex: 1, textAlign: "center", color: colors.text, fontSize: 17, fontWeight: "700" }}>
              {t("startLive")}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Avatar / Name */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 100,
              backgroundColor: accentSoft,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              borderWidth: 2,
              borderColor: colors.accent,
              shadowColor: colors.accent,
              shadowOpacity: 0.2,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
            }}>
              <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 28 }}>
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <Text style={{ color: colors.text3, fontSize: 12, marginBottom: 4 }}>
              {t("sharingWith")}
            </Text>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
              {session?.user?.name ?? "Unknown"}
            </Text>

            {isStreaming ? <BroadcastingBadge t={t} /> : null}
          </View>

          <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
            {t("liveTitle")}
          </Text>

          <TextInput
            testID="live-title-input"
            value={liveTitle}
            onChangeText={setLiveTitle}
            placeholder="e.g. How to build real discipline"
            placeholderTextColor={colors.text3}
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 14,
              color: colors.text,
              fontSize: 14,
              marginBottom: 32,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            autoFocus
          />

          <Pressable
            testID="start-streaming-button"
            onPress={handleGoLive}
            disabled={!liveTitle.trim() || isStreaming}
            style={({ pressed }) => ({
              backgroundColor: !liveTitle.trim() ? LIVE_RED_SOFT : pressed ? "#CC2E26" : LIVE_RED,
              borderRadius: 100,
              paddingVertical: 17,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
              opacity: !liveTitle.trim() ? 0.5 : 1,
              shadowColor: liveTitle.trim() ? LIVE_RED : "transparent",
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
