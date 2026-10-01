import { z } from './schemaLite.js';

export { z };

export function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export function isValidMobile(mobile) {
  return /^[6-9]\d{9}$/.test(String(mobile || '').replace(/\s/g, ''));
}

export function validateQuantity(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 'Quantity cannot be negative.';
  return '';
}

export function validateRate(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 'Rate cannot be negative.';
  return '';
}

export function validatePercent(value, label = 'Value') {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) return `${label} must be between 0 and 100.`;
  return '';
}

export function validateQuotation(quotation) {
  const errors = [];
  if (!quotation?.customer?.id && !quotation?.customer?.name) {
    errors.push('Select or create a customer.');
  }
  if (!quotation?.project?.name) errors.push('Project name is required.');
  if (!quotation?.project?.siteAddress) errors.push('Site address is required.');
  const hasItems = [
    quotation?.constructionItems,
    quotation?.additionalWorks,
    quotation?.electricalItems,
    quotation?.plumbingItems,
    quotation?.doors,
    quotation?.windows,
    quotation?.tiles,
    quotation?.granite,
    quotation?.painting,
  ].some((list) => Array.isArray(list) && list.some((item) => Number(item.quantity) > 0 || Number(item.amount) > 0));
  if (!hasItems) errors.push('Add at least one quotation item.');
  const discount = Number(quotation?.discount ?? 0);
  const gst = Number(quotation?.gst ?? 0);
  if (discount < 0 || discount > 100) errors.push('Discount must be between 0 and 100.');
  if (gst < 0 || gst > 100) errors.push('GST must be between 0 and 100.');
  return errors;
}
