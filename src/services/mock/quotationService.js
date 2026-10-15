/**
 * Re-export the real quotationService to bridge any legacy imports
 * and ensure all parts of the application communicate with the live backend APIs.
 */
import { quotationService } from '../api/quotationService';

export { quotationService };
export default quotationService;
