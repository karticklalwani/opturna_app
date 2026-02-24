import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { Course } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookOpen, Play, Users, Lock, ChevronRight } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const COURSE_CATEGORIES = ["All", "Business", "Mindset", "Finance", "Health", "Tech", "Philosophy"];

function CourseCard({ course, index }: { course: Course; index: number }) {
  const accessColors: Record<string, string> = {
    free: "#22C55E",
    followers: "#3B82F6",
    pro: "#F59E0B",
  };
  const accessLabels: Record<string, string> = {
    free: "Free",
    followers: "Followers",
    pro: "Pro",
  };

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <TouchableOpacity style={{ marginBottom: 16 }} testID="course-card">
        <View style={{ backgroundColor: "#141414", borderRadius: 16, overflow: "hidden" }}>
          {/* Thumbnail */}
          <View style={{ height: 160, backgroundColor: "#1C1C1E", alignItems: "center", justifyContent: "center" }}>
            {course.thumbnail ? (
              <Image source={{ uri: course.thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <View style={{ alignItems: "center", gap: 8 }}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#27272A", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={28} color="#F59E0B" />
                </View>
                <Text style={{ color: "#52525B", fontSize: 12 }}>No thumbnail</Text>
              </View>
            )}
            {/* Play button overlay */}
            <View style={{
              position: "absolute",
              bottom: 12, right: 12,
              width: 44, height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(245, 158, 11, 0.9)",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Play size={20} color="#0A0A0A" fill="#0A0A0A" />
            </View>
            {/* Access badge */}
            <View style={{
              position: "absolute", top: 12, left: 12,
              paddingHorizontal: 8, paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: `${accessColors[course.access] || "#22C55E"}22`,
              borderWidth: 1, borderColor: accessColors[course.access] || "#22C55E",
              flexDirection: "row", alignItems: "center", gap: 4,
            }}>
              {course.access !== "free" ? <Lock size={10} color={accessColors[course.access]} /> : null}
              <Text style={{ color: accessColors[course.access] || "#22C55E", fontSize: 11, fontWeight: "700" }}>
                {accessLabels[course.access] || "Free"}
              </Text>
            </View>
          </View>

          <View style={{ padding: 14 }}>
            <Text style={{ color: "#FAFAFA", fontSize: 16, fontWeight: "700", marginBottom: 6, lineHeight: 22 }}>
              {course.title}
            </Text>
            {course.description ? (
              <Text style={{ color: "#71717A", fontSize: 13, lineHeight: 20, marginBottom: 10 }} numberOfLines={2}>
                {course.description}
              </Text>
            ) : null}

            {/* Creator */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#27272A", marginRight: 8, overflow: "hidden" }}>
                {course.creator?.image ? (
                  <Image source={{ uri: course.creator.image }} style={{ width: 24, height: 24 }} />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "700" }}>
                      {course.creator?.name?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ color: "#71717A", fontSize: 13 }}>{course.creator?.name}</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <BookOpen size={13} color="#52525B" />
                <Text style={{ color: "#52525B", fontSize: 12 }}>{course._count?.lessons || 0} lessons</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Users size={13} color="#52525B" />
                <Text style={{ color: "#52525B", fontSize: 12 }}>{course._count?.enrollments || 0} enrolled</Text>
              </View>
              <View style={{ flex: 1 }} />
              <ChevronRight size={16} color="#52525B" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AcademyScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { data: courses, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.get<Course[]>("/api/courses"),
  });

  const filtered = courses?.filter(c => selectedCategory === "All" || c.category === selectedCategory) || [];

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} testID="academy-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#FAFAFA", letterSpacing: -0.5, marginBottom: 4 }}>
            Academy
          </Text>
          <Text style={{ color: "#52525B", fontSize: 14, marginBottom: 16 }}>
            Learn from the best builders and thinkers
          </Text>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
            {COURSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: selectedCategory === cat ? "#F59E0B" : "#1C1C1E",
                  borderWidth: 1, borderColor: selectedCategory === cat ? "#F59E0B" : "#27272A",
                }}
              >
                <Text style={{ color: selectedCategory === cat ? "#0A0A0A" : "#71717A", fontSize: 13, fontWeight: "600" }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#F59E0B" />}
      >
        {isLoading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }} testID="loading-indicator">
            <ActivityIndicator color="#F59E0B" size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>📚</Text>
            <Text style={{ color: "#FAFAFA", fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>
              No courses yet
            </Text>
            <Text style={{ color: "#52525B", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
              Courses from expert creators will appear here.
            </Text>
          </View>
        ) : (
          filtered.map((course, i) => <CourseCard key={course.id} course={course} index={i} />)
        )}
      </ScrollView>
    </View>
  );
}
