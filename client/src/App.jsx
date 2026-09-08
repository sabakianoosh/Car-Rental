import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ActiveRentalProvider } from './context/ActiveRentalContext';
import { RentProvider } from './context/RentContext';
import HomePage from './pages/HomePage';
import CarDetailsPage from './pages/CarDetailsPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import RentPurposePage from './pages/RentPurposePage';
import RentSummaryPage from './pages/RentSummaryPage';
import PaymentPage from './pages/PaymentPage';
import ConfirmationPage from './pages/ConfirmationPage';
import MyReservationsPage from './pages/MyReservationsPage';
import ActiveRentalPage from './pages/ActiveRentalPage';
import IncidentCreatePage from './pages/IncidentCreatePage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCarsPage from './pages/admin/AdminCarsPage';
import AdminCarEditPage from './pages/admin/AdminCarEditPage';
import AdminKycPage from './pages/admin/AdminKycPage';
import AdminBranchPage from './pages/admin/AdminBranchPage';
import AdminIncidentsPage from './pages/admin/AdminIncidentsPage';
import AdminIncidentDetailPage from './pages/admin/AdminIncidentDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ActiveRentalProvider>
          <RentProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cars/:id" element={<CarDetailsPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/rent/purpose" element={<RentPurposePage />} />
            <Route path="/rent/summary" element={<RentSummaryPage />} />
            <Route path="/rent/payment/:id" element={<PaymentPage />} />
            <Route path="/rent/confirmation/:id" element={<ConfirmationPage />} />
            <Route path="/my-reservations" element={<MyReservationsPage />} />
            <Route path="/rent/active" element={<ActiveRentalPage />} />
            <Route path="/incidents/new" element={<IncidentCreatePage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />

            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/cars" element={<AdminCarsPage />} />
            <Route path="/admin/cars/:id" element={<AdminCarEditPage />} />
            <Route path="/admin/kyc" element={<AdminKycPage />} />
            <Route path="/admin/branch" element={<AdminBranchPage />} />
            <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
            <Route path="/admin/incidents/:id" element={<AdminIncidentDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </RentProvider>
        </ActiveRentalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
