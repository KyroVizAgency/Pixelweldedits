import { BRAND_LOGO_SRC, BRAND_NAME } from '../data/portfolio';

export function AboutSection() {
  return (
    <section id="about" className="border-b border-[#1D3054]/70 py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-[#1D3054] bg-[#0B1528] p-8 sm:p-10">
              <div className="flex items-center gap-4">
                <img
                  src={BRAND_LOGO_SRC}
                  alt="Pixelweldedits official emblem"
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-xl border border-[#1D3054] object-cover"
                />
                <div>
                  <p className="text-lg font-bold tracking-tight text-[#F4F7FC]">
                    {BRAND_NAME}
                  </p>
                  <p className="text-xs text-[#8FA3C4]">Post-Production &amp; Editorial Craft</p>
                </div>
              </div>

              <div className="mt-8 space-y-4 border-t border-[#1D3054] pt-6 text-xs text-[#8FA3C4]">
                <div className="flex items-center justify-between">
                  <span>Primary Discipline</span>
                  <span className="text-[#F4F7FC]">Narrative &amp; Rhythm Editing</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Visual Finishing</span>
                  <span className="text-[#F4F7FC]">Color Grading &amp; Motion</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Audio Integration</span>
                  <span className="text-[#F4F7FC]">Sound Design &amp; Mix Polish</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-wider text-[#5EB7FF]">
              Philosophy
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#F4F7FC] sm:text-4xl">
              Editing is where the story actually becomes visible.
            </h2>

            <div className="mt-6 space-y-5 text-base leading-relaxed text-[#8FA3C4]">
              <p>
                At <span className="font-semibold text-[#F4F7FC]">{BRAND_NAME}</span>, an edit is
                never treated as a sequence of flashy presets. Every project begins with structure:
                finding the emotional turn in a scene, trimming away dead weight, and letting sound
                carry momentum across cuts.
              </p>
              <p>
                Whether cutting a fifteen-second vertical reel or assembling a long-form YouTube
                feature, we treat frame timing, tonal balance, and typography with the same care
                expected in theatrical cinema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
