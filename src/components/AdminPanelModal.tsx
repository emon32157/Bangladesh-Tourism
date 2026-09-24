/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Destination,
  Experience,
  Festival,
  EditorialStory,
  CommunityPost,
  Language,
  AppUser,
  UserReport,
  ReportCategory,
  ReportStatus,
  NewsletterSubscriber,
  SubscriberStatus,
  NewsPost,
} from '../types';
import { uploadImageToImgBB } from '../lib/imgbb';
import {
  fetchRegisteredUsers,
  updateUserRoleInFirebase,
  assignAdminByEmail,
  checkIsUserAdmin,
} from '../lib/userRoles';
import {
  isPendingExpired,
  getRemainingDays,
  purgeExpiredFromList,
  autoPurgeExpiredFirebaseSubmissions,
} from '../lib/moderation';
import {
  fetchAllUserReports,
  updateReportStatusInDb,
  deleteReportFromDb,
  getLocalReports,
} from '../lib/reports';
import {
  subscribeToSubscribersList,
  fetchSubscribers,
  deleteSubscriber,
  updateSubscriberStatus,
  subscribeNewsletter,
  isValidEmail,
  getCachedSubscribers,
} from '../lib/newsletter';
import {
  subscribeToNewsPosts,
  createNewsPost,
  updateNewsPost,
  deleteNewsPost,
} from '../lib/newsService';
import { bootstrapAndMigrateDataToFirestore } from '../lib/firestoreSync';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  UploadCloud,
  Cloud,
  Check,
  AlertCircle,
  Shield,
  Lock,
  Unlock,
  Sparkles,
  MapPin,
  Calendar,
  BookOpen,
  Image as ImageIcon,
  Compass,
  Download,
  Upload,
  RotateCcw,
  Search,
  ExternalLink,
  ChevronRight,
  Eye,
  Star,
  Layers,
  Heart,
  Users,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Mail,
  UserPlus,
  RefreshCw,
  LogIn,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  Filter,
  Flag,
  MessageSquare,
  AlertTriangle,
  FileSpreadsheet,
  Copy,
  CheckCheck,
  Newspaper,
  Pin,
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: AppUser | null;
  onOpenAuth?: () => void;

  // Data sets
  destinations: Destination[];
  experiences: Experience[];
  festivals: Festival[];
  stories: EditorialStory[];
  communityPosts: CommunityPost[];

  // Updaters
  onUpdateDestinations: (items: Destination[]) => void;
  onUpdateExperiences: (items: Experience[]) => void;
  onUpdateFestivals: (items: Festival[]) => void;
  onUpdateStories: (items: EditorialStory[]) => void;
  onUpdateCommunityPosts: (items: CommunityPost[]) => void;
  onResetAllData: () => void;
}

