import { useEffect, useState } from 'react';

/**
 * Returns true when the primary input is likely a touch device
 * (no hover capability).  Listens for changes so it adapts if the
 * user switches input modes mid-session (e.g. attaching a mouse to
 * a tablet).
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(() => !window.matchMedia('(hover: hover)').matches);

  useEffect(() => {
    const mql = window.matchMedia('(hover: hover)');
    function onChange(e: MediaQueryListEvent) {
      setIsTouch(!e.matches);
    }
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isTouch;
}
