import { Search } from 'lucide-react';
import { cn } from '../../utils/formatting';

export function SearchInput({ value, onChange, placeholder, className, compact }) {
  return (
    <label className={cn('relative block', className)}>
      <span className="sr-only">{placeholder || 'Search'}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('input-control pl-9', compact && 'input-control-sm')}
      />
    </label>
  );
}
