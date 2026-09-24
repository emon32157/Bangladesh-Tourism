export type Language = 'en' | 'bn';

export type DestinationCategory = 'all' | 'coastal' | 'wildlife' | 'hills_tea' | 'heritage' | 'river';

export interface Destination {
  id: string;
  title: string;
  titleBn: string;
  division: string;
  district?: string;
  districtBn?: string;
  upazila?: string;
  address?: string;
  googleMapsUrl?: string;
  lat?: number;
  lng?: number;
  category: 'coastal' | 'wildlife' | 'hills_tea' | 'heritage' | 'river' | string;
  image: string;
  gallery?: string[];
  heroFeatured?: boolean;
  tag: string;
  tagBn: string;
  summary: string;
  summaryBn: string;
  description: string;
  descriptionBn: string;
  highlights: string[];
  bestSeason: string;
  bestSeasonBn: string;
  rating: number;
  reviewsCount: number;
  duration: string;
  nearestAirport: string;
  heritageType?: string;
  unescoStatus?: boolean;
  videoUrl?: string;
}

export interface Experience {
  id: string;
  title: string;
  titleBn: string;
  category: string;
  duration: string;
  icon: string;
  description: string;
  descriptionBn: string;
  location: string;
  tag: string;
}

export interface Festival {
  id: string;
  title: string;
  titleBn: string;
  date: string;
  dateBn: string;
  location: string;
  locationBn: string;
  description: string;
  descriptionBn: string;
  emoji: string;
  badge: string;
}

export type ReactionType = 'love' | 'like' | 'wow' | 'bengal';

export interface SocialComment {
  id: string;
  targetId: string; // post ID or story ID
  targetType: 'post' | 'story';
  userId: string;
  userName: string;
  userAvatar?: string;
  userEmail?: string;
  text: string;
  createdAt: number;
  likesCount?: number;
  likedBy?: string[];
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface EditorialStory {
  id: string;
  title: string;
  titleBn: string;
  author: string;
  readTime: string;
  category: string;
  date: string;
  image: string;
  gallery?: string[];
  videoUrl?: string; // YouTube URL, Shorts URL, or iframe embed code
  excerpt: string;
  excerptBn: string;
  content: string[];
  pullQuote: string;
  likesCount?: number;
  likedBy?: string[];
  userReactions?: Record<string, ReactionType>;
  reactions?: Record<ReactionType, number>;
  commentsCount?: number;
  // Moderation & Ownership fields
  status?: ModerationStatus;
  userId?: string;
  submittedBy?: string;
  submittedByEmail?: string;
  createdAt?: number;
  approvedAt?: number;
  approvedBy?: string;
  rejectionReason?: string;
  expiresAt?: number;
}

export interface ItineraryPlan {
  id: string;
  days: number;
  title: string;
  titleBn: string;
  focus: string;
  recommendedFor: string;
  daysList: {
    day: number;
    title: string;
    description: string;
    location: string;
  }[];
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userEmail?: string;
  title: string;
  caption: string;
  location: string;
  division: string;
  imageUrl: string;
  videoUrl?: string; // YouTube URL or iframe embed code
  deleteUrl?: string;
  likesCount: number;
  likedBy?: string[];
  userReactions?: Record<string, ReactionType>;
  reactions?: Record<ReactionType, number>;
  commentsCount?: number;
  createdAt: number;
  tags?: string[];
  // Moderation & Ownership fields
  status?: ModerationStatus;
  approvedAt?: number;
  approvedBy?: string;
  rejectionReason?: string;
  expiresAt?: number;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  role?: 'admin' | 'user';
  createdAt?: number;
  lastLoginAt?: number;
}

export interface DestinationReview {
  id: string;
  destinationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  photoUrl?: string;
  createdAt: number;
}

export type ReportCategory =
  | 'incorrect_info'
  | 'technical_issue'
  | 'inappropriate_content'
  | 'tourism_feedback'
  | 'safety_concern'
  | 'other';

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface UserReport {
  id: string;
  subject: string;
  details: string;
  category: ReportCategory;
  imageUrl?: string;
  targetTitle?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterContact?: string;
  userId?: string;
  createdAt: number;
  status: ReportStatus;
  adminNotes?: string;
  resolvedAt?: number;
  resolvedBy?: string;
}

export type SubscriberStatus = 'active' | 'unsubscribed';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  createdAt: number;
  source?: string;
  language?: Language;
}

export interface NewsComment {
  id: string;
  newsId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: number;
}

export interface NewsPost {
  id: string;
  title: string;
  titleBn?: string;
  category: string; // e.g. 'Tourism Update', 'Travel Alert', 'Festival', 'Preservation', 'General'
  categoryBn?: string;
  image: string;
  summary: string;
  summaryBn?: string;
  content: string;
  contentBn?: string;
  authorName: string;
  authorRole: string;
  createdAt: number;
  updatedAt?: number;
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  pinned?: boolean;
}


