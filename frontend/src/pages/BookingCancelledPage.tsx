import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function BookingCancelledPage() {
  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <Card padding="lg">
          <div className="text-center space-y-6 py-2">
            <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-h2 font-bold text-slate-900 dark:text-slate-100">
                Checkout Cancelled
              </h1>
              <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Your payment was not completed and the temporary slot hold has been released. No charges were made.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link to="/book">
                <Button variant="primary" size="lg" className="w-full" leftIcon={<RefreshCw className="w-4 h-4" />}>
                  Try Booking Again
                </Button>
              </Link>
              <Link to="/dashboard/customer">
                <Button variant="secondary" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
