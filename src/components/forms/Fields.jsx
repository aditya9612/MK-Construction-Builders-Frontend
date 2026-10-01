import { cn } from '../../utils/formatting';

const labelClass = 'mb-1.5 block text-[13px] font-medium text-ink';

export function Input({ label, error, required, className, id, hint, leftIcon, rightIcon, ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label ? (
        <span className={labelClass}>
          {label}
          {required ? <span className="ml-0.5 text-danger">*</span> : null}
        </span>
      ) : null}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'input-control', 
            error && 'border-[#E8A0A0] focus:border-danger focus:ring-[#FDF4F4]', 
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : null}
      {hint && !error ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Textarea({ label, error, required, className, id, rows = 3, ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label ? (
        <span className={labelClass}>
          {label}
          {required ? <span className="ml-0.5 text-danger">*</span> : null}
        </span>
      ) : null}
      <textarea
        id={inputId}
        rows={rows}
        className={cn(
          'input-control h-auto py-2.5',
          error && 'border-[#E8A0A0] focus:border-danger focus:ring-[#FDF4F4]',
          className
        )}
        {...props}
      />
      {error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

export function Select({ label, error, required, className, id, children, ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label ? (
        <span className={labelClass}>
          {label}
          {required ? <span className="ml-0.5 text-danger">*</span> : null}
        </span>
      ) : null}
      <select
        id={inputId}
        className={cn('input-control', error && 'border-[#E8A0A0]', className)}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

export function DatePicker(props) {
  return <Input type="date" {...props} />;
}
