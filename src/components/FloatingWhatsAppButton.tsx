import { WHATSAPP_CONFIG, buildWhatsAppUrl } from '../config/whatsapp';

export function WhatsAppGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M20.5 11.79A8.5 8.5 0 0 1 8.27 19.4L4 20.5l1.15-4.13A8.5 8.5 0 1 1 20.5 11.79Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.6 8.85c-.22-.48-.45-.49-.66-.5h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43s1.05 2.82 1.19 3.01c.15.2 2.02 3.24 4.99 4.41 2.47.97 2.97.78 3.51.73.54-.05 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.2-.56-.34-.3-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.29-.02-.45.13-.6.13-.13.3-.34.44-.51.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.51-.08-.15-.64-1.58-.9-2.16Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FloatingWhatsAppButton() {
  const whatsappUrl = buildWhatsAppUrl(WHATSAPP_CONFIG.defaultMessage);

  return (
    <div className="fixed right-5 bottom-5 z-50 sm:right-7 sm:bottom-7">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with Pixelweldedits on WhatsApp (${WHATSAPP_CONFIG.displayNumber})`}
        className="group relative inline-flex h-12 items-center gap-2.5 rounded-2xl border border-white/15 bg-[#101722]/80 px-3.5 text-sm font-medium text-[#F5F7FA] backdrop-blur-2xl shadow-[0_14px_34px_-10px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#60A5FA]/50 hover:bg-[#101722]/92 hover:shadow-[0_18px_42px_-8px_rgba(59,130,246,0.65),inset_0_1px_0_rgba(255,255,255,0.22)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#60A5FA] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-4"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#2563EB]/20 text-[#60A5FA] ring-1 ring-[#3B82F6]/35 transition-colors duration-200 group-hover:bg-[#2563EB]/30 group-hover:text-white">
          <WhatsAppGlyph className="h-4 w-4" />
        </span>
        <span className="hidden whitespace-nowrap tracking-tight sm:inline">
          WhatsApp
        </span>
      </a>
    </div>
  );
}
