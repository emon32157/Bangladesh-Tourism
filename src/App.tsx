/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { Destination, Experience, Festival, EditorialStory, Language, CommunityPost, AppUser } from './types';
import { parseUrlState, setUrlState, AppUrlState } from './lib/urlSync';
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
  updateSectionSeo,
  resetSeoToDefault,
} from './lib/seo';

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || !item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function App() {
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

  const handleSelectDistrict = (districtName: string) => {
    setSelectedDistrictFilter(districtName);
    scrollToSection('gis-map');
  };

  // URL state synchronization and deep linking on initial load and popstate
  useEffect(() => {
    const applyUrlState = () => {
      const urlState = parseUrlState();

      if (urlState.lang === 'bn' || urlState.lang === 'en') {
        setLanguage(urlState.lang as Language);
      }

      if (urlState.destinationId) {
        const dest = destinations.find((d) => d.id === urlState.destinationId) || null;
        setSelectedDestination(dest);
      } else {
        setSelectedDestination(null);
      }

      if (urlState.storyId) {
        const story = stories.find((s) => s.id === urlState.storyId) || null;
        setSelectedStory(story);
      } else {
        setSelectedStory(null);
      }

      if (urlState.festivalId) {
        const fest = festivals.find((f) => f.id === urlState.festivalId) || null;
        setSelectedFestival(fest);
      } else {
        setSelectedFestival(null);
      }

      if (urlState.experienceId) {
        const exp = experiences.find((e) => e.id === urlState.experienceId) || null;
        setSelectedExperience(exp);
      } else {
        setSelectedExperience(null);
      }

      if (urlState.postId) {
        setSelectedCommunityPostId(urlState.postId);
      } else {
        setSelectedCommunityPostId(null);
      }

      // Views / Modals
      setIsTripPlannerOpen(urlState.view === 'planner');
      setIsSavedModalOpen(urlState.view === 'wishlist');
      setIsSearchOpen(urlState.view === 'search');
      setIsAuthModalOpen(urlState.view === 'auth');
      setIsUploadModalOpen(urlState.view === 'upload');
      setIsStorySubmitOpen(urlState.view === 'story-submit' || urlState.view === 'write-story');
      setIsAdminOpen(urlState.view === 'admin');
      setIsReportModalOpen(urlState.view === 'report');

      if (urlState.section) {
        setActiveSection(urlState.section);
        const el = document.getElementById(urlState.section);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    applyUrlState();

    const handlePopState = () => {
      applyUrlState();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [destinations, stories, festivals, experiences]);

  // Dynamic SEO Synchronization
  useEffect(() => {
    if (selectedDestination) {
      updateDestinationSeo(selectedDestination, language);
    } else if (selectedStory) {
      updateStorySeo(selectedStory, language);
    } else if (selectedFestival) {
      updateFestivalSeo(selectedFestival, language);
    } else if (selectedExperience) {
      updateExperienceSeo(selectedExperience, language);
    } else if (activeSection && activeSection !== 'hero') {
      updateSectionSeo(activeSection, language);
    } else {
      resetSeoToDefault(language);
    }
  }, [selectedDestination, selectedStory, selectedFestival, selectedExperience, activeSection, language]);

  // Modal open/close actions that update browser URL
  const handleSelectDestination = (dest: Destination | null) => {
    setSelectedDestination(dest);
    setUrlState({ destinationId: dest ? dest.id : null });
  };

  const handleSelectStory = (story: EditorialStory | null) => {
    setSelectedStory(story);
    setUrlState({ storyId: story ? story.id : null });
  };

  const handleSelectFestival = (fest: Festival | null) => {
    setSelectedFestival(fest);
    setUrlState({ festivalId: fest ? fest.id : null });
  };

  const handleSelectExperience = (exp: Experience | null) => {
    setSelectedExperience(exp);
    setUrlState({ experienceId: exp ? exp.id : null });
  };

  const handleSelectPost = (post: CommunityPost | null) => {
    setSelectedCommunityPostId(post ? post.id : null);
    setUrlState({ postId: post ? post.id : null });
  };

  const handleOpenTripPlanner = (open: boolean, preselect: Destination | null = null) => {
    setTripPlannerPreselect(preselect);
    setIsTripPlannerOpen(open);
    setUrlState({ view: open ? 'planner' : null });
  };

  const handleOpenSearch = (open: boolean) => {
    setIsSearchOpen(open);
    setUrlState({ view: open ? 'search' : null });
  };

  const handleOpenSavedModal = (open: boolean) => {
    if (open && !currentUser) {
      setIsAuthModalOpen(true);
      setUrlState({ view: 'auth' });
      return;
    }
    setIsSavedModalOpen(open);
    setUrlState({ view: open ? 'wishlist' : null });
  };

  const handleOpenAuth = (open: boolean) => {
    setIsAuthModalOpen(open);
    setUrlState({ view: open ? 'auth' : null });
  };

  const handleOpenUpload = (open: boolean) => {
    if (open && !currentUser) {
      setIsAuthModalOpen(true);
      setUrlState({ view: 'auth' });
      return;
    }
    setIsUploadModalOpen(open);
    setUrlState({ view: open ? 'upload' : null });
  };

  const handleOpenStorySubmit = (open: boolean) => {
    if (open && !currentUser) {
      setIsAuthModalOpen(true);
      setUrlState({ view: 'auth' });
      return;
    }
    setIsStorySubmitOpen(open);
    setUrlState({ view: open ? 'story-submit' : null });
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

  const handleOpenAdmin = (open: boolean) => {
    setIsAdminOpen(open);
    setUrlState({ view: open ? 'admin' : null });
  };

  const handleOpenReport = (open: boolean) => {
    setIsReportModalOpen(open);
    setUrlState({ view: open ? 'report' : null });
  };

  const handleToggleLanguage = (lang: Language) => {
    setLanguage(lang);
    setUrlState({ lang }, true);
  };

  // Real-time Cloud Persistence handlers
  const handleUpdateDestinations = (newDestinations: Destination[]) => {
    const cleanList = dedupeById(newDestinations);
    const newIds = new Set(cleanList.map((d) => d.id));
    cleanList.forEach((dest) => {
      const existing = destinations.find((d) => d.id === dest.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(dest)) {
        saveDestinationToFirebase(dest);
      }
    });
    destinations.forEach((dest) => {
      if (!newIds.has(dest.id)) {
        deleteDestinationFromFirebase(dest.id);
      }
    });
    setDestinations(cleanList);
    try {
      localStorage.setItem('discover_bd_destinations', JSON.stringify(cleanList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateExperiences = (newExperiences: Experience[]) => {
    const newIds = new Set(newExperiences.map((e) => e.id));
    newExperiences.forEach((exp) => {
      const existing = experiences.find((e) => e.id === exp.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(exp)) {
        saveExperienceToFirebase(exp);
      }
    });
    experiences.forEach((exp) => {
      if (!newIds.has(exp.id)) {
        deleteExperienceFromFirebase(exp.id);
      }
    });
    setExperiences(newExperiences);
    try {
      localStorage.setItem('discover_bd_experiences', JSON.stringify(newExperiences));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateFestivals = (newFestivals: Festival[]) => {
    const newIds = new Set(newFestivals.map((f) => f.id));
    newFestivals.forEach((fest) => {
      const existing = festivals.find((f) => f.id === fest.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(fest)) {
        saveFestivalToFirebase(fest);
      }
    });
    festivals.forEach((fest) => {
      if (!newIds.has(fest.id)) {
        deleteFestivalFromFirebase(fest.id);
      }
    });
    setFestivals(newFestivals);
    try {
      localStorage.setItem('discover_bd_festivals', JSON.stringify(newFestivals));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStories = (newStories: EditorialStory[]) => {
    const newIds = new Set(newStories.map((s) => s.id));
    newStories.forEach((story) => {
      const existing = stories.find((s) => s.id === story.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(story)) {
        saveStoryToFirebase(story);
      }
    });
    stories.forEach((story) => {
      if (!newIds.has(story.id)) {
        deleteStoryFromFirebase(story.id);
      }
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
    newPosts.forEach((post) => {
      const existing = communityPosts.find((p) => p.id === post.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(post)) {
        saveCommunityPostToFirebase(post);
      }
    });
    communityPosts.forEach((post) => {
      if (!newIds.has(post.id)) {
        deleteCommunityPostFromFirebase(post.id);
      }
    });
    setCommunityPosts(newPosts);
    try {
      localStorage.setItem('discover_bd_community_posts', JSON.stringify(newPosts));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetAllData = () => {
    try {
      localStorage.removeItem('discover_bd_destinations');
      localStorage.removeItem('discover_bd_experiences');
      localStorage.removeItem('discover_bd_festivals');
      localStorage.removeItem('discover_bd_stories');
      localStorage.removeItem('discover_bd_community_posts');
    } catch (e) {
      console.error(e);
    }
    setDestinations(DESTINATIONS);
    setExperiences(EXPERIENCES);
    setFestivals(FESTIVALS);
    setStories(EDITORIAL_STORIES);
    setCommunityPosts(SEED_COMMUNITY_POSTS);
  };

  // Live Real-Time Sync with Firebase Firestore across ALL browsers & devices
  useEffect(() => {
    // Real-time listeners: keeps React state and all connected browsers synchronized live (read-only, no auth required)
    const unsubscribe = subscribeToAllFirestoreData({
      onDestinations: (items) => {
        if (items.length > 0) setDestinations(dedupeById(items));
      },
      onExperiences: (items) => {
        if (items.length > 0) setExperiences(dedupeById(items));
      },
      onFestivals: (items) => {
        if (items.length > 0) setFestivals(dedupeById(items));
      },
      onStories: (items) => {
        if (items.length > 0) setStories(dedupeById(items));
      },
      onCommunityPosts: (items) => {
        if (items.length > 0) setCommunityPosts(dedupeById(items));
      },
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const syncedUser = await syncFirebaseUserProfile(user);
          setCurrentUser(syncedUser);
        } catch {
          setCurrentUser({
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            isAnonymous: user.isAnonymous,
            role: 'user',
          });
        }
        localStorage.removeItem('discover_bd_guest_user');

        // Load user bookmarks from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists() && userSnap.data().savedDestinations) {
            const remoteSaved = userSnap.data().savedDestinations as string[];
            setSavedIds((prev) => Array.from(new Set([...prev, ...remoteSaved])));
          }
        } catch (e) {
          console.warn('Firebase user sync note:', e);
        }
      } else {
        try {
          const storedGuest = localStorage.getItem('discover_bd_guest_user');
          if (storedGuest) {
            setCurrentUser(JSON.parse(storedGuest));
          } else {
            setCurrentUser(null);
          }
        } catch {
          setCurrentUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSetGuestUser = (guest: AppUser) => {
    try {
      localStorage.setItem('discover_bd_guest_user', JSON.stringify(guest));
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(guest);
  };

  const handleSignOutGuest = () => {
    try {
      localStorage.removeItem('discover_bd_guest_user');
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
  };

  // Sync saved to localStorage & Firebase
  useEffect(() => {
    try {
      localStorage.setItem('discover_bd_saved', JSON.stringify(savedIds));
    } catch (e) {
      console.error(e);
    }

    if (currentUser && auth.currentUser && auth.currentUser.uid === currentUser.uid) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        setDoc(userDocRef, { savedDestinations: savedIds, lastUpdated: Date.now() }, { merge: true }).catch((err) => {
          console.warn('Firestore bookmarks sync note:', err);
        });
      } catch (err) {
        console.warn('Firestore bookmarks sync note:', err);
      }
    }
  }, [savedIds, currentUser]);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K) or Admin (Alt+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsTripPlannerOpen(false);
        setIsSavedModalOpen(false);
        setIsAuthModalOpen(false);
        setIsUploadModalOpen(false);
        setIsAdminOpen(false);
        setIsReportModalOpen(false);
        setSelectedDestination(null);
        setSelectedStory(null);
        setSelectedFestival(null);
        setSelectedExperience(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      setUrlState({ view: 'auth' });
      return;
    }
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handlePlanTripForDestination = (destination: Destination) => {
    setSelectedDestination(null);
    setTripPlannerPreselect(destination);
    setIsTripPlannerOpen(true);
  };

  const handleNewCommunityPost = (post: CommunityPost) => {
    handleUpdateCommunityPosts([post, ...communityPosts]);
    scrollToSection('community-gallery');
  };

  // Featured destinations for the Hero Section
  const heroFeaturedList = destinations.filter((d) => d.heroFeatured);
  const coxsBazar = heroFeaturedList[0] || destinations[0] || DESTINATIONS[0];
  const sylhet = heroFeaturedList[1] || destinations[1] || DESTINATIONS[1];
  const paharpur = heroFeaturedList[2] || destinations[2] || DESTINATIONS[2];

  const savedDestinationsList = destinations.filter((d) => savedIds.includes(d.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EA] text-[#1B211D] relative">
      {/* Top Scroll Progress Indicator */}
      <motion.div
        id="scroll-progress-bar"
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DE9B2E] via-[#0F3B2E] to-[#DE9B2E] z-50 origin-left shadow-xs pointer-events-none"
        style={{ scaleX }}
      />

      {/* Floating Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            id="scroll-to-top-btn"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 p-3.5 bg-[#0F3B2E] text-white rounded-full shadow-2xl hover:bg-[#DE9B2E] hover:text-[#0A2A21] transition-colors border border-[#DE9B2E]/40 flex items-center justify-center cursor-pointer group"
            title={language === 'en' ? 'Scroll to Top' : 'উপরে যান'}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <Header
        language={language}
        onToggleLanguage={handleToggleLanguage}
        activeSection={activeSection}
        onNavigate={scrollToSection}
        onOpenSearch={() => handleOpenSearch(true)}
        onOpenTripPlanner={() => handleOpenTripPlanner(true)}
        savedCount={savedIds.length}
        onOpenSavedModal={() => handleOpenSavedModal(true)}
        currentUser={currentUser}
        onOpenAuth={() => handleOpenAuth(true)}
        onOpenUploadModal={() => handleOpenUpload(true)}
        onOpenStoryModal={() => handleOpenStorySubmit(true)}
        onOpenReportModal={() => handleOpenReport(true)}
        onOpenAdmin={() => handleOpenAdmin(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <HeroSection
          language={language}
          onExploreClick={() => scrollToSection('destinations')}
          onPlanTripClick={() => handleOpenTripPlanner(true)}
          onSelectDestination={handleSelectDestination}
          onSelectFestivalModal={() => handleSelectFestival(festivals[0] || FESTIVALS[0])}
          coxsBazar={coxsBazar}
          sylhet={sylhet}
          paharpur={paharpur}
        />

        {/* Dynamic 4 Recent Posts & 4 Recent Stories Showcase Slider */}
        <RecentShowcaseSlider
          destinations={destinations}
          stories={stories}
          language={language}
          onSelectDestination={handleSelectDestination}
          onSelectStory={handleSelectStory}
          savedIds={savedIds}
          onToggleSave={toggleSave}
        />

        {/* Curated Destinations Section */}
        <DestinationsGrid
          destinations={destinations}
          language={language}
          onSelectDestination={handleSelectDestination}
          savedIds={savedIds}
          onToggleSave={toggleSave}
        />

        {/* Interactive GIS Map Section */}
        <GisMapSection
          destinations={destinations}
          language={language}
          onSelectDestination={handleSelectDestination}
          selectedDistrictFilter={selectedDistrictFilter}
          onClearDistrictFilter={() => setSelectedDistrictFilter(null)}
        />

        {/* 64 Districts Directory Section */}
        <DistrictsSection
          destinations={destinations}
          language={language}
          onSelectDistrict={handleSelectDistrict}
        />

        {/* Things To Do & Experiences Section */}
        <ThingsToDoSection
          experiences={experiences}
          language={language}
          onSelectExperience={handleSelectExperience}
        />

        {/* Cultural Festivals Section */}
        <FestivalsSection
          festivals={festivals}
          language={language}
          onSelectFestival={handleSelectFestival}
        />

        {/* Official Tourism News & Bulletins Section (Feature 3) */}
        <NewsSection
          language={language}
          currentUser={currentUser}
          onOpenAuth={() => handleOpenAuth(true)}
        />

        {/* Editorial Stories & Essays */}
        <StoriesSection
          stories={stories}
          language={language}
          onSelectStory={handleSelectStory}
          onOpenStorySubmit={() => handleOpenStorySubmit(true)}
          savedIds={savedIds}
          onToggleSave={toggleSave}
          currentUser={currentUser}
          onOpenAuth={() => handleOpenAuth(true)}
        />

        {/* Community Traveler Photos & Gallery */}
        <CommunityGallerySection
          language={language}
          onOpenUploadModal={() => handleOpenUpload(true)}
          onOpenAuth={() => handleOpenAuth(true)}
          customPosts={communityPosts}
          currentUser={currentUser}
          onOpenAdmin={() => handleOpenAdmin(true)}
          selectedPostId={selectedCommunityPostId}
          onSelectPost={handleSelectPost}
          savedIds={savedIds}
          onToggleSave={toggleSave}
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

      {/* Firebase Cloud Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => handleOpenAuth(false)}
        currentUser={currentUser}
        language={language}
        savedCount={savedIds.length}
        onSetGuestUser={handleSetGuestUser}
        onSignOutGuest={handleSignOutGuest}
        onOpenAdmin={() => {
          handleOpenAuth(false);
          handleOpenAdmin(true);
        }}
        onOpenUploadModal={() => {
          handleOpenAuth(false);
          handleOpenUpload(true);
        }}
        onOpenStoryModal={() => {
          handleOpenAuth(false);
          handleOpenStorySubmit(true);
        }}
        onOpenSavedModal={() => {
          handleOpenAuth(false);
          handleOpenSavedModal(true);
        }}
        onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
      />

      {/* Editorial Story Submission Modal */}
      <StorySubmitModal
        isOpen={isStorySubmitOpen}
        onClose={() => handleOpenStorySubmit(false)}
        currentUser={currentUser}
        language={language}
        onStoryCreated={handleNewStory}
        onOpenAuth={() => {
          handleOpenStorySubmit(false);
          handleOpenAuth(true);
        }}
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
    </div>
  );
}

