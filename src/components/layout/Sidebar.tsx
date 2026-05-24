import Link from 'next/link';
import { LayoutDashboard, Users, Clock, Hash, Disc3, Target, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Rosters', href: '/dashboard/rosters', icon: Users },
    { name: 'Group Generator', href: '/dashboard/tools/group-generator', icon: Users },
    { name: 'Student Picker', href: '/dashboard/tools/picker', icon: Target },
    { name: 'Timers', href: '/dashboard/tools/timer', icon: Clock },
    { name: 'Scoreboard', href: '/dashboard/tools/scoreboard', icon: Hash },
    { name: 'Spin Wheel', href: '/dashboard/tools/spin-wheel', icon: Disc3 },
    { name: 'Quiz Competition', href: '/dashboard/tools/quiz', icon: Target },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col shadow-2xl">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          ClassEngage
        </h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all duration-200 group"
            >
              <Icon className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span className="font-medium text-sm group-hover:text-white">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <Link href="/settings" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all duration-200 group">
          <Settings className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
          <span className="font-medium text-sm group-hover:text-white">Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
