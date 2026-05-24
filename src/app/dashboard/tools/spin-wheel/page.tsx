"use client";

import { useState, useEffect, useRef } from "react";
import { Disc3, Plus, Trash2, Play, Users, FileText, Sparkles, Maximize, Minimize } from "lucide-react";
import { motion, useMotionValue, useMotionValueEvent, animate } from "framer-motion";
import { useClassStore } from "@/store/useClassStore";
import confetti from "canvas-confetti";

interface WheelOption {
  id: string;
  label: string;
  color: string;
}

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const DEFAULT_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"
];

const STORAGE_KEY = "classspark-spin-wheel-options";

export default function SpinWheelPage() {
  const { students } = useClassStore();
  const hasLoadedOptionsRef = useRef(false);
  const [options, setOptions] = useState<WheelOption[]>([
    { id: "1", label: "Choose the game", color: DEFAULT_COLORS[0] },
    { id: "2", label: "Candy!", color: DEFAULT_COLORS[1] },
    { id: "3", label: "No homework pass", color: DEFAULT_COLORS[2] },
    { id: "4", label: "Extra 5 mins recess", color: DEFAULT_COLORS[3] },
  ]);

  const [newLabel, setNewLabel] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [activeTab, setActiveTab] = useState<"rewards" | "roster" | "bulk">("rewards");
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<WheelOption | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOptions(parsed);
        }
      }
    } catch {}
    hasLoadedOptionsRef.current = true;
  }, []);

  // Save to localStorage when options change
  useEffect(() => {
    if (!hasLoadedOptionsRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {}
  }, [options]);

  // Sync state when exiting fullscreen via ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Framer Motion Value for smooth, exact rotation
  const rotation = useMotionValue(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSliceRef = useRef<number>(-1);

  const playTickSound = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ??
          (window as WindowWithWebkitAudio).webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext fails silently if browser security blocks it
    }
  };

  // Track slice crossing during rotation animation to play ticking sound
  useMotionValueEvent(rotation, "change", (latest) => {
    if (options.length === 0) return;
    const sliceAngle = 360 / options.length;
    const currentSlice = Math.floor(latest / sliceAngle);
    if (currentSlice !== lastSliceRef.current) {
      lastSliceRef.current = currentSlice;
      if (isSpinning) {
        playTickSound();
      }
    }
  });

  const addOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setOptions([...options, {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      color: DEFAULT_COLORS[options.length % DEFAULT_COLORS.length]
    }]);
    setNewLabel("");
  };

  const loadFromRoster = () => {
    if (students.length === 0) {
      alert("Your global roster is empty! Add students in Roster tab first.");
      return;
    }
    const rosterOptions = students.map((s, i) => ({
      id: s.id,
      label: s.name,
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length]
    }));
    setOptions(rosterOptions);
  };

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split("\n").filter(line => line.trim() !== "");
    if (lines.length < 2) {
      alert("Please paste at least 2 options (one per line).");
      return;
    }
    const newOptions = lines.map((line, i) => ({
      id: crypto.randomUUID(),
      label: line.trim(),
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length]
    }));
    setOptions(newOptions);
    setBulkText("");
  };

  const removeOption = (id: string) => {
    if (options.length <= 1) {
      alert("The wheel must have at least 1 option.");
      return;
    }
    setOptions(options.filter(o => o.id !== id));
  };

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinner(null);

    const winnerIndex = Math.floor(Math.random() * options.length);
    const sliceAngle = 360 / options.length;
    // Align target slice to top center pointer
    const targetAngle = (winnerIndex * sliceAngle) + (sliceAngle / 2);
    
    const extraSpins = 6 * 360; // 6 full loops
    const currentRot = rotation.get();
    const currentRotOffset = currentRot % 360;
    const targetOffset = 360 - targetAngle;
    
    const baseRotation = currentRot - currentRotOffset;
    const finalRotation = baseRotation + extraSpins + targetOffset;

    animate(rotation, finalRotation, {
      duration: 5,
      ease: [0.1, 0.8, 0.2, 1], // Custom slow down bezier curve
      onComplete: () => {
        setIsSpinning(false);
        setWinner(options[winnerIndex]);
        
        // Launch a brief confetti explosion
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className={`mx-auto flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-8' : 'max-w-6xl space-y-8'}`}>
      
      {!isFullscreen && (
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
            <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30 text-white">
              <Disc3 className="w-6 h-6" />
            </div>
            <span>Interactive Spin Wheel</span>
          </h1>
          <p className="mt-2 text-lg text-slate-600">Spin for prizes, call on students, or make random class decisions.</p>
        </div>
      )}

      {isFullscreen && (
        <button onClick={toggleFullscreen} className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full transition-colors z-50">
          <Minimize className="w-6 h-6" />
        </button>
      )}

      <div className="flex flex-col-reverse lg:flex-row gap-8 flex-1">
        
        {/* Settings Column */}
        {!isFullscreen && (
          <div className="w-full lg:w-96 space-y-6 shrink-0">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              {/* Tab navigation */}
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-6">
                <button 
                  onClick={() => setActiveTab("rewards")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1 ${activeTab === "rewards" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rewards</span>
                </button>
                <button 
                  onClick={() => setActiveTab("roster")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1 ${activeTab === "roster" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Roster</span>
                </button>
                <button 
                  onClick={() => setActiveTab("bulk")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1 ${activeTab === "bulk" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste List</span>
                </button>
              </div>

              {/* Tab 1: Reward options builder */}
              {activeTab === "rewards" && (
                <div className="space-y-4">
                  <form onSubmit={addOption} className="flex space-x-2">
                    <input 
                      type="text" 
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Enter reward name..."
                      className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                    />
                    <button type="submit" className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Load Global Roster */}
              {activeTab === "roster" && (
                <div className="space-y-4 text-center py-4">
                  <p className="text-sm text-slate-500">
                    Spin to pick a student from your master roster. 
                    ({students.length} students currently loaded)
                  </p>
                  <button 
                    onClick={loadFromRoster}
                    disabled={students.length === 0}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Load Master Roster</span>
                  </button>
                </div>
              )}

              {/* Tab 3: Paste list text area */}
              {activeTab === "bulk" && (
                <form onSubmit={handleBulkImport} className="space-y-3">
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="Paste student names or choices here...&#10;(One option per line)"
                    className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm resize-none"
                  />
                  <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                    Generate Wheel Slices
                  </button>
                </form>
              )}

              {/* Wheel Options List */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Current Options ({options.length})</h3>
                <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {options.map((opt) => (
                    <li key={opt.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }}></div>
                        <span className="font-semibold text-slate-700 truncate text-sm">{opt.label}</span>
                      </div>
                      <button onClick={() => removeOption(opt.id)} className="text-slate-400 hover:text-rose-500 transition-colors shrink-0 ml-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button onClick={toggleFullscreen} className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2">
              <Maximize className="w-4 h-4" />
              <span>Projector Mode</span>
            </button>
          </div>
        )}

        {/* Wheel Display Panel */}
        <div className={`flex-1 flex flex-col items-center justify-center p-6 md:p-12 min-h-[500px] relative overflow-hidden ${isFullscreen ? '' : 'bg-white border border-slate-100 rounded-3xl shadow-sm'}`}>
          
          {winner && !isSpinning && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute z-20 bg-slate-950 text-white p-8 rounded-3xl shadow-2xl text-center border-4 border-rose-500 max-w-sm w-full mx-4"
            >
              <h3 className="text-rose-400 font-bold uppercase tracking-widest mb-2 flex items-center justify-center space-x-1.5">
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Winner Chosen!</span>
              </h3>
              <p className="text-4xl font-black mb-6 break-words">{winner.label}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => {
                    removeOption(winner.id);
                    setWinner(null);
                  }}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-2.5 rounded-xl font-bold transition-colors text-sm"
                >
                  Remove
                </button>
                <button 
                  onClick={() => setWinner(null)} 
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-8 py-2.5 rounded-xl font-bold transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}

          <div className={`relative w-full aspect-square ${isFullscreen ? 'max-w-[60vh]' : 'max-w-sm md:max-w-md'}`}>
            {/* Pointer Pin */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-slate-900 drop-shadow-md">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22L3 4L21 4L12 22Z" />
              </svg>
            </div>

            {/* Wheel Canvas */}
            <motion.div 
              style={{ rotate: rotation }}
              className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-slate-100 relative"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {options.length === 1 ? (
                  <g>
                    <circle cx="50" cy="50" r="50" fill={options[0].color} />
                    <text 
                      x="50" 
                      y="50" 
                      fill="white" 
                      fontSize="5" 
                      fontWeight="bold" 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                    >
                      {options[0].label}
                    </text>
                  </g>
                ) : (
                  options.map((opt, i) => {
                    const sliceAngle = 360 / options.length;
                    const startAngle = i * sliceAngle;
                    const endAngle = startAngle + sliceAngle;
                    
                    // Math for slice path
                    const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
                    const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
                    const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
                    const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);
                    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    // Align text inside slices
                    const textAngle = startAngle + (sliceAngle / 2);
                    const textX = 50 + 33 * Math.cos(Math.PI * textAngle / 180);
                    const textY = 50 + 33 * Math.sin(Math.PI * textAngle / 180);

                    return (
                      <g key={opt.id}>
                        <path d={pathData} fill={opt.color} stroke="white" strokeWidth="0.4" />
                        <text 
                          x={textX} 
                          y={textY} 
                          fill="white" 
                          fontSize="3.8" 
                          fontWeight="bold" 
                          textAnchor="middle" 
                          dominantBaseline="middle"
                          transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                        >
                          {opt.label.length > 14 ? opt.label.substring(0, 12) + '...' : opt.label}
                        </text>
                      </g>
                    );
                  })
                )}
              </svg>
              
              {/* Center Dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md z-10 border-4 border-slate-100"></div>
            </motion.div>
          </div>

          <button 
            onClick={spinWheel}
            disabled={isSpinning || options.length < 1}
            className={`mt-10 bg-gradient-to-r from-rose-500 to-red-500 text-white px-8 py-3 rounded-full font-bold text-lg tracking-wide uppercase transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center space-x-3 shadow-rose-500/30 ${isFullscreen ? 'scale-110' : ''}`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Spin Wheel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
