import { Link } from 'react-router-dom';
import { cn } from '../../utils/formatting';

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? <span className="text-faint">/</span> : null}
          {item.to && index < items.length - 1 ? (
            <Link to={item.to} className="transition duration-ui hover:text-brand">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({ title, description, actions, breadcrumb, eyebrow, uppercase }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumb}
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{eyebrow}</p>
        ) : null}
        <h1 className={cn('text-[28px] font-semibold tracking-tight text-brand-navy sm:text-[30px]', uppercase && 'uppercase tracking-[0.02em]')}>
          {title}
        </h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
