/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { DestinationsGrid } from './components/DestinationsGrid';
import { ThingsToDoSection } from './components/ThingsToDoSection';
import { FestivalsSection } from './components/FestivalsSection';
import { PostModal } from './components/PostModal';
import { StoriesSection } from './components/StoriesSection';
import { CommunityGallerySection } from './components/CommunityGallerySection';
import { Footer } from './components/Footer';
import { DestinationModal } from './components/DestinationModal';
import { StoryModal } from './components/StoryModal';
import { FestivalModal } from './components/FestivalModal';
import { ExperienceModal } from './components/ExperienceModal';
import { TripPlannerModal } from './components/TripPlannerModal';
import { SearchModal } from './components/SearchModal';
import { SavedModal } from './components/SavedModal';
import { AuthModal } from './components/AuthModal';
import { CommunityShareModal } from './components/CommunityShareModal';
import { StorySubmitModal } from './components/StorySubmitModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SubmitReportModal } from './components/SubmitReportModal';
import { GisMapSection } from './components/GisMapSection';
import { DistrictsSection } from './components/DistrictsSection';
import { RecentShowcaseSlider } from './components/RecentShowcaseSlider';
import { NewsSection } from './components/NewsSection';
import { NewsDetailPage } from './components/NewsDetailPage';
import { AdRenderer } from './components/AdRenderer';
import { InfoPageModal, InfoPageType } from './components/InfoPageModal';
import { NotFoundPage } from './components/NotFoundPage';
import { AdminAccessDenied } from './components/AdminAccessDenied';

