import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import {
  WHATSAPP_CONFIG,
  buildProjectInquiryMessage,
  buildWhatsAppUrl,
} from '../config/whatsapp';
import { BRAND_LOGO_SRC, BRAND_NAME, STUDIO_SERVICES } from '../data/portfolio';
import { BriefPrefill } from '../types/studio';
import { WhatsAppGlyph } from './FloatingWhatsAppButton';

interface ContactSectionProps {
  prefill: BriefPrefill | null;
}

interface FieldErrors {
  name?: string;
  email?: string;
  projectType?: string;
  message?: string;
}

const PROJECT_TYPE_OPTIONS = [
  ...STUDIO_SERVICES.map((service) => service.title),
  'Custom Editorial / Multi-Format Package',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ContactSection({ prefill }: ContactSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState(STUDIO_SERVICES[2].title);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [handoff, setHandoff] = useState<{
    url: string;
    formattedMessage: string;
  } | null>(null);

  const launchLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.service && PROJECT_TYPE_OPTIONS.includes(prefill.service)) {
      setProjectType(prefill.service);
    }
    if (prefill.notes) {
      setMessage(prefill.notes);
    }
    setErrors({});
    setHandoff(null);
  }, [prefill]);

  const validateFields = (): FieldErrors => {
    const nextErrors: FieldErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = 'Please enter your full name.';
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!projectType.trim()) {
      nextErrors.projectType = 'Please select a project type.';
    }

    if (message.trim().length < 10) {
      nextErrors.message =
        'Please share a short project description (at least 10 characters).';
    }

    return nextErrors;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    const formattedMessage = buildProjectInquiryMessage({
      name,
      email,
      projectType,
      message,
    });
    const whatsappUrl = buildWhatsAppUrl(formattedMessage);

    setHandoff({
      url: whatsappUrl,
      formattedMessage,
    });

    if (launchLinkRef.current) {
      launchLinkRef.current.href = whatsappUrl;
      launchLinkRef.current.click();
    }
  };

  const directWhatsAppUrl = buildWhatsAppUrl(WHATSAPP_CONFIG.defaultMessage);

  return (
    <>
      <section
        id="contact"
        className="relative overflow-hidden bg-[#080B12] py-24 lg:py-32"
      >
        {/* Subtle controlled ambient blue depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-12 right-[12%] h-[420px] w-[420px] rounded-full bg-[#2563EB]/12 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-10 left-[8%] h-[300px] w-[300px] rounded-full bg-[#3B82F6]/8 blur-[110px]"
        />

        <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Editorial & Direct WhatsApp Panel */}
            <div className="flex flex-col justify-between lg:col-span-5">
              <div>
                <p className="text-xs font-medium tracking-[0.14em] text-[#60A5FA] uppercase">
                  Direct Studio Line
                </p>
                <h2
                  className="mt-3 text-3xl font-bold tracking-tight text-[#F5F7FA] sm:text-5xl sm:leading-[1.06]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Let&apos;s Create Something Amazing.
                </h2>
                <p className="mt-5 max-w-md text-base leading-relaxed text-[#929DAD]">
                  Have a video editing project in mind? Let&apos;s discuss your vision and bring it to
                  life.
                </p>
              </div>

              {/* Translucent Apple-glass Direct WhatsApp Card */}
              <div className="mt-10 rounded-3xl border border-white/[0.09] bg-[#101722]/70 p-6 backdrop-blur-2xl shadow-[0_20px_50px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#929DAD]">Official Studio WhatsApp</p>
                    <p className="mt-1 font-mono text-base font-medium tracking-tight text-[#F5F7FA]">
                      {WHATSAPP_CONFIG.displayNumber}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#3B82F6]/30 bg-[#2563EB]/15 text-[#60A5FA]">
                    <WhatsAppGlyph className="h-5 w-5" />
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#929DAD]">
                  Opens WhatsApp Web on desktop or the WhatsApp app on mobile with an instant
                  project introduction.
                </p>

                <a
                  href={directWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#080B12]/70 px-4 py-3 text-sm font-medium text-[#F5F7FA] transition-all duration-200 hover:border-[#3B82F6]/60 hover:bg-[#101722] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <MessageCircle className="h-4 w-4 text-[#60A5FA]" />
                    <span>Message {BRAND_NAME} Directly</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#60A5FA]" />
                </a>
              </div>
            </div>

            {/* Right Apple-Inspired Glass Inquiry Form */}
            <div className="rounded-3xl border border-white/[0.1] bg-[#101722]/72 p-6 backdrop-blur-2xl shadow-[0_28px_72px_-20px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.09)] sm:p-9 lg:col-span-7">
              <a
                ref={launchLinkRef}
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
              >
                Open WhatsApp
              </a>

              {handoff ? (
                <div className="flex h-full min-h-[380px] flex-col justify-between gap-6">
                  <div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#3B82F6]/35 bg-[#2563EB]/20 text-[#60A5FA]">
                      <WhatsAppGlyph className="h-5 w-5" />
                    </div>

                    <h3 className="mt-5 text-2xl font-semibold tracking-tight text-[#F5F7FA]">
                      Continue in WhatsApp to send your brief.
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#929DAD]">
                      Your project details are formatted below and ready in WhatsApp. Your inquiry is
                      completed as soon as you press Send inside WhatsApp.
                    </p>

                    <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#080B12]/75 p-4">
                      <p className="text-[11px] font-medium tracking-wider text-[#60A5FA] uppercase">
                        Prepared Message Preview
                      </p>
                      <pre className="mt-2.5 whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#F5F7FA]/90">
                        {handoff.formattedMessage}
                      </pre>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href={handoff.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-6px_rgba(37,99,235,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3B82F6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA] motion-reduce:hover:translate-y-0"
                    >
                      <WhatsAppGlyph className="h-4 w-4" />
                      <span>Open WhatsApp Conversation</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setHandoff(null)}
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-[#080B12]/60 px-4 py-3 text-sm font-medium text-[#929DAD] transition-colors duration-150 hover:border-white/25 hover:text-[#F5F7FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]"
                    >
                      Edit Project Details
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-medium tracking-wide text-[#F5F7FA]"
                    >
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      autoComplete="name"
                      required
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'contact-name-error' : undefined}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="Alex Mercer"
                      className="mt-2 w-full rounded-xl border border-white/[0.09] bg-[#080B12]/75 px-4 py-3 text-sm text-[#F5F7FA] placeholder-[#929DAD]/55 transition-colors focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25 focus:outline-none"
                    />
                    {errors.name && (
                      <p id="contact-name-error" className="mt-1.5 text-xs text-red-400">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-medium tracking-wide text-[#F5F7FA]"
                    >
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      required
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'contact-email-error' : undefined}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      placeholder="you@studio.com"
                      className="mt-2 w-full rounded-xl border border-white/[0.09] bg-[#080B12]/75 px-4 py-3 text-sm text-[#F5F7FA] placeholder-[#929DAD]/55 transition-colors focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25 focus:outline-none"
                    />
                    {errors.email && (
                      <p id="contact-email-error" className="mt-1.5 text-xs text-red-400">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="contact-project-type"
                      className="block text-xs font-medium tracking-wide text-[#F5F7FA]"
                    >
                      Project Type
                    </label>
                    <select
                      id="contact-project-type"
                      required
                      aria-invalid={Boolean(errors.projectType)}
                      aria-describedby={errors.projectType ? 'contact-project-type-error' : undefined}
                      value={projectType}
                      onChange={(e) => {
                        setProjectType(e.target.value);
                        if (errors.projectType) {
                          setErrors((prev) => ({ ...prev, projectType: undefined }));
                        }
                      }}
                      className="mt-2 w-full rounded-xl border border-white/[0.09] bg-[#080B12]/85 px-4 py-3 text-sm text-[#F5F7FA] transition-colors focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25 focus:outline-none"
                    >
                      {PROJECT_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option} className="bg-[#080B12] text-[#F5F7FA]">
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.projectType && (
                      <p id="contact-project-type-error" className="mt-1.5 text-xs text-red-400">
                        {errors.projectType}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-medium tracking-wide text-[#F5F7FA]"
                    >
                      Project Description / Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'contact-message-error' : undefined}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                      }}
                      placeholder="Share your footage format, desired runtime, target release date, or creative references..."
                      className="mt-2 w-full rounded-xl border border-white/[0.09] bg-[#080B12]/75 px-4 py-3 text-sm text-[#F5F7FA] placeholder-[#929DAD]/55 transition-colors focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25 focus:outline-none"
                    />
                    {errors.message && (
                      <p id="contact-message-error" className="mt-1.5 text-xs text-red-400">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-1 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#2563EB] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_28px_-6px_rgba(37,99,235,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3B82F6] hover:shadow-[0_14px_34px_-6px_rgba(59,130,246,0.75)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto"
                    >
                      <WhatsAppGlyph className="h-4 w-4" />
                      <span>Let&apos;s Discuss Your Project</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </button>

                    <span className="text-xs text-[#929DAD]">
                      Opens directly in WhatsApp
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.08] bg-[#080B12] py-10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div className="flex items-center gap-3">
            <img
              src={BRAND_LOGO_SRC}
              alt="Pixelweldedits emblem"
              referrerPolicy="no-referrer"
              className="h-7 w-7 rounded border border-white/10 object-cover"
            />
            <span className="text-sm font-semibold text-[#F5F7FA]">{BRAND_NAME}</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#929DAD]">
            <a href="#work" className="transition-colors hover:text-[#F5F7FA]">
              Work
            </a>
            <a href="#services" className="transition-colors hover:text-[#F5F7FA]">
              Services
            </a>
            <a href="#testimonials" className="transition-colors hover:text-[#F5F7FA]">
              Testimonials
            </a>
            <a href="#about" className="transition-colors hover:text-[#F5F7FA]">
              About
            </a>
            <span className="text-[#929DAD]/70">
              © {new Date().getFullYear()} {BRAND_NAME}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
