import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <p className="text-sm font-medium text-faint">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-brand-navy">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The route does not exist in this application.</p>
      <Link to="/dashboard">
        <Button className="mt-6">Back to dashboard</Button>
      </Link>
    </div>
  );
}
