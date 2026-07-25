export function DonatorsPrioritizedCard() {
  return (
    <div className="glass-panel rounded-xl p-md border-l-4 border-secondary">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-secondary text-xl mt-0.5">verified</span>
        <div>
          <h4 className="font-label-lg text-label-lg text-on-surface mb-1">Donators Prioritized</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Feature requests from active donors are reviewed and prioritized first.
            Your support directly shapes the future of Pyramid Draft.
          </p>
        </div>
      </div>
    </div>
  );
}
