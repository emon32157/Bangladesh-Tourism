/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  signOut,
  updateProfile,
} from '../lib/firebase';
import { Language, AppUser } from '../types';
import { checkIsUserAdmin, updateUserProfilePhoto, cacheUserLocally } from '../lib/userRoles';
import { uploadImageToImgBB } from '../lib/imgbb';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Shield,
  Camera,
  PenTool,
  Loader2,
  Upload,
  Bookmark,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  language: Language;
  savedCount: number;
  onSetGuestUser?: (user: AppUser) => void;
  onSignOutGuest?: () => void;
  onOpenAdmin?: () => void;
  onOpenUploadModal?: () => void;
  onOpenStoryModal?: () => void;
  onOpenSavedModal?: () => void;
  onUpdateCurrentUser?: (user: AppUser) => void;
}

const getFirebaseErrorMessage = (error: unknown, language: Language): string => {
  if (!error) return '';
  const errCode = (error as { code?: string })?.code || '';
  const errMessage = error instanceof Error ? error.message : String(error);

  if (errCode === 'auth/admin-restricted-operation' || errCode === 'auth/operation-not-allowed') {
    return language === 'en'
      ? 'Anonymous auth is disabled on this Firebase project. Guest mode has been activated locally.'
      : 'ফায়ারবেস প্রকল্পে অ্যানোনিমাস অথ নিষ্ক্রিয় রয়েছে। লোকাল গেস্ট মোড সক্রিয় করা হয়েছে।';
  }
  if (errCode === 'auth/email-already-in-use') {
    return language === 'en'
      ? 'This email is already registered. Please sign in instead.'
      : 'এই ইমেইলটি আগে থেকেই রেজিস্টার্ড। দয়া করে সাইন ইন করুন।';
  }
  if (errCode === 'auth/user-not-found' || errCode === 'auth/wrong-password' || errCode === 'auth/invalid-credential') {
    return language === 'en' ? 'Invalid email or password.' : 'ভুল ইমেইল অথবা পাসওয়ার্ড।';
  }
  if (errCode === 'auth/weak-password') {
    return language === 'en'
      ? 'Password should be at least 6 characters.'
      : 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
  }
  if (errCode === 'auth/invalid-email') {
    return language === 'en' ? 'Please enter a valid email address.' : 'সঠিক ইমেইল অ্যাড্রেস লিখুন।';
  }
  if (errCode === 'auth/network-request-failed') {
    return language === 'en' ? 'Network error. Please check your connection.' : 'নেটওয়ার্ক এরর। ইন্টারনেট সংযোগ চেক করুন।';
  }
  return errMessage;
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  language,
  savedCount,
  onSetGuestUser,
  onSignOutGuest,
  onOpenAdmin,
  onOpenUploadModal,
  onOpenStoryModal,
  onOpenSavedModal,
  onUpdateCurrentUser,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isUserAdmin = checkIsUserAdmin(currentUser);

  if (!isOpen) return null;

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage(
        language === 'en'
          ? 'Please enter your registered email address.'
          : 'আপনার নিবন্ধিত ইমেইল অ্যাড্রেস লিখুন।'
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetEmailSent(true);
      setSuccessMessage(
        language === 'en'
          ? 'Password reset link sent to your email! Please check your inbox and spam folder.'
          : 'পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে! অনুগ্রহ করে ইনবক্স ও স্প্যাম ফোল্ডার চেক করুন।'
      );
    } catch (err: unknown) {
      console.error('Password Reset Error:', err);
      const msg = getFirebaseErrorMessage(err, language);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUser) return;
    const file = e.target.files[0];

    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage(
        language === 'en'
          ? 'Profile image must be under 12MB.'
          : 'প্রোফাইল ছবির সাইজ ১২ মেগাবাইটের কম হতে হবে।'
      );
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const uploadRes = await uploadImageToImgBB(
        file,
        `${currentUser.displayName || 'Traveler'} Profile Picture`
      );

      if (uploadRes.success && uploadRes.url) {
        const newPhotoUrl = uploadRes.displayUrl || uploadRes.url;

        // 1. Update Firebase Auth user profile if logged in with Firebase
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            photoURL: newPhotoUrl,
          }).catch((err) => {
            console.warn('Firebase Auth photoURL update warning:', err);
          });
        }

        // 2. Update Firestore and local user cache
        await updateUserProfilePhoto(currentUser.uid, newPhotoUrl);

        // 3. Update active user object
        const updatedUser: AppUser = {
          ...currentUser,
          photoURL: newPhotoUrl,
        };

        cacheUserLocally(updatedUser);

        if (currentUser.isAnonymous) {
          try {
            localStorage.setItem('discover_bd_guest_user', JSON.stringify(updatedUser));
          } catch {
            // ignore
          }
        }

        if (onUpdateCurrentUser) {
          onUpdateCurrentUser(updatedUser);
        }

        setSuccessMessage(
          language === 'en'
            ? 'Profile picture updated successfully!'
            : 'প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে!'
        );
      } else {
        setErrorMessage(
          uploadRes.error ||
            (language === 'en' ? 'Failed to upload image. Please try again.' : 'ছবি আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
        );
      }
    } catch (err: unknown) {
      console.error('Avatar upload error:', err);
      setErrorMessage(
        language === 'en'
          ? 'An error occurred while uploading profile picture.'
          : 'প্রোফাইল ছবি আপলোডের সময় ত্রুটি ঘটেছে।'
      );
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isRegisterMode) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName && res.user) {
          await updateProfile(res.user, { displayName });
        }
        setSuccessMessage(
          language === 'en' ? 'Account created successfully!' : 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!'
        );
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMessage(language === 'en' ? 'Welcome back!' : 'স্বাগতম!');
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error('Email Auth Error:', err);
      const msg = getFirebaseErrorMessage(err, language);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await signInAnonymously(auth);
      setSuccessMessage(language === 'en' ? 'Signed in as Explorer!' : 'গেস্ট হিসেবে সাইন ইন সম্পন্ন!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.warn('Firebase anonymous auth fallback to local guest session:', err);
      const guestUser: AppUser = {
        uid: 'guest_' + Math.random().toString(36).substring(2, 9),
        displayName: language === 'en' ? 'Guest Traveler' : 'গেস্ট ভ্রমণকারী',
        email: null,
        photoURL: null,
        isAnonymous: true,
      };
      if (onSetGuestUser) {
        onSetGuestUser(guestUser);
      }
      setSuccessMessage(
        language === 'en'
          ? 'Guest Explorer session activated!'
          : 'গেস্ট এক্সপ্লোরার সেশন সক্রিয় হয়েছে!'
      );
      setTimeout(() => {
        onClose();
      }, 900);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      if (onSignOutGuest) {
        onSignOutGuest();
      }
      setSuccessMessage(language === 'en' ? 'Signed out successfully' : 'সাইন আউট হয়েছে');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: unknown) {
      console.error('Sign Out Error:', err);
      setErrorMessage(getFirebaseErrorMessage(err, language));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-md bg-[#FAF8F3] rounded-2xl border border-[#D8D0BC] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-[#0F3B2E] text-white p-6 relative">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-[#DE9B2E] text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isForgotPasswordMode
                ? (language === 'en' ? 'Password Recovery' : 'পাসওয়ার্ড উদ্ধার')
                : (language === 'en' ? 'Firebase Cloud Account' : 'ফায়ারবেস ক্লাউড অ্যাকাউন্ট')}
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">
            {currentUser
              ? language === 'en'
                ? 'Traveler Profile'
                : 'ভ্রমণকারী প্রোফাইল'
              : isForgotPasswordMode
              ? language === 'en'
                ? 'Reset Password'
                : 'পাসওয়ার্ড রিসেট করুন'
              : isRegisterMode
              ? language === 'en'
                ? 'Create Your Account'
                : 'নতুন অ্যাকাউন্ট তৈরি করুন'
              : language === 'en'
              ? 'Sign in to Bangladesh'
              : 'লগইন করুন'}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            {isForgotPasswordMode
              ? language === 'en'
                ? 'Enter your registered email address to receive a secure password reset link.'
                : 'আপনার নিবন্ধিত ইমেইলে পাসওয়ার্ড রিসেটের নিরাপদ লিঙ্ক পেতে ইমেইল লিখুন।'
              : language === 'en'
              ? 'Sync your bookmarks, custom trip itineraries, and photo stories in real-time.'
              : 'আপনার বুকমার্ক, কাস্টম ট্রিপ প্ল্যান এবং ভ্রমণ ছবি রিয়েল-টাইমে সেভ রাখুন।'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {currentUser ? (
            /* Logged In View */
            <div className="space-y-4">
              {/* User Profile Card with Avatar Upload */}
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-white border border-[#D8D0BC]/80 shadow-2xs">
                {/* Avatar with Upload Capability */}
                <div className="relative group shrink-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-16 h-16 rounded-full border-2 border-[#DE9B2E] object-cover shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#0F3B2E] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-xs">
                      {currentUser.displayName
                        ? currentUser.displayName.charAt(0).toUpperCase()
                        : currentUser.email
                        ? currentUser.email.charAt(0).toUpperCase()
                        : 'E'}
                    </div>
                  )}

                  {/* Uploading Overlay */}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin text-[#DE9B2E]" />
                    </div>
                  )}

                  {/* Camera Upload Badge Button */}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#DE9B2E] text-[#0A2A21] hover:bg-[#E5AA45] shadow-md transition-all cursor-pointer hover:scale-110 active:scale-95 disabled:opacity-50"
                    title={
                      language === 'en'
                        ? 'Upload new profile photo'
                        : 'নতুন প্রোফাইল ছবি আপলোড করুন'
                    }
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[#1B211D] text-base truncate">
                      {currentUser.displayName || (currentUser.isAnonymous ? (language === 'en' ? 'Guest Traveler' : 'গেস্ট ভ্রমণকারী') : 'Explorer')}
                    </h3>
                    {isUserAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F3B2E] text-[#DE9B2E] border border-[#DE9B2E]/40 shadow-2xs">
                        <ShieldCheck className="w-3 h-3 text-[#DE9B2E]" />
                        <span>{language === 'en' ? 'Admin' : 'অ্যাডমিন'}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B756E] break-all">
                    {currentUser.email || (currentUser.isAnonymous ? 'Guest session' : 'Firebase Authenticated')}
                  </p>
                  
                  {/* Avatar Upload CTA Text Button */}
                  <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F3B2E] hover:text-[#DE9B2E] transition-colors cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>
                        {isUploadingAvatar
                          ? (language === 'en' ? 'Uploading...' : 'আপলোড হচ্ছে...')
                          : currentUser.photoURL
                          ? (language === 'en' ? 'Change Photo' : 'ছবি পরিবর্তন')
                          : (language === 'en' ? 'Upload Photo' : 'ছবি আপলোড')}
                      </span>
                    </button>
                    <span className="text-gray-300">•</span>
                    <span className="text-[11px] text-[#6B756E]">
                      {savedCount} {language === 'en' ? 'saved places' : 'সংরক্ষিত স্থান'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Traveler Submission & Community Contribution Actions */}
              <div className="p-3.5 bg-[#FAF7F0] border border-[#E2DCce] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B756E]">
                    {language === 'en' ? 'Traveler Submissions' : 'ভ্রমণকারী কার্যকলাপ'}
                  </span>
                  <span className="text-[10px] font-bold text-[#0F3B2E] bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    {language === 'en' ? 'Create & Share' : 'তৈরি ও শেয়ার'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Wishlist Button */}
                  <button
                    type="button"
                    id="profile-wishlist-btn"
                    onClick={() => {
                      onClose();
                      if (onOpenSavedModal) onOpenSavedModal();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-[#D8D0BC] hover:border-[#DE9B2E] hover:bg-amber-50/50 hover:shadow-xs transition-all text-left cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#DE9B2E] flex items-center justify-center shrink-0 group-hover:bg-[#DE9B2E] group-hover:text-[#0A2A21] transition-colors">
                      <Bookmark className="w-4 h-4 fill-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#0A2A21] group-hover:text-[#8C3B2E] transition-colors flex items-center justify-between">
                        <span className="truncate">{language === 'en' ? 'Wishlist' : 'উইশলিস্ট'}</span>
                        <span className="ml-1 px-1.5 py-0.2 bg-[#8C3B2E] text-white text-[10px] font-bold rounded-full">
                          {savedCount}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6B756E] truncate">
                        {language === 'en' ? 'Saved Places' : 'সংরক্ষিত স্থান'}
                      </div>
                    </div>
                  </button>

                  {/* Share Photo Post Button */}
                  <button
                    type="button"
                    id="profile-share-photo-btn"
                    onClick={() => {
                      onClose();
                      if (onOpenUploadModal) onOpenUploadModal();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-[#D8D0BC] hover:border-amber-500 hover:bg-amber-50/50 hover:shadow-xs transition-all text-left cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#0A2A21] group-hover:text-amber-800 transition-colors truncate">
                        {language === 'en' ? 'Share Photo Post' : 'ভ্রমণ পোস্ট / ছবি'}
                      </div>
                      <div className="text-[10px] text-[#6B756E] truncate">
                        {language === 'en' ? 'Post photo & experience' : 'ছবি ও ক্যাপশন পোস্ট'}
                      </div>
                    </div>
                  </button>

                  {/* Write Story Button */}
                  <button
                    type="button"
                    id="profile-write-story-btn"
                    onClick={() => {
                      onClose();
                      if (onOpenStoryModal) onOpenStoryModal();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-[#D8D0BC] hover:border-emerald-600 hover:bg-emerald-50/50 hover:shadow-xs transition-all text-left cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#0A2A21] group-hover:text-emerald-800 transition-colors truncate">
                        {language === 'en' ? 'Write Story' : 'ভ্রমণ আখ্যান লিখুন'}
                      </div>
                      <div className="text-[10px] text-[#6B756E] truncate">
                        {language === 'en' ? 'Write travel essay' : 'ভ্রমণ নিবন্ধ ও গল্প লিখুন'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Admin Launch CTA if user has Admin role */}
              {isUserAdmin && onOpenAdmin && (
                <div className="p-3.5 bg-[#0F3B2E] rounded-xl text-white space-y-2 border border-[#DE9B2E]/50 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#DE9B2E]" />
                      <span className="font-bold text-xs text-[#DE9B2E] tracking-wide uppercase">
                        {language === 'en' ? 'Verified Admin Account' : 'ফায়ারবেস অনুমোদিত অ্যাডমিন'}
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      RBAC Active
                    </span>
                  </div>
                  <p className="text-xs text-white/85">
                    {language === 'en'
                      ? 'You have administrative permissions to manage destinations, stories, events, and user roles.'
                      : 'আপনার অ্যাকাউন্টে গন্তব্য, প্রবন্ধ, উৎসব এবং ইউজার রোল পরিচালনা করার অনুমতি রয়েছে।'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    className="w-full mt-1 py-2.5 px-4 rounded-lg bg-[#DE9B2E] hover:bg-[#E5AA45] text-[#0A2A21] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#0A2A21]" />
                    <span>{language === 'en' ? 'Open Admin Control Panel' : 'অ্যাডমিন কন্ট্রোল প্যানেল খুলুন'}</span>
                  </button>
                </div>
              )}

              <div className="p-3 bg-[#EFECE3] rounded-xl text-xs text-[#4B554E] space-y-1">
                <p className="font-semibold text-[#1B211D]">
                  {language === 'en' ? 'Firebase Realtime Connected' : 'ফায়ারবেস কানেকশন সক্রিয়'}
                </p>
                <p>
                  {language === 'en'
                    ? 'Your custom travel plans and shared photos are instantly synced across all devices.'
                    : 'আপনার ট্রিপ প্ল্যান ও আপলোড করা ছবি ক্লাউডে রিয়েল-টাইমে সংরক্ষিত আছে।'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm transition-colors flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{language === 'en' ? 'Sign Out' : 'সাইন আউট করুন'}</span>
              </button>
            </div>
          ) : (
            /* Authentication Forms */
            <div className="space-y-4">
              {isForgotPasswordMode ? (
                /* Password Reset Flow */
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                      {language === 'en' ? 'Your Registered Email Address' : 'নিবন্ধিত ইমেইল অ্যাড্রেস'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-[#8C7E74]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="traveler@example.com"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E] focus:ring-1 focus:ring-[#0F3B2E]"
                      />
                    </div>
                    <p className="text-[11px] text-[#6B756E] mt-1.5 leading-relaxed">
                      {language === 'en'
                        ? 'We will send a password reset link to your email. Click that link to create a new password.'
                        : 'আমরা আপনার ইমেইলে একটি পাসওয়ার্ড রিসেট লিঙ্ক পাঠাবো। সেই লিঙ্কে ক্লিক করে নতুন পাসওয়ার্ড নির্ধারণ করতে পারবেন।'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0F3B2E] hover:bg-[#0A2A21] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 text-[#DE9B2E] animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4 text-[#DE9B2E]" />
                    )}
                    <span>
                      {loading
                        ? (language === 'en' ? 'Sending link...' : 'লিঙ্ক পাঠানো হচ্ছে...')
                        : (language === 'en' ? 'Send Password Reset Link' : 'পাসওয়ার্ড রিসেট লিঙ্ক পাঠান')}
                    </span>
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(false);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-[#0F3B2E] font-semibold hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Back to Sign In' : 'সাইন ইন-এ ফিরে যান'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Email/Password Form (Login & Register) */
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {isRegisterMode && (
                    <div>
                      <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                        {language === 'en' ? 'Full Name' : 'পূর্ণ নাম'}
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 absolute left-3 top-3 text-[#8C7E74]" />
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={language === 'en' ? 'e.g. Tanvir Ahmed' : 'যেমন: তানভীর আহমেদ'}
                          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E] focus:ring-1 focus:ring-[#0F3B2E]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#4B554E] mb-1">
                      {language === 'en' ? 'Email Address' : 'ইমেইল অ্যাড্রেস'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-[#8C7E74]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="traveler@example.com"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E] focus:ring-1 focus:ring-[#0F3B2E]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#4B554E]">
                        {language === 'en' ? 'Password' : 'পাসওয়ার্ড'}
                      </label>
                      {!isRegisterMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPasswordMode(true);
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          className="text-xs text-[#8C3B2E] hover:underline font-semibold cursor-pointer"
                        >
                          {language === 'en' ? 'Forgot Password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-[#8C7E74]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E] focus:ring-1 focus:ring-[#0F3B2E]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-2.5 text-[#8C7E74] hover:text-[#0A2A21] p-0.5 focus:outline-none cursor-pointer transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0F3B2E] hover:bg-[#0A2A21] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#DE9B2E]" />
                    <span>
                      {isRegisterMode
                        ? language === 'en'
                          ? 'Create Account'
                          : 'অ্যাকাউন্ট তৈরি করুন'
                        : language === 'en'
                        ? 'Sign In'
                        : 'সাইন ইন করুন'}
                    </span>
                  </button>

                  {isRegisterMode && (
                    <p className="text-[11px] text-[#6B756E] text-center px-2 leading-relaxed">
                      {language === 'en'
                        ? '🔒 Member accounts are registered here. Admin roles cannot be registered and are authorized strictly via Firebase.'
                        : '🔒 এখান থেকে সাধারণ ট্রাভেলার একাউন্ট তৈরি হয়। এডমিন একাউন্ট তৈরি করা যায় না, এডমিন রোল শুধুমাত্র ফায়ারবেস থেকে অনুমোদিত থাকে।'}
                    </p>
                  )}
                </form>
              )}

              {/* Guest & Toggle Actions (Only when not in forgot password mode) */}
              {!isForgotPasswordMode && (
                <div className="pt-2 flex flex-col space-y-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-[#0F3B2E] font-semibold hover:underline cursor-pointer"
                  >
                    {isRegisterMode
                      ? language === 'en'
                        ? 'Already have an account? Sign in'
                        : 'ইতিমধ্যে অ্যাকাউন্ট আছে? সাইন ইন করুন'
                      : language === 'en'
                      ? "Don't have an account? Create one"
                      : 'নতুন অ্যাকাউন্ট তৈরি করতে ক্লিক করুন'}
                  </button>

                  <button
                    type="button"
                    onClick={handleAnonymousSignIn}
                    disabled={loading}
                    className="text-xs text-[#6B756E] hover:text-[#1B211D] underline pt-1 cursor-pointer"
                  >
                    {language === 'en' ? 'Continue as Guest Traveler' : 'গেস্ট হিসেবে চালিয়ে যান'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
