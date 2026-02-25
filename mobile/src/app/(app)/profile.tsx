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

const DS = {
  bg: "#0A0F1E",
  card: "#111827",
  cardAlt: "#0F172A",
  cyan: "#00B4D8",
  cyanSoft: "rgba(0,180,216,0.12)",
  cyanBorder: "rgba(0,180,216,0.25)",
  red: "#FF3B30",
  redSoft: "rgba(255,59,48,0.10)",
  redBorder: "rgba(255,59,48,0.28)",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
  border: "rgba(255,255,255,0.06)",
};

export default function ProfileScreen() {
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();
  const queryClient = useQueryClient();
  const { mode, setTheme } = useTheme();
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
      <View style={{ flex: 1, backgroundColor: DS.bg, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
        <ActivityIndicator color={DS.cyan} size="large" />
      </View>
    );
  }

  const displayName = profile?.name || session?.user?.name || "User";
  const avatarImage = profile?.image || session?.user?.image;

  return (
    <View style={{ flex: 1, backgroundColor: DS.bg }} testID="profile-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: DS.bg }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ flex: 1, fontSize: 28, fontWeight: "800", color: DS.textPrimary, letterSpacing: -0.5 }}>
            Profile
          </Text>
          <TouchableOpacity
            onPress={openEdit}
            testID="edit-profile-button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: DS.cyanSoft,
              borderWidth: 1,
              borderColor: DS.cyanBorder,
              borderRadius: 100,
              paddingHorizontal: 14,
              paddingVertical: 8,
              marginRight: 8,
            }}
          >
            <Edit3 size={13} color={DS.cyan} />
            <Text style={{ color: DS.cyan, fontSize: 13, fontWeight: "600" }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSignOut}
            testID="sign-out-button"
            style={{
              width: 36,
              height: 36,
              borderRadius: 100,
              backgroundColor: DS.redSoft,
              borderWidth: 1,
              borderColor: DS.redBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LogOut size={15} color={DS.red} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero block */}
        <View style={{
          backgroundColor: DS.card,
          borderRadius: 24,
          marginHorizontal: 16,
          marginTop: 4,
          marginBottom: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: DS.border,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 4 },
        }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {/* Avatar with cyan ring */}
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
                backgroundColor: DS.cardAlt,
                borderWidth: 2.5,
                borderColor: DS.cyan,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                shadowColor: DS.cyan,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
              }}>
                {uploadingAvatar ? (
                  <ActivityIndicator color={DS.cyan} />
                ) : avatarImage ? (
                  <Image source={{ uri: avatarImage }} style={{ width: 80, height: 80 }} />
                ) : (
                  <Text style={{ color: DS.cyan, fontWeight: "800", fontSize: 30 }}>
                    {displayName[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
              {/* Camera overlay */}
              <View style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 26,
                height: 26,
                borderRadius: 100,
                backgroundColor: DS.cyan,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: DS.card,
              }}>
                <Camera size={12} color={DS.bg} />
              </View>
            </TouchableOpacity>

            {/* Name + username + badges */}
            <View style={{ flex: 1, paddingTop: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                <Text style={{ color: DS.textPrimary, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 }}>{displayName}</Text>
                {profile?.isVerified ? (
                  <View style={{
                    width: 18,
                    height: 18,
                    borderRadius: 100,
                    backgroundColor: DS.cyan,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <CheckCircle size={12} color={DS.bg} fill={DS.bg} />
                  </View>
                ) : null}
                {profile?.role === "mentor" ? (
                  <View style={{
                    borderWidth: 1,
                    borderColor: DS.cyanBorder,
                    backgroundColor: DS.cyanSoft,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 100,
                  }}>
                    <Text style={{ color: DS.cyan, fontSize: 10, fontWeight: "700" }}>Mentor</Text>
                  </View>
                ) : null}
              </View>

              {profile?.username ? (
                <Text style={{ color: DS.textSecondary, fontSize: 13, marginBottom: 6 }}>@{profile.username}</Text>
              ) : null}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                {profile?.isPublic ? (
                  <Globe size={11} color={DS.textMuted} />
                ) : (
                  <Lock size={11} color={DS.textMuted} />
                )}
                <Text style={{ color: DS.textMuted, fontSize: 11 }}>
                  {profile?.isPublic ? "Public profile" : "Private profile"}
                </Text>
              </View>
            </View>
          </View>

          {/* Bio */}
          {profile?.bio ? (
            <Text style={{
              color: DS.textSecondary,
              fontSize: 13,
              lineHeight: 20,
              marginTop: 14,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: DS.border,
            }}>{profile.bio}</Text>
          ) : null}
        </View>

        {/* Stats row - 3 pill cards */}
        <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 16 }}>
          {[
            { label: "Followers", value: profile?._count?.followers || 0 },
            { label: "Following", value: profile?._count?.following || 0 },
            { label: "Posts", value: profile?._count?.posts || 0 },
          ].map((item, idx) => (
            <View
              key={item.label}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 14,
                backgroundColor: DS.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: DS.border,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <Text style={{ color: DS.textPrimary, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>{item.value}</Text>
              <Text style={{ color: DS.textMuted, fontSize: 11, marginTop: 3 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Performance stats */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: DS.textMuted, fontSize: 12, fontWeight: "600", marginBottom: 10, letterSpacing: 0.3 }}>
            Progress
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{
              flex: 1,
              backgroundColor: DS.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: DS.border,
              padding: 16,
              alignItems: "center",
            }}>
              <Target size={18} color={DS.cyan} style={{ marginBottom: 8 }} />
              <Text style={{ color: DS.textPrimary, fontSize: 24, fontWeight: "800", letterSpacing: -1 }}>{completedGoals}</Text>
              <Text style={{ color: DS.textMuted, fontSize: 11, marginTop: 4, textAlign: "center" }}>Goals done</Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: DS.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: DS.border,
              padding: 16,
              alignItems: "center",
            }}>
              <Target size={18} color={DS.cyan} style={{ marginBottom: 8 }} />
              <Text style={{ color: DS.textPrimary, fontSize: 24, fontWeight: "800", letterSpacing: -1 }}>{activeGoals}</Text>
              <Text style={{ color: DS.textMuted, fontSize: 11, marginTop: 4, textAlign: "center" }}>In progress</Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: DS.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: DS.border,
              padding: 16,
              alignItems: "center",
            }}>
              <Zap size={18} color={DS.cyan} style={{ marginBottom: 8 }} />
              <Text style={{ color: DS.textPrimary, fontSize: 24, fontWeight: "800", letterSpacing: -1 }}>{bestStreak}</Text>
              <Text style={{ color: DS.textMuted, fontSize: 11, marginTop: 4, textAlign: "center" }}>Best streak</Text>
            </View>
          </View>
        </View>

        {/* Interests */}
        {interests.length > 0 ? (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ color: DS.textMuted, fontSize: 12, fontWeight: "600", marginBottom: 10, letterSpacing: 0.3 }}>
              Interests
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {interests.map((tag: string) => (
                <View
                  key={tag}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: DS.cyanBorder,
                    backgroundColor: DS.cyanSoft,
                    borderRadius: 100,
                  }}
                >
                  <Text style={{ color: DS.cyan, fontSize: 12, fontWeight: "600" }}>{tag}</Text>
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
              backgroundColor: DS.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: DS.border,
              borderLeftWidth: 3,
              borderLeftColor: DS.cyan,
              padding: 16,
              marginHorizontal: 16,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Award size={14} color={DS.cyan} />
              <Text style={{ color: DS.textMuted, fontSize: 12, fontWeight: "600" }}>Main ambition</Text>
            </View>
            <Text style={{ color: DS.textPrimary, fontSize: 14, lineHeight: 22 }}>{profile.mainAmbition}</Text>
          </Animated.View>
        ) : null}

        {/* Current Focus */}
        {profile?.currentGoals ? (
          <View style={{
            backgroundColor: DS.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: DS.border,
            padding: 16,
            marginHorizontal: 16,
            marginBottom: 16,
          }}>
            <Text style={{ color: DS.textMuted, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Current focus</Text>
            <Text style={{ color: DS.textSecondary, fontSize: 13, lineHeight: 20 }}>{profile.currentGoals}</Text>
          </View>
        ) : null}

        {/* Settings */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: DS.textMuted, fontSize: 12, fontWeight: "600", marginBottom: 10, letterSpacing: 0.3 }}>
            Settings
          </Text>

          {/* Language toggle */}
          <View style={{
            backgroundColor: DS.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: DS.border,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}>
            <Text style={{ flex: 1, color: DS.textPrimary, fontSize: 14, fontWeight: "600" }}>Language</Text>
            <View style={{
              flexDirection: "row",
              backgroundColor: DS.bg,
              borderRadius: 100,
              padding: 3,
              borderWidth: 1,
              borderColor: DS.border,
              gap: 3,
            }}>
              <TouchableOpacity
                onPress={() => setLang("en")}
                testID="lang-en-button"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: lang === "en" ? DS.cyan : "transparent",
                }}
              >
                <Text style={{ color: lang === "en" ? DS.bg : DS.textMuted, fontWeight: "700", fontSize: 13 }}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLang("es")}
                testID="lang-es-button"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: lang === "es" ? DS.cyan : "transparent",
                }}
              >
                <Text style={{ color: lang === "es" ? DS.bg : DS.textMuted, fontWeight: "700", fontSize: 13 }}>ES</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Theme toggle */}
          <View style={{
            backgroundColor: DS.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: DS.border,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
          }}>
            <Text style={{ flex: 1, color: DS.textPrimary, fontSize: 14, fontWeight: "600" }}>Display mode</Text>
            <View style={{
              flexDirection: "row",
              backgroundColor: DS.bg,
              borderRadius: 100,
              padding: 3,
              borderWidth: 1,
              borderColor: DS.border,
              gap: 3,
            }}>
              <TouchableOpacity
                onPress={() => setTheme("dark")}
                testID="theme-dark-button"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: mode === "dark" ? DS.cyan : "transparent",
                }}
              >
                <Text style={{ color: mode === "dark" ? DS.bg : DS.textMuted, fontWeight: "700", fontSize: 13 }}>Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTheme("light")}
                testID="theme-light-button"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: mode === "light" ? DS.cyan : "transparent",
                }}
              >
                <Text style={{ color: mode === "light" ? DS.bg : DS.textMuted, fontWeight: "700", fontSize: 13 }}>Light</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Sign out - destructive bottom button */}
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
            backgroundColor: DS.redSoft,
            borderWidth: 1,
            borderColor: DS.redBorder,
            borderRadius: 100,
            padding: 16,
          }}
        >
          <LogOut size={16} color={DS.red} />
          <Text style={{ color: DS.red, fontSize: 15, fontWeight: "700" }}>{t("signOut")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
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
            <TouchableOpacity
              onPress={() => setShowEdit(false)}
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
            >
              <X size={18} color={DS.textSecondary} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: DS.textPrimary, fontSize: 17, fontWeight: "700" }}>Edit profile</Text>
            <TouchableOpacity
              onPress={() => updateProfile.mutate(editData)}
              disabled={updateProfile.isPending}
              testID="save-profile-button"
              style={{
                backgroundColor: DS.cyan,
                borderRadius: 100,
                paddingHorizontal: 20,
                paddingVertical: 9,
              }}
            >
              {updateProfile.isPending ? (
                <ActivityIndicator color={DS.bg} size="small" />
              ) : (
                <Text style={{ color: DS.bg, fontWeight: "700", fontSize: 14 }}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {([
              { key: "name" as const, label: "Full name", placeholder: "Your name" },
              { key: "username" as const, label: "Username", placeholder: "@username" },
              { key: "bio" as const, label: "Bio", placeholder: "Tell your story...", multiline: true },
              { key: "mainAmbition" as const, label: "Main ambition", placeholder: "What is your biggest goal in life?", multiline: true },
              { key: "currentGoals" as const, label: "Current focus", placeholder: "What are you working on right now?", multiline: true },
            ]).map(({ key, label, placeholder, multiline }) => (
              <View key={key} style={{ marginBottom: 20 }}>
                <Text style={{
                  color: DS.textSecondary,
                  fontSize: 13,
                  fontWeight: "600",
                  marginBottom: 8,
                }}>
                  {label}
                </Text>
                <TextInput
                  value={editData[key]}
                  onChangeText={(txt) => setEditData(p => ({ ...p, [key]: txt }))}
                  placeholder={placeholder}
                  placeholderTextColor={DS.textMuted}
                  multiline={multiline}
                  testID={`edit-${key}-input`}
                  style={{
                    backgroundColor: DS.card,
                    borderWidth: 1,
                    borderColor: DS.border,
                    borderRadius: 12,
                    padding: 14,
                    color: DS.textPrimary,
                    fontSize: 14,
                    lineHeight: 20,
                    ...(multiline ? { minHeight: 80, textAlignVertical: "top" } : {}),
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
