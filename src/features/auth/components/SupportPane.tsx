export interface SupportAvatar {
  src: string;
  alt: string;
}

interface SupportPaneProps {
  supportAvatars?: SupportAvatar[];
  oracleCardImageSrc?: string;
}

const DEFAULT_AVATAR_SEEDS = ['A', 'B', 'C'];
const SUPPORT_TIERS = [
  { amount: '5 Crystals', label: 'Initiate Tier', icon: 'diamond', bg: 'bg-primary-container/10' },
  { amount: '10 Crystals', label: 'Adept Tier', icon: 'compost', bg: 'bg-primary-container/20' },
];

export function SupportPane({ supportAvatars, oracleCardImageSrc }: SupportPaneProps) {
  return (
    <section className="lg:col-span-5 flex flex-col gap-md">
      <div className="glass-panel p-lg rounded-xl flex flex-col h-full">
        <div className="mb-md">
          <span className="inline-block px-sm py-xs bg-tertiary-container/20 text-tertiary rounded-full font-label-sm mb-sm border border-tertiary-container/30">
            PATRONS NEEDED
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface">Support the Archives</h2>
          <p className="text-on-surface-variant text-body-md mt-xs">
            Help the Scribes maintain the magical stability of our digital collective.
          </p>
        </div>

        <div className="space-y-sm flex-grow">
          {SUPPORT_TIERS.map((tier) => (
            <button
              key={tier.amount}
              type="button"
              className="group w-full p-md rounded-lg bg-surface-container-low border border-outline-variant/20 hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-md">
                <div className={`w-12 h-12 rounded-lg ${tier.bg} flex items-center justify-center text-primary`}>
                  <span className="material-symbols-outlined text-headline-md">{tier.icon}</span>
                </div>
                <div className="text-left">
                  <h3 className="font-label-md text-on-surface">{tier.amount}</h3>
                  <p className="font-label-sm text-on-surface-variant">{tier.label}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary group-hover:translate-x-1 transition-all">
                chevron_right
              </span>
            </button>
          ))}

          <button
            type="button"
            className="group w-full p-md rounded-lg bg-surface-container-lowest border border-dashed border-outline-variant/40 hover:border-tertiary transition-all cursor-pointer flex items-center justify-center gap-sm"
          >
            <span className="material-symbols-outlined text-tertiary">volunteer_activism</span>
            <span className="font-label-md text-on-surface">Custom Offering</span>
          </button>
        </div>

        <div className="mt-lg pt-md border-t border-outline-variant/10">
          <div className="flex items-center gap-sm mb-sm">
            <div className="flex -space-x-2">
              {supportAvatars && supportAvatars.length > 0
                ? supportAvatars.map((avatar, index) => <SupportAvatarImage key={index} avatar={avatar} />)
                : DEFAULT_AVATAR_SEEDS.map((seed) => <AvatarStub key={seed} seed={seed} />)}
            </div>
            <p className="font-label-sm text-on-surface-variant">Joined by 1.2k Arcanists</p>
          </div>
        </div>
      </div>

      <DecorativeOracleCard imageSrc={oracleCardImageSrc} />
    </section>
  );
}

function SupportAvatarImage({ avatar }: { avatar: SupportAvatar }) {
  return (
    <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-variant overflow-hidden">
      <img className="w-full h-full object-cover" src={avatar.src} alt={avatar.alt} />
    </div>
  );
}

function AvatarStub({ seed }: { seed: string }) {
  return (
    <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-variant overflow-hidden flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
      {seed}
    </div>
  );
}

function DecorativeOracleCard({ imageSrc }: { imageSrc?: string }) {
  return (
    <div className="relative h-40 rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-container/30 via-surface-container to-secondary-container/20">
      {imageSrc && <img className="absolute inset-0 w-full h-full object-cover" src={imageSrc} alt="" />}
      <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-80" />
      <div className="absolute bottom-md left-md">
        <p className="font-label-sm text-primary uppercase tracking-tighter">Current Oracle</p>
        <h4 className="font-headline-md text-on-surface">The Weaver of Fates</h4>
      </div>
    </div>
  );
}
