import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ToastViewport } from './components/common/Toast';
import { ConfirmDialog } from './components/modals/ConfirmDialog';
import { seedIfNeeded } from './services/mock/seed';

seedIfNeeded();

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastViewport />
      <ConfirmDialog />
    </>
  );
}
