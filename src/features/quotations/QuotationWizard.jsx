import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper } from '../../components/common/Stepper';
import { Button } from '../../components/common/Button';
import { QuotationSummary } from '../../components/quotation/QuotationSummary';
import { Modal } from '../../components/modals/Modal';
import { useQuotationStore } from '../../store/quotationStore';
import { StepCustomerProject } from './steps/StepCustomerProject';
import { StepConstruction } from './steps/StepConstruction';
import { StepAdditionalWorks } from './steps/StepAdditionalWorks';
import { StepMaterials } from './steps/StepMaterials';
import { StepTermsPreview } from './steps/StepTermsPreview';
import { quotationService, customerService, projectService, companyService } from '../../services/api';
import { validateQuotation, isValidMobile } from '../../utils/validation';
import { toast, useUiStore } from '../../store/uiStore';
import { generateQuotationPdf } from '../../utils/pdf/generateQuotationPdf';
import { QuotationDocument } from '../../components/quotation/QuotationDocument';
import { QuotationSummaryModal } from './QuotationSummaryModal';
import { QuotationPreviewModal } from './QuotationPreviewModal';
import { extractErrorMessage } from '../../services/api/authService';

export function QuotationWizard({ mode = 'create', quotationId = null }) {
  const navigate = useNavigate();
  const quotation = useQuotationStore((s) => s.quotation);
  const step = useQuotationStore((s) => s.step);
  const setStep = useQuotationStore((s) => s.setStep);
  const patch = useQuotationStore((s) => s.patch);
  const updateList = useQuotationStore((s) => s.updateList);
  const addListItem = useQuotationStore((s) => s.addListItem);
  const removeListItem = useQuotationStore((s) => s.removeListItem);
  const clearDraft = useQuotationStore((s) => s.clearDraft);
  const dirty = useQuotationStore((s) => s.dirty);

  const [preview, setPreview] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [company, setCompany] = useState(null);
  const [leave, setLeave] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const openConfirm = useUiStore((s) => s.openConfirm);

  useEffect(() => {
    companyService.get().then(setCompany);
  }, []);

  useEffect(() => {
    const onBefore = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, [dirty]);

  const persistCustomerProject = async (status = 'DRAFT') => {
    // 1. Ensure Customer ID
    let customerId = quotation.customer_id || quotation.customer?.id;
    if (!customerId && quotation.customer?.name) {
      const created = await customerService.create({
        name: quotation.customer.name,
        mobile: quotation.customer.mobile,
        email: quotation.customer.email,
        customer_type: quotation.customer.customer_type || quotation.customer.type || 'INDIVIDUAL',
      });
      customerId = created.id;
    }

    // 2. Ensure Project ID
    let projectId = quotation.project_id || quotation.project?.id;
    if (!projectId && (quotation.project?.project_name || quotation.project?.name)) {
      const created = await projectService.create({
        customer_id: customerId,
        project_name: quotation.project.project_name || quotation.project.name,
        site_address: quotation.project.site_address || quotation.project.siteAddress || 'Site Address',
        plot_area: quotation.project.plot_area ?? quotation.project.plotArea ?? 0,
        construction_area: quotation.project.construction_area ?? quotation.project.constructionArea ?? 2000,
        floor_type: quotation.project.floor_type || quotation.project.floors || 'G+1',
        number_of_floors: 2,
        start_date: quotation.quotation_date || quotation.quotationDate || new Date().toISOString().slice(0, 10),
      });
      projectId = created.id;
    }

    const payload = {
      ...quotation,
      status,
      customer_id: Number(customerId) || 0,
      project_id: Number(projectId) || 0,
      customer: { ...quotation.customer, id: customerId },
      project: { ...quotation.project, id: projectId },
    };

    const targetId = quotationId || quotation.id;
    const isEditMode = mode === 'edit' && targetId && !String(targetId).startsWith('q_') && !String(targetId).startsWith('id_') && Number(targetId) > 0;

    if (isEditMode) {
      return await quotationService.update(targetId, payload);
    } else {
      return await quotationService.create(payload);
    }
  };

  const saveDraft = async () => {
    setSubmitting(true);
    try {
      const saved = await persistCustomerProject('DRAFT');
      useQuotationStore.getState().loadQuotation(saved);
      toast('Draft saved to server successfully', 'success');
    } catch (err) {
      toast(extractErrorMessage(err, 'Failed to save draft'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const saveQuotation = async () => {
    if (quotation.customer?.mobile && !isValidMobile(quotation.customer.mobile)) {
      toast('Enter a valid 10-digit mobile number', 'error');
      return;
    }

    const errors = validateQuotation(quotation);
    if (errors.length) {
      toast(errors[0], 'error');
      return;
    }

    openConfirm({
      title: 'Save Quotation',
      message: 'Choose quotation status:',
      confirmLabel: 'Save & Submit as Sent',
      cancelLabel: 'Save as Draft',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          const saved = await persistCustomerProject('SENT');
          clearDraft();
          toast('Quotation created & submitted successfully!', 'success');
          navigate(`/quotations/${saved.id}`);
        } catch (err) {
          toast(extractErrorMessage(err, 'Failed to save quotation'), 'error');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const downloadPdf = async () => {
    const el = document.getElementById('quotation-preview');
    if (!el) {
      setPreview(true);
      setTimeout(() => downloadPdf(), 100);
      return;
    }
    await generateQuotationPdf(el, quotation.quotation_number || quotation.quotationNumber || 'QUOTATION');
  };

  const printDoc = () => {
    setPreview(true);
    setTimeout(() => window.print(), 150);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,30%)]">
      <div>
        <Stepper current={step} maxReachable={5} onSelect={setStep} />
        <div className="mt-6">
          {step === 1 && <StepCustomerProject quotation={quotation} onPatch={patch} />}
          {step === 2 && (
            <StepConstruction quotation={quotation} updateList={updateList} addListItem={addListItem} removeListItem={removeListItem} />
          )}
          {step === 3 && (
            <StepAdditionalWorks quotation={quotation} updateList={updateList} addListItem={addListItem} removeListItem={removeListItem} />
          )}
          {step === 4 && <StepMaterials quotation={quotation} onPatch={patch} />}
          {step === 5 && <StepTermsPreview quotation={quotation} onPatch={patch} />}
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-2 no-print">
          <Button variant="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          <Button disabled={step === 5} onClick={() => setStep(step + 1)}>
            Continue
          </Button>
        </div>
      </div>

      <div className="xl:block no-print">
        <QuotationSummary
          quotation={quotation}
          onChange={patch}
          onPreview={() => setPreview(true)}
          onDraft={saveDraft}
          onSave={saveQuotation}
          onPdf={downloadPdf}
          onPrint={printDoc}
        />
      </div>

      {/* Live Preview Modal */}
      <Modal open={preview} title="Quotation preview" onClose={() => setPreview(false)} className="max-w-4xl">
        <div id="quotation-print-root" className="max-h-[70vh] overflow-auto bg-surface p-4">
          <QuotationDocument quotation={quotation} company={company} />
        </div>
      </Modal>

      {/* Unsaved changes dialog */}
      <Modal
        open={!!leave}
        title="Unsaved changes"
        onClose={() => setLeave(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLeave(null)}>Stay</Button>
            <Button onClick={() => navigate(leave)}>Leave</Button>
          </>
        }
      >
        <p className="text-sm text-muted">You have unsaved quotation changes. Save a draft before leaving if you want to keep them.</p>
      </Modal>
    </div>
  );
}
