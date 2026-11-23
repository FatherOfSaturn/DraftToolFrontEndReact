export interface ExtraPickFabProps {
  armed: boolean;
  disabled: boolean;
  onClick: () => void;
}

/** Floating action button that arms/disarms the Super Pick (double-draft)
 * mechanic for the next confirmed pick. */
export function ExtraPickFab({ armed, disabled, onClick }: ExtraPickFabProps) {
  return (
    // The group wrapper owns the hover so the tooltip stays readable even
    // while the button itself is disabled (disabled buttons don't reliably
    // fire pointer events, and their opacity would dim the tooltip too).
    <div className="fixed bottom-20 right-6 md:bottom-10 md:right-8 lg:right-[340px] z-40 group">
      <button
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 ${
          armed ? 'bg-tertiary text-on-tertiary shadow-[0_0_24px_var(--glow-tertiary)]' : 'bg-primary text-on-primary'
        }`}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={armed}
      >
        <span className="material-symbols-outlined text-[28px]">bolt</span>
      </button>
      <span className="absolute right-full top-1/2 -translate-y-1/2 mr-4 bg-surface-container-highest text-primary px-3 py-1.5 rounded-lg text-label-sm font-label-sm border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
        Toggle this button to pick two cards from the pack.
      </span>
    </div>
  );
}
