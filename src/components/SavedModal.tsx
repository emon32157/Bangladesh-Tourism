import React, { useState } from 'react';
import { DESTINATIONS } from '../data/bangladeshData';
import { Destination, Language, EditorialStory, CommunityPost } from '../types';
import { X, Bookmark, Trash2, ArrowRight, Compass, BookOpen, Camera, MapPin } from 'lucide-react';

interface SavedModalProps {
  language: Language;
  onClose: () => void;
  savedIds: string[];
  onRemoveSave: (id: string) => void;
  onSelectDestination: (dest: Destination) => void;
  onSelectStory?: (story: EditorialStory) => void;
  onSelectPost?: (post: CommunityPost) => void;
  onOpenTripPlanner: () => void;
  allDestinations?: Destination[];
  allStories?: EditorialStory[];
  allPosts?: CommunityPost[];
}

export const SavedModal: React.FC<SavedModalProps> = ({
  language,
  onClose,
  savedIds,
  onRemoveSave,
  onSelectDestination,
  onSelectStory,
  onSelectPost,
  onOpenTripPlanner,
  allDestinations = DESTINATIONS,
  allStories = [],
  allPosts = [],
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'destinations' | 'stories' | 'posts'>('all');

  const safeSavedIds = savedIds || [];
  const savedDestinations = (allDestinations || []).filter((d) => d && safeSavedIds.includes(d.id));
  const savedStories = (allStories || []).filter((s) => s && safeSavedIds.includes(s.id));
  const savedPosts = (allPosts || []).filter((p) => p && safeSavedIds.includes(p.id));

  const totalSaved = savedDestinations.length + savedStories.length + savedPosts.length;

  return (
    <div
      id="saved-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="saved-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F6F3EA] w-full max-w-2xl rounded-[32px] border border-[#D8D0BC] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto"
      >
        <div className="p-6 bg-white border-b border-[#D8D0BC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8C3B2E] text-white flex items-center justify-center shadow-xs">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Wishlist & Saved Items' : 'উইশলিস্ট ও সংরক্ষিত আইটেম'}
              </h3>
              <p className="text-xs text-[#4B554E]">
                {totalSaved} {language === 'en' ? 'items saved in your account' : 'টি আইটেম আপনার একাউন্টে সংরক্ষিত'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="px-6 pt-4 pb-2 bg-white/50 border-b border-[#D8D0BC] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', labelEn: `All (${totalSaved})`, labelBn: `সব (${totalSaved})` },
            { id: 'destinations', labelEn: `Destinations (${savedDestinations.length})`, labelBn: `স্থান (${savedDestinations.length})` },
            { id: 'stories', labelEn: `Stories (${savedStories.length})`, labelBn: `স্টোরি (${savedStories.length})` },
            { id: 'posts', labelEn: `Photos (${savedPosts.length})`, labelBn: `ছবি (${savedPosts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#0F3B2E] text-white shadow-xs'
                  : 'bg-white border border-[#D8D0BC] text-[#4B554E] hover:border-[#0F3B2E]'
              }`}
            >
              {language === 'en' ? tab.labelEn : tab.labelBn}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {totalSaved === 0 ? (
            <div className="py-12 text-center text-sm text-[#6B756E] space-y-2">
              <Bookmark className="w-8 h-8 text-[#D8D0BC] mx-auto mb-2" />
              <p>
                {language === 'en'
                  ? 'No saved items yet. Click the bookmark icon on any destination, story, or photo to save it here.'
                  : 'এখনও কোনো আইটেম সংরক্ষণ করেননি। যেকোনো স্থান, স্টোরি বা ছবির বুকমার্ক আইকনে ক্লিক করে সংরক্ষণ করুন।'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Destinations */}
              {(activeTab === 'all' || activeTab === 'destinations') &&
                savedDestinations.filter(Boolean).map((dest) => (
                  <div
                    key={`dest-${dest.id}`}
                    className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#D8D0BC] hover:border-[#DE9B2E] transition-all gap-4 shadow-2xs"
                  >
                    <div
                      onClick={() => {
                        onSelectDestination(dest);
                        onClose();
                      }}
                      className="flex items-center gap-3.5 flex-1 cursor-pointer"
                    >
                      <img
                        src={dest.image || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80'}
                        alt={dest.title || 'Destination'}
                        className="w-14 h-14 rounded-xl object-cover bg-neutral-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#0F3B2E]/10 text-[#0F3B2E] rounded-md">
                            {language === 'en' ? 'Destination' : 'স্থান'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#0A2A21]">
                          {language === 'en' ? dest.title : dest.titleBn || dest.title}
                        </h4>
                        <p className="text-xs text-[#4B554E]">{dest.division} • {dest.duration}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRemoveSave(dest.id)}
                        className="p-2 text-[#8C3B2E] hover:bg-[#8C3B2E]/10 rounded-full transition-colors cursor-pointer"
                        title={language === 'en' ? 'Remove from Wishlist' : 'উইশলিস্ট থেকে বাদ দিন'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          onSelectDestination(dest);
                          onClose();
                        }}
                        className="p-2 text-[#0F3B2E] hover:bg-[#0F3B2E]/10 rounded-full transition-colors cursor-pointer"
                        title={language === 'en' ? 'View Details' : 'বিস্তারিত দেখুন'}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {/* Stories */}
              {(activeTab === 'all' || activeTab === 'stories') &&
                savedStories.filter(Boolean).map((story) => (
                  <div
                    key={`story-${story.id}`}
                    className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#D8D0BC] hover:border-[#DE9B2E] transition-all gap-4 shadow-2xs"
                  >
                    <div
                      onClick={() => {
                        if (onSelectStory) onSelectStory(story);
                        onClose();
                      }}
                      className="flex items-center gap-3.5 flex-1 cursor-pointer"
                    >
                      <img
                        src={story.image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80'}
                        alt={story.title || 'Story'}
                        className="w-14 h-14 rounded-xl object-cover bg-neutral-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#DE9B2E]/20 text-[#8C3B2E] rounded-md">
                            {language === 'en' ? 'Story' : 'স্টোরি'}
                          </span>
                          <span className="text-[10px] text-[#6B756E]">{story.category}</span>
                        </div>
                        <h4 className="font-bold text-sm text-[#0A2A21] line-clamp-1">
                          {language === 'en' ? story.title : story.titleBn || story.title}
                        </h4>
                        <p className="text-xs text-[#4B554E]">{story.author} • {story.readTime}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRemoveSave(story.id)}
                        className="p-2 text-[#8C3B2E] hover:bg-[#8C3B2E]/10 rounded-full transition-colors cursor-pointer"
                        title={language === 'en' ? 'Remove from Wishlist' : 'উইশলিস্ট থেকে বাদ দিন'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSelectStory) onSelectStory(story);
                          onClose();
                        }}
                        className="p-2 text-[#0F3B2E] hover:bg-[#0F3B2E]/10 rounded-full transition-colors cursor-pointer"
                        title={language === 'en' ? 'Read Story' : 'স্টোরি পড়ুন'}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {/* Community Posts */}
              {(activeTab === 'all' || activeTab === 'posts') &&
                savedPosts.filter(Boolean).map((post) => (
                  <div
                    key={`post-${post.id}`}
                    className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#D8D0BC] hover:border-[#DE9B2E] transition-all gap-4 shadow-2xs"
                  >
                    <div
                      onClick={() => {
                        if (onSelectPost) onSelectPost(post);
                        onClose();
                      }}
                      className="flex items-center gap-3.5 flex-1 cursor-pointer"
                    >
                      <img
                        src={post.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'}
                        alt={post.title || 'Community Post'}
                        className="w-14 h-14 rounded-xl object-cover bg-neutral-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                            {language === 'en' ? 'Photo Post' : 'ফটো পোস্ট'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#0A2A21] line-clamp-1">
                          {post.title}
                        </h4>
                        <p className="text-xs text-[#4B554E]">{post.location} • {post.userName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRemoveSave(post.id)}
                        className="p-2 text-[#8C3B2E] hover:bg-[#8C3B2E]/10 rounded-full transition-colors cursor-pointer"
                        title={language === 'en' ? 'Remove from Wishlist' : 'উইশলিস্ট থেকে বাদ দিন'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSelectPost) onSelectPost(post);
                          onClose();
                        }}
                        className="p-2 text-[#0F3B2E] hover:bg-[#0F3B2E]/10 rounded-full transition-colors cursor-pointer"
                        title={language === 'en' ? 'View Photo' : 'ছবি দেখুন'}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {savedDestinations.length > 0 && (
            <div className="pt-4 border-t border-[#D8D0BC] flex justify-between items-center">
              <button
                onClick={() => {
                  onClose();
                  onOpenTripPlanner();
                }}
                className="px-6 py-3 bg-[#0F3B2E] text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-[#0A2A21] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Compass className="w-4 h-4 text-[#DE9B2E]" />
                <span>{language === 'en' ? 'Plan Itinerary with Saved' : 'সংরক্ষিত স্থান দিয়ে ভ্রমণ সাজান'}</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 border border-[#D8D0BC] text-[#4B554E] rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#EFEADC] transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Close' : 'বন্ধ করুন'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
