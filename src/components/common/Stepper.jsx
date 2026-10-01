import { Check } from 'lucide-react';
import { WIZARD_STEPS } from '../../constants';
import { cn } from '../../utils/formatting';

export function Stepper({ current, onSelect, maxReachable }) {
  return (
    <>
      <ol className="hidden items-start md:flex">
        {WIZARD_STEPS.map((step, index) => {
          const done = step.id < current;
          const active = step.id === current;
          const reachable = step.id <= maxReachable;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-start">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onSelect(step.id)}
                className={cn('flex min-w-0 flex-1 flex-col items-center gap-2 text-center', !reachable && 'cursor-not-allowed')}
              >
                <span className="flex w-full items-center">
                  <span className={cn('h-px flex-1', index === 0 ? 'bg-transparent' : done || active ? 'bg-brand' : 'bg-line')} />
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition duration-ui',
                      active ? 'border-brand bg-brand text-white' : done ? 'border-success bg-success text-white' : 'border-line bg-white text-faint'
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : String(step.id).padStart(2, '0')}
                  </span>
                  <span className={cn('h-px flex-1', index === WIZARD_STEPS.length - 1 ? 'bg-transparent' : done ? 'bg-brand' : 'bg-line')} />
                </span>
                <span className={cn('px-1 text-[12px] font-medium', active ? 'text-brand-navy' : done ? 'text-success' : 'text-faint')}>{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="rounded-[12px] border border-line bg-white p-3 md:hidden">
        <p className="text-[13px] font-medium text-ink">
          Step {String(current).padStart(2, '0')} of {String(WIZARD_STEPS.length).padStart(2, '0')} — {WIZARD_STEPS[current - 1]?.title}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-brand transition-all duration-ui" style={{ width: `${(current / WIZARD_STEPS.length) * 100}%` }} />
        </div>
      </div>
    </>
  );
}
