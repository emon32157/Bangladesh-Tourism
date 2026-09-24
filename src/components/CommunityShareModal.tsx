/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { uploadImageToImgBB } from '../lib/imgbb';
import { db, rtdb, collection, addDoc, push, ref, set } from '../lib/firebase';
import { saveCommunityPostToFirebase } from '../lib/firestoreSync';
import { Language, CommunityPost, AppUser } from '../types';
import { checkIsUserAdmin } from '../lib/userRoles';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Camera,
  Shield,
  Lock,
  Clock,
  User as UserIcon,
  ArrowRight,
  Video,
} from 'lucide-react';

interface CommunityShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  language: Language;
  onPostCreated?: (post: CommunityPost) => void;
  onOpenAuth: () => void;
}

const DIVISIONS = [
  { id: 'chittagong', nameEn: 'Chattogram Division', nameBn: 'চট্টগ্রাম বিভাগ' },
  { id: 'sylhet', nameEn: 'Sylhet Division', nameBn: 'সিলেট বিভাগ' },
  { id: 'dhaka', nameEn: 'Dhaka Division', nameBn: 'ঢাকা বিভাগ' },
  { id: 'khulna', nameEn: 'Khulna & Sundarbans', nameBn: 'খুলনা ও সুন্দরবন' },
  { id: 'rajshahi', nameEn: 'Rajshahi Division', nameBn: 'রাজশাহী বিভাগ' },
  { id: 'barisal', nameEn: 'Barishal Division', nameBn: 'বরিশাল বিভাগ' },
  { id: 'rangpur', nameEn: 'Rangpur Division', nameBn: 'রংপুর বিভাগ' },
  { id: 'mymensingh', nameEn: 'Mymensingh Division', nameBn: 'ময়মনসিংহ বিভাগ' },
];

