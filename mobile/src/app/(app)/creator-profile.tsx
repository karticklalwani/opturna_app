import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Globe,
  Youtube,
  Mic,
  Instagram,
  Linkedin,
  Send,
  Play,
  BadgeCheck,
  Award,
  Users,
  MapPin,
  ExternalLink,
  Radio,
  Clock,
  Briefcase,
  Twitter,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type {
  CreatorProfile,
  CreatorPost,
  CreatorVideo,
  CreatorInterview,
  CreatorLive,
  CreatorProject,
  Collaboration,
} from "@/types/creators";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

const CATEGORY_COLORS: Record<string, string> = {
  business: "#F59E0B",
  finance: "#4ADE80",
  trading: "#60A5FA",
  startups: "#FB923C",
  ai: "#A78BFA",
  creator: "#F472B6",
  education: "#34D399",
  mindset: "#C084FC",
  productivity: "#FBBF24",
  investing: "#4ADE80",
};

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <View
      style={{
        width: size + 4,
        height: size + 4,
        borderRadius: (size + 4) / 2,
        backgroundColor: "#4ADE80",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <BadgeCheck size={size} color="#000" strokeWidth={2.5} />
    </View>
  );
}

function PartnerBadge() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: "rgba(245,158,11,0.15)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(245,158,11,0.3)",
      }}
    >
      <Award size={11} color="#F59E0B" />
      <Text
        style={{
          color: "#F59E0B",
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.5,
        }}
      >
        PARTNER OFICIAL
      </Text>
    </View>
  );
}

const TABS = [
  "Posts",
  "Videos",
  "Entrevistas",
  "Directos",
  "Proyectos",
  "Colabs",
] as const;
type TabKey = (typeof TABS)[number];

type FullCreatorProfile = CreatorProfile & {
  posts: CreatorPost[];
  videos: CreatorVideo[];
  interviews: CreatorInterview[];
  lives: CreatorLive[];
  projects: CreatorProject[];
  collaborations: Collaboration[];
  _count: { follows: number; posts: number; videos: number };
};

