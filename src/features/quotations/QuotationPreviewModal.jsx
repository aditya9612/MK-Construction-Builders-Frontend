import { useEffect, useState } from 'react';
import { Modal } from '../../components/modals/Modal';
import { Button } from '../../components/common/Button';
import { quotationService } from '../../services/api/quotationService';
import { QuotationDocument } from '../../components/quotation/QuotationDocument';
import { generateQuotationPdf } from '../../utils/pdf/generateQuotationPdf';
import { RefreshCw, Printer, Download, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/formatting';

export function QuotationPreviewModal({ open, onClose, quotation, quotationId }) {
  const [previewContent, setPreviewContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('document'); // 'document' | 'backend'

  const qId = quotationId || quotation?.id;
  const qNum = quotation?.quotation_number || quotation?.quotationNumber || `QUOT-${qId}`;

  const loadPreview = async () => {
    if (!qId) return;
    setLoading(true);
    setError('');
    try {
      const data = await quotationService.getPreview(qId);
      setPreviewContent(data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Backend preview endpoint returned an error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && qId) {
      loadPreview();
    }
  }, [open, qId]);

  if (!open) return null;

  const handlePrint = () => {
    const el = document.getElementById('preview-document-container');
    if (el) {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    const el = document.getElementById('preview-document-container');
    if (el) {
      await generateQuotationPdf(el, qNum);
    }
  };

  const isHtmlString = typeof previewContent === 'string' && (previewContent.includes('<html') || previewContent.includes('<!DOCTYPE') || previewContent.includes('<div'));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center justify-between w-full pr-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center border border-sky-100">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Quotation Preview</h3>
              <p className="text-xs text-slate-400 font-normal">
                Quotation No: <span className="font-mono font-semibold text-slate-700">{qNum}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('document')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeTab === 'document' ? 'bg-[#0284c7] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Document View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('backend')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeTab === 'backend' ? 'bg-[#0284c7] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              API Preview
            </button>
          </div>
        </div>
      }
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Actions bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            {loading ? (
              <span className="flex items-center gap-1.5 text-sky-600">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Loading preview...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synchronized</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handlePrint} className="h-8">
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>Print</span>
            </Button>
            <Button size="sm" variant="secondary" onClick={handleDownloadPdf} className="h-8">
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>

        {/* Content body */}
        <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          {activeTab === 'backend' ? (
            <div>
              {loading ? (
                <div className="py-16 text-center text-xs text-slate-400">Loading backend preview...</div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <p className="font-semibold">Backend Preview Info</p>
                  <p className="mt-1">{error}</p>
                </div>
              ) : isHtmlString ? (
                <iframe
                  title="Quotation Preview"
                  srcDoc={previewContent}
                  className="w-full min-h-[500px] border-0 rounded-lg bg-white"
                />
              ) : (
                <pre className="p-4 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                  {typeof previewContent === 'object'
                    ? JSON.stringify(previewContent, null, 2)
                    : String(previewContent || 'No raw preview content returned.')}
                </pre>
              )}
            </div>
          ) : (
            <div id="preview-document-container" className="bg-white rounded-lg shadow-xs p-2">
              <QuotationDocument quotation={quotation || previewContent} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
