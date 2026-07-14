import { Link, useLocation, useNavigate } from 'react-router-dom';

export interface HeaderProps {
  /** When provided, renders a search box in the header (used by the
   * Account page; most pages omit this). The page owns the search
   * state — Header is just the input. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
}

interface NavLinkDef {
  label: string;
  to: string;
  /** Additional path prefixes that should also count as "this nav item
   * is active" — e.g. the Draft flow spans three different routes
   * (Selection, Setup, the live board), and "Draft" should stay
   * highlighted through all of them, not just the first one. */
  activePrefixes?: string[];
}

const NAV_LINKS: NavLinkDef[] = [
  { label: 'Draft', to: '/draft-selection', activePrefixes: ['/draft-setup', '/draft/'] },
  { label: 'Mulligan Simulator', to: '/mulligan-simulator' },
  { label: 'Account', to: '/account' },
];

/**
 * The single shared top nav, used on every page. Previously every page
 * had its own inline copy of this markup, which had drifted (different
 * nav links, different brand name, each one hardcoding a different link
 * as "active" rather than reflecting the actual current route) — this
 * is now the one source of truth. The active link is now derived from
 * the real route via useLocation(), not hardcoded per page.
 */
export function Header({ search }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-margin-desktop h-16 bg-surface-dim/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_20px_-2px_rgba(119,51,217,0.2)]">
      <div className="flex items-center gap-base">
        <span
          className="material-symbols-outlined text-primary text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_stories
        </span>
        <h1 className="font-display text-headline-md font-extrabold text-primary tracking-tight">
          <Link to="/" className="text-primary hover:text-primary/80 transition-colors duration-300">
            Pyramid Draft
          </Link>
        </h1>
      </div>
      <div className="hidden md:flex items-center gap-lg">
        {NAV_LINKS.map((link) => {
          const isActive =
            location.pathname.startsWith(link.to) ||
            (link.activePrefixes?.some((prefix) => location.pathname.startsWith(prefix)) ?? false);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={
                isActive
                  ? 'font-label-md text-label-md text-primary border-b-2 border-primary pb-1'
                  : 'font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300'
              }
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300"
          to="/deckbuilder"
        >
          Deck Building
        </Link>
        <Link
          className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300"
          to="/#backstory"
        >
          Meet the Creator
        </Link>
        <Link
          className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300"
          to="/#donate"
        >
          Donate
        </Link>
      </div>
      <div className="flex items-center gap-md">
        {search && (
          <div className="hidden md:flex items-center bg-surface-container-highest/50 rounded-lg px-3 py-1.5 border border-outline-variant/30 focus-within:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-outline text-[20px] mr-2">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-label-sm w-48 placeholder-outline/50"
              placeholder={search.placeholder ?? 'Search...'}
              type="text"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
            />
          </div>
        )}
        <button
          className="px-md py-xs bg-primary text-on-primary font-label-md text-label-md rounded-lg active:scale-95 duration-200 hover:brightness-110 transition-all"
          onClick={() => navigate('/login')}
        >
          Sign In
        </button>
      </div>
    </nav>
  );
}
