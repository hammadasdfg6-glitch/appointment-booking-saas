import Link from 'next/link';
import '../checkout.css';

export default function CheckoutFailed() {
  return (
    <div className="checkout-container">
      <div className="checkout-card fade-in">
        <div className="checkout-icon failed">✕</div>
        <h1>Payment Failed</h1>
        <p>There was an issue processing your payment. Please try again.</p>
        <Link href="/book" className="checkout-btn animate-tap">
          Try Again
        </Link>
      </div>
    </div>
  );
}
