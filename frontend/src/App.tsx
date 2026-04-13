import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/Home';
import { AuthPage } from './pages/Auth';
import { FreelancerProfile } from './pages/FreelancerProfile';
import { UserProfile } from './pages/UserProfile';
import { LISTINGS } from './data/mockData';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'auth' | 'profile'>('home');
  const [selectedListing, setSelectedListing] = useState<typeof LISTINGS[0] | null>(null);
  const [user, setUser] = useState<any | null>(null);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setCurrentPage('home');
  };

  const handleLogout = () => {
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
          setCurrentPage('profile');
          setSelectedListing(null);
        }}
      />

      {currentPage === 'auth' ? (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
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