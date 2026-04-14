import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/Home';
import { AuthPage } from './pages/Auth';
import { FreelancerProfile } from './pages/FreelancerProfile';
import { UserProfile } from './pages/UserProfile';
import { FreelancerDashboard } from './pages/FreelancerDashboard';
import { LISTINGS } from './data/mockData';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'auth' | 'profile' | 'dashboard'>('home');
  const [selectedListing, setSelectedListing] = useState<typeof LISTINGS[0] | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    // Pick up existing session (e.g. after Google OAuth redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(mapSupabaseUser(session.user));
    });

    // Listen for login / logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        setCurrentPage('home');
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setCurrentPage('home');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-vibrant-coral selection:text-white">
      <Navbar
        user={user}
        onLoginClick={() => setCurrentPage('auth')}
        onHomeClick={() => {
          setCurrentPage('home');
          setSelectedListing(null);
        }}
        onProfileClick={() => {
          // Freelancers go to dashboard, customers go to profile
          if (user?.role === 'freelancer') {
            setCurrentPage('dashboard');
          } else {
            setCurrentPage('profile');
          }
          setSelectedListing(null);
        }}
      />

      {currentPage === 'auth' ? (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      ) : currentPage === 'dashboard' && user ? (
        <FreelancerDashboard user={user} onLogout={handleLogout} />
      ) : currentPage === 'profile' && user ? (
        <UserProfile user={user} onLogout={handleLogout} />
      ) : selectedListing ? (
        <FreelancerProfile
          listing={selectedListing}
          onBack={() => setSelectedListing(null)}
        />
      ) : (
        <HomePage onSelectListing={setSelectedListing} />
      )}

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