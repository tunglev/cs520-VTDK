interface UserProfileProps {
  user: any;
  onLogout: () => void;
  onGoToDashboard: () => void;
  onRoleChange: (role: string) => void;
}

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const UserProfile = ({ user, onLogout, onGoToDashboard, onRoleChange }: UserProfileProps) => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [error, setError] = useState('');

  const isFreelancer = user.role?.toLowerCase() === 'freelancer';

  const handleEnroll = async () => {
    setEnrollLoading(true);
    setError('');
    
    // Update Auth meta data
    const { error: authError } = await supabase.auth.updateUser({
      data: { role: 'freelancer' }
    });

    if (authError) {
      setError(authError.message);
      setEnrollLoading(false);
      return;
    }

    // Update public.users table
    const { error: dbError } = await supabase
      .from('users')
      .update({ role: 'freelancer' })
      .eq('id', user.id);
      
    if (dbError) {
      setError(dbError.message);
      setEnrollLoading(false);
      return;
    }

    onRoleChange('freelancer');
    setEnrollLoading(false);
    onGoToDashboard();
  };

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-8 py-20">
      <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-start mb-12">
          <div className="flex gap-8 items-center">
            <div className="w-24 h-24 bg-vibrant-coral border-4 border-black flex items-center justify-center text-5xl font-display text-white">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-5xl font-display uppercase tracking-tighter mb-2">{user.name}</h1>
              <p className="font-mono text-sm uppercase opacity-70 mb-2">{user.email}</p>
              <div className="inline-block px-3 py-1 bg-shadow-grey text-white font-mono text-[10px] uppercase border-2 border-black">
                {user.role}
              </div>
              {user.location && (
                <div className="mt-2 font-mono text-xs uppercase">📍 {user.location}</div>
              )}
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="px-6 py-2 bg-white text-black font-display uppercase text-sm border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            Logout
          </button>
        </div>

        {user.bio && (
          <div className="mb-8 p-6 border-4 border-black bg-[#FFF0ed]">
            <h2 className="font-display uppercase text-sm tracking-widest mb-4">About Me</h2>
            <p className="font-serif text-sm opacity-80 leading-relaxed">{user.bio}</p>
          </div>
        )}

        {user.skills && user.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display uppercase text-sm tracking-widest mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill: string) => (
                <span key={skill} className="px-3 py-1 bg-white border-2 border-black font-mono text-[10px] uppercase">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-4 border-black p-6 bg-rosy-copper text-white flex flex-col justify-between">
            <h2 className="font-display uppercase text-sm tracking-widest mb-4">Account Balance</h2>
            <div className="text-6xl font-display tracking-tighter">${user.balance || '0.00'}</div>
          </div>
          
          <div className="border-4 border-black p-6 bg-white flex flex-col justify-between">
            <h2 className="font-display uppercase text-sm tracking-widest mb-4">
              {isFreelancer ? 'Hourly Rate' : 'Current Projects'}
            </h2>
            {isFreelancer ? (
              <div className="text-6xl font-display tracking-tighter text-vibrant-coral">${user.hourlyRate || '0'}<span className="text-xl text-black">/hr</span></div>
            ) : (
              <div className="font-mono text-sm uppercase opacity-50 py-8 text-center border-2 border-dashed border-black/20">
                No active projects
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 border-4 border-black p-6 bg-shadow-grey text-white">
          <h2 className="font-display uppercase text-lg tracking-widest mb-4">Freelancer Status</h2>
          {error && <p className="text-vibrant-coral font-mono text-sm mb-4">{error}</p>}
          {isFreelancer ? (
            <div className="flex justify-between items-center">
              <p className="font-mono uppercase text-sm opacity-80">You are enrolled as a freelancer.</p>
              <button 
                onClick={onGoToDashboard}
                className="px-6 py-3 bg-vibrant-coral text-white font-display uppercase border-2 border-black shadow-none hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-sm transition-all"
              >
                Go to my Freelancer Dashboard
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <p className="font-mono uppercase text-sm opacity-80">Looking to offer your services? Enroll as a freelancer today.</p>
              <button 
                onClick={handleEnroll}
                disabled={enrollLoading}
                className="px-6 py-3 bg-vibrant-coral text-white font-display uppercase border-2 border-black shadow-none hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-sm transition-all disabled:opacity-50"
              >
                {enrollLoading ? 'Enrolling...' : 'Enroll as Freelancer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
