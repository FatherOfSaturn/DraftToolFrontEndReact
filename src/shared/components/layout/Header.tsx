import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export interface HeaderProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
}

interface NavLinkDef {
  label: string;
  to: string;
  icon: string;
  activePrefixes?: string[];
}

const NAV_LINKS: NavLinkDef[] = [
  { label: 'Draft', to: '/draft-selection', icon: 'style', activePrefixes: ['/draft-setup', '/draft/'] },
  { label: 'Deck Building', to: '/deckbuilder', icon: 'dashboard' },
  { label: 'Mulligan Simulator', to: '/mulligan-simulator', icon: 'casino' },
  { label: 'Account', to: '/account', icon: 'person' },
];

const SECONDARY_LINKS = [
  { label: 'Meet the Creator', to: '/#backstory', icon: 'person_search' },
  { label: 'Donate', to: '/#donate', icon: 'favorite' },
];

export function Header({ search }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when viewport reaches md (768px)
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setMenuOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [menuOpen]);

  function isActiveLink(link: NavLinkDef) {
    return (
      location.pathname.startsWith(link.to) ||
      (link.activePrefixes?.some((p) => location.pathname.startsWith(p)) ?? false)
    );
  }

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 bg-surface-dim/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_20px_-2px_rgba(119,51,217,0.2)]">
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

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-lg">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={
                isActiveLink(link)
                  ? 'font-label-md text-label-md text-primary border-b-2 border-primary pb-1'
                  : 'font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300'
              }
            >
              {link.label}
            </Link>
          ))}
          {SECONDARY_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}
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
          {/* Hamburger — visible below md */}
          <button
            className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg hover:bg-surface-container-highest/50 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="material-symbols-outlined text-on-surface text-[24px]">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile slide-out menu */}
      <div
        className={`fixed top-16 right-0 w-72 h-[calc(100dvh-4rem)] bg-surface-dim/95 backdrop-blur-xl border-l border-outline-variant/30 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out md:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col p-lg gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-label-md font-label-md transition-colors ${
                isActiveLink(link)
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface hover:bg-surface-container-highest/50 hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.label}
            </Link>
          ))}

          <div className="my-3 h-px bg-outline-variant/20" />

          {SECONDARY_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-label-md font-label-md text-on-surface-variant hover:bg-surface-container-highest/50 hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile search */}
        {search && (
          <div className="px-lg mt-auto pb-lg">
            <div className="flex items-center bg-surface-container-highest/50 rounded-lg px-3 py-2 border border-outline-variant/30 focus-within:border-primary/50 transition-all">
              <span className="material-symbols-outlined text-outline text-[20px] mr-2">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-label-sm w-full placeholder-outline/50"
                placeholder={search.placeholder ?? 'Search...'}
                type="text"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
