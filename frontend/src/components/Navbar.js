"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <nav className={`navbar ${isScrolled ? 'shadow' : ''}`}>
      <Link href="/" className="nav-brand">
        VestAuth
      </Link>
      <div className="nav-links">
        <Link href="/" className={pathname === '/' ? 'nav-link active' : 'nav-link'}>Home</Link>
        <Link href="/book" className={pathname === '/book' ? 'nav-link active' : 'nav-link'}>Book Service</Link>
        <Link href="/login" className="nav-btn animate-tap">Sign In</Link>
      </div>
    </nav>
  );
}
