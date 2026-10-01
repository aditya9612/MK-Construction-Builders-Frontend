import { Eye, Pencil, Copy, Printer, Download, Trash2, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { quotationService, companyService } from '../../services/mock';
import { toast, useUiStore } from '../../store/uiStore';
import { generateQuotationPdf } from '../../utils/pdf/generateQuotationPdf';
import { useState } from 'react';
import { Modal } from '../../components/modals/Modal';
import { QuotationDocument } from '../../components/quotation/QuotationDocument';

export function QuotationRowActions({ row, onChanged }) {
  const navigate = useNavigate();
  const openConfirm = useUiStore((s) => s.openConfirm);
  const [preview, setPreview] = useState(false);
  const [company, setCompany] = useState(null);
  const [open, setOpen] = useState(false);

  const duplicate = async () => {
    const copy = await quotationService.duplicate(row.id);
    toast('Quotation duplicated successfully');
    onChanged?.();
    navigate(`/quotations/${copy.id}/edit`);
  };

  const remove = () => {
    openConfirm({
      title: 'Delete quotation',
      message: 'Are you sure you want to delete this quotation?',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        await quotationService.delete(row.id);
        toast('Quotation deleted');
        onChanged?.();
      },
    });
  };

  const download = async () => {
    const companyData = company || (await companyService.get());
    setCompany(companyData);
    setPreview(true);
    setTimeout(async () => {
      const el = document.getElementById(`pdf-${row.id}`);
      if (el) await generateQuotationPdf(el, row.quotationNumber);
    }, 80);
  };

  const printRow = async () => {
    const companyData = company || (await companyService.get());
    setCompany(companyData);
    setPreview(true);
    setTimeout(() => window.print(), 150);
  };

  return (
    <div className="relative flex items-center justify-end gap-1">
      <button type="button" className="rounded-md p-1.5 text-muted transition duration-ui hover:bg-surface hover:text-ink" onClick={() => navigate(`/quotations/${row.id}`)} aria-label="View" title="View">
        <Eye className="h-4 w-4" />
      </button>
      <button type="button" className="rounded-md p-1.5 text-muted transition duration-ui hover:bg-surface hover:text-ink" onClick={() => setOpen((v) => !v)} aria-label="More actions" title="More">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-line bg-white p-1 shadow-pop">
          <MenuItem icon={Pencil} label="Edit" onClick={() => navigate(`/quotations/${row.id}/edit`)} />
          <MenuItem icon={Copy} label="Duplicate" onClick={duplicate} />
          <MenuItem icon={Printer} label="Print" onClick={printRow} />
          <MenuItem icon={Download} label="Download" onClick={download} />
          <MenuItem icon={Trash2} label="Delete" onClick={remove} danger />
        </div>
      ) : null}
      <Modal open={preview} title={row.quotationNumber} onClose={() => setPreview(false)} className="max-w-4xl">
        <div id="quotation-print-root" className="max-h-[70vh] overflow-auto bg-surface p-4">
          <div id={`pdf-${row.id}`}>
            <QuotationDocument quotation={row} company={company} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] ${danger ? 'text-danger hover:bg-[#FDF4F4]' : 'text-ink hover:bg-surface'}`}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
