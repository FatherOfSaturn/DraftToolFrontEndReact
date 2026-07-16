import type { ReactNode } from 'react';

export interface StatusScreenProps {
  children: ReactNode;
  /** 'error' renders in the error color; 'normal' (default) is muted. */
  tone?: 'normal' | 'error';
}

/**
 * A centered, full-viewport message used for a page's loading/error/empty
 * states — e.g. "Loading draft…" or "Something went wrong: …". Shared by
 * DraftPage and DeckBuilderPage, which previously each defined the same
 * markup independently (DraftPage as a local `FullScreenMessage`
 * component, DeckBuilderPage inline).
 */
export function StatusScreen({ children, tone = 'normal' }: StatusScreenProps) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-surface-dim text-body-md ${
        tone === 'error' ? 'text-error' : 'text-on-surface-variant'
      }`}
    >
      {children}
    </div>
  );
}
