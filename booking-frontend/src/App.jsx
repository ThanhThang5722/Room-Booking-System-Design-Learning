import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './shared/components/Layout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import RoomListPage from './features/rooms/RoomListPage';
import BookingFormPage from './features/bookings/BookingFormPage';
import BookingListPage from './features/bookings/BookingListPage';
import BookingConfirmationPage from './features/bookings/BookingConfirmationPage';
import TopLoadingBar from './shared/components/TopLoadingBar';
import ScrollToTop from './shared/components/ScrollToTop';
import ErrorBoundary from './shared/components/ErrorBoundary';
import NotFoundPage from './shared/components/NotFoundPage';
import { useAuth } from './features/auth/useAuth';
import { useTheme } from './shared/theme/useTheme';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}

export default function App() {
  const { isDark } = useTheme();

  return (
    <ErrorBoundary>
      <TopLoadingBar />
      <ScrollToTop />

      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/rooms" replace />} />
          <Route path="/rooms" element={<RoomListPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/book/:roomId"
            element={<RequireAuth><BookingFormPage /></RequireAuth>}
          />
          <Route
            path="/bookings/:id/confirmation"
            element={<RequireAuth><BookingConfirmationPage /></RequireAuth>}
          />
          <Route
            path="/my-bookings"
            element={<RequireAuth><BookingListPage /></RequireAuth>}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.92rem',
            padding: '12px 16px',
            borderRadius: '10px',
            background: isDark ? '#111a2c' : '#1e293b',
            color: '#f1f5f9',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
            border: isDark ? '1px solid #1f2a44' : 'none',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#ecfdf5' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fef2f2' },
            duration: 4500,
          },
        }}
      />
    </ErrorBoundary>
  );
}
