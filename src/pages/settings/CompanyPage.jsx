import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/cards/Card';
import { Input, Textarea } from '../../components/forms/Fields';
import { FileUpload } from '../../components/forms/FileUpload';
import { Button } from '../../components/common/Button';
import { companyService } from '../../services/mock';
import { toast } from '../../store/uiStore';
import {
  Building2,
  FileSpreadsheet,
  Landmark,
  PenTool,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function CompanyPage() {
  const [form, setForm] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    companyService.get().then(setForm);
  }, []);

  if (!form) return null;

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target?.value ?? e });

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await companyService.update(form);
      toast('Company settings saved successfully!', 'success');
    } catch {
      toast('Failed to save company settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Company Information', icon: Building2 },
    { id: 'quotation', label: 'Quotation Defaults', icon: FileSpreadsheet },
    { id: 'banking', label: 'Banking Details', icon: Landmark },
    { id: 'signatory', label: 'Authorized Signatory', icon: PenTool },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="System"
          title="Company Settings"
          description="Configure company profile, quotation defaults, bank details, and branding for PDFs and print."
        />
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium px-5 self-start sm:self-auto shrink-0"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-[#0284c7] text-white shadow-sm shadow-sky-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="grid gap-6 lg:grid-cols-12 animate-fade-in">
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-6">
              <h3 className="mb-4 text-[16px] font-semibold tracking-tight text-brand-navy flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0284c7]" />
                Company Identity & Contact
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Company Name"
                    value={form.name}
                    onChange={set('name')}
                    placeholder="e.g. MK CONSTRUCTION & BUILDERS"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Tagline / Slogan"
                    value={form.tagline}
                    onChange={set('tagline')}
                    placeholder="e.g. Residential & Commercial Construction"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Textarea
                    label="Official Registered Address"
                    value={form.address}
                    onChange={set('address')}
                    rows={3}
                  />
                </div>
                <Input
                  label="Primary Mobile"
                  value={form.mobile}
                  onChange={set('mobile')}
                  placeholder="+91 9845012345"
                />
                <Input
                  label="Alternate Mobile"
                  value={form.altMobile}
                  onChange={set('altMobile')}
                  placeholder="+91 9900112233"
                />
                <Input
                  label="Official Email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="contact@mkconstruction.com"
                />
                <Input
                  label="GSTIN / Tax ID"
                  value={form.gstNumber}
                  onChange={set('gstNumber')}
                  placeholder="29AABCM1234F1Z5"
                />
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card className="p-6">
              <h3 className="mb-3 text-[16px] font-semibold tracking-tight text-brand-navy">
                Company Logo
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                This logo will appear on header exports, PDF estimates, and formal quotations.
              </p>
              <FileUpload
                label="Upload High-Resolution Logo"
                value={form.logoDataUrl}
                onChange={(v) => setForm({ ...form, logoDataUrl: v })}
              />
              <div className="mt-4 p-3 rounded-lg bg-sky-50 text-xs text-slate-600 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>Recommended format: PNG or SVG with transparent background, at least 300x120px.</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'quotation' && (
        <div className="animate-fade-in max-w-2xl">
          <Card className="p-6">
            <h3 className="mb-4 text-[16px] font-semibold tracking-tight text-brand-navy flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#0284c7]" />
              Quotation Defaults & Numbering
            </h3>
            <div className="space-y-4">
              <Input
                label="Quotation Number Prefix"
                value={form.quotationPrefix}
                onChange={set('quotationPrefix')}
                hint="Prefix used when generating sequential quote numbers (e.g. MKQ-2026-0001)"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Default GST %"
                  type="number"
                  value={form.defaultGst}
                  onChange={(e) =>
                    setForm({ ...form, defaultGst: Number(e.target.value) })
                  }
                  placeholder="18"
                />
                <Input
                  label="Default Discount %"
                  type="number"
                  value={form.defaultDiscount}
                  onChange={(e) =>
                    setForm({ ...form, defaultDiscount: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'banking' && (
        <div className="animate-fade-in max-w-2xl">
          <Card className="p-6">
            <h3 className="mb-4 text-[16px] font-semibold tracking-tight text-brand-navy flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#0284c7]" />
              Banking & Payment Information
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              These details are printed on quotation payment slips and bank transfer instructions.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Bank Name"
                  value={form.bankName}
                  onChange={set('bankName')}
                  placeholder="e.g. HDFC Bank"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Account Holder Name"
                  value={form.accountName}
                  onChange={set('accountName')}
                  placeholder="MK Construction & Builders"
                />
              </div>
              <Input
                label="Account Number"
                value={form.accountNumber}
                onChange={set('accountNumber')}
                placeholder="50100123456789"
              />
              <Input
                label="IFSC Code"
                value={form.ifsc}
                onChange={set('ifsc')}
                placeholder="HDFC0001234"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Bank Branch"
                  value={form.branch}
                  onChange={set('branch')}
                  placeholder="Jayanagar, Bengaluru"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'signatory' && (
        <div className="animate-fade-in max-w-2xl">
          <Card className="p-6">
            <h3 className="mb-4 text-[16px] font-semibold tracking-tight text-brand-navy flex items-center gap-2">
              <PenTool className="w-4 h-4 text-[#0284c7]" />
              Authorized Signatory
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Person authorized to sign and approve official quotations, terms, and contracts.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Signatory Name"
                value={form.signatureName}
                onChange={set('signatureName')}
                placeholder="e.g. M. Kumar"
              />
              <Input
                label="Signatory Title / Designation"
                value={form.signatureTitle}
                onChange={set('signatureTitle')}
                placeholder="e.g. Proprietor / Managing Director"
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
