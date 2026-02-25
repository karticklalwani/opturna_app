import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Modal, TextInput } from "react-native";
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

function CourseCard({ course, index, colors }: { course: Course; index: number; colors: typeof import("@/lib/theme").DARK }) {
  const accessColors: Record<string, string> = { free: "#22C55E", followers: "#3B82F6", pro: "#F59E0B" };
  const accessLabels: Record<string, string> = { free: "Gratis", followers: "Seguidores", pro: "Pro" };

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <TouchableOpacity style={{ marginBottom: 16 }} testID="course-card">
        <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: "hidden" }}>
          <View style={{ height: 160, backgroundColor: colors.bg3, alignItems: "center", justifyContent: "center" }}>
            {course.thumbnail
              ? <Image source={{ uri: course.thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              : (
                <View style={{ alignItems: "center", gap: 8 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.bg4, alignItems: "center", justifyContent: "center" }}>
                    <BookOpen size={28} color={colors.accent} />
                  </View>
                </View>
              )
            }
            <View style={{ position: "absolute", bottom: 12, right: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.accent}E0`, alignItems: "center", justifyContent: "center" }}>
              <Play size={20} color="#0A0A0A" fill="#0A0A0A" />
            </View>
            <View style={{ position: "absolute", top: 12, left: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: `${accessColors[course.access] || "#22C55E"}22`, borderWidth: 1, borderColor: accessColors[course.access] || "#22C55E", flexDirection: "row", alignItems: "center", gap: 4 }}>
              {course.access !== "free" && <Lock size={10} color={accessColors[course.access]} />}
              <Text style={{ color: accessColors[course.access] || "#22C55E", fontSize: 11, fontWeight: "700" }}>{accessLabels[course.access] || "Gratis"}</Text>
            </View>
          </View>
          <View style={{ padding: 14 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 6, lineHeight: 22 }}>{course.title}</Text>
            {course.description ? <Text style={{ color: colors.text3, fontSize: 13, lineHeight: 20, marginBottom: 10 }} numberOfLines={2}>{course.description}</Text> : null}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bg3, marginRight: 8, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                {course.creator?.image
                  ? <Image source={{ uri: course.creator.image }} style={{ width: 24, height: 24 }} />
                  : <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700" }}>{course.creator?.name?.[0]}</Text>
                }
              </View>
              <Text style={{ color: colors.text3, fontSize: 13 }}>{course.creator?.name}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <BookOpen size={13} color={colors.text4} />
                <Text style={{ color: colors.text4, fontSize: 12 }}>{course._count?.lessons || 0} lecciones</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Users size={13} color={colors.text4} />
                <Text style={{ color: colors.text4, fontSize: 12 }}>{course._count?.enrollments || 0} alumnos</Text>
              </View>
              <View style={{ flex: 1 }} />
              <ChevronRight size={16} color={colors.text4} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="academy-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.5, flex: 1 }}>{t("academy")}</Text>
            <TouchableOpacity
              testID="create-course-button"
              onPress={() => setShowCreate(true)}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}
            >
              <Plus size={22} color="#0A0A0A" />
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.text4, fontSize: 14, marginBottom: 16 }}>Aprende de los mejores creadores</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
            {COURSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: selectedCategory === cat ? colors.accent : colors.bg3, borderWidth: 1, borderColor: selectedCategory === cat ? colors.accent : colors.border }}
              >
                <Text style={{ color: selectedCategory === cat ? "#0A0A0A" : colors.text3, fontSize: 13, fontWeight: "600" }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}>
        {isLoading
          ? <View style={{ alignItems: "center", paddingTop: 60 }} testID="loading-indicator"><ActivityIndicator color={colors.accent} size="large" /></View>
          : filtered.length === 0
            ? (
              <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
                <Text style={{ fontSize: 40, marginBottom: 16 }}>📚</Text>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>{t("noCourses")}</Text>
                <Text style={{ color: colors.text4, fontSize: 14, textAlign: "center", lineHeight: 22 }}>{t("coursesDesc")}</Text>
                <TouchableOpacity onPress={() => setShowCreate(true)} style={{ marginTop: 20, backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
                  <Text style={{ color: "#0A0A0A", fontWeight: "700" }}>{t("createCourse")}</Text>
                </TouchableOpacity>
              </View>
            )
            : filtered.map((course, i) => <CourseCard key={course.id} course={course} index={i} colors={colors} />)
        }
      </ScrollView>

      {/* Create Course Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={() => { setShowCreate(false); setPickedThumbnail(null); }} style={{ marginRight: 16 }} testID="close-create-modal">
              <X size={22} color={colors.text3} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "600" }}>{t("createCourse")}</Text>
            <TouchableOpacity
              testID="publish-course-button"
              onPress={() => createCourse.mutate()}
              disabled={!newCourse.title.trim() || createCourse.isPending || uploadingThumb}
              style={{ backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, opacity: !newCourse.title.trim() ? 0.5 : 1 }}
            >
              {createCourse.isPending || uploadingThumb ? <ActivityIndicator color="#0A0A0A" size="small" /> : (
                <Text style={{ color: "#0A0A0A", fontWeight: "700", fontSize: 14 }}>{t("publish")}</Text>
              )}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {/* Thumbnail picker */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Thumbnail</Text>
              <TouchableOpacity
                onPress={pickThumbnail}
                testID="pick-thumbnail-button"
                style={{ borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" }}
              >
                {pickedThumbnail ? (
                  <View>
                    <Image source={{ uri: pickedThumbnail.uri }} style={{ width: "100%", height: 160 }} resizeMode="cover" />
                    <View style={{ position: "absolute", bottom: 8, right: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.6)" }}>
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Change</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ height: 120, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.bg3 }}>
                    <ImageIcon size={28} color={colors.text4} />
                    <Text style={{ color: colors.text4, fontSize: 13 }}>Tap to add thumbnail</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {([
              { key: "title" as const, label: t("courseTitle"), placeholder: "ej. Construye tu negocio en 30 días" },
              { key: "description" as const, label: t("courseDesc"), placeholder: "Describe tu curso...", multiline: true },
              { key: "category" as const, label: t("courseCategory"), placeholder: "Negocios, Finanzas, Salud..." },
            ] as const).map((item) => (
              <View key={item.key} style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{item.label}</Text>
                <TextInput
                  testID={`course-${item.key}-input`}
                  value={newCourse[item.key]}
                  onChangeText={(v) => setNewCourse(p => ({ ...p, [item.key]: v }))}
                  placeholder={item.placeholder}
                  placeholderTextColor={colors.text4}
                  multiline={"multiline" in item ? item.multiline : false}
                  style={{ backgroundColor: colors.bg3, borderRadius: 12, padding: 14, color: colors.text, fontSize: 15, ...("multiline" in item && item.multiline ? { minHeight: 80 } : {}) }}
                />
              </View>
            ))}
            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>{t("courseAccess")}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              {(["free", "followers", "pro"] as const).map((access) => {
                const labels = { free: t("free"), followers: t("followersOnly"), pro: "Pro" };
                return (
                  <TouchableOpacity
                    key={access}
                    testID={`access-${access}`}
                    onPress={() => setNewCourse(p => ({ ...p, access }))}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: newCourse.access === access ? colors.accent : colors.bg3, borderWidth: 1, borderColor: newCourse.access === access ? colors.accent : colors.border }}
                  >
                    <Text style={{ color: newCourse.access === access ? "#0A0A0A" : colors.text3, fontSize: 13, fontWeight: "600" }}>{labels[access]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
