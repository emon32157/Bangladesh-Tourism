/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';
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
import { InfoPageModal, InfoPageType } from './components/InfoPageModal';

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
import { Destination, Experience, Festival, EditorialStory, Language, CommunityPost, AppUser } from './types';
import { syncFirebaseUserProfile, checkIsUserAdmin } from './lib/userRoles';
import {
  subscribeToAllFirestoreData,
  saveDestinationToFirebase,
  deleteDestinationFromFirebase,
  saveExperienceToFirebase,
  deleteExperienceFromFirebase,
  saveFestivalToFirebase,
  deleteFestivalFromFirebase,
  saveStoryToFirebase,
  deleteStoryFromFirebase,
  saveCommunityPostToFirebase,
  deleteCommunityPostFromFirebase,
} from './lib/firestoreSync';
import {
  updateDestinationSeo,
  updateStorySeo,
  updateFestivalSeo,
  updateExperienceSeo,
  updateDistrictSeo,
  updateInfoPageSeo,
  updateSectionSeo,
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

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem('discover_bd_guest_user');
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

  // Modals state
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedStory, setSelectedStory] = useState<EditorialStory | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedCommunityPostId, setSelectedCommunityPostId] = useState<string | null>(null);
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

  // Smooth scroll progress tracking
  const { scrollYProgress, scrollY } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setShowScrollTop(latest > 350);
    });
  }, [scrollY]);

  // Synchronize route pathname and search params with modal, filter, and SEO states
  useEffect(() => {
    const pathname = location.pathname;
    const searchParams = new URLSearchParams(location.search);

    // Sync language if query param present
    const langParam = searchParams.get('lang');
    if (langParam === 'bn' || langParam === 'en') {
      setLanguage(langParam as Language);
    }

    // Legacy query params for backwards-compatibility deep links
    const legacyDest = searchParams.get('destination');
    const legacyStory = searchParams.get('story');
    const legacyFest = searchParams.get('festival');
    const legacyExp = searchParams.get('experience');
    const legacyPost = searchParams.get('post');

    // 1. Destination Route: /destination/:slug
    if (pathname.startsWith('/destination/')) {
      const slug = decodeURIComponent(pathname.replace('/destination/', '').trim());
      const dest = findDestinationBySlug(destinations, slug);
      if (dest) {
        setSelectedDestination(dest);
        updateDestinationSeo(dest, language);
      }
    } else if (legacyDest) {
      const dest = findDestinationBySlug(destinations, legacyDest);
      if (dest) {
        navigate(`/destination/${getDestinationSlug(dest, destinations)}`, { replace: true });
        return;
      }
    } else {
      setSelectedDestination(null);
    }

    // 2. Post / Story Route: /post/:slug or /story/:slug
    if (pathname.startsWith('/post/') || pathname.startsWith('/story/')) {
      const slug = decodeURIComponent(pathname.replace(/^\/(post|story)\//, '').trim());
      const story = findStoryBySlug(stories, slug);
      if (story) {
        setSelectedStory(story);
        setSelectedCommunityPostId(null);
        updateStorySeo(story, language);
      } else {
        const post = findPostBySlug(communityPosts, slug);
        if (post) {
          setSelectedCommunityPostId(post.id);
          setSelectedStory(null);
        }
      }
    } else if (legacyStory) {
      const story = findStoryBySlug(stories, legacyStory);
      if (story) {
        navigate(`/post/${getStorySlug(story, stories)}`, { replace: true });
        return;
      }
    } else if (legacyPost) {
      const post = findPostBySlug(communityPosts, legacyPost);
      if (post) {
        navigate(`/post/${getPostSlug(post, communityPosts)}`, { replace: true });
        return;
      }
    } else {
      setSelectedStory(null);
      setSelectedCommunityPostId(null);
    }

    // 3. Festival Route: /festival/:slug
    if (pathname.startsWith('/festival/')) {
      const slug = decodeURIComponent(pathname.replace('/festival/', '').trim());
      const fest = findFestivalBySlug(festivals, slug);
      if (fest) {
        setSelectedFestival(fest);
        updateFestivalSeo(fest, language);
      }
    } else if (legacyFest) {
      const fest = findFestivalBySlug(festivals, legacyFest);
      if (fest) {
        navigate(`/festival/${getFestivalSlug(fest, festivals)}`, { replace: true });
        return;
      }
    } else {
      setSelectedFestival(null);
    }

    // 4. Experience Route: /experience/:slug
    if (pathname.startsWith('/experience/')) {
      const slug = decodeURIComponent(pathname.replace('/experience/', '').trim());
      const exp = findExperienceBySlug(experiences, slug);
      if (exp) {
        setSelectedExperience(exp);
        updateExperienceSeo(exp, language);
      }
    } else if (legacyExp) {
      const exp = findExperienceBySlug(experiences, legacyExp);
      if (exp) {
        navigate(`/experience/${getExperienceSlug(exp, experiences)}`, { replace: true });
        return;
      }
    } else {
      setSelectedExperience(null);
    }

    // 5. District Route: /district/:districtName
    if (pathname.startsWith('/district/')) {
      const slug = decodeURIComponent(pathname.replace('/district/', '').trim());
      const districtNames = BANGLADESH_DISTRICTS.map((d) => d.nameEn);
      const matchedDistrict = findDistrictBySlug(slug, districtNames);
      if (matchedDistrict) {
        setSelectedDistrictFilter(matchedDistrict);
        updateDistrictSeo(matchedDistrict, language);
        setTimeout(() => {
          const destSection = document.getElementById('destinations');
          if (destSection) {
            const yOffset = -90;
            const y = destSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      setSelectedDistrictFilter(null);
    }

    // 6. Info Pages: /about, /contact, /privacy, /terms
    if (
      pathname === '/about' ||
      pathname === '/contact' ||
      pathname === '/privacy' ||
      pathname === '/terms'
    ) {
      const pageKey = pathname.slice(1) as InfoPageType;
      setInfoPage(pageKey);
      updateInfoPageSeo(pageKey, language);
    } else {
      setInfoPage(null);
    }

    // 7. General Views via searchParams: ?view=planner, ?view=wishlist, ?view=search, ?view=auth, ?view=admin, ?view=report, etc.
    const view = searchParams.get('view');
    setIsTripPlannerOpen(view === 'planner');
    setIsSavedModalOpen(view === 'wishlist');
    setIsSearchOpen(view === 'search');
    setIsAuthModalOpen(view === 'auth');
    setIsUploadModalOpen(view === 'upload');
    setIsStorySubmitOpen(view === 'story-submit' || view === 'write-story');
    setIsAdminOpen(view === 'admin');
    setIsReportModalOpen(view === 'report');

    // Section scroll if ?section=...
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    // Reset SEO to default if on home route with no active modal
    if (
      pathname === '/' &&
      !legacyDest &&
      !legacyStory &&
      !legacyFest &&
      !legacyExp &&
      !legacyPost &&
      !view
    ) {
      if (activeSection && activeSection !== 'hero') {
        updateSectionSeo(activeSection, language);
      } else {
        resetSeoToDefault(language);
      }
    }
  }, [
    location.pathname,
    location.search,
    destinations,
    stories,
    festivals,
    experiences,
    communityPosts,
    language,
    activeSection,
    navigate,
  ]);

  // Route-bound modal handlers
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

  const handleSelectDistrict = (districtName: string) => {
    const canonical = getCanonicalDistrict(districtName);
    const targetName = canonical ? canonical.nameEn : districtName;
    setSelectedDistrictFilter(targetName);
    navigate(`/district/${getDistrictSlug(targetName)}`);
    // Immediately scroll to destinations section with sticky navbar offset
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
    // Smoothly scroll back to destinations section
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

  // Views with query parameter bindings
  const updateQueryView = (viewName: string | null) => {
    const search = new URLSearchParams(location.search);
    if (viewName) {
      search.set('view', viewName);
    } else {
      search.delete('view');
    }
    const query = search.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ''}`);
  };

  const handleOpenTripPlanner = (open: boolean, preselect: Destination | null = null) => {
    setTripPlannerPreselect(preselect);
    setIsTripPlannerOpen(open);
    updateQueryView(open ? 'planner' : null);
  };

  const handleOpenSearch = (open: boolean) => {
    setIsSearchOpen(open);
    updateQueryView(open ? 'search' : null);
  };

  const handleOpenSavedModal = (open: boolean) => {
    if (open && !currentUser) {
      setIsAuthModalOpen(true);
      updateQueryView('auth');
      return;
    }
    setIsSavedModalOpen(open);
    updateQueryView(open ? 'wishlist' : null);
  };

  const handleOpenAuth = (open: boolean) => {
    setIsAuthModalOpen(open);
    updateQueryView(open ? 'auth' : null);
  };

  const handleOpenUpload = (open: boolean) => {
    if (open && !currentUser) {
      setIsAuthModalOpen(true);
      updateQueryView('auth');
      return;
    }
    setIsUploadModalOpen(open);
    updateQueryView(open ? 'upload' : null);
  };

  const handleOpenStorySubmit = (open: boolean) => {
    if (open && !currentUser) {
      setIsAuthModalOpen(true);
      updateQueryView('auth');
      return;
    }
    setIsStorySubmitOpen(open);
    updateQueryView(open ? 'story-submit' : null);
  };

  const handleOpenAdmin = (open: boolean) => {
    setIsAdminOpen(open);
    updateQueryView(open ? 'admin' : null);
  };

  const handleOpenReport = (open: boolean) => {
    setIsReportModalOpen(open);
    updateQueryView(open ? 'report' : null);
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

  // Real-time Cloud Persistence handlers
  const handleUpdateDestinations = (newDestinations: Destination[]) => {
    const cleanList = dedupeById(newDestinations);
    const newIds = new Set(cleanList.map((d) => d.id));
    destinations.forEach((oldD) => {
      if (!newIds.has(oldD.id)) {
        deleteDestinationFromFirebase(oldD.id);
      }
    });
    cleanList.forEach((d) => {
      saveDestinationToFirebase(d);
    });
    setDestinations(cleanList);
    try {
      localStorage.setItem('discover_bd_destinations', JSON.stringify(cleanList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateExperiences = (newExp: Experience[]) => {
    const newIds = new Set(newExp.map((e) => e.id));
    experiences.forEach((oldE) => {
      if (!newIds.has(oldE.id)) {
        deleteExperienceFromFirebase(oldE.id);
      }
    });
    newExp.forEach((e) => {
      saveExperienceToFirebase(e);
    });
    setExperiences(newExp);
    try {
      localStorage.setItem('discover_bd_experiences', JSON.stringify(newExp));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateFestivals = (newFest: Festival[]) => {
    const newIds = new Set(newFest.map((f) => f.id));
    festivals.forEach((oldF) => {
      if (!newIds.has(oldF.id)) {
        deleteFestivalFromFirebase(oldF.id);
      }
    });
    newFest.forEach((f) => {
      saveFestivalToFirebase(f);
    });
    setFestivals(newFest);
    try {
      localStorage.setItem('discover_bd_festivals', JSON.stringify(newFest));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStories = (newStories: EditorialStory[]) => {
    const newIds = new Set(newStories.map((s) => s.id));
    stories.forEach((oldS) => {
      if (!newIds.has(oldS.id)) {
        deleteStoryFromFirebase(oldS.id);
      }
    });
    newStories.forEach((s) => {
      saveStoryToFirebase(s);
    });
    setStories(newStories);
    try {
      localStorage.setItem('discover_bd_stories', JSON.stringify(newStories));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCommunityPosts = (newPosts: CommunityPost[]) => {
    const newIds = new Set(newPosts.map((p) => p.id));
    communityPosts.forEach((oldP) => {
      if (!newIds.has(oldP.id)) {
        deleteCommunityPostFromFirebase(oldP.id);
      }
    });
    newPosts.forEach((p) => {
      saveCommunityPostToFirebase(p);
    });
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

  // Firebase Real-time Synchronization
  useEffect(() => {
    const unsubscribeFirestore = subscribeToAllFirestoreData({
      onDestinations: (cloudDestinations) => {
        if (cloudDestinations && cloudDestinations.length > 0) {
          const merged = dedupeById([...cloudDestinations, ...DESTINATIONS]);
          setDestinations(merged);
          try {
            localStorage.setItem('discover_bd_destinations', JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
        }
      },
      onExperiences: (cloudExperiences) => {
        if (cloudExperiences && cloudExperiences.length > 0) {
          const merged = dedupeById([...cloudExperiences, ...EXPERIENCES]);
          setExperiences(merged);
          try {
            localStorage.setItem('discover_bd_experiences', JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
        }
      },
      onFestivals: (cloudFestivals) => {
        if (cloudFestivals && cloudFestivals.length > 0) {
          const merged = dedupeById([...cloudFestivals, ...FESTIVALS]);
          setFestivals(merged);
          try {
            localStorage.setItem('discover_bd_festivals', JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
        }
      },
      onStories: (cloudStories) => {
        if (cloudStories && cloudStories.length > 0) {
          const merged = dedupeById([...cloudStories, ...EDITORIAL_STORIES]);
          setStories(merged);
          try {
            localStorage.setItem('discover_bd_stories', JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
        }
      },
      onCommunityPosts: (cloudCommunityPosts) => {
        if (cloudCommunityPosts && cloudCommunityPosts.length > 0) {
          const merged = dedupeById([...cloudCommunityPosts, ...SEED_COMMUNITY_POSTS]);
          setCommunityPosts(merged);
          try {
            localStorage.setItem('discover_bd_community_posts', JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
        }
      },
    });

    return () => {
      unsubscribeFirestore();
    };
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let saved: string[] = ['coxs-bazar', 'sylhet-tea'];

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            saved = Array.isArray(data.saved) ? data.saved : saved;
          }

          const userProfile = await syncFirebaseUserProfile(firebaseUser);

          setCurrentUser(userProfile);
          setSavedIds(saved);
          localStorage.setItem('discover_bd_guest_user', JSON.stringify(userProfile));
          localStorage.setItem('discover_bd_saved', JSON.stringify(saved));
        } catch (e) {
          console.error('Failed to sync user Firestore doc:', e);
          const fallbackUser: AppUser = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Traveler',
            email: firebaseUser.email || '',
            role: checkIsUserAdmin({ email: firebaseUser.email } as AppUser) ? 'admin' : 'user',
            isAnonymous: firebaseUser.isAnonymous,
            photoURL: firebaseUser.photoURL || null,
            createdAt: firebaseUser.metadata.creationTime ? Date.parse(firebaseUser.metadata.creationTime) : Date.now(),
          };
          setCurrentUser(fallbackUser);
          localStorage.setItem('discover_bd_guest_user', JSON.stringify(fallbackUser));
        }
      } else {
        const storedGuest = localStorage.getItem('discover_bd_guest_user');
        if (storedGuest) {
          try {
            const parsed = JSON.parse(storedGuest);
            setCurrentUser(parsed);
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
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
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savedDestinationsList = destinations.filter((d) => savedIds.includes(d.id));

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-neutral-800 flex flex-col font-sans selection:bg-[#DE9B2E]/30 selection:text-[#0A2A21]">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[#DE9B2E] origin-left z-[100]"
        style={{ scaleX }}
      />

      {/* Header */}
      <Header
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenTripPlanner={() => handleOpenTripPlanner(true)}
        onOpenSearch={() => handleOpenSearch(true)}
        onOpenSavedModal={() => handleOpenSavedModal(true)}
        onOpenAuth={() => handleOpenAuth(true)}
        onOpenAdmin={() => handleOpenAdmin(true)}
        currentUser={currentUser}
        savedCount={savedIds.length}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
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

        {/* All Tourist Places Grid (480+ Places with 64-District Filter & Load More) */}
        <DestinationsGrid
          destinations={destinations}
          language={language}
          onSelectDestination={handleSelectDestination}
          savedIds={savedIds}
          onToggleSave={toggleSave}
          onPlanTrip={handlePlanTripForDestination}
          selectedDistrictFilter={selectedDistrictFilter}
          onClearDistrictFilter={handleClearDistrictFilter}
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

        {/* Tourism News & User Interaction System */}
        <NewsSection
          language={language}
          currentUser={currentUser}
          onOpenAuth={() => handleOpenAuth(true)}
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

      {/* Modals and Overlays */}
      <DestinationModal
        destination={selectedDestination}
        language={language}
        onClose={() => handleSelectDestination(null)}
        isSaved={selectedDestination ? savedIds.includes(selectedDestination.id) : false}
        onToggleSave={toggleSave}
        onPlanTrip={handlePlanTripForDestination}
        allDestinations={destinations}
        onSelectDestination={handleSelectDestination}
      />

      <StoryModal
        story={selectedStory}
        language={language}
        currentUser={currentUser}
        onOpenAuth={() => handleOpenAuth(true)}
        onClose={() => handleSelectStory(null)}
        isSaved={selectedStory ? savedIds.includes(selectedStory.id) : false}
        onToggleSave={toggleSave}
      />

      <FestivalModal
        festival={selectedFestival}
        language={language}
        onClose={() => handleSelectFestival(null)}
      />

      <ExperienceModal
        experience={selectedExperience}
        language={language}
        onClose={() => handleSelectExperience(null)}
        onOpenTripPlanner={() => {
          handleSelectExperience(null);
          handleOpenTripPlanner(true);
        }}
      />

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
        />
      )}

      {isTripPlannerOpen && (
        <TripPlannerModal
          language={language}
          onClose={() => handleOpenTripPlanner(false)}
          savedDestinations={savedDestinationsList}
          preselectedDestination={tripPlannerPreselect}
        />
      )}

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

      {isSavedModalOpen && (
        <SavedModal
          language={language}
          onClose={() => handleOpenSavedModal(false)}
          savedIds={savedIds}
          onRemoveSave={(id) => toggleSave(id)}
          onSelectDestination={handleSelectDestination}
          onSelectStory={handleSelectStory}
          onSelectPost={handleSelectPost}
          onOpenTripPlanner={() => {
            handleOpenSavedModal(false);
            handleOpenTripPlanner(true);
          }}
          allDestinations={destinations}
          allStories={stories}
          allPosts={communityPosts}
        />
      )}

      {/* Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => handleOpenAuth(false)}
        language={language}
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

      {/* Comprehensive Admin Panel Modal */}
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
