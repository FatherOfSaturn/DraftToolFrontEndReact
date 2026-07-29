import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '../../../shared/components/layout/Header';
import { Footer } from '../../../shared/components/layout/Footer';
import { FAVORITE_CUBES } from '../../../shared/lib/favoriteCubes';

/**
 * Marketing/landing page. Sign In, Donate, newsletter signup, and the
 * footer's social/scroll links are intentionally inert placeholders —
 * there's no backend support for any of them yet. The only real
 * navigation on this page is into /draft-selection.
 */
export function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="font-body-md text-body-md bg-surface-dim min-h-screen">
      <Header />
      <main className="pt-16">
        <HeroSection />
        <ExperienceSection />
        <FavoriteCubesSection />
        <ArchitectSection />
        <DonationSection />
      </main>
      <Footer />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[70vh] md:min-h-[921px] flex items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-dim/50 to-surface-dim" />
      <div className="relative z-10 text-center max-w-4xl">
        <div className="inline-flex items-center gap-xs px-md py-xs rounded-full glass-panel mb-md border border-primary/30">
          <span className="material-symbols-outlined text-primary text-sm">spark</span>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary">
            Feel the Power Of My Magic
          </span>
        </div>
        <h2 className="font-display text-display text-white mb-md leading-tight">
          Welcome to  <span className="text-primary italic">Pyramid Draft</span>
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-xl max-w-2xl mx-auto">
          A side project by a Magic player who wanted a faster way to draft cubes, and also take on a new side project.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-md">
          <Link
            className="group relative px-xl py-md bg-inverse-primary text-white font-headline-md rounded-xl overflow-hidden hover:scale-105 transition-all inline-block"
            to="/draft-selection"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            Explore Draft Types
          </Link>
          <a
            className="px-xl py-md glass-panel text-primary font-headline-md rounded-xl hover:bg-surface-container-highest/30 transition-all"
            href="#experience"
          >
            Background Information
          </a>
        </div>
      </div>
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl mana-pulse" />
      <div
        className="absolute bottom-1/4 right-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl mana-pulse"
        style={{ animationDelay: '-2s' }}
      />
    </section>
  );
}

function ExperienceSection() {
  return (
    <section id="experience" className="py-xl px-margin-mobile md:px-margin-desktop bg-surface-dim">
      <div className="mb-xl text-center">
        <h3 className="font-display text-headline-lg text-white mb-xs">A Few Useful Tools</h3>
        <div className="w-24 h-1 bg-primary mx-auto rounded-full opacity-50" />
      </div>
      <div className="grid grid-cols-12 gap-gutter max-w-7xl mx-auto">
        {/* Main Feature */}
        <div className="col-span-12 md:col-span-8 glass-panel rounded-2xl p-lg flex flex-col justify-end relative overflow-hidden group min-h-[280px] md:min-h-[400px]">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=1200&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-surface-dim/40 to-transparent" />
          <div className="relative z-10">
            <h4 className="font-headline-lg text-white mb-sm">The Unique Draft Experience</h4>
            <p className="font-body-md text-on-surface-variant max-w-md">
              The Namesake of the site, the Pyramid Draft is a unique drafting experience that is fun to experience in person, but a pain to set up. A small tool was set up to draft, and the rest of the features spiraled out of control.
            </p>
          </div>
        </div>

        {/* Streamline */}
        <div className="col-span-12 md:col-span-4 glass-panel rounded-2xl p-md hover-lift border-primary/10 hover:border-primary/40 transition-all">
          <span className="material-symbols-outlined text-secondary text-4xl mb-md">auto_fix_high</span>
          <h4 className="font-headline-md text-white mb-sm">Streamline Your Draft</h4>
          <p className="font-body-md text-on-surface-variant">
            Quick way to get started with deck building, and a few useful analytics tools to get started fast.
          </p>
        </div>

        {/* Save Prior Drafts */}
        <div className="col-span-12 md:col-span-4 glass-panel rounded-2xl p-md hover-lift border-primary/10 hover:border-primary/40 transition-all">
          <span className="material-symbols-outlined text-primary text-4xl mb-md">cloud_sync</span>
          <h4 className="font-headline-md text-white mb-sm">Save Your Prior Drafts</h4>
          <p className="font-body-md text-on-surface-variant">
            Create an account to save your prior drafts. Drafts are already saved, however to find them you would need to remember your Draft ID and whatever name you registered as.
          </p>
        </div>

        {/* Deckbuilder */}
        <div className="col-span-12 md:col-span-4 glass-panel rounded-2xl p-md hover-lift border-primary/10 hover:border-primary/40 transition-all">
          <span className="material-symbols-outlined text-tertiary text-4xl mb-md">dashboard</span>
          <h4 className="font-headline-md text-white mb-sm">Built-In Deckbuilder</h4>
          <p className="font-body-md text-on-surface-variant">
            After your draft, build your deck directly in the browser. Filter, search, and organize your pool with built-in analytics.
          </p>
        </div>

        {/* Mulligan Simulator */}
        <div className="col-span-12 md:col-span-4 glass-panel rounded-2xl p-md hover-lift border-primary/10 hover:border-primary/40 transition-all">
          <span className="material-symbols-outlined text-error text-4xl mb-md">casino</span>
          <h4 className="font-headline-md text-white mb-sm">Mulligan Simulator</h4>
          <p className="font-body-md text-on-surface-variant">
            Test your deck's opening hand consistency with probability calculations and interactive mulligan practice.
          </p>
        </div>
      </div>
    </section>
  );
}

