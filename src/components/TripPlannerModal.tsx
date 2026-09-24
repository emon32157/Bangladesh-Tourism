import React, { useState } from 'react';
import { ITINERARY_PLANS, DESTINATIONS } from '../data/bangladeshData';
import { Destination, Language } from '../types';
import { X, Compass, Calendar, Check, Download, MapPin, Sparkles, Plus, Trash2 } from 'lucide-react';

interface TripPlannerModalProps {
  language: Language;
  onClose: () => void;
  savedDestinations: Destination[];
  preselectedDestination?: Destination | null;
}

export const TripPlannerModal: React.FC<TripPlannerModalProps> = ({
  language,
  onClose,
  savedDestinations,
  preselectedDestination,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-7days');
  const [customList, setCustomList] = useState<Destination[]>(
    preselectedDestination ? [preselectedDestination] : (savedDestinations || []).slice(0, 3)
  );
  const [activeTab, setActiveTab] = useState<'curated' | 'custom'>('curated');
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'Valid Passport & Bangladesh Visa on Arrival/E-visa', done: true },
    { id: '2', text: 'Lightweight breathable cotton clothing & rain poncho', done: true },
    { id: '3', text: 'Insect repellent & natural sunscreen for mangroves', done: false },
    { id: '4', text: 'Comfortable walking sandals and slip-on footwear for temples', done: false },
    { id: '5', text: 'Local BDT cash currency for village bazaars and rickshaws', done: false },
  ]);

  const activePlan = ITINERARY_PLANS.find((p) => p.id === selectedPlanId) || ITINERARY_PLANS[0];

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const removeCustom = (id: string) => {
    setCustomList((prev) => prev.filter((d) => d.id !== id));
  };

  const addCustomDestination = (dest: Destination) => {
    if (!customList.some((d) => d.id === dest.id)) {
      setCustomList((prev) => [...prev, dest]);
    }
  };

  return (
    <div
      id="trip-planner-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="trip-planner-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F6F3EA] w-full max-w-4xl rounded-[36px] border border-[#D8D0BC] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 bg-white/80 border-b border-[#D8D0BC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0F3B2E] text-white flex items-center justify-center text-xl shadow-md">
              <Compass className="w-6 h-6 text-[#DE9B2E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8C3B2E]">
                  {language === 'en' ? 'Editorial Travel Guide' : 'ভ্রমণ সহায়িকা'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#DE9B2E]"></span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Trip Itinerary & Travel Planner' : 'ভ্রমণ পরিকল্পনা ও রুটম্যাপ'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-white rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 flex gap-3 border-b border-[#D8D0BC] bg-[#F6F3EA]">
          <button
            onClick={() => setActiveTab('curated')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'curated'
                ? 'border-[#0F3B2E] text-[#0A2A21]'
                : 'border-transparent text-[#4B554E] hover:text-[#0A2A21]'
            }`}
          >
            {language === 'en' ? 'Curated Master Itineraries' : 'নির্বাচিত ভ্রমণ পরিকল্পনা'}
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'custom'
                ? 'border-[#0F3B2E] text-[#0A2A21]'
                : 'border-transparent text-[#4B554E] hover:text-[#0A2A21]'
            }`}
          >
            {language === 'en' ? `Custom Route (${customList.length} Places)` : `কাস্টম রুট (${customList.length} স্থান)`}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {activeTab === 'curated' ? (
            <>
              {/* Plan Duration Selector */}
              <div className="flex flex-wrap gap-3">
                {ITINERARY_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#0F3B2E] text-white border-[#0F3B2E] shadow-md'
                          : 'bg-white text-[#4B554E] border-[#D8D0BC] hover:bg-[#EFEADC]'
                      }`}
                    >
                      {plan.days} {language === 'en' ? 'Days Route' : 'দিনের রুট'} — {language === 'en' ? plan.title.split(':')[0] : plan.titleBn.split(' ')[0]}
                    </button>
                  );
                })}
              </div>

              {/* Active Plan Card Header */}
              <div className="p-5 bg-white rounded-2xl border border-[#D8D0BC] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B87E20] bg-[#DE9B2E]/15 px-3 py-1 rounded-full">
                    {activePlan.focus}
                  </span>
                  <span className="text-xs text-[#4B554E] font-medium">{activePlan.recommendedFor}</span>
                </div>
                <h3 className="text-xl font-bold font-serif text-[#0A2A21]">
                  {language === 'en' ? activePlan.title : activePlan.titleBn}
                </h3>
              </div>

              {/* Day-by-Day Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider">
                  {language === 'en' ? 'Daily Travel Schedule' : 'প্রতিদিনের কর্মসূচি'}
                </h4>
                <div className="space-y-3">
                  {activePlan.daysList.map((item) => (
                    <div
                      key={item.day}
                      className="flex gap-4 p-4 rounded-2xl bg-white border border-[#D8D0BC]/80 shadow-2xs items-start"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#0F3B2E] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        D{item.day}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-sm text-[#0A2A21]">{item.title}</h5>
                          <span className="text-[10px] font-bold text-[#DE9B2E] bg-[#DE9B2E]/10 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                        </div>
                        <p className="text-xs text-[#4B554E] leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Custom Route builder */
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-2xl border border-[#D8D0BC]">
                <h4 className="text-sm font-bold text-[#0A2A21] font-serif">
                  {language === 'en' ? 'Your Personal Route Bucket' : 'আপনার পছন্দসই গন্তব্য তালিকা'}
                </h4>
                <p className="text-xs text-[#4B554E] mt-1">
                  {language === 'en'
                    ? 'Add destinations from the catalog or bookmarks to build your personalized Bangladesh expedition.'
                    : 'আপনার পছন্দমতো স্থান যুক্ত করে নিজস্ব ভ্রমণ পরিকল্পনা সাজান।'}
                </p>
              </div>

              {/* Selected Places List */}
              {customList.length === 0 ? (
                <div className="p-8 text-center bg-white/50 rounded-2xl border border-dashed border-[#D8D0BC] text-sm text-[#6B756E]">
                  {language === 'en'
                    ? 'No destinations added yet. Choose from below to add to your custom itinerary.'
                    : 'এখনও কোনো স্থান যুক্ত করা হয়নি। নিচের তালিকা থেকে যুক্ত করুন।'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customList.map((dest, idx) => (
                    <div
                      key={dest.id}
                      className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#D8D0BC] gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#0F3B2E] text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#0A2A21]">
                            {language === 'en' ? dest.title : dest.titleBn}
                          </p>
                          <p className="text-[10px] text-[#4B554E]">{dest.duration}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCustom(dest.id)}
                        className="p-1.5 text-[#8C3B2E] hover:bg-[#8C3B2E]/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Add Pool */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider">
                  {language === 'en' ? 'Quick Add More Destinations' : 'আরও স্থান যুক্ত করুন'}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {DESTINATIONS.map((d) => {
                    const alreadyAdded = customList.some((item) => item.id === d.id);
                    return (
                      <button
                        key={d.id}
                        disabled={alreadyAdded}
                        onClick={() => addCustomDestination(d)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          alreadyAdded
                            ? 'bg-[#0F3B2E]/10 text-[#0F3B2E]/50 cursor-not-allowed'
                            : 'bg-white border border-[#D8D0BC] text-[#0A2A21] hover:bg-[#EFEADC] cursor-pointer'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{language === 'en' ? d.title.split(' ')[0] : d.titleBn.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Essential Travel Preparation Checklist */}
          <div className="p-5 bg-white rounded-2xl border border-[#D8D0BC] space-y-3">
            <h4 className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
              {language === 'en' ? 'Essential Traveler Checklist' : 'প্রয়োজনীয় ভ্রমণ প্রস্তুতি'}
            </h4>
            <div className="space-y-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F6F3EA] cursor-pointer text-xs text-[#1B211D] select-none"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleCheck(item.id)}
                    className="w-4 h-4 rounded text-[#0F3B2E] accent-[#0F3B2E] cursor-pointer"
                  />
                  <span className={item.done ? 'line-through text-[#6B756E]' : 'font-medium'}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer action */}
          <div className="pt-4 border-t border-[#D8D0BC] flex items-center justify-between">
            <p className="text-xs text-[#6B756E]">
              {language === 'en'
                ? 'Tip: Inland water transport and domestic flights are available between all major divisions.'
                : 'পরামর্শ: সকল প্রধান বিভাগের মধ্যে অভ্যন্তরীণ বিমান ও নৌযান চলাচল ব্যবস্থা রয়েছে।'}
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#0F3B2E] text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-[#0A2A21] transition-all cursor-pointer"
            >
              {language === 'en' ? 'Close Planner' : 'বন্ধ করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
