import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/cards/Card';
import { Input, Textarea } from '../../components/forms/Fields';
import { FileUpload } from '../../components/forms/FileUpload';
import { Button } from '../../components/common/Button';
import { companyService } from '../../services/mock';
import { toast } from '../../store/uiStore';

export default function SettingsPage() {
  const [form, setForm] = useState(null);

  useEffect(() => { companyService.get().then(setForm); }, []);
  if (!form) return null;
  const set = (key) => (e) => setForm({ ...form, [key]: e.target?.value ?? e });

  return (
    <div>
      <PageHeader eyebrow="System" title="Company settings" description="These details appear on quotation preview, print and PDF." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-[16px] font-semibold tracking-tight text-brand-navy">Company information</h3>
          <div className="grid gap-3">
            <Input label="Company Name" value={form.name} onChange={set('name')} />
            <Input label="Tagline" value={form.tagline} onChange={set('tagline')} />
            <Textarea label="Address" value={form.address} onChange={set('address')} />
            <Input label="Mobile" value={form.mobile} onChange={set('mobile')} />
            <Input label="Alternate mobile" value={form.altMobile} onChange={set('altMobile')} />
            <Input label="Email" value={form.email} onChange={set('email')} />
            <Input label="GST Number" value={form.gstNumber} onChange={set('gstNumber')} />
            <FileUpload label="Current company logo" value={form.logoDataUrl} onChange={(v) => setForm({ ...form, logoDataUrl: v })} />
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 text-[16px] font-semibold tracking-tight text-brand-navy">Quotation defaults</h3>
          <div className="grid gap-3">
            <Input label="Quotation Prefix" value={form.quotationPrefix} onChange={set('quotationPrefix')} />
            <Input label="Default GST %" type="number" value={form.defaultGst} onChange={(e) => setForm({ ...form, defaultGst: Number(e.target.value) })} />
            <Input label="Default Discount %" type="number" value={form.defaultDiscount} onChange={(e) => setForm({ ...form, defaultDiscount: Number(e.target.value) })} />
          </div>
          <h3 className="mb-4 mt-6 text-[16px] font-semibold tracking-tight text-brand-navy">Bank information</h3>
          <div className="grid gap-3">
            <Input label="Bank Name" value={form.bankName} onChange={set('bankName')} />
            <Input label="Account Name" value={form.accountName} onChange={set('accountName')} />
            <Input label="Account Number" value={form.accountNumber} onChange={set('accountNumber')} />
            <Input label="IFSC" value={form.ifsc} onChange={set('ifsc')} />
            <Input label="Branch" value={form.branch} onChange={set('branch')} />
          </div>
          <h3 className="mb-4 mt-6 text-[16px] font-semibold tracking-tight text-brand-navy">Signature</h3>
          <Input label="Signatory name" value={form.signatureName} onChange={set('signatureName')} />
          <div className="mt-3">
            <Input label="Title" value={form.signatureTitle} onChange={set('signatureTitle')} />
          </div>
        </Card>
      </div>
      <Button className="mt-4" onClick={async () => { await companyService.update(form); toast('Company settings saved'); }}>Save settings</Button>
    </div>
  );
}
