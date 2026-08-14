import Link from 'next/link';

export default function Home() {
  return (
    <div className="fade-in">
      <section className="hero">
        <h1>
          Appointments, <span>Simplified</span>
        </h1>
        <p>
          VestAuth offers seamless scheduling, real-time availability, and frictionless payments for modern businesses and independent professionals.
        </p>
        <div className="hero-btns">
          <Link href="/login" className="primary-btn animate-hover">
            Book a Service
          </Link>
          <Link href="/register" className="secondary-btn animate-hover">
            Get Started
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="feature-card animate-hover">
          <div className="feature-icon">⚡</div>
          <h3>Lightning Fast</h3>
          <p>Book your slots in under 30 seconds with our optimized scheduling flow and instant confirmations.</p>
        </div>
        <div className="feature-card animate-hover">
          <div className="feature-icon">🔒</div>
          <h3>Secure Payments</h3>
          <p>Powered by Stripe, offering enterprise-grade security for your credit cards and digital wallets.</p>
        </div>
        <div className="feature-card animate-hover">
          <div className="feature-icon">✨</div>
          <h3>Minimalist Design</h3>
          <p>A distraction-free interface that puts your services first, ensuring a premium customer experience.</p>
        </div>
      </section>
    </div>
  );
}