export default function CreatorProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("Posts");

  const { data: creator, isLoading } = useQuery({
    queryKey: ["creator", slug],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/creators/${slug}`);
      const json = await res.json();
      return json.data as FullCreatorProfile;
    },
    enabled: !!slug,
  });

  if (isLoading || !creator) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#080808",
          alignItems: "center",
          justifyContent: "center",
        }}
        testID="creator-profile-loading"
      >
        <ActivityIndicator color="#4ADE80" size="large" />
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[creator.category || ""] || "#4ADE80";
  const tags: string[] = creator.tags ? JSON.parse(creator.tags) : [];

  const openLink = (url: string | null) => {
    if (url) Linking.openURL(url);
  };

  const socialLinks = [
    { icon: Globe, url: creator.websiteUrl, label: "Web", color: "#4ADE80" },
    {
      icon: Youtube,
      url: creator.youtubeUrl,
      label: "YouTube",
      color: "#EF4444",
    },
    {
      icon: Mic,
      url: creator.podcastUrl,
      label: "Podcast",
      color: "#A78BFA",
    },
    {
      icon: Instagram,
      url: creator.instagramUrl,
      label: "Instagram",
      color: "#F472B6",
    },
    { icon: Twitter, url: creator.xUrl, label: "X", color: "#60A5FA" },
    {
      icon: Linkedin,
      url: creator.linkedinUrl,
      label: "LinkedIn",
      color: "#3B82F6",
    },
    {
      icon: Send,
      url: creator.telegramUrl,
      label: "Telegram",
      color: "#38BDF8",
    },
  ].filter((s) => s.url);

  return (
    <View
      style={{ flex: 1, backgroundColor: "#080808" }}
      testID="creator-profile-screen"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Banner */}
        <View style={{ height: 180, position: "relative" }}>
          {creator.bannerUrl ? (
            <Image
              source={{ uri: creator.bannerUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={[catColor + "44", "#080808"]}
              style={{ flex: 1 }}
            />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.4)", "transparent", "rgba(8,8,8,0.9)"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <SafeAreaView
            edges={["top"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
          >
            <Pressable
              onPress={() => router.back()}
              testID="back-button"
              style={{
                marginLeft: 16,
                marginTop: 8,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(0,0,0,0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={20} color="#F5F5F5" />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Profile Header */}
        <View style={{ paddingHorizontal: 20, marginTop: -48 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 3,
                borderColor: "#080808",
                overflow: "hidden",
                backgroundColor: "#1A1A1A",
              }}
            >
              {creator.avatarUrl ? (
                <Image
                  source={{ uri: creator.avatarUrl }}
                  style={{ width: 80, height: 80 }}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#F5F5F5",
                      fontSize: 28,
                      fontWeight: "900",
                    }}
                  >
                    {creator.name[0]}
                  </Text>
                </View>
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#111111",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#1F1F1F",
              }}
            >
              <Users size={12} color="#A3A3A3" />
              <Text
                style={{ color: "#A3A3A3", fontSize: 13, fontWeight: "600" }}
              >
                {formatCount(creator._count?.follows ?? creator.followersCount)}
              </Text>
              <Text style={{ color: "#404040", fontSize: 11 }}>seguidores</Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                color: "#F5F5F5",
                fontSize: 22,
                fontWeight: "900",
                letterSpacing: -0.8,
              }}
            >
              {creator.name}
            </Text>
            {creator.verified ? <VerifiedBadge size={16} /> : null}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#737373", fontSize: 14 }}>
              @{creator.username}
            </Text>
            {creator.location ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <MapPin size={12} color="#404040" />
                <Text style={{ color: "#404040", fontSize: 13 }}>
                  {creator.location}
                </Text>
              </View>
            ) : null}
          </View>

          {creator.officialPartner ? (
            <View style={{ marginBottom: 10 }}>
              <PartnerBadge />
            </View>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 12,
            }}
          >
            {creator.category ? (
              <View
                style={{
                  backgroundColor: catColor + "22",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: catColor + "44",
                }}
              >
                <Text
                  style={{ color: catColor, fontSize: 12, fontWeight: "700" }}
                >
                  {creator.category.toUpperCase()}
                </Text>
              </View>
            ) : null}
            {tags.slice(0, 3).map((tag: string) => (
              <View
                key={tag}
                style={{
                  backgroundColor: "#111111",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#1F1F1F",
                }}
              >
                <Text style={{ color: "#737373", fontSize: 12 }}>{tag}</Text>
              </View>
            ))}
          </View>

          {creator.shortBio ? (
            <Text
              style={{
                color: "#A3A3A3",
                fontSize: 15,
                lineHeight: 22,
                marginBottom: 16,
              }}
            >
              {creator.fullBio || creator.shortBio}
            </Text>
          ) : null}

          {socialLinks.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, marginBottom: 20 }}
            >
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Pressable
                    key={link.label}
                    onPress={() => openLink(link.url)}
                    testID={`social-link-${link.label}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: "#111111",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#1F1F1F",
                      marginRight: 8,
                    }}
                  >
                    <Icon size={14} color={link.color} />
                    <Text
                      style={{
                        color: "#A3A3A3",
                        fontSize: 13,
                        fontWeight: "500",
                      }}
                    >
                      {link.label}
                    </Text>
                    <ExternalLink size={10} color="#404040" />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <View
            style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}
          >
            {[
              {
                label: "Posts",
                value: creator._count?.posts ?? creator.posts?.length ?? 0,
              },
              {
                label: "Videos",
                value: creator._count?.videos ?? creator.videos?.length ?? 0,
              },
              {
                label: "Entrevistas",
                value: creator.interviews?.length ?? 0,
              },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: "#111111",
                  borderRadius: 12,
                  padding: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#1A1A1A",
                }}
              >
                <Text
                  style={{
                    color: "#F5F5F5",
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{ color: "#737373", fontSize: 11, marginTop: 2 }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: "#1A1A1A",
              marginBottom: 20,
            }}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginBottom: 20 }}
          >
            {TABS.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                testID={`tab-${tab}`}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 8,
                  backgroundColor:
                    activeTab === tab ? "#4ADE80" : "#111111",
                  borderWidth: 1,
                  borderColor: activeTab === tab ? "#4ADE80" : "#1F1F1F",
                }}
              >
                <Text
                  style={{
                    color: activeTab === tab ? "#000" : "#737373",
                    fontSize: 13,
                    fontWeight: activeTab === tab ? "700" : "500",
                  }}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Tab Content */}
          {activeTab === "Posts" ? (
            <View testID="tab-content-posts">
              {(creator.posts ?? []).length === 0 ? (
                <Text
                  style={{
                    color: "#404040",
                    textAlign: "center",
                    paddingVertical: 30,
                  }}
                >
                  Sin publicaciones
                </Text>
              ) : (
                (creator.posts ?? []).map((post) => (
                  <View
                    key={post.id}
                    style={{
                      backgroundColor: "#0F0F0F",
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "#1A1A1A",
                    }}
                  >
                    {post.isPinned ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: "#4ADE80",
                            fontSize: 11,
                            fontWeight: "700",
                          }}
                        >
                          FIJADO
                        </Text>
                      </View>
                    ) : null}
                    {post.title ? (
                      <Text
                        style={{
                          color: "#F5F5F5",
                          fontSize: 16,
                          fontWeight: "700",
                          marginBottom: 8,
                        }}
                      >
                        {post.title}
                      </Text>
                    ) : null}
                    <Text
                      style={{
                        color: "#A3A3A3",
                        fontSize: 14,
                        lineHeight: 22,
                      }}
                    >
                      {post.content}
                    </Text>
                    <Text
                      style={{
                        color: "#404040",
                        fontSize: 12,
                        marginTop: 10,
                      }}
                    >
                      {new Date(post.publishedAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                ))
              )}
            </View>
          ) : null}

          {activeTab === "Videos" ? (
            <View testID="tab-content-videos">
              {(creator.videos ?? []).length === 0 ? (
                <Text
                  style={{
                    color: "#404040",
                    textAlign: "center",
                    paddingVertical: 30,
                  }}
                >
                  Sin videos
                </Text>
              ) : (
                (creator.videos ?? []).map((video) => (
                  <Pressable
                    key={video.id}
                    onPress={() => openLink(video.videoUrl)}
                    style={{
                      backgroundColor: "#0F0F0F",
                      borderRadius: 14,
                      marginBottom: 12,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: "#1A1A1A",
                    }}
                  >
                    {video.thumbnailUrl ? (
                      <View style={{ height: 160, position: "relative" }}>
                        <Image
                          source={{ uri: video.thumbnailUrl }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                        <LinearGradient
                          colors={["transparent", "rgba(0,0,0,0.7)"]}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                          }}
                        />
                        <View
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: 12,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                              flex: 1,
                            }}
                          >
                            <Play size={14} color="#F5F5F5" />
                            {video.duration ? (
                              <Text
                                style={{ color: "#A3A3A3", fontSize: 12 }}
                              >
                                {video.duration}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    ) : null}
                    <View style={{ padding: 14 }}>
                      <Text
                        style={{
                          color: "#F5F5F5",
                          fontSize: 15,
                          fontWeight: "700",
                          marginBottom: 4,
                        }}
                      >
                        {video.title}
                      </Text>
                      {video.description ? (
                        <Text
                          style={{
                            color: "#737373",
                            fontSize: 13,
                            lineHeight: 20,
                          }}
                          numberOfLines={2}
                        >
                          {video.description}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}

          {activeTab === "Entrevistas" ? (
            <View testID="tab-content-interviews">
              {(creator.interviews ?? []).length === 0 ? (
                <Text
                  style={{
                    color: "#404040",
                    textAlign: "center",
                    paddingVertical: 30,
                  }}
                >
                  Sin entrevistas
                </Text>
              ) : (
                (creator.interviews ?? []).map((interview) => (
                  <Pressable
                    key={interview.id}
                    onPress={() => openLink(interview.mediaUrl)}
                    style={{
                      backgroundColor: "#0F0F0F",
                      borderRadius: 14,
                      marginBottom: 12,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: "#1A1A1A",
                    }}
                  >
                    {interview.thumbnailUrl ? (
                      <View style={{ height: 140 }}>
                        <Image
                          source={{ uri: interview.thumbnailUrl }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      </View>
                    ) : null}
                    <View style={{ padding: 14 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 6,
                        }}
                      >
                        {interview.interviewType === "podcast" ? (
                          <Mic size={12} color="#A78BFA" />
                        ) : (
                          <Play size={12} color="#4ADE80" />
                        )}
                        <Text
                          style={{
                            color:
                              interview.interviewType === "podcast"
                                ? "#A78BFA"
                                : "#4ADE80",
                            fontSize: 11,
                            fontWeight: "700",
                            textTransform: "uppercase",
                          }}
                        >
                          {interview.interviewType}
                        </Text>
                        {interview.partnerName ? (
                          <Text
                            style={{ color: "#404040", fontSize: 11 }}
                          >
                            × {interview.partnerName}
                          </Text>
                        ) : null}
                      </View>
                      <Text
                        style={{
                          color: "#F5F5F5",
                          fontSize: 15,
                          fontWeight: "700",
                          marginBottom: 4,
                        }}
                      >
                        {interview.title}
                      </Text>
                      {interview.description ? (
                        <Text
                          style={{
                            color: "#737373",
                            fontSize: 13,
                            lineHeight: 20,
                          }}
                          numberOfLines={2}
                        >
                          {interview.description}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}

          {activeTab === "Directos" ? (
            <View testID="tab-content-lives">
              {(creator.lives ?? []).length === 0 ? (
                <Text
                  style={{
                    color: "#404040",
                    textAlign: "center",
                    paddingVertical: 30,
                  }}
                >
                  Sin directos programados
                </Text>
              ) : (
                (creator.lives ?? []).map((live) => (
                  <View
                    key={live.id}
                    style={{
                      backgroundColor: "#0F0F0F",
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor:
                        live.status === "live"
                          ? "rgba(74,222,128,0.3)"
                          : "#1A1A1A",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      {live.status === "live" ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: "rgba(239,68,68,0.15)",
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}
                        >
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: "#EF4444",
                            }}
                          />
                          <Text
                            style={{
                              color: "#EF4444",
                              fontSize: 11,
                              fontWeight: "700",
                            }}
                          >
                            EN VIVO
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: "rgba(96,165,250,0.15)",
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}
                        >
                          <Clock size={10} color="#60A5FA" />
                          <Text
                            style={{
                              color: "#60A5FA",
                              fontSize: 11,
                              fontWeight: "700",
                            }}
                          >
                            PRÓXIMO
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        color: "#F5F5F5",
                        fontSize: 15,
                        fontWeight: "700",
                        marginBottom: 4,
                      }}
                    >
                      {live.title}
                    </Text>
                    {live.description ? (
                      <Text
                        style={{
                          color: "#737373",
                          fontSize: 13,
                          lineHeight: 20,
                        }}
                        numberOfLines={2}
                      >
                        {live.description}
                      </Text>
                    ) : null}
                    {live.scheduledAt ? (
                      <Text
                        style={{
                          color: "#404040",
                          fontSize: 12,
                          marginTop: 8,
                        }}
                      >
                        {new Date(live.scheduledAt).toLocaleDateString(
                          "es-ES",
                          {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          ) : null}

          {activeTab === "Proyectos" ? (
            <View testID="tab-content-projects">
              {(creator.projects ?? []).length === 0 ? (
                <Text
                  style={{
                    color: "#404040",
                    textAlign: "center",
                    paddingVertical: 30,
                  }}
                >
                  Sin proyectos
                </Text>
              ) : (
                (creator.projects ?? []).map((project) => (
                  <Pressable
                    key={project.id}
                    onPress={() => openLink(project.websiteUrl)}
                    style={{
                      backgroundColor: "#0F0F0F",
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "#1A1A1A",
                      flexDirection: "row",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        overflow: "hidden",
                        backgroundColor: "#1A1A1A",
                      }}
                    >
                      {project.logoUrl ? (
                        <Image
                          source={{ uri: project.logoUrl }}
                          style={{ width: 44, height: 44 }}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          style={{
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Briefcase size={18} color="#737373" />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#F5F5F5",
                          fontSize: 15,
                          fontWeight: "700",
                        }}
                      >
                        {project.name}
                      </Text>
                      {project.description ? (
                        <Text
                          style={{ color: "#737373", fontSize: 13 }}
                          numberOfLines={2}
                        >
                          {project.description}
                        </Text>
                      ) : null}
                    </View>
                    {project.websiteUrl ? (
                      <ExternalLink size={14} color="#404040" />
                    ) : null}
                  </Pressable>
                ))
              )}
            </View>
          ) : null}

          {activeTab === "Colabs" ? (
            <View testID="tab-content-colabs">
              {(creator.collaborations ?? []).length === 0 ? (
                <Text
                  style={{
                    color: "#404040",
                    textAlign: "center",
                    paddingVertical: 30,
                  }}
                >
                  Sin colaboraciones activas
                </Text>
              ) : (
                (creator.collaborations ?? []).map((collab) => (
                  <View
                    key={collab.id}
                    style={{
                      backgroundColor: "#0F0F0F",
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor:
                        collab.status === "active"
                          ? "rgba(74,222,128,0.25)"
                          : "#1A1A1A",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor:
                            collab.status === "active"
                              ? "rgba(74,222,128,0.15)"
                              : "#1A1A1A",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            color:
                              collab.status === "active"
                                ? "#4ADE80"
                                : "#737373",
                            fontSize: 11,
                            fontWeight: "700",
                            textTransform: "uppercase",
                          }}
                        >
                          {collab.status}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: "#404040",
                          fontSize: 11,
                          textTransform: "uppercase",
                        }}
                      >
                        {collab.collaborationType.replace("_", " ")}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: "#F5F5F5",
                        fontSize: 15,
                        fontWeight: "700",
                        marginBottom: 6,
                      }}
                    >
                      {collab.title}
                    </Text>
                    {collab.description ? (
                      <Text
                        style={{
                          color: "#737373",
                          fontSize: 13,
                          lineHeight: 20,
                          marginBottom: 12,
                        }}
                      >
                        {collab.description}
                      </Text>
                    ) : null}
                    {collab.ctaLabel && collab.ctaUrl ? (
                      <Pressable
                        onPress={() => openLink(collab.ctaUrl)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          backgroundColor: "#4ADE80",
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignSelf: "flex-start",
                        }}
                      >
                        <Text
                          style={{
                            color: "#000",
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          {collab.ctaLabel}
                        </Text>
                        <ExternalLink size={12} color="#000" />
                      </Pressable>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
