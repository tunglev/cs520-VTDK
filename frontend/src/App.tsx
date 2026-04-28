import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/Home';
import { AuthPage } from './pages/Auth';
import { FreelancerProfile } from './pages/FreelancerProfile';
import { UserProfile } from './pages/UserProfile';
import { FreelancerDashboard } from './pages/FreelancerDashboard';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(mapSupabaseUser(session.user));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        navigate('/');
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    navigate('/');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-vibrant-coral selection:text-white">
      <Navbar user={user} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/freelancer/:id" element={<FreelancerProfile />} />
        <Route
          path="/dashboard"
          element={
            user?.role === 'freelancer'
              ? <FreelancerDashboard user={user} onLogout={handleLogout} />
              : <Navigate to="/" />
          }
        />
        <Route
          path="/profile"
          element={
            user
              ? <UserProfile user={user} onLogout={handleLogout} />
              : <Navigate to="/auth" />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Footer />
    </div>
  );
}

function mapSupabaseUser(authUser: any) {
  return {
    id: authUser.id,
    username: authUser.email?.split('@')[0] ?? '',
    email: authUser.email ?? '',
    name: authUser.user_metadata?.full_name
      ?? authUser.user_metadata?.name
      ?? authUser.email?.split('@')[0]
      ?? 'User',
    role: (authUser.user_metadata?.role as string) ?? 'Client',
    balance: 0,
  };
}
