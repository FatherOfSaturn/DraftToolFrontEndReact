import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

/**
 * Minimal typing for the Cloudflare Turnstile implicit global. See
 * https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 */
interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  theme?: 'auto' | 'light' | 'dark';
  action?: string;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';

function loadTurnstileScript(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('Turnstile loaded but API is unavailable'));
    });
    script.addEventListener('error', () => reject(new Error('Failed to load the Turnstile script')));
  });
}

export interface TurnstileWidgetHandle {
  /** Expire the current token and require the user to re-complete the widget. */
  reset: () => void;
}

interface TurnstileWidgetProps {
  siteKey: string;
  /** Called with the token once the user completes the challenge, or null when it expires/errors. */
  onTokenChange: (token: string | null) => void;
}

/**
 * Explicitly-rendered Cloudflare Turnstile widget (managed mode). React owns
 * the lifecycle: the script is loaded once, the widget is rendered into a
 * controlled container, and callers can reset it via the ref after a failed
 * submit (tokens are single-use and expire after 300 s).
 */
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey, onTokenChange }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [scriptError, setScriptError] = useState(false);

    useEffect(() => {
      let cancelled = false;

      loadTurnstileScript()
        .then((turnstile) => {
          if (cancelled || !containerRef.current || containerRef.current.childElementCount > 0) return;
          widgetIdRef.current = turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => onTokenChange(token),
            'expired-callback': () => onTokenChange(null),
            'error-callback': () => {
              onTokenChange(null);
              return true;
            },
            theme: 'auto',
          });
        })
        .catch(() => {
          if (!cancelled) setScriptError(true);
        });

      return () => {
        cancelled = true;
        if (widgetIdRef.current !== null && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
      // The callbacks are captured intentionally; re-rendering the widget on
      // every parent render would break the challenge.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteKey]);

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          if (widgetIdRef.current !== null && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
          onTokenChange(null);
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    if (scriptError) {
      return (
        <p className="font-label-md text-label-md text-error" role="alert">
          The spam protection widget failed to load. Please refresh the page and try again.
        </p>
      );
    }

    return <div ref={containerRef} className="min-h-[65px]" aria-label="Spam protection" />;
  }
);
