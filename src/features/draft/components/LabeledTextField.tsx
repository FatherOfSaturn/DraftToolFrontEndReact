interface LabeledTextFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  accentClassName?: 'text-primary' | 'text-secondary';
  inputClassName?: string;
  tooltip?: string;
  /** Rendered under the input (e.g. a join conflict on the name field). */
  error?: string | null;
}

export function LabeledTextField({
  label,
  placeholder,
  value,
  onChange,
  accentClassName = 'text-primary',
  inputClassName = '',
  tooltip,
  error,
}: LabeledTextFieldProps) {
  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 mb-2">
        <label className={`font-label-md text-label-md ${accentClassName}`}>{label}</label>
        {tooltip && (
          <span className="inline-flex group/tooltip">
            <span className="material-symbols-outlined text-base text-on-surface-variant cursor-help" aria-hidden="true">help</span>
            {/* Containing block is the field wrapper, so the tooltip is clamped
                to the field width and cannot spill off-screen on mobile. */}
            <span className="absolute bottom-full left-0 mb-2 w-full max-w-[500px] px-3 py-1.5 bg-surface-container-high text-on-surface text-label-sm rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none border border-outline-variant/30 shadow-lg z-50">
              {tooltip}
            </span>
          </span>
        )}
      </div>
      <input
        className={`w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface focus:outline-none input-glow transition-all font-label-md ${inputClassName}`}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={100}
      />
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
