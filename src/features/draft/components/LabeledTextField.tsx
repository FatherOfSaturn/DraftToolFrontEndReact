interface LabeledTextFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  accentClassName?: 'text-primary' | 'text-secondary';
  inputClassName?: string;
  tooltip?: string;
}

export function LabeledTextField({
  label,
  placeholder,
  value,
  onChange,
  accentClassName = 'text-primary',
  inputClassName = '',
  tooltip,
}: LabeledTextFieldProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <label className={`font-label-md text-label-md ${accentClassName}`}>{label}</label>
        {tooltip && (
          <span className="relative inline-flex group/tooltip">
            <span className="material-symbols-outlined text-base text-on-surface-variant cursor-help" aria-hidden="true">help</span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-surface-container-high text-on-surface text-label-sm rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none min-w-[500px] max-w-[500px] border border-outline-variant/30 shadow-lg z-50">
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
      />
    </div>
  );
}