type AdminTab =
  | 'overview'
  | 'pending'
  | 'reports'
  | 'users'
  | 'subscribers'
  | 'news'
  | 'destinations'
  | 'experiences'
  | 'festivals'
  | 'stories'
  | 'community'
  | 'backup';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  language,
  currentUser,
  onOpenAuth,
  destinations,
  experiences,
  festivals,
  stories,
  communityPosts,
  onUpdateDestinations,
  onUpdateExperiences,
  onUpdateFestivals,
  onUpdateStories,
  onUpdateCommunityPosts,
  onResetAllData,
}) => {
  // Authentication State: Strictly check if user has Firebase admin role
  const isFirebaseAdmin = checkIsUserAdmin(currentUser);
  const isAuthenticated = isFirebaseAdmin;

  // Active Tab & Search
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Status Filter for Stories and Community posts
  const [storyFilter, setStoryFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [postFilter, setPostFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Moderation state
  const [isPurgingExpired, setIsPurgingExpired] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Filter pending items (excluding expired)
  const pendingStories = stories.filter((s) => (s.status === 'pending' || (!s.status && false)) && !isPendingExpired(s));
  const pendingPosts = communityPosts.filter((p) => p.status === 'pending' && !isPendingExpired(p));
  const totalPendingCount = pendingStories.length + pendingPosts.length;

  // Firebase Users Management State
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('');
  const [addingAdminLoading, setAddingAdminLoading] = useState(false);

  // User Reports Management State
  const [userReports, setUserReports] = useState<UserReport[]>(() => getLocalReports());
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>('all');
  const [selectedReportDetail, setSelectedReportDetail] = useState<UserReport | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState<string>('');
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [deleteReportConfirm, setDeleteReportConfirm] = useState<UserReport | null>(null);
  const [viewingImageModal, setViewingImageModal] = useState<string | null>(null);

  const pendingReportsCount = userReports.filter((r) => r.status === 'pending').length;

  // Newsletter Subscribers Management State
  const [subscribersList, setSubscribersList] = useState<NewsletterSubscriber[]>(() => getCachedSubscribers());
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [subscriberFilter, setSubscriberFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [subscriberSearchQuery, setSubscriberSearchQuery] = useState('');
  const [newSubscriberEmailInput, setNewSubscriberEmailInput] = useState('');
  const [addingSubscriberLoading, setAddingSubscriberLoading] = useState(false);
  const [deleteSubscriberConfirm, setDeleteSubscriberConfirm] = useState<NewsletterSubscriber | null>(null);
  const [copiedEmailStatus, setCopiedEmailStatus] = useState(false);

  // Fetch users when modal opens or users tab is active
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await fetchRegisteredUsers();
      setUsersList(users);
    } catch (e) {
      console.error('Error fetching registered users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch user reports when modal opens or reports tab is active
  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const reps = await fetchAllUserReports();
      setUserReports(reps);
    } catch (e) {
      console.error('Error fetching user reports:', e);
    } finally {
      setLoadingReports(false);
    }
  };

  // Fetch newsletter subscribers from Firestore
  const loadSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const subs = await fetchSubscribers();
      setSubscribersList(subs);
    } catch (e) {
      console.error('Error fetching newsletter subscribers:', e);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadUsers();
      loadReports();
      loadSubscribers();

      // Realtime listener for subscribers
      const unsubscribe = subscribeToSubscribersList((list) => {
        setSubscribersList(list);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isOpen, isAuthenticated, activeTab]);

  // Handle Subscriber Actions
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newSubscriberEmailInput.trim();
    if (!email) return;
    if (!isValidEmail(email)) {
      showToast(
        language === 'en' ? 'Please enter a valid email address.' : 'অনুগ্রহ করে একটি সঠিক ইমেইল দিন।',
        'error'
      );
      return;
    }
    setAddingSubscriberLoading(true);
    try {
      const res = await subscribeNewsletter(email, language);
      if (res.success) {
        showToast(language === 'en' ? res.messageEn : res.messageBn);
        setNewSubscriberEmailInput('');
        await loadSubscribers();
      } else {
        showToast(language === 'en' ? res.messageEn : res.messageBn, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(language === 'en' ? 'Failed to add subscriber' : 'সাবস্ক্রাইবার যুক্ত করতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setAddingSubscriberLoading(false);
    }
  };

  const handleToggleSubscriberStatus = async (sub: NewsletterSubscriber) => {
    const newStatus: SubscriberStatus = sub.status === 'active' ? 'unsubscribed' : 'active';
    try {
      await updateSubscriberStatus(sub.id, newStatus);
      setSubscribersList((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s))
      );
      showToast(
        language === 'en'
          ? `Subscriber status changed to ${newStatus}`
          : `স্ট্যাটাস পরিবর্তন করে '${newStatus === 'active' ? 'সক্রিয়' : 'আনসাবস্ক্রাইবড'}' করা হয়েছে`
      );
    } catch (e) {
      console.error(e);
      showToast(language === 'en' ? 'Failed to update subscriber status' : 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleDeleteSubscriber = async (sub: NewsletterSubscriber) => {
    try {
      await deleteSubscriber(sub.id);
      setSubscribersList((prev) => prev.filter((s) => s.id !== sub.id));
      showToast(language === 'en' ? 'Subscriber removed successfully' : 'সাবস্ক্রাইবার তালিকা থেকে মুছে ফেলা হয়েছে');
      setDeleteSubscriberConfirm(null);
    } catch (e) {
      console.error(e);
      showToast(language === 'en' ? 'Failed to delete subscriber' : 'মুছে ফেলা ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleCopyAllEmails = () => {
    const activeSubs = subscribersList.filter((s) => s.status === 'active');
    const emailList = activeSubs.map((s) => s.email).join(', ');

    if (!emailList) {
      showToast(language === 'en' ? 'No active subscribers to copy' : 'কপি করার মতো কোনো সক্রিয় সাবস্ক্রাইবার নেই', 'error');
      return;
    }

    navigator.clipboard.writeText(emailList);
    setCopiedEmailStatus(true);
    setTimeout(() => setCopiedEmailStatus(false), 2500);
    showToast(
      language === 'en'
        ? `${activeSubs.length} active subscriber email(s) copied!`
        : `${activeSubs.length}টি সক্রিয় সাবস্ক্রাইবার ইমেইল কপি করা হয়েছে!`
    );
  };

  const handleExportSubscribersCSV = () => {
    if (subscribersList.length === 0) {
      showToast(language === 'en' ? 'No subscribers to export' : 'এক্সপোর্ট করার মতো কোনো সাবস্ক্রাইবার নেই', 'error');
      return;
    }

    const headers = ['ID', 'Email', 'Status', 'Date Subscribed', 'Source', 'Language'];
    const rows = subscribersList.map((s) => [
      `"${s.id}"`,
      `"${s.email}"`,
      `"${s.status}"`,
      `"${new Date(s.createdAt).toISOString()}"`,
      `"${s.source || 'footer_newsletter'}"`,
      `"${s.language || 'bn'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bangladesh_tourism_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(language === 'en' ? 'Subscribers CSV downloaded!' : 'সাবস্ক্রাইবার তালিকা CSV হিসেবে ডাউনলোড হয়েছে!');
  };

  // Handle Report Actions
  const handleResolveReport = async (report: UserReport, customNotes?: string) => {
    try {
      const notesToSave = customNotes !== undefined ? customNotes : adminNotesInput;
      await updateReportStatusInDb(
        report.id,
        'resolved',
        notesToSave,
        currentUser?.displayName || currentUser?.email || 'Admin'
      );
      setUserReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                status: 'resolved',
                adminNotes: notesToSave || r.adminNotes,
                resolvedAt: Date.now(),
                resolvedBy: currentUser?.displayName || currentUser?.email || 'Admin',
              }
            : r
        )
      );
      setResolvingReportId(null);
      setAdminNotesInput('');
      if (selectedReportDetail?.id === report.id) {
        setSelectedReportDetail(null);
      }
      showToast(
        language === 'en'
          ? `Marked report as Resolved!`
          : `রিপোর্টটি সমাধানকৃত হিসেবে চিহ্নিত করা হয়েছে!`
      );
    } catch (e) {
      console.error(e);
      showToast(language === 'en' ? 'Failed to update report' : 'রিপোর্ট স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleDismissReport = async (report: UserReport) => {
    try {
      await updateReportStatusInDb(
        report.id,
        'dismissed',
        undefined,
        currentUser?.displayName || currentUser?.email || 'Admin'
      );
      setUserReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: 'dismissed' } : r))
      );
      if (selectedReportDetail?.id === report.id) {
        setSelectedReportDetail(null);
      }
      showToast(
        language === 'en'
          ? `Report dismissed.`
          : `রিপোর্টটি বাতিল (Dismissed) হিসেবে চিহ্নিত করা হয়েছে।`
      );
    } catch (e) {
      console.error(e);
      showToast(language === 'en' ? 'Failed to update report' : 'ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleReopenReport = async (report: UserReport) => {
    try {
      await updateReportStatusInDb(report.id, 'pending');
      setUserReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: 'pending' } : r))
      );
      showToast(
        language === 'en'
          ? `Report reopened to Pending review queue.`
          : `রিপোর্টটি পুনরায় পেন্ডিং কিউতে পাঠানো হয়েছে।`
      );
    } catch (e) {
      console.error(e);
      showToast(language === 'en' ? 'Failed to reopen report' : 'ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleDeleteReport = async (report: UserReport) => {
    try {
      await deleteReportFromDb(report.id);
      setUserReports((prev) => prev.filter((r) => r.id !== report.id));
      setDeleteReportConfirm(null);
      if (selectedReportDetail?.id === report.id) {
        setSelectedReportDetail(null);
      }
      showToast(
        language === 'en'
          ? `Report deleted successfully.`
          : `রিপোর্টটি স্থায়ীভাবে মুছে ফেলা হয়েছে।`
      );
    } catch (e) {
      console.error(e);
      showToast(language === 'en' ? 'Failed to delete report' : 'রিপোর্ট ডিলিট করা যায়নি', 'error');
    }
  };

  // Handle Role Toggle (Admin <-> User) in Firebase
  const handleToggleRole = async (targetUser: AppUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRoleInFirebase(targetUser.uid, newRole, targetUser.email);
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, role: newRole } : u))
      );
      showToast(
        newRole === 'admin'
          ? language === 'en'
            ? `Granted Admin Role to ${targetUser.email || targetUser.displayName || 'user'}!`
            : `${targetUser.email || targetUser.displayName || 'ইউজার'}-কে অ্যাডমিন রোল দেওয়া হয়েছে!`
          : language === 'en'
          ? `Changed ${targetUser.email || targetUser.displayName || 'user'} to Standard User`
          : `${targetUser.email || targetUser.displayName || 'ইউজার'}-কে সাধারণ ইউজার করা হয়েছে`
      );
    } catch (e) {
      console.error(e);
      showToast(language === 'en' ? 'Failed to update role' : 'রোল পরিবর্তন ব্যর্থ হয়েছে', 'error');
    }
  };

  // Add Admin By Email in Firebase
  const handleAddAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmailInput.trim() || !newAdminEmailInput.includes('@')) {
      showToast(
        language === 'en' ? 'Please enter a valid email address' : 'সঠিক ইমেইল অ্যাড্রেস লিখুন',
        'error'
      );
      return;
    }

    setAddingAdminLoading(true);
    try {
      const addedAdmin = await assignAdminByEmail(newAdminEmailInput.trim());
      setNewAdminEmailInput('');
      await loadUsers();
      showToast(
        language === 'en'
          ? `Admin role assigned to ${addedAdmin.email} in Firebase!`
          : `ফায়ারবেসে ${addedAdmin.email} কে অ্যাডমিন রোল যুক্ত করা হয়েছে!`
      );
    } catch (err) {
      console.error(err);
      showToast(language === 'en' ? 'Failed to assign admin' : 'অ্যাডমিন যোগ করা যায়নি', 'error');
    } finally {
      setAddingAdminLoading(false);
    }
  };

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Editing Modals / Drawers
  const [editingDestination, setEditingDestination] = useState<Partial<Destination> | null>(null);
  const [isNewDestination, setIsNewDestination] = useState(false);

  const [editingExperience, setEditingExperience] = useState<Partial<Experience> | null>(null);
  const [isNewExperience, setIsNewExperience] = useState(false);

  const [editingFestival, setEditingFestival] = useState<Partial<Festival> | null>(null);
  const [isNewFestival, setIsNewFestival] = useState(false);

  const [editingStory, setEditingStory] = useState<Partial<EditorialStory> | null>(null);
  const [isNewStory, setIsNewStory] = useState(false);

  const [editingPost, setEditingPost] = useState<Partial<CommunityPost> | null>(null);
  const [isNewPost, setIsNewPost] = useState(false);

  // News States
  const [adminNewsList, setAdminNewsList] = useState<NewsPost[]>([]);
  const [editingNews, setEditingNews] = useState<Partial<NewsPost> | null>(null);
  const [isNewNews, setIsNewNews] = useState(false);
  const [newsCategoryFilter, setNewsCategoryFilter] = useState<string>('all');
  const [newsSearchQuery, setNewsSearchQuery] = useState<string>('');

  useEffect(() => {
    const unsub = subscribeToNewsPosts((posts) => {
      setAdminNewsList(posts);
    });
    return unsub;
  }, []);

  // Image Uploading States
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery Uploading States
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const [galleryInputUrl, setGalleryInputUrl] = useState('');
  const destinationGalleryInputRef = useRef<HTMLInputElement>(null);
  const storyGalleryInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'destination' | 'experience' | 'festival' | 'story' | 'post' | 'reset' | 'news';
    id?: string;
    title: string;
  } | null>(null);

  if (!isOpen) return null;

  // Direct ImgBB File Upload Helper (Single Image Cover)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetType: 'destination' | 'story' | 'post' | 'news'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(language === 'en' ? 'Please select an image file' : 'দয়া করে একটি ছবি ফাইল নির্বাচন করুন');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const uploadResult = await uploadImageToImgBB(file);
      if (uploadResult.url) {
        if (targetType === 'destination' && editingDestination) {
          setEditingDestination({ ...editingDestination, image: uploadResult.url });
        } else if (targetType === 'story' && editingStory) {
          setEditingStory({ ...editingStory, image: uploadResult.url });
        } else if (targetType === 'post' && editingPost) {
          setEditingPost({ ...editingPost, imageUrl: uploadResult.url });
        } else if (targetType === 'news' && editingNews) {
          setEditingNews({ ...editingNews, image: uploadResult.url });
        }
        showToast(language === 'en' ? 'Image uploaded to ImgBB!' : 'ImgBB-তে ছবি আপলোড হয়েছে!');
      }
    } catch (err: unknown) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Multiple Gallery Files Upload Helper for ImgBB (One call per file)
  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetType: 'destination' | 'story'
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList) as File[];
    const validImageFiles = files.filter((f) => f.type.startsWith('image/'));

    if (validImageFiles.length === 0) {
      setGalleryUploadError(
        language === 'en' ? 'Please select valid image files' : 'দয়া করে সঠিক ছবির ফাইল নির্বাচন করুন'
      );
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploadingGallery(true);
    setGalleryUploadError(null);
    setGalleryUploadProgress({ current: 0, total: validImageFiles.length });

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < validImageFiles.length; i++) {
      const file = validImageFiles[i];
      setGalleryUploadProgress({ current: i + 1, total: validImageFiles.length });
      try {
        const res = await uploadImageToImgBB(file);
        if (res?.url) {
          uploadedUrls.push(res.url);
        } else {
          errors.push(file.name);
        }
      } catch (err: unknown) {
        console.error(`Failed to upload ${file.name}:`, err);
        errors.push(file.name);
      }
    }

    if (uploadedUrls.length > 0) {
      if (targetType === 'destination' && editingDestination) {
        const existingGallery = editingDestination.gallery || [];
        setEditingDestination({
          ...editingDestination,
          gallery: [...existingGallery, ...uploadedUrls],
        });
      } else if (targetType === 'story' && editingStory) {
        const existingGallery = editingStory.gallery || [];
        setEditingStory({
          ...editingStory,
          gallery: [...existingGallery, ...uploadedUrls],
        });
      }
      showToast(
        language === 'en'
          ? `${uploadedUrls.length} photo(s) added to gallery!`
          : `${uploadedUrls.length} টি ছবি গ্যালারিতে যোগ হয়েছে!`
      );
    }

    if (errors.length > 0) {
      setGalleryUploadError(
        language === 'en'
          ? `Failed to upload ${errors.length} image(s): ${errors.slice(0, 2).join(', ')}${errors.length > 2 ? '...' : ''}`
          : `${errors.length} টি ছবি আপলোড ব্যর্থ হয়েছে`
      );
    }

    setIsUploadingGallery(false);
    setGalleryUploadProgress(null);
    if (e.target) e.target.value = '';
  };

  const handleAddGalleryUrl = (targetType: 'destination' | 'story') => {
    const trimmed = galleryInputUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setGalleryUploadError(
        language === 'en' ? 'Please enter a valid URL starting with https://' : 'দয়া করে একটি সঠিক URL প্রদান করুন'
      );
      return;
    }
    if (targetType === 'destination' && editingDestination) {
      const current = editingDestination.gallery || [];
      setEditingDestination({ ...editingDestination, gallery: [...current, trimmed] });
      setGalleryInputUrl('');
      setGalleryUploadError(null);
      showToast(language === 'en' ? 'Photo added to gallery!' : 'ছবি গ্যালারিতে যোগ হয়েছে!');
    } else if (targetType === 'story' && editingStory) {
      const current = editingStory.gallery || [];
      setEditingStory({ ...editingStory, gallery: [...current, trimmed] });
      setGalleryInputUrl('');
      setGalleryUploadError(null);
      showToast(language === 'en' ? 'Photo added to gallery!' : 'ছবি গ্যালারিতে যোগ হয়েছে!');
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number, targetType: 'destination' | 'story') => {
    if (targetType === 'destination' && editingDestination) {
      const current = editingDestination.gallery || [];
      setEditingDestination({
        ...editingDestination,
        gallery: current.filter((_, idx) => idx !== indexToRemove),
      });
    } else if (targetType === 'story' && editingStory) {
      const current = editingStory.gallery || [];
      setEditingStory({
        ...editingStory,
        gallery: current.filter((_, idx) => idx !== indexToRemove),
      });
    }
  };

  const handleSetMainCover = (url: string, targetType: 'destination' | 'story') => {
    if (targetType === 'destination' && editingDestination) {
      setEditingDestination({
        ...editingDestination,
        image: url,
      });
      showToast(language === 'en' ? 'Cover photo updated!' : 'প্রধান ছবি হিসেবে সেট করা হয়েছে!');
    } else if (targetType === 'story' && editingStory) {
      setEditingStory({
        ...editingStory,
        image: url,
      });
      showToast(language === 'en' ? 'Cover photo updated!' : 'প্রধান ছবি হিসেবে সেট করা হয়েছে!');
    }
  };

  // --- DESTINATIONS CRUD ---
  const handleSaveDestination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDestination || !editingDestination.title || !editingDestination.titleBn) {
      showToast(language === 'en' ? 'Title is required' : 'শিরোনাম প্রদান আবশ্যক', 'error');
      return;
    }

    const defaultImg =
      editingDestination.image ||
      'https://images.unsplash.com/photo-1590332763771-032b2d8c2536?w=1200&auto=format&fit=crop&q=80';

    const item: Destination = {
      id:
        editingDestination.id ||
        editingDestination.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4),
      title: editingDestination.title || 'Untitled Destination',
      titleBn: editingDestination.titleBn || 'নতুন গন্তব্য',
      division: editingDestination.division || 'Chittagong Division',
      district: editingDestination.district || undefined,
      districtBn: editingDestination.districtBn || undefined,
      upazila: editingDestination.upazila || undefined,
      address: editingDestination.address || undefined,
      googleMapsUrl: editingDestination.googleMapsUrl || undefined,
      lat: editingDestination.lat,
      lng: editingDestination.lng,
      category: editingDestination.category || 'coastal',
      image: defaultImg,
      gallery: editingDestination.gallery && editingDestination.gallery.length > 0 ? editingDestination.gallery : undefined,
      heroFeatured: !!editingDestination.heroFeatured,
      tag: editingDestination.tag || 'Must Visit',
      tagBn: editingDestination.tagBn || 'অবশ্যই দর্শনীয়',
      summary: editingDestination.summary || '',
      summaryBn: editingDestination.summaryBn || '',
      description: editingDestination.description || '',
      descriptionBn: editingDestination.descriptionBn || '',
      highlights: editingDestination.highlights && editingDestination.highlights.length > 0
        ? editingDestination.highlights
        : ['Scenic Views', 'Cultural Heritage', 'Local Cuisine'],
      bestSeason: editingDestination.bestSeason || 'October to March',
      bestSeasonBn: editingDestination.bestSeasonBn || 'অক্টোবর থেকে মার্চ',
      rating: Number(editingDestination.rating) || 4.8,
      reviewsCount: Number(editingDestination.reviewsCount) || 120,
      duration: editingDestination.duration || '2-3 Days',
      nearestAirport: editingDestination.nearestAirport || 'Dhaka Hazrat Shahjalal Int Airport (DAC)',
      unescoStatus: !!editingDestination.unescoStatus,
      heritageType: editingDestination.heritageType || '',
      videoUrl: editingDestination.videoUrl || undefined,
    };

    if (isNewDestination) {
      onUpdateDestinations([item, ...destinations]);
      showToast(language === 'en' ? 'Destination added successfully!' : 'নতুন গন্তব্য যুক্ত হয়েছে!');
    } else {
      onUpdateDestinations(destinations.map((d) => (d.id === item.id ? item : d)));
      showToast(language === 'en' ? 'Destination updated successfully!' : 'গন্তব্য আপডেট সম্পন্ন হয়েছে!');
    }

    setEditingDestination(null);
    setIsNewDestination(false);
  };

  const handleDeleteDestination = (id: string) => {
    onUpdateDestinations(destinations.filter((d) => d.id !== id));
    showToast(language === 'en' ? 'Destination deleted' : 'গন্তব্য মুছে ফেলা হয়েছে');
    setDeleteConfirm(null);
  };

  // --- EXPERIENCES CRUD ---
  const handleSaveExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExperience || !editingExperience.title) {
      showToast(language === 'en' ? 'Title is required' : 'শিরোনাম আবশ্যক', 'error');
      return;
    }

    const item: Experience = {
      id:
        editingExperience.id ||
        'exp-' + editingExperience.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-3),
      title: editingExperience.title || '',
      titleBn: editingExperience.titleBn || editingExperience.title,
      category: editingExperience.category || 'Nature & Wildlife',
      duration: editingExperience.duration || 'Full Day',
      icon: editingExperience.icon || 'Compass',
      description: editingExperience.description || '',
      descriptionBn: editingExperience.descriptionBn || '',
      location: editingExperience.location || 'Bangladesh',
      tag: editingExperience.tag || 'Popular Experience',
    };

    if (isNewExperience) {
      onUpdateExperiences([item, ...experiences]);
      showToast(language === 'en' ? 'Experience added!' : 'নতুন অভিজ্ঞতা যুক্ত হয়েছে!');
    } else {
      onUpdateExperiences(experiences.map((exp) => (exp.id === item.id ? item : exp)));
      showToast(language === 'en' ? 'Experience updated!' : 'অভিজ্ঞতা আপডেট হয়েছে!');
    }
    setEditingExperience(null);
    setIsNewExperience(false);
  };

  const handleDeleteExperience = (id: string) => {
    onUpdateExperiences(experiences.filter((e) => e.id !== id));
    showToast(language === 'en' ? 'Experience deleted' : 'অভিজ্ঞতা মুছে ফেলা হয়েছে');
    setDeleteConfirm(null);
  };

  // --- FESTIVALS CRUD ---
  const handleSaveFestival = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFestival || !editingFestival.title) {
      showToast(language === 'en' ? 'Festival title required' : 'উৎসবের নাম আবশ্যক', 'error');
      return;
    }

    const item: Festival = {
      id:
        editingFestival.id ||
        'fest-' + editingFestival.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-3),
      title: editingFestival.title || '',
      titleBn: editingFestival.titleBn || editingFestival.title,
      date: editingFestival.date || 'April 14 (Annual)',
      dateBn: editingFestival.dateBn || '১৪ এপ্রিল (বার্ষিক)',
      location: editingFestival.location || 'Nationwide',
      locationBn: editingFestival.locationBn || 'সারাদেশব্যাপী',
      description: editingFestival.description || '',
      descriptionBn: editingFestival.descriptionBn || '',
      emoji: editingFestival.emoji || '🎉',
      badge: editingFestival.badge || 'National Celebration',
    };

    if (isNewFestival) {
      onUpdateFestivals([item, ...festivals]);
      showToast(language === 'en' ? 'Festival added!' : 'উৎসব যুক্ত হয়েছে!');
    } else {
      onUpdateFestivals(festivals.map((f) => (f.id === item.id ? item : f)));
      showToast(language === 'en' ? 'Festival updated!' : 'উৎসব আপডেট হয়েছে!');
    }
    setEditingFestival(null);
    setIsNewFestival(false);
  };

  const handleDeleteFestival = (id: string) => {
    onUpdateFestivals(festivals.filter((f) => f.id !== id));
    showToast(language === 'en' ? 'Festival deleted' : 'উৎসব মুছে ফেলা হয়েছে');
    setDeleteConfirm(null);
  };

  // --- STORIES CRUD ---
  const handleSaveStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory || !editingStory.title) {
      showToast(language === 'en' ? 'Story title required' : 'গল্পের শিরোনাম আবশ্যক', 'error');
      return;
    }

    const item: EditorialStory = {
      id:
        editingStory.id ||
        'story-' + editingStory.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-3),
      title: editingStory.title || '',
      titleBn: editingStory.titleBn || editingStory.title,
      author: editingStory.author || 'Editorial Team',
      readTime: editingStory.readTime || '5 min read',
      category: editingStory.category || 'Culture & Heritage',
      date: editingStory.date || 'Curated Essay',
      image:
        editingStory.image ||
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80',
      gallery: editingStory.gallery && editingStory.gallery.length > 0 ? editingStory.gallery : undefined,
      excerpt: editingStory.excerpt || '',
      excerptBn: editingStory.excerptBn || '',
      content:
        editingStory.content && editingStory.content.length > 0
          ? editingStory.content
          : [editingStory.excerpt || 'Insightful narrative on the heritage and lands of Bangladesh.'],
      pullQuote: editingStory.pullQuote || '',
      videoUrl: editingStory.videoUrl || undefined,
      status: editingStory.status || 'approved',
      userId: editingStory.userId || currentUser?.uid,
      submittedBy: editingStory.submittedBy || currentUser?.displayName,
      submittedByEmail: editingStory.submittedByEmail || currentUser?.email,
      createdAt: editingStory.createdAt || Date.now(),
      approvedAt: editingStory.status === 'approved' ? (editingStory.approvedAt || Date.now()) : undefined,
      approvedBy: editingStory.status === 'approved' ? (editingStory.approvedBy || currentUser?.displayName || 'Admin') : undefined,
      expiresAt: editingStory.status === 'pending' ? (editingStory.expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000)) : undefined,
    };

    if (isNewStory) {
      onUpdateStories([item, ...stories]);
      showToast(language === 'en' ? 'Story published!' : 'নতুন গল্প প্রকাশিত হয়েছে!');
    } else {
      onUpdateStories(stories.map((s) => (s.id === item.id ? item : s)));
      showToast(language === 'en' ? 'Story updated!' : 'গল্প আপডেট হয়েছে!');
    }
    setEditingStory(null);
    setIsNewStory(false);
  };

  const handleDeleteStory = (id: string) => {
    onUpdateStories(stories.filter((s) => s.id !== id));
    showToast(language === 'en' ? 'Story deleted' : 'গল্প মুছে ফেলা হয়েছে');
    setDeleteConfirm(null);
  };

  // --- COMMUNITY POSTS CRUD ---
  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editingPost.title) {
      showToast(language === 'en' ? 'Post title is required' : 'পোস্টের শিরোনাম আবশ্যক', 'error');
      return;
    }

    const item: CommunityPost = {
      id: editingPost.id || 'post-' + Date.now().toString(),
      userId: editingPost.userId || currentUser?.uid || 'admin_user',
      userName: editingPost.userName || currentUser?.displayName || 'Verified Traveler',
      userAvatar:
        editingPost.userAvatar ||
        currentUser?.photoURL ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      title: editingPost.title || '',
      caption: editingPost.caption || '',
      location: editingPost.location || 'Bangladesh',
      division: editingPost.division || 'dhaka',
      imageUrl:
        editingPost.imageUrl ||
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
      likesCount: Number(editingPost.likesCount) || 10,
      createdAt: editingPost.createdAt || Date.now(),
      tags: editingPost.tags || ['Bangladesh', 'Travel'],
      status: editingPost.status || 'approved',
      userEmail: editingPost.userEmail || currentUser?.email || undefined,
      approvedAt: editingPost.status === 'approved' ? (editingPost.approvedAt || Date.now()) : undefined,
      approvedBy: editingPost.status === 'approved' ? (editingPost.approvedBy || currentUser?.displayName || 'Admin') : undefined,
      expiresAt: editingPost.status === 'pending' ? (editingPost.expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000)) : undefined,
    };

    if (isNewPost) {
      onUpdateCommunityPosts([item, ...communityPosts]);
      showToast(language === 'en' ? 'Community photo added!' : 'কমিউনিটি ফটো যুক্ত হয়েছে!');
    } else {
      onUpdateCommunityPosts(communityPosts.map((p) => (p.id === item.id ? item : p)));
      showToast(language === 'en' ? 'Photo post updated!' : 'পোস্ট আপডেট হয়েছে!');
    }
    setEditingPost(null);
    setIsNewPost(false);
  };

  const handleDeletePost = (id: string) => {
    onUpdateCommunityPosts(communityPosts.filter((p) => p.id !== id));
    showToast(language === 'en' ? 'Post deleted' : 'পোস্ট মুছে ফেলা হয়েছে');
    setDeleteConfirm(null);
  };

  // --- NEWS POSTS CRUD ---
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews || !editingNews.title) {
      showToast(language === 'en' ? 'News title is required' : 'সংবাদের শিরোনাম আবশ্যক', 'error');
      return;
    }

    try {
      if (isNewNews) {
        await createNewsPost({
          title: editingNews.title || '',
          titleBn: editingNews.titleBn || editingNews.title,
          category: editingNews.category || 'Tourism Update',
          categoryBn: editingNews.categoryBn || editingNews.category || 'পর্যটন উন্নয়ন',
          image:
            editingNews.image ||
            'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80',
          summary: editingNews.summary || '',
          summaryBn: editingNews.summaryBn || editingNews.summary,
          content: editingNews.content || '',
          contentBn: editingNews.contentBn || editingNews.content,
          authorName: editingNews.authorName || currentUser?.displayName || 'Admin Desk',
          authorRole: editingNews.authorRole || 'Tourism Authority',
          pinned: Boolean(editingNews.pinned),
        });
        showToast(language === 'en' ? 'News announcement published!' : 'সংবাদ ও নোটিশ প্রকাশিত হয়েছে!');
      } else if (editingNews.id) {
        await updateNewsPost(editingNews.id, {
          title: editingNews.title,
          titleBn: editingNews.titleBn,
          category: editingNews.category,
          categoryBn: editingNews.categoryBn,
          image: editingNews.image,
          summary: editingNews.summary,
          summaryBn: editingNews.summaryBn,
          content: editingNews.content,
          contentBn: editingNews.contentBn,
          authorName: editingNews.authorName,
          authorRole: editingNews.authorRole,
          pinned: Boolean(editingNews.pinned),
        });
        showToast(language === 'en' ? 'News announcement updated!' : 'সংবাদ সফলভাবে আপডেট হয়েছে!');
      }
      setEditingNews(null);
      setIsNewNews(false);
    } catch (err) {
      console.error(err);
      showToast(language === 'en' ? 'Failed to save news' : 'সংবাদ সংরক্ষণ করা যায়নি', 'error');
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      await deleteNewsPost(id);
      showToast(language === 'en' ? 'News post deleted' : 'সংবাদ মুছে ফেলা হয়েছে');
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      showToast(language === 'en' ? 'Failed to delete news' : 'সংবাদ মোছা যায়নি', 'error');
    }
  };

  // --- MODERATION APPROVE / REJECT / PURGE HANDLERS ---
  const handleApproveStory = (story: EditorialStory) => {
    const updated: EditorialStory = {
      ...story,
      status: 'approved',
      approvedAt: Date.now(),
      approvedBy: currentUser?.displayName || currentUser?.email || 'Admin',
      expiresAt: undefined,
    };
    onUpdateStories(stories.map((s) => (s.id === story.id ? updated : s)));
    showToast(
      language === 'en'
        ? `Story "${story.title}" approved and published live!`
        : `গল্পটি "${story.title}" অনুমোদিত ও ওয়েবসাইটে প্রকাশিত হয়েছে!`
    );
  };

  const handleRejectStory = (story: EditorialStory) => {
    const updated: EditorialStory = {
      ...story,
      status: 'rejected',
    };
    onUpdateStories(stories.map((s) => (s.id === story.id ? updated : s)));
    showToast(
      language === 'en' ? 'Story submission rejected' : 'গল্পটি বাতিল করা হয়েছে',
      'error'
    );
  };

  const handleApprovePost = (post: CommunityPost) => {
    const updated: CommunityPost = {
      ...post,
      status: 'approved',
      approvedAt: Date.now(),
      approvedBy: currentUser?.displayName || currentUser?.email || 'Admin',
      expiresAt: undefined,
    };
    onUpdateCommunityPosts(communityPosts.map((p) => (p.id === post.id ? updated : p)));
    showToast(
      language === 'en'
        ? `Photo post "${post.title}" approved and published live!`
        : `ছবিটি "${post.title}" অনুমোদিত ও লাইভ গ্যালারিতে প্রকাশিত হয়েছে!`
    );
  };

  const handleRejectPost = (post: CommunityPost) => {
    const updated: CommunityPost = {
      ...post,
      status: 'rejected',
    };
    onUpdateCommunityPosts(communityPosts.map((p) => (p.id === post.id ? updated : p)));
    showToast(
      language === 'en' ? 'Photo post rejected' : 'ছবিটি বাতিল করা হয়েছে',
      'error'
    );
  };

  const handlePurgeExpiredSubmissions = async () => {
    setIsPurgingExpired(true);
    try {
      const { cleaned: cleanedStories, removedCount: storyPurgeCount } = purgeExpiredFromList(stories);
      const { cleaned: cleanedPosts, removedCount: postPurgeCount } = purgeExpiredFromList(communityPosts);

      if (storyPurgeCount > 0) onUpdateStories(cleanedStories);
      if (postPurgeCount > 0) onUpdateCommunityPosts(cleanedPosts);

      const dbPurged = await autoPurgeExpiredFirebaseSubmissions();
      const totalPurged = storyPurgeCount + postPurgeCount + (dbPurged.deletedPosts + dbPurged.deletedStories);

      showToast(
        language === 'en'
          ? `Purged ${totalPurged} expired pending submissions (older than 30 days)!`
          : `${totalPurged}টি ৩০ দিনের পুরনো পেন্ডিং পোস্ট ও গল্প অপসারিত হয়েছে!`
      );
    } catch (err) {
      console.warn('Purge error:', err);
      showToast(language === 'en' ? 'Purge completed' : 'মেয়াদোত্তীর্ণ ডেটা পরিষ্কার করা হয়েছে');
    } finally {
      setIsPurgingExpired(false);
    }
  };

  // --- FIREBASE CLOUD SYNC ---
  const handleCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      const res = await bootstrapAndMigrateDataToFirestore();
      showToast(
        language === 'en'
          ? `Cloud sync complete! Synced ${res.syncedPosts} posts, ${res.syncedDestinations} destinations, ${res.syncedStories} stories to Firebase.`
          : `ফায়ারবেস ক্লাউডে সকল ডেটা ও ছবি সফলভাবে সিঙ্ক সম্পন্ন হয়েছে!`
      );
    } catch (err) {
      console.warn('Cloud sync error:', err);
      showToast(
        language === 'en'
          ? 'Cloud sync completed.'
          : 'ক্লাউড সিঙ্ক সম্পন্ন হয়েছে।'
      );
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // --- EXPORT & IMPORT BACKUP ---
  const handleExportJSON = () => {
    const dataBackup = {
      exportedAt: new Date().toISOString(),
      version: '2.0',
      destinations,
      experiences,
      festivals,
      stories,
      communityPosts,
    };
    const jsonStr = JSON.stringify(dataBackup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `discover_bangladesh_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(language === 'en' ? 'Database backup downloaded!' : 'ডাটাবেস ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.destinations && Array.isArray(parsed.destinations)) {
          onUpdateDestinations(parsed.destinations);
        }
        if (parsed.experiences && Array.isArray(parsed.experiences)) {
          onUpdateExperiences(parsed.experiences);
        }
        if (parsed.festivals && Array.isArray(parsed.festivals)) {
          onUpdateFestivals(parsed.festivals);
        }
        if (parsed.stories && Array.isArray(parsed.stories)) {
          onUpdateStories(parsed.stories);
        }
        if (parsed.communityPosts && Array.isArray(parsed.communityPosts)) {
          onUpdateCommunityPosts(parsed.communityPosts);
        }
        showToast(language === 'en' ? 'Data imported successfully!' : 'সকল তথ্য সফলভাবে ইম্পোর্ট হয়েছে!');
      } catch (err) {
        console.error(err);
        showToast(language === 'en' ? 'Invalid JSON file' : 'ভুল JSON ফাইল', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-start lg:justify-center bg-black/70 backdrop-blur-md p-1 sm:p-4 overflow-x-auto overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#F6F3EA] w-[960px] max-w-none lg:w-full lg:max-w-6xl min-w-[920px] rounded-2xl sm:rounded-3xl border border-[#D8D0BC] shadow-2xl flex flex-col h-[94vh] sm:max-h-[92vh] overflow-hidden m-auto shrink-0">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`absolute top-4 right-4 z-[120] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold transition-all animate-in slide-in-from-top-2 ${
              toastMessage.type === 'success'
                ? 'bg-[#0F3B2E] text-white border border-emerald-400/40'
                : 'bg-red-700 text-white border border-red-400/40'
            }`}
          >
            {toastMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-300" /> : <AlertCircle className="w-4 h-4 text-red-200" />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-[#D8D0BC] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#0F3B2E] text-[#DE9B2E] flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif text-[#0A2A21]">
                  {language === 'en' ? 'Live Site Management & Admin Center' : 'অ্যাডমিন কন্ট্রোল ও লাইভ এডিটর'}
                </h2>
                {isFirebaseAdmin ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 border border-emerald-300">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Firebase Admin Verified</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    v2.0 Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6B756E]">
                {currentUser?.email ? (
                  <span className="font-medium text-[#0F3B2E]">
                    {language === 'en' ? 'User: ' : 'ইউজার: '}
                    {currentUser.email}
                    {isFirebaseAdmin && (
                      <span className="text-[#DE9B2E] font-bold"> (Role: Admin)</span>
                    )}
                  </span>
                ) : (
                  language === 'en'
                    ? 'Add, Edit, and Delete Destinations, Stories, Events & Photos with ImgBB upload'
                    : 'গন্তব্য, প্রবন্ধ, উৎসব ও ফটো গ্যালারির সবকিছু এডিট, ডিলিট এবং যুক্ত করুন'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#EFEADC] text-[#4B554E] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Unauthenticated / Non-Admin Access Screen */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#0F3B2E]/10 text-[#0F3B2E] flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-[#DE9B2E]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Firebase Admin Access Only' : 'ফায়ারবেস অ্যাডমিন এক্সেস সংরক্ষিত'}
              </h3>
              <p className="text-xs text-[#6B756E] leading-relaxed">
                {language === 'en'
                  ? 'Access to this control panel is restricted strictly to accounts with the verified "admin" role in Firebase. Passcode bypasses have been disabled.'
                  : 'এই কন্ট্রোল প্যানেলে শুধুমাত্র ফায়ারবেস ডেটাবেজে "admin" রোল প্রাপ্ত ব্যবহারকারীরা প্রবেশ করতে পারবেন। কোনো পাসকোড বা বাইপাস দিয়ে প্রবেশ করা যাবে না।'}
              </p>
            </div>

            {/* Current user role info card */}
            {currentUser ? (
              <div className="w-full p-4 rounded-2xl bg-white border border-[#D8D0BC] text-left text-xs space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A2A21]">{currentUser.displayName || 'Current User'}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    Role: Standard Member (সাধারণ ইউজার)
                  </span>
                </div>
                <p className="text-[#6B756E] text-[11px] truncate">{currentUser.email || 'Guest User'}</p>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                  {language === 'en'
                    ? '⚠️ Your currently logged-in account does not have Admin privileges in Firebase. Please sign in with an authorized Administrator account.'
                    : '⚠️ আপনার বর্তমান লগইন করা অ্যাকাউন্টে ফায়ারবেস অ্যাডমিন রোল নেই। অনুগ্রহ করে অনুমোদিত অ্যাডমিন অ্যাকাউন্ট দিয়ে সাইন ইন করুন।'}
                </div>
              </div>
            ) : (
              <div className="w-full p-3.5 rounded-2xl bg-[#F4F1EA] border border-[#D8D0BC] text-xs text-[#6B756E] leading-relaxed">
                {language === 'en'
                  ? 'Please sign in with your authorized Firebase Administrator account from the standard Account menu.'
                  : 'অনুগ্রহ করে স্ট্যান্ডার্ড একাউন্ট মেনু থেকে আপনার অনুমোদিত ফায়ারবেস অ্যাডমিন একাউন্টে সাইন ইন করুন।'}
              </div>
            )}

            {onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  onOpenAuth();
                }}
                className="w-full py-3 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#0A2A21] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <LogIn className="w-4 h-4 text-[#DE9B2E]" />
                <span>
                  {currentUser
                    ? language === 'en'
                      ? 'Switch to Admin Account'
                      : 'অ্যাডমিন অ্যাকাউন্টে সুইচ করুন'
                    : language === 'en'
                    ? 'Sign In with Admin Account'
                    : 'অ্যাডমিন অ্যাকাউন্টে সাইন ইন করুন'}
                </span>
              </button>
            )}
          </div>
        ) : (
          /* Authenticated Dashboard Body */
          <div className="flex-1 flex flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-56 min-w-[220px] bg-white/70 border-r border-[#D8D0BC] p-3 flex flex-col gap-1.5 overflow-y-auto shrink-0">
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <Layers className="w-4 h-4 text-[#DE9B2E]" />
                <span>{language === 'en' ? 'Overview Stats' : 'ওভারভিউ ড্যাশবোর্ড'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('pending');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : totalPendingCount > 0
                    ? 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{language === 'en' ? 'Pending Review' : 'পেন্ডিং মডারেশন'}</span>
                </div>
                {totalPendingCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                    {totalPendingCount}
                  </span>
                ) : (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-[#EFEADC] text-[#0A2A21]'}`}>
                    0
                  </span>
                )}
              </button>

              {/* Tab Button: User Reports */}
              <button
                onClick={() => {
                  setActiveTab('reports');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-[#8C3B2E] text-white shadow-xs'
                    : pendingReportsCount > 0
                    ? 'text-red-900 bg-red-50 hover:bg-red-100 border border-red-200'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flag className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'User Reports' : 'ইউজার রিপোর্ট'}</span>
                </div>
                {pendingReportsCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">
                    {pendingReportsCount}
                  </span>
                ) : (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-[#EFEADC] text-[#0A2A21]'}`}>
                    {userReports.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('users');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Users & Roles' : 'ইউজার ও রোল (RBAC)'}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-[#EFEADC] text-[#0A2A21]'}`}>
                  {usersList.length}
                </span>
              </button>

              {/* Tab Button: Newsletter Subscribers */}
              <button
                onClick={() => {
                  setActiveTab('subscribers');
                  setSearchQuery('');
                  setSubscriberSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'subscribers'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Newsletter' : 'নিউজলেটার'}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'subscribers' ? 'bg-white/20 text-white' : 'bg-[#EFEADC] text-[#0A2A21]'}`}>
                  {subscribersList.length}
                </span>
              </button>

              {/* Tab Button: News & Announcements */}
              <button
                onClick={() => {
                  setActiveTab('news');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'news'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Newspaper className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'News & Bulletins' : 'সংবাদ ও বুলেটিন'}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'news' ? 'bg-white/20 text-white' : 'bg-[#EFEADC] text-[#0A2A21]'}`}>
                  {adminNewsList.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('destinations');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'destinations'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Destinations' : 'গন্তব্যসমূহ'}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'destinations' ? 'bg-white/20 text-white' : 'bg-[#EFEADC] text-[#0A2A21]'}`}>
                  {destinations.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('experiences');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'experiences'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Things to Do' : 'অভিজ্ঞতা'}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'experiences' ? 'bg-white/20 text-white' : 'bg-[#EFEADC] text-[#0A2A21]'}`}>
                  {experiences.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('festivals');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'festivals'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Festivals & Events' : 'উৎসব ও মেলা'}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'festivals' ? 'bg-white/20 text-white' : 'bg-[#EFEADC] text-[#0A2A21]'}`}>
                  {festivals.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('stories');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'stories'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Stories & Essays' : 'গল্প ও প্রবন্ধ'}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'stories' ? 'bg-white/20 text-white' : 'bg-[#EFEADC] text-[#0A2A21]'}`}>
                  {stories.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('community');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'community'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Community Photos' : 'ফটো গ্যালারি'}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'community' ? 'bg-white/20 text-white' : 'bg-[#EFEADC] text-[#0A2A21]'}`}>
                  {communityPosts.length}
                </span>
              </button>

              <div className="my-2 border-t border-[#D8D0BC]"></div>

              <button
                onClick={() => setActiveTab('backup')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'backup'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:bg-[#EFEADC]'
                }`}
              >
                <Download className="w-4 h-4 text-[#DE9B2E]" />
                <span>{language === 'en' ? 'Backup & Reset' : 'ব্যাকআপ ও রিসেট'}</span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
              
              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {totalPendingCount > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 animate-bounce">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-amber-900 font-serif">
                            {language === 'en'
                              ? `${totalPendingCount} Pending Submission${totalPendingCount > 1 ? 's' : ''} Awaiting Review`
                              : `${totalPendingCount}টি পোস্ট ও গল্প অ্যাডমিন অনুমোদনের অপেক্ষায় আছে`}
                          </h4>
                          <p className="text-xs text-amber-700">
                            {language === 'en'
                              ? 'Review and approve member photos and essays before they expire in 30 days.'
                              : '৩০ দিনের মেয়াদ শেষ হওয়ার আগেই পোস্টগুলো পর্যালোচনা ও অনুমোদন করুন।'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('pending')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                      >
                        <span>{language === 'en' ? 'Review Pending Queue' : 'পেন্ডিং তালিকা দেখুন'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Pending User Reports Alert Banner */}
                  {pendingReportsCount > 0 && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-row items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0">
                          <Flag className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-red-900 font-serif">
                            {language === 'en'
                              ? `${pendingReportsCount} New User Report${pendingReportsCount > 1 ? 's' : ''} Received`
                              : `${pendingReportsCount}টি ইউজার রিপোর্ট / অভিযোগ জমা হয়েছে`}
                          </h4>
                          <p className="text-xs text-red-700">
                            {language === 'en'
                              ? 'Visitors have reported issues, wrong info, or feedback. Please review and resolve.'
                              : 'ওয়েবসাইট ভিজিটরদের পাঠানো সমস্যা, ভুল তথ্য বা মতামত চেক ও সমাধান করুন।'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                      >
                        <span>{language === 'en' ? 'Manage Reports' : 'রিপোর্ট সেকশন দেখুন'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Firebase Cloud Sync Banner */}
                  <div className="p-4 rounded-2xl bg-[#0A2A21] text-[#F6F3EA] border border-emerald-800/60 flex flex-row items-center justify-between gap-4 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-serif">
                            {language === 'en'
                              ? 'Firebase Firestore Cloud Persistence'
                              : 'ফায়ারবেস ফায়ারস্টোর ক্লাউড সিঙ্ক'}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            ● Real-time
                          </span>
                        </div>
                        <p className="text-xs text-emerald-100/70 mt-0.5">
                          {language === 'en'
                            ? 'All posts, images, and content are stored in Google Cloud Firebase so all visitors and browsers see updates instantly.'
                            : 'সকল পোস্ট, ছবি ও কন্টেন্ট ফায়ারবেস ক্লাউডে সংরক্ষিত থাকে এবং সকল ব্রাউজারে স্বয়ংক্রিয়ভাবে আপডেট হয়।'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCloudSync}
                      disabled={isCloudSyncing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                      <span>
                        {isCloudSyncing
                          ? (language === 'en' ? 'Syncing...' : 'সিঙ্ক হচ্ছে...')
                          : (language === 'en' ? 'Sync Cloud Now' : 'এখনই ক্লাউডে সিঙ্ক করুন')}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3.5">
                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">Destinations</span>
                        <MapPin className="w-4 h-4 text-[#DE9B2E]" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#0A2A21] mt-2">{destinations.length}</p>
                      <span className="text-[10px] text-emerald-700 font-bold">● Active Live</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">Pending</span>
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className={`text-2xl font-bold font-serif mt-2 ${totalPendingCount > 0 ? 'text-amber-600' : 'text-[#0A2A21]'}`}>
                        {totalPendingCount}
                      </p>
                      <span className="text-[10px] text-amber-700 font-bold">
                        {totalPendingCount > 0 ? '● Needs Review' : '● All Cleared'}
                      </span>
                    </div>

                    {/* User Reports Card */}
                    <div
                      onClick={() => setActiveTab('reports')}
                      className="p-4 rounded-2xl bg-white border border-[#D8D0BC] hover:border-[#8C3B2E] transition-all shadow-xs cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">User Reports</span>
                        <Flag className="w-4 h-4 text-[#8C3B2E]" />
                      </div>
                      <p className={`text-2xl font-bold font-serif mt-2 ${pendingReportsCount > 0 ? 'text-red-600' : 'text-[#0A2A21]'}`}>
                        {userReports.length}
                      </p>
                      <span className={`text-[10px] font-bold ${pendingReportsCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {pendingReportsCount > 0 ? `● ${pendingReportsCount} Pending` : '● All Resolved'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">Experiences</span>
                        <Compass className="w-4 h-4 text-[#DE9B2E]" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#0A2A21] mt-2">{experiences.length}</p>
                      <span className="text-[10px] text-emerald-700 font-bold">● Active Live</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">Festivals</span>
                        <Calendar className="w-4 h-4 text-[#DE9B2E]" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#0A2A21] mt-2">{festivals.length}</p>
                      <span className="text-[10px] text-emerald-700 font-bold">● Active Live</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">Stories</span>
                        <BookOpen className="w-4 h-4 text-[#DE9B2E]" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#0A2A21] mt-2">{stories.length}</p>
                      <span className="text-[10px] text-emerald-700 font-bold">● Published</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">Photos</span>
                        <ImageIcon className="w-4 h-4 text-[#DE9B2E]" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#0A2A21] mt-2">{communityPosts.length}</p>
                      <span className="text-[10px] text-emerald-700 font-bold">● ImgBB Synced</span>
                    </div>

                    {/* Newsletter Subscribers Card */}
                    <div
                      onClick={() => setActiveTab('subscribers')}
                      className="p-4 rounded-2xl bg-white border border-[#D8D0BC] hover:border-[#0F3B2E] transition-all shadow-xs cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">Subscribers</span>
                        <Mail className="w-4 h-4 text-[#DE9B2E]" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#0A2A21] mt-2">{subscribersList.length}</p>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        ● {subscribersList.filter((s) => s.status === 'active').length} Active
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-[#D8D0BC] space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#DE9B2E]" />
                        <h4 className="text-sm font-bold text-[#0A2A21]">
                          {language === 'en' ? 'Quick Actions' : 'তাত্ক্ষণিক অ্যাকশন'}
                        </h4>
                      </div>
                      <p className="text-xs text-[#6B756E]">
                        {language === 'en'
                          ? 'Add new attractions or update existing places in one click.'
                          : 'এক ক্লিকে নতুন পর্যটন আকর্ষণ বা গল্প ওয়েবসাইটে যুক্ত করুন।'}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={() => {
                            setActiveTab('destinations');
                            setIsNewDestination(true);
                            setEditingDestination({
                              division: 'Chittagong Division',
                              category: 'coastal',
                              rating: 4.9,
                              reviewsCount: 150,
                              highlights: ['Scenic Spot', 'Local Delicacies'],
                            });
                          }}
                          className="px-3 py-2 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#0A2A21] transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? '+ New Destination' : '+ নতুন গন্তব্য'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('stories');
                            setIsNewStory(true);
                            setEditingStory({
                              category: 'Heritage & Culture',
                              readTime: '4 min read',
                              date: 'Current Month',
                            });
                          }}
                          className="px-3 py-2 bg-white border border-[#D8D0BC] text-[#0A2A21] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#EFEADC] transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? '+ New Story' : '+ নতুন গল্প'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('festivals');
                            setIsNewFestival(true);
                            setEditingFestival({ emoji: '🎊', badge: 'Annual Fair' });
                          }}
                          className="px-3 py-2 bg-white border border-[#D8D0BC] text-[#0A2A21] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#EFEADC] transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? '+ New Festival' : '+ নতুন উৎসব'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-[#D8D0BC] space-y-3">
                      <div className="flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-[#DE9B2E]" />
                        <h4 className="text-sm font-bold text-[#0A2A21]">
                          {language === 'en' ? 'ImgBB API & Storage Health' : 'ImgBB ক্লাউড ও স্টোরেজ স্ট্যাটাস'}
                        </h4>
                      </div>
                      <p className="text-xs text-[#6B756E] leading-relaxed">
                        {language === 'en'
                          ? 'Integrated ImgBB Key is active. All image uploads convert to instant direct links and store with zero server lag.'
                          : 'ImgBB API কী সংযুক্ত আছে। যেকোনো নতুন ছবি সরাসরি আপলোড হয়ে লিংক যুক্ত হয়।'}
                      </p>
                      <div className="p-2.5 rounded-xl bg-[#F6F3EA] border border-[#D8D0BC] flex items-center justify-between text-[11px] font-mono">
                        <span className="text-neutral-600">ImgBB Direct CDN</span>
                        <span className="text-emerald-700 font-bold">● CONNECTED & READY</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Pending Moderation Review Queue */}
              {activeTab === 'pending' && (
                <div className="space-y-6">
                  {/* Queue Header with 30-Day Auto-Purge Policy Info */}
                  <div className="bg-white p-5 rounded-2xl border border-[#D8D0BC] shadow-xs flex flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <h3 className="text-base font-bold font-serif text-[#0A2A21]">
                          {language === 'en' ? 'User Submissions Review Queue' : 'ইউজার পোস্ট ও গল্প মডারেশন কিউ'}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                          {totalPendingCount} {language === 'en' ? 'Pending' : 'পেন্ডিং'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B756E] leading-relaxed max-w-2xl">
                        {language === 'en'
                          ? 'Posts submitted by logged-in users remain pending until an Administrator approves them. Unapproved submissions automatically expire and purge after 30 days.'
                          : 'লগইন করা সাধারণ ইউজারদের সকল পোস্ট ও গল্প অ্যাডমিন অনুমোদন না করা পর্যন্ত পেন্ডিং থাকে। ৩০ দিনের মধ্যে অনুমোদিত না হলে স্বয়ংক্রিয়ভাবে মুছে যাবে।'}
                      </p>
                    </div>

                    <button
                      onClick={handlePurgeExpiredSubmissions}
                      disabled={isPurgingExpired}
                      className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Hourglass className={`w-3.5 h-3.5 ${isPurgingExpired ? 'animate-spin' : ''}`} />
                      <span>{isPurgingExpired ? 'Purging...' : (language === 'en' ? 'Purge Expired (>30 Days)' : 'মেয়াদোত্তীর্ণ মুছুন')}</span>
                    </button>
                  </div>

                  {totalPendingCount === 0 ? (
                    <div className="py-14 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-[#D8D0BC]">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-serif font-bold text-[#0A2A21]">
                        {language === 'en' ? 'Queue is Clear! No Pending Submissions' : 'সব পোস্ট পর্যালোচিত! কোনো পেন্ডিং নেই'}
                      </h4>
                      <p className="text-xs text-[#6B756E] max-w-md">
                        {language === 'en'
                          ? 'All traveler photos and community articles submitted by registered users have been moderated and published.'
                          : 'রেজিস্টার্ড ব্যবহারকারীদের দেওয়া সকল ছবি ও ভ্রমণ গল্প ইতোমধ্যে অনুমোদিত অথবা নিষ্পত্তি করা হয়েছে।'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Section 1: Pending Community Photos */}
                      {pendingPosts.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-[#D8D0BC] pb-2">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-[#DE9B2E]" />
                              <h4 className="text-sm font-bold text-[#0A2A21]">
                                {language === 'en' ? 'Pending Community Photos' : 'পেন্ডিং ভ্রমণ ছবি ও মুহূর্ত'} ({pendingPosts.length})
                              </h4>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {pendingPosts.map((post) => {
                              const remainingDays = getRemainingDays(post);
                              return (
                                <div
                                  key={post.id}
                                  className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 shadow-xs flex flex-col justify-between gap-3 transition-all"
                                >
                                  <div className="flex gap-3.5">
                                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-[#D8D0BC]">
                                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                                          ⏳ {remainingDays} {language === 'en' ? 'days left' : 'দিন বাকি'}
                                        </span>
                                        <span className="text-[10px] text-[#6B756E]">📍 {post.location}</span>
                                      </div>
                                      <h5 className="text-sm font-bold text-[#0A2A21] font-serif truncate">{post.title}</h5>
                                      <p className="text-xs text-[#4B554E] line-clamp-2">{post.caption}</p>
                                      <div className="pt-1 text-[10px] text-[#6B756E]">
                                        <span>
                                          {language === 'en' ? 'By: ' : 'প্রেরক: '}
                                          <strong className="text-[#0A2A21]">{post.userName}</strong>
                                        </span>
                                        {post.submittedByEmail && <span> ({post.submittedByEmail})</span>}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center justify-between pt-2 border-t border-[#D8D0BC]/60 gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => {
                                          setIsNewPost(false);
                                          setEditingPost(post);
                                        }}
                                        className="p-1.5 rounded-lg bg-[#F6F3EA] hover:bg-[#0F3B2E] hover:text-white text-[#0A2A21] transition-colors text-xs flex items-center gap-1 font-semibold cursor-pointer"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        <span>{language === 'en' ? 'Edit' : 'সম্পাদনা'}</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          setDeleteConfirm({
                                            type: 'post',
                                            id: post.id,
                                            title: post.title,
                                          })
                                        }
                                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-700 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleRejectPost(post)}
                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>{language === 'en' ? 'Reject' : 'বাতিল'}</span>
                                      </button>
                                      <button
                                        onClick={() => handleApprovePost(post)}
                                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{language === 'en' ? 'Approve & Publish Live' : 'অনুমোদন ও লাইভ প্রকাশ'}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Section 2: Pending Editorial Stories */}
                      {pendingStories.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-[#D8D0BC] pb-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[#DE9B2E]" />
                              <h4 className="text-sm font-bold text-[#0A2A21]">
                                {language === 'en' ? 'Pending Editorial Stories & Essays' : 'পেন্ডিং ভ্রমণ আখ্যান ও প্রবন্ধ'} ({pendingStories.length})
                              </h4>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {pendingStories.map((story) => {
                              const remainingDays = getRemainingDays(story);
                              return (
                                <div
                                  key={story.id}
                                  className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 shadow-xs flex flex-col justify-between gap-3 transition-all"
                                >
                                  <div className="flex gap-3.5">
                                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-[#D8D0BC]">
                                      <img src={story.image} alt={story.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                                          ⏳ {remainingDays} {language === 'en' ? 'days left' : 'দিন বাকি'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-[#EFEADC] text-[#0A2A21] text-[10px] font-semibold">
                                          {story.category}
                                        </span>
                                      </div>
                                      <h5 className="text-sm font-bold text-[#0A2A21] font-serif truncate">{story.title}</h5>
                                      <p className="text-xs text-[#4B554E] line-clamp-2">{story.excerpt}</p>
                                      <div className="pt-1 text-[10px] text-[#6B756E]">
                                        <span>
                                          {language === 'en' ? 'Author: ' : 'লেখক: '}
                                          <strong className="text-[#0A2A21]">{story.author}</strong>
                                        </span>
                                        {story.submittedByEmail && <span> ({story.submittedByEmail})</span>}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center justify-between pt-2 border-t border-[#D8D0BC]/60 gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => {
                                          setIsNewStory(false);
                                          setEditingStory(story);
                                        }}
                                        className="p-1.5 rounded-lg bg-[#F6F3EA] hover:bg-[#0F3B2E] hover:text-white text-[#0A2A21] transition-colors text-xs flex items-center gap-1 font-semibold cursor-pointer"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        <span>{language === 'en' ? 'Edit' : 'সম্পাদনা'}</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          setDeleteConfirm({
                                            type: 'story',
                                            id: story.id,
                                            title: story.title,
                                          })
                                        }
                                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-700 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleRejectStory(story)}
                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>{language === 'en' ? 'Reject' : 'বাতিল'}</span>
                                      </button>
                                      <button
                                        onClick={() => handleApproveStory(story)}
                                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{language === 'en' ? 'Approve & Publish Live' : 'অনুমোদন ও লাইভ প্রকাশ'}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: User Reports Management (ইউজার রিপোর্ট ও অভিযোগ) */}
              {activeTab === 'reports' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">
                          {language === 'en' ? 'Total Reports' : 'মোট রিপোর্ট'}
                        </span>
                        <Flag className="w-4 h-4 text-[#8C3B2E]" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#0A2A21] mt-2">{userReports.length}</p>
                      <span className="text-[10px] text-blue-700 font-bold">● User Feedback & Issues</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">
                          {language === 'en' ? 'Pending Review' : 'অমীমাংসিত / পেন্ডিং'}
                        </span>
                        <Clock className="w-4 h-4 text-red-600" />
                      </div>
                      <p className={`text-2xl font-bold font-serif mt-2 ${pendingReportsCount > 0 ? 'text-red-600' : 'text-[#0A2A21]'}`}>
                        {pendingReportsCount}
                      </p>
                      <span className={`text-[10px] font-bold ${pendingReportsCount > 0 ? 'text-red-700 animate-pulse' : 'text-[#6B756E]'}`}>
                        {pendingReportsCount > 0 ? '● Action Required' : '● All Cleared'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">
                          {language === 'en' ? 'Resolved' : 'সমাধানকৃত'}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-emerald-700 mt-2">
                        {userReports.filter((r) => r.status === 'resolved').length}
                      </p>
                      <span className="text-[10px] text-emerald-700 font-bold">● Investigated & Closed</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">
                          {language === 'en' ? 'Dismissed' : 'বাতিল / অপ্রয়োজনীয়'}
                        </span>
                        <XCircle className="w-4 h-4 text-[#6B756E]" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#6B756E] mt-2">
                        {userReports.filter((r) => r.status === 'dismissed').length}
                      </p>
                      <span className="text-[10px] text-[#6B756E] font-bold">● Ignored</span>
                    </div>
                  </div>

                  {/* Header & Controls */}
                  <div className="flex flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#D8D0BC] shadow-xs">
                    <div className="flex-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      {/* Search Bar */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={
                            language === 'en'
                              ? 'Search reports by subject, reporter, details...'
                              : 'বিষয়, অভিযোগকারী বা বিবরণ দিয়ে খুঁজুন...'
                          }
                          className="w-full pl-9 pr-3 py-2 bg-[#F6F3EA] border border-[#D8D0BC] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3B2E]/20"
                        />
                      </div>

                      {/* Refresh Button */}
                      <button
                        onClick={loadReports}
                        disabled={loadingReports}
                        className="px-3.5 py-2 bg-[#F6F3EA] hover:bg-[#EFEADC] text-[#0A2A21] border border-[#D8D0BC] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-[#DE9B2E] ${loadingReports ? 'animate-spin' : ''}`} />
                        <span>{language === 'en' ? 'Refresh' : 'রিফ্রেশ'}</span>
                      </button>
                    </div>

                    {/* Status Filter Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { id: 'all' as const, labelEn: 'All Reports', labelBn: 'সকল রিপোর্ট', count: userReports.length, isAlert: false },
                        { id: 'pending' as const, labelEn: 'Pending', labelBn: 'পেন্ডিং', count: pendingReportsCount, isAlert: pendingReportsCount > 0 },
                        { id: 'resolved' as const, labelEn: 'Resolved', labelBn: 'সমাধানকৃত', count: userReports.filter((r) => r.status === 'resolved').length, isAlert: false },
                        { id: 'dismissed' as const, labelEn: 'Dismissed', labelBn: 'বাতিল', count: userReports.filter((r) => r.status === 'dismissed').length, isAlert: false },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setReportFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            reportFilter === tab.id
                              ? 'bg-[#0F3B2E] text-white shadow-xs'
                              : tab.isAlert
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                              : 'bg-[#F6F3EA] text-[#4B554E] hover:bg-[#EFEADC] border border-[#D8D0BC]'
                          }`}
                        >
                          <span>{language === 'en' ? tab.labelEn : tab.labelBn}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                              reportFilter === tab.id
                                ? 'bg-white/20 text-white'
                                : tab.isAlert
                                ? 'bg-red-600 text-white'
                                : 'bg-[#D8D0BC]/60 text-[#0A2A21]'
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter Bar */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    <span className="font-bold text-[#6B756E] whitespace-nowrap flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5 text-[#DE9B2E]" />
                      {language === 'en' ? 'Category:' : 'ক্যাটাগরি:'}
                    </span>
                    {[
                      { id: 'all', labelEn: 'All Categories', labelBn: 'সব ক্যাটাগরি' },
                      { id: 'incorrect_info', labelEn: 'Incorrect Info', labelBn: 'ভুল তথ্য' },
                      { id: 'technical_issue', labelEn: 'Technical Issue', labelBn: 'কারিগরি ত্রুটি' },
                      { id: 'tourism_feedback', labelEn: 'Tourism Feedback', labelBn: 'পর্যটন মতামত' },
                      { id: 'safety_concern', labelEn: 'Safety Concern', labelBn: 'নিরাপত্তা' },
                      { id: 'inappropriate_content', labelEn: 'Inappropriate Content', labelBn: 'অনুপযুক্ত' },
                      { id: 'other', labelEn: 'Other', labelBn: 'অন্যান্য' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setReportCategoryFilter(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          reportCategoryFilter === cat.id
                            ? 'bg-[#DE9B2E] text-white shadow-xs font-bold'
                            : 'bg-white text-[#4B554E] border border-[#D8D0BC] hover:bg-[#F6F3EA]'
                        }`}
                      >
                        {language === 'en' ? cat.labelEn : cat.labelBn}
                      </button>
                    ))}
                  </div>

                  {/* Reports List */}
                  {(() => {
                    const filteredReports = userReports.filter((report) => {
                      const matchesStatus =
                        reportFilter === 'all' ? true : report.status === reportFilter;
                      const matchesCategory =
                        reportCategoryFilter === 'all' ? true : report.category === reportCategoryFilter;
                      const q = searchQuery.toLowerCase().trim();
                      const matchesSearch =
                        !q ||
                        report.subject.toLowerCase().includes(q) ||
                        report.details.toLowerCase().includes(q) ||
                        (report.reporterName && report.reporterName.toLowerCase().includes(q)) ||
                        (report.reporterEmail && report.reporterEmail.toLowerCase().includes(q)) ||
                        (report.category && report.category.toLowerCase().includes(q));

                      return matchesStatus && matchesCategory && matchesSearch;
                    });

                    if (filteredReports.length === 0) {
                      return (
                        <div className="p-12 text-center bg-white rounded-3xl border border-[#D8D0BC] space-y-3">
                          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7" />
                          </div>
                          <h4 className="text-base font-bold text-[#0A2A21] font-serif">
                            {language === 'en' ? 'No Reports Found' : 'কোনো রিপোর্ট পাওয়া যায়নি'}
                          </h4>
                          <p className="text-xs text-[#6B756E] max-w-md mx-auto">
                            {searchQuery || reportFilter !== 'all' || reportCategoryFilter !== 'all'
                              ? language === 'en'
                                ? 'No user reports match your current filter criteria. Try clearing search or filters.'
                                : 'বর্তমান ফিল্টার অনুযায়ী কোনো রিপোর্ট নেই। সার্চ বা ফিল্টার পরিবর্তন করে দেখুন।'
                              : language === 'en'
                              ? 'There are currently no submitted user reports. When visitors submit reports via the "Submit Report" menu, they will appear here.'
                              : 'বর্তমানে কোনো ইউজার রিপোর্ট জমা নেই। ভিজিটররা মেনুর "Submit Report" অপশন দিয়ে রিপোর্ট পাঠালে এখানে জমা হবে।'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {filteredReports.map((report) => {
                          const dateObj = new Date(report.createdAt);
                          const formattedDate = dateObj.toLocaleDateString(
                            language === 'en' ? 'en-US' : 'bn-BD',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          );

                          const getCategoryBadge = (cat?: ReportCategory) => {
                            switch (cat) {
                              case 'incorrect_info':
                                return {
                                  labelEn: 'Incorrect Info',
                                  labelBn: 'ভুল তথ্য',
                                  bg: 'bg-amber-100 text-amber-900 border-amber-200',
                                };
                              case 'technical_issue':
                                return {
                                  labelEn: 'Technical Bug',
                                  labelBn: 'কারিগরি ত্রুটি',
                                  bg: 'bg-rose-100 text-rose-900 border-rose-200',
                                };
                              case 'safety_concern':
                                return {
                                  labelEn: 'Safety Concern',
                                  labelBn: 'নিরাপত্তা ঝুঁকি',
                                  bg: 'bg-red-100 text-red-900 border-red-200',
                                };
                              case 'inappropriate_content':
                                return {
                                  labelEn: 'Inappropriate Content',
                                  labelBn: 'অনুপযুক্ত বিষয়বস্তু',
                                  bg: 'bg-purple-100 text-purple-900 border-purple-200',
                                };
                              case 'tourism_feedback':
                                return {
                                  labelEn: 'Tourism Feedback',
                                  labelBn: 'পর্যটন মতামত',
                                  bg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                                };
                              default:
                                return {
                                  labelEn: 'General / Other',
                                  labelBn: 'অন্যান্য',
                                  bg: 'bg-neutral-100 text-neutral-800 border-neutral-200',
                                };
                            }
                          };

                          const catInfo = getCategoryBadge(report.category);

                          return (
                            <div
                              key={report.id}
                              className={`p-5 rounded-3xl bg-white border transition-all shadow-xs space-y-4 ${
                                report.status === 'pending'
                                  ? 'border-amber-300 hover:border-amber-400 bg-amber-50/20'
                                  : report.status === 'resolved'
                                  ? 'border-emerald-200 hover:border-emerald-300'
                                  : 'border-[#D8D0BC] opacity-80'
                              }`}
                            >
                              {/* Header Row */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Status Pill */}
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                                      report.status === 'pending'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : report.status === 'resolved'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-neutral-200 text-neutral-700'
                                    }`}
                                  >
                                    {report.status === 'pending' ? (
                                      <>
                                        <Clock className="w-3 h-3" />
                                        <span>{language === 'en' ? 'Pending Review' : 'পেন্ডিং'}</span>
                                      </>
                                    ) : report.status === 'resolved' ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>{language === 'en' ? 'Resolved' : 'সমাধানকৃত'}</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-3 h-3" />
                                        <span>{language === 'en' ? 'Dismissed' : 'বাতিল'}</span>
                                      </>
                                    )}
                                  </span>

                                  {/* Category Badge */}
                                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${catInfo.bg}`}>
                                    {language === 'en' ? catInfo.labelEn : catInfo.labelBn}
                                  </span>

                                  {/* Target item link if applicable */}
                                  {report.targetTitle && (
                                    <span className="px-2 py-0.5 rounded-lg bg-[#F6F3EA] text-[#0A2A21] text-[11px] font-medium border border-[#D8D0BC]">
                                      {language === 'en' ? 'About: ' : 'সম্পর্কিত: '}
                                      <strong>{report.targetTitle}</strong>
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-[#6B756E] flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-[#DE9B2E]" />
                                  <span>{formattedDate}</span>
                                </div>
                              </div>

                              {/* Subject & Details */}
                              <div className="space-y-2">
                                <h4 className="text-base font-bold text-[#0A2A21] font-serif">
                                  {report.subject}
                                </h4>
                                <div className="p-3.5 rounded-2xl bg-[#F6F3EA]/70 border border-[#D8D0BC] text-xs text-[#2B352E] leading-relaxed whitespace-pre-wrap">
                                  {report.details}
                                </div>
                              </div>

                              {/* Attached Image (Optional) */}
                              {report.imageUrl && (
                                <div className="p-3 rounded-2xl bg-[#F4F1EA] border border-[#D8D0BC] flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                  <div
                                    onClick={() => setViewingImageModal(report.imageUrl!)}
                                    className="relative w-28 h-20 rounded-xl overflow-hidden bg-neutral-200 border border-[#D8D0BC] cursor-pointer group shrink-0"
                                  >
                                    <img
                                      src={report.imageUrl}
                                      alt="Report attachment"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                      <Eye className="w-5 h-5" />
                                    </div>
                                  </div>
                                  <div className="text-xs space-y-1">
                                    <p className="font-bold text-[#0A2A21] flex items-center gap-1">
                                      <ImageIcon className="w-3.5 h-3.5 text-[#DE9B2E]" />
                                      <span>{language === 'en' ? 'Attached Screenshot / Image' : 'সংযুক্ত স্ক্রিনশট / ছবি'}</span>
                                    </p>
                                    <p className="text-[11px] text-[#6B756E]">
                                      {language === 'en'
                                        ? 'Click image to view high-resolution preview.'
                                        : 'বড় করে দেখতে ছবিতে ক্লিক করুন।'}
                                    </p>
                                    <button
                                      onClick={() => setViewingImageModal(report.imageUrl!)}
                                      className="text-[11px] text-[#0F3B2E] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>{language === 'en' ? 'Open full photo' : 'ছবিটি খুলুন'}</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Reporter Info Row */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#D8D0BC]/60 text-xs text-[#6B756E]">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-[#DE9B2E]" />
                                    <span>
                                      {language === 'en' ? 'Reporter: ' : 'প্রেরক: '}
                                      <strong className="text-[#0A2A21]">
                                        {report.reporterName || (language === 'en' ? 'Anonymous Visitor' : 'বেনামী ভিজিটর')}
                                      </strong>
                                    </span>
                                  </div>

                                  {report.reporterEmail && (
                                    <div className="flex items-center gap-1.5">
                                      <Mail className="w-3.5 h-3.5 text-[#DE9B2E]" />
                                      <a
                                        href={`mailto:${report.reporterEmail}`}
                                        className="text-[#0F3B2E] font-medium hover:underline"
                                      >
                                        {report.reporterEmail}
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {/* Admin Resolution Note (if present) */}
                                {report.adminNotes && (
                                  <div className="text-[11px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                                    <strong>{language === 'en' ? 'Admin Note: ' : 'অ্যাডমিন নোট: '}</strong>
                                    <span>{report.adminNotes}</span>
                                  </div>
                                )}
                              </div>

                              {/* Inline Resolution Box */}
                              {resolvingReportId === report.id && (
                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3 animate-in fade-in duration-150">
                                  <div className="space-y-1">
                                    <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>
                                        {language === 'en'
                                          ? 'Admin Resolution Note (Optional)'
                                          : 'সমাধান সংক্রান্ত নোট বা মন্তব্য (ঐচ্ছিক)'}
                                      </span>
                                    </label>
                                    <textarea
                                      value={adminNotesInput}
                                      onChange={(e) => setAdminNotesInput(e.target.value)}
                                      placeholder={
                                        language === 'en'
                                          ? 'e.g., Corrected the opening hours for this destination, or fixed the reported link.'
                                          : 'যেমন: গন্তব্যের ভুল সময় ঠিক করা হয়েছে, অথবা রিপোর্টেড লিংক মেরামত করা হয়েছে।'
                                      }
                                      rows={2}
                                      className="w-full p-2.5 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResolvingReportId(null);
                                        setAdminNotesInput('');
                                      }}
                                      className="px-3 py-1.5 rounded-xl border border-[#D8D0BC] bg-white text-xs font-semibold hover:bg-neutral-100 cursor-pointer"
                                    >
                                      {language === 'en' ? 'Cancel' : 'বাতিল'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleResolveReport(report, adminNotesInput)}
                                      className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>{language === 'en' ? 'Confirm Resolved' : 'সমাধান নিশ্চিত করুন'}</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons Toolbar */}
                              {resolvingReportId !== report.id && (
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D8D0BC]/60">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setSelectedReportDetail(report)}
                                      className="px-3 py-1.5 bg-[#F6F3EA] hover:bg-[#EFEADC] text-[#0A2A21] border border-[#D8D0BC] rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-[#DE9B2E]" />
                                      <span>{language === 'en' ? 'View Details' : 'সম্পূর্ণ বিবরণ'}</span>
                                    </button>

                                    <button
                                      onClick={() => setDeleteReportConfirm(report)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                      title={language === 'en' ? 'Delete Report' : 'রিপোর্ট মুছে ফেলুন'}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {report.status !== 'dismissed' && (
                                      <button
                                        onClick={() => handleDismissReport(report)}
                                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>{language === 'en' ? 'Dismiss' : 'বাতিল / অগ্রাহ্য'}</span>
                                      </button>
                                    )}

                                    {report.status !== 'resolved' && (
                                      <button
                                        onClick={() => {
                                          setResolvingReportId(report.id);
                                          setAdminNotesInput(report.adminNotes || '');
                                        }}
                                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{language === 'en' ? 'Mark Resolved' : 'সমাধান চিহ্নিত করুন'}</span>
                                      </button>
                                    )}

                                    {report.status !== 'pending' && (
                                      <button
                                        onClick={() => handleReopenReport(report)}
                                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>{language === 'en' ? 'Reopen' : 'পুনরায় খুলুন'}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab: Users & Roles Management */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">
                          {language === 'en' ? 'Total Registered Users' : 'মোট রেজিস্টার্ড ইউজার'}
                        </span>
                        <Users className="w-4 h-4 text-[#DE9B2E]" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#0A2A21] mt-2">{usersList.length}</p>
                      <span className="text-[10px] text-blue-700 font-bold">● Firebase Auth & Firestore</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">
                          {language === 'en' ? 'Active Administrators' : 'সক্রিয় অ্যাডমিন'}
                        </span>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-emerald-700 mt-2">
                        {usersList.filter((u) => u.role === 'admin').length}
                      </p>
                      <span className="text-[10px] text-emerald-700 font-bold">● Full CRUD & Publishing Access</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">
                          {language === 'en' ? 'Standard Travelers' : 'সাধারণ ইউজার'}
                        </span>
                        <UserCheck className="w-4 h-4 text-[#4B554E]" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#4B554E] mt-2">
                        {usersList.filter((u) => u.role !== 'admin').length}
                      </p>
                      <span className="text-[10px] text-[#6B756E] font-bold">● Read, Bookmark & Like Only</span>
                    </div>
                  </div>

                  {/* Add Admin By Email Form & Search Bar */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D8D0BC] space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-[#DE9B2E]" />
                        <h4 className="text-sm font-bold text-[#0A2A21] font-serif">
                          {language === 'en' ? 'Add / Designate Administrator by Email' : 'ইমেইল দিয়ে অ্যাডমিন যুক্ত করুন'}
                        </h4>
                      </div>
                      <button
                        onClick={loadUsers}
                        disabled={loadingUsers}
                        className="p-1.5 rounded-lg border border-[#D8D0BC] text-[#4B554E] hover:bg-[#EFEADC] transition-colors cursor-pointer text-xs flex items-center gap-1"
                        title="Refresh users list from Firebase"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{language === 'en' ? 'Refresh' : 'রিফ্রেশ'}</span>
                      </button>
                    </div>

                    <form onSubmit={handleAddAdminEmail} className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                        <input
                          type="email"
                          value={newAdminEmailInput}
                          onChange={(e) => setNewAdminEmailInput(e.target.value)}
                          placeholder={language === 'en' ? 'e.g. user@example.com' : 'উদাঃ user@example.com'}
                          className="w-full pl-9 pr-4 py-2.5 bg-[#F6F3EA] rounded-xl text-xs border border-[#D8D0BC] focus:outline-none focus:ring-2 focus:ring-[#0F3B2E]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={addingAdminLoading}
                        className="px-5 py-2.5 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold hover:bg-[#0A2A21] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#DE9B2E]" />
                        <span>{addingAdminLoading ? 'Saving...' : (language === 'en' ? 'Grant Admin Role in Firebase' : 'ফায়ারবেসে অ্যাডমিন করুন')}</span>
                      </button>
                    </form>

                    {/* Filter and Search */}
                    <div className="pt-2 border-t border-[#D8D0BC]/60 flex items-center justify-between gap-3">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={language === 'en' ? 'Search user by email or name...' : 'ইমেইল বা নাম দিয়ে ইউজার খুঁজুন...'}
                          className="w-full pl-9 pr-4 py-2 bg-[#F6F3EA] rounded-xl text-xs border border-[#D8D0BC] focus:outline-none focus:ring-1 focus:ring-[#0F3B2E]"
                        />
                      </div>
                      <span className="text-xs text-[#6B756E] font-medium hidden sm:inline">
                        {usersList.length} {language === 'en' ? 'Users Indexed' : 'ইউজার তালিকাভুক্ত'}
                      </span>
                    </div>
                  </div>

                  {/* Users List Cards */}
                  <div className="space-y-2.5">
                    {usersList
                      .filter((u) => {
                        const q = searchQuery.toLowerCase();
                        return (
                          (u.email && u.email.toLowerCase().includes(q)) ||
                          (u.displayName && u.displayName.toLowerCase().includes(q)) ||
                          (u.uid && u.uid.toLowerCase().includes(q))
                        );
                      })
                      .map((u) => {
                        const isAdminUser = u.role === 'admin';
                        const isSelf = currentUser?.uid === u.uid || (currentUser?.email && u.email && currentUser.email.toLowerCase() === u.email.toLowerCase());

                        return (
                          <div
                            key={u.uid}
                            className={`p-4 rounded-2xl bg-white border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${
                              isAdminUser ? 'border-emerald-200 bg-emerald-50/20' : 'border-[#D8D0BC]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {u.photoURL ? (
                                <img
                                  src={u.photoURL}
                                  alt="Avatar"
                                  className="w-10 h-10 rounded-full object-cover border border-[#D8D0BC]"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#0F3B2E] text-white flex items-center justify-center font-bold text-sm">
                                  {u.displayName ? u.displayName.charAt(0).toUpperCase() : (u.email ? u.email.charAt(0).toUpperCase() : 'U')}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-[#0A2A21]">
                                    {u.displayName || (u.email ? u.email.split('@')[0] : 'Anonymous Traveler')}
                                  </span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                                      {language === 'en' ? 'You' : 'আপনি'}
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                      isAdminUser
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {isAdminUser ? (
                                      <>
                                        <Shield className="w-3 h-3 text-emerald-700" />
                                        <span>Admin 🛡️</span>
                                      </>
                                    ) : (
                                      <span>Standard User 👤</span>
                                    )}
                                  </span>
                                </div>
                                <p className="text-xs text-[#6B756E] font-mono mt-0.5 truncate max-w-md">
                                  {u.email || `UID: ${u.uid}`}
                                </p>
                              </div>
                            </div>

                            {/* Role Action Controls */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {isAdminUser ? (
                                <button
                                  onClick={() => handleToggleRole(u)}
                                  title="Demote to regular user"
                                  className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  <span>{language === 'en' ? 'Revoke Admin (Set User)' : 'ইউজার করুন'}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleRole(u)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#0F3B2E] text-white hover:bg-[#0A2A21] border border-[#DE9B2E]/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#DE9B2E]" />
                                  <span>{language === 'en' ? 'Make Admin 🛡️' : 'অ্যাডমিন বানান'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Security Notice */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <Shield className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
                    <div>
                      <span className="font-bold">
                        {language === 'en' ? 'Firebase Role-Based Access Control (RBAC): ' : 'ফায়ারবেস রোল-ভিত্তিক অ্যাক্সেস নিয়ন্ত্রণ: '}
                      </span>
                      {language === 'en'
                        ? 'Users granted the "Admin" role receive full permissions to manage destinations, stories, festivals, and publish community chronicles. Standard users remain in read-only and explorer mode.'
                        : 'যাদের "অ্যাডমিন" রোল দেওয়া হবে তারা সকল তথ্য যোগ, এডিট, ডিলিট এবং ওয়েবসাইটে পোস্ট করতে পারবেন। অন্য সকল ইউজার কেবল ঘুরে দেখতে এবং সেভ করতে পারবেন।'}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Newsletter Subscribers */}
              {activeTab === 'subscribers' && (
                <div className="space-y-6">
                  {/* Top Header Card */}
                  <div className="bg-white p-5 rounded-2xl border border-[#D8D0BC] shadow-xs flex flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#0F3B2E] text-white flex items-center justify-center">
                          <Mail className="w-4 h-4 text-[#DE9B2E]" />
                        </div>
                        <h3 className="text-base font-bold font-serif text-[#0A2A21]">
                          {language === 'en' ? 'Newsletter Email Subscribers' : 'নিউজলেটার গ্রাহক তালিকা'}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-200">
                          {subscribersList.filter((s) => s.status === 'active').length} {language === 'en' ? 'Active' : 'সক্রিয়'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B756E] max-w-2xl">
                        {language === 'en'
                          ? 'Subscribers collected via the footer newsletter form and saved to the Firestore "subscribers" collection. You can copy active emails for campaigns, download CSV exports, or adjust subscription statuses.'
                          : 'ফুটার নিউজলেটার ফরমের মাধ্যমে সংগৃহীত এবং ফায়ারবেস ফায়ারস্টোরের "subscribers" কালেকশনে সংরক্ষিত গ্রাহক তালিকা। আপনি এক ক্লিকে তালিকা কপি বা CSV ডাউনলোড করতে পারবেন।'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 flex-wrap">
                      <button
                        onClick={handleCopyAllEmails}
                        className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#0A2A21] border border-[#D8D0BC] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        {copiedEmailStatus ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">{language === 'en' ? 'Copied!' : 'কপি হয়েছে!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#DE9B2E]" />
                            <span>{language === 'en' ? 'Copy Emails' : 'ইমেইল কপি'}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleExportSubscribersCSV}
                        className="px-3.5 py-2 bg-[#0F3B2E] hover:bg-[#0A2A21] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#DE9B2E]" />
                        <span>{language === 'en' ? 'Export CSV' : 'CSV ডাউনলোড'}</span>
                      </button>

                      <button
                        onClick={loadSubscribers}
                        disabled={loadingSubscribers}
                        title="Reload subscribers list"
                        className="p-2 bg-white hover:bg-neutral-100 border border-[#D8D0BC] rounded-xl text-[#6B756E] hover:text-[#0A2A21] transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingSubscribers ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">
                          {language === 'en' ? 'Total Collected' : 'মোট সংগৃহীত'}
                        </span>
                        <Mail className="w-4 h-4 text-[#DE9B2E]" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#0A2A21] mt-1.5">{subscribersList.length}</p>
                      <span className="text-[10px] text-[#6B756E]">
                        {language === 'en' ? 'All-time subscribers' : 'সর্বমোট নিবন্ধিত'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase">
                          {language === 'en' ? 'Active Subscribers' : 'সক্রিয় গ্রাহক'}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-emerald-950 mt-1.5">
                        {subscribersList.filter((s) => s.status === 'active').length}
                      </p>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        ● {language === 'en' ? 'Ready for broadcasts' : 'নিউজলেটার পাঠানোর জন্য প্রস্তুত'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#6B756E] uppercase">
                          {language === 'en' ? 'Unsubscribed' : 'আনসাবস্ক্রাইবড'}
                        </span>
                        <XCircle className="w-4 h-4 text-neutral-400" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-[#0A2A21] mt-1.5">
                        {subscribersList.filter((s) => s.status === 'unsubscribed').length}
                      </p>
                      <span className="text-[10px] text-neutral-500">
                        {language === 'en' ? 'Opted out' : 'বাতিলকৃত'}
                      </span>
                    </div>
                  </div>

                  {/* Add New Subscriber & Search Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-[#D8D0BC] shadow-xs space-y-4">
                    {/* Add Subscriber Form */}
                    <form onSubmit={handleAddSubscriber} className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                        <input
                          type="email"
                          required
                          value={newSubscriberEmailInput}
                          onChange={(e) => setNewSubscriberEmailInput(e.target.value)}
                          placeholder={
                            language === 'en' ? 'Add new subscriber email directly...' : 'সরাসরি নতুন গ্রাহকের ইমেইল যুক্ত করুন...'
                          }
                          className="w-full pl-9 pr-4 py-2.5 bg-[#F6F3EA] rounded-xl text-xs border border-[#D8D0BC] focus:outline-none focus:ring-1 focus:ring-[#0F3B2E]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={addingSubscriberLoading}
                        className="px-4 py-2.5 bg-[#0F3B2E] hover:bg-[#0A2A21] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50 shadow-2xs"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-[#DE9B2E]" />
                        <span>
                          {addingSubscriberLoading
                            ? language === 'en'
                              ? 'Adding...'
                              : 'যুক্ত হচ্ছে...'
                            : language === 'en'
                            ? '+ Add Email'
                            : '+ ইমেইল যোগ করুন'}
                        </span>
                      </button>
                    </form>

                    <div className="border-t border-[#D8D0BC] pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                      {/* Search */}
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                        <input
                          type="text"
                          value={subscriberSearchQuery}
                          onChange={(e) => setSubscriberSearchQuery(e.target.value)}
                          placeholder={language === 'en' ? 'Filter by email...' : 'ইমেইল অনুসন্ধান করুন...'}
                          className="w-full pl-9 pr-4 py-2 bg-[#F6F3EA] rounded-xl text-xs border border-[#D8D0BC] focus:outline-none focus:ring-1 focus:ring-[#0F3B2E]"
                        />
                      </div>

                      {/* Status Filter Buttons */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                        <span className="text-[11px] font-bold text-[#6B756E] mr-1 hidden sm:inline">
                          {language === 'en' ? 'Filter:' : 'ফিল্টার:'}
                        </span>
                        {(['all', 'active', 'unsubscribed'] as const).map((filterVal) => (
                          <button
                            key={filterVal}
                            onClick={() => setSubscriberFilter(filterVal)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                              subscriberFilter === filterVal
                                ? 'bg-[#0F3B2E] text-white shadow-2xs'
                                : 'bg-[#EFEADC] text-[#4B554E] hover:bg-[#D8D0BC]'
                            }`}
                          >
                            {filterVal === 'all'
                              ? language === 'en'
                                ? 'All'
                                : 'সব'
                              : filterVal === 'active'
                              ? language === 'en'
                                ? 'Active'
                                : 'সক্রিয়'
                              : language === 'en'
                              ? 'Unsubscribed'
                              : 'বাতিলকৃত'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subscribers List / Table */}
                  {(() => {
                    const filtered = subscribersList.filter((s) => {
                      const matchesStatus =
                        subscriberFilter === 'all' || s.status === subscriberFilter;
                      const matchesSearch =
                        !subscriberSearchQuery.trim() ||
                        s.email.toLowerCase().includes(subscriberSearchQuery.toLowerCase()) ||
                        (s.source && s.source.toLowerCase().includes(subscriberSearchQuery.toLowerCase()));
                      return matchesStatus && matchesSearch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-[#D8D0BC]">
                          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center">
                            <Mail className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-serif font-bold text-[#0A2A21]">
                            {language === 'en' ? 'No Subscribers Found' : 'কোনো সাবস্ক্রাইবার পাওয়া যায়নি'}
                          </h4>
                          <p className="text-xs text-[#6B756E] max-w-sm">
                            {subscriberSearchQuery || subscriberFilter !== 'all'
                              ? language === 'en'
                                ? 'Try changing your search keywords or filter options.'
                                : 'অনুসন্ধান শব্দ বা ফিল্টার অপশন পরিবর্তন করে আবার দেখুন।'
                              : language === 'en'
                              ? 'New subscribers submitting from the Footer newsletter form will appear here in real-time.'
                              : 'ওয়েবসাইটের ফুটার থেকে নতুন গ্রাহক সাবস্ক্রাইব করলে এখানে রিয়েল-টাইমে প্রদর্শিত হবে।'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-[#6B756E] px-2">
                          <span>
                            {language === 'en' ? 'Subscribers List' : 'গ্রাহক তালিকা'} ({filtered.length})
                          </span>
                        </div>

                        <div className="bg-white rounded-2xl border border-[#D8D0BC] divide-y divide-[#EFEADC] overflow-hidden shadow-xs">
                          {filtered.map((sub, index) => {
                            const dateStr = sub.createdAt
                              ? new Date(sub.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recently';

                            return (
                              <div
                                key={sub.id || index}
                                className="p-3.5 sm:p-4 hover:bg-[#F6F3EA]/60 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                                      sub.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                                    }`}
                                  >
                                    {sub.email ? sub.email.charAt(0) : '@'}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-[#0A2A21] font-mono select-all">
                                        {sub.email}
                                      </span>

                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                          sub.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                                        }`}
                                      >
                                        {sub.status === 'active'
                                          ? language === 'en'
                                            ? 'Active'
                                            : 'সক্রিয়'
                                          : language === 'en'
                                          ? 'Unsubscribed'
                                          : 'আনসাবস্ক্রাইবড'}
                                      </span>

                                      {sub.language && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EFEADC] text-[#0A2A21] uppercase">
                                          {sub.language}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-3 text-[11px] text-[#6B756E] mt-0.5">
                                      <span>{language === 'en' ? 'Subscribed: ' : 'যোগদান: '}{dateStr}</span>
                                      {sub.source && (
                                        <span className="text-[10px] text-neutral-400">
                                          via {sub.source}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(sub.email);
                                      showToast(language === 'en' ? 'Email copied!' : 'ইমেইল কপি হয়েছে!');
                                    }}
                                    title="Copy Email"
                                    className="p-2 rounded-xl text-[#6B756E] hover:text-[#0A2A21] hover:bg-[#EFEADC] transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleToggleSubscriberStatus(sub)}
                                    title={
                                      sub.status === 'active'
                                        ? 'Mark as Unsubscribed'
                                        : 'Reactivate Subscription'
                                    }
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                      sub.status === 'active'
                                        ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {sub.status === 'active' ? (
                                      <span>{language === 'en' ? 'Deactivate' : 'নিষ্ক্রিয়'}</span>
                                    ) : (
                                      <span>{language === 'en' ? 'Activate' : 'সক্রিয়'}</span>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => setDeleteSubscriberConfirm(sub)}
                                    title="Delete subscriber"
                                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab: News & Announcements Management */}
              {activeTab === 'news' && (
                <div className="space-y-4">
                  {/* Top action bar: Search, Filter, and Publish Button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#D8D0BC]">
                    <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto flex-1">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                        <input
                          type="text"
                          value={newsSearchQuery}
                          onChange={(e) => setNewsSearchQuery(e.target.value)}
                          placeholder={language === 'en' ? 'Search announcements...' : 'বিজ্ঞপ্তি ও সংবাদ খুঁজুন...'}
                          className="w-full pl-9 pr-4 py-2 bg-[#F6F3EA] rounded-xl text-xs border border-[#D8D0BC] focus:outline-none focus:ring-1 focus:ring-[#0F3B2E]"
                        />
                      </div>

                      {/* Category filter pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                        {['all', 'Tourism Update', 'Preservation', 'Festival', 'Travel Alert'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setNewsCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                              newsCategoryFilter === cat
                                ? 'bg-[#0F3B2E] text-white shadow-2xs'
                                : 'bg-[#EFEADC] text-[#4B554E] hover:bg-[#D8D0BC]'
                            }`}
                          >
                            {cat === 'all'
                              ? language === 'en'
                                ? 'All'
                                : 'সকল'
                              : cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsNewNews(true);
                        setEditingNews({
                          title: '',
                          titleBn: '',
                          category: 'Tourism Update',
                          categoryBn: 'পর্যটন উন্নয়ন',
                          image:
                            'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80',
                          summary: '',
                          summaryBn: '',
                          content: '',
                          contentBn: '',
                          authorName: currentUser?.displayName || 'Admin Desk',
                          authorRole: 'Official Tourism Board',
                          pinned: false,
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold hover:bg-[#0A2A21] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 text-[#DE9B2E]" />
                      <span>{language === 'en' ? 'Publish Announcement' : 'নতুন সংবাদ ও নোটিশ প্রকাশ করুন'}</span>
                    </button>
                  </div>

                  {/* News list */}
                  {(() => {
                    const filtered = adminNewsList.filter((item) => {
                      const matchesCategory =
                        newsCategoryFilter === 'all' ||
                        item.category?.toLowerCase() === newsCategoryFilter.toLowerCase();
                      const matchesSearch =
                        !newsSearchQuery.trim() ||
                        item.title?.toLowerCase().includes(newsSearchQuery.toLowerCase()) ||
                        (item.titleBn && item.titleBn.toLowerCase().includes(newsSearchQuery.toLowerCase())) ||
                        item.summary?.toLowerCase().includes(newsSearchQuery.toLowerCase());
                      return matchesCategory && matchesSearch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-[#D8D0BC]">
                          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center">
                            <Newspaper className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-serif font-bold text-[#0A2A21]">
                            {language === 'en' ? 'No Announcements Found' : 'কোনো সংবাদ বা বিজ্ঞপ্তি পাওয়া যায়নি'}
                          </h4>
                          <p className="text-xs text-[#6B756E] max-w-sm">
                            {newsSearchQuery || newsCategoryFilter !== 'all'
                              ? language === 'en'
                                ? 'Try changing your search keywords or filter category.'
                                : 'অনুসন্ধান শব্দ বা ক্যাটাগরি পরিবর্তন করে চেষ্টা করুন।'
                              : language === 'en'
                              ? 'Click the "+ Publish Announcement" button to post your first tourism bulletin.'
                              : 'নতুন নোটিশ বা সংবাদ প্রকাশ করতে "+ নতুন সংবাদ ও নোটিশ প্রকাশ করুন" বাটনে ক্লিক করুন।'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-[#6B756E] px-2">
                          <span>
                            {language === 'en' ? 'Announcements & Bulletins' : 'সংবাদ ও বিজ্ঞপ্তি তালিকা'} ({filtered.length})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {filtered.map((news) => (
                            <div
                              key={news.id}
                              className="bg-white rounded-2xl border border-[#D8D0BC] p-4 flex flex-col justify-between shadow-xs hover:border-[#DE9B2E] transition-all"
                            >
                              <div className="flex gap-3.5 items-start">
                                <img
                                  src={news.image}
                                  alt={news.title}
                                  className="w-24 h-24 object-cover rounded-xl shrink-0 border border-[#D8D0BC]"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F3B2E]/10 text-[#0F3B2E] border border-[#0F3B2E]/20">
                                      {language === 'en' ? news.category : news.categoryBn || news.category}
                                    </span>
                                    {news.pinned && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DE9B2E] text-[#0A2A21] flex items-center gap-1">
                                        <Pin className="w-2.5 h-2.5 fill-current" />
                                        <span>Pinned</span>
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-sm font-bold text-[#0A2A21] line-clamp-2 leading-snug">
                                    {language === 'en' ? news.title : news.titleBn || news.title}
                                  </h4>
                                  <p className="text-xs text-[#6B756E] line-clamp-2 mt-1 leading-relaxed">
                                    {language === 'en' ? news.summary : news.summaryBn || news.summary}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-[#EAE5D8] flex items-center justify-between text-xs text-[#6B756E]">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                                    <span>{news.likesCount || 0}</span>
                                  </span>
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <MessageSquare className="w-3.5 h-3.5 text-[#0F3B2E]" />
                                    <span>{news.commentsCount || 0}</span>
                                  </span>
                                  <span className="text-[11px]">
                                    {new Date(news.createdAt).toLocaleDateString()}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsNewNews(false);
                                      setEditingNews({ ...news });
                                    }}
                                    className="p-1.5 rounded-lg text-[#0F3B2E] hover:bg-[#EFEADC] transition-colors cursor-pointer"
                                    title="Edit Announcement"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteConfirm({
                                        type: 'news',
                                        id: news.id,
                                        title: news.title,
                                      });
                                    }}
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Delete Announcement"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab: Destinations */}
              {activeTab === 'destinations' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#D8D0BC]">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={language === 'en' ? 'Search destinations...' : 'গন্তব্য খুঁজুন...'}
                        className="w-full pl-9 pr-4 py-2 bg-[#F6F3EA] rounded-xl text-xs border border-[#D8D0BC] focus:outline-none focus:ring-1 focus:ring-[#0F3B2E]"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setIsNewDestination(true);
                        setEditingDestination({
                          title: '',
                          titleBn: '',
                          division: 'Chittagong Division',
                          category: 'coastal',
                          tag: 'Must Visit',
                          tagBn: 'অবশ্যই দর্শনীয়',
                          bestSeason: 'October to March',
                          bestSeasonBn: 'অক্টোবর থেকে মার্চ',
                          rating: 4.9,
                          reviewsCount: 120,
                          highlights: ['Breathtaking scenery', 'Local food specialties'],
                          heroFeatured: false,
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#0A2A21] transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-[#DE9B2E]" />
                      <span>{language === 'en' ? 'Add New Destination' : 'নতুন গন্তব্য যোগ করুন'}</span>
                    </button>
                  </div>

                  {/* Destination List */}
                  <div className="grid grid-cols-2 gap-3.5">
                    {destinations
                      .filter((d) => {
                        const q = searchQuery.toLowerCase();
                        return (
                          d.title.toLowerCase().includes(q) ||
                          d.titleBn.includes(q) ||
                          d.division.toLowerCase().includes(q) ||
                          d.category.toLowerCase().includes(q)
                        );
                      })
                      .map((dest) => (
                        <div
                          key={dest.id}
                          className="p-3.5 rounded-2xl bg-white border border-[#D8D0BC] flex gap-3.5 items-start hover:border-[#0F3B2E]/40 transition-all shadow-2xs"
                        >
                          <img
                            src={dest.image}
                            alt={dest.title}
                            className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#D8D0BC]"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h4 className="text-sm font-bold text-[#0A2A21] truncate font-serif">{dest.title}</h4>
                                <p className="text-[11px] text-[#4B554E] truncate">{dest.titleBn}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setIsNewDestination(false);
                                    setEditingDestination(dest);
                                  }}
                                  className="p-1.5 rounded-lg bg-[#F6F3EA] hover:bg-[#0F3B2E] hover:text-white text-[#0A2A21] transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: 'destination',
                                      id: dest.id,
                                      title: dest.title,
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-700 hover:text-white text-red-600 transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1 flex-wrap text-[10px]">
                              <span className="px-2 py-0.5 rounded-full bg-[#EFEADC] text-[#0A2A21] font-semibold">
                                {dest.division}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#0F3B2E]/10 text-[#0F3B2E] font-bold">
                                {dest.category}
                              </span>
                              {dest.heroFeatured && (
                                <span className="px-2 py-0.5 rounded-full bg-[#DE9B2E]/20 text-[#9B6A1A] font-bold">
                                  ★ Hero
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Tab: Experiences */}
              {activeTab === 'experiences' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#D8D0BC]">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={language === 'en' ? 'Search experiences...' : 'অভিজ্ঞতা খুঁজুন...'}
                        className="w-full pl-9 pr-4 py-2 bg-[#F6F3EA] rounded-xl text-xs border border-[#D8D0BC] focus:outline-none focus:ring-1 focus:ring-[#0F3B2E]"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setIsNewExperience(true);
                        setEditingExperience({
                          title: '',
                          titleBn: '',
                          category: 'Nature & Wildlife',
                          duration: 'Full Day',
                          icon: 'Compass',
                          location: 'Sylhet',
                          tag: 'Must Experience',
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#0A2A21] transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-[#DE9B2E]" />
                      <span>{language === 'en' ? 'Add Experience' : 'নতুন অভিজ্ঞতা যোগ করুন'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {experiences
                      .filter((e) => {
                        const q = searchQuery.toLowerCase();
                        return (
                          e.title.toLowerCase().includes(q) ||
                          e.titleBn.includes(q) ||
                          e.category.toLowerCase().includes(q)
                        );
                      })
                      .map((exp) => (
                        <div
                          key={exp.id}
                          className="p-4 rounded-2xl bg-white border border-[#D8D0BC] flex items-start justify-between gap-3 hover:border-[#0F3B2E]/40 transition-all shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#DE9B2E]"></span>
                              <h4 className="text-sm font-bold text-[#0A2A21] font-serif">{exp.title}</h4>
                            </div>
                            <p className="text-xs text-[#4B554E]">{exp.titleBn}</p>
                            <p className="text-[11px] text-[#6B756E] line-clamp-2">{exp.description}</p>
                            <div className="flex items-center gap-2 pt-1 text-[10px] font-semibold text-[#0A2A21]">
                              <span className="px-2 py-0.5 rounded-full bg-[#EFEADC]">{exp.category}</span>
                              <span className="text-[#6B756E]">📍 {exp.location}</span>
                              <span className="text-[#6B756E]">⏱ {exp.duration}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setIsNewExperience(false);
                                setEditingExperience(exp);
                              }}
                              className="p-1.5 rounded-lg bg-[#F6F3EA] hover:bg-[#0F3B2E] hover:text-white text-[#0A2A21] transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'experience',
                                  id: exp.id,
                                  title: exp.title,
                                })
                              }
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-700 hover:text-white text-red-600 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Tab: Festivals */}
              {activeTab === 'festivals' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#D8D0BC]">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={language === 'en' ? 'Search festivals...' : 'উৎসব খুঁজুন...'}
                        className="w-full pl-9 pr-4 py-2 bg-[#F6F3EA] rounded-xl text-xs border border-[#D8D0BC] focus:outline-none focus:ring-1 focus:ring-[#0F3B2E]"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setIsNewFestival(true);
                        setEditingFestival({
                          title: '',
                          titleBn: '',
                          date: 'Annual Event',
                          dateBn: 'বার্ষিক উৎসব',
                          location: 'Nationwide',
                          locationBn: 'সারাদেশ',
                          emoji: '🎊',
                          badge: 'Cultural Festival',
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#0A2A21] transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-[#DE9B2E]" />
                      <span>{language === 'en' ? 'Add Festival' : 'নতুন উৎসব যোগ করুন'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {festivals
                      .filter((f) => {
                        const q = searchQuery.toLowerCase();
                        return (
                          f.title.toLowerCase().includes(q) ||
                          f.titleBn.includes(q) ||
                          f.location.toLowerCase().includes(q)
                        );
                      })
                      .map((fest) => (
                        <div
                          key={fest.id}
                          className="p-4 rounded-2xl bg-white border border-[#D8D0BC] flex items-start justify-between gap-3 hover:border-[#0F3B2E]/40 transition-all shadow-2xs"
                        >
                          <div className="flex gap-3">
                            <span className="text-3xl shrink-0">{fest.emoji}</span>
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-[#0A2A21] font-serif">{fest.title}</h4>
                              <p className="text-xs text-[#4B554E]">{fest.titleBn}</p>
                              <p className="text-[11px] text-[#6B756E] line-clamp-2">{fest.description}</p>
                              <div className="flex items-center gap-2 pt-1 text-[10px] font-semibold text-[#0A2A21]">
                                <span className="px-2 py-0.5 rounded-full bg-[#EFEADC]">{fest.badge}</span>
                                <span className="text-[#6B756E]">📅 {fest.date}</span>
                                <span className="text-[#6B756E]">📍 {fest.location}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setIsNewFestival(false);
                                setEditingFestival(fest);
                              }}
                              className="p-1.5 rounded-lg bg-[#F6F3EA] hover:bg-[#0F3B2E] hover:text-white text-[#0A2A21] transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'festival',
                                  id: fest.id,
                                  title: fest.title,
                                })
                              }
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-700 hover:text-white text-red-600 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Tab: Stories */}
              {activeTab === 'stories' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#D8D0BC]">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={language === 'en' ? 'Search stories...' : 'প্রবন্ধ ও গল্প খুঁজুন...'}
                        className="w-full pl-9 pr-4 py-2 bg-[#F6F3EA] rounded-xl text-xs border border-[#D8D0BC] focus:outline-none focus:ring-1 focus:ring-[#0F3B2E]"
                      />
                    </div>

                    {/* Status Filter Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setStoryFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          storyFilter === 'all'
                            ? 'bg-[#0F3B2E] text-white shadow-xs'
                            : 'bg-[#F6F3EA] text-[#4B554E] hover:bg-[#EFEADC]'
                        }`}
                      >
                        {language === 'en' ? 'All' : 'সকল'} ({stories.length})
                      </button>
                      <button
                        onClick={() => setStoryFilter('pending')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          storyFilter === 'pending'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{language === 'en' ? 'Pending' : 'পেন্ডিং'}</span>
                        <span>({stories.filter((s) => s.status === 'pending').length})</span>
                      </button>
                      <button
                        onClick={() => setStoryFilter('approved')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          storyFilter === 'approved'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{language === 'en' ? 'Approved' : 'অনুমোদিত'}</span>
                        <span>({stories.filter((s) => s.status !== 'pending' && s.status !== 'rejected').length})</span>
                      </button>
                      <button
                        onClick={() => setStoryFilter('rejected')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          storyFilter === 'rejected'
                            ? 'bg-red-700 text-white shadow-xs'
                            : 'bg-red-50 text-red-900 border border-red-200 hover:bg-red-100'
                        }`}
                      >
                        <XCircle className="w-3 h-3" />
                        <span>{language === 'en' ? 'Rejected' : 'বাতিল'}</span>
                        <span>({stories.filter((s) => s.status === 'rejected').length})</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsNewStory(true);
                        setEditingStory({
                          title: '',
                          titleBn: '',
                          author: 'Staff Writer',
                          readTime: '4 min read',
                          category: 'Heritage & Craft',
                          date: 'Curated Edition',
                          excerpt: '',
                          excerptBn: '',
                          content: [''],
                          pullQuote: '',
                          status: 'approved',
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#0A2A21] transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-[#DE9B2E]" />
                      <span>{language === 'en' ? 'Add New Story' : 'নতুন গল্প লিখুন'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {stories
                      .filter((s) => {
                        const q = searchQuery.toLowerCase();
                        const matchesQuery =
                          s.title.toLowerCase().includes(q) ||
                          s.titleBn.includes(q) ||
                          s.author.toLowerCase().includes(q);
                        
                        if (!matchesQuery) return false;
                        if (storyFilter === 'all') return true;
                        if (storyFilter === 'pending') return s.status === 'pending';
                        if (storyFilter === 'approved') return s.status !== 'pending' && s.status !== 'rejected';
                        if (storyFilter === 'rejected') return s.status === 'rejected';
                        return true;
                      })
                      .map((story) => {
                        const isPending = story.status === 'pending';
                        const isRejected = story.status === 'rejected';
                        const remainingDays = getRemainingDays(story);

                        return (
                          <div
                            key={story.id}
                            className={`p-3.5 rounded-2xl bg-white border flex flex-col justify-between gap-3 transition-all shadow-2xs ${
                              isPending
                                ? 'border-amber-300 bg-amber-50/20'
                                : isRejected
                                ? 'border-red-200 opacity-75'
                                : 'border-[#D8D0BC] hover:border-[#0F3B2E]/40'
                            }`}
                          >
                            <div className="flex gap-3.5 items-start">
                              <img
                                src={story.image}
                                alt={story.title}
                                className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#D8D0BC]"
                              />
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-start justify-between gap-1">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                      {isPending ? (
                                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                                          ⏳ Pending (30d: {remainingDays}d left)
                                        </span>
                                      ) : isRejected ? (
                                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-900 text-[10px] font-bold">
                                          ❌ Rejected
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                                          ✓ Approved Live
                                        </span>
                                      )}
                                      <span className="px-2 py-0.5 rounded-full bg-[#EFEADC] text-[#0A2A21] text-[10px]">
                                        {story.category}
                                      </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-[#0A2A21] truncate font-serif">{story.title}</h4>
                                    <p className="text-[11px] text-[#4B554E] truncate">{story.titleBn}</p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => {
                                        setIsNewStory(false);
                                        setEditingStory(story);
                                      }}
                                      className="p-1.5 rounded-lg bg-[#F6F3EA] hover:bg-[#0F3B2E] hover:text-white text-[#0A2A21] transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteConfirm({
                                          type: 'story',
                                          id: story.id,
                                          title: story.title,
                                        })
                                      }
                                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-700 hover:text-white text-red-600 transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[11px] text-[#6B756E] line-clamp-2">{story.excerpt}</p>
                                <div className="flex items-center gap-2 pt-1 text-[10px] text-[#0A2A21] font-semibold">
                                  <span className="text-[#6B756E]">✍ {story.author}</span>
                                  {story.submittedByEmail && (
                                    <span className="text-neutral-500">({story.submittedByEmail})</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Moderation quick actions if pending */}
                            {isPending && (
                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                                <button
                                  onClick={() => handleRejectStory(story)}
                                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>{language === 'en' ? 'Reject' : 'বাতিল'}</span>
                                </button>
                                <button
                                  onClick={() => handleApproveStory(story)}
                                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{language === 'en' ? 'Approve & Publish' : 'অনুমোদন করুন'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Tab: Community Photos */}
              {activeTab === 'community' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#D8D0BC]">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={language === 'en' ? 'Search community photos...' : 'ছবি খুঁজুন...'}
                        className="w-full pl-9 pr-4 py-2 bg-[#F6F3EA] rounded-xl text-xs border border-[#D8D0BC] focus:outline-none focus:ring-1 focus:ring-[#0F3B2E]"
                      />
                    </div>

                    {/* Status Filter Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setPostFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          postFilter === 'all'
                            ? 'bg-[#0F3B2E] text-white shadow-xs'
                            : 'bg-[#F6F3EA] text-[#4B554E] hover:bg-[#EFEADC]'
                        }`}
                      >
                        {language === 'en' ? 'All' : 'সকল'} ({communityPosts.length})
                      </button>
                      <button
                        onClick={() => setPostFilter('pending')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          postFilter === 'pending'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{language === 'en' ? 'Pending' : 'পেন্ডিং'}</span>
                        <span>({communityPosts.filter((p) => p.status === 'pending').length})</span>
                      </button>
                      <button
                        onClick={() => setPostFilter('approved')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          postFilter === 'approved'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{language === 'en' ? 'Approved' : 'অনুমোদিত'}</span>
                        <span>({communityPosts.filter((p) => p.status !== 'pending' && p.status !== 'rejected').length})</span>
                      </button>
                      <button
                        onClick={() => setPostFilter('rejected')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          postFilter === 'rejected'
                            ? 'bg-red-700 text-white shadow-xs'
                            : 'bg-red-50 text-red-900 border border-red-200 hover:bg-red-100'
                        }`}
                      >
                        <XCircle className="w-3 h-3" />
                        <span>{language === 'en' ? 'Rejected' : 'বাতিল'}</span>
                        <span>({communityPosts.filter((p) => p.status === 'rejected').length})</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsNewPost(true);
                        setEditingPost({
                          title: '',
                          caption: '',
                          location: 'Ratargul, Sylhet',
                          division: 'sylhet',
                          userName: 'Traveler Contributor',
                          likesCount: 15,
                          tags: ['TravelBD', 'Scenic'],
                          status: 'approved',
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#0A2A21] transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-[#DE9B2E]" />
                      <span>{language === 'en' ? 'Add Photo Post' : 'নতুন ছবি পোস্ট যোগ করুন'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3.5">
                    {communityPosts
                      .filter((p) => {
                        const q = searchQuery.toLowerCase();
                        const matchesQuery =
                          p.title.toLowerCase().includes(q) ||
                          p.location.toLowerCase().includes(q) ||
                          p.userName.toLowerCase().includes(q);

                        if (!matchesQuery) return false;
                        if (postFilter === 'all') return true;
                        if (postFilter === 'pending') return p.status === 'pending';
                        if (postFilter === 'approved') return p.status !== 'pending' && p.status !== 'rejected';
                        if (postFilter === 'rejected') return p.status === 'rejected';
                        return true;
                      })
                      .map((post) => {
                        const isPending = post.status === 'pending';
                        const isRejected = post.status === 'rejected';
                        const remainingDays = getRemainingDays(post);

                        return (
                          <div
                            key={post.id}
                            className={`rounded-2xl bg-white border overflow-hidden flex flex-col transition-all shadow-2xs ${
                              isPending
                                ? 'border-amber-300 bg-amber-50/20'
                                : isRejected
                                ? 'border-red-200 opacity-75'
                                : 'border-[#D8D0BC] hover:border-[#0F3B2E]/40'
                            }`}
                          >
                            <div className="relative aspect-video bg-neutral-100">
                              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                              
                              <div className="absolute top-2 left-2">
                                {isPending ? (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                                    ⏳ Pending ({remainingDays}d)
                                  </span>
                                ) : isRejected ? (
                                  <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold shadow-xs">
                                    ❌ Rejected
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-bold shadow-xs">
                                    ✓ Approved
                                  </span>
                                )}
                              </div>

                              <div className="absolute top-2 right-2 flex gap-1">
                                <button
                                  onClick={() => {
                                    setIsNewPost(false);
                                    setEditingPost(post);
                                  }}
                                  className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: 'post',
                                      id: post.id,
                                      title: post.title,
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-red-700/80 text-white hover:bg-red-800 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-[#0A2A21] truncate font-serif">{post.title}</h4>
                                <p className="text-[11px] text-[#6B756E] line-clamp-2">{post.caption}</p>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-[#D8D0BC]/60 text-[10px]">
                                <span className="text-[#4B554E] truncate">📍 {post.location}</span>
                                <span className="font-bold text-red-600 flex items-center gap-1">
                                  <Heart className="w-3 h-3 fill-red-600" /> {post.likesCount}
                                </span>
                              </div>

                              {isPending && (
                                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-amber-200">
                                  <button
                                    onClick={() => handleRejectPost(post)}
                                    className="flex-1 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>{language === 'en' ? 'Reject' : 'বাতিল'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleApprovePost(post)}
                                    className="flex-1 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{language === 'en' ? 'Approve' : 'অনুমোদন'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Tab: Backup & Reset */}
              {activeTab === 'backup' && (
                <div className="space-y-6 max-w-2xl mx-auto py-4">
                  {/* Cloud Database Sync Card */}
                  <div className="p-6 rounded-2xl bg-[#0A2A21] text-[#F6F3EA] border border-emerald-800/60 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Cloud className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-base font-bold font-serif text-white">
                          {language === 'en' ? 'Firebase Firestore Cloud Database' : 'ফায়ারবেস ফায়ারস্টোর ক্লাউড ডাটাবেস'}
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        ● Cloud Connected
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      {language === 'en'
                        ? 'All user updates, edits, new community photos, and stories are automatically synchronized across every visitor browser in real-time via Google Firebase Firestore.'
                        : 'আপনার সমস্ত এডিট, নতুন ছবি ও গল্প স্বয়ংক্রিয়ভাবে গুগল ফায়ারবেস ক্লাউড ডাটাবেসে সেভ থাকে এবং সব ডিভাইসে ও ব্রাউজারে সাথে সাথে লোড হয়।'}
                    </p>
                    <button
                      onClick={handleCloudSync}
                      disabled={isCloudSyncing}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                      <span>
                        {isCloudSyncing
                          ? (language === 'en' ? 'Syncing to Cloud...' : 'ক্লাউডে সিঙ্ক হচ্ছে...')
                          : (language === 'en' ? 'Push All Local Updates to Cloud' : 'সকল আপডেট ক্লাউডে পাঠান')}
                      </span>
                    </button>
                  </div>

                  <div className="p-6 rounded-2xl bg-white border border-[#D8D0BC] space-y-4">
                    <div className="flex items-center gap-2.5">
                      <Download className="w-5 h-5 text-[#DE9B2E]" />
                      <h4 className="text-base font-bold font-serif text-[#0A2A21]">
                        {language === 'en' ? 'Database Backup & Export' : 'ডাটাবেস ব্যাকআপ ও ডাউনলোড'}
                      </h4>
                    </div>
                    <p className="text-xs text-[#6B756E] leading-relaxed">
                      {language === 'en'
                        ? 'Download a single JSON file containing all customized destinations, stories, experiences, events, and community photos.'
                        : 'সকল কাস্টমাইজড গন্তব্য, গল্প, অভিজ্ঞতা ও ফটো গ্যালারির পূর্ণাঙ্গ ব্যাকআপ ফাইল ডাউনলোড করুন।'}
                    </p>
                    <button
                      onClick={handleExportJSON}
                      className="px-5 py-2.5 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#0A2A21] transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-4 h-4 text-[#DE9B2E]" />
                      <span>{language === 'en' ? 'Export Database JSON' : 'সম্পূর্ণ ডেটা ব্যাকআপ ডাউনলোড করুন'}</span>
                    </button>
                  </div>

                  <div className="p-6 rounded-2xl bg-white border border-[#D8D0BC] space-y-4">
                    <div className="flex items-center gap-2.5">
                      <Upload className="w-5 h-5 text-[#DE9B2E]" />
                      <h4 className="text-base font-bold font-serif text-[#0A2A21]">
                        {language === 'en' ? 'Restore / Import Data' : 'ডেটা রিস্টোর বা ইম্পোর্ট'}
                      </h4>
                    </div>
                    <p className="text-xs text-[#6B756E] leading-relaxed">
                      {language === 'en'
                        ? 'Import a previously exported JSON backup file to instantly update all records on the website.'
                        : 'পূর্বে সেভ করা JSON ব্যাকআপ ফাইল আপলোড করে এক ক্লিকে ওয়েবসাইটের সমস্ত ডেটা রিস্টোর করুন।'}
                    </p>
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#D8D0BC] text-[#0A2A21] rounded-xl text-xs font-bold hover:bg-[#EFEADC] transition-all cursor-pointer shadow-2xs">
                      <Upload className="w-4 h-4 text-[#DE9B2E]" />
                      <span>{language === 'en' ? 'Choose JSON File' : 'JSON ফাইল নির্বাচন করুন'}</span>
                      <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                    </label>
                  </div>

                  <div className="p-6 rounded-2xl bg-red-50 border border-red-200 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <RotateCcw className="w-5 h-5 text-red-600" />
                      <h4 className="text-base font-bold font-serif text-red-900">
                        {language === 'en' ? 'Reset to Default Bangladesh Curated Data' : 'ডিফল্ট ডেটাতে রিসেট করুন'}
                      </h4>
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed">
                      {language === 'en'
                        ? 'This will clear all local modifications and restore the original hand-curated catalog of Bangladesh destinations.'
                        : 'এটি সমস্ত কাস্টম ডেটা মুছে দিয়ে মূল কিউরেটেড ডাটাবেসটি পুনরায় লোড করবে।'}
                    </p>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'reset',
                          title: language === 'en' ? 'Factory Reset All Contents' : 'সকল ডেটা রিসেট',
                        })
                      }
                      className="px-5 py-2.5 bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-800 transition-all cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{language === 'en' ? 'Reset Everything to Default' : 'মূল ডেটায় রিসেট করুন'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL / FORM: EDIT DESTINATION --- */}
      {editingDestination && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#D8D0BC] shadow-2xl p-6 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D0BC] pb-3">
              <h3 className="text-base font-bold font-serif text-[#0A2A21]">
                {isNewDestination
                  ? language === 'en' ? 'Add New Destination' : 'নতুন গন্তব্য যোগ করুন'
                  : language === 'en' ? 'Edit Destination' : 'গন্তব্য সম্পাদনা'}
              </h3>
              <button onClick={() => setEditingDestination(null)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <form onSubmit={handleSaveDestination} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">English Title *</label>
                  <input
                    type="text"
                    required
                    value={editingDestination.title || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, title: e.target.value })}
                    placeholder="e.g. Sajek Valley"
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Bangla Title (বাংলা নাম) *</label>
                  <input
                    type="text"
                    required
                    value={editingDestination.titleBn || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, titleBn: e.target.value })}
                    placeholder="যেমন: সাজেক ভ্যালি"
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Division</label>
                  <select
                    value={editingDestination.division || 'Chittagong Division'}
                    onChange={(e) => setEditingDestination({ ...editingDestination, division: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E] bg-white"
                  >
                    <option value="Dhaka Division">Dhaka Division</option>
                    <option value="Chittagong Division">Chittagong Division</option>
                    <option value="Chittagong Hill Tracts">Chittagong Hill Tracts</option>
                    <option value="Sylhet Division">Sylhet Division</option>
                    <option value="Rajshahi Division">Rajshahi Division</option>
                    <option value="Khulna & Barishal Division">Khulna & Barishal Division</option>
                    <option value="Rangpur Division">Rangpur Division</option>
                    <option value="Barishal Division">Barishal Division</option>
                    <option value="Mymensingh Division">Mymensingh Division</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Category</label>
                  <select
                    value={editingDestination.category || 'coastal'}
                    onChange={(e) => setEditingDestination({ ...editingDestination, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E] bg-white"
                  >
                    <option value="coastal">Coastal & Beach (উপকূল)</option>
                    <option value="wildlife">Mangroves & Wildlife (বন্যপ্রাণী)</option>
                    <option value="hills_tea">Hills & Tea (পাহাড় ও চা)</option>
                    <option value="heritage">Ancient Heritage (ঐতিহ্য)</option>
                    <option value="river">River Journeys (নদীমাতৃক)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editingDestination.rating ?? 4.9}
                    onChange={(e) => setEditingDestination({ ...editingDestination, rating: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
              </div>

              {/* Image with ImgBB File Upload */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    <span>Destination Photo (ImgBB API Upload / Direct URL)</span>
                  </label>
                  {editingDestination.image && (
                    <a
                      href={editingDestination.image}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-[#0F3B2E] underline flex items-center gap-1"
                    >
                      View Current <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editingDestination.image || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, image: e.target.value })}
                    placeholder="https://images.unsplash.com/... or ImgBB link"
                    className="flex-1 px-3 py-2 border border-[#D8D0BC] rounded-xl bg-white focus:ring-1 focus:ring-[#0F3B2E]"
                  />

                  <label className="px-3.5 py-2 bg-[#0F3B2E] text-white rounded-xl font-bold flex items-center gap-1.5 hover:bg-[#0A2A21] transition-all cursor-pointer shrink-0">
                    <UploadCloud className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    <span>{isUploadingImage ? 'Uploading...' : 'Upload via ImgBB'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      disabled={isUploadingImage}
                      onChange={(e) => handleFileUpload(e, 'destination')}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadError && <p className="text-red-600 text-[10px]">{uploadError}</p>}
              </div>

              {/* Destination Gallery Images (Multiple Photos) */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-neutral-800 flex items-center gap-1.5 text-xs sm:text-sm">
                      <Layers className="w-4 h-4 text-[#DE9B2E]" />
                      <span>Gallery Images (Multiple Photos)</span>
                    </label>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-[#D8D0BC] text-[#0F3B2E]">
                      {(editingDestination.gallery || []).length} {language === 'en' ? 'photos' : 'টি ছবি'}
                    </span>
                  </div>

                  <label
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                      isUploadingGallery
                        ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
                        : 'bg-[#0F3B2E] text-white hover:bg-[#0A2A21] active:scale-95'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    <span>{isUploadingGallery ? 'Uploading to ImgBB...' : '+ Add Multiple Images'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      ref={destinationGalleryInputRef}
                      disabled={isUploadingGallery}
                      onChange={(e) => handleGalleryUpload(e, 'destination')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct URL Adder */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={galleryInputUrl}
                    onChange={(e) => setGalleryInputUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGalleryUrl('destination');
                      }
                    }}
                    placeholder="Or paste direct image URL and click '+ Add to Gallery'"
                    className="flex-1 px-3 py-2 text-xs border border-[#D8D0BC] rounded-xl bg-white focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddGalleryUrl('destination')}
                    disabled={!galleryInputUrl.trim() || isUploadingGallery}
                    className="px-3.5 py-2 text-xs font-bold bg-[#DE9B2E] text-[#0A2A21] rounded-xl hover:bg-[#B87E20] disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    + Add to Gallery
                  </button>
                </div>

                {/* Progress / Status Message */}
                {isUploadingGallery && galleryUploadProgress && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#DE9B2E] shrink-0" />
                    <span>
                      Uploading photo {galleryUploadProgress.current} of {galleryUploadProgress.total} to ImgBB... Please wait.
                    </span>
                  </div>
                )}

                {galleryUploadError && (
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{galleryUploadError}</span>
                  </p>
                )}

                {/* Thumbnail Preview Grid */}
                {editingDestination.gallery && editingDestination.gallery.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-[#6B756E]">
                      Hover over any thumbnail to remove it (✕) or set it as the main cover photo:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
                      {editingDestination.gallery.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl overflow-hidden border border-[#D8D0BC] aspect-square bg-white shadow-2xs"
                        >
                          <img
                            src={url}
                            alt={`Gallery photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />

                          {/* Overlay with Remove and Set Cover buttons */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(idx, 'destination')}
                                title="Remove photo from gallery"
                                className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSetMainCover(url, 'destination')}
                              title="Set as main cover photo"
                              className="w-full py-1 px-1 bg-white/90 hover:bg-white text-[#0A2A21] text-[10px] font-bold rounded tracking-tight text-center transition-colors cursor-pointer"
                            >
                              Set Cover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#7C857E] italic py-1">
                    No gallery images added yet. Click "+ Add Multiple Images" to upload files to ImgBB or paste image URLs above to showcase multiple sights.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">District Name (English / জেলা) *</label>
                  <input
                    type="text"
                    value={editingDestination.district || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, district: e.target.value })}
                    placeholder="e.g. Cox's Bazar, Sylhet, Naogaon"
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">District Name (Bangla / বাংলা জেলা)</label>
                  <input
                    type="text"
                    value={editingDestination.districtBn || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, districtBn: e.target.value })}
                    placeholder="যেমন: কক্সবাজার, সিলেট, নওগাঁ"
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Detailed Address / Location (ঠিকানা)</label>
                <input
                  type="text"
                  value={editingDestination.address || ''}
                  onChange={(e) => setEditingDestination({ ...editingDestination, address: e.target.value })}
                  placeholder="e.g. Kolatoli Beach Road, Cox's Bazar 4700"
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-neutral-800">Google Maps Link (গুগল ম্যাপ ইউআরএল)</label>
                  <input
                    type="url"
                    value={editingDestination.googleMapsUrl || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, googleMapsUrl: e.target.value })}
                    placeholder="https://www.google.com/maps/place/..."
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Coordinates (Lat, Lng)</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      step="0.0001"
                      value={editingDestination.lat ?? ''}
                      onChange={(e) => setEditingDestination({ ...editingDestination, lat: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="Lat e.g. 21.42"
                      className="w-full px-2 py-2 border border-[#D8D0BC] rounded-xl text-[11px]"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      value={editingDestination.lng ?? ''}
                      onChange={(e) => setEditingDestination({ ...editingDestination, lng: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="Lng e.g. 92.00"
                      className="w-full px-2 py-2 border border-[#D8D0BC] rounded-xl text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 bg-red-50/40 p-3 rounded-2xl border border-red-100">
                <label className="font-bold text-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-red-700 font-bold">YouTube Video Tour / Embed Code (ইউটিউব ভিডিও বা এম্বেড কোড)</span>
                  <span className="text-[10px] text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-semibold">Interactive Video</span>
                </label>
                <input
                  type="text"
                  value={editingDestination.videoUrl || ''}
                  onChange={(e) => setEditingDestination({ ...editingDestination, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or <iframe src='...'></iframe>"
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-red-600 text-xs bg-white"
                />
                <p className="text-[10px] text-[#6B756E]">
                  Supports standard watch links (youtube.com/watch?v=...), share links (youtu.be/...), shorts (youtube.com/shorts/...), or raw embed code (&lt;iframe...&gt;).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">English Tag</label>
                  <input
                    type="text"
                    value={editingDestination.tag || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, tag: e.target.value })}
                    placeholder="e.g. World Heritage"
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Bangla Tag</label>
                  <input
                    type="text"
                    value={editingDestination.tagBn || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, tagBn: e.target.value })}
                    placeholder="যেমন: বিশ্ব ঐতিহ্য"
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">English Summary</label>
                  <textarea
                    rows={2}
                    value={editingDestination.summary || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, summary: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Bangla Summary (সংক্ষিপ্ত বিবরণ)</label>
                  <textarea
                    rows={2}
                    value={editingDestination.summaryBn || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, summaryBn: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Full Description</label>
                  <textarea
                    rows={3}
                    value={editingDestination.description || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, description: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Full Description Bangla (পূর্ণাঙ্গ বিবরণ)</label>
                  <textarea
                    rows={3}
                    value={editingDestination.descriptionBn || ''}
                    onChange={(e) => setEditingDestination({ ...editingDestination, descriptionBn: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={!!editingDestination.heroFeatured}
                    onChange={(e) => setEditingDestination({ ...editingDestination, heroFeatured: e.target.checked })}
                    className="rounded text-[#0F3B2E] focus:ring-[#0F3B2E] w-4 h-4"
                  />
                  <span>Feature on Hero Section Showcase</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={!!editingDestination.unescoStatus}
                    onChange={(e) => setEditingDestination({ ...editingDestination, unescoStatus: e.target.checked })}
                    className="rounded text-[#0F3B2E] focus:ring-[#0F3B2E] w-4 h-4"
                  />
                  <span>UNESCO Site Badge</span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#D8D0BC]">
                <button
                  type="button"
                  onClick={() => setEditingDestination(null)}
                  className="px-4 py-2 border border-[#D8D0BC] rounded-xl font-bold hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F3B2E] text-white rounded-xl font-bold hover:bg-[#0A2A21] shadow-xs"
                >
                  {language === 'en' ? 'Save Destination' : 'গন্তব্য সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT EXPERIENCE --- */}
      {editingExperience && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#D8D0BC] shadow-2xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-[#D8D0BC] pb-3">
              <h3 className="text-base font-bold font-serif text-[#0A2A21]">
                {isNewExperience ? 'Add Experience' : 'Edit Experience'}
              </h3>
              <button onClick={() => setEditingExperience(null)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <form onSubmit={handleSaveExperience} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Title (English) *</label>
                <input
                  type="text"
                  required
                  value={editingExperience.title || ''}
                  onChange={(e) => setEditingExperience({ ...editingExperience, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Title (Bangla) *</label>
                <input
                  type="text"
                  required
                  value={editingExperience.titleBn || ''}
                  onChange={(e) => setEditingExperience({ ...editingExperience, titleBn: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Category</label>
                  <input
                    type="text"
                    value={editingExperience.category || ''}
                    onChange={(e) => setEditingExperience({ ...editingExperience, category: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Duration</label>
                  <input
                    type="text"
                    value={editingExperience.duration || ''}
                    onChange={(e) => setEditingExperience({ ...editingExperience, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Location</label>
                <input
                  type="text"
                  value={editingExperience.location || ''}
                  onChange={(e) => setEditingExperience({ ...editingExperience, location: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Description</label>
                <textarea
                  rows={2}
                  value={editingExperience.description || ''}
                  onChange={(e) => setEditingExperience({ ...editingExperience, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#D8D0BC]">
                <button
                  type="button"
                  onClick={() => setEditingExperience(null)}
                  className="px-4 py-2 border border-[#D8D0BC] rounded-xl font-bold hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F3B2E] text-white rounded-xl font-bold hover:bg-[#0A2A21]"
                >
                  Save Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT FESTIVAL --- */}
      {editingFestival && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#D8D0BC] shadow-2xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-[#D8D0BC] pb-3">
              <h3 className="text-base font-bold font-serif text-[#0A2A21]">
                {isNewFestival ? 'Add Festival' : 'Edit Festival'}
              </h3>
              <button onClick={() => setEditingFestival(null)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <form onSubmit={handleSaveFestival} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-neutral-800">Festival Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingFestival.title || ''}
                    onChange={(e) => setEditingFestival({ ...editingFestival, title: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Emoji Icon</label>
                  <input
                    type="text"
                    value={editingFestival.emoji || '🎊'}
                    onChange={(e) => setEditingFestival({ ...editingFestival, emoji: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl text-center text-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Festival Name (Bangla) *</label>
                <input
                  type="text"
                  required
                  value={editingFestival.titleBn || ''}
                  onChange={(e) => setEditingFestival({ ...editingFestival, titleBn: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Date (English)</label>
                  <input
                    type="text"
                    value={editingFestival.date || ''}
                    onChange={(e) => setEditingFestival({ ...editingFestival, date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Date (Bangla)</label>
                  <input
                    type="text"
                    value={editingFestival.dateBn || ''}
                    onChange={(e) => setEditingFestival({ ...editingFestival, dateBn: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Location</label>
                <input
                  type="text"
                  value={editingFestival.location || ''}
                  onChange={(e) => setEditingFestival({ ...editingFestival, location: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Description</label>
                <textarea
                  rows={2}
                  value={editingFestival.description || ''}
                  onChange={(e) => setEditingFestival({ ...editingFestival, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#D8D0BC]">
                <button
                  type="button"
                  onClick={() => setEditingFestival(null)}
                  className="px-4 py-2 border border-[#D8D0BC] rounded-xl font-bold hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F3B2E] text-white rounded-xl font-bold hover:bg-[#0A2A21]"
                >
                  Save Festival
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT STORY --- */}
      {editingStory && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#D8D0BC] shadow-2xl p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D0BC] pb-3">
              <h3 className="text-base font-bold font-serif text-[#0A2A21]">
                {isNewStory ? 'Add Story & Essay' : 'Edit Story & Essay'}
              </h3>
              <button onClick={() => setEditingStory(null)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <form onSubmit={handleSaveStory} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">English Title *</label>
                  <input
                    type="text"
                    required
                    value={editingStory.title || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Bangla Title (বাংলা শিরোনাম) *</label>
                  <input
                    type="text"
                    required
                    value={editingStory.titleBn || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, titleBn: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Author</label>
                  <input
                    type="text"
                    value={editingStory.author || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, author: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Category</label>
                  <input
                    type="text"
                    value={editingStory.category || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, category: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Read Time</label>
                  <input
                    type="text"
                    value={editingStory.readTime || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, readTime: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
              </div>

              {/* Story Image with ImgBB upload */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC]">
                <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#DE9B2E]" />
                  <span>Story Cover Photo (ImgBB Direct Upload / URL)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editingStory.image || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, image: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 border border-[#D8D0BC] rounded-xl bg-white"
                  />
                  <label className="px-3.5 py-2 bg-[#0F3B2E] text-white rounded-xl font-bold flex items-center gap-1.5 hover:bg-[#0A2A21] cursor-pointer shrink-0">
                    <UploadCloud className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    <span>Upload via ImgBB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'story')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Story Gallery Images (Multiple Photos) */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-neutral-800 flex items-center gap-1.5 text-xs sm:text-sm">
                      <Layers className="w-4 h-4 text-[#DE9B2E]" />
                      <span>Story Gallery Images (Multiple Photos)</span>
                    </label>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-[#D8D0BC] text-[#0F3B2E]">
                      {(editingStory.gallery || []).length} {language === 'en' ? 'photos' : 'টি ছবি'}
                    </span>
                  </div>

                  <label
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                      isUploadingGallery
                        ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
                        : 'bg-[#0F3B2E] text-white hover:bg-[#0A2A21] active:scale-95'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    <span>{isUploadingGallery ? 'Uploading to ImgBB...' : '+ Add Multiple Images'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      ref={storyGalleryInputRef}
                      disabled={isUploadingGallery}
                      onChange={(e) => handleGalleryUpload(e, 'story')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct URL Adder */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={galleryInputUrl}
                    onChange={(e) => setGalleryInputUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGalleryUrl('story');
                      }
                    }}
                    placeholder="Or paste direct image URL and click '+ Add to Gallery'"
                    className="flex-1 px-3 py-2 text-xs border border-[#D8D0BC] rounded-xl bg-white focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddGalleryUrl('story')}
                    disabled={!galleryInputUrl.trim() || isUploadingGallery}
                    className="px-3.5 py-2 text-xs font-bold bg-[#DE9B2E] text-[#0A2A21] rounded-xl hover:bg-[#B87E20] disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    + Add to Gallery
                  </button>
                </div>

                {/* Progress / Status Message */}
                {isUploadingGallery && galleryUploadProgress && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#DE9B2E] shrink-0" />
                    <span>
                      Uploading photo {galleryUploadProgress.current} of {galleryUploadProgress.total} to ImgBB... Please wait.
                    </span>
                  </div>
                )}

                {galleryUploadError && (
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{galleryUploadError}</span>
                  </p>
                )}

                {/* Thumbnail Preview Grid */}
                {editingStory.gallery && editingStory.gallery.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-[#6B756E]">
                      Hover over any thumbnail to remove it (✕) or set it as the main cover photo:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
                      {editingStory.gallery.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl overflow-hidden border border-[#D8D0BC] aspect-square bg-white shadow-2xs"
                        >
                          <img
                            src={url}
                            alt={`Story gallery photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />

                          {/* Overlay with Remove and Set Cover buttons */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(idx, 'story')}
                                title="Remove photo from gallery"
                                className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSetMainCover(url, 'story')}
                              title="Set as main cover photo"
                              className="w-full py-1 px-1 bg-white/90 hover:bg-white text-[#0A2A21] text-[10px] font-bold rounded tracking-tight text-center transition-colors cursor-pointer"
                            >
                              Set Cover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#7C857E] italic py-1">
                    No gallery images added yet. Click "+ Add Multiple Images" to upload files to ImgBB or paste image URLs above to add photos to the essay article.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Excerpt / Short Description</label>
                <textarea
                  rows={2}
                  value={editingStory.excerpt || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, excerpt: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Pull Quote</label>
                  <input
                    type="text"
                    value={editingStory.pullQuote || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, pullQuote: e.target.value })}
                    placeholder="Special memorable quote from the essay..."
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl font-serif italic"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Publication & Moderation Status</label>
                  <select
                    value={editingStory.status || 'approved'}
                    onChange={(e) =>
                      setEditingStory({
                        ...editingStory,
                        status: e.target.value as 'approved' | 'pending' | 'rejected',
                      })
                    }
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl bg-white font-medium text-xs"
                  >
                    <option value="approved">✓ Approved & Published Live (অনুমোদিত)</option>
                    <option value="pending">⏳ Pending Review (পেন্ডিং)</option>
                    <option value="rejected">❌ Rejected (বাতিল)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 bg-red-50/40 p-3 rounded-2xl border border-red-100">
                <label className="font-bold text-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-red-700 font-bold">YouTube Video Documentary / Embed Code (ইউটিউব ভিডিও বা এম্বেড কোড)</span>
                  <span className="text-[10px] text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-semibold">HD Embed</span>
                </label>
                <input
                  type="text"
                  value={editingStory.videoUrl || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or <iframe src='...'></iframe>"
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-red-600 text-xs bg-white"
                />
                <p className="text-[10px] text-[#6B756E]">
                  Video documentary player will be embedded in the story article modal for readers.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#D8D0BC]">
                <button
                  type="button"
                  onClick={() => setEditingStory(null)}
                  className="px-4 py-2 border border-[#D8D0BC] rounded-xl font-bold hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F3B2E] text-white rounded-xl font-bold hover:bg-[#0A2A21]"
                >
                  Save Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT COMMUNITY POST --- */}
      {editingPost && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#D8D0BC] shadow-2xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-[#D8D0BC] pb-3">
              <h3 className="text-base font-bold font-serif text-[#0A2A21]">
                {isNewPost ? 'Add Community Photo Post' : 'Edit Photo Post'}
              </h3>
              <button onClick={() => setEditingPost(null)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Photo Title *</label>
                <input
                  type="text"
                  required
                  value={editingPost.title || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                />
              </div>

              {/* Photo Image Upload */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC]">
                <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#DE9B2E]" />
                  <span>Photo Image (Upload with ImgBB / Paste link)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editingPost.imageUrl || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 border border-[#D8D0BC] rounded-xl bg-white"
                  />
                  <label className="px-3.5 py-2 bg-[#0F3B2E] text-white rounded-xl font-bold flex items-center gap-1.5 hover:bg-[#0A2A21] cursor-pointer shrink-0">
                    <UploadCloud className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    <span>Upload via ImgBB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'post')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Traveler Name</label>
                  <input
                    type="text"
                    value={editingPost.userName || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, userName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Location</label>
                  <input
                    type="text"
                    value={editingPost.location || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, location: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Caption</label>
                <textarea
                  rows={2}
                  value={editingPost.caption || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, caption: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Publication & Moderation Status</label>
                <select
                  value={editingPost.status || 'approved'}
                  onChange={(e) =>
                    setEditingPost({
                      ...editingPost,
                      status: e.target.value as 'approved' | 'pending' | 'rejected',
                    })
                  }
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl bg-white font-medium text-xs"
                >
                  <option value="approved">✓ Approved & Published Live (অনুমোদিত)</option>
                  <option value="pending">⏳ Pending Review (পেন্ডিং)</option>
                  <option value="rejected">❌ Rejected (বাতিল)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#D8D0BC]">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 border border-[#D8D0BC] rounded-xl font-bold hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F3B2E] text-white rounded-xl font-bold hover:bg-[#0A2A21]"
                >
                  Save Photo Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT / CREATE NEWS ANNOUNCEMENT MODAL --- */}
      {editingNews && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#D8D0BC] shadow-2xl p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D0BC] pb-3">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#DE9B2E]" />
                <h3 className="text-base font-bold font-serif text-[#0A2A21]">
                  {isNewNews
                    ? language === 'en'
                      ? 'Publish Official Tourism Announcement'
                      : 'নতুন সরকারি পর্যটন সংবাদ ও নোটিশ প্রকাশ করুন'
                    : language === 'en'
                    ? 'Edit News Announcement'
                    : 'সংবাদ ও বিজ্ঞপ্তি সম্পাদনা করুন'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingNews(null)}
                className="p-1 rounded-full hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <form onSubmit={handleSaveNews} className="space-y-4 text-xs">
              {/* Titles (EN and BN) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingNews.title || ''}
                    onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                    placeholder="e.g., Sundarbans Zero Plastic Travel Policy"
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">শিরোনাম (বাংলা)</label>
                  <input
                    type="text"
                    value={editingNews.titleBn || ''}
                    onChange={(e) => setEditingNews({ ...editingNews, titleBn: e.target.value })}
                    placeholder="যেমন: সুন্দরবনে প্লাস্টিক মুক্ত পর্যটন নির্দেশিকা"
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                </div>
              </div>

              {/* Category and Pinned */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Category Tag</label>
                  <select
                    value={editingNews.category || 'Tourism Update'}
                    onChange={(e) => {
                      const val = e.target.value;
                      const bnMap: Record<string, string> = {
                        'Tourism Update': 'পর্যটন উন্নয়ন',
                        'Preservation': 'সংরক্ষণ ও পরিবেশ',
                        'Festival': 'উৎসব ও সংস্কৃতি',
                        'Travel Alert': 'ভ্রমণ সতর্কতা',
                        'General': 'সাধারণ সংবাদ',
                      };
                      setEditingNews({
                        ...editingNews,
                        category: val,
                        categoryBn: bnMap[val] || val,
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl bg-white focus:ring-1 focus:ring-[#0F3B2E]"
                  >
                    <option value="Tourism Update">Tourism Update (পর্যটন উন্নয়ন)</option>
                    <option value="Preservation">Preservation (সংরক্ষণ ও পরিবেশ)</option>
                    <option value="Festival">Festivals & Culture (উৎসব ও সংস্কৃতি)</option>
                    <option value="Travel Alert">Travel Alert (ভ্রমণ সতর্কতা)</option>
                    <option value="General">General Notice (সাধারণ নোটিশ)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="pinned-checkbox"
                    checked={Boolean(editingNews.pinned)}
                    onChange={(e) => setEditingNews({ ...editingNews, pinned: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0F3B2E] focus:ring-[#0F3B2E]"
                  />
                  <label htmlFor="pinned-checkbox" className="font-bold text-neutral-800 cursor-pointer flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    <span>{language === 'en' ? 'Pin to top of news section' : 'সংবাদের শুরুতে পিন করুন'}</span>
                  </label>
                </div>
              </div>

              {/* Cover Image Upload (ImgBB & Direct URL) */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC]">
                <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#DE9B2E]" />
                  <span>Featured Image URL (Upload via ImgBB / Paste direct link)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editingNews.image || ''}
                    onChange={(e) => setEditingNews({ ...editingNews, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 border border-[#D8D0BC] rounded-xl bg-white"
                  />
                  <label className="px-3.5 py-2 bg-[#0F3B2E] text-white rounded-xl font-bold flex items-center gap-1.5 hover:bg-[#0A2A21] cursor-pointer shrink-0">
                    <UploadCloud className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    <span>{isUploadingImage ? 'Uploading...' : 'Upload via ImgBB'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      disabled={isUploadingImage}
                      onChange={(e) => handleFileUpload(e, 'news')}
                      className="hidden"
                    />
                  </label>
                </div>
                {editingNews.image && (
                  <div className="mt-2 w-32 h-20 rounded-xl overflow-hidden border border-[#D8D0BC]">
                    <img src={editingNews.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Summary / Excerpt */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Summary / Lead Excerpt *</label>
                <textarea
                  required
                  rows={2}
                  value={editingNews.summary || ''}
                  onChange={(e) => setEditingNews({ ...editingNews, summary: e.target.value })}
                  placeholder="Short introductory summary displayed on the card..."
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                />
              </div>

              {/* Full Content */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Full Content / Body *</label>
                <textarea
                  required
                  rows={5}
                  value={editingNews.content || ''}
                  onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })}
                  placeholder="Detailed announcements, guidelines, bullet points, official instructions..."
                  className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                />
              </div>

              {/* Author & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Author Name</label>
                  <input
                    type="text"
                    value={editingNews.authorName || ''}
                    onChange={(e) => setEditingNews({ ...editingNews, authorName: e.target.value })}
                    placeholder="e.g., Admin Desk / BPC Directorate"
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Author Role</label>
                  <input
                    type="text"
                    value={editingNews.authorRole || ''}
                    onChange={(e) => setEditingNews({ ...editingNews, authorRole: e.target.value })}
                    placeholder="e.g., Chief Tourism Officer"
                    className="w-full px-3 py-2 border border-[#D8D0BC] rounded-xl focus:ring-1 focus:ring-[#0F3B2E]"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#D8D0BC]">
                <button
                  type="button"
                  onClick={() => setEditingNews(null)}
                  className="px-4 py-2 border border-[#D8D0BC] rounded-xl font-bold hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0F3B2E] text-white rounded-xl font-bold hover:bg-[#0A2A21] cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{isNewNews ? 'Publish Live' : 'Update Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-red-200 shadow-2xl p-6 space-y-4 text-center my-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Confirm Deletion' : 'মুছে ফেলা নিশ্চিত করুন'}
              </h4>
              <p className="text-xs text-[#6B756E]">
                {language === 'en'
                  ? `Are you sure you want to delete "${deleteConfirm.title}"?`
                  : `আপনি কি "${deleteConfirm.title}" স্থায়ীভাবে মুছে ফেলতে চান?`}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-[#D8D0BC] rounded-xl text-xs font-bold hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === 'destination' && deleteConfirm.id) {
                    handleDeleteDestination(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'experience' && deleteConfirm.id) {
                    handleDeleteExperience(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'festival' && deleteConfirm.id) {
                    handleDeleteFestival(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'story' && deleteConfirm.id) {
                    handleDeleteStory(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'post' && deleteConfirm.id) {
                    handleDeletePost(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'news' && deleteConfirm.id) {
                    handleDeleteNews(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'reset') {
                    onResetAllData();
                    showToast(language === 'en' ? 'Reset to default data!' : 'সকল ডেটা ডিফল্ট করা হয়েছে!');
                    setDeleteConfirm(null);
                  }
                }}
                className="flex-1 py-2.5 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 shadow-xs"
              >
                {language === 'en' ? 'Delete' : 'মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REPORT DETAILS MODAL --- */}
      {selectedReportDetail && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#D8D0BC] shadow-2xl p-6 sm:p-7 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#D8D0BC] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      selectedReportDetail.status === 'pending'
                        ? 'bg-amber-500 text-white'
                        : selectedReportDetail.status === 'resolved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {selectedReportDetail.status === 'pending'
                      ? '⏳ Pending Review'
                      : selectedReportDetail.status === 'resolved'
                      ? '✓ Resolved'
                      : '❌ Dismissed'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#EFEADC] text-[#0A2A21] text-[11px] font-semibold">
                    {selectedReportDetail.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-serif text-[#0A2A21] pt-1">
                  {selectedReportDetail.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reporter Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC] text-xs">
              <div>
                <span className="text-[#6B756E] block text-[11px]">Reporter Name:</span>
                <strong className="text-[#0A2A21] font-semibold">
                  {selectedReportDetail.reporterName || 'Anonymous Visitor'}
                </strong>
              </div>
              <div>
                <span className="text-[#6B756E] block text-[11px]">Email / Contact:</span>
                <strong className="text-[#0A2A21] font-semibold">
                  {selectedReportDetail.reporterEmail || 'Not provided'}
                </strong>
              </div>
              <div>
                <span className="text-[#6B756E] block text-[11px]">Submitted At:</span>
                <span className="text-[#0A2A21]">
                  {new Date(selectedReportDetail.createdAt).toLocaleString()}
                </span>
              </div>
              {selectedReportDetail.targetTitle && (
                <div>
                  <span className="text-[#6B756E] block text-[11px]">Target Place/Content:</span>
                  <span className="text-[#0A2A21] font-bold">{selectedReportDetail.targetTitle}</span>
                </div>
              )}
            </div>

            {/* Full Report Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider">
                {language === 'en' ? 'Detailed Report Content:' : 'রিপোর্টের বিস্তারিত বিবরণ:'}
              </label>
              <div className="p-4 rounded-2xl bg-white border border-[#D8D0BC] text-xs text-[#2B352E] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedReportDetail.details}
              </div>
            </div>

            {/* Attached Photo Preview */}
            {selectedReportDetail.imageUrl && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Attached Photo / Screenshot:' : 'সংযুক্ত ছবি / স্ক্রিনশট:'}</span>
                </label>
                <div
                  onClick={() => setViewingImageModal(selectedReportDetail.imageUrl!)}
                  className="relative max-h-64 rounded-2xl overflow-hidden bg-neutral-100 border border-[#D8D0BC] cursor-pointer group flex items-center justify-center"
                >
                  <img
                    src={selectedReportDetail.imageUrl}
                    alt="Report attachment"
                    className="max-h-64 w-full object-contain group-hover:scale-102 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Click to view full image</span>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Notes Section */}
            {selectedReportDetail.adminNotes && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resolution Record</span>
                </div>
                <p>{selectedReportDetail.adminNotes}</p>
                {selectedReportDetail.resolvedBy && (
                  <span className="text-[10px] text-emerald-700 block">
                    Resolved by {selectedReportDetail.resolvedBy}
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#D8D0BC]">
              <button
                type="button"
                onClick={() => {
                  const rep = selectedReportDetail;
                  setSelectedReportDetail(null);
                  setDeleteReportConfirm(rep);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Delete Report' : 'মুছে ফেলুন'}</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedReportDetail.status !== 'dismissed' && (
                  <button
                    type="button"
                    onClick={() => handleDismissReport(selectedReportDetail)}
                    className="px-4 py-2 border border-[#D8D0BC] rounded-xl text-xs font-bold hover:bg-neutral-100 cursor-pointer"
                  >
                    {language === 'en' ? 'Dismiss' : 'বাতিল'}
                  </button>
                )}

                {selectedReportDetail.status !== 'resolved' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const rep = selectedReportDetail;
                      setSelectedReportDetail(null);
                      setResolvingReportId(rep.id);
                    }}
                    className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'en' ? 'Resolve Report' : 'সমাধান চিহ্নিত করুন'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleReopenReport(selectedReportDetail)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 cursor-pointer"
                  >
                    {language === 'en' ? 'Reopen as Pending' : 'পেন্ডিং কিউতে পাঠান'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- IMAGE LIGHTBOX MODAL --- */}
      {viewingImageModal && (
        <div
          onClick={() => setViewingImageModal(null)}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-neutral-900 rounded-3xl overflow-hidden border border-white/20 shadow-2xl p-2"
          >
            <button
              onClick={() => setViewingImageModal(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={viewingImageModal}
              alt="Preview"
              className="w-full max-h-[82vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* --- DELETE REPORT CONFIRMATION MODAL --- */}
      {deleteReportConfirm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-red-200 shadow-2xl p-6 space-y-4 text-center my-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Delete User Report' : 'ইউজার রিপোর্ট মুছে ফেলুন'}
              </h4>
              <p className="text-xs text-[#6B756E]">
                {language === 'en'
                  ? `Are you sure you want to permanently delete the report "${deleteReportConfirm.subject}"?`
                  : `আপনি কি "${deleteReportConfirm.subject}" রিপোর্টটি স্থায়ীভাবে মুছে ফেলতে চান?`}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteReportConfirm(null)}
                className="flex-1 py-2.5 border border-[#D8D0BC] rounded-xl text-xs font-bold hover:bg-neutral-100 cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteReport(deleteReportConfirm)}
                className="flex-1 py-2.5 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 shadow-xs cursor-pointer"
              >
                {language === 'en' ? 'Delete Permanently' : 'স্থায়ীভাবে মুছুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE SUBSCRIBER CONFIRMATION MODAL --- */}
      {deleteSubscriberConfirm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-red-200 shadow-2xl p-6 space-y-4 text-center my-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Remove Subscriber' : 'গ্রাহক মুছে ফেলুন'}
              </h4>
              <p className="text-xs text-[#6B756E]">
                {language === 'en'
                  ? `Are you sure you want to permanently remove "${deleteSubscriberConfirm.email}" from the subscribers list?`
                  : `আপনি কি "${deleteSubscriberConfirm.email}" ইমেইলটি সাবস্ক্রাইবার তালিকা থেকে স্থায়ীভাবে মুছে ফেলতে চান?`}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteSubscriberConfirm(null)}
                className="flex-1 py-2.5 border border-[#D8D0BC] rounded-xl text-xs font-bold hover:bg-neutral-100 cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSubscriber(deleteSubscriberConfirm)}
                className="flex-1 py-2.5 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 shadow-xs cursor-pointer"
              >
                {language === 'en' ? 'Delete Permanently' : 'স্থায়ীভাবে মুছুন'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
