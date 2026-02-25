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

const HUD_BG = "#020B18";
const HUD_CARD = "#041525";
const HUD_CYAN = "#00B4D8";
const HUD_CYAN_DIM = "#7DB8D9";
const HUD_NAME = "#C8E8FF";
const HUD_RED = "#FF3B30";
const HUD_BORDER = "#0A2A3F";
const HUD_CYAN_FAINT = "rgba(0,180,216,0.10)";
const HUD_CYAN_MID = "rgba(0,180,216,0.20)";

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
      <View style={{ flex: 1, backgroundColor: HUD_BG, alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
        <ActivityIndicator color={HUD_CYAN} size="large" />
      </View>
    );
  }

  const displayName = profile?.name || session?.user?.name || "User";
  const avatarImage = profile?.image || session?.user?.image;

  return (
    <View style={{ flex: 1, backgroundColor: HUD_BG }} testID="profile-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: HUD_BG }}>
        {/* HUD Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{
              flex: 1,
              fontSize: 13,
              fontWeight: "700",
              color: HUD_CYAN,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}>
              AGENT PROFILE
            </Text>
            <TouchableOpacity
              onPress={openEdit}
              testID="edit-profile-button"
              style={{
                borderWidth: 1,
                borderColor: HUD_CYAN,
                paddingHorizontal: 10,
                paddingVertical: 5,
                marginRight: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Edit3 size={13} color={HUD_CYAN} />
              <Text style={{ color: HUD_CYAN, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>EDIT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSignOut}
              testID="sign-out-button"
              style={{
                borderWidth: 1,
                borderColor: HUD_RED,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <LogOut size={13} color={HUD_RED} />
              <Text style={{ color: HUD_RED, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>OUT</Text>
            </TouchableOpacity>
          </View>
          {/* Thin cyan divider */}
          <View style={{ height: 1, backgroundColor: HUD_CYAN, opacity: 0.6, marginBottom: 2 }} />
          <View style={{ height: 1, backgroundColor: HUD_CYAN, opacity: 0.15 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Identity block */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 18 }}>
            {/* Avatar */}
            <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
              testID="avatar-button"
              style={{ position: "relative", marginRight: 16 }}
            >
              <View style={{
                width: 82,
                height: 82,
                borderRadius: 8,
                backgroundColor: HUD_CARD,
                borderWidth: 2,
                borderColor: HUD_CYAN,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                shadowColor: HUD_CYAN,
                shadowOpacity: 0.5,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
              }}>
                {uploadingAvatar ? (
                  <ActivityIndicator color={HUD_CYAN} />
                ) : avatarImage ? (
                  <Image source={{ uri: avatarImage }} style={{ width: 82, height: 82 }} />
                ) : (
                  <Text style={{ color: HUD_CYAN, fontWeight: "800", fontSize: 32, letterSpacing: -1 }}>
                    {displayName[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
              {/* Camera overlay badge */}
              <View style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 22,
                height: 22,
                backgroundColor: HUD_CYAN,
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Camera size={12} color={HUD_BG} />
              </View>
              {/* Corner brackets */}
              <View style={{ position: "absolute", top: -2, left: -2, width: 10, height: 10, borderTopWidth: 2, borderLeftWidth: 2, borderColor: HUD_CYAN }} />
              <View style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderTopWidth: 2, borderRightWidth: 2, borderColor: HUD_CYAN }} />
              <View style={{ position: "absolute", bottom: -2, left: -2, width: 10, height: 10, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: HUD_CYAN }} />
            </TouchableOpacity>

            {/* Name + username + badges */}
            <View style={{ flex: 1, paddingTop: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                <Text style={{ color: HUD_NAME, fontSize: 20, fontWeight: "800", letterSpacing: 0.5 }}>{displayName}</Text>
                {profile?.isVerified ? (
                  <View style={{
                    width: 18,
                    height: 18,
                    backgroundColor: HUD_CYAN,
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ rotate: "45deg" }],
                  }}>
                    <View style={{ transform: [{ rotate: "-45deg" }] }}>
                      <CheckCircle size={12} color={HUD_BG} fill={HUD_BG} />
                    </View>
                  </View>
                ) : null}
                {profile?.role === "mentor" ? (
                  <View style={{
                    borderWidth: 1,
                    borderColor: HUD_CYAN,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}>
                    <Text style={{ color: HUD_CYAN, fontSize: 9, fontWeight: "700", letterSpacing: 1.5 }}>MENTOR</Text>
                  </View>
                ) : null}
              </View>

              {profile?.username ? (
                <Text style={{ color: HUD_CYAN_DIM, fontSize: 13, letterSpacing: 0.5, marginBottom: 6 }}>@{profile.username}</Text>
              ) : null}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {profile?.isPublic ? (
                  <Globe size={12} color={HUD_CYAN_DIM} />
                ) : (
                  <Lock size={12} color={HUD_CYAN_DIM} />
                )}
                <Text style={{ color: HUD_CYAN_DIM, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
                  {profile?.isPublic ? "PUBLIC" : "PRIVATE"}
                </Text>
              </View>
            </View>
          </View>

          {/* Bio */}
          {profile?.bio ? (
            <Text style={{
              color: HUD_CYAN_DIM,
              fontSize: 13,
              lineHeight: 20,
              fontStyle: "italic",
              marginBottom: 16,
              paddingLeft: 10,
              borderLeftWidth: 2,
              borderLeftColor: HUD_CYAN,
            }}>{profile.bio}</Text>
          ) : null}

          {/* Stats row: FOLLOWERS / FOLLOWING / POSTS */}
          <View style={{
            flexDirection: "row",
            borderWidth: 1,
            borderColor: HUD_BORDER,
            marginBottom: 20,
          }}>
            {[
              { label: "FOLLOWERS", value: profile?._count?.followers || 0 },
              { label: "FOLLOWING", value: profile?._count?.following || 0 },
              { label: "POSTS", value: profile?._count?.posts || 0 },
            ].map((item, idx) => (
              <View
                key={item.label}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 12,
                  borderLeftWidth: idx === 0 ? 0 : 1,
                  borderLeftColor: HUD_CYAN,
                  backgroundColor: HUD_CARD,
                }}
              >
                <Text style={{ color: HUD_CYAN, fontSize: 22, fontWeight: "700", letterSpacing: -0.5 }}>{item.value}</Text>
                <Text style={{ color: HUD_CYAN_DIM, fontSize: 9, letterSpacing: 1.5, marginTop: 2, textTransform: "uppercase" }}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Interests */}
          {interests.length > 0 ? (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: HUD_CYAN_DIM, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>INTERESTS</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {interests.map((tag: string) => (
                  <View
                    key={tag}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderWidth: 1,
                      borderColor: HUD_CYAN,
                      backgroundColor: HUD_CYAN_FAINT,
                    }}
                  >
                    <Text style={{ color: HUD_CYAN, fontSize: 11, fontWeight: "600", letterSpacing: 0.5 }}>{tag}</Text>
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
                backgroundColor: HUD_CARD,
                borderTopWidth: 1,
                borderTopColor: HUD_CYAN,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Award size={13} color={HUD_CYAN} />
                <Text style={{ color: HUD_CYAN, fontSize: 9, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>MAIN AMBITION</Text>
              </View>
              <Text style={{ color: HUD_NAME, fontSize: 14, lineHeight: 22 }}>{profile.mainAmbition}</Text>
            </Animated.View>
          ) : null}

          {/* Goals / Sprints stats grid */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: HUD_CYAN_DIM, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>PERFORMANCE DATA</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{
                flex: 1,
                backgroundColor: HUD_CARD,
                borderTopWidth: 1,
                borderTopColor: HUD_CYAN,
                padding: 14,
                alignItems: "center",
              }}>
                <Target size={16} color={HUD_CYAN} style={{ marginBottom: 8 }} />
                <Text style={{ color: HUD_CYAN, fontSize: 24, fontWeight: "700", letterSpacing: -1 }}>{completedGoals}</Text>
                <Text style={{ color: HUD_CYAN_DIM, fontSize: 8, letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase", textAlign: "center" }}>GOALS{"\n"}DONE</Text>
              </View>
              <View style={{
                flex: 1,
                backgroundColor: HUD_CARD,
                borderTopWidth: 1,
                borderTopColor: HUD_CYAN,
                padding: 14,
                alignItems: "center",
              }}>
                <Target size={16} color={HUD_CYAN} style={{ marginBottom: 8 }} />
                <Text style={{ color: HUD_CYAN, fontSize: 24, fontWeight: "700", letterSpacing: -1 }}>{activeGoals}</Text>
                <Text style={{ color: HUD_CYAN_DIM, fontSize: 8, letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase", textAlign: "center" }}>IN{"\n"}PROGRESS</Text>
              </View>
              <View style={{
                flex: 1,
                backgroundColor: HUD_CARD,
                borderTopWidth: 1,
                borderTopColor: HUD_CYAN,
                padding: 14,
                alignItems: "center",
              }}>
                <Zap size={16} color={HUD_CYAN} style={{ marginBottom: 8 }} />
                <Text style={{ color: HUD_CYAN, fontSize: 24, fontWeight: "700", letterSpacing: -1 }}>{bestStreak}</Text>
                <Text style={{ color: HUD_CYAN_DIM, fontSize: 8, letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase", textAlign: "center" }}>BEST{"\n"}STREAK</Text>
              </View>
            </View>
          </View>

          {/* Current Focus */}
          {profile?.currentGoals ? (
            <View style={{
              backgroundColor: HUD_CARD,
              borderTopWidth: 1,
              borderTopColor: HUD_CYAN,
              padding: 14,
              marginBottom: 20,
            }}>
              <Text style={{ color: HUD_CYAN_DIM, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>CURRENT FOCUS</Text>
              <Text style={{ color: HUD_CYAN_DIM, fontSize: 13, lineHeight: 20 }}>{profile.currentGoals}</Text>
            </View>
          ) : null}

          {/* Settings section */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: HUD_CYAN_DIM, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>SYSTEM CONFIG</Text>

            {/* Language toggle */}
            <View style={{
              backgroundColor: HUD_CARD,
              borderTopWidth: 1,
              borderTopColor: HUD_CYAN,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}>
              <Text style={{ flex: 1, color: HUD_NAME, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "600" }}>LANGUAGE</Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                <TouchableOpacity
                  onPress={() => setLang("en")}
                  testID="lang-en-button"
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: lang === "en" ? HUD_CYAN : HUD_BORDER,
                    backgroundColor: lang === "en" ? HUD_CYAN_MID : "transparent",
                  }}
                >
                  <Text style={{ color: lang === "en" ? HUD_CYAN : HUD_CYAN_DIM, fontWeight: "700", fontSize: 12, letterSpacing: 1 }}>EN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLang("es")}
                  testID="lang-es-button"
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: lang === "es" ? HUD_CYAN : HUD_BORDER,
                    backgroundColor: lang === "es" ? HUD_CYAN_MID : "transparent",
                  }}
                >
                  <Text style={{ color: lang === "es" ? HUD_CYAN : HUD_CYAN_DIM, fontWeight: "700", fontSize: 12, letterSpacing: 1 }}>ES</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Theme toggle */}
            <View style={{
              backgroundColor: HUD_CARD,
              borderTopWidth: 1,
              borderTopColor: HUD_CYAN,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
            }}>
              <Text style={{ flex: 1, color: HUD_NAME, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "600" }}>DISPLAY MODE</Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                <TouchableOpacity
                  onPress={() => setTheme("dark")}
                  testID="theme-dark-button"
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: mode === "dark" ? HUD_CYAN : HUD_BORDER,
                    backgroundColor: mode === "dark" ? HUD_CYAN_MID : "transparent",
                  }}
                >
                  <Text style={{ color: mode === "dark" ? HUD_CYAN : HUD_CYAN_DIM, fontWeight: "700", fontSize: 12, letterSpacing: 1 }}>DARK</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTheme("light")}
                  testID="theme-light-button"
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: mode === "light" ? HUD_CYAN : HUD_BORDER,
                    backgroundColor: mode === "light" ? HUD_CYAN_MID : "transparent",
                  }}
                >
                  <Text style={{ color: mode === "light" ? HUD_CYAN : HUD_CYAN_DIM, fontWeight: "700", fontSize: 12, letterSpacing: 1 }}>LIGHT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: HUD_BG }}>
          {/* Modal header */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: HUD_CYAN,
          }}>
            <TouchableOpacity
              onPress={() => setShowEdit(false)}
              style={{
                marginRight: 14,
                borderWidth: 1,
                borderColor: HUD_BORDER,
                padding: 6,
              }}
            >
              <X size={18} color={HUD_CYAN_DIM} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: HUD_CYAN, fontSize: 12, fontWeight: "700", letterSpacing: 3, textTransform: "uppercase" }}>EDIT PROFILE</Text>
            <TouchableOpacity
              onPress={() => updateProfile.mutate(editData)}
              disabled={updateProfile.isPending}
              testID="save-profile-button"
              style={{
                borderWidth: 1,
                borderColor: HUD_CYAN,
                backgroundColor: HUD_CYAN_MID,
                paddingHorizontal: 18,
                paddingVertical: 8,
              }}
            >
              {updateProfile.isPending ? (
                <ActivityIndicator color={HUD_CYAN} size="small" />
              ) : (
                <Text style={{ color: HUD_CYAN, fontWeight: "700", fontSize: 12, letterSpacing: 1.5 }}>SAVE</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {([
              { key: "name" as const, label: "FULL NAME", placeholder: "Your name" },
              { key: "username" as const, label: "USERNAME", placeholder: "@username" },
              { key: "bio" as const, label: "BIO", placeholder: "Tell your story...", multiline: true },
              { key: "mainAmbition" as const, label: "MAIN AMBITION", placeholder: "What is your biggest goal in life?", multiline: true },
              { key: "currentGoals" as const, label: "CURRENT FOCUS", placeholder: "What are you working on right now?", multiline: true },
            ]).map(({ key, label, placeholder, multiline }) => (
              <View key={key} style={{ marginBottom: 20 }}>
                <Text style={{
                  color: HUD_CYAN,
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}>
                  {label}
                </Text>
                <TextInput
                  value={editData[key]}
                  onChangeText={(txt) => setEditData(p => ({ ...p, [key]: txt }))}
                  placeholder={placeholder}
                  placeholderTextColor={HUD_BORDER}
                  multiline={multiline}
                  testID={`edit-${key}-input`}
                  style={{
                    backgroundColor: HUD_CARD,
                    borderWidth: 1,
                    borderColor: HUD_CYAN,
                    padding: 12,
                    color: HUD_NAME,
                    fontSize: 14,
                    letterSpacing: 0.3,
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
