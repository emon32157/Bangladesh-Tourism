import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { subscribeNewsletter } from '../lib/newsletter';

interface NewsletterSubscriptionProps {
  language: Language;
}

export const NewsletterSubscription: React.FC<NewsletterSubscriptionProps> = ({ language }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'already';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await subscribeNewsletter(email, language);
      if (res.success) {
        setStatus({
          type: res.alreadySubscribed ? 'already' : 'success',
          message: language === 'en' ? res.messageEn : res.messageBn,
        });
        if (!res.alreadySubscribed) {
          setEmail('');
        }
      } else {
        setStatus({
          type: 'error',
          message: language === 'en' ? res.messageEn : res.messageBn,
        });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message:
          language === 'en'
            ? 'Something went wrong. Please try again.'
            : 'কোনো সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="newsletter-subscription-box"
      className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#0F3B2E] via-[#0A2A21] to-[#12241D] text-white border border-[#2E5E4E] shadow-lg relative overflow-hidden"
    >
      {/* Decorative ambient subtle circle */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#DE9B2E]/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-[#8C3B2E]/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Header Text */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#DE9B2E] text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
            <span>{language === 'en' ? 'Weekly Travel Bulletin' : 'সাপ্তাহিক ভ্রমণ বার্তা'}</span>
          </div>

          <h3 className="text-xl md:text-2xl font-bold font-serif text-[#F6F3EA]">
            {language === 'en'
              ? 'Stay Connected with Bangladesh Tourism'
              : 'বাংলাদেশ পর্যটন ও ঐতিহ্যের নিয়মিত আপডেট পান'}
          </h3>

          <p className="text-xs md:text-sm text-[#D8D0BC] leading-relaxed">
            {language === 'en'
              ? 'Subscribe for curated seasonal itineraries, festival calendars, and hidden heritage destination discoveries across all 64 districts.'
              : 'সব ৬৪ জেলার ঐতিহ্যবাহী দর্শনীয় স্থান, মৌসুমী ভ্রমণ টিপস এবং উৎসবের সময়সূচী পেতে আপনার ইমেইল দিয়ে সাবস্ক্রাইব করুন।'}
          </p>
        </div>

        {/* Subscription Form */}
        <div className="w-full lg:w-auto lg:min-w-[380px] space-y-3">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8BA49B]" />
              <input
                id="newsletter-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status) setStatus(null);
                }}
                placeholder={
                  language === 'en' ? 'Enter your email address...' : 'আপনার ইমেইল ঠিকানা লিখুন...'
                }
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-[#8BA49B] text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#DE9B2E] focus:bg-white/15 transition-all"
              />
            </div>

            <button
              id="newsletter-submit-btn"
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-[#DE9B2E] hover:bg-[#C8851E] active:scale-95 text-[#0A2A21] font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A2A21]" />
                  <span>{language === 'en' ? 'Subscribing...' : 'যুক্ত হচ্ছে...'}</span>
                </>
              ) : (
                <span>{language === 'en' ? 'Subscribe' : 'সাবস্ক্রাইব করুন'}</span>
              )}
            </button>
          </form>

          {/* Feedback Alert */}
          {status && (
            <div
              id="newsletter-feedback-alert"
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 transition-all ${
                status.type === 'error'
                  ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                  : status.type === 'already'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
              }`}
            >
              {status.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{status.message}</span>
            </div>
          )}

          <p className="text-[11px] text-[#8BA49B]">
            {language === 'en'
              ? 'No spam, ever. Unsubscribe at any time with one click.'
              : 'স্প্যাম মুক্ত নিশ্চয়তা। যেকোনো সময় আনসাবস্ক্রাইব করতে পারবেন।'}
          </p>
        </div>
      </div>
    </div>
  );
};
