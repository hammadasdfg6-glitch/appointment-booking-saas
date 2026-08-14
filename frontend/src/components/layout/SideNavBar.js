import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function SideNavBar({ role = 'customer' }) {
  const router = useRouter();
  
  const links = {
    admin: [
      { name: 'Dashboard', href: '/dashboard/admin' },
      { name: 'Stats', href: '/dashboard/admin/stats' },
      { name: 'Services', href: '/dashboard/admin/services' },
      { name: 'Staff', href: '/dashboard/admin/staff' },
      { name: 'Bookings', href: '/dashboard/admin/bookings' },
    ],
    staff: [
      { name: 'Dashboard', href: '/dashboard/staff' },
      { name: 'Bookings', href: '/dashboard/staff/bookings' },
      { name: 'Availability', href: '/dashboard/staff/availability' },
    ],
    customer: [
      { name: 'Dashboard', href: '/dashboard/customer' },
      { name: 'Book Service', href: '/book' },
      { name: 'Account', href: '/dashboard/customer/account' },
    ]
  };

  const navLinks = links[role] || links.customer;

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    router.push('/');
  };

  return (
    <aside className="sidenav">
      <div className="sidenav-header">
        <h2>VestAuth</h2>
      </div>
      <nav className="sidenav-nav">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="sidenav-link animate-hover">
            {link.name}
          </Link>
        ))}
      </nav>
      <div className="sidenav-footer">
        <button onClick={handleLogout} className="sidenav-link" style={{ width: '100%', textAlign: 'left' }}>Logout</button>
      </div>
    </aside>
  );
}
