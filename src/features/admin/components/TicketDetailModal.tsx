import { useEffect } from 'react';
import type { SupportRequest } from '../../feature-requests/api/supportApi';

interface TicketDetailModalProps {
  ticket: SupportRequest;
  onClose: () => void;
}

/**
 * Plain-text ticket detail view. All user-provided fields (title,
 * description, email) are rendered as text nodes — never HTML — so a
 * spammy ticket cannot inject markup into the admin UI.
 */
export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ticket details"
    >
      <div
        className="bg-surface-container rounded-xl p-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-md mb-md">
          <h3 className="font-headline-md text-headline-md text-on-surface break-words">{ticket.title}</h3>
          <button
            className="p-1 hover:bg-surface-container-high rounded-md text-outline hover:text-on-surface"
            onClick={onClose}
            aria-label="Close ticket details"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <dl className="flex flex-col gap-sm mb-md">
          <div className="flex flex-col gap-0.5">
            <dt className="font-label-sm text-on-surface-variant uppercase tracking-widest">Status</dt>
            <dd className="font-body-md text-on-surface">{ticket.status}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="font-label-sm text-on-surface-variant uppercase tracking-widest">Priority</dt>
            <dd className="font-body-md text-on-surface">{ticket.priority}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="font-label-sm text-on-surface-variant uppercase tracking-widest">Type</dt>
            <dd className="font-body-md text-on-surface">{ticket.type}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="font-label-sm text-on-surface-variant uppercase tracking-widest">Contact</dt>
            <dd className="font-body-md text-on-surface break-words">{ticket.contactEmail}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="font-label-sm text-on-surface-variant uppercase tracking-widest">Created</dt>
            <dd className="font-body-md text-on-surface">{ticket.createdOnDate}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-xs border-t border-outline-variant/10 pt-md">
          <span className="font-label-sm text-on-surface-variant uppercase tracking-widest">Description</span>
          <p className="font-body-md text-on-surface whitespace-pre-wrap break-words">{ticket.description}</p>
        </div>
      </div>
    </div>
  );
}
