export interface MediaPost {
  id: string;
  createdAt: string;
  userId: string;
  type: 'video' | 'image' | 'reel';
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  duration: number | null;
  views: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  category: string | null;
  tags: string | null;
  score: number;
  authorName: string | null;
  authorAvatar: string | null;
  authorUsername: string | null;
  _count?: { likes: number; comments: number; saves: number };
}

export interface Story {
  id: string;
  createdAt: string;
  expiresAt: string;
  userId: string;
  url: string;
  type: 'image' | 'video';
  caption: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  authorUsername: string | null;
  views: number;
  _count?: { storyViews: number };
}

export interface MediaComment {
  id: string;
  createdAt: string;
  userId: string;
  postId: string;
  content: string;
  authorName: string | null;
  authorAvatar: string | null;
}
