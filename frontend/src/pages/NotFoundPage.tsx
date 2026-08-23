import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-6">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-display font-extrabold text-slate-900 dark:text-slate-100">
        404
      </h1>
      <h2 className="text-h2 font-semibold text-slate-800 dark:text-slate-200 mt-2">
        Page Not Found
      </h2>
      <p className="text-body text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8">
        <Link to="/">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
