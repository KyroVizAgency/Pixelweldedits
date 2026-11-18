import { ArrowDownRight, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { BRAND_LOGO_SRC, BRAND_NAME } from '../data/portfolio';

interface HeroProps {
  onExploreWork: () => void;
  onOpenShowreel: () => void;
}

export function Hero({ onExploreWork, onOpenShowreel }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden border-b border-[#1D3054]/70">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center px-6 pt-14 pb-18 text-center lg:px-10 lg:pt-24 lg:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full max-w-4xl flex-col items-center justify-between"
        >
          <div className="flex flex-col items-center">
            <div className="mb-8 flex items-center justify-center gap-3 text-xs tracking-wide text-[#8FA3C4]">
              <img
                src={BRAND_LOGO_SRC}
                alt="Pixelweldedits mark"
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded border border-[#1D3054] object-cover"
              />
              <span className="font-medium text-[#F4F7FC]">{BRAND_NAME}</span>
              <span aria-hidden="true">·</span>
              <span>Video Editing &amp; Post-Production Studio</span>
            </div>

            <h1 className="mx-auto max-w-3xl text-[clamp(2.5rem,5.2vw,4.5rem)] leading-[1.03] font-bold tracking-[-0.03em] text-[#F4F7FC]">
              Precision cuts built for stories worth watching.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#8FA3C4] sm:text-lg">
              {BRAND_NAME} shapes raw footage into intentional cinema—uniting frame-accurate rhythm,
              restrained color grading, and tactile sound design across commercial films, short-form
              reels, and long-form storytelling.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={onExploreWork}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#1666C5] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3898EC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5EB7FF]"
              >
                <span>Explore Our Work</span>
                <ArrowDownRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onOpenShowreel}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[#1D3054] bg-[#0B1528] px-5 py-3 text-sm font-medium text-[#F4F7FC] transition-colors duration-150 hover:border-[#3898EC] hover:text-[#5EB7FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5EB7FF]"
              >
                <Play className="h-3.5 w-3.5 fill-current text-[#3898EC]" />
                <span>Open Screening Room</span>
              </button>
            </div>
          </div>

          {/* Bottom Studio Craft Baseline (unboxed metadata, no fake stats) */}
          <div className="mx-auto mt-12 grid w-full max-w-2xl grid-cols-3 gap-6 border-t border-[#1D3054] pt-6 text-center text-xs">
            <div>
              <p className="font-mono text-[#5EB7FF]">24 / 60 FPS</p>
              <p className="mt-1 text-[#8FA3C4]">Frame-accurate pacing</p>
            </div>
            <div>
              <p className="font-mono text-[#5EB7FF]">ACEScct</p>
              <p className="mt-1 text-[#8FA3C4]">Calibrated color grade</p>
            </div>
            <div>
              <p className="font-mono text-[#5EB7FF]">Multi-Aspect</p>
              <p className="mt-1 text-[#8FA3C4]">2.39:1 · 16:9 · 9:16</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subtle Editorial Marquee Divider */}
      <div className="overflow-hidden border-t border-[#1D3054]/70 bg-[#0B1528]/50 py-3">
        <div className="animate-pw-marquee flex w-max items-center gap-8 whitespace-nowrap text-xs font-medium tracking-wider text-[#8FA3C4]">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-8 pr-8">
              <span>Cinematic Video Editing</span>
              <span aria-hidden="true" className="text-[#3898EC]">·</span>
              <span>Short-Form &amp; Reels</span>
              <span aria-hidden="true" className="text-[#3898EC]">·</span>
              <span>Promotional Films</span>
              <span aria-hidden="true" className="text-[#3898EC]">·</span>
              <span>Motion Graphics</span>
              <span aria-hidden="true" className="text-[#3898EC]">·</span>
              <span>YouTube Storytelling</span>
              <span aria-hidden="true" className="text-[#3898EC]">·</span>
              <span>Sound-Driven Narrative</span>
              <span aria-hidden="true" className="text-[#3898EC]">·</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
