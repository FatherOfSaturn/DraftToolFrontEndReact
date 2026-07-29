interface LabeledTextFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  accentClassName?: 'text-primary' | 'text-secondary';
  inputClassName?: string;
}

export function LabeledTextField({
  label,
  placeholder,
  value,
  onChange,
  accentClassName = 'text-primary',
  inputClassName = '',
}: LabeledTextFieldProps) {
  return (
    <div>
      <label className={`block font-label-md text-label-md ${accentClassName} mb-2`}>{label}</label>
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
