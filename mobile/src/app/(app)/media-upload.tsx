import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Image as ImageIcon,
  Video,
  X,
  Check,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;
const DEMO_USER_ID = "current-user";
const DEMO_USER_NAME = "Opturna User";
const DEMO_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";

type MediaType = "reel" | "image";

// ─── Simple modal state for feedback ─────────────────────────────────────────
function FeedbackModal({
  visible,
  title,
  message,
  actions,
}: {
  visible: boolean;
  title: string;
  message: string;
  actions: { label: string; onPress: () => void; primary?: boolean }[];
}) {
  if (!visible) return null;
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
    >
      <View
        style={{
          backgroundColor: "#111111",
          borderRadius: 20,
          padding: 24,
          marginHorizontal: 32,
          borderWidth: 1,
          borderColor: "#1F1F1F",
          gap: 12,
        }}
      >
        <Text style={{ color: "#F5F5F5", fontSize: 17, fontWeight: "800", textAlign: "center" }}>
          {title}
        </Text>
        <Text style={{ color: "#737373", fontSize: 14, textAlign: "center", lineHeight: 20 }}>
          {message}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: action.primary ? "#4ADE80" : "#1F1F1F",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: action.primary ? "#000" : "#F5F5F5",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function MediaUploadScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState<string>("");
  const [mediaType, setMediaType] = useState<MediaType>("reel");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [modal, setModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    actions: { label: string; onPress: () => void; primary?: boolean }[];
  }>({ visible: false, title: "", message: "", actions: [] });

  const showModal = (
    title: string,
    message: string,
    actions: { label: string; onPress: () => void; primary?: boolean }[]
  ) => {
    setModal({ visible: true, title, message, actions });
  };

  const hideModal = () => setModal((m) => ({ ...m, visible: false }));

  const pickMedia = async (type: "video" | "image") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showModal(
        "Permiso necesario",
        "Necesitamos acceso a tu galería para seleccionar medios.",
        [{ label: "OK", onPress: hideModal, primary: true }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === "video"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: type === "video" ? 0.8 : 1,
      videoMaxDuration: 300,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedAsset(result.assets[0]);
      setMediaType(type === "video" ? "reel" : "image");
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAsset) throw new Error("No asset selected");

      setUploadProgress(20);

      let mediaUrl = selectedAsset.uri;
      let thumbnailUrl = selectedAsset.uri;

      // Try to upload file to backend
      try {
        const fileExt =
          selectedAsset.uri.split(".").pop() ??
          (selectedAsset.type === "video" ? "mp4" : "jpg");
        const mimeType =
          selectedAsset.type === "video" ? `video/${fileExt}` : `image/${fileExt}`;

        const formData = new FormData();
        formData.append("file", {
          uri: selectedAsset.uri,
          type: mimeType,
          name: `upload.${fileExt}`,
        } as any);

        const uploadRes = await fetch(`${BASE_URL}/api/media/upload`, {
          method: "POST",
          body: formData,
        });

        setUploadProgress(70);

        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          mediaUrl = uploadJson.data.url as string;
          thumbnailUrl = uploadJson.data.url as string;
        }
      } catch {
        // If upload fails, use local URI (demo fallback)
      }

      setUploadProgress(90);

      // Create the post record
      const res = await fetch(`${BASE_URL}/api/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          type: mediaType,
          url: mediaUrl,
          thumbnailUrl,
          caption: caption.trim() !== "" ? caption.trim() : null,
          authorName: DEMO_USER_NAME,
          authorAvatar: DEMO_AVATAR,
          authorUsername: "opturna_user",
          duration:
            selectedAsset.duration != null
              ? Math.round(selectedAsset.duration / 1000)
              : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create post");

      setUploadProgress(100);
      return res.json();
    },
    onSuccess: () => {
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["media-reels-feed"] });
      queryClient.invalidateQueries({ queryKey: ["media-discover"] });
      queryClient.invalidateQueries({ queryKey: ["media-reels-preview"] });
      showModal("Publicado", "Tu contenido ha sido publicado.", [
        {
          label: "Ver Reels",
          onPress: () => {
            hideModal();
            router.push("/reels-feed" as any);
          },
          primary: true,
        },
        {
          label: "OK",
          onPress: () => {
            hideModal();
            router.back();
          },
        },
      ]);
    },
    onError: () => {
      setUploadProgress(0);
      showModal("Error", "No se pudo publicar el contenido. Inténtalo de nuevo.", [
        { label: "Cerrar", onPress: hideModal, primary: true },
      ]);
    },
  });

  const isUploading = uploadMutation.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }} testID="media-upload-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#080808" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <Pressable onPress={() => router.back()} testID="back-button">
            <ChevronLeft size={24} color="#F5F5F5" strokeWidth={2} />
          </Pressable>
          <Text style={{ color: "#F5F5F5", fontSize: 17, fontWeight: "700" }}>
            Nuevo contenido
          </Text>
          <Pressable
            onPress={() => uploadMutation.mutate()}
            disabled={selectedAsset === null || isUploading}
            style={{
              backgroundColor:
                selectedAsset === null || isUploading ? "#1A1A1A" : "#4ADE80",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 10,
            }}
            testID="publish-button"
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text
                style={{
                  color: selectedAsset === null ? "#404040" : "#000",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Publicar
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {/* Upload progress bar */}
        {isUploading ? (
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                height: 4,
                backgroundColor: "#1A1A1A",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 4,
                  backgroundColor: "#4ADE80",
                  borderRadius: 2,
                  width: `${uploadProgress}%`,
                }}
              />
            </View>
            <Text style={{ color: "#737373", fontSize: 12, marginTop: 6 }}>
              Subiendo... {uploadProgress}%
            </Text>
          </View>
        ) : null}

        {/* Media preview or picker */}
        {selectedAsset !== null ? (
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                height: 400,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#111111",
                position: "relative",
              }}
            >
              <Image
                source={{ uri: selectedAsset.uri }}
                style={{ flex: 1 }}
                contentFit="cover"
              />
              {selectedAsset.type === "video" ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Video size={28} color="#F5F5F5" strokeWidth={2} />
                  </View>
                </View>
              ) : null}
              <Pressable
                onPress={() => setSelectedAsset(null)}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                testID="remove-asset-button"
              >
                <X size={16} color="#F5F5F5" strokeWidth={2} />
              </Pressable>

              {/* Selected indicator */}
              <View
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 20,
                }}
              >
                <Check size={12} color="#4ADE80" strokeWidth={2.5} />
                <Text style={{ color: "#4ADE80", fontSize: 12, fontWeight: "600" }}>
                  {selectedAsset.type === "video" ? "Vídeo seleccionado" : "Imagen seleccionada"}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <Pressable
                onPress={() => pickMedia("video")}
                style={{
                  flex: 1,
                  height: 120,
                  backgroundColor: "#111111",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#1F1F1F",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                testID="pick-video-button"
              >
                <LinearGradient
                  colors={["rgba(74,222,128,0.08)", "transparent"]}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    borderRadius: 16,
                  }}
                />
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(74,222,128,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "rgba(74,222,128,0.2)",
                  }}
                >
                  <Video size={22} color="#4ADE80" strokeWidth={2} />
                </View>
                <Text style={{ color: "#737373", fontSize: 13, fontWeight: "600" }}>
                  Vídeo / Reel
                </Text>
              </Pressable>

              <Pressable
                onPress={() => pickMedia("image")}
                style={{
                  flex: 1,
                  height: 120,
                  backgroundColor: "#111111",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#1F1F1F",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                testID="pick-image-button"
              >
                <LinearGradient
                  colors={["rgba(167,139,250,0.08)", "transparent"]}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    borderRadius: 16,
                  }}
                />
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(167,139,250,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "rgba(167,139,250,0.2)",
                  }}
                >
                  <ImageIcon size={22} color="#A78BFA" strokeWidth={2} />
                </View>
                <Text style={{ color: "#737373", fontSize: 13, fontWeight: "600" }}>Imagen</Text>
              </Pressable>
            </View>

            <View
              style={{
                backgroundColor: "#111111",
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: "#1A1A1A",
              }}
            >
              <Text style={{ color: "#737373", fontSize: 12, lineHeight: 18 }}>
                Formatos soportados: MP4, MOV, WebM para vídeos · JPG, PNG, WebP para
                imágenes{"\n"}
                Duración máxima: 5 minutos · Tamaño máximo: 100MB (vídeo) / 10MB (imagen)
              </Text>
            </View>
          </View>
        )}

        {/* Caption */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: "#F5F5F5", fontSize: 15, fontWeight: "700", marginBottom: 10 }}>
            Descripción
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Escribe un texto, añade #hashtags..."
            placeholderTextColor="#404040"
            multiline
            maxLength={2200}
            style={{
              backgroundColor: "#111111",
              borderRadius: 14,
              padding: 14,
              color: "#F5F5F5",
              fontSize: 15,
              lineHeight: 22,
              minHeight: 100,
              textAlignVertical: "top",
              borderWidth: 1,
              borderColor: "#1A1A1A",
            }}
            testID="caption-input"
          />
          <Text
            style={{ color: "#404040", fontSize: 11, marginTop: 6, textAlign: "right" }}
          >
            {caption.length}/2200
          </Text>
        </View>

        {/* Type selector */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: "#F5F5F5", fontSize: 15, fontWeight: "700", marginBottom: 10 }}>
            Tipo de publicación
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["reel", "image"] as MediaType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => setMediaType(type)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: mediaType === type ? "#4ADE80" : "#111111",
                  borderWidth: 1,
                  borderColor: mediaType === type ? "#4ADE80" : "#1F1F1F",
                  alignItems: "center",
                }}
                testID={`type-${type}`}
              >
                <Text
                  style={{
                    color: mediaType === type ? "#000" : "#737373",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {type === "reel" ? "Reel / Video" : "Imagen"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Feedback modal (replaces Alert.alert) */}
      <FeedbackModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        actions={modal.actions}
      />
    </View>
  );
}
