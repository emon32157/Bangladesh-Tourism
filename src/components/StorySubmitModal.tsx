/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { uploadImageToImgBB } from '../lib/imgbb';
import { db, rtdb, collection, addDoc, push, ref, set } from '../lib/firebase';
import { saveStoryToFirebase } from '../lib/firestoreSync';
import { Language, EditorialStory, AppUser } from '../types';
import { checkIsUserAdmin } from '../lib/userRoles';
import {
  X,
  UploadCloud,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  PenTool,
  Clock,
  Shield,
  Lock,
  User as UserIcon,
  ArrowRight,
  Video,
} from 'lucide-react';

interface StorySubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  language: Language;
  onStoryCreated?: (story: EditorialStory) => void;
  onOpenAuth: () => void;
}

const STORY_CATEGORIES = [
  { id: 'Heritage & History', nameEn: 'Heritage & History', nameBn: 'ঐতিহ্য ও ইতিহাস' },
  { id: 'Nature & Wildlife', nameEn: 'Nature & Wildlife', nameBn: 'প্রকৃতি ও বন্যপ্রাণী' },
  { id: 'Culture & Traditions', nameEn: 'Culture & Traditions', nameBn: 'সংস্কৃতি ও ঐতিহ্য' },
  { id: 'Culinary & Gastronomy', nameEn: 'Culinary & Gastronomy', nameBn: 'খাবার ও রন্ধনশিল্প' },
  { id: 'Tribal & Living Lore', nameEn: 'Tribal & Living Lore', nameBn: 'নৃগোষ্ঠী ও লোকগাথা' },
  { id: 'Riverine Odyssey', nameEn: 'Riverine Odyssey', nameBn: 'নদী ও ব্যাকওয়াটার' },
];

