import { useState } from 'react';

interface SaveDeckModalProps {
  defaultName: string;
  defaultDescription?: string;
  onUpdate: (name: string, description: string) => Promise<void>;
  onSaveAsNew: (name: string, description: string) => Promise<void>;
  onCancel: () => void;
  showUpdate?: boolean;
}

export function SaveDeckModal({
  defaultName,
  defaultDescription = '',
  onUpdate,
  onSaveAsNew,
  onCancel,
  showUpdate = false,
}: SaveDeckModalProps) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onUpdate(name.trim(), description.trim());
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deck');
      setSaving(false);
    }
  }

  async function handleSaveAsNew() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSaveAsNew(name.trim(), description.trim());
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deck');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container rounded-xl p-lg shadow-xl w-full max-w-md mx-4">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Save Deck</h3>
        <p className="font-body-md text-on-surface-variant mb-md">
          {showUpdate ? 'Update this deck or save a new copy.' : 'Give your deck a name and optional description.'}
        </p>

        <div className="space-y-md mb-md">
          <div>
            <label className="block font-label-sm text-on-surface-variant mb-1">Deck Name</label>
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface focus:outline-none input-glow transition-all font-label-md"
              placeholder="My Awesome Deck"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>
          <div>
            <label className="block font-label-sm text-on-surface-variant mb-1">Description (optional)</label>
            <textarea
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface focus:outline-none input-glow transition-all font-body-md resize-none"
              placeholder="What's this deck about?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>
        </div>

        {error && <p className="text-sm text-error mb-md">{error}</p>}

        <div className="flex gap-sm">
          {showUpdate && (
            <button
              className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-md rounded-xl font-label-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              onClick={handleUpdate}
              disabled={!name.trim() || saving}
            >
              {saving ? 'Saving…' : 'Update Deck'}
            </button>
          )}
          <button
            className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-md rounded-xl font-label-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            onClick={handleSaveAsNew}
            disabled={!name.trim() || saving}
          >
            {saving && !showUpdate ? 'Saving…' : 'Save as New'}
          </button>
          <button
            className="flex-1 border border-outline/30 text-outline hover:text-on-surface py-md rounded-xl font-label-md transition-all active:scale-95"
            type="button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
