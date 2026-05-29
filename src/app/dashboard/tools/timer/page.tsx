"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Maximize, Minimize, Settings, Rocket, Flag, Bomb, Bell } from "lucide-react";

type TimerMode = "countdown" | "stopwatch" | "pomodoro" | "competition";
type Theme = "rocket" | "race" | "bomb" | "school_bell";

const STORAGE_KEY = "classspark-timer-settings";

export default function TimerPage() {
  const [mounted, setMounted] = useState(false);

  // State
  const [mode, setMode] = useState<TimerMode>("countdown");
  const [theme, setTheme] = useState<Theme>("rocket");
  const [time, setTime] = useState(300); // 5 minutes default
  const [initialTime, setInitialTime] = useState(300);
  const [isActive, setIsActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Settings Inputs
  const [inputMinutes, setInputMinutes] = useState("5");
  const [inputSeconds, setInputSeconds] = useState("0");

  // Load persisted settings on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedMode: TimerMode = parsed.mode || "countdown";
        const savedTheme: Theme = parsed.theme || "rocket";
        const savedMin = parsed.inputMinutes || "5";
        const savedSec = parsed.inputSeconds || "0";

        setMode(savedMode);
        setTheme(savedTheme);
        setInputMinutes(savedMin);
        setInputSeconds(savedSec);

        if (savedMode === "stopwatch") {
          setTime(0);
          setInitialTime(0);
        } else if (savedMode === "pomodoro") {
          setTime(25 * 60);
          setInitialTime(25 * 60);
        } else {
          const total = (parseInt(savedMin) || 0) * 60 + (parseInt(savedSec) || 0);
          setTime(total);
          setInitialTime(total);
        }
      }
    } catch (_) {}
  }, []);

  // Persist settings whenever they change
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, theme, inputMinutes, inputSeconds }));
    } catch (_) {}
  }, [mounted, mode, theme, inputMinutes, inputSeconds]);

  // Sync state when exiting fullscreen via ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Interval logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (mode === "stopwatch") {
          setTime((prev) => prev + 1);
        } else {
          setTime((prev) => {
            if (prev <= 1) {
              setIsActive(false);
              playAlertSound();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else if (!isActive && time !== 0 && interval) {
      clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, mode, time]);

  // Audio Context Beep
  const playAlertSound = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    if (theme === "bomb") osc.type = "square";

    osc.frequency.setValueAtTime(theme === "school_bell" ? 800 : theme === "bomb" ? 200 : 440, ctx.currentTime);
    if (theme === "school_bell") {
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 1);
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    } else {
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    }

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  };

  // Handlers
  const handleStart = () => setIsActive(true);
  const handlePause = () => setIsActive(false);
  const handleReset = () => {
    setIsActive(false);
    if (mode === "stopwatch") {
      setTime(0);
      setInitialTime(0);
    } else if (mode === "pomodoro") {
      setTime(25 * 60);
      setInitialTime(25 * 60);
    } else {
      const totalSeconds = (parseInt(inputMinutes) || 0) * 60 + (parseInt(inputSeconds) || 0);
      setTime(totalSeconds);
      setInitialTime(totalSeconds);
    }
  };

  const handleSetTime = () => {
    const totalSeconds = (parseInt(inputMinutes) || 0) * 60 + (parseInt(inputSeconds) || 0);
    setTime(totalSeconds);
    setInitialTime(totalSeconds);
    setIsActive(false);
  };

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    if (newMode === "stopwatch") {
      setTime(0);
      setInitialTime(0);
    } else if (newMode === "pomodoro") {
      setTime(25 * 60);
      setInitialTime(25 * 60);
    } else {
      handleSetTime();
    }
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

  // Format Time (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Progress Calculation
  const progressPercentage = mode === "stopwatch" ? 100 : initialTime > 0 ? (time / initialTime) * 100 : 0;

  // Theme styling
  const themeStyles = {
    rocket: { color: "text-blue-500", stroke: "#3b82f6", bg: "from-blue-500 to-indigo-600", icon: Rocket },
    race: { color: "text-amber-500", stroke: "#f59e0b", bg: "from-amber-400 to-orange-500", icon: Flag },
    bomb: { color: "text-rose-500", stroke: "#f43f5e", bg: "from-rose-500 to-red-600", icon: Bomb },
    school_bell: { color: "text-emerald-500", stroke: "#10b981", bg: "from-emerald-400 to-teal-500", icon: Bell },
  };

  const currentTheme = themeStyles[theme];
  const ThemeIcon = currentTheme.icon;

  return (
    <div className={`mx-auto flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-8' : 'max-w-6xl space-y-8'}`}>

      {!isFullscreen && (
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${currentTheme.bg} rounded-xl flex items-center justify-center shadow-lg text-white`}>
              <ThemeIcon className="w-6 h-6" />
            </div>
            <span>Classroom Timers</span>
          </h1>
          <p className="mt-2 text-lg text-slate-600">Keep activities on track with engaging countdowns.</p>
        </div>
      )}

      {isFullscreen && (
        <button onClick={toggleFullscreen} className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full transition-colors z-50">
          <Minimize className="w-6 h-6" />
        </button>
      )}

      <div className={`flex flex-col-reverse lg:flex-row gap-8 flex-1`}>

        {/* Settings Panel (Hidden in fullscreen) */}
        {!isFullscreen && (
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2 mb-4">
                <Settings className="w-5 h-5 text-slate-400" />
                <span>Timer Setup</span>
              </h2>

              <div className="space-y-6">
                {/* Mode Selector */}
                <div>
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider block mb-2">Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["countdown", "stopwatch", "pomodoro", "competition"].map((m) => (
                      <button
                        key={m}
                        onClick={() => handleModeChange(m as TimerMode)}
                        className={`py-2 text-xs font-bold rounded-xl transition-colors capitalize ${mode === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Input (Only for Countdown/Competition) */}
                {(mode === "countdown" || mode === "competition") && (
                  <div>
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider block mb-2">Set Time</label>
                    <div className="flex space-x-2 items-center">
                      <input
                        type="number" min="0" value={inputMinutes} onChange={(e) => setInputMinutes(e.target.value)}
                        className="w-1/2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Min"
                      />
                      <span className="font-bold text-slate-400">:</span>
                      <input
                        type="number" min="0" max="59" value={inputSeconds} onChange={(e) => setInputSeconds(e.target.value)}
                        className="w-1/2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Sec"
                      />
                    </div>
                    <button onClick={handleSetTime} className="w-full mt-2 bg-blue-50 text-blue-600 py-2 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors">
                      Apply Time
                    </button>
                  </div>
                )}

                {/* Theme Selector */}
                <div>
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider block mb-2">Theme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(themeStyles) as Theme[]).map((t) => {
                      const Icon = themeStyles[t].icon;
                      return (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`p-3 rounded-xl flex items-center justify-center transition-all ${theme === t ? `bg-gradient-to-br ${themeStyles[t].bg} text-white shadow-md` : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                          title={t.replace('_', ' ')}
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <button onClick={toggleFullscreen} className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2">
              <Maximize className="w-4 h-4" />
              <span>Enter Fullscreen</span>
            </button>
          </div>
        )}

        {/* Display Area */}
        <div className={`flex-1 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden ${isFullscreen ? '' : 'bg-white border border-slate-100 shadow-sm min-h-[500px]'}`}>

          <div className={`relative flex items-center justify-center group w-full aspect-square ${isFullscreen ? 'max-w-[78vh]' : 'max-w-sm md:max-w-md'}`}>
            {/* Animated Progress Circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform drop-shadow-xl" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={isFullscreen ? '#1e293b' : '#f1f5f9'}
                strokeWidth={isFullscreen ? "6" : "4"}
              />
              {/* Foreground Progress Circle */}
              <motion.circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={currentTheme.stroke}
                strokeWidth={isFullscreen ? "10" : "6"}
                strokeLinecap="round"
                initial={{ strokeDasharray: 283, strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: 283 - (283 * progressPercentage) / 100 }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </svg>

            {/* Time Display + Controls inside circle */}
            <div className={`text-center z-10 flex flex-col items-center justify-center w-full px-8`}>
              <motion.div
                animate={{ scale: time <= 10 && isActive && mode !== "stopwatch" ? [1, 1.05, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className={`font-black tabular-nums w-full overflow-hidden ${isFullscreen ? 'text-8xl sm:text-[14rem] tracking-[0.08em] text-white' : 'text-6xl md:text-8xl tracking-tighter text-slate-800'} ${time <= 10 && mode !== "stopwatch" ? 'text-rose-500' : ''}`}
              >
                {formatTime(time)}
              </motion.div>
              <div className={`font-bold uppercase tracking-[0.2em] mt-2 md:mt-3 flex items-center justify-center space-x-3 ${isFullscreen ? 'text-2xl' : 'text-sm md:text-xl'} ${currentTheme.color}`}>
                <ThemeIcon className={`shrink-0 ${isFullscreen ? 'w-6 h-6' : 'w-4 h-4 md:w-5 md:h-5'}`} />
                <span className={`truncate ${isFullscreen ? 'text-xl' : 'text-xs md:text-base'}`}>{theme.replace('_', ' ')}</span>
              </div>

              {/* Controls INSIDE the circle */}
              <div className={`flex items-center justify-center ${isFullscreen ? 'mt-6 space-x-5' : 'mt-4 md:mt-5 space-x-3'}`}>
                {/* Reset button */}
                <button
                  onClick={handleReset}
                  className={`rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-2 ${isFullscreen ? 'w-11 h-11 border-slate-600 text-slate-400 hover:text-white hover:border-slate-400' : 'w-9 h-9 border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600'}`}
                >
                  <RotateCcw className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
                </button>

                {/* Play/Pause - Primary button */}
                {isActive ? (
                  <button
                    onClick={handlePause}
                    className={`rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg bg-gradient-to-br ${currentTheme.bg} text-white ${isFullscreen ? 'w-16 h-16' : 'w-14 h-14'}`}
                  >
                    <Pause className={`fill-current ${isFullscreen ? 'w-6 h-6' : 'w-5 h-5'}`} />
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    className={`rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg bg-gradient-to-br ${currentTheme.bg} text-white ${isFullscreen ? 'w-16 h-16' : 'w-14 h-14'}`}
                  >
                    <Play className={`fill-current ml-0.5 ${isFullscreen ? 'w-6 h-6' : 'w-5 h-5'}`} />
                  </button>
                )}

                {/* Fullscreen shortcut button */}
                <button
                  onClick={toggleFullscreen}
                  className={`rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-2 ${isFullscreen ? 'w-11 h-11 border-slate-600 text-slate-400 hover:text-white hover:border-slate-400' : 'w-9 h-9 border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600'}`}
                >
                  {isFullscreen ? <Minimize className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
