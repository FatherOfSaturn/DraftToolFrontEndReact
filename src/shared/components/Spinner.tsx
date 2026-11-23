interface SpinnerProps {
  /** Tailwind size classes for the circle, e.g. "h-8 w-8". */
  sizeClassName?: string;
  /** Border width class, e.g. "border-2" or "border-4". */
  borderClassName?: string;
  /** Classes for the wrapper (spacing/centering); defaults to "py-md". */
  className?: string;
  label?: string;
}

/** Small centered loading indicator shared by list/panel views. */
export function Spinner({
  sizeClassName = 'h-8 w-8',
  borderClassName = 'border-2',
  className = 'py-md',
  label = 'Loading',
}: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label={label}>
      <div className={`${sizeClassName} ${borderClassName} rounded-full border-primary border-t-transparent animate-spin`} />
    </div>
  );
}
