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
import { CheckCircle, Target, Zap, LogOut, Edit3, X, Award, Globe, Lock } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function ProfileScreen() {
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({ name: "", bio: "", mainAmbition: "", currentGoals: "", username: "" });

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
    mutationFn: () => api.patch("/api/me", editData),
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

  const interests = (() => {
    try { return profile?.interests ? JSON.parse(profile.interests) as string[] : []; }
    catch { return []; }
  })();

  const completedGoals = goals?.filter(g => g.isCompleted).length || 0;
  const activeGoals = goals?.filter(g => !g.isCompleted).length || 0;
  const bestStreak = sprints?.reduce((max, s) => Math.max(max, s.members?.[0]?.streak || 0), 0) || 0;

  if (profileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" }} testID="loading-indicator">
        <ActivityIndicator color="#F59E0B" size="large" />
      </View>
    );
  }

  const displayName = profile?.name || session?.user?.name || "User";

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} testID="profile-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#FAFAFA", flex: 1, letterSpacing: -0.5 }}>Profile</Text>
          <TouchableOpacity onPress={openEdit} style={{ padding: 8, marginRight: 4 }} testID="edit-profile-button">
            <Edit3 size={20} color="#71717A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={{ padding: 8 }} testID="sign-out-button">
            <LogOut size={20} color="#71717A" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Cover */}
        <View style={{ height: 120, backgroundColor: "#1A0A00", position: "relative" }}>
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, backgroundColor: "#0A0A0A" }} />
        </View>

        {/* Avatar & basic info */}
        <View style={{ paddingHorizontal: 16, marginTop: -40 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 16 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#F59E0B", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#0A0A0A", overflow: "hidden" }}>
              {(profile?.image || session?.user?.image) ? (
                <Image source={{ uri: profile?.image || session?.user?.image || "" }} style={{ width: 80, height: 80 }} />
              ) : (
                <Text style={{ color: "#0A0A0A", fontWeight: "800", fontSize: 30 }}>
                  {displayName[0]?.toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 14, marginBottom: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ color: "#FAFAFA", fontSize: 20, fontWeight: "700" }}>{displayName}</Text>
                {profile?.isVerified ? <CheckCircle size={16} color="#F59E0B" fill="#F59E0B" /> : null}
                {profile?.role === "mentor" ? (
                  <View style={{ backgroundColor: "#1A1A00", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "700" }}>MENTOR</Text>
                  </View>
                ) : null}
              </View>
              {profile?.username ? (
                <Text style={{ color: "#71717A", fontSize: 14 }}>@{profile.username}</Text>
              ) : null}
            </View>
            <View style={{ flexDirection: "row", gap: 4, marginBottom: 4 }}>
              {profile?.isPublic ? (
                <Globe size={14} color="#52525B" />
              ) : (
                <Lock size={14} color="#52525B" />
              )}
            </View>
          </View>

          {profile?.bio ? (
            <Text style={{ color: "#A1A1AA", fontSize: 14, lineHeight: 22, marginBottom: 12 }}>{profile.bio}</Text>
          ) : null}

          {/* Followers */}
          <View style={{ flexDirection: "row", gap: 24, marginBottom: 16 }}>
            <View>
              <Text style={{ color: "#FAFAFA", fontWeight: "700", fontSize: 18 }}>{profile?._count?.followers || 0}</Text>
              <Text style={{ color: "#52525B", fontSize: 12 }}>Followers</Text>
            </View>
            <View>
              <Text style={{ color: "#FAFAFA", fontWeight: "700", fontSize: 18 }}>{profile?._count?.following || 0}</Text>
              <Text style={{ color: "#52525B", fontSize: 12 }}>Following</Text>
            </View>
            <View>
              <Text style={{ color: "#FAFAFA", fontWeight: "700", fontSize: 18 }}>{profile?._count?.posts || 0}</Text>
              <Text style={{ color: "#52525B", fontSize: 12 }}>Posts</Text>
            </View>
          </View>

          {/* Interests */}
          {interests.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {interests.map((tag: string) => (
                <View key={tag} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: "#1C1C1E", borderWidth: 1, borderColor: "#27272A" }}>
                  <Text style={{ color: "#A1A1AA", fontSize: 12, fontWeight: "500" }}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Main Ambition */}
          {profile?.mainAmbition ? (
            <Animated.View entering={FadeInDown.duration(400)} style={{ backgroundColor: "#1A1A00", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#2A2A00" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Award size={16} color="#F59E0B" />
                <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>Main Ambition</Text>
              </View>
              <Text style={{ color: "#FAFAFA", fontSize: 15, lineHeight: 22 }}>{profile.mainAmbition}</Text>
            </Animated.View>
          ) : null}

          {/* Stats grid */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            <View style={{ flex: 1, backgroundColor: "#141414", borderRadius: 14, padding: 14 }}>
              <Target size={20} color="#22C55E" />
              <Text style={{ color: "#FAFAFA", fontSize: 20, fontWeight: "700", marginTop: 8 }}>{completedGoals}</Text>
              <Text style={{ color: "#71717A", fontSize: 11 }}>Goals done</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#141414", borderRadius: 14, padding: 14 }}>
              <Target size={20} color="#F59E0B" />
              <Text style={{ color: "#FAFAFA", fontSize: 20, fontWeight: "700", marginTop: 8 }}>{activeGoals}</Text>
              <Text style={{ color: "#71717A", fontSize: 11 }}>In progress</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#141414", borderRadius: 14, padding: 14 }}>
              <Zap size={20} color="#3B82F6" />
              <Text style={{ color: "#FAFAFA", fontSize: 20, fontWeight: "700", marginTop: 8 }}>{bestStreak}</Text>
              <Text style={{ color: "#71717A", fontSize: 11 }}>Best streak</Text>
            </View>
          </View>

          {/* Current Goals */}
          {profile?.currentGoals ? (
            <View style={{ backgroundColor: "#141414", borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <Text style={{ color: "#71717A", fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Current Focus</Text>
              <Text style={{ color: "#E4E4E7", fontSize: 14, lineHeight: 22 }}>{profile.currentGoals}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: "#0F0F0F" }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1C1C1E" }}>
            <TouchableOpacity onPress={() => setShowEdit(false)} style={{ marginRight: 16 }}>
              <X size={22} color="#71717A" />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: "#FAFAFA", fontSize: 17, fontWeight: "600" }}>Edit Profile</Text>
            <TouchableOpacity
              onPress={() => updateProfile.mutate()}
              disabled={updateProfile.isPending}
              testID="save-profile-button"
              style={{ backgroundColor: "#F59E0B", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 }}
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
                <Text style={{ color: "#71717A", fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                  {label}
                </Text>
                <TextInput
                  value={editData[key]}
                  onChangeText={(t) => setEditData(p => ({ ...p, [key]: t }))}
                  placeholder={placeholder}
                  placeholderTextColor="#3F3F46"
                  multiline={multiline}
                  testID={`edit-${key}-input`}
                  style={{
                    backgroundColor: "#1C1C1E",
                    borderRadius: 12,
                    padding: 14,
                    color: "#FAFAFA",
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
