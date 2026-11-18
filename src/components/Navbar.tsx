import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BRAND_LOGO_SRC, BRAND_NAME } from '../data/portfolio';

interface NavbarProps {
  onStartProject: () => void;
}

const NAV_LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'Services', href: '#services' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'About', href: '#about' },
];

export function Navbar({ onStartProject }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1D3054]/80 bg-[#050A14]/92">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-6 py-4 lg:px-10">
        {/* Zone 1: Brand Mark + Wordmark (single line, no subtitle/badges) */}
        <a
          href="#top"
          className="inline-flex shrink-0 items-center gap-3 whitespace-nowrap text-lg font-bold tracking-tight text-[#F4F7FC] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5EB7FF]"
        >
          <img
            src={BRAND_LOGO_SRC}
            alt="Pixelweldedits emblem"
            referrerPolicy="no-referrer"
            className="h-8 w-8 rounded-lg border border-[#1D3054] object-cover"
          />
          <span style={{ fontFamily: 'var(--font-display)' }}>{BRAND_NAME}</span>
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap shrink-0 text-sm font-medium text-[#8FA3C4] transition-colors duration-150 hover:text-[#F4F7FC] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5EB7FF]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onStartProject}
            className="hidden whitespace-nowrap shrink-0 rounded-lg bg-[#1666C5] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#3898EC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5EB7FF] md:inline-flex"
          >
            Start a Project
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#1D3054] text-[#F4F7FC] md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#1D3054] bg-[#0B1528] px-6 py-5 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-[#F4F7FC] transition-colors hover:text-[#5EB7FF]"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onStartProject();
              }}
              className="mt-2 w-full rounded-lg bg-[#1666C5] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#3898EC]"
            >
              Start a Project
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
