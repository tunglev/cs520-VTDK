import { useState, type FormEvent } from 'react';
import { MOCK_USERS } from '../data/mockData';
import { supabase } from '../lib/supabaseClient';

interface AuthPageProps {
  onLoginSuccess: (user: any) => void;
}

export const AuthPage = ({ onLoginSuccess }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  
  // Base Sign Up/Login state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Onboarding state
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState('');

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Real Supabase login
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
      } else if (data.user) {
        onLoginSuccess(data.user);
      }
    } else {
      if (!isOnboarding) {
        if (!name || !email || !password) {
          setError('Please fill in all fields to sign up');
          return;
        }
        setIsOnboarding(true);
      } else {
        // Complete onboarding → real Supabase sign up
        if (!location) { setError('Location is required.'); return; }

        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: 'customer',
            },
          },
        });

        if (err) {
          setError(err.message);
        } else {
          setError('');
          // Check email — Supabase may require email confirmation
          setIsOnboarding(false);
          setError('Check your email to confirm your account, then log in.');
        }
      }
    }
  };


  if (isOnboarding) {
    return (
      <div className="flex-1 flex max-w-7xl mx-auto w-full items-center justify-center p-8 mt-12 mb-24">
        <div className="w-full max-w-2xl bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-4xl font-display uppercase tracking-tighter mb-2">Complete Profile</h2>
          <p className="font-mono text-xs uppercase opacity-60 mb-8">
            Tell us about yourself to get started on VTDK.
          </p>

          {error && (
            <div className="mb-4 p-4 border-2 border-vibrant-coral bg-[#FFF0ed] text-vibrant-coral font-mono text-xs uppercase">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-white border-2 border-black font-display uppercase text-sm shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 border-t-2 border-black/10" />
              <span className="font-mono text-[10px] uppercase opacity-40">or</span>
              <div className="flex-1 border-t-2 border-black/10" />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="font-display uppercase text-[10px] tracking-widest block">Location *</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-4 border-2 border-black bg-white focus:outline-none focus:border-vibrant-coral transition-colors font-mono text-sm"
                  placeholder="NEW YORK, US"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-display uppercase text-[10px] tracking-widest block">Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-4 border-2 border-black bg-white focus:outline-none focus:border-vibrant-coral transition-colors font-mono text-sm min-h-[100px] resize-none"
                placeholder="I am a passionate..."
              />
            </div>

            <div className="space-y-2">
              <label className="font-display uppercase text-[10px] tracking-widest block">Interests (comma separated)</label>
              <input 
                type="text" 
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className="w-full p-4 border-2 border-black bg-white focus:outline-none focus:border-vibrant-coral transition-colors font-mono text-sm"
                placeholder="APP DEVELOPMENT, DESIGN"
              />
            </div>

            <div className="pt-6 flex gap-4">
              <button
                type="button"
                onClick={() => { setError(''); setIsOnboarding(false); }}
                className="flex-1 py-4 bg-white text-black font-display uppercase border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                Back
              </button>
              <button type="submit" className="flex-1 py-4 bg-black text-white font-display uppercase border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                Complete Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex max-w-7xl mx-auto w-full items-center justify-center p-8 mt-12 mb-24">
      <div className="w-full max-w-md bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-4xl font-display uppercase tracking-tighter mb-2">
          {isLogin ? 'Welcome Back' : 'Join VTDK'}
        </h2>
        <p className="font-mono text-xs uppercase opacity-60 mb-8">
          {isLogin ? 'Enter your details to access your account' : 'Create an account to hire or work'}
        </p>

        {error && (
          <div className="mb-4 p-4 border-2 border-vibrant-coral bg-[#FFF0ed] text-vibrant-coral font-mono text-xs uppercase">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          if (isLogin) {
            handleSubmit(e);
          } else {
            if (!name || !email || !password) {
              setError('Please fill in all fields to sign up');
              return;
            }
            const exists = MOCK_USERS.some(u => u.email === email || u.username === email);
            if (exists) {
              setError('Email or username already in use.');
              return;
            }
            if (password.length < 6) {
              setError('Password must be at least 6 characters.');
              return;
            }
            setIsOnboarding(true);
          }
        }}>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white border-2 border-black font-display uppercase text-sm shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 border-t-2 border-black/10" />
            <span className="font-mono text-[10px] uppercase opacity-40">or</span>
            <div className="flex-1 border-t-2 border-black/10" />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="font-display uppercase text-[10px] tracking-widest block">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 border-2 border-black bg-white focus:outline-none focus:border-vibrant-coral transition-colors font-mono text-sm"
                placeholder="JOHN DOE"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="font-display uppercase text-[10px] tracking-widest block">Email or Username</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border-2 border-black bg-white focus:outline-none focus:border-vibrant-coral transition-colors font-mono text-sm"
              placeholder="HELLO@EXAMPLE.COM"
            />
          </div>
          <div className="space-y-2">
            <label className="font-display uppercase text-[10px] tracking-widest block">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border-2 border-black bg-white focus:outline-none focus:border-vibrant-coral transition-colors font-mono text-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <button className="w-full py-4 bg-vibrant-coral text-white font-display uppercase border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-dashed border-black/20 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="font-mono text-xs uppercase hover:text-vibrant-coral transition-colors underline decoration-2 underline-offset-4"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};