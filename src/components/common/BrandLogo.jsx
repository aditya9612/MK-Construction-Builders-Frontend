import logoFull from '../../assets/brand/logo-full.png';
import logoMark from '../../assets/brand/logo-mark.png';
import { cn } from '../../utils/formatting';

const SRC = {
  full: logoFull,
  compact: logoMark,
  light: logoFull,
  dark: logoFull,
  quotation: logoFull,
};

const SIZE = {
  full: 'h-auto w-[168px] max-w-full',
  compact: 'h-9 w-auto max-w-9',
  light: 'h-auto w-[168px] max-w-full',
  dark: 'h-auto w-[180px] max-w-full',
  quotation: 'h-auto w-[160px] max-h-[88px]',
};

export function BrandLogo({ variant = 'full', className, alt = 'MK Construction & Builders' }) {
  const src = SRC[variant] || logoFull;
  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-contain object-center', SIZE[variant] || SIZE.full, className)}
    />
  );
}

export function Logo({ compact = false, onDark = true }) {
  return <BrandLogo variant={compact ? 'compact' : onDark ? 'light' : 'dark'} />;
}
