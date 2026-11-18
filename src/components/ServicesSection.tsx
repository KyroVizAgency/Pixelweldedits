import { useState } from 'react';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import { STUDIO_SERVICES } from '../data/portfolio';
import { StudioService } from '../types/studio';

interface ServicesSectionProps {
  onSelectService: (service: StudioService) => void;
}

export function ServicesSection({ onSelectService }: ServicesSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<string>('01');

  return (
    <section id="services" className="border-b border-[#1D3054]/70 py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Sticky Editorial Intro */}
          <div className="lg:col-span-4">
            <p className="text-xs font-medium tracking-wider text-[#5EB7FF]">
              Capabilities
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#F4F7FC] sm:text-4xl">
              Post-production disciplines tailored to each frame.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#8FA3C4]">
              Every format carries its own viewer psychology. We adapt pacing, typography, and
              sound weight to fit how and where your audience watches.
            </p>
          </div>

          {/* Right Typography-Led Service Index (No repetitive card clones) */}
          <div className="divide-y divide-[#1D3054] border-t border-b border-[#1D3054] lg:col-span-8">
            {STUDIO_SERVICES.map((service) => {
              const isOpen = expandedIndex === service.index;

              return (
                <div key={service.index} className="py-6 transition-colors">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setExpandedIndex((curr) => (curr === service.index ? '' : service.index))
                    }
                    className="flex w-full items-start justify-between gap-6 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5EB7FF]"
                  >
                    <div className="flex items-baseline gap-5 sm:gap-8">
                      <span className="font-mono text-xs tabular-nums text-[#5EB7FF]">
                        {service.index}.
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-[#F4F7FC] transition-colors hover:text-[#5EB7FF] sm:text-2xl">
                          {service.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#8FA3C4]">
                          {service.formats.join(' · ')} — Typical cut: {service.cadence}
                        </p>
                      </div>
                    </div>

                    <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#1D3054] text-[#8FA3C4]">
                      {isOpen ? (
                        <Minus className="h-4 w-4 text-[#5EB7FF]" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-5 grid grid-cols-1 gap-6 pl-9 sm:grid-cols-12 sm:pl-13">
                      <p className="text-sm leading-relaxed text-[#8FA3C4] sm:col-span-7">
                        {service.summary}
                      </p>
                      <div className="flex flex-col justify-between gap-4 sm:col-span-5">
                        <div>
                          <p className="text-xs font-medium text-[#5EB7FF]">Craft Focus</p>
                          <p className="mt-1 text-xs leading-relaxed text-[#F4F7FC]">
                            {service.craftFocus}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectService(service)}
                          className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-[#5EB7FF] transition-colors hover:text-white"
                        >
                          <span>Start a brief for this discipline</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
