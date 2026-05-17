import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  user?: any | null;
}

export const Navbar = ({ user }: NavbarProps) => {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center px-8 py-6 border-b-4 border-black bg-white">
      <Link
        to="/"
        className="text-3xl font-display uppercase tracking-tighter flex items-center gap-2"
      >
        <div className="w-8 h-8 bg-vibrant-coral border-2 border-black rounded-sm" />
        Fairlance
      </Link>
      <div className="hidden md:flex gap-8 font-display uppercase text-sm tracking-widest">
        <Link to="/find-talent" className="hover:text-vibrant-coral transition-colors">Find Talent</Link>
        <Link to="/how-it-works" className="hover:text-vibrant-coral transition-colors">How it works</Link>
        <Link to="/pricing" className="hover:text-vibrant-coral transition-colors">Pricing</Link>
      </div>
      {user ? (
        <div className="flex items-center gap-4">
          <Link
            to="/transactions"
            className="hidden sm:block font-display uppercase text-sm tracking-widest hover:text-vibrant-coral transition-colors"
          >
            Transactions
          </Link>
          <Link
            to="/messages"
            className="hidden sm:block font-display uppercase text-sm tracking-widest hover:text-vibrant-coral transition-colors"
          >
            Messages
          </Link>
          <div
            onClick={() => navigate(user.role === 'freelancer' ? '/dashboard' : '/profile')}
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
        </div>
      ) : (
        <Link
          to="/auth"
          className="px-6 py-2 bg-shadow-grey text-white font-display uppercase text-sm border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          Login
        </Link>
      )}
    </nav>
  );
};
