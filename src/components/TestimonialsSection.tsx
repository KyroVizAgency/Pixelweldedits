import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface TestimonialItem {
  index: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  initials: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    index: '01',
    quote:
      'The attention to rhythm and visual storytelling transformed our campaign identity completely.',
    author: 'Sarah Chen',
    role: 'Creative Director',
    company: 'Studio Forma',
    avatar: '/src/assets/images/testimonial_sarah_chen_1795014087550.jpg',
    initials: 'SC',
  },
  {
    index: '02',
    quote:
      'Every frame lands on the breath of the score. Pixelweldedits shaped days of raw footage into one effortless 60-second cut.',
    author: 'Marcus Vance',
    role: 'Executive Producer',
    company: 'Northlight Films',
    avatar: '/src/assets/images/testimonial_marcus_vance_1795014185177.jpg',
    initials: 'MV',
  },
  {
    index: '03',
    quote:
      'Reworking the cold open and audio stems turned our documentary episodes into pieces viewers watch straight through to the credits.',
    author: 'Elena Rostova',
    role: 'Head of Content',
    company: 'Atelier Signal',
    avatar: '/src/assets/images/testimonial_elena_rostova_1795014086002.jpg',
    initials: 'ER',
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});
  const shouldReduceMotion = useReducedMotion();

  const total = TESTIMONIALS.length;
  const current = TESTIMONIALS[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  const totalLabel = String(total).padStart(2, '0');
  const avatarFailed = Boolean(failedAvatars[current.index]);

  return (
    <section
      id="testimonials"
      aria-label="Client testimonials"
      onKeyDown={handleKeyDown}
      className="border-b border-[#1D3054]/70 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-[1120px] px-6 lg:px-10">
        <div
          className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10"
          aria-live="polite"
        >
          {/* Left Index Column */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              <motion.span
                key={current.index}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="block font-light text-6xl leading-none tracking-tight tabular-nums text-[#8FA3C4]/25 select-none sm:text-7xl lg:text-[5.5rem]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {current.index}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Right Quote + Attribution Column */}
          <div className="md:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.index}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <blockquote className="max-w-2xl text-2xl font-normal leading-[1.32] tracking-tight text-[#F4F7FC] sm:text-3xl lg:text-[2.25rem]">
                  {current.quote}
                </blockquote>

                <figcaption className="mt-10 flex items-center gap-4 sm:mt-12">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#1D3054] bg-[#0B1528]">
                    {!avatarFailed ? (
                      <img
                        src={current.avatar}
                        alt={`${current.author}, ${current.role} at ${current.company}`}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedAvatars((prev) => ({
                            ...prev,
                            [current.index]: true,
                          }))
                        }
                        className="h-full w-full object-cover grayscale contrast-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#8FA3C4]">
                        {current.initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-base font-semibold tracking-tight text-[#F4F7FC]">
                      {current.author}
                    </p>
                    <p className="mt-0.5 text-sm text-[#8FA3C4]">
                      <span>{current.role}</span>
                      <span className="mx-2 text-[#1D3054]" aria-hidden="true">
                        /
                      </span>
                      <span>{current.company}</span>
                    </p>
                  </div>
                </figcaption>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Progress Line & Chevron Navigation */}
        <div className="mt-16 flex items-center justify-between gap-6 sm:mt-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2" role="tablist" aria-label="Select testimonial">
              {TESTIMONIALS.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.index}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`View testimonial ${item.index} from ${item.author}`}
                    onClick={() => setActiveIndex(idx)}
                    className="group flex h-8 items-center py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5EB7FF]"
                  >
                    <span
                      className={`block h-[2px] rounded-full transition-all duration-300 ${
                        isActive
                          ? 'w-14 bg-[#5EB7FF]'
                          : 'w-7 bg-[#1D3054] group-hover:bg-[#8FA3C4]/60'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <span className="ml-2 font-mono text-xs tracking-wider tabular-nums text-[#8FA3C4]">
              {current.index} / {totalLabel}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#8FA3C4] transition-colors duration-150 hover:bg-[#0B1528] hover:text-[#F4F7FC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5EB7FF]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next testimonial"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#8FA3C4] transition-colors duration-150 hover:bg-[#0B1528] hover:text-[#F4F7FC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5EB7FF]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
