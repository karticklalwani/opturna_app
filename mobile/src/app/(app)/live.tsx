import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Radio, Calendar, Users, X, Play, Clock, Trash2 } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/auth/use-session";

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

export default function LiveScreen() {
  const { colors } = useTheme();
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
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="live-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, flex: 1, letterSpacing: -0.5 }}>{t("livesTitle")}</Text>
          <TouchableOpacity
            testID="go-live-button"
            onPress={() => setShowStartLive(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EF4444", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
          >
            <Radio size={14} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>{t("startLive")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {activeLives.length > 0 && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" }} />
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>{t("liveNow")}</Text>
            </View>
            {activeLives.map((live, i) => (
              <Animated.View key={live.id} entering={FadeInDown.duration(300).delay(i * 60)}>
                <TouchableOpacity
                  testID={`live-card-${live.id}`}
                  style={{ backgroundColor: colors.card, borderRadius: 16, marginBottom: 12, overflow: "hidden" }}
                  onPress={() => Alert.alert(t("livesTitle"), `${t("joinLive")}: ${live.host}`)}
                >
                  <View style={{ height: 140, backgroundColor: "#1a0000", alignItems: "center", justifyContent: "center" }}>
                    <View style={{ position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EF4444", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" }} />
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>EN VIVO</Text>
                    </View>
                    <View style={{ position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Users size={12} color="#fff" />
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>{live.viewers}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(live.id)}
                        testID={`delete-live-${live.id}`}
                        style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", marginLeft: 4 }}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                      <Play size={24} color="#0A0A0A" fill="#0A0A0A" />
                    </View>
                  </View>
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: `${colors.accent}22` }}>
                        <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700" }}>{live.category.toUpperCase()}</Text>
                      </View>
                      {live.startedAt ? <Text style={{ color: colors.text4, fontSize: 12 }}>{live.startedAt}</Text> : null}
                    </View>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: 4 }}>{live.title}</Text>
                    <Text style={{ color: colors.text3, fontSize: 13 }}>por {live.host}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </>
        )}

        {scheduledLives.length > 0 && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, marginTop: 8 }}>
              <Calendar size={16} color={colors.text3} />
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>{t("scheduled")}</Text>
            </View>
            {scheduledLives.map((live, i) => (
              <Animated.View key={live.id} entering={FadeInDown.duration(300).delay(i * 60)}>
                <TouchableOpacity
                  testID={`scheduled-card-${live.id}`}
                  style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" }}
                  onPress={() => Alert.alert(t("setReminder"), `${t("setReminder")}: "${live.title}"`)}
                >
                  <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: colors.bg3, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                    <Clock size={22} color={colors.text3} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 4 }}>{live.title}</Text>
                    <Text style={{ color: colors.text3, fontSize: 13 }}>por {live.host}</Text>
                    {live.scheduledAt ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <Calendar size={12} color={colors.accent} />
                        <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>{live.scheduledAt}</Text>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(live.id)}
                    testID={`delete-scheduled-${live.id}`}
                    style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bg3, alignItems: "center", justifyContent: "center", marginLeft: 8 }}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </>
        )}

        {activeLives.length === 0 && scheduledLives.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }} testID="empty-lives">
            <Radio size={56} color={colors.bg4} />
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8, textAlign: "center" }}>{t("noLives")}</Text>
            <Text style={{ color: colors.text4, fontSize: 14, textAlign: "center", lineHeight: 22 }}>{t("noLivesDesc")}</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showStartLive} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <TouchableOpacity onPress={() => setShowStartLive(false)} testID="close-live-modal">
              <X size={22} color={colors.text3} />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", color: colors.text, fontSize: 17, fontWeight: "600" }}>{t("startLive")}</Text>
          </View>

          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Text style={{ color: "#0A0A0A", fontWeight: "800", fontSize: 32 }}>
                {session?.user?.name?.[0]?.toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>{session?.user?.name}</Text>
          </View>

          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{t("liveTitle")}</Text>
          <TextInput
            testID="live-title-input"
            value={liveTitle}
            onChangeText={setLiveTitle}
            placeholder="ej. Cómo construir disciplina real"
            placeholderTextColor={colors.text4}
            style={{ backgroundColor: colors.bg3, borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, marginBottom: 32 }}
            autoFocus
          />

          <TouchableOpacity
            testID="start-streaming-button"
            onPress={handleGoLive}
            disabled={!liveTitle.trim() || isStreaming}
            style={{ backgroundColor: "#EF4444", borderRadius: 14, paddingVertical: 17, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10, opacity: !liveTitle.trim() ? 0.5 : 1 }}
          >
            {isStreaming ? <ActivityIndicator color="#fff" /> : (
              <>
                <Radio size={20} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{t("startStreaming")}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
