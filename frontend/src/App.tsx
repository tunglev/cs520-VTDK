import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/Home';
import { AuthPage } from './pages/Auth';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'auth'>('home');

  return (
    <div className="min-h-screen flex flex-col selection:bg-vibrant-coral selection:text-white">
      <Navbar onLoginClick={() => setCurrentPage('auth')} onHomeClick={() => setCurrentPage('home')} />

      {currentPage === 'auth' ? (
        <AuthPage />
      ) : (
        <HomePage />
      )}

      <Footer />
    </div>
  );
}
