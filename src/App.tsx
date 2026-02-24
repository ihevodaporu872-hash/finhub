import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/auth/LoginPage';
import { BddsPageWrapper } from './pages/BddsPageWrapper';
import { BdrPageWrapper } from './pages/BdrPageWrapper';
import { BblPageWrapper } from './pages/BblPageWrapper';
import { AdminUsersPageWrapper } from './pages/AdminUsersPageWrapper';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/bdds" element={<BddsPageWrapper />} />
              <Route path="/bdr" element={<BdrPageWrapper />} />
              <Route path="/bbl" element={<BblPageWrapper />} />
              <Route path="/admin/users" element={<AdminUsersPageWrapper />} />
              <Route path="/" element={<Navigate to="/bdds" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
