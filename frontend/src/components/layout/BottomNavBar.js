import Link from 'next/link';

export default function BottomNavBar({ role = 'customer' }) {
  const links = {
    admin: [
      { name: 'Dash', href: '/dashboard/admin' },
      { name: 'Stats', href: '/dashboard/admin/stats' },
      { name: 'Svcs', href: '/dashboard/admin/services' },
      { name: 'Book', href: '/dashboard/admin/bookings' },
    ],
    staff: [
      { name: 'Dash', href: '/dashboard/staff' },
      { name: 'Sched', href: '/dashboard/staff/schedule' },
      { name: 'Avail', href: '/dashboard/staff/availability' },
    ],
    customer: [
      { name: 'Dash', href: '/dashboard/customer' },
      { name: 'Book', href: '/book' },
    ]
  };

  const navLinks = links[role] || links.customer;

  return (
    <nav className="bottomnavbar">
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} className="bottomnav-link animate-tap">
          {link.name}
        </Link>
      ))}
    </nav>
  );
}
