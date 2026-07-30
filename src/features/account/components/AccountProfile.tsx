import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../../shared/lib/errors';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../../shared/components/Toast';
import { accountApi } from '../api/accountApi';

export function AccountProfile() {
  const { account, refreshAccount, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  function startEditing() {
    if (!account) return;
    setDraftName(account.displayName);
    setProfileError(null);
    setIsEditing(true);
  }

  async function saveDisplayName() {
    if (!account || !draftName.trim()) return;
    setIsSaving(true);
    setProfileError(null);
    try {
      await accountApi.updateDisplayName(account.accountID, draftName.trim());
      await refreshAccount();
      setIsEditing(false);
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  if (!account) {
    return (
      <p className="font-body-lg text-on-surface-variant max-w-2xl">
        <Link to="/login" className="text-primary hover:underline">Log in</Link> to see all your past drafts and saved decks.
      </p>
    );
  }

  return (
    <div className="space-y-1.5 mt-3">
      <div className="flex items-center gap-6 flex-nowrap">
        <span className="font-label-sm text-outline uppercase tracking-widest w-36 shrink-0 whitespace-nowrap">Display Name</span>
        {isEditing ? (
          <div className="flex items-center gap-2 flex-nowrap min-w-0">
            <input
              className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface font-body-md"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void saveDisplayName();
                if (event.key === 'Escape') setIsEditing(false);
              }}
              autoFocus
              disabled={isSaving}
            />
            <button className="text-primary hover:text-primary/80 font-label-sm" onClick={saveDisplayName} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button className="text-outline-variant hover:text-on-surface font-label-sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-nowrap min-w-0">
            <span className="font-body-lg text-on-surface whitespace-nowrap">{account.displayName}</span>
            <button className="material-symbols-outlined text-outline-variant hover:text-primary transition-colors text-[18px]" onClick={startEditing}>
              edit
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-6">
        <span className="font-label-sm text-outline uppercase tracking-widest w-36 shrink-0">Email</span>
        <span className="font-body-md text-on-surface">{account.email}</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="font-label-sm text-outline uppercase tracking-widest w-36 shrink-0">Account ID</span>
        <span className="font-mono text-sm text-on-surface bg-surface-container-high px-2 py-1 rounded border border-outline-variant/20 select-all">
          {account.accountID}
        </span>
        <button
          className="material-symbols-outlined text-outline-variant hover:text-primary transition-colors text-[18px]"
          title="Copy Account ID"
          onClick={() => navigator.clipboard.writeText(account.accountID).then(() => showToast('Copied Account ID')).catch(() => {})}
        >
          content_copy
        </button>
      </div>
      {profileError && <p className="mt-2 font-label-sm text-error" role="alert">{profileError}</p>}
      <div className="flex items-center gap-6 pt-3 border-t border-outline-variant/10 mt-3">
        <button
          className="text-error font-label-sm hover:underline flex items-center gap-1"
          onClick={() => { logout(); navigate('/'); }}
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}
