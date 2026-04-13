interface NavbarProps {
  user?: { name: string; email: string; role: string; balance?: number } | null;
  onLoginClick: () => void;
  onHomeClick: () => void;
  onProfileClick?: () => void;
}

export const Navbar = ({ user, onLoginClick, onHomeClick, onProfileClick }: NavbarProps) => (
  <nav className="flex justify-between items-center px-8 py-6 border-b-4 border-black bg-white">
    <div 
      className="text-3xl font-display uppercase tracking-tighter flex items-center gap-2 cursor-pointer"
      onClick={onHomeClick}
    >
      <div className="w-8 h-8 bg-vibrant-coral border-2 border-black rounded-sm" />
      VTDK
    </div>
    <div className="hidden md:flex gap-8 font-display uppercase text-sm tracking-widest">
      <a href="#" className="hover:text-vibrant-coral transition-colors">Find Talent</a>
      <a href="#" className="hover:text-vibrant-coral transition-colors">How it works</a>
      <a href="#" className="hover:text-vibrant-coral transition-colors">Pricing</a>
    </div>
    {user ? (
      <div 
        onClick={onProfileClick}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="text-right hidden sm:block">
          <div className="font-display uppercase text-sm font-bold group-hover:text-vibrant-coral transition-colors leading-none">{user.name}</div>
          <div className="text-[10px] font-mono uppercase opacity-60 mt-1.5">{user.role}</div>
        </div>
        <div className="w-10 h-10 bg-shadow-grey text-white font-display text-xl uppercase border-2 border-black shadow-brutal-sm group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all flex items-center justify-center relative">
          {user.name.charAt(0)}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-vibrant-coral border-2 border-black rounded-sm" />
        </div>
      </div>
    ) : (
      <button 
        onClick={onLoginClick}
        className="px-6 py-2 bg-shadow-grey text-white font-display uppercase text-sm border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
      >
        Login
      </button>
    )}
  </nav>
);
