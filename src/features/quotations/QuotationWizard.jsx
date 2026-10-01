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
import { quotationService, customerService, projectService, companyService } from '../../services/mock';
import { validateQuotation, isValidMobile } from '../../utils/validation';
import { toast, useUiStore } from '../../store/uiStore';
import { generateQuotationPdf } from '../../utils/pdf/generateQuotationPdf';
import { QuotationDocument } from '../../components/quotation/QuotationDocument';
import { uid } from '../../utils/formatting';

export function QuotationWizard({ mode = 'create' }) {
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
  const [company, setCompany] = useState(null);
  const [leave, setLeave] = useState(null);
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

  const persistCustomerProject = async (status) => {
    let customerId = quotation.customer?.id;
    if (!customerId && quotation.customer?.name) {
      const created = await customerService.create({
        name: quotation.customer.name,
        mobile: quotation.customer.mobile,
        email: quotation.customer.email,
        type: quotation.customer.type,
      });
      customerId = created.id;
    }
    let projectId = quotation.project?.id;
    if (!projectId && quotation.project?.name) {
      const created = await projectService.create({
        customerId,
        name: quotation.project.name,
        siteAddress: quotation.project.siteAddress,
        plotArea: quotation.project.plotArea,
        constructionArea: quotation.project.constructionArea,
        floors: quotation.project.floors,
        startDate: quotation.quotationDate,
      });
      projectId = created.id;
    }
    const payload = {
      ...quotation,
      status,
      customer: { ...quotation.customer, id: customerId },
      project: { ...quotation.project, id: projectId },
    };
    if (mode === 'edit' && quotation.id && !String(quotation.id).includes('pending')) {
      const existing = await quotationService.getById(quotation.id);
      if (existing) return quotationService.update(quotation.id, payload);
    }
    return quotationService.create({ ...payload, id: uid('q') });
  };

  const saveDraft = async () => {
    const saved = await persistCustomerProject('Draft');
    useQuotationStore.getState().loadQuotation(saved);
    toast('Draft updated successfully');
  };

  const saveQuotation = async () => {
    if (quotation.customer?.mobile && !isValidMobile(quotation.customer.mobile)) {
      toast('Enter a valid mobile number', 'error');
      return;
    }
    const errors = validateQuotation(quotation);
    if (errors.length) {
      toast(errors[0], 'error');
      return;
    }
    openConfirm({
      title: 'Save quotation',
      message: 'How should this quotation be saved?',
      confirmLabel: 'Save as Sent',
      onConfirm: async () => {
        const saved = await persistCustomerProject('Sent');
        clearDraft();
        toast('Quotation saved successfully');
        navigate(`/quotations/${saved.id}`);
      },
    });
  };

  const downloadPdf = async () => {
    const el = document.getElementById('quotation-preview');
    if (!el) {
      setPreview(true);
      setTimeout(() => downloadPdf(), 80);
      return;
    }
    await generateQuotationPdf(el, quotation.quotationNumber || 'DRAFT');
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
      <Modal open={preview} title="Quotation preview" onClose={() => setPreview(false)} className="max-w-4xl">
        <div id="quotation-print-root" className="max-h-[70vh] overflow-auto bg-surface p-4">
          <QuotationDocument quotation={quotation} company={company} />
        </div>
      </Modal>
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
