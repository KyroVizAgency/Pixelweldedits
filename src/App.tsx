import { useState } from 'react';
import { CinematicPreloader } from './components/CinematicPreloader';
import { CustomCursor } from './components/CustomCursor';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { EditingSuiteSection } from './components/EditingSuiteSection';
import { PortfolioSection } from './components/PortfolioSection';
import { ScreeningModal } from './components/ScreeningModal';
import { ServicesSection } from './components/ServicesSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { PORTFOLIO_WORKS } from './data/portfolio';
import { BriefPrefill, PortfolioWork, StudioService } from './types/studio';

export default function App() {
  const [selectedWork, setSelectedWork] = useState<PortfolioWork | null>(null);
  const [briefPrefill, setBriefPrefill] = useState<BriefPrefill | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCommissionFromWork = (work: PortfolioWork) => {
    setSelectedWork(null);
    setBriefPrefill({
      service:
        work.category === 'Short-Form'
          ? 'Short-form Video Editing'
          : work.category === 'Commercial'
            ? 'Promotional Videos'
            : work.category === 'YouTube'
              ? 'YouTube Video Editing'
              : 'Cinematic Video Editing',
      notes: `Reference study: ${work.title} (${work.formatLabel}). Looking for a similar pacing and visual finish.`,
    });
    scrollToSection('contact');
  };

  const handleSelectService = (service: StudioService) => {
    setBriefPrefill({
      service: service.title,
      notes: `Interested in ${service.title} (${service.formats.join(', ')}).`,
    });
    scrollToSection('contact');
  };

  return (
    <div className="min-h-screen bg-[#050A14] text-[#F4F7FC]">
      <CinematicPreloader />
      <CustomCursor />

      <Navbar onStartProject={() => scrollToSection('contact')} />

      <main>
        <Hero
          onExploreWork={() => scrollToSection('work')}
          onOpenShowreel={() => setSelectedWork(PORTFOLIO_WORKS[0])}
        />

        <EditingSuiteSection />

        <PortfolioSection onSelectWork={(work) => setSelectedWork(work)} />

        <ServicesSection onSelectService={handleSelectService} />

        <TestimonialsSection />

        <AboutSection />

        <ContactSection prefill={briefPrefill} />
      </main>

      <ScreeningModal
        work={selectedWork}
        onClose={() => setSelectedWork(null)}
        onCommission={handleCommissionFromWork}
      />

      <FloatingWhatsAppButton />
    </div>
  );
}
