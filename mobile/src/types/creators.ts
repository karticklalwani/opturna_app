export type CreatorType = 'person' | 'company' | 'startup' | 'partner' | 'propfirm' | 'brand';
export type CreatorStatus = 'draft' | 'published' | 'archived';
export type LiveStatus = 'upcoming' | 'live' | 'ended';

export interface CreatorProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: CreatorType;
  name: string;
  username: string;
  slug: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  shortBio: string | null;
  fullBio: string | null;
  category: string | null;
  subcategory: string | null;
  tags: string | null; // JSON array string
  verified: boolean;
  featured: boolean;
  officialPartner: boolean;
  websiteUrl: string | null;
  youtubeUrl: string | null;
  podcastUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
  telegramUrl: string | null;
  contactEmail: string | null;
  companyName: string | null;
  location: string | null;
  status: CreatorStatus;
  followersCount: number;
  _count?: { follows: number; posts: number; videos: number };
  posts?: CreatorPost[];
  videos?: CreatorVideo[];
  interviews?: CreatorInterview[];
  lives?: CreatorLive[];
  projects?: CreatorProject[];
  collaborations?: Collaboration[];
}

export interface CreatorPost {
  id: string;
  createdAt: string;
  creatorProfileId: string;
  title: string | null;
  content: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  externalUrl: string | null;
  isPinned: boolean;
  isFeatured: boolean;
  visibility: string;
  publishedAt: string;
}

export interface CreatorVideo {
  id: string;
  createdAt: string;
  creatorProfileId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl: string;
  sourcePlatform: string;
  duration: string | null;
  category: string | null;
  publishedAt: string;
  featured: boolean;
}

export interface CreatorInterview {
  id: string;
  createdAt: string;
  creatorProfileId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  interviewType: string;
  partnerName: string | null;
  publishedAt: string;
  featured: boolean;
  creator?: { name: string; slug: string; avatarUrl: string | null; verified: boolean };
}

export interface CreatorLive {
  id: string;
  createdAt: string;
  creatorProfileId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  streamUrl: string | null;
  status: LiveStatus;
  scheduledAt: string | null;
  endedAt: string | null;
  featured: boolean;
  creator?: { name: string; slug: string; avatarUrl: string | null; verified: boolean };
}

export interface CreatorProject {
  id: string;
  createdAt: string;
  creatorProfileId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  category: string | null;
  status: string;
  featured: boolean;
}

export interface Collaboration {
  id: string;
  createdAt: string;
  creatorProfileId: string;
  title: string;
  description: string | null;
  collaborationType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  landingPageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  featured: boolean;
}

export interface CreatorCategory {
  slug: string;
  name: string;
  icon: string;
}
