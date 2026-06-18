import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ToastNotifications from './components/ToastNotifications';
import { AuthContext, useAuth, useAuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectFormPage from './pages/ProjectFormPage';
import ProjectsPage from './pages/ProjectsPage';
import RewardsPage from './pages/RewardsPage';
import SwipePage from './pages/SwipePage';
import DashboardPage from './pages/DashboardPage';
import TopProjectsPage from './pages/TopProjectsPage';

const queryClient = new QueryClient();

function LoadingFallback() {
  return <div className="p-8 text-center text-[var(--text-muted)]">Chargement...</div>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  if (!profile) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  if (profile) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="ambient-bg">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>
      <div className="grid-overlay" />

      {location.pathname !== '/login' && <Navbar />}
      <ToastNotifications />
      <main className="relative z-10 flex-1">
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/swipe" element={<ProtectedRoute><SwipePage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
          <Route path="/top-projects" element={<ProtectedRoute><TopProjectsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
          <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
          <Route path="/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const auth = useAuthProvider();
  
  return (
    <Router>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={auth}>
            <AppRoutes />
          </AuthContext.Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
