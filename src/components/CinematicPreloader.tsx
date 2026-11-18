import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BRAND_LOGO_SRC } from '../data/portfolio';

const STORAGE_KEY = 'pw_preloader_seen_v1';
const PRELOADER_DURATION_MS = 2300;
const REDUCED_MOTION_DURATION_MS = 350;
const FAILSAFE_TIMEOUT_MS = 3400;

function hasSeenPreloader(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markPreloaderSeen(): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Ignore storage restriction errors in private/sandboxed environments
  }
}

export function CinematicPreloader() {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<'active' | 'exiting' | 'done'>(() =>
    typeof window !== 'undefined' && hasSeenPreloader() ? 'done' : 'active',
  );
  const [progress, setProgress] = useState(0);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (phase !== 'active') return;

    const prefersReduced =
      Boolean(shouldReduceMotion) ||
      (typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

    const targetDuration = prefersReduced
      ? REDUCED_MOTION_DURATION_MS
      : PRELOADER_DURATION_MS;

    let rafId = 0;
    const startTime = performance.now();

    const finishPreloader = () => {
      markPreloaderSeen();
      setProgress(100);
      setPhase('exiting');
    };

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const ratio = Math.min(1, elapsed / targetDuration);
      // Smooth cubic ease-out curve for luxury pacing
      const eased = 1 - Math.pow(1 - ratio, 2.4);
      setProgress(Math.round(eased * 100));

      if (ratio < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        finishPreloader();
      }
    };

    rafId = window.requestAnimationFrame(tick);

    // Failsafe timer guarantees homepage accessibility even if rAF throttles or stalls
    const failsafeTimer = window.setTimeout(() => {
      window.cancelAnimationFrame(rafId);
      finishPreloader();
    }, FAILSAFE_TIMEOUT_MS);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(failsafeTimer);
    };
  }, [phase, shouldReduceMotion]);

  useEffect(() => {
    if (phase !== 'exiting') return;
    const cleanupTimer = window.setTimeout(() => {
      setPhase('done');
    }, 850);
    return () => window.clearTimeout(cleanupTimer);
  }, [phase]);

  if (phase === 'done') {
    return null;
  }

  return (
    <AnimatePresence onExitComplete={() => setPhase('done')}>
      {phase === 'active' && (
        <motion.div
          key="pw-cinematic-preloader"
          role="status"
          aria-live="polite"
          aria-label="Loading Pixelweldedits"
          initial={{ opacity: 1, scale: 1 }}
          exit={
            shouldReduceMotion
              ? { opacity: 0, pointerEvents: 'none', transition: { duration: 0.2 } }
              : {
                  opacity: 0,
                  scale: 1.045,
                  pointerEvents: 'none',
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                }
          }
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#080B12] px-6 select-none"
        >
          {/* Ambient Electric-Blue Studio Halo */}
          <motion.div
            aria-hidden="true"
            initial={shouldReduceMotion ? { opacity: 0.45 } : { opacity: 0, scale: 0.72 }}
            animate={
              shouldReduceMotion
                ? { opacity: 0.45 }
                : { opacity: [0, 0.65, 0.48], scale: [0.72, 1.06, 1] }
            }
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute h-[340px] w-[340px] rounded-full sm:h-[420px] sm:w-[420px]"
            style={{
              background:
                'radial-gradient(circle, rgba(59,130,246,0.28) 0%, rgba(37,99,235,0.12) 42%, rgba(8,11,18,0) 72%)',
            }}
          />

          {/* Center Lockup */}
          <div className="relative flex flex-col items-center">
            {/* Actual Pixelweldedits Logo with Reveal + Electric Blue Rim + Light Sweep */}
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, scale: 0.86, filter: 'blur(8px)' }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, filter: 'blur(0px)' }
              }
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-24 w-24 overflow-hidden rounded-3xl border border-white/15 bg-[#0B1528] shadow-[0_0_48px_-8px_rgba(37,99,235,0.65),0_18px_40px_-14px_rgba(0,0,0,0.85)] sm:h-28 sm:w-28"
            >
              {!logoError ? (
                <img
                  src={BRAND_LOGO_SRC}
                  alt="Pixelweldedits official logo"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2563EB] to-[#080B12] text-2xl font-bold tracking-tight text-white">
                  PW
                </div>
              )}

              {/* Subtle Top Specular Glass Rim */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/15"
              />

              {/* Cinematic Specular Light Sweep */}
              {!shouldReduceMotion && (
                <motion.div
                  aria-hidden="true"
                  initial={{ x: '-140%' }}
                  animate={{ x: '160%' }}
                  transition={{
                    delay: 0.45,
                    duration: 1.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-[90%] skew-x-[-20deg]"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(96,165,250,0.22) 38%, rgba(255,255,255,0.5) 50%, rgba(59,130,246,0.2) 62%, rgba(255,255,255,0) 100%)',
                  }}
                />
              )}
            </motion.div>

            {/* Brand Wordmark Reveal */}
            <div className="mt-7 overflow-hidden">
              <motion.p
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 14, letterSpacing: '0.36em' }
                }
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, letterSpacing: '0.28em' }
                }
                transition={{
                  delay: shouldReduceMotion ? 0 : 0.32,
                  duration: 0.75,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="pl-[0.28em] text-center text-base font-semibold tracking-[0.28em] text-[#F4F7FC] sm:text-lg"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                PIXELWELDEDITS
              </motion.p>
            </div>

            {/* Minimal Progress Bar + Numeric Indicator */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.5,
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-6 flex flex-col items-center gap-2.5"
            >
              <div className="h-[2px] w-44 overflow-hidden rounded-full bg-white/[0.08] sm:w-52">
                <div
                  className="h-full w-full origin-left rounded-full transition-transform duration-75 ease-out"
                  style={{
                    transform: `scaleX(${progress / 100})`,
                    background:
                      'linear-gradient(90deg, #2563EB 0%, #3B82F6 65%, #93C5FD 100%)',
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.7)',
                  }}
                />
              </div>

              <span className="font-mono text-[11px] tracking-[0.18em] tabular-nums text-[#8FA3C4]/80">
                {String(progress).padStart(2, '0')}%
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
