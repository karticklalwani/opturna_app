export interface User {
  id: string;
  name: string;
  email?: string;
  image?: string | null;
  username?: string | null;
  bio?: string | null;
  coverImage?: string | null;
  mainAmbition?: string | null;
  currentGoals?: string | null;
  isPublic?: boolean;
  role?: string;
  isVerified?: boolean;
  interests?: string | null; // JSON string
  externalLinks?: string | null; // JSON string
  createdAt?: string;
  _count?: { followers: number; following: number; posts: number };
}

export interface Post {
  id: string;
  createdAt: string;
  authorId: string;
  author: Pick<User, 'id' | 'name' | 'image' | 'username' | 'isVerified' | 'role'>;
  content?: string | null;
  type: string;
  category: string;
  mediaUrls?: string | null;
  hashtags?: string | null;
  isPublic: boolean;
  _count?: { comments: number; reactions: number };
  reactions?: Array<{ type: string; userId: string }>;
}

export interface Comment {
  id: string;
  createdAt: string;
  content: string;
  authorId: string;
  author: Pick<User, 'id' | 'name' | 'image' | 'username'>;
  parentId?: string | null;
  replies?: Comment[];
}

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  progress: number;
  category?: string | null;
  dueDate?: string | null;
  isCompleted: boolean;
  milestones?: string | null;
  createdAt: string;
}

export interface Sprint {
  id: string;
  title: string;
  description?: string | null;
  duration: number;
  startDate: string;
  endDate: string;
  status: string;
  creator: Pick<User, 'id' | 'name' | 'image'>;
  _count?: { members: number; checkIns: number };
  members?: Array<{ streak: number; role: string }>;
}

export interface Course {
  id: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  category?: string | null;
  access: string;
  creator: Pick<User, 'id' | 'name' | 'image' | 'isVerified'>;
  _count?: { lessons: number; enrollments: number };
}

export interface Chat {
  id: string;
  type: string;
  name?: string | null;
  image?: string | null;
  updatedAt: string;
  members: Array<{
    user: Pick<User, 'id' | 'name' | 'image' | 'username'>;
    role: string;
  }>;
  messages?: Array<{ content?: string | null; createdAt: string; type: string }>;
}

export interface Message {
  id: string;
  createdAt: string;
  content?: string | null;
  type: string;
  senderId: string;
  sender: Pick<User, 'id' | 'name' | 'image' | 'username'>;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  creator: Pick<User, 'id' | 'name' | 'image'>;
  _count?: { rsvps: number };
}
