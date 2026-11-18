import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { PortfolioWork } from '../types/studio';

interface ScreeningModalProps {
  work: PortfolioWork | null;
  onClose: () => void;
  onCommission: (work: PortfolioWork) => void;
}

function formatTimecode(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const frames = Math.floor((safe % 1) * 24);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `00:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
}

export function ScreeningModal({ work, onClose, onCommission }: ScreeningModalProps) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!work) return;
    setPlaying(true);
    setMuted(false);
    setProgress(0);
    setDuration(work.durationSeconds);

    const videoEl = videoRef.current;
    if (videoEl && work.video) {
      videoEl.currentTime = 0;
      videoEl.muted = false;
      videoEl.play().catch(() => {
        // Fallback to muted autoplay if unmuted autoplay is restricted by browser policy
        videoEl.muted = true;
        setMuted(true);
        videoEl.play().catch(() => setPlaying(false));
      });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [work, onClose]);

  useEffect(() => {
    if (!work || work.video || !playing) return;
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.1 / work.durationSeconds;
        return next >= 1 ? 0 : next;
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [work, playing]);

  const togglePlayPause = () => {
    const videoEl = videoRef.current;
    if (videoEl && work?.video) {
      if (videoEl.paused) {
        videoEl.play().catch(() => {});
        setPlaying(true);
      } else {
        videoEl.pause();
        setPlaying(false);
      }
    } else {
      setPlaying((p) => !p);
    }
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleScrub = (nextRatio: number) => {
    setProgress(nextRatio);
    const videoEl = videoRef.current;
    if (videoEl && work?.video && videoEl.duration && Number.isFinite(videoEl.duration)) {
      videoEl.currentTime = nextRatio * videoEl.duration;
    }
  };

  if (!work) return null;

  const effectiveDuration = duration || work.durationSeconds;
  const currentSeconds = progress * effectiveDuration;
  const isVertical = work.aspectRatioValue.includes('9:16');
  const scaleMotion = playing ? 1 + Math.sin(progress * Math.PI * 2) * 0.035 : 1.01;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="screening-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050A14]/92 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-[1040px] overflow-y-auto rounded-2xl border border-[#1D3054] bg-[#0B1528] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-[#1D3054] px-6 py-4">
          <div className="flex items-center gap-3 text-xs text-[#8FA3C4]">
            <span className="font-mono text-[#5EB7FF]">Study {work.index}</span>
            <span aria-hidden="true">·</span>
            <span>{work.category}</span>
            <span aria-hidden="true">·</span>
            <span>{work.aspectRatioValue}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close screening room"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1D3054] text-[#8FA3C4] transition-colors hover:border-[#3898EC] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video / Cinema Screening Stage */}
        <div className="relative overflow-hidden bg-[#050A14]">
          {work.video ? (
            <div className="flex w-full items-center justify-center bg-[#04070F] px-4 py-4 sm:py-6">
              <div
                className={`relative overflow-hidden rounded-xl border border-[#1D3054]/80 bg-black ${
                  isVertical
                    ? 'aspect-[9/16] h-[54vh] max-h-[560px] w-auto'
                    : 'aspect-[16/9] w-full max-w-[920px]'
                }`}
              >
                <video
                  ref={videoRef}
                  key={work.video}
                  src={work.video}
                  playsInline
                  loop
                  muted={muted}
                  onClick={togglePlayPause}
                  onLoadedMetadata={(e) => {
                    const d = e.currentTarget.duration;
                    if (d && Number.isFinite(d)) setDuration(d);
                  }}
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    if (v.duration && Number.isFinite(v.duration)) {
                      setProgress(v.currentTime / v.duration);
                    }
                  }}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  className="h-full w-full cursor-pointer object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img
                src={work.image}
                alt={work.imageAlt}
                referrerPolicy="no-referrer"
                style={{
                  transform: `scale(${scaleMotion}) translate3d(${(progress - 0.5) * -2.5}%, 0, 0)`,
                }}
                className="h-full w-full object-cover transition-transform duration-300 ease-linear"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050A14] via-transparent to-[#050A14]/40" />
              <div className="pointer-events-none absolute inset-6 border border-white/10" />
            </div>
          )}

          {/* Transport Bar */}
          <div className="flex flex-col gap-3 border-t border-[#1D3054] bg-[#050A14] px-6 py-3.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayPause}
                aria-label={playing ? 'Pause video' : 'Play video'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#1666C5] text-white transition-colors hover:bg-[#3898EC]"
              >
                {playing ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1D3054] text-[#8FA3C4] transition-colors hover:text-white"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <span className="font-mono text-xs tabular-nums text-[#F4F7FC]">
                {formatTimecode(currentSeconds)}{' '}
                <span className="text-[#8FA3C4]">/ {formatTimecode(effectiveDuration)}</span>
              </span>
            </div>

            <div className="flex flex-1 items-center">
              <input
                type="range"
                min={0}
                max={1000}
                value={Math.round(progress * 1000)}
                onChange={(e) => handleScrub(Number(e.target.value) / 1000)}
                aria-label="Timeline scrubber"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#1D3054] accent-[#3898EC]"
              />
            </div>
          </div>
        </div>

        {/* Editorial Breakdown */}
        <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-12 lg:p-8">
          <div className="lg:col-span-5">
            <h2
              id="screening-modal-title"
              className="text-2xl font-bold tracking-tight text-[#F4F7FC] sm:text-3xl"
            >
              {work.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#8FA3C4]">{work.logline}</p>

            <button
              type="button"
              onClick={() => onCommission(work)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1666C5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3898EC]"
            >
              <span>Brief a Similar Edit</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 border-t border-[#1D3054] pt-6 sm:grid-cols-2 lg:col-span-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <div>
              <p className="text-xs font-medium text-[#5EB7FF]">Rhythm &amp; Pacing</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#F4F7FC]">
                {work.editorialBreakdown.pacing}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#5EB7FF]">Color Pipeline</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#F4F7FC]">
                {work.editorialBreakdown.colorPipeline}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#5EB7FF]">Sound Architecture</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#F4F7FC]">
                {work.editorialBreakdown.soundDesign}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#5EB7FF]">Master Deliverables</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#8FA3C4]">
                {work.editorialBreakdown.deliverables.join(' · ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
