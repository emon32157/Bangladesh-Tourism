import React, { useState, useRef, useEffect } from 'react';
import { Language, AppUser } from '../types';
import { checkIsUserAdmin } from '../lib/userRoles';
import {
  Search,
  Bookmark,
  Menu,
  X,
  Compass,
  User as UserIcon,
  Flag,
  Camera,
  PenTool,
  Shield,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onOpenSearch: () => void;
  onOpenTripPlanner: () => void;
  savedCount: number;
  onOpenSavedModal: () => void;
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  onOpenUploadModal: () => void;
  onOpenStoryModal?: () => void;
  onOpenReportModal?: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  activeSection,
  onNavigate,
  onOpenSearch,
  onOpenTripPlanner,
  savedCount,
  onOpenSavedModal,
  currentUser,
  onOpenAuth,
  onOpenUploadModal,
  onOpenStoryModal,
  onOpenReportModal,
  onOpenAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const isUserAdmin = checkIsUserAdmin(currentUser);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
      }
    };
    if (showAccountDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountDropdown]);

  const navItems = [
    { id: 'hero', labelEn: 'Home', labelBn: 'মূলপাতা' },
    { id: 'destinations', labelEn: 'Destinations', labelBn: 'গন্তব্যসমূহ' },
    { id: 'gis-map', labelEn: 'GIS Map', labelBn: 'GIS ম্যাপ' },
    { id: 'districts', labelEn: 'Districts', labelBn: 'জেলাসমূহ' },
    { id: 'experiences', labelEn: 'Things to Do', labelBn: 'অভিজ্ঞতা' },
    { id: 'festivals', labelEn: 'Events', labelBn: 'উৎসব' },
    { id: 'news', labelEn: 'News', labelBn: 'সংবাদ' },
    { id: 'stories', labelEn: 'Stories', labelBn: 'গল্প ও ঐতিহ্য' },
    { id: 'community-gallery', labelEn: 'Community', labelBn: 'কমিউনিটি' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      id="main-header"
      className="h-[72px] px-3 md:px-6 lg:px-10 flex items-center justify-between border-b border-[#D8D0BC] bg-[#F6F3EA]/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-200"
    >
      {/* Brand Identity */}
      <button
        id="brand-logo-btn"
        onClick={() => handleNavClick('hero')}
        className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none shrink-0"
      >
        <div className="w-3.5 h-3.5 rounded-full bg-[#8C3B2E] ring-2 ring-[#DE9B2E] transition-transform duration-300 group-hover:scale-110 shadow-xs"></div>
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-bold tracking-tight text-[#0A2A21] font-serif leading-none">
            {language === 'en' ? 'Bangladesh' : 'বাংলাদেশ'}
          </span>
          <span className="text-[9px] tracking-widest text-[#6B756E] uppercase font-bold mt-0.5">
            {language === 'en' ? 'National Heritage & Tourism' : 'জাতীয় ঐতিহ্য ও পর্যটন'}
          </span>
        </div>
      </button>

      {/* Desktop Navigation */}
      <nav
        id="desktop-navigation"
        className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-[12px] font-bold uppercase tracking-wider text-[#4B554E]"
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`pb-1 transition-colors relative cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'text-[#0A2A21] font-extrabold border-b-2 border-[#DE9B2E]'
                  : 'hover:text-[#0A2A21]'
              }`}
            >
              {language === 'en' ? item.labelEn : item.labelBn}
            </button>
          );
        })}

        {/* Submit Report in Navigation Menu */}
        <button
          id="nav-submit-report-btn"
          onClick={onOpenReportModal}
          title={language === 'en' ? 'Submit a Report or Feedback (No Login Needed)' : 'রিপোর্ট বা অভিযোগ দাখিল করুন (লগইন প্রয়োজন নেই)'}
          className="relative flex items-center gap-1.5 pb-1 transition-colors text-[#4B554E] hover:text-[#8C3B2E] cursor-pointer whitespace-nowrap"
        >
          <Flag className="w-3.5 h-3.5 text-[#8C3B2E]" />
          <span>{language === 'en' ? 'Submit Report' : 'রিপোর্ট দাখিল'}</span>
        </button>

        {/* Account Menu (Contains User Submissions, Community, Wishlist, Story & Post when logged in) */}
        <div className="relative" ref={accountDropdownRef}>
          <button
            id="nav-account-btn"
            onClick={() => {
              if (currentUser) {
                setShowAccountDropdown((prev) => !prev);
              } else {
                onOpenAuth();
              }
            }}
            className={`flex items-center gap-1.5 pb-1 transition-colors cursor-pointer whitespace-nowrap ${
              showAccountDropdown ? 'text-[#0A2A21] font-extrabold' : 'text-[#4B554E] hover:text-[#0A2A21]'
            }`}
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Avatar"
                className="w-4 h-4 rounded-full object-cover border border-[#DE9B2E]"
              />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-[#DE9B2E]" />
            )}
            <span className="max-w-[110px] truncate">
              {currentUser
                ? currentUser.displayName?.split(' ')[0] || (language === 'en' ? 'Account' : 'অ্যাকাউন্ট')
                : language === 'en'
                ? 'Sign In'
                : 'লগইন'}
            </span>
            {isUserAdmin && (
              <span className="px-1.5 py-0.2 bg-[#0F3B2E] text-[#DE9B2E] border border-[#DE9B2E]/40 text-[9px] font-bold rounded-full">
                Admin
              </span>
            )}
            {currentUser && <ChevronDown className={`w-3 h-3 text-[#6B756E] transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />}
          </button>

          {/* Account Dropdown for Logged In User */}
          {showAccountDropdown && currentUser && (
            <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl shadow-xl border border-[#D8D0BC] p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Identity Header */}
              <div className="p-2.5 bg-[#FAF7F0] border border-[#E2DCce] rounded-xl flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Avatar"
                    className="w-9 h-9 rounded-full object-cover border border-[#DE9B2E] shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#0F3B2E] text-[#DE9B2E] flex items-center justify-center font-bold text-sm shrink-0">
                    {currentUser.displayName?.[0] || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#0A2A21] truncate">
                      {currentUser.displayName || (language === 'en' ? 'Explorer' : 'ভ্রমণকারী')}
                    </span>
                    {isUserAdmin && (
                      <span className="px-1.5 py-0.2 bg-[#0F3B2E] text-[#DE9B2E] text-[8px] font-bold rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#6B756E] truncate">
                    {currentUser.email || (currentUser.isAnonymous ? 'Guest User' : 'Authenticated')}
                  </p>
                </div>
              </div>

              {/* Account Submissions & Features Menu */}
              <div className="mt-2 pt-2 border-t border-[#D8D0BC]/60 space-y-1">
                <div className="px-2 py-0.5 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-[#6B756E]">
                  <span>{language === 'en' ? 'User Features' : 'ইউজার ফিচারসমূহ'}</span>
                  <span className="text-[8px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                    {language === 'en' ? 'Community' : 'কমিউনিটি'}
                  </span>
                </div>

                {/* Wishlist (Saved Places) */}
                <button
                  id="account-menu-wishlist-btn"
                  onClick={() => {
                    setShowAccountDropdown(false);
                    onOpenSavedModal();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF7F0] text-left transition-colors cursor-pointer text-xs font-bold text-[#0A2A21]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-[#DE9B2E] flex items-center justify-center shrink-0">
                      <Bookmark className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <div className="leading-tight">{language === 'en' ? 'Wishlist (Saved Places)' : 'উইশলিস্ট (সংরক্ষিত স্থান)'}</div>
                      <div className="text-[10px] font-normal text-[#6B756E]">{language === 'en' ? 'Bookmarked destinations' : 'সংরক্ষিত ভ্রমণ স্থানসমূহ'}</div>
                    </div>
                  </div>
                  {savedCount > 0 && (
                    <span className="px-2 py-0.5 bg-[#8C3B2E] text-white text-[10px] font-bold rounded-full">
                      {savedCount}
                    </span>
                  )}
                </button>

                {/* Share Photo Post */}
                <button
                  id="account-menu-share-photo-btn"
                  onClick={() => {
                    setShowAccountDropdown(false);
                    onOpenUploadModal();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#FAF7F0] text-left transition-colors cursor-pointer text-xs font-bold text-[#0A2A21]"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="leading-tight">{language === 'en' ? 'Share Photo Post' : 'ভ্রমণ পোস্ট / ছবি শেয়ার'}</div>
                    <div className="text-[10px] font-normal text-[#6B756E]">{language === 'en' ? 'Photo with caption & place' : 'ছবি, স্থান ও ক্যাপশন দিয়ে পোস্ট'}</div>
                  </div>
                </button>

                {/* Write Story */}
                <button
                  id="account-menu-write-story-btn"
                  onClick={() => {
                    setShowAccountDropdown(false);
                    if (onOpenStoryModal) onOpenStoryModal();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#FAF7F0] text-left transition-colors cursor-pointer text-xs font-bold text-[#0A2A21]"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="leading-tight">{language === 'en' ? 'Write Story' : 'ভ্রমণ আখ্যান লিখুন'}</div>
                    <div className="text-[10px] font-normal text-[#6B756E]">{language === 'en' ? 'Heritage & travel essay' : 'ঐতিহ্য ও সংস্কৃতির গল্প'}</div>
                  </div>
                </button>

                {/* Admin Control Panel (if admin) */}
                {isUserAdmin && onOpenAdmin && (
                  <button
                    id="account-menu-admin-btn"
                    onClick={() => {
                      setShowAccountDropdown(false);
                      onOpenAdmin();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-[#0F3B2E]/5 hover:bg-[#0F3B2E]/10 text-left transition-colors cursor-pointer text-xs font-bold text-[#0F3B2E]"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#0F3B2E] text-[#DE9B2E] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>{language === 'en' ? 'Admin Control Panel' : 'অ্যাডমিন কন্ট্রোল প্যানেল'}</span>
                  </button>
                )}

                {/* Profile & Account Details */}
                <button
                  id="account-menu-profile-btn"
                  onClick={() => {
                    setShowAccountDropdown(false);
                    onOpenAuth();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#FAF7F0] text-left transition-colors cursor-pointer text-xs font-bold text-[#4B554E] border-t border-[#D8D0BC]/40 mt-1 pt-2"
                >
                  <UserIcon className="w-4 h-4 text-[#6B756E]" />
                  <span>{language === 'en' ? 'Manage Account / Settings' : 'অ্যাকাউন্ট ও প্রোফাইল'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Right Controls */}
      <div id="header-action-controls" className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <div
          id="language-switch-group"
          className="flex border border-[#D8D0BC] rounded-full overflow-hidden text-[11px] font-bold shadow-xs bg-white/60"
        >
          <button
            id="lang-btn-en"
            onClick={() => onToggleLanguage('en')}
            className={`px-3 py-1 transition-all duration-200 cursor-pointer ${
              language === 'en'
                ? 'bg-[#0F3B2E] text-white shadow-xs'
                : 'text-[#4B554E] hover:bg-[#EFEADC]'
            }`}
          >
            EN
          </button>
          <button
            id="lang-btn-bn"
            onClick={() => onToggleLanguage('bn')}
            className={`px-3 py-1 transition-all duration-200 cursor-pointer ${
              language === 'bn'
                ? 'bg-[#0F3B2E] text-white shadow-xs'
                : 'text-[#4B554E] hover:bg-[#EFEADC]'
            }`}
          >
            বাং
          </button>
        </div>

        {/* Search Trigger */}
        <button
          id="search-trigger-btn"
          onClick={onOpenSearch}
          aria-label="Search destinations and experiences"
          className="p-2 bg-white rounded-full border border-[#D8D0BC] shadow-xs hover:bg-[#F0EBE0] text-[#0A2A21] transition-all hover:scale-105 cursor-pointer"
        >
          <Search className="w-4 h-4 text-[#0A2A21]" />
        </button>

        {/* Plan Trip CTA button */}
        <button
          id="plan-trip-header-btn"
          onClick={onOpenTripPlanner}
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F3B2E] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#0A2A21] transition-all shadow-xs hover:shadow-md cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-[#DE9B2E]" />
          <span>{language === 'en' ? 'Plan' : 'প্ল্যান'}</span>
        </button>

        {/* Mobile Menu Trigger */}
        <button
          id="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-[#0A2A21] hover:bg-[#EFEADC] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu-drawer"
          className="lg:hidden absolute top-[72px] left-0 right-0 bg-[#F6F3EA] border-b border-[#D8D0BC] shadow-xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200 max-h-[calc(100vh-80px)] overflow-y-auto"
        >
          <nav className="flex flex-col gap-2.5 text-sm font-bold uppercase tracking-wider text-[#4B554E]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left py-2 px-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-[#0F3B2E] text-white'
                    : 'hover:bg-[#EFEADC] text-[#0A2A21]'
                }`}
              >
                {language === 'en' ? item.labelEn : item.labelBn}
              </button>
            ))}

            {/* Submit Report in Mobile Menu */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenReportModal) onOpenReportModal();
              }}
              className="flex items-center justify-between text-left py-2 px-3 rounded-lg hover:bg-[#EFEADC] text-[#8C3B2E] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-[#8C3B2E]" />
                <span className="font-bold">{language === 'en' ? 'Submit Report / Feedback' : 'রিপোর্ট / অভিযোগ দাখিল করুন'}</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                {language === 'en' ? 'No Login' : 'মুক্ত'}
              </span>
            </button>

            {/* Account Section in Mobile Menu */}
            {!currentUser ? (
              <button
                id="mobile-sign-in-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="flex items-center justify-between text-left py-2.5 px-3.5 rounded-xl bg-[#0F3B2E] text-white hover:bg-[#0A2A21] transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-4 h-4 text-[#DE9B2E]" />
                  <span className="font-bold">{language === 'en' ? 'Sign In / Account' : 'সাইন ইন / অ্যাকাউন্ট'}</span>
                </div>
                <span className="text-[10px] font-bold text-[#DE9B2E] uppercase tracking-wider">
                  {language === 'en' ? 'Login' : 'প্রবেশ'}
                </span>
              </button>
            ) : (
              <div className="p-3 bg-white border border-[#D8D0BC] rounded-2xl shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#D8D0BC]/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-[#DE9B2E] shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#0F3B2E] text-[#DE9B2E] flex items-center justify-center font-bold text-xs shrink-0">
                        {currentUser.displayName?.[0] || 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#0A2A21] truncate max-w-[130px]">
                          {currentUser.displayName || (language === 'en' ? 'Explorer' : 'ভ্রমণকারী')}
                        </span>
                        {isUserAdmin && (
                          <span className="px-1.5 py-0.2 bg-[#0F3B2E] text-[#DE9B2E] text-[8px] font-bold rounded-full shrink-0">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#6B756E] truncate max-w-[150px]">
                        {currentUser.email || 'Authenticated'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="text-[11px] font-bold text-[#0F3B2E] hover:underline shrink-0"
                  >
                    {language === 'en' ? 'Profile' : 'প্রোফাইল'}
                  </button>
                </div>

                {/* Account Features & Submissions */}
                <div className="space-y-1">
                  {/* Wishlist (Saved Places) */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSavedModal();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF7F0] text-left text-xs font-bold text-[#0A2A21] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-[#DE9B2E] fill-current" />
                      <span>{language === 'en' ? 'Wishlist (Saved Places)' : 'উইশলিস্ট (সংরক্ষিত স্থান)'}</span>
                    </div>
                    {savedCount > 0 && (
                      <span className="px-2 py-0.5 bg-[#8C3B2E] text-white text-[10px] font-bold rounded-full">
                        {savedCount}
                      </span>
                    )}
                  </button>

                  {/* Share Photo Post */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenUploadModal();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-[#FAF7F0] text-left text-xs font-bold text-[#0A2A21] cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{language === 'en' ? 'Share Photo Post' : 'ভ্রমণ পোস্ট / ছবি শেয়ার'}</span>
                  </button>

                  {/* Write Story */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenStoryModal) onOpenStoryModal();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-[#FAF7F0] text-left text-xs font-bold text-[#0A2A21] cursor-pointer"
                  >
                    <PenTool className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{language === 'en' ? 'Write Story' : 'ভ্রমণ আখ্যান লিখুন'}</span>
                  </button>

                  {/* Admin Control Panel */}
                  {isUserAdmin && onOpenAdmin && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAdmin();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl bg-[#0F3B2E]/10 text-left text-xs font-bold text-[#0F3B2E] cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#DE9B2E] shrink-0" />
                      <span>{language === 'en' ? 'Admin Control Panel' : 'অ্যাডমিন প্যানেল'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </nav>
          <div className="pt-3 border-t border-[#D8D0BC] flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTripPlanner();
              }}
              className="w-full py-2.5 bg-[#0F3B2E] text-white rounded-full font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-[#DE9B2E]" />
              {language === 'en' ? 'Custom Itinerary Planner' : 'ভ্রমণ পরিকল্পনা'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

