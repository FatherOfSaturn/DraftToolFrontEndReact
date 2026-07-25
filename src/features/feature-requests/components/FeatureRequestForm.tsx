import { FormEvent, useState } from 'react';

export function FeatureRequestForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState('minor');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    alert('Feature request submitted! (This is a placeholder — no backend wired yet.)');
    setTitle('');
    setDescription('');
    setEmail('');
    setPriority('minor');
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-lg flex flex-col gap-md">
      <h3 className="font-headline-sm text-headline-sm text-on-surface">Submit a Feature Request</h3>

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-title">Vision Title</label>
        <input
          id="fr-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="A short name for your idea"
          className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-desc">Essence Description</label>
        <textarea
          id="fr-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          placeholder="Describe your feature idea in detail..."
          className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-email">Contact Email</label>
        <input
          id="fr-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com (optional)"
          className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fr-priority">Priority Level</label>
        <select
          id="fr-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-md py-sm rounded-lg bg-surface-container-highest/50 border border-outline-variant/30 text-body-md text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
        >
          <option value="minor">Minor Cantrip</option>
          <option value="adept">Adept Ritual</option>
          <option value="archmage">Archmage Manifestation</option>
        </select>
      </div>

      <button
        type="submit"
        className="px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:brightness-110 active:scale-95 transition-all"
      >
        Submit Request
      </button>
    </form>
  );
}
