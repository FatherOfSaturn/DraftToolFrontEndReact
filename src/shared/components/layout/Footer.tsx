import { Link } from 'react-router-dom';

/**
 * The single shared footer, used on every page. Previously every page
 * had its own footer with different copy ("Manifesto" vs "Privacy
 * Leylines" vs "Arcane Foundry", etc) — this is now the one canonical
 * version (taken from the original Home page footer, per product
 * direction), used everywhere.
 */
export function Footer() {
  return (
    <footer className="bg-surface-container-lowest py-xl px-margin-mobile md:px-margin-desktop border-t border-outline-variant/20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-xl">
        <div className="max-w-xs">
          <div className="flex items-center gap-xs mb-md">
            <span className="material-symbols-outlined text-primary text-2xl">auto_stories</span>
            <h5 className="font-display text-headline-md font-extrabold text-primary tracking-tight">
              Pyramid Draft
            </h5>
          </div>
          <p className="font-body-md text-on-surface-variant mb-md">
            The definitive mystical drafting companion for Magic: The Gathering players who seek
            something beyond the ordinary.
          </p>
          <div className="flex gap-md">
            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">
              hub
            </span>
            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">
              alternate_email
            </span>
            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">
              token
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-xl">
          <div>
            <h6 className="font-label-md text-white mb-md uppercase tracking-widest">Sanctum</h6>
            <ul className="space-y-sm font-body-md text-on-surface-variant">
              <li>
                <Link className="hover:text-primary transition-colors" to="/draft-selection">
                  Start Draft
                </Link>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Public Cubes
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Hall of Fame
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h6 className="font-label-md text-white mb-md uppercase tracking-widest">Scrolls</h6>
            <ul className="space-y-sm font-body-md text-on-surface-variant">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  About
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Development Log
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Privacy Leylines
                </a>
              </li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h6 className="font-label-md text-white mb-md uppercase tracking-widest">Newsletter</h6>
            <div className="relative">
              <input
                className="w-full bg-surface-container-high border-outline-variant rounded-lg px-md py-sm focus:ring-primary focus:border-primary text-on-surface"
                placeholder="Summoner's Email"
                type="email"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-primary">
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-xl pt-lg border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-md text-label-sm font-label-sm text-outline">
        <p>© 2024 Pyramid Draft. Not affiliated with Wizards of the Coast.</p>
        <p>Crafted in the Blind Eternities.</p>
      </div>
    </footer>
  );
}
