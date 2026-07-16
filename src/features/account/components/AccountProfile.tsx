import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../../shared/lib/errors';
import { useAuth } from '../../auth/AuthContext';
import { accountApi } from '../api/accountApi';

export function AccountProfile() {
  const { account, refreshAccount } = useAuth();
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
    <div>
      <div className="flex items-center gap-3 mt-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2">
            <span className="font-body-lg text-on-surface-variant">{account.displayName}</span>
            <button className="material-symbols-outlined text-outline-variant hover:text-primary transition-colors text-[18px]" onClick={startEditing}>
              edit
            </button>
          </div>
        )}
        <span className="text-outline-variant">·</span>
        <span className="font-body-md text-on-surface-variant">{account.email}</span>
      </div>
      {profileError && <p className="mt-2 font-label-sm text-error" role="alert">{profileError}</p>}
    </div>
  );
}
