import SideNavBar from './SideNavBar';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';
import './layout.css';

export default function DashboardLayout({ children, role = 'customer' }) {
  return (
    <div className="dashboard-layout">
      {/* Desktop Sidebar */}
      <div className="dashboard-desktop-nav">
        <SideNavBar role={role} />
      </div>

      <div className="dashboard-main-content">
        {/* Mobile Top Header */}
        <div className="dashboard-mobile-nav-top">
          <TopAppBar />
        </div>

        <main className="dashboard-content fade-in">
          {children}
        </main>

        {/* Mobile Bottom Bar */}
        <div className="dashboard-mobile-nav-bottom">
          <BottomNavBar role={role} />
        </div>
      </div>
    </div>
  );
}
