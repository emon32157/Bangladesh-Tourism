/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Destination, AppUser, NewsPost, CommunityPost, EditorialStory, UserReport, Language } from '../types';
import { calculateAnalytics, UserActivityItem } from '../lib/analyticsService';
import {
  Users,
  MapPin,
  Newspaper,
  MessageSquare,
  Heart,
  TrendingUp,
  Activity,
  Star,
  Award,
  Layers,
  Calendar,
  Clock,
  Download,
  Filter,
  Eye,
  CheckCircle2,
  FileSpreadsheet,
  Compass,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminAnalyticsDashboardProps {
  language: Language;
  users: AppUser[];
  destinations: Destination[];
  news: NewsPost[];
  posts: CommunityPost[];
  stories: EditorialStory[];
  reports: UserReport[];
  onSelectDestination?: (dest: Destination) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  language,
  users,
  destinations,
  news,
  posts,
  stories,
  reports,
  onSelectDestination,
  onNavigateTab,
}) => {
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '7d'>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');

  // Compute live analytics data
  const analytics = useMemo(() => {
    return calculateAnalytics({
      users,
      destinations,
      news,
      posts,
      stories,
      reports,
    });
  }, [users, destinations, news, posts, stories, reports]);

  // Format relative time helper
  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return language === 'en' ? 'Just now' : 'এইমাত্র';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return language === 'en' ? `${diffMin}m ago` : `${diffMin} মি. আগে`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return language === 'en' ? `${diffHour}h ago` : `${diffHour} ঘণ্টা আগে`;
    const diffDay = Math.floor(diffHour / 24);
    return language === 'en' ? `${diffDay}d ago` : `${diffDay} দিন আগে`;
  };

  // Filtered user activities
  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return analytics.userActivities;
    return analytics.userActivities.filter((a) => a.type === activityFilter);
  }, [analytics.userActivities, activityFilter]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Registered Users', analytics.totalUsers],
      ['Total Tourism Destinations', analytics.totalDestinations],
      ['Total Tourism Bulletins (News)', analytics.totalNews],
      ['Total Comments', analytics.totalComments],
      ['Total Likes & Reactions', analytics.totalLikes],
      ['Active Administrators', analytics.adminUsersCount],
      ['Pending Reports', reports.filter((r) => r.status === 'pending').length],
      ['', ''],
      ['Top Popular Destinations', 'Rating / Reviews'],
      ...analytics.popularDestinations.map((d) => [d.title, `${d.rating}★ (${d.reviewsCount} reviews)`]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bangladesh_tourism_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dashboard Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#0F3B2E] via-[#144738] to-[#0A2A21] text-white border border-[#DE9B2E]/40 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#DE9B2E]/20 border border-[#DE9B2E]/40 flex items-center justify-center font-bold text-[#DE9B2E] shadow-inner shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#DE9B2E]">
                {language === 'en' ? 'Administrative Intelligence' : 'প্রশাসনিক অ্যানালিটিক্স'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Data
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
              {language === 'en' ? 'Tourism Analytics & Activity Dashboard' : 'পর্যটন অ্যানালিটিক্স ও অ্যাক্টিভিটি ড্যাশবোর্ড'}
            </h3>
            <p className="text-xs text-white/80 mt-0.5">
              {language === 'en'
                ? 'Real-time performance indicators, visitor engagements, top destinations, and audit logs.'
                : 'ব্যবহারকারী বৃদ্ধি, জনপ্রিয় গন্তব্য, লাইক, কমেন্ট ও সাম্প্রতিক কার্যক্রমের রিয়েল-টাইম তথ্য।'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0A2A21] bg-[#DE9B2E] hover:bg-[#c78822] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Export CSV' : 'রিপোর্ট ডাউনলোড'}</span>
          </button>
        </div>
      </div>

      {/* 5 Core Required Metrics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
        {/* 1. Total Users */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B756E] uppercase tracking-wider">
              {language === 'en' ? 'Total Users' : 'মোট ব্যবহারকারী'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black font-serif text-[#0A2A21] tracking-tight">
              {analytics.totalUsers}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {analytics.adminUsersCount} {language === 'en' ? 'Admins' : 'অ্যাডমিন'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 2. Total Destinations */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B756E] uppercase tracking-wider">
              {language === 'en' ? 'Total Destinations' : 'মোট গন্তব্য'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black font-serif text-[#0A2A21] tracking-tight">
              {analytics.totalDestinations}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {language === 'en' ? '64 Districts Covered' : '৬৪ জেলা অন্তর্ভুক্ত'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 3. Total News */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B756E] uppercase tracking-wider">
              {language === 'en' ? 'Total News' : 'মোট সংবাদ'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Newspaper className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black font-serif text-[#0A2A21] tracking-tight">
              {analytics.totalNews}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {language === 'en' ? 'Official Bulletins' : 'অফিসিয়াল বুলেটিন'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 4. Total Comments */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B756E] uppercase tracking-wider">
              {language === 'en' ? 'Total Comments' : 'মোট মন্তব্য'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black font-serif text-[#0A2A21] tracking-tight">
              {analytics.totalComments}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {language === 'en' ? 'Community Discussions' : 'আলোচনা ও ফিডব্যাক'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 5. Total Likes */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs hover:shadow-md transition-all flex flex-col justify-between col-span-2 md:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B756E] uppercase tracking-wider">
              {language === 'en' ? 'Total Likes' : 'মোট লাইক ও রিঅ্যাকশন'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black font-serif text-[#8C3B2E] tracking-tight">
              {analytics.totalLikes}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                {language === 'en' ? 'Traveler Reactions' : 'ভ্রমণকারী রিঅ্যাকশন'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Middle Grid: Popular Destinations & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Destinations (2 Cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-[#D8D0BC] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#D8D0BC]/80 pb-3">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-[#DE9B2E]" />
              <h4 className="text-lg font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Popular Destinations Ranking' : 'জনপ্রিয় পর্যটন গন্তব্যসমূহ'}
              </h4>
            </div>
            <span className="text-xs text-[#6B756E]">
              {language === 'en' ? 'Ranked by ratings & visitor reviews' : 'রেটিং ও রিভিউর ভিত্তিতে সাজানো'}
            </span>
          </div>

          <div className="space-y-3">
            {analytics.popularDestinations.slice(0, 6).map((dest, idx) => (
              <div
                key={dest.id}
                onClick={() => onSelectDestination && onSelectDestination(dest)}
                className="group p-3 sm:p-3.5 rounded-2xl bg-[#F6F3EA]/70 hover:bg-white border border-[#D8D0BC] hover:border-[#0F3B2E] transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs hover:shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    idx === 0
                      ? 'bg-[#DE9B2E] text-white shadow-xs'
                      : idx === 1
                      ? 'bg-neutral-300 text-neutral-800'
                      : idx === 2
                      ? 'bg-amber-800 text-white'
                      : 'bg-white text-[#6B756E] border border-[#D8D0BC]'
                  }`}>
                    #{idx + 1}
                  </span>

                  <img
                    src={dest.image}
                    alt={dest.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white shadow-xs"
                  />

                  <div className="min-w-0">
                    <h5 className="font-bold text-sm text-[#0A2A21] group-hover:text-[#8C3B2E] transition-colors truncate">
                      {language === 'en' ? dest.title : dest.titleBn}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-[#6B756E] mt-0.5 truncate">
                      <span>📍 {dest.district || dest.division}</span>
                      <span>•</span>
                      <span className="capitalize">{dest.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DE9B2E]/15 border border-[#DE9B2E]/30 text-xs font-bold text-[#0A2A21]">
                    <Star className="w-3.5 h-3.5 text-[#DE9B2E] fill-current" />
                    <span>{dest.rating}</span>
                    <span className="text-[10px] text-[#6B756E]">({dest.reviewsCount})</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#6B756E] group-hover:text-[#0F3B2E] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category & Division Breakdown (1 Col) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#D8D0BC] shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-[#D8D0BC]/80 pb-3">
            <Layers className="w-5 h-5 text-[#0F3B2E]" />
            <h4 className="text-lg font-bold font-serif text-[#0A2A21]">
              {language === 'en' ? 'Category Distribution' : 'ক্যাটাগরি ভিত্তিক অনুপাত'}
            </h4>
          </div>

          <div className="space-y-3.5">
            {Object.entries(analytics.categoryBreakdown).map(([cat, count]) => {
              const numCount = Number(count) || 0;
              const percentage = Math.round((numCount / (analytics.totalDestinations || 1)) * 100);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0A2A21] capitalize">{cat.replace('_', ' ')}</span>
                    <span className="text-[#6B756E] font-medium">{numCount} places ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#F6F3EA] overflow-hidden border border-[#D8D0BC]/60">
                    <div
                      className="h-full bg-gradient-to-r from-[#0F3B2E] to-[#DE9B2E] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#D8D0BC]/80">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#6B756E] mb-2.5">
              {language === 'en' ? 'Top Divisions' : 'শীর্ষ বিভাগসমূহ'}
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(analytics.divisionBreakdown)
                .sort((a, b) => Number(b[1]) - Number(a[1]))
                .slice(0, 5)
                .map(([div, count]) => (
                  <span
                    key={div}
                    className="px-2.5 py-1 rounded-full bg-[#F6F3EA] border border-[#D8D0BC] text-[11px] font-bold text-[#0A2A21]"
                  >
                    {div.replace(' Division', '')}: <span className="text-[#0F3B2E]">{count}</span>
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Activity Feed Timeline */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#D8D0BC] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8D0BC]/80 pb-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-700" />
            <div>
              <h4 className="text-lg font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Real-Time User Activity Log' : 'ব্যবহারকারীদের সাম্প্রতিক কার্যক্রম (User Activity)'}
              </h4>
              <p className="text-xs text-[#6B756E]">
                {language === 'en'
                  ? 'Audit stream of new user registrations, uploads, stories, reports, and community engagements.'
                  : 'সদস্য যোগদান, ফটো আপলোড, রিপোর্ট ও কন্টেন্ট সাবমিশনের লাইভ লগ।'}
              </p>
            </div>
          </div>

          {/* Activity Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: language === 'en' ? 'All' : 'সব' },
              { id: 'user_register', label: language === 'en' ? 'Users' : 'সদস্য' },
              { id: 'post_submit', label: language === 'en' ? 'Photos' : 'ছবি' },
              { id: 'story_submit', label: language === 'en' ? 'Stories' : 'আখ্যান' },
              { id: 'report_filed', label: language === 'en' ? 'Reports' : 'রিপোর্ট' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivityFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activityFilter === tab.id
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'bg-[#F6F3EA] text-[#6B756E] hover:bg-[#EFEADC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Items List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B756E]">
              {language === 'en' ? 'No recent activities recorded.' : 'কোনো সাম্প্রতিক কার্যক্রম নেই।'}
            </div>
          ) : (
            filteredActivities.map((act) => {
              const isUser = act.type === 'user_register';
              const isPost = act.type === 'post_submit';
              const isStory = act.type === 'story_submit';
              const isNews = act.type === 'news_published';
              const isReport = act.type === 'report_filed';

              return (
                <div
                  key={act.id}
                  className="p-3 sm:p-3.5 rounded-2xl bg-[#F6F3EA]/60 hover:bg-[#F6F3EA] border border-[#D8D0BC]/80 transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-blue-100 text-blue-700'
                        : isPost
                        ? 'bg-emerald-100 text-emerald-800'
                        : isStory
                        ? 'bg-amber-100 text-amber-800'
                        : isReport
                        ? 'bg-red-100 text-red-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {isUser && <Users className="w-4 h-4" />}
                      {isPost && <MapPin className="w-4 h-4" />}
                      {isStory && <Award className="w-4 h-4" />}
                      {isReport && <Clock className="w-4 h-4" />}
                      {isNews && <Newspaper className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0A2A21] truncate">
                          {language === 'en' ? act.title : act.titleBn}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6B756E] mt-0.5 flex items-center gap-2">
                        <span className="font-medium text-[#0F3B2E]">by {act.userName}</span>
                        {act.details && <span>• {act.details}</span>}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-[#6B756E] shrink-0 bg-white px-2.5 py-1 rounded-full border border-[#D8D0BC] shadow-2xs">
                    {formatTimeAgo(act.timestamp)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
