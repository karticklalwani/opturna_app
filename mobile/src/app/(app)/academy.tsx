import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl, Modal, TextInput } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { Course } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookOpen, Play, Users, Lock, Plus, X, ChevronRight, ImageIcon } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import * as ImagePicker from "expo-image-picker";
import { uploadFile } from "@/lib/upload";

const COURSE_CATEGORIES = ["All", "Negocios", "Mentalidad", "Finanzas", "Salud", "Tecnología", "Filosofía"];

const HUD = {
  bg: "#020B18",
  card: "#041525",
  bg3: "#051C30",
  bg4: "#06243E",
  cyan: "#00D4FF",
  cyanDim: "#00B4D8",
  cyanGlow: "rgba(0,212,255,0.18)",
  cyanBorder: "rgba(0,212,255,0.35)",
  green: "#00FF87",
  greenDim: "rgba(0,255,135,0.15)",
  gold: "#FFD60A",
  goldDim: "rgba(255,214,10,0.15)",
  iceBlue: "#C8E8FF",
  text3: "#7AA8C4",
  text4: "#4A7A9B",
  border: "rgba(0,180,216,0.2)",
  borderStrong: "rgba(0,212,255,0.5)",
};

// Decorative circuit grid lines for thumbnail placeholder
function CircuitGrid() {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      {[20, 50, 80].map((top) => (
        <View key={top} style={{ position: "absolute", top: `${top}%`, left: 0, right: 0, height: 1, backgroundColor: "rgba(0,212,255,0.08)" }} />
      ))}
      {[20, 50, 80].map((left) => (
        <View key={left} style={{ position: "absolute", left: `${left}%`, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(0,212,255,0.08)" }} />
      ))}
      <View style={{ position: "absolute", top: "30%", left: "15%", width: 8, height: 8, borderWidth: 1, borderColor: "rgba(0,212,255,0.25)" }} />
      <View style={{ position: "absolute", top: "60%", right: "20%", width: 6, height: 6, borderWidth: 1, borderColor: "rgba(0,212,255,0.2)" }} />
      <View style={{ position: "absolute", top: "20%", right: "35%", width: 4, height: 4, backgroundColor: "rgba(0,212,255,0.15)" }} />
    </View>
  );
}

function AccessBadge({ access }: { access: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    free: { label: "FREE", color: HUD.green, bg: HUD.greenDim },
    followers: { label: "FOLLOWERS", color: HUD.cyanDim, bg: HUD.cyanGlow },
    pro: { label: "PRO", color: HUD.gold, bg: HUD.goldDim },
  };
  const c = config[access] ?? config.free;
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.color,
      borderRadius: 2,
    }}>
      {access !== "free" ? <Lock size={9} color={c.color} /> : null}
      <Text style={{
        color: c.color,
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 1.2,
        fontFamily: "monospace",
      }}>{c.label}</Text>
    </View>
  );
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const lessonCount = course._count?.lessons ?? 0;
  const enrollCount = course._count?.enrollments ?? 0;
  const enrollFormatted = enrollCount >= 1000 ? `${(enrollCount / 1000).toFixed(1)}K` : String(enrollCount);

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Pressable style={{ marginBottom: 14 }} testID="course-card">
        <View style={{
          backgroundColor: HUD.card,
          borderRadius: 4,
          overflow: "hidden",
          borderTopWidth: 2,
          borderTopColor: HUD.cyan,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderLeftColor: HUD.border,
          borderRightColor: HUD.border,
          borderBottomColor: HUD.border,
        }}>
          {/* Thumbnail */}
          <View style={{ height: 160, backgroundColor: HUD.bg3, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {course.thumbnail ? (
              <Image source={{ uri: course.thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center" }}>
                <CircuitGrid />
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  backgroundColor: HUD.bg4,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: HUD.cyanBorder,
                }}>
                  <BookOpen size={26} color={HUD.cyan} />
                </View>
              </View>
            )}

            {/* Play button */}
            <View style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: `${HUD.cyan}D0`,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: HUD.cyan,
            }}>
              <Play size={18} color="#020B18" fill="#020B18" />
            </View>

            {/* Access badge */}
            <View style={{ position: "absolute", top: 10, left: 10 }}>
              <AccessBadge access={course.access} />
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 14 }}>
            <Text style={{
              color: HUD.iceBlue,
              fontSize: 15,
              fontWeight: "700",
              marginBottom: 6,
              lineHeight: 21,
              letterSpacing: 0.3,
            }}>{course.title}</Text>

            {course.description ? (
              <Text style={{ color: HUD.text3, fontSize: 12, lineHeight: 18, marginBottom: 10 }} numberOfLines={2}>{course.description}</Text>
            ) : null}

            {/* Creator row */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 2,
                backgroundColor: HUD.bg4,
                marginRight: 8,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: HUD.border,
              }}>
                {course.creator?.image ? (
                  <Image source={{ uri: course.creator.image }} style={{ width: 22, height: 22 }} />
                ) : (
                  <Text style={{ color: HUD.cyan, fontSize: 9, fontWeight: "800" }}>{course.creator?.name?.[0]}</Text>
                )}
              </View>
              <Text style={{ color: HUD.text4, fontSize: 11, letterSpacing: 0.5 }}>{course.creator?.name}</Text>
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{
                color: HUD.text4,
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: 0.8,
              }}>
                {`LESSONS: ${lessonCount}  |  ENROLLED: ${enrollFormatted}`}
              </Text>
              <View style={{ flex: 1 }} />
              <ChevronRight size={14} color={HUD.cyanDim} />
            </View>
          </View>

          {/* Bottom scan line accent */}
          <View style={{ height: 1, backgroundColor: HUD.border }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function AcademyScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", category: "", access: "free", thumbnail: "" });
  const [pickedThumbnail, setPickedThumbnail] = useState<{ uri: string; mimeType: string; fileName: string } | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const queryClient = useQueryClient();

  const { data: courses, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.get<Course[]>("/api/courses"),
  });

  const createCourse = useMutation({
    mutationFn: async () => {
      let thumbnail = newCourse.thumbnail;
      if (pickedThumbnail) {
        setUploadingThumb(true);
        try {
          const result = await uploadFile(pickedThumbnail.uri, pickedThumbnail.fileName, pickedThumbnail.mimeType);
          thumbnail = result.url;
        } finally {
          setUploadingThumb(false);
        }
      }
      return api.post("/api/courses", { ...newCourse, thumbnail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setShowCreate(false);
      setNewCourse({ title: "", description: "", category: "", access: "free", thumbnail: "" });
      setPickedThumbnail(null);
    },
  });

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() || "jpg";
      const mimeType = `image/${ext}`;
      const fileName = asset.fileName || `thumbnail.${ext}`;
      setPickedThumbnail({ uri: asset.uri, mimeType, fileName });
    }
  };

  const filtered = courses?.filter(c => selectedCategory === "All" || c.category === selectedCategory) || [];

  return (
    <View style={{ flex: 1, backgroundColor: HUD.bg }} testID="academy-screen">
      <SafeAreaView edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 2 }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 22,
                fontWeight: "800",
                color: HUD.iceBlue,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}>KNOWLEDGE BASE</Text>
              <Text style={{
                fontSize: 10,
                color: HUD.cyanDim,
                letterSpacing: 3,
                textTransform: "uppercase",
                fontFamily: "monospace",
                marginTop: 2,
              }}>INTEL LIBRARY</Text>
            </View>

            {/* FAB create button */}
            <Pressable
              testID="create-course-button"
              onPress={() => setShowCreate(true)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 2,
                backgroundColor: HUD.cyan,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#00EEFF",
                shadowColor: HUD.cyan,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.7,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <Plus size={22} color="#020B18" />
            </Pressable>
          </View>

          {/* Divider line */}
          <View style={{ height: 1, backgroundColor: HUD.cyanBorder, marginTop: 10, marginBottom: 14 }} />

          {/* Category filter tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6 }}>
            {COURSE_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 2,
                    backgroundColor: isActive ? HUD.cyan : "transparent",
                    borderWidth: 1,
                    borderColor: isActive ? HUD.cyan : HUD.border,
                    shadowColor: isActive ? HUD.cyan : "transparent",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isActive ? 0.6 : 0,
                    shadowRadius: 6,
                    elevation: isActive ? 4 : 0,
                  }}
                >
                  <Text style={{
                    color: isActive ? "#020B18" : HUD.text3,
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}>{cat}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={HUD.cyan} />}
      >
        {isLoading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }} testID="loading-indicator">
            <ActivityIndicator color={HUD.cyan} size="large" />
            <Text style={{ color: HUD.text4, fontSize: 10, letterSpacing: 2, marginTop: 12, fontFamily: "monospace" }}>LOADING MODULES...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 2,
              borderWidth: 1,
              borderColor: HUD.cyanBorder,
              backgroundColor: HUD.bg3,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}>
              <BookOpen size={32} color={HUD.cyan} />
            </View>
            <Text style={{
              color: HUD.iceBlue,
              fontSize: 14,
              fontWeight: "800",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 8,
              textAlign: "center",
            }}>NO MODULES AVAILABLE</Text>
            <Text style={{ color: HUD.text4, fontSize: 12, textAlign: "center", lineHeight: 20, letterSpacing: 0.5 }}>{t("coursesDesc")}</Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={{
                marginTop: 24,
                backgroundColor: "transparent",
                paddingHorizontal: 24,
                paddingVertical: 11,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: HUD.cyan,
              }}
            >
              <Text style={{ color: HUD.cyan, fontWeight: "700", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>INITIALIZE MODULE</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map((course, i) => <CourseCard key={course.id} course={course} index={i} />)
        )}
      </ScrollView>

      {/* Create Course Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: HUD.bg }}>
          {/* Modal header */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: HUD.cyanBorder,
          }}>
            <Pressable
              onPress={() => { setShowCreate(false); setPickedThumbnail(null); }}
              style={{ marginRight: 16 }}
              testID="close-create-modal"
            >
              <X size={22} color={HUD.text3} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: HUD.iceBlue, fontSize: 15, fontWeight: "800", letterSpacing: 3, textTransform: "uppercase" }}>NEW PROTOCOL</Text>
              <Text style={{ color: HUD.cyanDim, fontSize: 9, letterSpacing: 2, fontFamily: "monospace", marginTop: 1 }}>COURSE INITIALIZATION</Text>
            </View>
            <Pressable
              testID="publish-course-button"
              onPress={() => createCourse.mutate()}
              disabled={!newCourse.title.trim() || createCourse.isPending || uploadingThumb}
              style={{
                backgroundColor: !newCourse.title.trim() ? "transparent" : HUD.cyan,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: !newCourse.title.trim() ? HUD.border : HUD.cyan,
                opacity: !newCourse.title.trim() ? 0.45 : 1,
                shadowColor: newCourse.title.trim() ? HUD.cyan : "transparent",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
              }}
            >
              {createCourse.isPending || uploadingThumb ? (
                <ActivityIndicator color="#020B18" size="small" />
              ) : (
                <Text style={{
                  color: !newCourse.title.trim() ? HUD.text4 : "#020B18",
                  fontWeight: "800",
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}>{t("publish")}</Text>
              )}
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {/* Thumbnail picker */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: HUD.cyanDim,
                fontSize: 9,
                fontWeight: "700",
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "monospace",
                marginBottom: 8,
              }}>THUMBNAIL</Text>
              <Pressable
                onPress={pickThumbnail}
                testID="pick-thumbnail-button"
                style={{
                  borderRadius: 4,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: HUD.cyanBorder,
                  borderStyle: "dashed",
                }}
              >
                {pickedThumbnail ? (
                  <View>
                    <Image source={{ uri: pickedThumbnail.uri }} style={{ width: "100%", height: 160 }} resizeMode="cover" />
                    <View style={{ position: "absolute", bottom: 8, right: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2, backgroundColor: "rgba(2,11,24,0.75)", borderWidth: 1, borderColor: HUD.cyanBorder }}>
                      <Text style={{ color: HUD.cyan, fontSize: 10, fontWeight: "700", letterSpacing: 1.2 }}>{t("changeThumbnail")}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ height: 120, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: HUD.bg3 }}>
                    <CircuitGrid />
                    <ImageIcon size={26} color={HUD.text4} />
                    <Text style={{ color: HUD.text4, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace" }}>{t("addThumbnail")}</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {([
              { key: "title" as const, label: t("courseTitle"), placeholder: "ej. Construye tu negocio en 30 días" },
              { key: "description" as const, label: t("courseDesc"), placeholder: "Describe tu curso...", multiline: true },
              { key: "category" as const, label: t("courseCategory"), placeholder: "Negocios, Finanzas, Salud..." },
            ] as const).map((item) => (
              <View key={item.key} style={{ marginBottom: 20 }}>
                <Text style={{
                  color: HUD.cyanDim,
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  marginBottom: 8,
                }}>{item.label}</Text>
                <TextInput
                  testID={`course-${item.key}-input`}
                  value={newCourse[item.key]}
                  onChangeText={(v) => setNewCourse(p => ({ ...p, [item.key]: v }))}
                  placeholder={item.placeholder}
                  placeholderTextColor={HUD.text4}
                  multiline={"multiline" in item ? item.multiline : false}
                  style={{
                    backgroundColor: HUD.bg3,
                    borderRadius: 2,
                    padding: 14,
                    color: HUD.iceBlue,
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: HUD.cyanBorder,
                    ...("multiline" in item && item.multiline ? { minHeight: 80, textAlignVertical: "top" } : {}),
                  }}
                />
              </View>
            ))}

            <Text style={{
              color: HUD.cyanDim,
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 2,
              textTransform: "uppercase",
              fontFamily: "monospace",
              marginBottom: 10,
            }}>{t("courseAccess")}</Text>

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
              {(["free", "followers", "pro"] as const).map((access) => {
                const labels = { free: t("free"), followers: t("followersOnly"), pro: "Pro" };
                const accentColor: Record<string, string> = { free: HUD.green, followers: HUD.cyanDim, pro: HUD.gold };
                const isSelected = newCourse.access === access;
                return (
                  <Pressable
                    key={access}
                    testID={`access-${access}`}
                    onPress={() => setNewCourse(p => ({ ...p, access }))}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 2,
                      alignItems: "center",
                      backgroundColor: isSelected ? `${accentColor[access]}22` : HUD.bg3,
                      borderWidth: 1,
                      borderColor: isSelected ? accentColor[access] : HUD.border,
                    }}
                  >
                    <Text style={{
                      color: isSelected ? accentColor[access] : HUD.text3,
                      fontSize: 10,
                      fontWeight: "800",
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                    }}>{labels[access]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
