"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Target, Clock, Disc3, LayoutGrid, Sparkles } from "lucide-react";

const navItems = [
  { name: "Tools", href: "/dashboard", icon: LayoutGrid },
  { name: "Roster", href: "/dashboard/rosters", icon: Users },
  { name: "Groups", href: "/dashboard/tools/group-generator", icon: Users },
  { name: "Picker", href: "/dashboard/tools/picker", icon: Target },
  { name: "Timer", href: "/dashboard/tools/timer", icon: Clock },
  { name: "Wheel", href: "/dashboard/tools/spin-wheel", icon: Disc3 },
];

const TopNav = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-amber-400/30">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
              PNC Classroom Tools
            </span>
          </Link>
          <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Free for all Trainers</span>
          </div>
        </div>

        <div className="relative">
          <nav className="-mb-px flex space-x-2 overflow-x-auto scrollbar-hide pb-px snap-x snap-mandatory scroll-smooth">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap snap-start active:scale-95 duration-100 ${
                    isActive
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
        </div>
      </div>
    </header>
  );
};

export default TopNav;
