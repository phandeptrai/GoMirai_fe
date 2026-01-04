import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import TemplateViewPage from '../pages/demo/TemplateViewPage';
import HomePage from '../pages/HomePage';
import ActivityPage from '../pages/ActivityPage';
import ActivityDetailScreen from '../components/ActivityDetailScreen/ActivityDetailScreen';
import NotificationPage from '../pages/NotificationPage';
import PaymentPage from '../pages/PaymentPage';
import ProfilePage from '../pages/ProfilePage';
import ProfileInfoPage from '../pages/ProfilePage/ProfileInfoPage';
import DriverRegistrationPage from '../pages/ProfilePage/DriverRegistrationPage';
import DriverModePage from '../pages/DriverModePage/DriverModePage';
import VehicleUpdatePage from '../pages/DriverModePage/VehicleUpdatePage';
import DriverActiveBookingScreen from '../components/DriverActiveBookingScreen/DriverActiveBookingScreen';
import VNPayResultPage from '../pages/VNPayResult/VNPayResultPage';



// Admin routes
import AdminDashboard from '../pages/admin/DashboardPage';
import AdminUsers from '../pages/admin/UsersPage';
import AdminDrivers from '../pages/admin/DriversPage';
import AdminBookings from '../pages/admin/BookingsPage';
import AdminPricing from '../pages/admin/PricingPage';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#009b77]">
        <div className="text-white text-lg">Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'CUSTOMER') {
      return <Navigate to="/home" replace />;
    } else if (user?.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#009b77]">
        <div className="text-white text-lg">Đang tải...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.role === 'DRIVER') {
      return <Navigate to="/driver" replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/template"
          element={
            <PublicRoute>
              <TemplateViewPage />
            </PublicRoute>
          }
        />
        <Route
          path="/home"
          element={<HomePage />}
        />
        <Route
          path="/activity"
          element={<ActivityPage />}
        />
        <Route
          path="/activity/:bookingId"
          element={<ActivityDetailScreen />}
        />
        <Route
          path="/driver/booking/:bookingId"
          element={
            <PrivateRoute allowedRoles={['DRIVER']}>
              <DriverActiveBookingScreen />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={<NotificationPage />}
        />
        <Route
          path="/payment"
          element={<PaymentPage />}
        />
        {/* VNPay Result Page - Public vì user được redirect từ VNPay */}
        <Route
          path="/payment/vnpay/result"
          element={<VNPayResultPage />}
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/info"
          element={
            <PrivateRoute>
              <ProfileInfoPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/driver-register"
          element={
            <PrivateRoute>
              <DriverRegistrationPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/driver"
          element={
            <PrivateRoute allowedRoles={['DRIVER']}>
              <DriverModePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/driver/vehicle"
          element={
            <PrivateRoute allowedRoles={['DRIVER']}>
              <VehicleUpdatePage />
            </PrivateRoute>
          }
        />



        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminUsers />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/drivers"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminDrivers />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminBookings />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/pricing"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminPricing />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