function FavoriteCubesSection() {
  return (
    <section className="py-xl px-margin-mobile md:px-margin-desktop bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-xl">
          <span className="inline-block px-4 py-1 rounded-full bg-primary-container/10 border border-primary/20 text-primary font-label-sm text-label-sm mb-md uppercase tracking-widest">
            Featured Cubes
          </span>
          <h3 className="font-display text-headline-lg text-white mb-xs">Favorite Cubes</h3>
          <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto">
            Cubes that are personal favorites — friends of mine, or my own. I love playing all kinds of Magic but these I find particularly enjoyable to draft.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {FAVORITE_CUBES.map((cube) => (
            <Link
              key={cube.cubeID}
              to={`/draft-setup?cubeID=${encodeURIComponent(cube.cubeID)}`}
              className="glass-panel rounded-2xl p-lg flex flex-col h-full border-primary/10 hover:border-primary/40 hover:scale-[1.02] transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">{cube.icon}</span>
              </div>
              <h4 className="font-headline-md text-white mb-sm">{cube.name}</h4>
              <p className="font-body-md text-on-surface-variant flex-grow">{cube.description}</p>
              <div className="mt-md flex items-center gap-xs text-primary font-label-md">
                Start Drafting
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchitectSection() {
  return (
    <section id="backstory" className="py-xl px-margin-mobile md:px-margin-desktop bg-surface-container-low relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-xl relative z-10">
        <div className="w-full md:w-1/2">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-outline-variant arcane-border">
              <img
                className="w-full h-full object-cover"
                alt="Portrait of the creator"
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&q=80"
              />
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <h3 className="font-display text-display text-white mb-md">Meet the Creator</h3>
          <p className="font-body-lg text-on-surface-variant mb-md italic">
            "Every card is a thread in the tapestry of strategy. My goal was to create a loom that
            feels as magical as the spells being cast."
          </p>
          <p className="font-body-md text-on-surface-variant mb-lg">
            I love Magic, writing code, and learning new things. This project allowed me to learn a lot. My life has gotten very busy, and due to that I did utilize AI to basically redo all of my Front-End code. My previous attempts felt very low quality and this last recreation I think looks a lot cleaner. I used React, and free tiers of Google Stitch, and Claude to realize a lot of the wireframes and mockups.
          </p>
          <div className="flex items-center gap-md">
            <a className="flex flex-col" href="https://github.com/FatherOfSaturn" target="_blank" rel="noopener noreferrer">
              <span className="font-label-sm text-label-sm text-primary uppercase">
                Follow me on GitHub
              </span>
              <span className="font-headline-md text-white">@FatherOfSaturn</span>
            </a>
            <div className="h-10 w-[1px] bg-outline-variant" />
            <div className="flex gap-sm">
              <a href="https://github.com/FatherOfSaturn" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-on-surface">public</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-on-surface">history_edu</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4 scale-150">
        <span className="material-symbols-outlined text-[400px] text-primary">filter_vintage</span>
      </div>
    </section>
  );
}

const TIERS = [
  {
    name: 'Acolyte',
    price: '$5 / mo',
    labelClass: 'font-label-sm text-label-sm text-tertiary block mb-xs uppercase',
    barClass: 'h-full bg-tertiary w-1/4 group-hover:w-full transition-all duration-500',
    highlighted: false,
  },
  {
    name: 'Mage',
    price: '$15 / mo',
    labelClass: 'font-label-sm text-label-sm text-primary block mb-xs uppercase',
    barClass: 'h-full bg-primary w-1/2 group-hover:w-full transition-all duration-500',
    highlighted: true,
  },
  {
    name: 'Archmage',
    price: '$50 / mo',
    labelClass: 'font-label-sm text-label-sm text-secondary block mb-xs uppercase',
    barClass: 'h-full bg-secondary w-3/4 group-hover:w-full transition-all duration-500',
    highlighted: false,
  },
] as const;

function DonationSection() {
  return (
    <section id="donate" className="py-xl px-margin-mobile md:px-margin-desktop bg-surface-dim">
      <div className="max-w-4xl mx-auto glass-panel rounded-[2rem] p-xl text-center relative overflow-hidden glow-purple">
        <div className="relative z-10">
          <span className="material-symbols-outlined text-tertiary text-5xl mb-md">auto_awesome</span>
          <h3 className="font-display text-headline-lg text-white mb-md">Support the Craft</h3>
          <p className="font-body-md text-on-surface-variant mb-xl max-w-xl mx-auto">
            The site is a labor of love, kept alive through the generosity of the community. Your
            contributions directly fuel the development of new features, visualizations, and
            the servers that host our the site.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
            {TIERS.map((tier) => (
              <button
                key={tier.name}
                className={
                  tier.highlighted
                    ? 'p-md rounded-xl bg-primary-container/20 border border-primary/50 hover:bg-primary-container/30 transition-all group relative'
                    : 'p-md rounded-xl glass-panel hover:bg-surface-container-highest/40 transition-all border border-outline-variant/30 group'
                }
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-xs py-1 bg-primary text-on-primary text-[10px] font-bold rounded uppercase">
                    Most Chosen
                  </div>
                )}
                <span className={tier.labelClass}>
                  {tier.name}
                </span>
                <span className="font-display text-headline-md text-white">{tier.price}</span>
                <div className="mt-sm h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className={tier.barClass} />
                </div>
              </button>
            ))}
          </div>
          <button className="px-xl py-md bg-tertiary text-on-tertiary font-headline-md rounded-xl hover:shadow-[0_0_30px_rgba(255,181,157,0.4)] transition-all">
            Donate via Mana Crystal
          </button>
        </div>
      </div>
    </section>
  );
}
