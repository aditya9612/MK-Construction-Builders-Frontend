import { apiClient } from './apiClient';
import { normalizeQuotation, parseSafeDecimal } from './quotationService';

export const dashboardService = {
  async getSummary() {
    const response = await apiClient.get('/api/v1/dashboard/summary');
    const raw = response.data?.data || response.data || {};

    return {
      totalQuotations: parseSafeDecimal(raw.total_quotations, 0),
      draftQuotations: parseSafeDecimal(raw.draft_quotations, 0),
      sentQuotations: parseSafeDecimal(raw.sent_quotations, 0),
      approvedQuotations: parseSafeDecimal(raw.approved_quotations, 0),
      rejectedQuotations: parseSafeDecimal(raw.rejected_quotations, 0),
      expiredQuotations: parseSafeDecimal(raw.expired_quotations, 0),
      totalQuotationValue: parseSafeDecimal(raw.total_quotation_value, 0),
      approvedQuotationValue: parseSafeDecimal(raw.approved_quotation_value, 0),
      monthlyQuotationValue: parseSafeDecimal(raw.monthly_quotation_value, 0),
      monthlyQuotationCount: parseSafeDecimal(raw.monthly_quotation_count, 0),
      recentQuotations: (Array.isArray(raw.recent_quotations) ? raw.recent_quotations : [])
        .map(normalizeQuotation)
        .filter(Boolean),
      statusDistribution: Array.isArray(raw.quotation_status_distribution)
        ? raw.quotation_status_distribution
        : [],
      customerWiseQuotationValue: Array.isArray(raw.customer_wise_quotation_value)
        ? raw.customer_wise_quotation_value
        : [],
    };
  },
};

export default dashboardService;