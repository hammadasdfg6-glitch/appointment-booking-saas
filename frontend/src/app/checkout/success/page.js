import Link from 'next/link';
import '../checkout.css';

export default function CheckoutSuccess() {
  return (
    <div className="checkout-container">
      <div className="checkout-card fade-in">
        <div className="checkout-icon success">✓</div>
        <h1>Payment Successful!</h1>
        <p>Your booking has been confirmed. A receipt has been sent to your email.</p>
        <Link href="/dashboard/customer" className="checkout-btn animate-tap">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
