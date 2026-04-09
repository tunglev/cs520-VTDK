export const Footer = () => (
  <footer className="mt-40 border-t-4 border-black bg-white p-12">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="col-span-2">
        <div className="text-4xl font-display uppercase tracking-tighter mb-6">VTDK</div>
        <p className="font-mono text-sm uppercase max-w-md opacity-60">
          The world's first transparent freelancing platform. No hidden fees. No algorithmic bias. Just fair prices for great work.
        </p>
      </div>
      <div className="space-y-4">
        <div className="font-display uppercase text-xs tracking-widest">Platform</div>
        <ul className="font-mono text-xs uppercase space-y-2 opacity-60">
          <li><a href="#" className="hover:text-vibrant-coral">Browse Categories</a></li>
          <li><a href="#" className="hover:text-vibrant-coral">Price Index</a></li>
          <li><a href="#" className="hover:text-vibrant-coral">Market Reports</a></li>
        </ul>
      </div>
      <div className="space-y-4">
        <div className="font-display uppercase text-xs tracking-widest">Company</div>
        <ul className="font-mono text-xs uppercase space-y-2 opacity-60">
          <li><a href="#" className="hover:text-vibrant-coral">About Us</a></li>
          <li><a href="#" className="hover:text-vibrant-coral">Contact</a></li>
          <li><a href="#" className="hover:text-vibrant-coral">Privacy Policy</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-20 pt-8 border-t-2 border-black/10 flex justify-between items-center font-mono text-[10px] uppercase opacity-40">
      <div>© 2026 VTDK Freelance Inc.</div>
      <div className="flex gap-8">
        <a href="#">Twitter</a>
        <a href="#">LinkedIn</a>
        <a href="#">Instagram</a>
      </div>
    </div>
  </footer>
);
