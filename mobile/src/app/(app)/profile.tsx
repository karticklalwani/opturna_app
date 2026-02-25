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
  const { mode, colors, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({ name: "", bio: "", mainAmbition: "", currentGoals: "", username: "" });
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
        text: t("signOut"), style: "destructive",
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
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ flex: 1, fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
            {t("profileTitle")}
          </Text>
          <TouchableOpacity
            onPress={openEdit}
            testID="edit-profile-button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
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

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero block */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 24,
          marginHorizontal: 16,
          marginTop: 4,
          marginBottom: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 4 },
        }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
              testID="avatar-button"
              style={{ marginRight: 16 }}
            >
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 100,
                backgroundColor: colors.bg2,
                borderWidth: 2.5,
                borderColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                shadowColor: colors.accent,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
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
                bottom: 0,
                right: 0,
                width: 26,
                height: 26,
                borderRadius: 100,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.card,
              }}>
                <Camera size={12} color={colors.bg} />
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1, paddingTop: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 }}>{displayName}</Text>
                {profile?.isVerified ? (
                  <View style={{
                    width: 18,
                    height: 18,
                    borderRadius: 100,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <CheckCircle size={12} color={colors.bg} fill={colors.bg} />
                  </View>
                ) : null}
                {profile?.role === "mentor" ? (
                  <View style={{
                    borderWidth: 1,
                    borderColor: accentBorder,
                    backgroundColor: accentSoft,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 100,
                  }}>
                    <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700" }}>Mentor</Text>
                  </View>
                ) : null}
              </View>

              {profile?.username ? (
                <Text style={{ color: colors.text2, fontSize: 13, marginBottom: 6 }}>@{profile.username}</Text>
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
            </View>
          </View>

          {profile?.bio ? (
            <Text style={{
              color: colors.text2,
              fontSize: 13,
              lineHeight: 20,
              marginTop: 14,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>{profile.bio}</Text>
          ) : null}
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 16 }}>
          {[
            { labelKey: "followers", value: profile?._count?.followers || 0 },
            { labelKey: "following", value: profile?._count?.following || 0 },
            { labelKey: "posts", value: profile?._count?.posts || 0 },
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
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>{item.value}</Text>
              <Text style={{ color: colors.text3, fontSize: 11, marginTop: 3 }}>{t(item.labelKey as any)}</Text>
            </View>
          ))}
        </View>

        {/* Performance stats */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", marginBottom: 10, letterSpacing: 0.3 }}>
            {t("progress")}
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { icon: Target, value: completedGoals, labelKey: "goalsDone" },
              { icon: Target, value: activeGoals, labelKey: "inProgress" },
              { icon: Zap, value: bestStreak, labelKey: "bestStreak" },
            ].map(({ icon: Icon, value, labelKey }) => (
              <View key={labelKey} style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                alignItems: "center",
              }}>
                <Icon size={18} color={colors.accent} style={{ marginBottom: 8 }} />
                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -1 }}>{value}</Text>
                <Text style={{ color: colors.text3, fontSize: 11, marginTop: 4, textAlign: "center" }}>{t(labelKey as any)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Interests */}
        {interests.length > 0 ? (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", marginBottom: 10, letterSpacing: 0.3 }}>
              {t("interests")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {interests.map((tag: string) => (
                <View
                  key={tag}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: accentBorder,
                    backgroundColor: accentSoft,
                    borderRadius: 100,
                  }}
                >
                  <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Main Ambition */}
        {profile?.mainAmbition ? (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              borderLeftWidth: 3,
              borderLeftColor: colors.accent,
              padding: 16,
              marginHorizontal: 16,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Award size={14} color={colors.accent} />
              <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600" }}>{t("mainAmbition")}</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>{profile.mainAmbition}</Text>
          </Animated.View>
        ) : null}

        {/* Current Focus */}
        {profile?.currentGoals ? (
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginHorizontal: 16,
            marginBottom: 16,
          }}>
            <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>{t("currentFocus")}</Text>
            <Text style={{ color: colors.text2, fontSize: 13, lineHeight: 20 }}>{profile.currentGoals}</Text>
          </View>
        ) : null}

        {/* Settings */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: colors.text3, fontSize: 12, fontWeight: "600", marginBottom: 10, letterSpacing: 0.3 }}>
            {t("settings")}
          </Text>

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
                <Text style={{ color: lang === "en" ? colors.bg : colors.text3, fontWeight: "700", fontSize: 13 }}>EN</Text>
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
                <Text style={{ color: lang === "es" ? colors.bg : colors.text3, fontWeight: "700", fontSize: 13 }}>ES</Text>
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
                <Text style={{ color: mode === "dark" ? colors.bg : colors.text3, fontWeight: "700", fontSize: 13 }}>{t("dark")}</Text>
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
                <Text style={{ color: mode === "light" ? colors.bg : colors.text3, fontWeight: "700", fontSize: 13 }}>{t("light")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
          <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 100, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />

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
            <Text style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "700" }}>{t("editProfile")}</Text>
            <TouchableOpacity
              onPress={() => updateProfile.mutate(editData)}
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
            {([
              { key: "name" as const, labelKey: "fullName", placeholder: "Your name" },
              { key: "username" as const, labelKey: "username", placeholder: "@username" },
              { key: "bio" as const, labelKey: "bio", placeholder: "Tell your story...", multiline: true },
              { key: "mainAmbition" as const, labelKey: "mainAmbition", placeholder: "What is your biggest goal in life?", multiline: true },
              { key: "currentGoals" as const, labelKey: "currentFocus", placeholder: "What are you working on right now?", multiline: true },
            ]).map(({ key, labelKey, placeholder, multiline }) => (
              <View key={key} style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
                  {t(labelKey as any)}
                </Text>
                <TextInput
                  value={editData[key]}
                  onChangeText={(txt) => setEditData(p => ({ ...p, [key]: txt }))}
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
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
