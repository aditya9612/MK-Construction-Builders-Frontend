// All services now delegate to the real backend API.
// This file exists for backwards compatibility with legacy imports from 'services/mock'.
export { customerService } from '../api/customerService';
export { projectService } from '../api/projectService';
export { quotationService } from '../api/quotationService';
export { rateService } from '../api/rateService';
export { materialService } from '../api/materialService';
export { companyService } from '../api/companyService';
export { termsService } from '../api/termsService';

// Electrical / plumbing / doors / windows / tiles / granite / painting master services
// These are now proxied from the real API via masterServices.
export * from './masterServices';