export const CommunityShareModal: React.FC<CommunityShareModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  language,
  onPostCreated,
  onOpenAuth,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [division, setDivision] = useState('chittagong');
  const [caption, setCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tags, setTags] = useState('');
  const [authorName, setAuthorName] = useState(currentUser?.displayName || '');
  const [authorEmail, setAuthorEmail] = useState(currentUser?.email || '');

  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'pending' | 'approved'>('pending');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const isLoggedInWithEmail = !!currentUser && !currentUser.isAnonymous && !!currentUser.email;
  const isAdmin = checkIsUserAdmin(currentUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedInWithEmail) {
      setErrorMessage(
        language === 'en'
          ? 'Guest accounts cannot submit posts. Please sign in with an email account.'
          : 'গেস্ট একাউন্ট থেকে পোস্ট জমা দেওয়া যাবে না। দয়া করে আপনার ইমেইল আইডি দিয়ে সাইন ইন করুন।'
      );
      return;
    }
    if (!selectedFile) {
      setErrorMessage(language === 'en' ? 'Please select a photo to upload' : 'দয়া করে একটি ছবি নির্বাচন করুন');
      return;
    }
    if (!authorName.trim()) {
      setErrorMessage(language === 'en' ? 'Please provide your name as author' : 'দয়া করে আপনার নাম লিখুন');
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      // Step 1: Uploading to ImgBB API
      setUploadStage(
        language === 'en' ? 'Hosting photo on ImgBB API...' : 'ImgBB API-তে ছবি আপলোড হচ্ছে...'
      );

      const imgbbRes = await uploadImageToImgBB(selectedFile, title || 'Bangladesh Travel Photo');

      if (!imgbbRes.success || !imgbbRes.url) {
        throw new Error(imgbbRes.error || 'Failed to upload photo to ImgBB');
      }

      // Step 2: Saving to Firebase with moderation status
      setUploadStage(
        language === 'en' ? 'Saving submission to database...' : 'ডেটাবেসে পোস্ট সংরক্ষিত হচ্ছে...'
      );

      const now = Date.now();
      const status: 'pending' | 'approved' = isAdmin ? 'approved' : 'pending';
      setSubmissionStatus(status);

      const resolvedAuthor = authorName.trim() || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Traveler';
      const resolvedEmail = currentUser?.email || authorEmail.trim() || undefined;

      const newPost: CommunityPost = {
        id: `post_${now}_${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.uid,
        userName: resolvedAuthor,
        userAvatar: currentUser.photoURL || undefined,
        userEmail: resolvedEmail,
        title: title.trim(),
        caption: caption.trim(),
        location: location.trim(),
        division,
        imageUrl: imgbbRes.displayUrl || imgbbRes.url,
        deleteUrl: imgbbRes.deleteUrl,
        videoUrl: videoUrl.trim() || undefined,
        likesCount: 0,
        likedBy: [],
        createdAt: now,
        status: status,
        approvedAt: isAdmin ? now : undefined,
        approvedBy: isAdmin ? (currentUser.displayName || 'Admin') : undefined,
        expiresAt: isAdmin ? undefined : now + (30 * 24 * 60 * 60 * 1000), // exactly 30 days
        tags: tags
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean),
      };

      // Save directly to Firestore cloud database
      await saveCommunityPostToFirebase(newPost);

      if (onPostCreated) {
        onPostCreated(newPost);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred during upload. Please try again.'
      );
    } finally {
      setUploading(false);
      setUploadStage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-[#FAF8F3] rounded-2xl border border-[#D8D0BC] shadow-2xl overflow-hidden my-6"
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
            <Camera className="w-4 h-4" />
            <span>{language === 'en' ? 'ImgBB API & Firebase Realtime' : 'ImgBB API ও ফায়ারবেস ইন্টিগ্রেশন'}</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">
            {language === 'en' ? 'Share Your Bangladesh Story' : 'আপনার ভ্রমণ অভিজ্ঞতা শেয়ার করুন'}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            {language === 'en'
              ? 'Upload high-resolution photography directly to ImgBB and publish to our national traveler gallery.'
              : 'ImgBB ক্লাউড হোস্টিং এ হাই-রেজোলিউশন ছবি আপলোড করুন ও ট্রাভেলার গ্যালারিতে প্রকাশ করুন।'}
          </p>
        </div>

        {/* Content Body */}
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
                    ? 'Photo Published Successfully!'
                    : 'ছবিটি সফলভাবে প্রকাশিত হয়েছে!'
                  : language === 'en'
                  ? 'Post Submitted for Review (Pending)'
                  : 'পোস্টটি পর্যালোচনার জন্য জমা হয়েছে (Pending)'}
              </h3>
              <p className="text-xs sm:text-sm text-[#4B554E] max-w-md leading-relaxed">
                {submissionStatus === 'approved'
                  ? language === 'en'
                    ? 'Your travel moment has been hosted via ImgBB and published live to the traveler gallery.'
                    : 'আপনার ছবিটি ImgBB এবং ফায়ারবেসে সরাসরি গ্যালারিতে প্রকাশিত হয়েছে।'
                  : language === 'en'
                  ? 'Your post is saved in the review queue. It will be published to the public website after an Administrator approves it from the Admin Panel. (Unreviewed submissions auto-expire in 30 days).'
                  : 'আপনার পোস্টটি সুরক্ষিতভাবে পেন্ডিং তালিকায় সংরক্ষিত হয়েছে। অ্যাডমিন প্যানেল থেকে অনুমোদনের পর এটি ওয়েবসাইটে লাইভ প্রদর্শিত হবে। (৩০ দিনের মধ্যে পর্যালোচিত না হলে এটি স্বয়ংক্রিয়ভাবে মুছে যাবে)।'}
              </p>
              {submissionStatus === 'pending' && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold mt-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>{language === 'en' ? 'Status: Pending Admin Moderation' : 'স্ট্যাটাস: পেন্ডিং (অ্যাডমিন মডারেশন অপেক্ষমাণ)'}</span>
                </div>
              )}
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
                  ? 'Guest accounts cannot submit travel posts. Please sign in with your email account to share photos and contribute to the community.'
                  : 'গেস্ট একাউন্ট থেকে কোনো পোস্ট করা যাবে না। ভ্রমণ পোস্ট ও ছবি শেয়ার করার জন্য অনুগ্রহ করে আপনার ইমেইল আইডি দিয়ে লগইন করুন।'}
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
              {/* 30-Day Moderation Policy Notice Banner (Shown on submit, English by default, Bengali when language is bn) */}
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
                    {language === 'en' ? 'Traveler Name' : 'আপনার নাম'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={language === 'en' ? 'e.g., Tanvir Hasan' : 'যেমন: তানভীর হাসান'}
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

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] ${
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
                      alt="Upload Preview"
                      className="max-h-48 rounded-lg object-contain border border-[#D8D0BC]"
                    />
                    <span className="text-xs font-semibold text-[#0F3B2E] hover:underline">
                      {language === 'en' ? 'Change Photo' : 'ছবি পরিবর্তন করুন'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#EFECE3] text-[#0F3B2E] flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1B211D]">
                        {language === 'en'
                          ? 'Drag & drop or click to upload photo'
                          : 'ছবি ড্র্যাগ করুন অথবা সিলেক্ট করতে ক্লিক করুন'}
                      </p>
                      <p className="text-[11px] text-[#8C7E74] mt-0.5">
                        {language === 'en'
                          ? 'Supported: JPG, PNG, WEBP (Powered by ImgBB API)'
                          : 'সাপোর্টেড: JPG, PNG, WEBP (ImgBB API দ্বারা পরিচালিত)'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                    {language === 'en' ? 'Story / Photo Title' : 'ছবির শিরোনাম'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={language === 'en' ? 'e.g. Sunset over Inani Beach' : 'যেমন: ইনানী বিচে সূর্যাস্ত'}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                    {language === 'en' ? 'Division' : 'বিভাগ'} *
                  </label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {language === 'en' ? d.nameEn : d.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                    {language === 'en' ? 'Exact Location / Spot' : 'স্থান / লোকেশন'} *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-[#8C7E74]" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={language === 'en' ? 'e.g. Cox’s Bazar, Chittagong' : 'যেমন: কক্সবাজার, চট্টগ্রাম'}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                    {language === 'en' ? 'Traveler Name' : 'ভ্রমণকারীর নাম'}
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={currentUser?.displayName || (language === 'en' ? 'Anonymous Explorer' : 'ভ্রমণপিপাসু')}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                  {language === 'en' ? 'Story & Traveler Notes' : 'ভ্রমণ অভিজ্ঞতা ও ক্যাপশন'}
                </label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Describe your journey, best time to visit, and insider travel tips...'
                      : 'আপনার ভ্রমণ অনুভূতি, যাওয়ার উপযুক্ত সময় ও প্রয়োজনীয় পরামর্শ লিখুন...'
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                ></textarea>
              </div>

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
                    ? 'Paste a YouTube video link or iframe embed code. Visitors can play the video directly inside the post.'
                    : 'ইউটিউব ভিডিওর লিংক অথবা আইফ্রেম কোড দিন। ব্যবহারকারীরা সরাসরি পোস্টে ভিডিওটি দেখতে পারবেন।'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                  {language === 'en' ? 'Tags (comma separated)' : 'ট্যাগসমূহ (কমা দিয়ে লিখুন)'}
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={language === 'en' ? 'Beach, Photography, Sunset, CoxsBazar' : 'সমুদ্র, ফটোগ্রাফি, সূর্যাস্ত'}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                />
              </div>

              {/* Submit Button & Progress */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 px-4 rounded-xl bg-[#0F3B2E] hover:bg-[#0A2A21] text-white font-medium text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-70"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#DE9B2E]" />
                      <span>{uploadStage || (language === 'en' ? 'Uploading...' : 'আপলোড হচ্ছে...')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#DE9B2E]" />
                      <span>
                        {isAdmin
                          ? language === 'en'
                            ? 'Upload & Publish to Gallery'
                            : 'ImgBB আপলোড ও সরাসরি প্রকাশ করুন'
                          : language === 'en'
                          ? 'Submit Post for Admin Review (Pending)'
                          : 'পোস্ট জমা দিন (পেন্ডিং স্ট্যাটাস)'}
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
