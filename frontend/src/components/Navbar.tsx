interface NavbarProps {
  onLoginClick: () => void;
  onHomeClick: () => void;
}

export const Navbar = ({ onLoginClick, onHomeClick }: NavbarProps) => (
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
    <button 
      onClick={onLoginClick}
      className="px-6 py-2 bg-shadow-grey text-white font-display uppercase text-sm border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
    >
      Login
    </button>
  </nav>
);
