import { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  badge?: React.ReactNode;
  /** Rendered in the header row, to the right of the collapse toggle and
   * outside it (so it stays visible while collapsed and can hold its own
   * interactive controls). */
  headerAccessory?: React.ReactNode;
  defaultOpen: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function CollapsibleSection({
  title,
  icon,
  badge,
  headerAccessory,
  defaultOpen,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <div className="flex items-center gap-sm">
        <button
          type="button"
          className={`flex flex-1 min-w-0 items-center justify-between min-h-[44px] px-md py-sm rounded-xl transition-colors hover:bg-surface-container-high/60 ${headerClassName}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <div className="flex items-center gap-sm min-w-0">
            {icon && (
              <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">{icon}</span>
            )}
            <span className="font-headline-md text-headline-md text-on-surface truncate">{title}</span>
            {badge && <span className="flex-shrink-0">{badge}</span>}
          </div>
          <span
            className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform duration-200 flex-shrink-0 ${
              open ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>
        {headerAccessory && <div className="flex-shrink-0 pr-md">{headerAccessory}</div>}
      </div>
      {open && <div className={contentClassName}>{children}</div>}
    </div>
  );
}
