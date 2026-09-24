import React, { useState } from 'react';
import { DESTINATIONS, EXPERIENCES, FESTIVALS, EDITORIAL_STORIES } from '../data/bangladeshData';
import { Destination, Experience, Festival, EditorialStory, Language } from '../types';
import { X, Search, MapPin, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  language: Language;
  onClose: () => void;
  onSelectDestination: (dest: Destination) => void;
  onSelectExperience: (exp: Experience) => void;
  onSelectFestival: (fest: Festival) => void;
  onSelectStory: (story: EditorialStory) => void;
  destinations?: Destination[];
  experiences?: Experience[];
  festivals?: Festival[];
  stories?: EditorialStory[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  language,
  onClose,
  onSelectDestination,
  onSelectExperience,
  onSelectFestival,
  onSelectStory,
  destinations = DESTINATIONS,
  experiences = EXPERIENCES,
  festivals = FESTIVALS,
  stories = EDITORIAL_STORIES,
}) => {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const matchedDestinations = q
    ? (() => {
        const seen = new Set<string>();
        return destinations.filter((d) => {
          if (!d || !d.id || seen.has(d.id)) return false;
          seen.add(d.id);
          return (
            d.title.toLowerCase().includes(q) ||
            d.titleBn.toLowerCase().includes(q) ||
            d.division.toLowerCase().includes(q) ||
            d.summary.toLowerCase().includes(q)
          );
        });
      })()
    : [];

  const matchedExperiences = q
    ? experiences.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.titleBn.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      )
    : [];

  const matchedFestivals = q
    ? festivals.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.titleBn.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      )
    : [];

  const matchedStories = q
    ? stories.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.titleBn.toLowerCase().includes(q) ||
          s.excerpt.toLowerCase().includes(q)
      )
    : [];

  const totalMatches =
    matchedDestinations.length +
    matchedExperiences.length +
    matchedFestivals.length +
    matchedStories.length;

  return (
    <div
      id="search-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="search-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F6F3EA] w-full max-w-2xl rounded-[32px] border border-[#D8D0BC] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto"
      >
        {/* Search Input Bar */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#D8D0BC] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#0F3B2E] shrink-0" />
          <input
            id="search-input-field"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === 'en'
                ? "Search Cox's Bazar, Sundarbans, Tea gardens, festivals..."
                : 'কক্সবাজার, সুন্দরবন, চা বাগান বা উৎসব খুঁজুন...'
            }
            autoFocus
            className="w-full bg-transparent text-[#0A2A21] placeholder-[#4B554E]/60 text-base sm:text-lg font-medium focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-[#4B554E] hover:text-[#0A2A21] rounded-full hover:bg-[#EFEADC]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#F6F3EA] rounded-full text-xs font-bold text-[#4B554E] hover:bg-[#EFEADC]"
          >
            Esc
          </button>
        </div>

        {/* Results Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!query ? (
            <div className="space-y-4 text-center py-8">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6B756E]">
                {language === 'en' ? 'Popular Searches' : 'জনপ্রিয় অনুসন্ধান'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Sundarbans', "Cox's Bazar", 'Paharpur', 'Sajek', 'Tea Gardens', 'Pohela Boishakh', 'Jamdani'].map(
                  (term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3.5 py-1.5 bg-white border border-[#D8D0BC] rounded-full text-xs font-bold text-[#0F3B2E] hover:bg-[#EFEADC] transition-colors"
                    >
                      {term}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : totalMatches === 0 ? (
            <div className="py-12 text-center text-sm text-[#6B756E]">
              {language === 'en' ? `No results found for "${query}"` : `"${query}" এর জন্য কোনো ফলাফল পাওয়া যায়নি`}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Destinations */}
              {matchedDestinations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider">
                    {language === 'en' ? 'Destinations' : 'গন্তব্যসমূহ'} ({matchedDestinations.length})
                  </h4>
                  <div className="space-y-2">
                    {matchedDestinations.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          onSelectDestination(d);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#D8D0BC] hover:border-[#DE9B2E] transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={d.image}
                            alt={d.title}
                            className="w-12 h-12 rounded-xl object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-sm font-bold text-[#0A2A21] group-hover:text-[#8C3B2E]">
                              {language === 'en' ? d.title : d.titleBn}
                            </p>
                            <p className="text-xs text-[#4B554E] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#DE9B2E]" />
                              {d.division}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#4B554E] group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experiences */}
              {matchedExperiences.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider">
                    {language === 'en' ? 'Activities & Experiences' : 'অভিজ্ঞতা'} ({matchedExperiences.length})
                  </h4>
                  <div className="space-y-2">
                    {matchedExperiences.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          onSelectExperience(e);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#D8D0BC] hover:border-[#DE9B2E] transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#DE9B2E]/15 flex items-center justify-center text-xl">
                            {e.icon}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0A2A21] group-hover:text-[#8C3B2E]">
                              {language === 'en' ? e.title : e.titleBn}
                            </p>
                            <p className="text-xs text-[#4B554E]">{e.location}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#4B554E] group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Festivals */}
              {matchedFestivals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider">
                    {language === 'en' ? 'Festivals' : 'উৎসব'} ({matchedFestivals.length})
                  </h4>
                  <div className="space-y-2">
                    {matchedFestivals.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => {
                          onSelectFestival(f);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#D8D0BC] hover:border-[#DE9B2E] transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#DE9B2E] flex items-center justify-center text-xl">
                            {f.emoji}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0A2A21] group-hover:text-[#8C3B2E]">
                              {language === 'en' ? f.title : f.titleBn}
                            </p>
                            <p className="text-xs text-[#4B554E]">
                              {language === 'en' ? f.date : f.dateBn}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#4B554E] group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stories */}
              {matchedStories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider">
                    {language === 'en' ? 'Stories & Essays' : 'গল্প ও প্রবন্ধ'} ({matchedStories.length})
                  </h4>
                  <div className="space-y-2">
                    {matchedStories.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onSelectStory(s);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#D8D0BC] hover:border-[#DE9B2E] transition-all cursor-pointer group"
                      >
                        <div>
                          <p className="text-sm font-bold text-[#0A2A21] group-hover:text-[#8C3B2E]">
                            {language === 'en' ? s.title : s.titleBn}
                          </p>
                          <p className="text-xs text-[#4B554E]">{s.author} • {s.category}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#4B554E] group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
