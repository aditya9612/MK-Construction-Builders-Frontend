import { cn } from '../../utils/formatting';

const statusStyles = {
  Draft: 'bg-[#F1F4F7] text-[#5F7185]',
  Sent: 'bg-brand-light text-brand',
  Approved: 'bg-[#E8F6EF] text-success',
  Rejected: 'bg-[#FDF4F4] text-danger',
  Expired: 'bg-[#FBF4E8] text-warning',
  Active: 'bg-[#E8F6EF] text-success',
  Inactive: 'bg-[#F1F4F7] text-[#5F7185]',
  Planning: 'bg-[#F1F4F7] text-[#5F7185]',
  'In Progress': 'bg-brand-light text-brand',
  Completed: 'bg-[#E8F6EF] text-success',
  'On Hold': 'bg-[#FBF4E8] text-warning',
};

const categoryStyles = {
  Foundation: 'bg-brand-light text-brand-navy',
  Structure: 'bg-brand-pale text-brand-deep',
  RCC: 'bg-[#E6EDF5] text-brand-deep',
  Masonry: 'bg-brand-pale text-[#255A8A]',
  Finishing: 'bg-[#F1F4F7] text-[#516274]',
  Electrical: 'bg-brand-light text-brand',
  Plumbing: 'bg-brand-pale text-brand-deep',
  Doors: 'bg-[#E6EDF5] text-brand-navy',
  Windows: 'bg-brand-pale text-[#255A8A]',
  Tiles: 'bg-[#F1F4F7] text-[#516274]',
  Granite: 'bg-brand-light text-brand-navy',
  Painting: 'bg-brand-pale text-brand-deep',
};

export function Badge({ children, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-4', className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <Badge className={statusStyles[status] || 'bg-[#F1F4F7] text-[#5F7185]'}>{status}</Badge>;
}

export function CategoryBadge({ category }) {
  return <Badge className={categoryStyles[category] || 'bg-brand-pale text-brand-deep'}>{category}</Badge>;
}
