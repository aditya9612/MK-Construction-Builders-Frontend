import CustomersPage from './CustomersPage';

/**
 * CustomerDetailPage is now unified into CustomersPage.
 * Visiting /customers/:id opens the unified single page with the customer's detail sheet open.
 */
export default function CustomerDetailPage() {
  return <CustomersPage />;
}
