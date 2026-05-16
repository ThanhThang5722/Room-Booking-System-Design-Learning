import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Hotel, LogIn, LogOut, BookMarked, Building2, UserPlus, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, useAuthStore } from '../../features/auth/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { initials } from '../lib/format';
import ThemeToggle from './ThemeToggle';

export default function Layout() {
  const { user, isAuthenticated } = useAuth();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const online = useOnlineStatus();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-icon"><Hotel size={18} /></span>
            <span>Booking</span>
          </Link>

          <nav className="nav">
            <NavLink to="/rooms">
              <Building2 size={16} /> Phòng
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/my-bookings">
                <BookMarked size={16} /> Bookings của tôi
              </NavLink>
            )}
          </nav>

          <div className="auth-section">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <div className="user-chip">
                  <div className="avatar">{initials(user?.fullName ?? '?')}</div>
                  <span>{user?.fullName}</span>
                  <span className="role">{user?.role}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Đăng xuất">
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  <LogIn size={16} /> Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  <UserPlus size={16} /> Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {!online && (
        <div className="offline-banner" role="alert">
          <WifiOff size={16} />
          Mất kết nối mạng. Một số thao tác có thể không hoạt động.
        </div>
      )}

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Hotel Booking · Built for System Design demo
      </footer>
    </div>
  );
}
