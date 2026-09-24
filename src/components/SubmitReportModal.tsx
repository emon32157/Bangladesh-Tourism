/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Language, AppUser, ReportCategory, UserReport } from '../types';
import { uploadImageToImgBB } from '../lib/imgbb';
import { submitUserReport } from '../lib/reports';
import {
  X,
  AlertTriangle,
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  HelpCircle,
  ShieldCheck,
  Send,
  FileText,
  User,
  Mail,
  Phone,
} from 'lucide-react';

interface SubmitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: AppUser | null;
  onReportSubmitted?: (report: UserReport) => void;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  isOpen,
  onClose,
  language,
  currentUser,
  onReportSubmitted,
}) => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<ReportCategory>('incorrect_info');
  const [details, setDetails] = useState('');
  const [reporterName, setReporterName] = useState(currentUser?.displayName || '');
  const [reporterContact, setReporterContact] = useState(currentUser?.email || '');
  
  // Image handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');

  const [submitting, setSubmitting] = useState(false);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage(
          language === 'en' ? 'File size must be under 25MB' : 'ছবির সাইজ ২৫ মেগাবাইটের কম হতে হবে'
        );
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!subject.trim()) {
      setErrorMessage(
        language === 'en' ? 'Please enter a report subject' : 'রিপোর্টের বিষয় বা শিরোনাম লিখুন'
      );
      return;
    }

    if (!details.trim()) {
      setErrorMessage(
        language === 'en'
          ? 'Please provide detailed information for your report'
          : 'দয়া করে আপনার অভিযোগ বা মতামতের বিস্তারিত বিবরণ দিন'
      );
      return;
    }

    setSubmitting(true);

    try {
      let finalImageUrl: string | undefined = undefined;

      // 1. Upload image if selected
      if (imageInputMode === 'upload' && selectedFile) {
        setUploadStage(
          language === 'en' ? 'Uploading attachment image...' : 'সংযুক্ত ছবি আপলোড করা হচ্ছে...'
        );
        const imgResult = await uploadImageToImgBB(selectedFile, (subject || 'Report').slice(0, 30));
        if (imgResult.success && imgResult.url) {
          finalImageUrl = imgResult.url;
        }
      } else if (imageInputMode === 'url' && customImageUrl.trim()) {
        finalImageUrl = customImageUrl.trim();
      }

      // 2. Submit report to Firestore / Local cache
      setUploadStage(
        language === 'en' ? 'Transmitting report to Admin Center...' : 'অ্যাডমিন প্যানেলে রিপোর্ট পাঠানো হচ্ছে...'
      );

      const newReport = await submitUserReport({
        subject,
        details,
        category,
        imageUrl: finalImageUrl,
        reporterName: reporterName.trim() || undefined,
        reporterEmail: reporterContact.includes('@') ? reporterContact.trim() : undefined,
        reporterContact: reporterContact.trim() || undefined,
        userId: currentUser?.uid,
      });

      setSubmittedReportId(newReport.id);
      setIsSuccess(true);
      if (onReportSubmitted) {
        onReportSubmitted(newReport);
      }
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setErrorMessage(
        language === 'en'
          ? 'Failed to submit report. Please check your connection and try again.'
          : 'রিপোর্ট সাবমিট করতে সমস্যা হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।'
      );
    } finally {
      setSubmitting(false);
      setUploadStage(null);
    }
  };

  const handleResetAndClose = () => {
    setSubject('');
    setCategory('incorrect_info');
    setDetails('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setCustomImageUrl('');
    setErrorMessage(null);
    setIsSuccess(false);
    onClose();
  };

  const categories: { id: ReportCategory; labelEn: string; labelBn: string; icon: string }[] = [
    { id: 'incorrect_info', labelEn: 'Incorrect Information', labelBn: 'ভুল বা অসত্য তথ্য', icon: '📝' },
    { id: 'technical_issue', labelEn: 'Technical / Bug Issue', labelBn: 'কারিগরি ত্রুটি বা বাগ', icon: '⚙️' },
    { id: 'tourism_feedback', labelEn: 'Tourism Feedback', labelBn: 'পর্যটন মতামত / সমস্যা', icon: '🌄' },
    { id: 'safety_concern', labelEn: 'Safety / Travel Advisory', labelBn: 'নিরাপত্তা ও সতর্কতা', icon: '🛡️' },
    { id: 'inappropriate_content', labelEn: 'Inappropriate Content', labelBn: 'অনুপযুক্ত কনটেন্ট', icon: '⚠️' },
    { id: 'other', labelEn: 'General / Other', labelBn: 'অন্যান্য বিষয়', icon: '💬' },
  ];

  return (
    <div
      id="submit-report-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="submit-report-modal-card"
        className="relative w-full max-w-xl bg-[#F6F3EA] border border-[#D8D0BC] rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 md:p-6 bg-[#0F3B2E] text-white flex items-start justify-between relative shrink-0">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#DE9B2E] text-[#0A2A21] text-[10px] font-extrabold uppercase tracking-wider">
                {language === 'en' ? 'Public Feedback' : 'অভিযোগ ও পরামর্শ'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                {language === 'en' ? 'No Login Required' : 'লগইন প্রয়োজন নেই'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-serif">
              {language === 'en' ? 'Submit a Report' : 'রিপোর্ট / অভিযোগ দাখিল করুন'}
            </h2>
            <p className="text-xs text-white/80 leading-relaxed">
              {language === 'en'
                ? 'Report wrong information, technical issues, or tourism suggestions. Sent directly to the Admin Panel.'
                : 'ভুল তথ্য, ওয়েবসাইটের সমস্যা বা পর্যটন পরামর্শ জানান। এটি সরাসরি অ্যাডমিন প্যানেলে জমা হবে।'}
            </p>
          </div>

          <button
            onClick={handleResetAndClose}
            aria-label="Close"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold font-serif text-[#0A2A21]">
                  {language === 'en' ? 'Report Received Successfully!' : 'রিপোর্টটি সফলভাবে জমা হয়েছে!'}
                </h3>
                <p className="text-xs text-[#4B554E] max-w-md mx-auto leading-relaxed">
                  {language === 'en'
                    ? 'Thank you for helping us maintain Bangladesh Tourism portal. Your report has been dispatched to the Administrator Review Center.'
                    : 'বাংলাদেশ পর্যটন পোর্টালকে সমৃদ্ধ ও ত্রুটিমুক্ত রাখতে সাহায্য করার জন্য ধন্যবাদ। আপনার রিপোর্টটি সরাসরি অ্যাডমিন কন্ট্রোল প্যানেলে পৌঁছে গেছে।'}
                </p>
                {submittedReportId && (
                  <p className="text-[11px] font-mono text-[#6B756E] pt-1">
                    Tracking ID: <span className="font-bold text-[#0A2A21]">{submittedReportId}</span>
                  </p>
                )}
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setSubject('');
                    setDetails('');
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setCustomImageUrl('');
                  }}
                  className="px-4 py-2 bg-white border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  {language === 'en' ? 'Submit Another Report' : 'আরেকটি রিপোর্ট পাঠান'}
                </button>
                <button
                  onClick={handleResetAndClose}
                  className="px-6 py-2 bg-[#0F3B2E] hover:bg-[#0A2A21] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  {language === 'en' ? 'Close Window' : 'সম্পন্ন করুন'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error banner */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Subject Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    {language === 'en' ? 'Report Subject' : 'রিপোর্টের বিষয় / শিরোনাম'} *
                  </span>
                  <span className="text-[10px] text-[#6B756E] lowercase">
                    {subject.length}/120
                  </span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'e.g. Incorrect ticket fee for Sundarbans tour'
                      : 'যেমন: সুন্দরবন ভ্রমণের ভুল প্রবেশ ফি বা রুটের সমস্যা'
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8D0BC] rounded-xl text-xs text-[#0A2A21] placeholder-[#8C968F] focus:outline-none focus:border-[#0F3B2E] transition-all shadow-2xs font-medium"
                />
              </div>

              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider">
                  {language === 'en' ? 'Report Category' : 'রিপোর্টের ধরন / ক্যাটাগরি'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2 rounded-xl text-left border text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        category === cat.id
                          ? 'bg-[#0F3B2E] text-white border-[#0F3B2E] shadow-xs'
                          : 'bg-white border-[#D8D0BC] text-[#4B554E] hover:bg-[#EFEADC]'
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span className="font-semibold truncate">
                        {language === 'en' ? cat.labelEn : cat.labelBn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Details Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider flex items-center justify-between">
                  <span>{language === 'en' ? 'Detailed Explanation' : 'বিস্তারিত বিবরণ'} *</span>
                  <span className="text-[10px] text-[#6B756E]">
                    {details.length} chars
                  </span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Please describe the issue or suggestion with as much context as possible...'
                      : 'সমস্যা, ভুল তথ্যের সঠিক রূপ বা আপনার পর্যটন পরামর্শ বিস্তারিত লিখুন...'
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8D0BC] rounded-xl text-xs text-[#0A2A21] placeholder-[#8C968F] focus:outline-none focus:border-[#0F3B2E] transition-all shadow-2xs"
                />
              </div>

              {/* Image Attachment (Optional) */}
              <div className="space-y-2 pt-1 border-t border-[#D8D0BC]/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    <span>{language === 'en' ? 'Image Attachment' : 'ছবি সংযুক্ত করুন'}</span>
                    <span className="text-[10px] font-normal lowercase bg-[#EFEADC] px-2 py-0.5 rounded-full text-[#4B554E]">
                      {language === 'en' ? 'Optional' : 'ঐচ্ছিক'}
                    </span>
                  </label>

                  {/* Mode switcher */}
                  <div className="flex bg-[#EFEADC] p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        imageInputMode === 'upload' ? 'bg-[#0F3B2E] text-white shadow-2xs' : 'text-[#4B554E]'
                      }`}
                    >
                      {language === 'en' ? 'Upload File' : 'ফাইল আপলোড'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        imageInputMode === 'url' ? 'bg-[#0F3B2E] text-white shadow-2xs' : 'text-[#4B554E]'
                      }`}
                    >
                      {language === 'en' ? 'Image URL' : 'ছবি লিংক'}
                    </button>
                  </div>
                </div>

                {imageInputMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {previewUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border border-[#D8D0BC] bg-black/5 aspect-video sm:aspect-21/9 max-h-40 group">
                        <img src={previewUrl} alt="Report Attachment" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1 bg-white text-[#0A2A21] rounded-lg text-xs font-bold shadow-sm"
                          >
                            {language === 'en' ? 'Change Photo' : 'ছবি পরিবর্তন'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl(null);
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold shadow-sm"
                          >
                            {language === 'en' ? 'Remove' : 'মুছুন'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#D8D0BC] hover:border-[#0F3B2E] rounded-2xl p-4 sm:p-5 text-center bg-white hover:bg-[#FAF8F5] transition-all cursor-pointer group"
                      >
                        <UploadCloud className="w-7 h-7 mx-auto text-[#6B756E] group-hover:text-[#0F3B2E] transition-colors" />
                        <p className="text-xs font-bold text-[#0A2A21] mt-1">
                          {language === 'en' ? 'Click to upload screenshot or photo' : 'স্ক্রিনশট বা ছবি আপলোড করতে ক্লিক করুন'}
                        </p>
                        <p className="text-[10px] text-[#6B756E]">PNG, JPG, WebP (Max 25MB)</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D8D0BC] rounded-xl text-xs text-[#0A2A21] placeholder-[#8C968F] focus:outline-none focus:border-[#0F3B2E]"
                    />
                    {customImageUrl && (
                      <div className="mt-2 relative rounded-xl overflow-hidden border border-[#D8D0BC] h-28">
                        <img
                          src={customImageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reporter Contact Info - Optional */}
              <div className="space-y-2 pt-1 border-t border-[#D8D0BC]/60">
                <label className="text-xs font-bold text-[#0A2A21] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    {language === 'en' ? 'Your Information' : 'আপনার পরিচিতি ও যোগাযোগ'}
                  </span>
                  <span className="text-[10px] font-normal lowercase bg-[#EFEADC] px-2 py-0.5 rounded-full text-[#4B554E]">
                    {language === 'en' ? 'Optional' : 'ঐচ্ছিক'}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#8C968F] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder={language === 'en' ? 'Your Name (Optional)' : 'আপনার নাম (ঐচ্ছিক)'}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#D8D0BC] rounded-xl text-xs text-[#0A2A21] focus:outline-none focus:border-[#0F3B2E]"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#8C968F] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={reporterContact}
                      onChange={(e) => setReporterContact(e.target.value)}
                      placeholder={language === 'en' ? 'Email or Phone (Optional)' : 'ইমেইল বা ফোন নম্বর (ঐচ্ছিক)'}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#D8D0BC] rounded-xl text-xs text-[#0A2A21] focus:outline-none focus:border-[#0F3B2E]"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#6B756E]">
                  {language === 'en'
                    ? 'Leave blank to submit completely anonymously. Provide contact only if you want a follow-up response.'
                    : 'বেনামে রিপোর্ট পাঠাতে চাইলে ফাঁকা রাখুন। অ্যাডমিনের জবাব পেতে চাইলে ইমেইল বা ফোন দিতে পারেন।'}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#D8D0BC] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={submitting}
                  className="px-4 py-2.5 text-xs font-bold text-[#6B756E] hover:text-[#0A2A21] transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'বাতিল'}
                </button>

                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !details.trim()}
                  className="px-6 py-2.5 bg-[#0F3B2E] hover:bg-[#0A2A21] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#DE9B2E]" />
                      <span>{uploadStage || (language === 'en' ? 'Sending...' : 'পাঠানো হচ্ছে...')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#DE9B2E]" />
                      <span>{language === 'en' ? 'Send Report to Admin' : 'অ্যাডমিনকে রিপোর্ট পাঠান'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
