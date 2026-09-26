/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Destination, AppUser, NewsPost, CommunityPost, EditorialStory, UserReport } from '../types';
import { db, collection, getDocs } from './firebase';

export interface AdminAnalyticsData {
  totalUsers: number;
  adminUsersCount: number;
  regularUsersCount: number;
  totalDestinations: number;
  totalNews: number;
  totalComments: number;
  totalLikes: number;
  popularDestinations: Destination[];
  categoryBreakdown: Record<string, number>;
  divisionBreakdown: Record<string, number>;
  userActivities: UserActivityItem[];
}

export interface UserActivityItem {
  id: string;
  type: 'user_register' | 'post_submit' | 'story_submit' | 'report_filed' | 'news_published' | 'comment_posted' | 'like_given';
  title: string;
  titleBn: string;
  userName: string;
  userAvatar?: string;
  timestamp: number;
  details?: string;
}

/**
 * Computes analytics from the live states in the app
 */
export function calculateAnalytics(params: {
  users: AppUser[];
  destinations: Destination[];
  news: NewsPost[];
  posts: CommunityPost[];
  stories: EditorialStory[];
  reports: UserReport[];
}): AdminAnalyticsData {
  const { users, destinations, news, posts, stories, reports } = params;

  // 1. Total Users
  const totalUsers = users.length > 0 ? users.length : 1;
  const adminUsersCount = users.filter((u) => u.role === 'admin').length;
  const regularUsersCount = totalUsers - adminUsersCount;

  // 2. Total Destinations
  const totalDestinations = destinations.length;

  // 3. Total News
  const totalNews = news.length;

  // 4. Total Comments
  const newsComments = news.reduce((acc, n) => acc + (n.commentsCount || 0), 0);
  const postComments = posts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
  const storyComments = stories.reduce((acc, s) => acc + (s.commentsCount || 0), 0);
  const totalComments = newsComments + postComments + storyComments;

  // 5. Total Likes
  const newsLikes = news.reduce((acc, n) => acc + (n.likesCount || (n.likedBy?.length || 0)), 0);
  const postLikes = posts.reduce((acc, p) => acc + (p.likesCount || (p.likedBy?.length || 0)), 0);
  const storyLikes = stories.reduce((acc, s) => acc + (s.likesCount || (s.likedBy?.length || 0)), 0);
  const destinationReviewsSum = destinations.reduce((acc, d) => acc + (d.reviewsCount || 0), 0);
  const totalLikes = newsLikes + postLikes + storyLikes + destinationReviewsSum;

  // 6. Popular Destinations (Sorted by Rating * ReviewsCount)
  const popularDestinations = [...destinations]
    .sort((a, b) => {
      const scoreA = (a.rating || 4.5) * Math.log10(Math.max(10, a.reviewsCount || 100));
      const scoreB = (b.rating || 4.5) * Math.log10(Math.max(10, b.reviewsCount || 100));
      return scoreB - scoreA;
    })
    .slice(0, 10);

  // Category Breakdown
  const categoryBreakdown: Record<string, number> = {};
  destinations.forEach((d) => {
    const cat = d.category || 'other';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  });

  // Division Breakdown
  const divisionBreakdown: Record<string, number> = {};
  destinations.forEach((d) => {
    const div = d.division || 'Unknown';
    divisionBreakdown[div] = (divisionBreakdown[div] || 0) + 1;
  });

  // 7. User Activity Aggregation
  const activities: UserActivityItem[] = [];

  // Users registration activities
  users.forEach((u) => {
    activities.push({
      id: `act-usr-${u.uid}`,
      type: 'user_register',
      title: `Member account registered: ${u.displayName || u.email || 'Traveler'}`,
      titleBn: `নতুন সদস্য যোগদান করেছেন: ${u.displayName || u.email || 'ভ্রমণকারী'}`,
      userName: u.displayName || u.email || 'Traveler',
      userAvatar: u.photoURL || undefined,
      timestamp: u.createdAt || u.lastLoginAt || Date.now() - 3600 * 1000 * 5,
      details: u.role === 'admin' ? 'Role: Administrator' : 'Role: Registered Explorer',
    });
  });

  // Posts activities
  posts.forEach((p) => {
    activities.push({
      id: `act-post-${p.id}`,
      type: 'post_submit',
      title: `Community photo uploaded: "${p.title}"`,
      titleBn: `ছবি আপলোড করেছেন: "${p.title}"`,
      userName: p.userName || 'Community Explorer',
      userAvatar: p.userAvatar,
      timestamp: p.createdAt || Date.now() - 3600 * 1000 * 12,
      details: `Location: ${p.location}, ${p.division}`,
    });
  });

  // Stories activities
  stories.forEach((s) => {
    activities.push({
      id: `act-story-${s.id}`,
      type: 'story_submit',
      title: `Travel story published: "${s.title}"`,
      titleBn: `ভ্রমণ আখ্যান প্রকাশিত: "${s.titleBn || s.title}"`,
      userName: s.author || 'Editorial Desk',
      timestamp: s.createdAt || Date.now() - 3600 * 1000 * 24,
      details: `Category: ${s.category}`,
    });
  });

  // News activities
  news.forEach((n) => {
    activities.push({
      id: `act-news-${n.id}`,
      type: 'news_published',
      title: `Official tourism bulletin: "${n.title}"`,
      titleBn: `অফিসিয়াল বুলেটিন জারি: "${n.titleBn || n.title}"`,
      userName: n.authorName || 'Tourism Board',
      timestamp: n.createdAt || Date.now() - 3600 * 1000 * 48,
      details: `Category: ${n.category}`,
    });
  });

  // Reports activities
  reports.forEach((r) => {
    activities.push({
      id: `act-rep-${r.id}`,
      type: 'report_filed',
      title: `User report submitted: "${r.subject}"`,
      titleBn: `ইউজার রিপোর্ট দাখিল: "${r.subject}"`,
      userName: r.reporterName || 'Visitor',
      timestamp: r.createdAt || Date.now() - 3600 * 1000 * 18,
      details: `Status: ${r.status}`,
    });
  });

  // Sort activities by most recent first
  const sortedActivities = activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);

  return {
    totalUsers,
    adminUsersCount,
    regularUsersCount,
    totalDestinations,
    totalNews,
    totalComments,
    totalLikes,
    popularDestinations,
    categoryBreakdown,
    divisionBreakdown,
    userActivities: sortedActivities,
  };
}
