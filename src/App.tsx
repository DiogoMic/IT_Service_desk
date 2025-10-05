import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { AuthForm } from './components/AuthForm';
import { NewUserDashboard } from './components/NewUserDashboard';
import { NewITDashboard } from './components/NewITDashboard';

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mb-4 animate-pulse">
            <span className="text-3xl">🎫</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthForm />;
  }

  return profile.role === 'it_team' ? <NewITDashboard /> : <NewUserDashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
