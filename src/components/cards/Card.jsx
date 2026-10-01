import { cn } from '../../utils/formatting';

export function Card({ children, className, ...props }) {
  return (
    <div className={cn('rounded-[12px] border border-[#E1E8EF] bg-white p-5 shadow-card', className)} {...props}>
      {children}
    </div>
  );
}

export function SectionCard({ title, description, action, children, className, icon: Icon }) {
  return (
    <Card className={className}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border border-line bg-brand-pale text-brand">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div>
            <h3 className="text-[16px] font-semibold tracking-tight text-ink">{title}</h3>
            {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
