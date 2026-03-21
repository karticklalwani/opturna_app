import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl, Modal, TextInput } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { Course } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookOpen, Play, Users, Lock, Plus, X, ChevronRight, ImageIcon, ChevronLeft } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { uploadFile } from "@/lib/upload";

const COURSE_CATEGORIES = ["All", "Negocios", "Mentalidad", "Finanzas", "Salud", "Tecnología", "Filosofía"];

// Static badge colors that don't depend on theme (access level semantic colors)
const ACCESS_COLORS = {
  free: { color: "#00E5A0", bg: "rgba(0,229,160,0.12)", border: "rgba(0,229,160,0.30)" },
  followers: { color: "#00B4D8", bg: "rgba(0,180,216,0.12)", border: "rgba(0,180,216,0.25)" },
  pro: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.30)" },
};

function AccessBadge({ access }: { access: string }) {
  const c = ACCESS_COLORS[access as keyof typeof ACCESS_COLORS] ?? ACCESS_COLORS.free;
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 100,
    }}>
      {access !== "free" ? <Lock size={9} color={c.color} /> : null}
      <Text style={{ color: c.color, fontSize: 10, fontWeight: "700" }}>
        {access === "free" ? "Free" : access === "followers" ? "Followers" : "Pro"}
      </Text>
    </View>
  );
}

