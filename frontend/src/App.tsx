import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/Home';
import { AuthPage } from './pages/Auth';
import { FreelancerProfile } from './pages/FreelancerProfile';
import { LISTINGS } from './data/mockData';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'auth'>('home');
  const [selectedListing, setSelectedListing] = useState<typeof LISTINGS[0] | null>(null);

  return (
    <div className="min-h-screen flex flex-col selection:bg-vibrant-coral selection:text-white">
      <Navbar
        onLoginClick={() => setCurrentPage('auth')}
        onHomeClick={() => {
          setCurrentPage('home');
          setSelectedListing(null);
        }}
      />

      {currentPage === 'auth' ? (
        <AuthPage />
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