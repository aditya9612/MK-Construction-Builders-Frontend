export function calculateItemAmount(quantity, rate) {
  const qty = Number(quantity);
  const r = Number(rate);
  if (!Number.isFinite(qty) || !Number.isFinite(r) || qty < 0 || r < 0) return 0;
  return roundMoney(qty * r);
}

export function calculateArea(length, width) {
  const l = Number(length);
  const w = Number(width);
  if (!Number.isFinite(l) || !Number.isFinite(w) || l < 0 || w < 0) return 0;
  return Number((l * w).toFixed(2));
}

export function sumAmounts(items = []) {
  return roundMoney(items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
}

export function calculateConstructionTotal(items = []) {
  return sumAmounts(items);
}

export function calculateAdditionalWorkTotal(items = []) {
  return sumAmounts(items);
}

export function calculateElectricalTotal(items = []) {
  return sumAmounts(items);
}

export function calculatePlumbingTotal(items = []) {
  return sumAmounts(items);
}

export function calculateDoorTotal(items = []) {
  return sumAmounts(items);
}

export function calculateWindowTotal(items = []) {
  return sumAmounts(items);
}

export function calculateTileTotal(items = []) {
  return sumAmounts(items);
}

export function calculateGraniteTotal(items = []) {
  return sumAmounts(items);
}

export function calculatePaintingTotal(items = []) {
  return sumAmounts(items);
}

export function calculateSubtotal({
  constructionItems = [],
  additionalWorks = [],
  electricalItems = [],
  plumbingItems = [],
  doors = [],
  windows = [],
  tiles = [],
  granite = [],
  painting = [],
} = {}) {
  return roundMoney(
    calculateConstructionTotal(constructionItems) +
      calculateAdditionalWorkTotal(additionalWorks) +
      calculateElectricalTotal(electricalItems) +
      calculatePlumbingTotal(plumbingItems) +
      calculateDoorTotal(doors) +
      calculateWindowTotal(windows) +
      calculateTileTotal(tiles) +
      calculateGraniteTotal(granite) +
      calculatePaintingTotal(painting)
  );
}

export function calculateDiscount(subtotal, discountPercent) {
  const s = Number(subtotal) || 0;
  const p = Number(discountPercent) || 0;
  const clamped = Math.min(Math.max(p, 0), 100);
  return roundMoney(s * (clamped / 100));
}

export function calculateGST(taxableAmount, gstPercent) {
  const t = Number(taxableAmount) || 0;
  const p = Number(gstPercent) || 0;
  const clamped = Math.min(Math.max(p, 0), 100);
  return roundMoney(t * (clamped / 100));
}

export function calculateGrandTotal(taxableAmount, gstAmount) {
  return roundMoney((Number(taxableAmount) || 0) + (Number(gstAmount) || 0));
}

export function calculateQuotationTotals(quotation = {}) {
  const subtotal = calculateSubtotal(quotation);
  const discountAmount = calculateDiscount(subtotal, quotation.discount);
  const taxableAmount = roundMoney(subtotal - discountAmount);
  const gstAmount = calculateGST(taxableAmount, quotation.gst);
  const grandTotal = calculateGrandTotal(taxableAmount, gstAmount);
  return {
    constructionTotal: calculateConstructionTotal(quotation.constructionItems),
    additionalWorkTotal: calculateAdditionalWorkTotal(quotation.additionalWorks),
    electricalTotal: calculateElectricalTotal(quotation.electricalItems),
    plumbingTotal: calculatePlumbingTotal(quotation.plumbingItems),
    doorTotal: calculateDoorTotal(quotation.doors),
    windowTotal: calculateWindowTotal(quotation.windows),
    tileTotal: calculateTileTotal(quotation.tiles),
    graniteTotal: calculateGraniteTotal(quotation.granite),
    paintingTotal: calculatePaintingTotal(quotation.painting),
    doorsWindowsTotal: roundMoney(calculateDoorTotal(quotation.doors) + calculateWindowTotal(quotation.windows)),
    tilesGraniteTotal: roundMoney(calculateTileTotal(quotation.tiles) + calculateGraniteTotal(quotation.granite)),
    subtotal,
    discountAmount,
    taxableAmount,
    gstAmount,
    grandTotal,
  };
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
