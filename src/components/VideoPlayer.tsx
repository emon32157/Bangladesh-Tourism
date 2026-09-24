import React, { useState } from 'react';
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '../lib/videoUtils';
import { Video, ExternalLink, Play, AlertCircle } from 'lucide-react';
import { Language } from '../types';

interface VideoPlayerProps {
  videoUrlOrEmbed?: string;
  title?: string;
  language?: Language;
  className?: string;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrlOrEmbed,
  title = 'Bangladesh Travel Documentary',
  language = 'en',
  className = '',
  autoPlay = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [hasError, setHasError] = useState(false);

  if (!videoUrlOrEmbed) {
    return null;
  }

  const videoId = extractYouTubeVideoId(videoUrlOrEmbed);
  const embedUrl = getYouTubeEmbedUrl(videoUrlOrEmbed);

  if (!videoId || !embedUrl) {
    return (
      <div className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 flex items-center gap-2 ${className}`}>
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          {language === 'en'
            ? 'Invalid YouTube video URL or embed code.'
            : 'অকার্যকর ইউটিউব ভিডিও লিংক বা এম্বেড কোড।'}
        </span>
      </div>
    );
  }

  const finalEmbedSrc = isPlaying
    ? `${embedUrl}&autoplay=1`
    : embedUrl;

  const directYouTubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div
      id={`video-player-${videoId}`}
      className={`rounded-2xl sm:rounded-3xl overflow-hidden border border-[#D8D0BC] bg-[#0A1612] shadow-xl ${className}`}
    >
      {/* Header bar */}
      <div className="bg-[#0F231D] px-4 py-2.5 flex items-center justify-between border-b border-[#1E3B33] text-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#DE9B2E] min-w-0">
          <span className="flex items-center justify-center w-5 h-5 rounded-md bg-red-600 text-white shrink-0 shadow-xs">
            <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
          </span>
          <span className="truncate max-w-[220px] sm:max-w-md text-[#FAF8F3]">
            {title}
          </span>
        </div>
        <a
          href={directYouTubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[#C2BCAE] hover:text-[#DE9B2E] flex items-center gap-1.5 transition-colors shrink-0 font-medium ml-2 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
          title={language === 'en' ? 'Watch on YouTube' : 'ইউটিউবে দেখুন'}
        >
          <span>YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full pb-[56.25%] bg-black">
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-neutral-300 space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="text-sm font-medium">
              {language === 'en'
                ? 'Unable to load YouTube video embed directly.'
                : 'ইউটিউব ভিডিও সরাসরি লোড করা যাচ্ছে না।'}
            </p>
            <a
              href={directYouTubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#DE9B2E] hover:underline"
            >
              <span>{language === 'en' ? 'Open video on YouTube' : 'ইউটিউবে ভিডিওটি খুলুন'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <iframe
            src={finalEmbedSrc}
            title={title}
            className="absolute top-0 left-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            onError={() => setHasError(true)}
          />
        )}
      </div>
    </div>
  );
};
