import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image, Modal,
  TextInput, ActivityIndicator, Alert, Pressable,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useSession, useInvalidateSession } from "@/lib/auth/use-session";
import { authClient } from "@/lib/auth/auth-client";
import { User, Goal, Sprint } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CheckCircle, Target, Zap, LogOut, Edit3, X, Award, Globe, Lock,
  Camera, Pin, Link, ChevronRight, Users, BarChart2, Layers,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { uploadFile } from "@/lib/upload";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

interface EditData {
  name: string;
  bio: string;
  mainAmbition: string;
  currentGoals: string;
  username: string;
  skills: string;
  projects: string;
}

interface ParsedProject {
  title: string;
  description: string;
}

function parseProjects(raw: string): ParsedProject[] {
  if (!raw?.trim()) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((line) => {
      const sep = line.indexOf(":");
      if (sep > -1) {
        return { title: line.slice(0, sep).trim(), description: line.slice(sep + 1).trim() };
      }
      return { title: line, description: "" };
    });
}

function parseSkills(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ProfileScreen() {
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();
  const queryClient = useQueryClient();
  const { mode, colors, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState<EditData>({
    name: "",
    bio: "",
    mainAmbition: "",
    currentGoals: "",
    username: "",
    skills: "",
    projects: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const accentSoft = `${colors.accent}1F`;
  const accentBorder = `${colors.accent}4D`;
  const errorSoft = `${colors.error}1A`;
  const errorBorder = `${colors.error}47`;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/api/me"),
    enabled: !!session?.user,
  });

  const { data: goals } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<Goal[]>("/api/goals"),
    enabled: !!session?.user,
  });

  const { data: sprints } = useQuery({
    queryKey: ["sprints"],
    queryFn: () => api.get<Sprint[]>("/api/sprints"),
    enabled: !!session?.user,
  });

  const updateProfile = useMutation({
    mutationFn: (data: Record<string, string>) => api.patch("/api/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setShowEdit(false);
    },
  });

  const handleSignOut = async () => {
    Alert.alert(t("signOut"), t("signOutMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("signOut"),
        style: "destructive",
        onPress: async () => {
          await authClient.signOut();
          await invalidateSession();
        },
      },
    ]);
  };

  const openEdit = () => {
    setEditData({
      name: profile?.name || session?.user?.name || "",
      bio: profile?.bio || "",
      mainAmbition: profile?.mainAmbition || "",
      currentGoals: profile?.currentGoals || "",
      username: profile?.username || "",
      skills: (profile as any)?.skills || "",
      projects: (profile as any)?.projects || "",
    });
    setShowEdit(true);
  };

  const handleAvatarPress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() || "jpg";
      const mimeType = `image/${ext}`;
      const fileName = asset.fileName || `avatar.${ext}`;
      setUploadingAvatar(true);
      try {
        const uploaded = await uploadFile(asset.uri, fileName, mimeType);
        await api.patch("/api/me", { image: uploaded.url });
        queryClient.invalidateQueries({ queryKey: ["me"] });
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const interests = (() => {
    try {
      return profile?.interests ? (JSON.parse(profile.interests) as string[]) : [];
    } catch {
      return [];
    }
  })();

  const skills = parseSkills((profile as any)?.skills || "");
  const projects = parseProjects((profile as any)?.projects || "");

  const completedGoals = goals?.filter((g) => g.isCompleted).length || 0;
  const activeGoals = goals?.filter((g) => !g.isCompleted).length || 0;
  const bestStreak =
    sprints?.reduce((max, s) => Math.max(max, s.members?.[0]?.streak || 0), 0) || 0;

  if (profileLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}
        testID="loading-indicator"
      >
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const displayName = profile?.name || session?.user?.name || "User";
  const avatarImage = profile?.image || session?.user?.image;

  const sectionCard = {
    backgroundColor: colors.card,
    borderRadius: 20 as const,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: "hidden" as const,
  };

  const sectionPad = { padding: 18 };

  const sectionLabel = {
    color: colors.text3,
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    marginBottom: 14,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="profile-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "transparent" }}>
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
        }}>
          <Text style={{ flex: 1, fontSize: 26, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
            {t("profileTitle")}
          </Text>
          <TouchableOpacity
            onPress={openEdit}
            testID="edit-profile-button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: accentSoft,
              borderWidth: 1,
              borderColor: accentBorder,
              borderRadius: 100,
              paddingHorizontal: 14,
              paddingVertical: 8,
              marginRight: 8,
            }}
          >
            <Edit3 size={13} color={colors.accent} />
            <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>{t("edit")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSignOut}
            testID="sign-out-button"
            style={{
              width: 36,
              height: 36,
              borderRadius: 100,
              backgroundColor: errorSoft,
              borderWidth: 1,
              borderColor: errorBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LogOut size={15} color={colors.error} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Cover Banner */}
        <View style={{ marginHorizontal: 16, marginBottom: 0, marginTop: 4 }}>
          <View style={{
            height: 140,
            backgroundColor: colors.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
            position: "relative",
          }}>
            {/* Subtle diagonal pattern lines */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  width: 2,
                  height: 300,
                  backgroundColor: colors.accent,
                  opacity: 0.04,
                  top: -80,
                  left: i * 52 - 20,
                  transform: [{ rotate: "30deg" }],
                }}
              />
            ))}
            {/* Edit Cover button */}
            <TouchableOpacity
              onPress={openEdit}
              testID="edit-cover-button"
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: `${colors.bg}CC`,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 100,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Camera size={11} color={colors.text2} />
              <Text style={{ color: colors.text2, fontSize: 11, fontWeight: "600" }}>Edit Cover</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar overlapping the cover */}
          <View style={{ marginTop: -36, marginLeft: 16, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
              testID="avatar-button"
            >
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 100,
                backgroundColor: colors.bg2,
                borderWidth: 3,
                borderColor: colors.bg,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                shadowColor: "#000",
                shadowOpacity: 0.25,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}>
                {uploadingAvatar ? (
                  <ActivityIndicator color={colors.accent} />
                ) : avatarImage ? (
                  <Image source={{ uri: avatarImage }} style={{ width: 80, height: 80 }} />
                ) : (
                  <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 30 }}>
                    {displayName[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: 24,
                height: 24,
                borderRadius: 100,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.bg,
              }}>
                <Camera size={11} color={colors.bg} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Header - name, username, verification */}
        <Animated.View entering={FadeInDown.duration(300)} style={{ marginHorizontal: 16, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.4 }}>
              {displayName}
            </Text>
            {profile?.isVerified ? (
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 100,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}>
                <CheckCircle size={13} color={colors.bg} fill={colors.bg} />
              </View>
            ) : null}
            {profile?.role === "mentor" ? (
              <View style={{
                borderWidth: 1,
                borderColor: accentBorder,
                backgroundColor: accentSoft,
                paddingHorizontal: 9,
                paddingVertical: 3,
                borderRadius: 100,
              }}>
                <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                  MENTOR
                </Text>
              </View>
            ) : null}
          </View>

          {profile?.username ? (
            <Text style={{ color: colors.text3, fontSize: 14, marginBottom: 6 }}>@{profile.username}</Text>
          ) : null}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            {profile?.isPublic ? (
              <Globe size={11} color={colors.text3} />
            ) : (
              <Lock size={11} color={colors.text3} />
            )}
            <Text style={{ color: colors.text3, fontSize: 11 }}>
              {profile?.isPublic ? t("publicProfile") : t("privateProfile")}
            </Text>
          </View>

          {profile?.bio ? (
            <Text style={{
              color: colors.text2,
              fontSize: 14,
              lineHeight: 21,
              marginTop: 10,
            }}>
              {profile.bio}
            </Text>
          ) : null}
        </Animated.View>

        {/* Stats Row: Posts, Followers, Following */}
        <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 14 }}>
          {[
            { labelKey: "posts", value: profile?._count?.posts || 0 },
            { labelKey: "followers", value: profile?._count?.followers || 0 },
            { labelKey: "following", value: profile?._count?.following || 0 },
          ].map((item) => (
            <View
              key={item.labelKey}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 14,
                backgroundColor: colors.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 }}>
                {item.value}
              </Text>
              <Text style={{ color: colors.text3, fontSize: 11, marginTop: 3, fontWeight: "500" }}>
                {t(item.labelKey as any)}
              </Text>
            </View>
          ))}
        </View>

        {/* Pinned Post Placeholder */}
        <View style={{ ...sectionCard }}>
          <View style={{ ...sectionPad }}>
            <Text style={sectionLabel}>PINNED</Text>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 4,
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.bg2,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Pin size={16} color={colors.text3} />
              </View>
              <Text style={{ color: colors.text3, fontSize: 14 }}>No pinned post yet</Text>
            </View>
          </View>
        </View>

        {/* Skills Section */}
        <Animated.View entering={FadeInDown.duration(350).delay(50)} style={sectionCard}>
          <View style={sectionPad}>
            <Text style={sectionLabel}>SKILLS</Text>
            {skills.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {skills.map((skill) => (
                  <View
                    key={skill}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: accentBorder,
                      backgroundColor: accentSoft,
                      borderRadius: 100,
                    }}
                  >
                    <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>{skill}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <TouchableOpacity onPress={openEdit} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 100,
                  borderStyle: "dashed",
                }}>
                  <Text style={{ color: colors.text3, fontSize: 12 }}>+ Add your skills</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* About & Current Focus Section */}
        {(profile?.mainAmbition || profile?.currentGoals) ? (
          <Animated.View entering={FadeInDown.duration(350).delay(80)} style={sectionCard}>
            <View style={sectionPad}>
              {profile?.mainAmbition ? (
                <View style={{ marginBottom: profile?.currentGoals ? 16 : 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Award size={14} color={colors.accent} />
                    <Text style={sectionLabel}>ABOUT</Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>
                    {profile.mainAmbition}
                  </Text>
                </View>
              ) : null}
              {profile?.currentGoals ? (
                <View>
                  {profile?.mainAmbition ? (
                    <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Target size={14} color={colors.accent} />
                    <Text style={sectionLabel}>CURRENT FOCUS</Text>
                  </View>
                  <Text style={{ color: colors.text2, fontSize: 14, lineHeight: 22 }}>
                    {profile.currentGoals}
                  </Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {/* Projects Section */}
        {projects.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(350).delay(110)} style={sectionCard}>
            <View style={sectionPad}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Layers size={14} color={colors.accent} />
                <Text style={sectionLabel}>PROJECTS</Text>
              </View>
              {projects.map((project, idx) => (
                <View key={idx}>
                  {idx > 0 ? (
                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    <View style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: accentSoft,
                      borderWidth: 1,
                      borderColor: accentBorder,
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 1,
                    }}>
                      <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "800" }}>
                        {project.title[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                          {project.title}
                        </Text>
                        <Link size={11} color={colors.text3} />
                      </View>
                      {project.description ? (
                        <Text style={{ color: colors.text2, fontSize: 13, lineHeight: 19 }}>
                          {project.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : (
          <View style={sectionCard}>
            <Pressable onPress={openEdit}>
              <View style={sectionPad}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Layers size={14} color={colors.text3} />
                  <Text style={{ ...sectionLabel, color: colors.text3 }}>PROJECTS</Text>
                </View>
                <View style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  borderStyle: "dashed",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <Text style={{ color: colors.text3, fontSize: 13 }}>+ Add your projects</Text>
                </View>
              </View>
            </Pressable>
          </View>
        )}

        {/* Goals Section */}
        {goals && goals.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(350).delay(140)} style={sectionCard}>
            <View style={sectionPad}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Target size={14} color={colors.accent} />
                <Text style={sectionLabel}>GOALS</Text>
              </View>
              {goals.map((goal, idx) => (
                <View key={goal.id}>
                  {idx > 0 ? (
                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 100,
                      backgroundColor: goal.isCompleted ? accentSoft : colors.bg2,
                      borderWidth: 1.5,
                      borderColor: goal.isCompleted ? colors.accent : colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 1,
                    }}>
                      {goal.isCompleted ? (
                        <CheckCircle size={12} color={colors.accent} fill={colors.accent} />
                      ) : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: goal.isCompleted ? colors.text3 : colors.text,
                        fontSize: 14,
                        fontWeight: "600",
                        marginBottom: 6,
                        textDecorationLine: goal.isCompleted ? "line-through" : "none",
                      }}>
                        {goal.title}
                      </Text>
                      {/* Progress bar */}
                      <View style={{
                        height: 5,
                        backgroundColor: colors.bg2,
                        borderRadius: 100,
                        overflow: "hidden",
                      }}>
                        <View style={{
                          height: 5,
                          width: `${Math.min(100, Math.max(0, goal.progress || 0))}%`,
                          backgroundColor: goal.isCompleted ? colors.accent : colors.accent,
                          borderRadius: 100,
                          opacity: goal.isCompleted ? 0.5 : 1,
                        }} />
                      </View>
                      <Text style={{ color: colors.text3, fontSize: 11, marginTop: 4 }}>
                        {goal.progress || 0}% complete
                        {goal.isCompleted ? " · Done" : null}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        {/* Performance Stats */}
        <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
          <Text style={{ ...sectionLabel, marginBottom: 10 }}>{t("progress").toUpperCase()}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { icon: CheckCircle, value: completedGoals, labelKey: "goalsDone" },
              { icon: Target, value: activeGoals, labelKey: "inProgress" },
              { icon: Zap, value: bestStreak, labelKey: "bestStreak" },
            ].map(({ icon: Icon, value, labelKey }) => (
              <View
                key={labelKey}
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Icon size={16} color={colors.accent} style={{ marginBottom: 8 }} />
                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -1 }}>
                  {value}
                </Text>
                <Text style={{ color: colors.text3, fontSize: 11, marginTop: 4, textAlign: "center" }}>
                  {t(labelKey as any)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Interests */}
        {interests.length > 0 ? (
          <View style={sectionCard}>
            <View style={sectionPad}>
              <Text style={sectionLabel}>{t("interests").toUpperCase()}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {interests.map((tag: string) => (
                  <View
                    key={tag}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.bg2,
                      borderRadius: 100,
                    }}
                  >
                    <Text style={{ color: colors.text2, fontSize: 12, fontWeight: "600" }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {/* Settings */}
        <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
          <Text style={{ ...sectionLabel, marginBottom: 10 }}>{t("settings").toUpperCase()}</Text>

          {/* Language toggle */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}>
            <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" }}>{t("language")}</Text>
            <View style={{
              flexDirection: "row",
              backgroundColor: colors.bg,
              borderRadius: 100,
              padding: 3,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 3,
            }}>
              <TouchableOpacity
                onPress={() => setLang("en")}
                testID="lang-en-button"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: lang === "en" ? colors.accent : "transparent",
                }}
              >
                <Text style={{ color: lang === "en" ? colors.bg : colors.text3, fontWeight: "700", fontSize: 13 }}>
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLang("es")}
                testID="lang-es-button"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: lang === "es" ? colors.accent : "transparent",
                }}
              >
                <Text style={{ color: lang === "es" ? colors.bg : colors.text3, fontWeight: "700", fontSize: 13 }}>
                  ES
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Theme toggle */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
          }}>
            <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" }}>{t("displayMode")}</Text>
            <View style={{
              flexDirection: "row",
              backgroundColor: colors.bg,
              borderRadius: 100,
              padding: 3,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 3,
            }}>
              <TouchableOpacity
                onPress={() => setTheme("dark")}
                testID="theme-dark-button"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: mode === "dark" ? colors.accent : "transparent",
                }}
              >
                <Text style={{ color: mode === "dark" ? colors.bg : colors.text3, fontWeight: "700", fontSize: 13 }}>
                  {t("dark")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTheme("light")}
                testID="theme-light-button"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: mode === "light" ? colors.accent : "transparent",
                }}
              >
                <Text style={{ color: mode === "light" ? colors.bg : colors.text3, fontWeight: "700", fontSize: 13 }}>
                  {t("light")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          testID="sign-out-bottom-button"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginHorizontal: 16,
            marginBottom: 24,
            backgroundColor: errorSoft,
            borderWidth: 1,
            borderColor: errorBorder,
            borderRadius: 100,
            padding: 16,
          }}
        >
          <LogOut size={16} color={colors.error} />
          <Text style={{ color: colors.error, fontSize: 15, fontWeight: "700" }}>{t("signOut")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{
            width: 36,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 100,
            alignSelf: "center",
            marginTop: 12,
            marginBottom: 4,
          }} />

          <View style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <TouchableOpacity
              onPress={() => setShowEdit(false)}
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
            >
              <X size={18} color={colors.text2} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "700" }}>
              {t("editProfile")}
            </Text>
            <TouchableOpacity
              onPress={() => updateProfile.mutate(editData as unknown as Record<string, string>)}
              disabled={updateProfile.isPending}
              testID="save-profile-button"
              style={{
                backgroundColor: colors.accent,
                borderRadius: 100,
                paddingHorizontal: 20,
                paddingVertical: 9,
              }}
            >
              {updateProfile.isPending ? (
                <ActivityIndicator color={colors.bg} size="small" />
              ) : (
                <Text style={{ color: colors.bg, fontWeight: "700", fontSize: 14 }}>{t("save")}</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {/* Core fields */}
            {([
              { key: "name" as const, labelKey: "fullName", placeholder: "Your name" },
              { key: "username" as const, labelKey: "username", placeholder: "@username" },
              { key: "bio" as const, labelKey: "bio", placeholder: "Tell your story...", multiline: true },
              { key: "mainAmbition" as const, labelKey: "mainAmbition", placeholder: "What is your biggest goal in life?", multiline: true },
              { key: "currentGoals" as const, labelKey: "currentFocus", placeholder: "What are you working on right now?", multiline: true },
            ] as Array<{ key: keyof EditData; labelKey: string; placeholder: string; multiline?: boolean }>).map(
              ({ key, labelKey, placeholder, multiline }) => (
                <View key={key} style={{ marginBottom: 20 }}>
                  <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
                    {t(labelKey as any)}
                  </Text>
                  <TextInput
                    value={editData[key]}
                    onChangeText={(txt) => setEditData((p) => ({ ...p, [key]: txt }))}
                    placeholder={placeholder}
                    placeholderTextColor={colors.text3}
                    multiline={multiline}
                    testID={`edit-${key}-input`}
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      padding: 14,
                      color: colors.text,
                      fontSize: 14,
                      lineHeight: 20,
                      ...(multiline ? { minHeight: 80, textAlignVertical: "top" as const } : {}),
                    }}
                  />
                </View>
              )
            )}

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 20 }} />
            <Text style={{
              color: colors.text3,
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 16,
            }}>
              Showcase
            </Text>

            {/* Skills */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
                Skills
              </Text>
              <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 8 }}>
                Comma-separated, e.g. Trading, Product Design, Strategy, AI Tools
              </Text>
              <TextInput
                value={editData.skills}
                onChangeText={(txt) => setEditData((p) => ({ ...p, skills: txt }))}
                placeholder="e.g. Trading, Product Design, Strategy, AI Tools"
                placeholderTextColor={colors.text3}
                testID="edit-skills-input"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 14,
                  color: colors.text,
                  fontSize: 14,
                }}
              />
            </View>

            {/* Projects */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
                Projects
              </Text>
              <Text style={{ color: colors.text3, fontSize: 11, marginBottom: 8 }}>
                One per line. Format: "Title: Description"
              </Text>
              <TextInput
                value={editData.projects}
                onChangeText={(txt) => setEditData((p) => ({ ...p, projects: txt }))}
                placeholder={"e.g. Opturna OS: A premium growth platform\nTrading Journal: Daily performance tracker"}
                placeholderTextColor={colors.text3}
                multiline
                testID="edit-projects-input"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 14,
                  color: colors.text,
                  fontSize: 14,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