function CourseCard({ course, index, colors }: { course: Course; index: number; colors: any }) {
  const lessonCount = course._count?.lessons ?? 0;
  const enrollCount = course._count?.enrollments ?? 0;
  const enrollFormatted = enrollCount >= 1000 ? `${(enrollCount / 1000).toFixed(1)}K` : String(enrollCount);
  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Pressable style={{ marginBottom: 16 }} testID="course-card">
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 4 },
        }}>
          {/* Thumbnail */}
          <View style={{ height: 160, backgroundColor: colors.bg2, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {course.thumbnail ? (
              <>
                <Image source={{ uri: course.thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                <View style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 60,
                  backgroundColor: "rgba(0,0,0,0.5)",
                }} />
              </>
            ) : (
              <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center" }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 100,
                  backgroundColor: accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: accentBorder,
                }}>
                  <BookOpen size={26} color={colors.accent} />
                </View>
              </View>
            )}

            <View style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              width: 40,
              height: 40,
              borderRadius: 100,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.accent,
              shadowOpacity: 0.4,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}>
              <Play size={16} color={colors.bg} fill={colors.bg} />
            </View>

            <View style={{ position: "absolute", top: 12, right: 12 }}>
              <AccessBadge access={course.access} />
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 16 }}>
            <Text style={{
              color: colors.text,
              fontSize: 15,
              fontWeight: "700",
              marginBottom: 6,
              lineHeight: 21,
            }}>{course.title}</Text>

            {course.description ? (
              <Text style={{ color: colors.text2, fontSize: 12, lineHeight: 18, marginBottom: 12 }} numberOfLines={2}>{course.description}</Text>
            ) : null}

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 100,
                backgroundColor: colors.bg2,
                marginRight: 8,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                {course.creator?.image ? (
                  <Image source={{ uri: course.creator.image }} style={{ width: 24, height: 24 }} />
                ) : (
                  <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "800" }}>{course.creator?.name?.[0]}</Text>
                )}
              </View>
              <Text style={{ color: colors.text2, fontSize: 12 }}>{course.creator?.name}</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: accentSoft,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: accentBorder,
                marginRight: 8,
              }}>
                <BookOpen size={10} color={colors.accent} />
                <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "600" }}>{lessonCount} lessons</Text>
              </View>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: `${colors.text}0A`,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Users size={10} color={colors.text3} />
                <Text style={{ color: colors.text3, fontSize: 11 }}>{enrollFormatted}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <ChevronRight size={16} color={colors.text3} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function AcademyScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", category: "", access: "free", thumbnail: "" });
  const [pickedThumbnail, setPickedThumbnail] = useState<{ uri: string; mimeType: string; fileName: string } | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const queryClient = useQueryClient();

  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;

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
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="academy-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 100, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 10 }}
            >
              <ChevronLeft size={20} color={colors.text} />
            </Pressable>
            <Text style={{ flex: 1, fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
              {t("academy")}
            </Text>

            <Pressable
              testID="create-course-button"
              onPress={() => setShowCreate(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: colors.accent,
                borderRadius: 100,
                paddingHorizontal: 16,
                paddingVertical: 10,
                shadowColor: colors.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Plus size={16} color={colors.bg} />
              <Text style={{ color: colors.bg, fontSize: 13, fontWeight: "700" }}>{t("createCourse")}</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
            {COURSE_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 100,
                    backgroundColor: isActive ? colors.accent : colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? colors.accent : colors.border,
                  }}
                >
                  <Text style={{
                    color: isActive ? colors.bg : colors.text2,
                    fontSize: 13,
                    fontWeight: "600",
                  }}>{cat}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
      >
        {isLoading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }} testID="loading-indicator">
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={{ color: colors.text3, fontSize: 13, marginTop: 12 }}>{t("noCourses")}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 100,
              backgroundColor: accentSoft,
              borderWidth: 1,
              borderColor: accentBorder,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}>
              <BookOpen size={34} color={colors.accent} />
            </View>
            <Text style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "800",
              marginBottom: 8,
              textAlign: "center",
              letterSpacing: -0.3,
            }}>{t("noCourses")}</Text>
            <Text style={{ color: colors.text2, fontSize: 13, textAlign: "center", lineHeight: 20 }}>{t("coursesDesc")}</Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={{
                marginTop: 24,
                backgroundColor: colors.accent,
                paddingHorizontal: 28,
                paddingVertical: 13,
                borderRadius: 100,
                shadowColor: colors.accent,
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Text style={{ color: colors.bg, fontWeight: "700", fontSize: 14 }}>{t("createCourse")}</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map((course, i) => <CourseCard key={course.id} course={course} index={i} colors={colors} />)
        )}
      </ScrollView>

      {/* Create Course Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 100, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />

          <View style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <Pressable
              onPress={() => { setShowCreate(false); setPickedThumbnail(null); }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
              testID="close-create-modal"
            >
              <X size={18} color={colors.text2} />
            </Pressable>
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "700" }}>{t("createCourse")}</Text>
            <Pressable
              testID="publish-course-button"
              onPress={() => createCourse.mutate()}
              disabled={!newCourse.title.trim() || createCourse.isPending || uploadingThumb}
              style={{
                backgroundColor: newCourse.title.trim() ? colors.accent : colors.card,
                paddingHorizontal: 20,
                paddingVertical: 9,
                borderRadius: 100,
                opacity: !newCourse.title.trim() ? 0.5 : 1,
              }}
            >
              {createCourse.isPending || uploadingThumb ? (
                <ActivityIndicator color={colors.bg} size="small" />
              ) : (
                <Text style={{
                  color: newCourse.title.trim() ? colors.bg : colors.text3,
                  fontWeight: "700",
                  fontSize: 14,
                }}>{t("publish")}</Text>
              )}
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {/* Thumbnail picker */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>Thumbnail</Text>
              <Pressable
                onPress={pickThumbnail}
                testID="pick-thumbnail-button"
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                }}
              >
                {pickedThumbnail ? (
                  <View>
                    <Image source={{ uri: pickedThumbnail.uri }} style={{ width: "100%", height: 160 }} resizeMode="cover" />
                    <View style={{ position: "absolute", bottom: 10, right: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: "rgba(0,0,0,0.7)", borderWidth: 1, borderColor: accentBorder }}>
                      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}>{t("changeThumbnail")}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ height: 120, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.card }}>
                    <View style={{ width: 44, height: 44, borderRadius: 100, backgroundColor: accentSoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: accentBorder }}>
                      <ImageIcon size={20} color={colors.accent} />
                    </View>
                    <Text style={{ color: colors.text3, fontSize: 13 }}>{t("addThumbnail")}</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {([
              { key: "title" as const, label: t("courseTitle"), placeholder: "e.g. Build your business in 30 days" },
              { key: "description" as const, label: t("courseDesc"), placeholder: "Describe your course...", multiline: true },
              { key: "category" as const, label: t("courseCategory"), placeholder: "Business, Finance, Health..." },
            ] as const).map((item) => (
              <View key={item.key} style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>{item.label}</Text>
                <TextInput
                  testID={`course-${item.key}-input`}
                  value={newCourse[item.key]}
                  onChangeText={(v) => setNewCourse(p => ({ ...p, [item.key]: v }))}
                  placeholder={item.placeholder}
                  placeholderTextColor={colors.text3}
                  multiline={"multiline" in item ? item.multiline : false}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    padding: 14,
                    color: colors.text,
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    ...("multiline" in item && item.multiline ? { minHeight: 80, textAlignVertical: "top" } : {}),
                  }}
                />
              </View>
            ))}

            <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 12 }}>{t("courseAccess")}</Text>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              {(["free", "followers", "pro"] as const).map((access) => {
                const labels = { free: t("free"), followers: t("followersOnly"), pro: "Pro" };
                const ac = ACCESS_COLORS[access];
                const isSelected = newCourse.access === access;
                return (
                  <Pressable
                    key={access}
                    testID={`access-${access}`}
                    onPress={() => setNewCourse(p => ({ ...p, access }))}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 16,
                      alignItems: "center",
                      backgroundColor: isSelected ? ac.bg : colors.card,
                      borderWidth: 1.5,
                      borderColor: isSelected ? ac.color : colors.border,
                    }}
                  >
                    <Text style={{
                      color: isSelected ? ac.color : colors.text2,
                      fontSize: 13,
                      fontWeight: "700",
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
