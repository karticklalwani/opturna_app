import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image, Modal,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { useSession, useInvalidateSession } from "@/lib/auth/use-session";
import { authClient } from "@/lib/auth/auth-client";
import { User, Goal, Sprint } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle, Target, Zap, LogOut, Edit3, X, Award, Globe, Lock, Camera } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { uploadFile } from "@/lib/upload";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

export default function ProfileScreen() {
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();
  const queryClient = useQueryClient();
  const { colors, mode, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({ name: "", bio: "", mainAmbition: "", currentGoals: "", username: "" });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
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
    try { return profile?.interests ? JSON.parse(profile.interests) as string[] : []; }
    catch { return []; }
  })();

  const completedGoals = goals?.filter(g => g.isCompleted).length || 0;
  const activeGoals = goals?.filter(g => !g.isCompleted).length || 0;
  const bestStreak = sprints?.reduce((max, s) => Math.max(max, s.members?.[0]?.streak || 0), 0) || 0;

  if (profileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const displayName = profile?.name || session?.user?.name || "User";
  const avatarImage = profile?.image || session?.user?.image;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="profile-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, flex: 1, letterSpacing: -0.5 }}>Profile</Text>
          <TouchableOpacity onPress={openEdit} style={{ padding: 8, marginRight: 4 }} testID="edit-profile-button">
            <Edit3 size={20} color={colors.text3} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={{ padding: 8 }} testID="sign-out-button">
            <LogOut size={20} color={colors.text3} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Cover */}
        <View style={{ height: 120, backgroundColor: colors.bg2, position: "relative" }}>
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, backgroundColor: colors.bg }} />
        </View>

        {/* Avatar & basic info */}
        <View style={{ paddingHorizontal: 16, marginTop: -40 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 16 }}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
              testID="avatar-button"
              style={{ position: "relative" }}
            >
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: colors.bg, overflow: "hidden" }}>
                {uploadingAvatar ? (
                  <ActivityIndicator color="#0A0A0A" />
                ) : avatarImage ? (
                  <Image source={{ uri: avatarImage }} style={{ width: 80, height: 80 }} />
                ) : (
                  <Text style={{ color: "#0A0A0A", fontWeight: "800", fontSize: 30 }}>
                    {displayName[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.bg }}>
                <Camera size={12} color="#0A0A0A" />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14, marginBottom: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>{displayName}</Text>
                {profile?.isVerified ? <CheckCircle size={16} color={colors.accent} fill={colors.accent} /> : null}
                {profile?.role === "mentor" ? (
                  <View style={{ backgroundColor: `${colors.accent}22`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700" }}>MENTOR</Text>
                  </View>
                ) : null}
              </View>
              {profile?.username ? (
                <Text style={{ color: colors.text3, fontSize: 14 }}>@{profile.username}</Text>
              ) : null}
            </View>
            <View style={{ flexDirection: "row", gap: 4, marginBottom: 4 }}>
              {profile?.isPublic ? (
                <Globe size={14} color={colors.text4} />
              ) : (
                <Lock size={14} color={colors.text4} />
              )}
            </View>
          </View>

          {profile?.bio ? (
            <Text style={{ color: colors.text2, fontSize: 14, lineHeight: 22, marginBottom: 12 }}>{profile.bio}</Text>
          ) : null}

          {/* Followers */}
          <View style={{ flexDirection: "row", gap: 24, marginBottom: 16 }}>
            <View>
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>{profile?._count?.followers || 0}</Text>
              <Text style={{ color: colors.text4, fontSize: 12 }}>Followers</Text>
            </View>
            <View>
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>{profile?._count?.following || 0}</Text>
              <Text style={{ color: colors.text4, fontSize: 12 }}>Following</Text>
            </View>
            <View>
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>{profile?._count?.posts || 0}</Text>
              <Text style={{ color: colors.text4, fontSize: 12 }}>Posts</Text>
            </View>
          </View>

          {/* Interests */}
          {interests.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {interests.map((tag: string) => (
                <View key={tag} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.text2, fontSize: 12, fontWeight: "500" }}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Main Ambition */}
          {profile?.mainAmbition ? (
            <Animated.View entering={FadeInDown.duration(400)} style={{ backgroundColor: `${colors.accent}18`, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: `${colors.accent}33` }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Award size={16} color={colors.accent} />
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>Main Ambition</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{profile.mainAmbition}</Text>
            </Animated.View>
          ) : null}

          {/* Stats grid */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            <View style={{ flex: 1, backgroundColor: colors.bg2, borderRadius: 14, padding: 14 }}>
              <Target size={20} color={colors.success} />
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 8 }}>{completedGoals}</Text>
              <Text style={{ color: colors.text4, fontSize: 11 }}>Goals done</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.bg2, borderRadius: 14, padding: 14 }}>
              <Target size={20} color={colors.accent} />
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 8 }}>{activeGoals}</Text>
              <Text style={{ color: colors.text4, fontSize: 11 }}>In progress</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.bg2, borderRadius: 14, padding: 14 }}>
              <Zap size={20} color={colors.info} />
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 8 }}>{bestStreak}</Text>
              <Text style={{ color: colors.text4, fontSize: 11 }}>Best streak</Text>
            </View>
          </View>

          {/* Current Goals */}
          {profile?.currentGoals ? (
            <View style={{ backgroundColor: colors.bg2, borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <Text style={{ color: colors.text4, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Current Focus</Text>
              <Text style={{ color: colors.text2, fontSize: 14, lineHeight: 22 }}>{profile.currentGoals}</Text>
            </View>
          ) : null}

          {/* Settings section */}
          <View style={{ backgroundColor: colors.bg2, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
            {/* Language toggle */}
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>Language / Idioma</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 4, backgroundColor: colors.bg3, borderRadius: 10, padding: 3 }}>
                <TouchableOpacity
                  onPress={() => setLang("en")}
                  testID="lang-en-button"
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: lang === "en" ? colors.accent : "transparent" }}
                >
                  <Text style={{ color: lang === "en" ? "#0A0A0A" : colors.text3, fontWeight: "600", fontSize: 13 }}>EN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLang("es")}
                  testID="lang-es-button"
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: lang === "es" ? colors.accent : "transparent" }}
                >
                  <Text style={{ color: lang === "es" ? "#0A0A0A" : colors.text3, fontWeight: "600", fontSize: 13 }}>ES</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Theme toggle */}
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>{t("theme")} / Tema</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 4, backgroundColor: colors.bg3, borderRadius: 10, padding: 3 }}>
                <TouchableOpacity
                  onPress={() => setTheme("dark")}
                  testID="theme-dark-button"
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: mode === "dark" ? colors.accent : "transparent" }}
                >
                  <Text style={{ color: mode === "dark" ? "#0A0A0A" : colors.text3, fontWeight: "600", fontSize: 13 }}>{t("dark")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTheme("light")}
                  testID="theme-light-button"
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: mode === "light" ? colors.accent : "transparent" }}
                >
                  <Text style={{ color: mode === "light" ? "#0A0A0A" : colors.text3, fontWeight: "600", fontSize: 13 }}>{t("light")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={() => setShowEdit(false)} style={{ marginRight: 16 }}>
              <X size={22} color={colors.text3} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "600" }}>Edit Profile</Text>
            <TouchableOpacity
              onPress={() => updateProfile.mutate(editData)}
              disabled={updateProfile.isPending}
              testID="save-profile-button"
              style={{ backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 }}
            >
              {updateProfile.isPending ? <ActivityIndicator color="#0A0A0A" size="small" /> : (
                <Text style={{ color: "#0A0A0A", fontWeight: "700", fontSize: 14 }}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {([
              { key: "name" as const, label: "Full Name", placeholder: "Your name" },
              { key: "username" as const, label: "Username", placeholder: "@username" },
              { key: "bio" as const, label: "Bio", placeholder: "Tell your story...", multiline: true },
              { key: "mainAmbition" as const, label: "Main Ambition", placeholder: "What is your biggest goal in life?", multiline: true },
              { key: "currentGoals" as const, label: "Current Focus", placeholder: "What are you working on right now?", multiline: true },
            ]).map(({ key, label, placeholder, multiline }) => (
              <View key={key} style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                  {label}
                </Text>
                <TextInput
                  value={editData[key]}
                  onChangeText={(txt) => setEditData(p => ({ ...p, [key]: txt }))}
                  placeholder={placeholder}
                  placeholderTextColor={colors.text4}
                  multiline={multiline}
                  testID={`edit-${key}-input`}
                  style={{
                    backgroundColor: colors.bg3,
                    borderRadius: 12,
                    padding: 14,
                    color: colors.text,
                    fontSize: 15,
                    ...(multiline ? { minHeight: 80 } : {}),
                  }}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
