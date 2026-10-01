import { cn } from '../../utils/formatting';

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-hover active:bg-[#1E4C76]',
  secondary: 'bg-white text-ink border border-line hover:bg-surface hover:border-[#C5D3DF]',
  ghost: 'bg-transparent text-muted hover:bg-surface hover:text-ink',
  danger: 'bg-white text-danger border border-[#F0C9C9] hover:bg-[#FDF4F4]',
  success: 'bg-brand text-white hover:bg-brand-hover',
};

const sizes = {
  sm: 'h-9 px-3 text-[13px] rounded-[8px]',
  md: 'h-[42px] px-4 text-sm rounded-[10px]',
  lg: 'h-11 px-5 text-sm rounded-[10px]',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  disabled,
  loading,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition duration-ui focus-ring disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : null}
      {children}
    </button>
  );
}
