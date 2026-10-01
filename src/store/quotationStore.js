import { create } from 'zustand';
import { storage } from '../utils/storage/localStorage';
import { STORAGE_KEYS } from '../constants';
import { calculateItemAmount, calculateArea, calculateQuotationTotals } from '../utils/calculations';
import { createEmptyQuotation } from '../mock/quotations';
import { companyService } from '../services/mock/companyService';

function persist(quotation, step) {
  storage.set(STORAGE_KEYS.wizardDraft, { quotation, step, savedAt: new Date().toISOString() });
}

function withItemAmount(item) {
  const quantity = item.area != null && item.length != null ? calculateArea(item.length, item.width) : Number(item.quantity) || 0;
  const rate = Number(item.rate) || 0;
  const nextQty = item.area != null && item.length != null ? quantity : Number(item.quantity) || 0;
  return {
    ...item,
    quantity: nextQty,
    area: item.length != null ? quantity : item.area,
    amount: calculateItemAmount(nextQty, rate),
  };
}

export const useQuotationStore = create((set, get) => ({
  quotation: createEmptyQuotation(),
  step: 1,
  dirty: false,
  hydrated: false,

  hydrateFromDraft() {
    const draft = storage.get(STORAGE_KEYS.wizardDraft, null);
    if (draft?.quotation) {
      set({ quotation: { ...draft.quotation, ...calculateQuotationTotals(draft.quotation) }, step: draft.step || 1, dirty: false, hydrated: true });
      return true;
    }
    set({ hydrated: true });
    return false;
  },

  async resetNew() {
    const company = await companyService.get();
    const quotation = createEmptyQuotation({ companyPrefix: company.quotationPrefix });
    quotation.gst = Number(company.defaultGst) || 0;
    quotation.discount = Number(company.defaultDiscount) || 0;
    set({ quotation, step: 1, dirty: false });
    persist(quotation, 1);
  },

  loadQuotation(quotation) {
    const next = { ...quotation, ...calculateQuotationTotals(quotation) };
    set({ quotation: next, step: 1, dirty: false });
    persist(next, 1);
  },

  setStep(step) {
    set({ step });
    persist(get().quotation, step);
  },

  patch(partial) {
    const quotation = { ...get().quotation, ...partial };
    const next = { ...quotation, ...calculateQuotationTotals(quotation) };
    set({ quotation: next, dirty: true });
    persist(next, get().step);
  },

  updateList(listKey, id, patch) {
    const list = (get().quotation[listKey] || []).map((item) =>
      item.id === id ? withItemAmount({ ...item, ...patch }) : item
    );
    get().patch({ [listKey]: list });
  },

  addListItem(listKey, item) {
    const row = withItemAmount(item);
    get().patch({ [listKey]: [...(get().quotation[listKey] || []), row] });
  },

  removeListItem(listKey, id) {
    get().patch({ [listKey]: (get().quotation[listKey] || []).filter((item) => item.id !== id) });
  },

  replaceList(listKey, items) {
    get().patch({ [listKey]: items.map(withItemAmount) });
  },

  clearDraft() {
    storage.remove(STORAGE_KEYS.wizardDraft);
    set({ dirty: false });
  },
}));
