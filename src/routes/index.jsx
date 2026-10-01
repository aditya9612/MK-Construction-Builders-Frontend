import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { RequireSession } from './RequireSession';
import DashboardPage from '../pages/dashboard/DashboardPage';
import QuotationsPage from '../pages/quotations/QuotationsPage';
import NewQuotationPage from '../pages/quotations/NewQuotationPage';
import EditQuotationPage from '../pages/quotations/EditQuotationPage';
import QuotationDetailPage from '../pages/quotations/QuotationDetailPage';
import CustomersPage from '../pages/customers/CustomersPage';
import CustomerDetailPage from '../pages/customers/CustomerDetailPage';
import ProjectsPage from '../pages/projects/ProjectsPage';
import ProjectDetailPage from '../pages/projects/ProjectDetailPage';
import RatesPage from '../pages/masters/RatesPage';
import MaterialsPage from '../pages/masters/MaterialsPage';
import {
  ElectricalMasterPage,
  PlumbingMasterPage,
  DoorsWindowsMasterPage,
  TilesGraniteMasterPage,
  PaintingMasterPage,
} from '../pages/masters/OtherMastersPages';
import TermsPage from '../pages/settings/TermsPage';
import ReportsPage from '../pages/reports/ReportsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import UsersPage from '../pages/settings/UsersPage';
import HelpPage from '../pages/settings/HelpPage';
import LoginPage from '../pages/auth/LoginPage';
import NotFoundPage from '../pages/errors/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <RequireSession />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/quotations', element: <QuotationsPage /> },
          { path: '/quotations/new', element: <NewQuotationPage /> },
          { path: '/quotations/:id', element: <QuotationDetailPage /> },
          { path: '/quotations/:id/edit', element: <EditQuotationPage /> },
          { path: '/customers', element: <CustomersPage /> },
          { path: '/customers/:id', element: <CustomerDetailPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/:id', element: <ProjectDetailPage /> },
          { path: '/masters/rates', element: <RatesPage /> },
          { path: '/masters/materials', element: <MaterialsPage /> },
          { path: '/masters/electrical', element: <ElectricalMasterPage /> },
          { path: '/masters/plumbing', element: <PlumbingMasterPage /> },
          { path: '/masters/doors-windows', element: <DoorsWindowsMasterPage /> },
          { path: '/masters/tiles-granite', element: <TilesGraniteMasterPage /> },
          { path: '/masters/painting', element: <PaintingMasterPage /> },
          { path: '/terms', element: <TermsPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/help', element: <HelpPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
