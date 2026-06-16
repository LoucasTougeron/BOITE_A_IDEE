import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectFormPage from './pages/ProjectFormPage';
import ProjectsPage from './pages/ProjectsPage';
import SwipePage from './pages/SwipePage';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-[var(--text-muted)]">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Ambient background */}
      <div className="ambient-bg">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>
      <div className="grid-overlay" />

      <Navbar />
      <main className="relative z-10 flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/swipe" element={<SwipePage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
          <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppRoutes />
        </QueryClientProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