export const StorySubmitModal: React.FC<StorySubmitModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  language,
  onStoryCreated,
  onOpenAuth,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [authorName, setAuthorName] = useState(currentUser?.displayName || '');
  const [authorEmail, setAuthorEmail] = useState(currentUser?.email || '');
  const [category, setCategory] = useState('Heritage & History');
  const [readTime, setReadTime] = useState('5 min read');
  const [excerpt, setExcerpt] = useState('');
  const [excerptBn, setExcerptBn] = useState('');
  const [content, setContent] = useState('');
  const [pullQuote, setPullQuote] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isLoggedInWithEmail = !!currentUser && !currentUser.isAnonymous && !!currentUser.email;
  const isAdmin = checkIsUserAdmin(currentUser);
  const submissionStatus: 'pending' | 'approved' = isAdmin ? 'approved' : 'pending';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage(
          language === 'en' ? 'File size must be under 25MB' : 'ছবির সাইজ ২৫ মেগাবাইটের কম হতে হবে'
        );
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedInWithEmail) {
      setErrorMessage(
        language === 'en'
          ? 'Guest accounts cannot submit stories. Please sign in with your email account.'
          : 'গেস্ট একাউন্ট থেকে গল্প জমা দেওয়া যাবে না। অনুগ্রহ করে আপনার ইমেইল দিয়ে সাইন ইন করুন।'
      );
      return;
    }
    if (!title.trim()) {
      setErrorMessage(language === 'en' ? 'Story title is required' : 'গল্পের শিরোনাম আবশ্যক');
      return;
    }
    if (!authorName.trim()) {
      setErrorMessage(language === 'en' ? 'Author name is required' : 'লেখকের নাম আবশ্যক');
      return;
    }
    if (!selectedFile && !previewUrl) {
      setErrorMessage(language === 'en' ? 'Please upload a cover photo' : 'দয়া করে একটি কভার ছবি আপলোড করুন');
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      let finalImageUrl = previewUrl || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80';

      if (selectedFile) {
        setUploadStage(
          language === 'en' ? 'Uploading cover photo to ImgBB...' : 'ImgBB-তে কভার ছবি আপলোড হচ্ছে...'
        );
        const imgbbRes = await uploadImageToImgBB(selectedFile, title || 'Bangladesh Editorial Story');
        if (imgbbRes.success && imgbbRes.url) {
          finalImageUrl = imgbbRes.displayUrl || imgbbRes.url;
        }
      }

      setUploadStage(
        language === 'en' ? 'Saving story to database...' : 'গল্পটি ডেটাবেসে সংরক্ষিত হচ্ছে...'
      );

      const now = Date.now();
      const storyId = `story_${now}_${Math.random().toString(36).substring(2, 6)}`;
      const paragraphs = content
        .split('\n\n')
        .map((p) => p.trim())
        .filter(Boolean);

      const resolvedAuthor = authorName.trim() || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Traveler Contributor';
      const resolvedEmail = currentUser?.email || authorEmail.trim() || undefined;

      const newStory: EditorialStory = {
        id: storyId,
        title: title.trim(),
        titleBn: (titleBn.trim() || title.trim()),
        author: resolvedAuthor,
        readTime: readTime || '5 min read',
        category,
        date: new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
          month: 'short',
          year: 'numeric',
        }),
        image: finalImageUrl,
        excerpt: excerpt.trim() || title.trim(),
        excerptBn: excerptBn.trim() || titleBn.trim() || title.trim(),
        content: paragraphs.length > 0 ? paragraphs : [excerpt || title],
        pullQuote: pullQuote.trim() || `“${title.trim()}”`,
        videoUrl: videoUrl.trim() || undefined,
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        status: submissionStatus,
        userId: currentUser.uid,
        submittedBy: resolvedAuthor,
        submittedByEmail: resolvedEmail,
        createdAt: now,
        approvedAt: isAdmin ? now : undefined,
        approvedBy: isAdmin ? (currentUser.displayName || 'Admin') : undefined,
        expiresAt: isAdmin ? undefined : now + (30 * 24 * 60 * 60 * 1000), // exactly 30 days
      };

      // Store directly in Firestore cloud database
      await saveStoryToFirebase(newStory);

      if (onStoryCreated) {
        onStoryCreated(newStory);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: unknown) {
      console.error('Story submission error:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred during submission. Please try again.'
      );
    } finally {
      setUploading(false);
      setUploadStage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-[#FAF8F3] rounded-2xl border border-[#D8D0BC] shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0F3B2E] text-white p-6 relative">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-[#DE9B2E] text-xs font-semibold uppercase tracking-wider mb-1">
            <PenTool className="w-4 h-4" />
            <span>{language === 'en' ? 'The Bengal Chronicle Submissions' : 'পত্রিকা ও আখ্যান প্রকাশনা'}</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">
            {language === 'en' ? 'Submit Your Travel Narrative' : 'আপনার ভ্রমণ আখ্যান বা প্রবন্ধ লিখুন'}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            {language === 'en'
              ? 'Share deep heritage essays, village lore, or culinary journeys with readers across Bangladesh.'
              : 'ঐতিহ্য, সংস্কৃতি, লোকগাথা বা প্রকৃতির অনন্য অনুভূতি লিখে প্রকাশ করুন।'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {success ? (
            <div className="py-10 text-center flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center animate-bounce ${
                  submissionStatus === 'approved'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#0A2A21]">
                {submissionStatus === 'approved'
                  ? language === 'en'
                    ? 'Story Published to The Chronicle!'
                    : 'গল্পটি সফলভাবে প্রকাশিত হয়েছে!'
                  : language === 'en'
                  ? 'Story Submitted for Editorial Review (Pending)'
                  : 'গল্পটি পর্যালোচনার জন্য জমা হয়েছে (Pending)'}
              </h3>
              <p className="text-xs sm:text-sm text-[#4B554E] max-w-md leading-relaxed">
                {submissionStatus === 'approved'
                  ? language === 'en'
                    ? 'Your story is now live and featured in The Bengal Chronicle.'
                    : 'আপনার প্রবন্ধটি বেঙ্গল ক্রনিকেলে সরাসরি প্রকাশিত হয়েছে।'
                  : language === 'en'
                  ? 'Your essay is stored in the moderation queue. After an Administrator reviews and approves it, it will appear live on the website. (Pending submissions auto-expire after 30 days if unreviewed).'
                  : 'আপনার ভ্রমণ গল্পটি সুরক্ষিতভাবে পেন্ডিং তালিকায় সংরক্ষিত হয়েছে। অ্যাডমিন প্যানেল থেকে অনুমোদনের পর এটি ওয়েবসাইটে লাইভ প্রদর্শিত হবে। (৩০ দিনের মধ্যে পর্যালোচিত না হলে এটি স্বয়ংক্রিয়ভাবে মুছে যাবে)।'}
              </p>
            </div>
          ) : !isLoggedInWithEmail ? (
            <div className="py-8 px-4 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#0A2A21]">
                {language === 'en' ? 'Email Account Required' : 'ইমেইল আইডি দিয়ে লগইন আবশ্যক'}
              </h3>
              <p className="text-xs sm:text-sm text-[#4B554E] max-w-md leading-relaxed">
                {language === 'en'
                  ? 'Guest accounts cannot submit editorial stories. Please sign in with your email account to publish heritage stories.'
                  : 'গেস্ট একাউন্ট থেকে কোনো ভ্রমণ গল্প বা নিবন্ধ জমা দেওয়া যাবে না। গল্প লিখতে অনুগ্রহ করে আপনার ইমেইল দিয়ে সাইন ইন করুন।'}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 px-4 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold hover:bg-[#0A2A21] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Sign In with Email' : 'ইমেইল দিয়ে সাইন ইন করুন'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-white border border-[#D8D0BC] text-[#4B554E] rounded-xl text-xs font-bold hover:bg-[#EFECE3] cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 30-Day Moderation Policy Notice Banner (English by default, Bengali when language is bn) */}
              <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950">
                      {language === 'en' ? '30-Day Moderation Policy' : '৩০ দিনের মডারেশন পলিসি'}
                    </span>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      {language === 'en' ? 'Pending Review' : 'পেন্ডিং কিউ'}
                    </span>
                  </div>
                  <p className="mt-1 text-amber-800 leading-relaxed text-[11px]">
                    {language === 'en'
                      ? 'Submissions will remain pending admin review. If unreviewed after 30 days, they will automatically expire and be removed.'
                      : 'আপনার সাবমিশনটি অ্যাডমিন পর্যালোচনার জন্য পেন্ডিং থাকবে। ৩০ দিনের মধ্যে অনুমোদিত না হলে এটি স্বয়ংক্রিয়ভাবে মুছে যাবে।'}
                  </p>
                </div>
              </div>

              {/* User Account Status Banner */}
              <div className="p-2.5 bg-[#0F3B2E]/5 border border-[#0F3B2E]/20 rounded-xl flex items-center justify-between text-xs text-[#0F3B2E]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#DE9B2E]" />
                  <span className="font-semibold">
                    {language === 'en' ? 'Submitting as:' : 'সাবমিট করছেন:'}{' '}
                    <span className="font-bold">{currentUser?.displayName || currentUser?.email}</span>
                  </span>
                </div>
                {isAdmin && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Admin
                  </span>
                )}
              </div>

              {/* Author Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                    {language === 'en' ? 'Author Name' : 'লেখকের নাম'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={language === 'en' ? 'e.g., Kazi Farhan' : 'যেমন: কাজী ফারহান'}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D8D0BC] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                    {language === 'en' ? 'Account Email' : 'অ্যাকাউন্ট ইমেইল'}
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={currentUser?.email || authorEmail}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 text-neutral-600 border border-[#D8D0BC] rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                  {language === 'en' ? 'Story Cover Photography' : 'কভার ছবি (ImgBB হোস্টিং)'} *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                    previewUrl
                      ? 'border-[#0F3B2E] bg-white'
                      : 'border-[#D8D0BC] bg-white/70 hover:bg-white hover:border-[#0F3B2E]'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp, image/jpg"
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="w-full flex flex-col items-center space-y-2">
                      <img
                        src={previewUrl}
                        alt="Cover Preview"
                        className="max-h-40 rounded-lg object-contain border border-[#D8D0BC]"
                      />
                      <span className="text-xs font-semibold text-[#0F3B2E] hover:underline">
                        {language === 'en' ? 'Change Cover Photo' : 'ছবি পরিবর্তন করুন'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-[#EFECE3] text-[#0F3B2E] flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-[#1B211D]">
                        {language === 'en' ? 'Upload high-res cover image' : 'উচ্চমানের কভার ছবি নির্বাচন করুন'}
                      </p>
                      <p className="text-[10px] text-[#8C7E74]">
                        {language === 'en' ? 'Powered by ImgBB Cloud API' : 'ImgBB ক্লাউড এপিআই দ্বারা হোস্টকৃত'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                    {language === 'en' ? 'Story Title (English)' : 'গল্পের শিরোনাম (ইংরেজি)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Whispers of the Sundarbans Mangroves"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                    {language === 'en' ? 'Story Title (Bengali)' : 'গল্পের শিরোনাম (বাংলা)'}
                  </label>
                  <input
                    type="text"
                    value={titleBn}
                    onChange={(e) => setTitleBn(e.target.value)}
                    placeholder="যেমন: সুন্দরবনের রহস্যময় খাঁড়ির ডাক"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                  />
                </div>
              </div>

              {/* Category, Read Time, Author */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                    {language === 'en' ? 'Category' : 'ক্যাটাগরি'} *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                  >
                    {STORY_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {language === 'en' ? c.nameEn : c.nameBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                    {language === 'en' ? 'Read Duration' : 'পড়ার সময়'}
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="e.g. 5 min read"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                    {language === 'en' ? 'Author Pen Name' : 'লেখকের নাম'}
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={currentUser?.displayName || 'Travel Writer'}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                  {language === 'en' ? 'Short Excerpt / Teaser' : 'সংক্ষিপ্ত সারাংশ / ভূমিকা'} *
                </label>
                <textarea
                  rows={2}
                  required
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'A brief 2-sentence teaser summarizing the core theme...'
                      : 'গল্পের মূল বার্তা জানিয়ে ২-৩ লাইনের সংক্ষেপ...'
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                ></textarea>
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                  {language === 'en' ? 'Story Content (Separate paragraphs with double enter)' : 'মূল প্রবন্ধ ও আখ্যান (প্যারাগ্রাফ আলাদা করতে ডাবল এন্টার চাপুন)'} *
                </label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Write your complete story here. Describe the sights, sounds, local legends, people, and deep experiences...'
                      : 'আপনার বিস্তারিত ভ্রমণ অভিজ্ঞতা, সংস্কৃতি, মানুষ ও প্রকৃতির বর্ণনা এখানে লিখুন...'
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                ></textarea>
              </div>

              {/* Pull Quote */}
              <div>
                <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                  {language === 'en' ? 'Featured Highlight Quote' : 'উদ্ধৃতি / হাইলাইট কোট'}
                </label>
                <input
                  type="text"
                  value={pullQuote}
                  onChange={(e) => setPullQuote(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? '“The silence of the mangroves speaks in rhythm with the tide.”'
                      : '“নদীর শান্ত বুকে ভোরের আলোয় যেন রূপসী বাংলার চিরচেনা রূপ মেলে ধরে।”'
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                />
              </div>

              {/* YouTube Video Documentary */}
              <div>
                <label className="block text-xs font-semibold text-[#4B554E] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-red-600" />
                    <span>{language === 'en' ? 'YouTube Video or Embed Code (Optional)' : 'ইউটিউব ভিডিও বা এম্বেড কোড (ঐচ্ছিক)'}</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={language === 'en' ? 'https://www.youtube.com/watch?v=... or <iframe src="..."></iframe>' : 'https://www.youtube.com/watch?v=... অথবা <iframe...>'}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                />
                <p className="text-[11px] text-[#6B756E] mt-1">
                  {language === 'en'
                    ? 'Paste a YouTube video link or iframe embed code. Visitors will be able to play the full documentary inside the story modal.'
                    : 'ইউটিউব ভিডিও লিংক অথবা আইফ্রেম এম্বেড কোড দিন। পাঠকেরা সরাসরি স্টোরি ভিউতে পূর্ণ প্রামাণ্যচিত্রটি দেখতে পারবেন।'}
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 px-4 rounded-xl bg-[#0F3B2E] hover:bg-[#0A2A21] text-white font-medium text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-70"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#DE9B2E]" />
                      <span>{uploadStage || (language === 'en' ? 'Submitting story...' : 'জমা হচ্ছে...')}</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 text-[#DE9B2E]" />
                      <span>
                        {isAdmin
                          ? language === 'en'
                            ? 'Publish Story to The Chronicle'
                            : 'সরাসরি বেঙ্গল ক্রনিকেলে প্রকাশ করুন'
                          : language === 'en'
                          ? 'Submit Story for Editorial Approval (Pending)'
                          : 'গল্প জমা দিন (পেন্ডিং স্ট্যাটাস)'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
