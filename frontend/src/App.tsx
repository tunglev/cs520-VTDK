import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/Home';
import { AuthPage } from './pages/Auth';
import { FreelancerProfile } from './pages/FreelancerProfile';
import { UserProfile } from './pages/UserProfile';
import { FreelancerDashboard } from './pages/FreelancerDashboard';
import { TransactionsPage } from './pages/TransactionsPage';
import { HowItWorksPage } from './pages/HowItWorks';
import { FindTalentPage } from './pages/FindTalent';
import { PricingPage } from './pages/Pricing';
import { supabase } from './lib/supabaseClient';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import { Spinner } from './components/Spinner';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useInactivityLogout();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(mapSupabaseUser(session.user));
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        if (event === 'SIGNED_IN' && window.location.pathname === '/auth') navigate('/');
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (authUser: any) => {
    setUser(mapSupabaseUser(authUser));
    navigate('/');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleRoleChange = (role: string, updates?: Record<string, unknown>) => {
    setUser(prev => prev ? { ...prev, role, ...(updates ?? {}) } : prev);
  };

  const handleSwitchToClient = async () => {
    if (!user?.id) return;

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        role: 'customer',
        freelancer_enrolled: Boolean(user.freelancerEnrolled),
        hourly_rate: user.hourlyRate ?? null,
        skills: user.skills ?? [],
      },
    });

    if (authError) {
      console.error(authError);
      return;
    }

    const { error: dbError } = await supabase
      .from('users')
      .update({ role: 'customer' })
      .eq('id', user.id);

    if (dbError) {
      console.error(dbError);
      return;
    }

    handleRoleChange('customer', { role: 'customer' });
    navigate('/profile');
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
            authLoading ? <Spinner /> : user?.role === 'freelancer'
              ? (
                <FreelancerDashboard
                  user={user}
                  onLogout={handleLogout}
                  onSwitchToClient={handleSwitchToClient}
                />
              )
              : <Navigate to="/" />
          }
        />
        <Route
          path="/profile"
          element={
            authLoading ? <Spinner /> : user
              ? (
                <UserProfile
                  user={user}
                  onLogout={handleLogout}
                  onGoToDashboard={() => navigate('/dashboard')}
                  onRoleChange={handleRoleChange}
                  onViewTransactions={() => navigate('/transactions')}
                />
              )
              : <Navigate to="/auth" />
          }
        />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/find-talent" element={<FindTalentPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route
          path="/transactions"
          element={
            authLoading ? <Spinner /> : user
              ? (
                <TransactionsPage
                  user={user}
                  onBack={() => navigate('/profile')}
                />
              )
              : <Navigate to="/auth" />
          }
        />
      </Routes>

      <Footer />
    </div>
  );
}

function mapSupabaseUser(authUser: any) {
  const rawSkills = authUser.user_metadata?.skills;
  const normalizedSkills = Array.isArray(rawSkills)
    ? rawSkills
    : typeof rawSkills === 'string'
      ? rawSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

  return {
    id: authUser.id,
    username: authUser.email?.split('@')[0] ?? '',
    email: authUser.email ?? '',
    name: authUser.user_metadata?.full_name
      ?? authUser.user_metadata?.name
      ?? authUser.email?.split('@')[0]
      ?? 'User',
    role: (authUser.user_metadata?.role as string) ?? 'Client',
    freelancerEnrolled: Boolean(authUser.user_metadata?.freelancer_enrolled),
    hourlyRate: authUser.user_metadata?.hourly_rate ?? authUser.user_metadata?.hourlyRate ?? null,
    skills: normalizedSkills,
    balance: 0,
  };
}