import {
  auth,
  onAuthStateChanged,
  db,
  doc,
  getDoc,
  setDoc,
  User,
} from './lib/firebase';
import {
  DESTINATIONS,
  EXPERIENCES,
  FESTIVALS,
  EDITORIAL_STORIES,
  SEED_COMMUNITY_POSTS,
} from './data/bangladeshData';
import { BANGLADESH_DISTRICTS } from './data/bangladeshDistricts';
import { Destination, Experience, Festival, EditorialStory, Language, CommunityPost, AppUser, NewsPost, AllAdsConfig } from './types';
import { getCachedAdsConfig, subscribeToAdsConfig } from './lib/adsService';
import { syncFirebaseUserProfile, checkIsUserAdmin, verifyFirebaseAdminStatus } from './lib/userRoles';
import {
  subscribeToAllFirestoreData,
  saveDestinationToFirebase,
  saveStoryToFirebase,
  saveCommunityPostToFirebase,
} from './lib/firestoreSync';
import { subscribeToNewsPosts, INITIAL_NEWS_SEED } from './lib/newsService';
import {
  updateDestinationSeo,
  updateStorySeo,
  updateFestivalSeo,
  updateExperienceSeo,
  updateDistrictSeo,
  updateInfoPageSeo,
  updateSectionSeo,
  updateNewsSeo,
  resetSeoToDefault,
} from './lib/seo';
import {
  getDestinationSlug,
  findDestinationBySlug,
  getStorySlug,
  findStoryBySlug,
  getFestivalSlug,
  findFestivalBySlug,
  getExperienceSlug,
  findExperienceBySlug,
  getPostSlug,
  findPostBySlug,
  getDistrictSlug,
  findDistrictBySlug,
  getNewsSlug,
  findNewsBySlug,
} from './lib/slugs';
import { getCanonicalDistrict } from './lib/districtMatcher';

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || !item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function MainAppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [language, setLanguage] = useState<Language>('en');
  const [activeSection, setActiveSection] = useState<string>('hero');

  // Dynamic Content Collections with local & cloud persistence
  const [destinations, setDestinations] = useState<Destination[]>(() => {
    try {
      const stored = localStorage.getItem('discover_bd_destinations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 50) {
          const deduped = dedupeById(parsed);
          if (deduped.length !== parsed.length) {
            localStorage.setItem('discover_bd_destinations', JSON.stringify(deduped));
          }
          return deduped;
        }
      }
      return dedupeById(DESTINATIONS);
    } catch {
      return dedupeById(DESTINATIONS);
    }
  });

  const [experiences, setExperiences] = useState<Experience[]>(() => {
    try {
      const stored = localStorage.getItem('discover_bd_experiences');
      return stored ? JSON.parse(stored) : EXPERIENCES;
    } catch {
      return EXPERIENCES;
    }
  });

  const [festivals, setFestivals] = useState<Festival[]>(() => {
    try {
      const stored = localStorage.getItem('discover_bd_festivals');
      return stored ? JSON.parse(stored) : FESTIVALS;
    } catch {
      return FESTIVALS;
    }
  });

  const [stories, setStories] = useState<EditorialStory[]>(() => {
    try {
      const stored = localStorage.getItem('discover_bd_stories');
      return stored ? JSON.parse(stored) : EDITORIAL_STORIES;
    } catch {
      return EDITORIAL_STORIES;
    }
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    try {
      const stored = localStorage.getItem('discover_bd_community_posts');
      return stored ? JSON.parse(stored) : SEED_COMMUNITY_POSTS;
    } catch {
      return SEED_COMMUNITY_POSTS;
    }
  });

  const [newsList, setNewsList] = useState<NewsPost[]>(() => {
    try {
      const stored = localStorage.getItem('discover_bd_news_posts');
      return stored ? JSON.parse(stored) : INITIAL_NEWS_SEED;
    } catch {
      return INITIAL_NEWS_SEED;
    }
  });

  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'profile' | 'forgot_password'>('login');

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    if (auth.currentUser) {
      const fbUser = auth.currentUser;
      return {
        uid: fbUser.uid,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Traveler',
        email: fbUser.email || null,
        photoURL: fbUser.photoURL || null,
        role: 'user',
        isAnonymous: fbUser.isAnonymous,
        createdAt: fbUser.metadata?.creationTime ? Date.parse(fbUser.metadata.creationTime) : Date.now(),
      };
    }
    try {
      const stored = localStorage.getItem('discover_bd_user_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('discover_bd_saved');
      return stored ? JSON.parse(stored) : ['coxs-bazar', 'sylhet-tea'];
    } catch {
      return ['coxs-bazar', 'sylhet-tea'];
    }
  });

  // Routing and 404 state
  const [is404, setIs404] = useState<boolean>(false);
  const [notFoundType, setNotFoundType] = useState<'destination' | 'news' | 'post' | 'festival' | 'experience' | 'district' | 'page'>('page');
  const [notFoundSlug, setNotFoundSlug] = useState<string>('');
  const [isAdminAccessDenied, setIsAdminAccessDenied] = useState<boolean>(false);

  // Modals state
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedStory, setSelectedStory] = useState<EditorialStory | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedCommunityPostId, setSelectedCommunityPostId] = useState<string | null>(null);
  const [selectedNewsPost, setSelectedNewsPost] = useState<NewsPost | null>(null);
  const [infoPage, setInfoPage] = useState<InfoPageType | null>(null);

  const [isTripPlannerOpen, setIsTripPlannerOpen] = useState(false);
  const [tripPlannerPreselect, setTripPlannerPreselect] = useState<Destination | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isStorySubmitOpen, setIsStorySubmitOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Smooth scroll progress and scroll-to-top tracking
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setShowScrollTop(currentScroll > 350);
      if (totalScroll > 0) {
        setScrollProgress(Math.min(1, Math.max(0, currentScroll / totalScroll)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Subscribe to real-time news
  useEffect(() => {
    const unsub = subscribeToNewsPosts((posts) => {
      if (posts && posts.length > 0) {
        setNewsList(posts);
      }
    });
    return unsub;
  }, []);

  // Dynamic Ads Management State & Realtime Sync
  const [adsConfig, setAdsConfig] = useState<AllAdsConfig>(() => getCachedAdsConfig());

  useEffect(() => {
    const unsub = subscribeToAdsConfig((updated) => {
      setAdsConfig(updated);
    });
    return unsub;
  }, []);

  // Synchronize route pathname and search params with views, 404, RBAC admin, and SEO
  useEffect(() => {
    const pathname = location.pathname.length > 1 ? location.pathname.replace(/\/+$/, '') : location.pathname;
    const searchParams = new URLSearchParams(location.search);

    // Sync language if query param present
    const langParam = searchParams.get('lang');
    if (langParam === 'bn' || langParam === 'en') {
      setLanguage(langParam as Language);
    }

    // Reset transient routing states
    setIs404(false);
    setIsAdminAccessDenied(false);

    // 1. Home Route: /
    if (pathname === '/') {
      setSelectedDestination(null);
      setSelectedStory(null);
      setSelectedCommunityPostId(null);
      setSelectedFestival(null);
      setSelectedExperience(null);
      setSelectedNewsPost(null);
      setInfoPage(null);
      setIsAdminOpen(false);

      if (activeSection && activeSection !== 'hero') {
        updateSectionSeo(activeSection, language);
      } else {
        resetSeoToDefault(language);
      }
      return;
    }

    // 2. Section Scroll Routes: /destinations, /news, /community
    if (pathname === '/destinations') {
      setActiveSection('destinations');
      setTimeout(() => {
        const el = document.getElementById('destinations');
        if (el) {
          const yOffset = -90;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 50);
      updateSectionSeo('destinations', language);
      return;
    }

    if (pathname === '/news') {
      setActiveSection('news');
      setSelectedNewsPost(null);
      setTimeout(() => {
        const el = document.getElementById('news');
        if (el) {
          const yOffset = -90;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    if (pathname === '/community') {
      setActiveSection('community');
      setTimeout(() => {
        const el = document.getElementById('community');
        if (el) {
          const yOffset = -90;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 50);
      updateSectionSeo('gallery', language);
      return;
    }

    // 3. User Profile Route: /profile
    if (pathname === '/profile') {
      const isAuth = Boolean(currentUser || auth.currentUser);
      if (isAuth) {
        setAuthModalMode('profile');
      } else {
        setAuthModalMode('login');
      }
      setIsAuthModalOpen(true);
      return;
    }

    // 4. Admin Protected Route: /admin
    if (pathname === '/admin') {
      const isVerifiedAdmin = checkIsUserAdmin(currentUser);
      if (isVerifiedAdmin) {
        setIsAdminOpen(true);
        setIsAdminAccessDenied(false);
      } else {
        setIsAdminOpen(false);
        setIsAdminAccessDenied(true);
      }
      return;
    }

    // 5. Destination Dynamic Route: /destination/:slug
    if (pathname.startsWith('/destination/')) {
      const slug = decodeURIComponent(pathname.replace('/destination/', '').trim());
      const dest = findDestinationBySlug(destinations, slug);
      if (dest) {
        setSelectedDestination(dest);
        setIs404(false);
        updateDestinationSeo(dest, language);
      } else {
        setSelectedDestination(null);
        setIs404(true);
        setNotFoundType('destination');
        setNotFoundSlug(slug);
      }
      return;
    }

    // 6. News Dynamic Route: /news/:slug
    if (pathname.startsWith('/news/')) {
      const slug = decodeURIComponent(pathname.replace('/news/', '').trim());
      const news = findNewsBySlug(newsList, slug);
      if (news) {
        setSelectedNewsPost(news);
        setIs404(false);
        updateNewsSeo(news, language);
      } else {
        setSelectedNewsPost(null);
        setIs404(true);
        setNotFoundType('news');
        setNotFoundSlug(slug);
      }
      return;
    }

    // 7. Post / Story Dynamic Route: /post/:slug or /story/:slug
    if (pathname.startsWith('/post/') || pathname.startsWith('/story/')) {
      const slug = decodeURIComponent(pathname.replace(/^\/(post|story)\//, '').trim());
      const story = findStoryBySlug(stories, slug);
      if (story) {
        setSelectedStory(story);
        setSelectedCommunityPostId(null);
        setIs404(false);
        updateStorySeo(story, language);
        return;
      }

      const post = findPostBySlug(communityPosts, slug);
      if (post) {
        setSelectedCommunityPostId(post.id);
        setSelectedStory(null);
        setIs404(false);
        return;
      }

      setSelectedStory(null);
      setSelectedCommunityPostId(null);
      setIs404(true);
      setNotFoundType('post');
      setNotFoundSlug(slug);
      return;
    }

    // 8. Festival Dynamic Route: /festival/:slug
    if (pathname.startsWith('/festival/')) {
      const slug = decodeURIComponent(pathname.replace('/festival/', '').trim());
      const fest = findFestivalBySlug(festivals, slug);
      if (fest) {
        setSelectedFestival(fest);
        setIs404(false);
        updateFestivalSeo(fest, language);
      } else {
        setSelectedFestival(null);
        setIs404(true);
        setNotFoundType('festival');
        setNotFoundSlug(slug);
      }
      return;
    }

    // 9. Experience Dynamic Route: /experience/:slug
    if (pathname.startsWith('/experience/')) {
      const slug = decodeURIComponent(pathname.replace('/experience/', '').trim());
      const exp = findExperienceBySlug(experiences, slug);
      if (exp) {
        setSelectedExperience(exp);
        setIs404(false);
        updateExperienceSeo(exp, language);
      } else {
        setSelectedExperience(null);
        setIs404(true);
        setNotFoundType('experience');
        setNotFoundSlug(slug);
      }
      return;
    }

    // 10. District Route: /district/:districtName
    if (pathname.startsWith('/district/')) {
      const slug = decodeURIComponent(pathname.replace('/district/', '').trim());
      const districtNames = BANGLADESH_DISTRICTS.map((d) => d.nameEn);
      const matchedDistrict = findDistrictBySlug(slug, districtNames);
      if (matchedDistrict) {
        setSelectedDistrictFilter(matchedDistrict);
        setIs404(false);
        updateDistrictSeo(matchedDistrict, language);
        setTimeout(() => {
          const destSection = document.getElementById('destinations');
          if (destSection) {
            const yOffset = -90;
            const y = destSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          }
        }, 100);
      } else {
        setSelectedDistrictFilter(null);
        setIs404(true);
        setNotFoundType('district');
        setNotFoundSlug(slug);
      }
      return;
    }

    // 11. Static Info Pages: /about, /contact, /privacy, /terms
    if (
      pathname === '/about' ||
      pathname === '/contact' ||
      pathname === '/privacy' ||
      pathname === '/terms'
    ) {
      const pageKey = pathname.slice(1) as InfoPageType;
      setInfoPage(pageKey);
      setIs404(false);
      updateInfoPageSeo(pageKey, language);
      return;
    }

    // 12. If none of the valid routes matched -> Custom 404
    setIs404(true);
    setNotFoundType('page');
    setNotFoundSlug(pathname);
  }, [
    location.pathname,
    location.search,
    destinations,
    stories,
    festivals,
    experiences,
    communityPosts,
    newsList,
    language,
    currentUser,
    activeSection,
    navigate,
  ]);

  // Route-bound modal and navigation handlers
  const handleSelectDestination = (dest: Destination | null) => {
    if (dest) {
      navigate(`/destination/${getDestinationSlug(dest, destinations)}`);
    } else {
      navigate('/');
    }
  };

  const handleSelectStory = (story: EditorialStory | null) => {
    if (story) {
      navigate(`/post/${getStorySlug(story, stories)}`);
    } else {
      navigate('/');
    }
  };

  const handleSelectFestival = (fest: Festival | null) => {
    if (fest) {
      navigate(`/festival/${getFestivalSlug(fest, festivals)}`);
    } else {
      navigate('/');
    }
  };

  const handleSelectExperience = (exp: Experience | null) => {
    if (exp) {
      navigate(`/experience/${getExperienceSlug(exp, experiences)}`);
    } else {
      navigate('/');
    }
  };

  const handleSelectPost = (post: CommunityPost | null) => {
    if (post) {
      navigate(`/post/${getPostSlug(post, communityPosts)}`);
    } else {
      navigate('/');
    }
  };

  const handleSelectNews = (post: NewsPost | null) => {
    if (post) {
      navigate(`/news/${getNewsSlug(post, newsList)}`);
    } else {
      navigate('/news');
    }
  };

  const handleSelectDistrict = (districtName: string) => {
    const canonical = getCanonicalDistrict(districtName);
    const targetName = canonical ? canonical.nameEn : districtName;
    setSelectedDistrictFilter(targetName);
    navigate(`/district/${getDistrictSlug(targetName)}`);
    setTimeout(() => {
      const el = document.getElementById('destinations');
      if (el) {
        const yOffset = -90;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 50);
  };

  const handleClearDistrictFilter = () => {
    setSelectedDistrictFilter(null);
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById('destinations');
      if (el) {
        const yOffset = -90;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 50);
  };

  const handleOpenInfoPage = (page: InfoPageType | null) => {
    if (page) {
      navigate(`/${page}`);
    } else {
      navigate('/');
    }
  };

  const handleOpenTripPlanner = (open: boolean, preselect: Destination | null = null) => {
    setTripPlannerPreselect(preselect);
    setIsTripPlannerOpen(open);
  };

  const handleOpenSearch = (open: boolean) => {
    setIsSearchOpen(open);
  };

  const handleOpenSavedModal = (open: boolean) => {
    const isAuth = Boolean(currentUser || auth.currentUser);
    if (open && !isAuth) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsSavedModalOpen(open);
  };

  const handleOpenLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleOpenProfile = () => {
    const isAuth = Boolean(currentUser || auth.currentUser);
    if (isAuth) {
      setAuthModalMode('profile');
    } else {
      setAuthModalMode('login');
    }
    setIsAuthModalOpen(true);
  };

  const handleOpenAuth = (modeOrOpen?: boolean | 'login' | 'register' | 'profile' | 'forgot_password') => {
    if (typeof modeOrOpen === 'boolean' && !modeOrOpen) {
      setIsAuthModalOpen(false);
      return;
    }
    const isAuth = Boolean(currentUser || auth.currentUser);
    if (isAuth) {
      setAuthModalMode('profile');
    } else {
      const targetMode = typeof modeOrOpen === 'string' && modeOrOpen !== 'profile' ? modeOrOpen : 'login';
      setAuthModalMode(targetMode);
    }
    setIsAuthModalOpen(true);
  };

  const handleOpenUpload = (open: boolean) => {
    const isAuth = Boolean(currentUser || auth.currentUser);
    if (open && !isAuth) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsUploadModalOpen(open);
  };

  const handleOpenStorySubmit = (open: boolean) => {
    const isAuth = Boolean(currentUser || auth.currentUser);
    if (open && !isAuth) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsStorySubmitOpen(open);
  };

  const handleOpenAdmin = (open: boolean) => {
    if (open) {
      navigate('/admin');
    } else {
      setIsAdminOpen(false);
      navigate('/');
    }
  };

  const handleOpenReport = (open: boolean) => {
    setIsReportModalOpen(open);
  };

  const handleToggleLanguage = (lang: Language) => {
    setLanguage(lang);
    const search = new URLSearchParams(location.search);
    search.set('lang', lang);
    navigate(`${location.pathname}?${search.toString()}`, { replace: true });
  };

  const handleNewStory = (newStory: EditorialStory) => {
    saveStoryToFirebase(newStory);
    const updated = [newStory, ...stories];
    setStories(updated);
    try {
      localStorage.setItem('discover_bd_stories', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // State updates from Admin Panel (Firebase writes are executed in AdminPanelModal)
  const handleUpdateDestinations = (newDestinations: Destination[]) => {
    const cleanList = dedupeById(newDestinations);
    setDestinations(cleanList);
    try {
      localStorage.setItem('discover_bd_destinations', JSON.stringify(cleanList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateExperiences = (newExp: Experience[]) => {
    setExperiences(newExp);
    try {
      localStorage.setItem('discover_bd_experiences', JSON.stringify(newExp));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateFestivals = (newFest: Festival[]) => {
    setFestivals(newFest);
    try {
      localStorage.setItem('discover_bd_festivals', JSON.stringify(newFest));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStories = (newStories: EditorialStory[]) => {
    setStories(newStories);
    try {
      localStorage.setItem('discover_bd_stories', JSON.stringify(newStories));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCommunityPosts = (newPosts: CommunityPost[]) => {
    setCommunityPosts(newPosts);
    try {
      localStorage.setItem('discover_bd_community_posts', JSON.stringify(newPosts));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetAllData = () => {
    setDestinations(dedupeById(DESTINATIONS));
    setExperiences(EXPERIENCES);
    setFestivals(FESTIVALS);
    setStories(EDITORIAL_STORIES);
    setCommunityPosts(SEED_COMMUNITY_POSTS);

    try {
      localStorage.removeItem('discover_bd_destinations');
      localStorage.removeItem('discover_bd_experiences');
      localStorage.removeItem('discover_bd_festivals');
      localStorage.removeItem('discover_bd_stories');
      localStorage.removeItem('discover_bd_community_posts');
    } catch (e) {
      console.error(e);
    }
  };

  // Firebase Real-time Synchronization (Firebase = PRIMARY SOURCE OF TRUTH)
  useEffect(() => {
    const unsubscribeFirestore = subscribeToAllFirestoreData({
      onDestinations: (cloudDestinations) => {
        if (cloudDestinations && cloudDestinations.length > 0) {
          const merged = dedupeById([...cloudDestinations, ...DESTINATIONS]);
          setDestinations(merged);
        }
      },
      onExperiences: (cloudExperiences) => {
        if (cloudExperiences && cloudExperiences.length > 0) {
          const merged = dedupeById([...cloudExperiences, ...EXPERIENCES]);
          setExperiences(merged);
        }
      },
      onFestivals: (cloudFestivals) => {
        if (cloudFestivals && cloudFestivals.length > 0) {
          const merged = dedupeById([...cloudFestivals, ...FESTIVALS]);
          setFestivals(merged);
        }
      },
      onStories: (cloudStories) => {
        if (cloudStories && cloudStories.length > 0) {
          const merged = dedupeById([...cloudStories, ...EDITORIAL_STORIES]);
          setStories(merged);
        }
      },
      onCommunityPosts: (cloudCommunityPosts) => {
        if (cloudCommunityPosts && cloudCommunityPosts.length > 0) {
          const merged = dedupeById([...cloudCommunityPosts, ...SEED_COMMUNITY_POSTS]);
          setCommunityPosts(merged);
        }
      },
    });

    return () => {
      unsubscribeFirestore();
    };
  }, []);

  // Listen to Firebase Auth state changes (Firebase Auth = Primary Source of Truth)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      setAuthLoading(false);
      setAuthInitialized(true);

      if (firebaseUser) {
        // Immediate synchronous update to prevent transient null state
        const immediateUser: AppUser = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Traveler',
          email: firebaseUser.email || null,
          photoURL: firebaseUser.photoURL || null,
          role: 'user',
          isAnonymous: firebaseUser.isAnonymous,
          createdAt: firebaseUser.metadata?.creationTime ? Date.parse(firebaseUser.metadata.creationTime) : Date.now(),
        };

        setCurrentUser((prev) => {
          if (prev && prev.uid === firebaseUser.uid) {
            return {
              ...prev,
              ...immediateUser,
              role: prev.role || 'user',
            };
          }
          return immediateUser;
        });

        // Background synchronization with Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let saved: string[] = ['coxs-bazar', 'sylhet-tea'];
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (Array.isArray(data.saved)) {
              saved = data.saved;
            }
          }

          setSavedIds(saved);
          try {
            localStorage.setItem('discover_bd_saved', JSON.stringify(saved));
          } catch {}

          const verifiedProfile = await syncFirebaseUserProfile(firebaseUser);
          setCurrentUser(verifiedProfile);
          try {
            localStorage.setItem('discover_bd_user_session', JSON.stringify(verifiedProfile));
          } catch {}
        } catch (e) {
          console.warn('Failed to sync user Firestore doc, using fallback verification:', e);
          const isVerifiedAdmin = await verifyFirebaseAdminStatus(firebaseUser);
          const fallbackUser: AppUser = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Traveler',
            email: firebaseUser.email || '',
            role: isVerifiedAdmin ? 'admin' : 'user',
            isAnonymous: firebaseUser.isAnonymous,
            photoURL: firebaseUser.photoURL || null,
            createdAt: firebaseUser.metadata?.creationTime ? Date.parse(firebaseUser.metadata.creationTime) : Date.now(),
          };
          setCurrentUser(fallbackUser);
          try {
            localStorage.setItem('discover_bd_user_session', JSON.stringify(fallbackUser));
          } catch {}
        }
      } else {
        // User logged out from Firebase Auth
        setCurrentUser(null);
        try {
          localStorage.removeItem('discover_bd_user_session');
          localStorage.removeItem('discover_bd_guest_user');
          localStorage.removeItem('discover_bd_saved');
        } catch {}
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleSave = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    let newSaved: string[];
    if (savedIds.includes(id)) {
      newSaved = savedIds.filter((item) => item !== id);
    } else {
      newSaved = [...savedIds, id];
    }
    setSavedIds(newSaved);
    localStorage.setItem('discover_bd_saved', JSON.stringify(newSaved));

    if (currentUser && !currentUser.isAnonymous && currentUser.uid) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { saved: newSaved }, { merge: true });
      } catch (err) {
        console.error('Failed to save destination to user cloud doc:', err);
      }
    }
  };

  const handlePlanTripForDestination = (dest: Destination) => {
    handleSelectDestination(null);
    handleOpenTripPlanner(true, dest);
  };

  const handleNewCommunityPost = (post: CommunityPost) => {
    saveCommunityPostToFirebase(post);
    const updated = [post, ...communityPosts];
    setCommunityPosts(updated);
    try {
      localStorage.setItem('discover_bd_community_posts', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'destinations') {
      navigate('/destinations');
    } else if (sectionId === 'news') {
      navigate('/news');
    } else if (sectionId === 'community') {
      navigate('/community');
    } else {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savedDestinationsList = destinations.filter((d) => savedIds.includes(d.id));

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-neutral-800 flex flex-col font-sans selection:bg-[#DE9B2E]/30 selection:text-[#0A2A21]">
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-[#DE9B2E] origin-left z-[100] transition-transform duration-75 ease-out pointer-events-none"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      {/* Header */}
      <Header
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenTripPlanner={() => handleOpenTripPlanner(true)}
        onOpenSearch={() => handleOpenSearch(true)}
        onOpenSavedModal={() => handleOpenSavedModal(true)}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={handleOpenProfile}
        onOpenLogin={handleOpenLogin}
        onOpenAdmin={() => handleOpenAdmin(true)}
        onOpenUploadModal={() => handleOpenUpload(true)}
        onOpenStoryModal={() => handleOpenStorySubmit(true)}
        onOpenReportModal={() => handleOpenReport(true)}
        currentUser={currentUser || (auth.currentUser ? {
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Traveler',
          email: auth.currentUser.email || null,
          photoURL: auth.currentUser.photoURL || null,
          role: currentUser?.role || 'user',
          isAnonymous: auth.currentUser.isAnonymous,
        } : null)}
        savedCount={savedIds.length}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      {/* Dynamic Header Ad Placement (Slot 1) */}
      <AdRenderer
        slotConfig={adsConfig.header}
        slotId="header"
        language={language}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {is404 ? (
          <NotFoundPage
            language={language}
            resourceType={notFoundType}
            slug={notFoundSlug}
            onNavigateHome={() => navigate('/')}
            onExploreDestinations={() => navigate('/destinations')}
            onExploreNews={() => navigate('/news')}
          />
        ) : isAdminAccessDenied ? (
          <AdminAccessDenied
            language={language}
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth(true)}
            onNavigateHome={() => navigate('/')}
          />
        ) : selectedNewsPost && location.pathname.startsWith('/news/') ? (
          /* Dedicated News Detail Page with SEO URL (/news/:slug) */
          <NewsDetailPage
            news={selectedNewsPost}
            allNews={newsList}
            language={language}
            currentUser={currentUser}
            onOpenAuthModal={() => handleOpenAuth(true)}
            onNavigateBack={() => {
              navigate('/news');
              setTimeout(() => {
                const el = document.getElementById('news');
                if (el) {
                  const yOffset = -90;
                  const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
                }
              }, 50);
            }}
            onSelectNews={(post) => {
              navigate(`/news/${getNewsSlug(post, newsList)}`);
            }}
            articleAdConfig={adsConfig.article}
          />
        ) : (
          <>
            <HeroSection
              language={language}
              onExploreClick={() => scrollToSection('destinations')}
              onPlanTripClick={() => handleOpenTripPlanner(true)}
              onSelectDestination={handleSelectDestination}
              onSelectFestivalModal={() => {
                const pohelaBoishakh = festivals.find((f) => f.id === 'pohela-boishakh') || festivals[0];
                if (pohelaBoishakh) handleSelectFestival(pohelaBoishakh);
              }}
              coxsBazar={destinations.find((d) => d.id === 'coxs-bazar') || destinations[0]}
              sylhet={destinations.find((d) => d.id === 'sylhet-tea') || destinations[1]}
              paharpur={destinations.find((d) => d.id === 'paharpur') || destinations[2]}
            />

            {/* Dynamic Hero Bottom Ad Placement (Slot 2) */}
            <AdRenderer
              slotConfig={adsConfig.hero_bottom}
              slotId="hero_bottom"
              language={language}
            />

            {/* Recent Tourist Attractions & Stories Showcase Slider */}
            <RecentShowcaseSlider
              destinations={destinations}
              stories={stories}
              language={language}
              onSelectDestination={handleSelectDestination}
              onSelectStory={handleSelectStory}
              savedIds={savedIds}
              onToggleSave={toggleSave}
            />

            {/* All Tourist Places Grid (480+ Places with In-Feed Ad) */}
            <DestinationsGrid
              destinations={destinations}
              language={language}
              onSelectDestination={handleSelectDestination}
              savedIds={savedIds}
              onToggleSave={toggleSave}
              onPlanTrip={handlePlanTripForDestination}
              selectedDistrictFilter={selectedDistrictFilter}
              onClearDistrictFilter={handleClearDistrictFilter}
              infeedAdConfig={adsConfig.destination_infeed}
            />

            {/* Things To Do & Curated Experiences */}
            <ThingsToDoSection
              language={language}
              experiences={experiences}
              onSelectExperience={handleSelectExperience}
              onOpenTripPlanner={() => handleOpenTripPlanner(true)}
            />

            {/* Cultural Festivals & Events */}
            <FestivalsSection
              language={language}
              festivals={festivals}
              onSelectFestival={handleSelectFestival}
            />

            {/* Tourism News & Announcements with News Ad */}
            <NewsSection
              language={language}
              currentUser={currentUser}
              onOpenAuthModal={() => handleOpenAuth(true)}
              activeNewsPost={null}
              onSelectNews={handleSelectNews}
              newsAdConfig={adsConfig.news}
            />

            {/* Editorial Stories & Heritage Articles */}
            <StoriesSection
              language={language}
              stories={stories}
              onSelectStory={handleSelectStory}
              onWriteStoryClick={() => handleOpenStorySubmit(true)}
            />

            {/* Community Photo Gallery & ImgBB Uploads */}
            <CommunityGallerySection
              language={language}
              currentUser={currentUser}
              onOpenAuth={() => handleOpenAuth(true)}
              posts={communityPosts}
              onOpenUploadModal={() => handleOpenUpload(true)}
              onOpenAdmin={() => handleOpenAdmin(true)}
              selectedPostId={selectedCommunityPostId}
              onSelectPost={handleSelectPost}
              savedIds={savedIds}
              onToggleSave={toggleSave}
            />

            {/* 64 Districts Live Weather & Interactive Showcase */}
            <DistrictsSection
              destinations={destinations}
              language={language}
              selectedDistrict={selectedDistrictFilter}
              onSelectDistrict={handleSelectDistrict}
            />

            {/* Interactive GIS Map Section with 64 Districts */}
            <GisMapSection
              language={language}
              destinations={destinations}
              onSelectDestination={handleSelectDestination}
              selectedDistrictFilter={selectedDistrictFilter}
              onClearDistrictFilter={handleClearDistrictFilter}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        language={language}
        onNavigate={scrollToSection}
        onOpenReportModal={() => handleOpenReport(true)}
        onSelectDestinationById={(id) => {
          const dest = destinations.find((d) => d.id === id);
          if (dest) handleSelectDestination(dest);
        }}
        onOpenInfoPage={handleOpenInfoPage}
      />

      {/* Info Pages Modal (/about, /contact, /privacy, /terms) */}
      <InfoPageModal
        page={infoPage}
        language={language}
        onClose={() => handleOpenInfoPage(null)}
        onOpenReportModal={() => handleOpenReport(true)}
      />

      {/* Destination Detail Modal */}
      <DestinationModal
        destination={selectedDestination}
        language={language}
        onClose={() => handleSelectDestination(null)}
        isSaved={selectedDestination ? savedIds.includes(selectedDestination.id) : false}
        onToggleSave={toggleSave}
        onPlanTrip={handlePlanTripForDestination}
        allDestinations={destinations}
        onSelectDestination={handleSelectDestination}
        articleAdConfig={adsConfig.article}
      />

      {/* Editorial Story Modal */}
      <StoryModal
        story={selectedStory}
        language={language}
        currentUser={currentUser}
        onOpenAuth={() => handleOpenAuth(true)}
        onClose={() => handleSelectStory(null)}
        isSaved={selectedStory ? savedIds.includes(selectedStory.id) : false}
        onToggleSave={toggleSave}
        articleAdConfig={adsConfig.article}
      />

      {/* Cultural Festival Modal */}
      <FestivalModal
        festival={selectedFestival}
        language={language}
        onClose={() => handleSelectFestival(null)}
      />

      {/* Experience Modal */}
      <ExperienceModal
        experience={selectedExperience}
        language={language}
        onClose={() => handleSelectExperience(null)}
        onOpenTripPlanner={() => {
          handleSelectExperience(null);
          handleOpenTripPlanner(true);
        }}
      />

      {/* Community Post Modal */}
      {selectedCommunityPostId && (
        <PostModal
          post={
            communityPosts.find((p) => p.id === selectedCommunityPostId) ||
            SEED_COMMUNITY_POSTS.find((p) => p.id === selectedCommunityPostId) ||
            null
          }
          language={language}
          onClose={() => handleSelectPost(null)}
          currentUser={currentUser}
          onOpenAuth={() => handleOpenAuth(true)}
          isSaved={selectedCommunityPostId ? savedIds.includes(selectedCommunityPostId) : false}
          onToggleSave={toggleSave}
          articleAdConfig={adsConfig.article}
        />
      )}

      {/* Trip Planner Modal */}
      {isTripPlannerOpen && (
        <TripPlannerModal
          language={language}
          onClose={() => handleOpenTripPlanner(false)}
          savedDestinations={savedDestinationsList}
          preselectedDestination={tripPlannerPreselect}
        />
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <SearchModal
          language={language}
          onClose={() => handleOpenSearch(false)}
          onSelectDestination={handleSelectDestination}
          onSelectExperience={handleSelectExperience}
          onSelectFestival={handleSelectFestival}
          onSelectStory={handleSelectStory}
          destinations={destinations}
          experiences={experiences}
          festivals={festivals}
          stories={stories}
        />
      )}

      {/* Saved / Bookmarks Modal */}
      {isSavedModalOpen && (
        <SavedModal
          language={language}
          onClose={() => {
            setIsSavedModalOpen(false);
            if (location.pathname === '/profile') {
              navigate('/');
            }
          }}
          savedIds={savedIds}
          onRemoveSave={(id) => toggleSave(id)}
          onSelectDestination={handleSelectDestination}
          onSelectStory={handleSelectStory}
          onSelectPost={handleSelectPost}
          onOpenTripPlanner={() => {
            setIsSavedModalOpen(false);
            handleOpenTripPlanner(true);
          }}
          allDestinations={destinations}
          allStories={stories}
          allPosts={communityPosts}
        />
      )}

      {/* Firebase Authentication & Traveler Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          if (location.pathname === '/profile') {
            navigate('/');
          }
        }}
        currentUser={currentUser || (auth.currentUser ? {
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Traveler',
          email: auth.currentUser.email || null,
          photoURL: auth.currentUser.photoURL || null,
          role: currentUser?.role || 'user',
          isAnonymous: auth.currentUser.isAnonymous,
          createdAt: auth.currentUser.metadata?.creationTime ? Date.parse(auth.currentUser.metadata.creationTime) : Date.now(),
        } : null)}
        initialMode={authModalMode}
        language={language}
        savedCount={savedIds.length}
        onSetGuestUser={(guestUser) => {
          setCurrentUser(guestUser);
          try {
            localStorage.setItem('discover_bd_guest_user', JSON.stringify(guestUser));
          } catch {}
        }}
        onSignOutGuest={() => {
          setCurrentUser(null);
          try {
            localStorage.removeItem('discover_bd_user_session');
            localStorage.removeItem('discover_bd_guest_user');
            localStorage.removeItem('discover_bd_saved');
          } catch {}
        }}
        onOpenAdmin={() => handleOpenAdmin(true)}
        onOpenUploadModal={() => handleOpenUpload(true)}
        onOpenStoryModal={() => handleOpenStorySubmit(true)}
        onOpenSavedModal={() => handleOpenSavedModal(true)}
        onUpdateCurrentUser={(updatedUser) => {
          setCurrentUser(updatedUser);
          try {
            localStorage.setItem('discover_bd_user_session', JSON.stringify(updatedUser));
          } catch {}
        }}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* Story Submission Modal */}
      <StorySubmitModal
        isOpen={isStorySubmitOpen}
        onClose={() => handleOpenStorySubmit(false)}
        language={language}
        currentUser={currentUser}
        onSubmitStory={handleNewStory}
      />

      {/* ImgBB API Photo Share Modal */}
      <CommunityShareModal
        isOpen={isUploadModalOpen}
        onClose={() => handleOpenUpload(false)}
        currentUser={currentUser}
        language={language}
        onPostCreated={handleNewCommunityPost}
        onOpenAuth={() => {
          handleOpenUpload(false);
          handleOpenAuth(true);
        }}
      />

      {/* Submit Report & Feedback Modal */}
      <SubmitReportModal
        isOpen={isReportModalOpen}
        onClose={() => handleOpenReport(false)}
        language={language}
        currentUser={currentUser}
      />

      {/* Comprehensive Admin Panel Modal (Protected - only renders when admin is authenticated) */}
      {checkIsUserAdmin(currentUser) && (
        <AdminPanelModal
          isOpen={isAdminOpen}
          onClose={() => handleOpenAdmin(false)}
          language={language}
          currentUser={currentUser}
          onOpenAuth={() => {
            handleOpenAdmin(false);
            handleOpenAuth(true);
          }}
          destinations={destinations}
          experiences={experiences}
          festivals={festivals}
          stories={stories}
          communityPosts={communityPosts}
          onUpdateDestinations={handleUpdateDestinations}
          onUpdateExperiences={handleUpdateExperiences}
          onUpdateFestivals={handleUpdateFestivals}
          onUpdateStories={handleUpdateStories}
          onUpdateCommunityPosts={handleUpdateCommunityPosts}
          onResetAllData={handleResetAllData}
          adsConfig={adsConfig}
          onUpdateAdsConfig={setAdsConfig}
        />
      )}

      {/* Dynamic Mobile Sticky Bottom Ad (Slot 6 - Mobile Only with Close Button) */}
      <AdRenderer
        slotConfig={adsConfig.mobile_sticky}
        slotId="mobile_sticky"
        language={language}
      />

      {/* Scroll to Top floating action button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-[#0F3B2E] text-white shadow-xl hover:bg-[#0A2A21] border border-[#DE9B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#DE9B2E] transition-all cursor-pointer group"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainAppContent />
    </BrowserRouter>
  );
}
