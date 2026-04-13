import { useState } from 'react';
import { MOCK_USERS } from '../data/mockData';

interface AuthPageProps {
  onLoginSuccess: (user: { name: string; email: string; role: string; balance?: number }) => void;
}

export const AuthPage = ({ onLoginSuccess }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = MOCK_USERS.find(
        u => (u.email === email || u.username === email) && u.password === password
      );

      if (user) {
        onLoginSuccess({
          name: user.name,
          email: user.email,
          role: user.role,
          balance: user.balance
        });
      } else {
        setError('Invalid username or password. Try "test" and "123456"');
      }
    } else {
      if (!name || !email || !password) {
        setError('Please fill in all fields to sign up');
        return;
      }

      // Check if user exists
      const exists = MOCK_USERS.some(u => u.email === email || u.username === email);
      if (exists) {
        setError('Email or username already in use.');
        return;
      }

      // Dummy signup (adds to mock data array in memory)
      const newUser = {
        username: email.split('@')[0],
        email: email,
        password: password,
        name: name,
        role: 'Client',
        balance: 0
      };
      
      MOCK_USERS.push(newUser);

      onLoginSuccess({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        balance: newUser.balance
      });
    }
  };

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

        <form className="space-y-6" onSubmit={handleSubmit}>
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