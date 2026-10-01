import { BrandLogo } from '../common/BrandLogo';

export function FileUpload({ label, value, onChange }) {
  return (
    <div className="text-sm">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      <div className="rounded-[12px] border border-line bg-surface p-4">
        <div className="mb-3 flex min-h-[72px] items-center justify-center rounded-lg bg-white p-3">
          {value ? (
            <img src={value} alt="Company logo" className="max-h-16 w-auto max-w-[180px] object-contain" />
          ) : (
            <BrandLogo variant="dark" className="h-auto max-h-16 w-[180px]" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer">
            <span className="rounded-[10px] bg-brand px-3 py-2 text-[13px] font-medium text-white transition duration-ui hover:bg-brand-hover">Upload / Change</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => onChange(String(reader.result || ''));
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {value ? (
            <button type="button" className="rounded-[10px] border border-line bg-white px-3 py-2 text-[13px] text-muted transition duration-ui hover:text-ink" onClick={() => onChange('')}>
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
