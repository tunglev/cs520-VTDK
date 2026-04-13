interface UserProfileProps {
  user: { name: string; email: string; role: string; balance?: number };
  onLogout: () => void;
}

export const UserProfile = ({ user, onLogout }: UserProfileProps) => {
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
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="px-6 py-2 bg-white text-black font-display uppercase text-sm border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-4 border-black p-6 bg-rosy-copper text-white">
            <h2 className="font-display uppercase text-sm tracking-widest mb-4">Account Balance</h2>
            <div className="text-6xl font-display tracking-tighter">${user.balance || '0.00'}</div>
          </div>
          
          <div className="border-4 border-black p-6 bg-white">
            <h2 className="font-display uppercase text-sm tracking-widest mb-4">Current Projects</h2>
            <div className="font-mono text-sm uppercase opacity-50 py-8 text-center border-2 border-dashed border-black/20">
              No active projects
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
