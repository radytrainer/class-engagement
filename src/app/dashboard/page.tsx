"use client";

import { Users, Target, Clock, Disc3, X, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const tools = [
  {
    name: "Group Generator",
    description: "Split your class into random teams in one click.",
    emoji: "👥",
    icon: Users,
    href: "/dashboard/tools/group-generator",
    color: "from-blue-500 to-cyan-400",
  },
  {
    name: "Student Picker",
    description: "Randomly call on a student - fair, fun, and instant.",
    emoji: "🎯",
    icon: Target,
    href: "/dashboard/tools/picker",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Timers",
    description: "Countdown timer for activities, quizzes, or breaks.",
    emoji: "⏱️",
    icon: Clock,
    href: "/dashboard/tools/timer",
    color: "from-amber-400 to-orange-500",
  },
  {
    name: "Spin Wheel",
    description: "Spin to pick a topic, question, or student at random.",
    emoji: "🎡",
    icon: Disc3,
    href: "/dashboard/tools/spin-wheel",
    color: "from-rose-400 to-red-500",
  },
];

export default function DashboardPage() {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {!bannerDismissed && (
        <div className="relative bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 shadow-lg shadow-amber-400/20 text-white overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-6 right-24 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />

          <button
            onClick={() => setBannerDismissed(true)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-5">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-black">Quick Start - 3 easy steps</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "Add your students",
                desc: "Go to Roster and type your class list (or paste all names at once).",
                href: "/dashboard/rosters",
              },
              {
                step: "2",
                title: "Pick a tool",
                desc: "Choose one of the core tools below - Group Generator, Picker, Timer, or Wheel.",
                href: null,
              },
              {
                step: "3",
                title: "Start class!",
                desc: "Hit fullscreen mode to display on a projector. No login needed.",
                href: null,
              },
            ].map(({ step, title, desc, href }) => (
              <div key={step} className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex flex-col">
                <span className="text-3xl font-black opacity-60 mb-2">{step}</span>
                <p className="font-bold text-base mb-1">{title}</p>
                <p className="text-sm text-white/80 leading-snug flex-1">{desc}</p>
                {href && (
                  <Link href={href} className="mt-3 inline-flex items-center text-sm font-bold hover:underline">
                    Add students <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">🧰 Tools</h1>
        <p className="mt-2 text-lg text-slate-600">Choose a tool to get your class engaged.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link key={tool.name} href={tool.href} className="group block h-full">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform duration-300 text-2xl`}
              >
                {tool.emoji}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{tool.name}</h3>
              <p className="text-slate-500 flex-1 leading-relaxed">{tool.description}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                Open <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
