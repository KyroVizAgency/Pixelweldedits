import { useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { PORTFOLIO_WORKS } from '../data/portfolio';
import { PortfolioWork, ProjectCategory } from '../types/studio';
import GlassFolder, { ArtRecipe, FolderFile } from './ui/glass-folder-cards';

interface PortfolioSectionProps {
  onSelectWork: (work: PortfolioWork) => void;
}

const CATEGORIES: ProjectCategory[] = [
  'All',
  'Cinematic',
  'Short-Form',
  'Commercial',
  'YouTube',
];

const SAPPHIRE_STREAK: ArtRecipe = {
  style: 'streak',
  colors: ['#050A14', '#0B1D3B', '#1666C5', '#3898EC', '#5EB7FF', '#CBE6FF'],
  scale: 0.72,
  warp: 1.5,
  angle: -0.58,
  gloss: 0.28,
  veins: 0,
};

const STEEL_MARBLE: ArtRecipe = {
  style: 'marble',
  colors: ['#050A14', '#0E1C36', '#1B3A6B', '#12274A', '#2575D8', '#5EB7FF', '#D6EAFF'],
  scale: 0.68,
  warp: 3.1,
  angle: 0.65,
  gloss: 0.48,
  veins: 0.45,
};

const COBALT_STREAK: ArtRecipe = {
  style: 'streak',
  colors: ['#040811', '#102447', '#1C57AD', '#0F1B33', '#3898EC', '#96CFFF'],
  scale: 0.66,
  warp: 1.8,
  angle: 0.42,
  gloss: 0.32,
  veins: 0,
};

// Folder 1: SaaS & YouTube (3 real uploaded videos)
const SAAS_YOUTUBE_FILES: FolderFile[] = [
  {
    name: 'SaaS Edit Showcase',
    meta: 'Motion UI · 00:13',
    video: '/assets/aistudio/Project_-2E51C3F-_be338a85.mp4',
  },
  {
    name: 'Viral Growth — YouTube',
    meta: '16:9 · 00:22',
    video: '/assets/aistudio/1000066070_f14dce1e.mp4',
  },
  {
    name: 'Google AI Edge — SaaS',
    meta: '16:9 · 00:15',
    video: '/assets/aistudio/Google_Ai_edje_SAAS_d4663d48.mp4',
  },
];

// Folder 2: Brand & Agency Reels (3 portrait 9:16 real uploaded videos)
const BRAND_AGENCY_FILES: FolderFile[] = [
  {
    name: 'Custom Home Build',
    meta: '9:16 · 00:30',
    video: '/assets/aistudio/1000066081_78296e78.mp4',
  },
  {
    name: 'Brand Design Growth',
    meta: '9:16 · 00:13',
    video: '/assets/aistudio/1000066082_e0935483.mp4',
  },
  {
    name: '2026 Agency Motion',
    meta: '9:16 · 00:21',
    video: '/assets/aistudio/1000066084_87804332.mp4',
  },
];

// Folder 3: Creator & Growth Reels (3 portrait 9:16 videos + 10th video queued via +)
const CREATOR_GROWTH_FILES: FolderFile[] = [
  {
    name: 'Algorithm & Reach Cut',
    meta: '9:16 · 00:32',
    video: '/assets/aistudio/1000066080_5673dbea.mp4',
  },
  {
    name: 'Content OS Breakdown',
    meta: '9:16 · 00:37',
    video: '/assets/aistudio/1000066077_ee088c93.mp4',
  },
  {
    name: 'Lead Engine Story',
    meta: '9:16 · 00:57',
    video: '/assets/aistudio/1000066083_90914f7b.mp4',
  },
];

const EXTRA_VIDEO_SLATES: FolderFile[] = [
  {
    name: 'Editorial Chart Edit',
    meta: '9:16 · 00:32',
    video: '/assets/aistudio/1000066078_0cada49b.mp4',
  },
];

const FILE_TO_WORK_ID: Record<string, string> = {
  'Google AI Edge — SaaS': 'google-ai-edge-saas',
  'Viral Growth — YouTube': 'viral-creator-youtube',
  'SaaS Edit Showcase': 'saas-showcase-cut',
  '2026 Agency Motion': 'agency-model-2026',
  'Brand Design Growth': 'brand-design-collage',
  'Custom Home Build': 'custom-home-build',
  'Lead Engine Story': 'lead-engine-story',
  'Content OS Breakdown': 'content-os-breakdown',
  'Algorithm & Reach Cut': 'algorithm-reach-cut',
  'Editorial Chart Edit': 'editorial-chart-edit',
};

export function PortfolioSection({ onSelectWork }: PortfolioSectionProps) {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('All');
  const [folderWidth, setFolderWidth] = useState<number>(330);

  useEffect(() => {
    const syncWidth = () => {
      const vw = window.innerWidth;
      if (vw < 400) setFolderWidth(280);
      else if (vw < 768) setFolderWidth(312);
      else setFolderWidth(330);
    };
    syncWidth();
    window.addEventListener('resize', syncWidth);
    return () => window.removeEventListener('resize', syncWidth);
  }, []);

  const findWork = (id: string) =>
    PORTFOLIO_WORKS.find((item) => item.id === id) ?? PORTFOLIO_WORKS[0];

  const handleFolderFileSelect = (file: FolderFile, fallbackWorkId: string) => {
    const cleanName = file.name.replace(/\s+#\d+$/, '');
    const mappedId = FILE_TO_WORK_ID[cleanName] ?? fallbackWorkId;
    onSelectWork(findWork(mappedId));
  };

  const showSaasYoutube =
    activeCategory === 'All' ||
    activeCategory === 'Commercial' ||
    activeCategory === 'YouTube' ||
    activeCategory === 'Cinematic';
  const showBrandAgency =
    activeCategory === 'All' ||
    activeCategory === 'Short-Form' ||
    activeCategory === 'Commercial';
  const showCreatorGrowth =
    activeCategory === 'All' || activeCategory === 'Short-Form';

  const visibleCount =
    Number(showSaasYoutube) + Number(showBrandAgency) + Number(showCreatorGrowth);

  return (
    <section id="work" className="border-b border-[#1D3054]/70 py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        {/* Section Header + Category Filters */}
        <div className="flex flex-col justify-between gap-6 border-b border-[#1D3054] pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium tracking-wider text-[#5EB7FF]">
              Selected Showreel Studies
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#F4F7FC] sm:text-4xl">
              Curated edits across aspect ratios.
            </h2>
          </div>

          <div
            className="flex flex-wrap items-center gap-1 rounded-xl border border-[#1D3054] bg-[#0B1528] p-1"
            role="tablist"
            aria-label="Filter portfolio works"
          >
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5EB7FF] ${
                    isActive
                      ? 'bg-[#1666C5] text-white'
                      : 'text-[#8FA3C4] hover:text-[#F4F7FC]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Smoked-Glass Project Vaults */}
        <div className="relative mt-10 overflow-hidden rounded-3xl border border-[#1D3054] bg-[#060D1A] px-5 pt-10 pb-9 sm:px-8 lg:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 text-[#3898EC] opacity-[0.14]"
            style={{
              backgroundImage: 'radial-gradient(currentColor 1.1px, transparent 1.4px)',
              backgroundSize: '22px 22px',
            }}
          />

          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs font-medium text-[#8FA3C4]">
              <FolderOpen className="h-4 w-4 text-[#5EB7FF]" />
              <span>Interactive Edit Vaults — open any folder and click a video to screen</span>
            </div>
            <span className="font-mono text-[11px] tracking-[0.14em] text-[#5EB7FF]/80 uppercase">
              Hover · Click · Screen
            </span>
          </div>

          <div
            className={`relative mt-8 grid grid-cols-1 items-end justify-items-center gap-x-10 gap-y-12 ${
              visibleCount >= 3
                ? 'md:grid-cols-2 xl:grid-cols-3'
                : visibleCount === 2
                  ? 'md:grid-cols-2'
                  : 'grid-cols-1'
            }`}
          >
            {showSaasYoutube && (
              <GlassFolder
                label="SaaS & YouTube"
                meta="3 videos · 16:9 & Motion"
                tone="dark"
                art={SAPPHIRE_STREAK}
                seed={3}
                width={folderWidth}
                action="more"
                labelPlacement="bottom-left"
                appearDelay={0}
                files={SAAS_YOUTUBE_FILES}
                onFileSelect={(file) => handleFolderFileSelect(file, 'google-ai-edge-saas')}
                menu={[
                  {
                    label: 'Play Google AI Edge — SaaS',
                    onSelect: () => onSelectWork(findWork('google-ai-edge-saas')),
                  },
                  {
                    label: 'Play Viral Growth — YouTube',
                    onSelect: () => onSelectWork(findWork('viral-creator-youtube')),
                  },
                  {
                    label: 'Play SaaS Edit Showcase',
                    onSelect: () => onSelectWork(findWork('saas-showcase-cut')),
                  },
                ]}
              />
            )}

            {showBrandAgency && (
              <GlassFolder
                label="Brand & Agency Reels"
                meta="3 videos · 9:16 Portrait"
                tone="dark"
                art={STEEL_MARBLE}
                seed={7}
                fileAspect="portrait"
                width={folderWidth}
                action="more"
                labelPlacement="top-left"
                appearDelay={140}
                files={BRAND_AGENCY_FILES}
                onFileSelect={(file) => handleFolderFileSelect(file, 'agency-model-2026')}
                menu={[
                  {
                    label: 'Play 2026 Agency Motion',
                    onSelect: () => onSelectWork(findWork('agency-model-2026')),
                  },
                  {
                    label: 'Play Brand Design Growth',
                    onSelect: () => onSelectWork(findWork('brand-design-collage')),
                  },
                  {
                    label: 'Play Custom Home Build',
                    onSelect: () => onSelectWork(findWork('custom-home-build')),
                  },
                ]}
              />
            )}

            {showCreatorGrowth && (
              <GlassFolder
                label="Creator & Growth Reels"
                tone="dark"
                art={COBALT_STREAK}
                seed={11}
                fileAspect="portrait"
                width={folderWidth}
                action="add"
                labelPlacement="top-right"
                appearDelay={280}
                files={CREATOR_GROWTH_FILES}
                onAdd={(current) => {
                  const offset = current.length - CREATOR_GROWTH_FILES.length;
                  const template = EXTRA_VIDEO_SLATES[offset % EXTRA_VIDEO_SLATES.length];
                  return {
                    ...template,
                    name: offset === 0 ? template.name : `${template.name} #${offset + 1}`,
                  };
                }}
                onFileSelect={(file) => handleFolderFileSelect(file, 'lead-engine-story')}
              />
            )}
          </div>

          <p className="relative mt-10 text-center font-mono text-[11px] tracking-[0.16em] text-[#8FA3C4] uppercase">
            Hover to lean · Click to fan videos · Click any video to play · + for bonus edit
          </p>
        </div>
      </div>
    </section>
  );
}
