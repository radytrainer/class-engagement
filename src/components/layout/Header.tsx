import { Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
      <div className="flex-1">
        {/* Placeholder for page title or search if needed */}
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-full border border-amber-200">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-bold">Free for all Trainers!</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
