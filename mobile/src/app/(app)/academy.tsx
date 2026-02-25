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

const DS = {
  bg: "#0A0F1E",
  card: "#111827",
  cardAlt: "#0F172A",
  cyan: "#00B4D8",
  cyanSoft: "rgba(0,180,216,0.12)",
  cyanBorder: "rgba(0,180,216,0.25)",
  green: "#00E5A0",
  greenSoft: "rgba(0,229,160,0.12)",
  greenBorder: "rgba(0,229,160,0.30)",
  gold: "#F59E0B",
  goldSoft: "rgba(245,158,11,0.12)",
  goldBorder: "rgba(245,158,11,0.30)",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
  border: "rgba(255,255,255,0.06)",
};

function AccessBadge({ access }: { access: string }) {
  const config: Record<string, { label: string; color: string; bg: string; border: string }> = {
    free: { label: "Free", color: DS.green, bg: DS.greenSoft, border: DS.greenBorder },
    followers: { label: "Followers", color: DS.cyan, bg: DS.cyanSoft, border: DS.cyanBorder },
    pro: { label: "Pro", color: DS.gold, bg: DS.goldSoft, border: DS.goldBorder },
  };
  const c = config[access] ?? config.free;
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
      <Text style={{
        color: c.color,
        fontSize: 10,
        fontWeight: "700",
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
      <Pressable style={{ marginBottom: 16 }} testID="course-card">
        <View style={{
          backgroundColor: DS.card,
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: DS.border,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 4 },
        }}>
          {/* Thumbnail */}
          <View style={{ height: 160, backgroundColor: DS.cardAlt, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {course.thumbnail ? (
              <>
                <Image source={{ uri: course.thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                {/* Gradient overlay for readability */}
                <View style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 60,
                  backgroundColor: "rgba(10,15,30,0.7)",
                }} />
              </>
            ) : (
              <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center" }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 100,
                  backgroundColor: DS.cyanSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: DS.cyanBorder,
                }}>
                  <BookOpen size={26} color={DS.cyan} />
                </View>
              </View>
            )}

            {/* Play button */}
            <View style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              width: 40,
              height: 40,
              borderRadius: 100,
              backgroundColor: DS.cyan,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: DS.cyan,
              shadowOpacity: 0.4,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}>
              <Play size={16} color={DS.bg} fill={DS.bg} />
            </View>

            {/* Access badge top-right */}
            <View style={{ position: "absolute", top: 12, right: 12 }}>
              <AccessBadge access={course.access} />
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 16 }}>
            <Text style={{
              color: DS.textPrimary,
              fontSize: 15,
              fontWeight: "700",
              marginBottom: 6,
              lineHeight: 21,
            }}>{course.title}</Text>

            {course.description ? (
              <Text style={{ color: DS.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 12 }} numberOfLines={2}>{course.description}</Text>
            ) : null}

            {/* Creator row */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 100,
                backgroundColor: DS.cardAlt,
                marginRight: 8,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: DS.border,
              }}>
                {course.creator?.image ? (
                  <Image source={{ uri: course.creator.image }} style={{ width: 24, height: 24 }} />
                ) : (
                  <Text style={{ color: DS.cyan, fontSize: 10, fontWeight: "800" }}>{course.creator?.name?.[0]}</Text>
                )}
              </View>
              <Text style={{ color: DS.textSecondary, fontSize: 12 }}>{course.creator?.name}</Text>
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: DS.cyanSoft,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: DS.cyanBorder,
                marginRight: 8,
              }}>
                <BookOpen size={10} color={DS.cyan} />
                <Text style={{ color: DS.cyan, fontSize: 11, fontWeight: "600" }}>{lessonCount} lessons</Text>
              </View>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(255,255,255,0.04)",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: DS.border,
              }}>
                <Users size={10} color={DS.textMuted} />
                <Text style={{ color: DS.textMuted, fontSize: 11 }}>{enrollFormatted}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <ChevronRight size={16} color={DS.textMuted} />
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
    <View style={{ flex: 1, backgroundColor: DS.bg }} testID="academy-screen">
      <SafeAreaView edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ flex: 1, fontSize: 28, fontWeight: "800", color: DS.textPrimary, letterSpacing: -0.5 }}>
              Academy
            </Text>

            {/* FAB create button - cyan pill */}
            <Pressable
              testID="create-course-button"
              onPress={() => setShowCreate(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: DS.cyan,
                borderRadius: 100,
                paddingHorizontal: 16,
                paddingVertical: 10,
                shadowColor: DS.cyan,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Plus size={16} color={DS.bg} />
              <Text style={{ color: DS.bg, fontSize: 13, fontWeight: "700" }}>Create</Text>
            </Pressable>
          </View>

          {/* Category filter pills horizontal scroll */}
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
                    backgroundColor: isActive ? DS.cyan : DS.card,
                    borderWidth: 1,
                    borderColor: isActive ? DS.cyan : DS.border,
                  }}
                >
                  <Text style={{
                    color: isActive ? DS.bg : DS.textSecondary,
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
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={DS.cyan} />}
      >
        {isLoading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }} testID="loading-indicator">
            <ActivityIndicator color={DS.cyan} size="large" />
            <Text style={{ color: DS.textMuted, fontSize: 13, marginTop: 12 }}>Loading courses...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 100,
              backgroundColor: DS.cyanSoft,
              borderWidth: 1,
              borderColor: DS.cyanBorder,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}>
              <BookOpen size={34} color={DS.cyan} />
            </View>
            <Text style={{
              color: DS.textPrimary,
              fontSize: 18,
              fontWeight: "800",
              marginBottom: 8,
              textAlign: "center",
              letterSpacing: -0.3,
            }}>No courses yet</Text>
            <Text style={{ color: DS.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 20 }}>{t("coursesDesc")}</Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={{
                marginTop: 24,
                backgroundColor: DS.cyan,
                paddingHorizontal: 28,
                paddingVertical: 13,
                borderRadius: 100,
                shadowColor: DS.cyan,
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Text style={{ color: DS.bg, fontWeight: "700", fontSize: 14 }}>Create a course</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map((course, i) => <CourseCard key={course.id} course={course} index={i} />)
        )}
      </ScrollView>

      {/* Create Course Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: DS.bg }}>
          {/* Drag indicator */}
          <View style={{ width: 36, height: 4, backgroundColor: DS.border, borderRadius: 100, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />

          {/* Modal header */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: DS.border,
          }}>
            <Pressable
              onPress={() => { setShowCreate(false); setPickedThumbnail(null); }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 100,
                borderWidth: 1,
                borderColor: DS.border,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
              testID="close-create-modal"
            >
              <X size={18} color={DS.textSecondary} />
            </Pressable>
            <Text style={{ flex: 1, color: DS.textPrimary, fontSize: 17, fontWeight: "700" }}>New course</Text>
            <Pressable
              testID="publish-course-button"
              onPress={() => createCourse.mutate()}
              disabled={!newCourse.title.trim() || createCourse.isPending || uploadingThumb}
              style={{
                backgroundColor: newCourse.title.trim() ? DS.cyan : "rgba(255,255,255,0.08)",
                paddingHorizontal: 20,
                paddingVertical: 9,
                borderRadius: 100,
                opacity: !newCourse.title.trim() ? 0.5 : 1,
              }}
            >
              {createCourse.isPending || uploadingThumb ? (
                <ActivityIndicator color={DS.bg} size="small" />
              ) : (
                <Text style={{
                  color: newCourse.title.trim() ? DS.bg : DS.textMuted,
                  fontWeight: "700",
                  fontSize: 14,
                }}>{t("publish")}</Text>
              )}
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {/* Thumbnail picker */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: DS.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>Thumbnail</Text>
              <Pressable
                onPress={pickThumbnail}
                testID="pick-thumbnail-button"
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: DS.border,
                  borderStyle: "dashed",
                }}
              >
                {pickedThumbnail ? (
                  <View>
                    <Image source={{ uri: pickedThumbnail.uri }} style={{ width: "100%", height: 160 }} resizeMode="cover" />
                    <View style={{ position: "absolute", bottom: 10, right: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: "rgba(10,15,30,0.8)", borderWidth: 1, borderColor: DS.cyanBorder }}>
                      <Text style={{ color: DS.cyan, fontSize: 11, fontWeight: "700" }}>{t("changeThumbnail")}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ height: 120, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: DS.card }}>
                    <View style={{ width: 44, height: 44, borderRadius: 100, backgroundColor: DS.cyanSoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: DS.cyanBorder }}>
                      <ImageIcon size={20} color={DS.cyan} />
                    </View>
                    <Text style={{ color: DS.textMuted, fontSize: 13 }}>{t("addThumbnail")}</Text>
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
                <Text style={{ color: DS.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>{item.label}</Text>
                <TextInput
                  testID={`course-${item.key}-input`}
                  value={newCourse[item.key]}
                  onChangeText={(v) => setNewCourse(p => ({ ...p, [item.key]: v }))}
                  placeholder={item.placeholder}
                  placeholderTextColor={DS.textMuted}
                  multiline={"multiline" in item ? item.multiline : false}
                  style={{
                    backgroundColor: DS.card,
                    borderRadius: 12,
                    padding: 14,
                    color: DS.textPrimary,
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: DS.border,
                    ...("multiline" in item && item.multiline ? { minHeight: 80, textAlignVertical: "top" } : {}),
                  }}
                />
              </View>
            ))}

            <Text style={{ color: DS.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 12 }}>{t("courseAccess")}</Text>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              {(["free", "followers", "pro"] as const).map((access) => {
                const labels = { free: t("free"), followers: t("followersOnly"), pro: "Pro" };
                const accentColor: Record<string, string> = { free: DS.green, followers: DS.cyan, pro: DS.gold };
                const accentBg: Record<string, string> = { free: DS.greenSoft, followers: DS.cyanSoft, pro: DS.goldSoft };
                const accentBorder: Record<string, string> = { free: DS.greenBorder, followers: DS.cyanBorder, pro: DS.goldBorder };
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
                      backgroundColor: isSelected ? accentBg[access] : DS.card,
                      borderWidth: 1.5,
                      borderColor: isSelected ? accentColor[access] : DS.border,
                    }}
                  >
                    <Text style={{
                      color: isSelected ? accentColor[access] : DS.textSecondary,
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
