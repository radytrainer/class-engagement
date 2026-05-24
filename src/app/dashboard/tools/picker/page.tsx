"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Target, RotateCcw, Maximize, Minimize, Settings, X, RefreshCw } from "lucide-react";
import { useClassStore } from "@/store/useClassStore";
import { Student } from "@/types";

type PickerMode = "card" | "roulette";

export default function StudentPickerPage() {
  const { students } = useClassStore();
  
  // Local state for picking
  const [removedStudentIds, setRemovedStudentIds] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Settings
  const [mode, setMode] = useState<PickerMode>("card");
  const [noRepeat, setNoRepeat] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs for auto-fit font sizing
  const cardRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const rouletteNameRef = useRef<HTMLDivElement>(null);

  // Auto-fit name font size to fill card width without overflow
  useEffect(() => {
    if (!selectedStudent) return;

    // Use requestAnimationFrame to ensure DOM has rendered
    const animationFrameId = requestAnimationFrame(() => {
      // Card flip name
      if (nameRef.current && cardRef.current) {
        const span = nameRef.current;
        const container = cardRef.current;
        
        // Calculate available width (container width minus padding)
        const available = container.clientWidth - 64; // subtract px-8 padding (2 * 32px)
        
        // Start with max font size and reduce if needed
        let fontSize = 96;
        span.style.fontSize = `${fontSize}px`;
        
        // Keep reducing font size until text fits or reaches minimum
        let attempts = 0;
        while (span.scrollWidth > available && fontSize > 16 && attempts < 30) {
          fontSize -= 2;
          span.style.fontSize = `${fontSize}px`;
          attempts++;
        }
        
        // Ensure minimum readability
        if (fontSize < 16) {
          span.style.fontSize = '16px';
        }
      }

      // Roulette name
      if (rouletteNameRef.current) {
        const div = rouletteNameRef.current;
        const container = div.parentElement?.parentElement; // Get the roulette container
        if (!container) return;
        
        // Calculate available width
        const available = container.clientWidth - 48; // subtract px-6 padding (2 * 24px)
        
        let fontSize = 80;
        div.style.fontSize = `${fontSize}px`;
        
        // Keep reducing font size until text fits
        let attempts = 0;
        while (div.scrollWidth > available && fontSize > 16 && attempts < 30) {
          fontSize -= 2;
          div.style.fontSize = `${fontSize}px`;
          attempts++;
        }
        
        // Ensure minimum readability
        if (fontSize < 16) {
          div.style.fontSize = '16px';
        }
      }
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [selectedStudent, isFullscreen]);

  // Sync state when exiting fullscreen via ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  
  // Animation state
  const [isPicking, setIsPicking] = useState(false);
  const unpickedStudents = students.filter((student) => !removedStudentIds.includes(student.id));

  const resetPool = () => {
    setRemovedStudentIds([]);
    setSelectedStudent(null);
  };

  const removeSelected = () => {
    if (selectedStudent) {
      setRemovedStudentIds((prev) =>
        prev.includes(selectedStudent.id) ? prev : [...prev, selectedStudent.id]
      );
      setSelectedStudent(null);
    }
  };

  const pickStudent = () => {
    // Snapshot the pool NOW (before any async) to avoid stale closure
    const pool = unpickedStudents;

    if (pool.length === 0) {
      alert("No students left to pick! Resetting list.");
      resetPool();
      return;
    }

    // Pick the winner immediately so we always have a valid result
    const randomIndex = Math.floor(Math.random() * pool.length);
    const picked = pool[randomIndex];

    if (!picked) return; // safety guard

    setIsPicking(true);
    setSelectedStudent(null);

    const delay = mode === "card" ? 600 : 2000;

    setTimeout(() => {
      // First: set the selected student
      setSelectedStudent(picked);

      // Then: remove isPicking flag in the NEXT tick so React renders
      // the student name before removing the spinning state
      setTimeout(() => {
        setIsPicking(false);

        if (noRepeat) {
          setRemovedStudentIds((prev) =>
            prev.includes(picked.id) ? prev : [...prev, picked.id]
          );
        }
      }, 50);
    }, delay);
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
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 text-white">
              <Target className="w-6 h-6" />
            </div>
            <span>Random Student Picker</span>
          </h1>
          <p className="mt-2 text-lg text-slate-600">Randomly call on a student — keeps everyone engaged!</p>
        </div>
      )}

      {isFullscreen && (
        <button onClick={toggleFullscreen} className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full transition-colors">
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
                <span>Options</span>
              </h2>

              <div className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setMode("card")}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "card" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    🃏 Card Flip
                  </button>
                  <button 
                    onClick={() => setMode("roulette")}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "roulette" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    🎰 Roulette Spin
                  </button>
                </div>

                <div className="pt-2 space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={noRepeat} onChange={() => setNoRepeat(!noRepeat)} className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500 accent-purple-500" />
                    <span className="text-sm text-slate-700">Don't pick the same student twice</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Roster:</span>
                    <span className="font-bold text-slate-700">{students.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Remaining to Pick:</span>
                    <span className="font-bold text-purple-600">{unpickedStudents.length}</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button onClick={resetPool} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2 text-sm">
                    <RefreshCw className="w-4 h-4" />
                    <span>Reset List</span>
                  </button>
                  <button onClick={removeSelected} disabled={!selectedStudent} className="px-3 bg-rose-50 text-rose-600 py-2 rounded-xl font-medium hover:bg-rose-100 transition-colors disabled:opacity-50" title="Remove selected student from this session">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <button onClick={toggleFullscreen} className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2">
              <Maximize className="w-4 h-4" />
              <span>Enter Fullscreen</span>
            </button>
          </div>
        )}

        {/* Picker Display Area */}
        <div className={`flex-1 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden ${isFullscreen ? '' : 'bg-white border border-slate-100 shadow-sm min-h-[500px]'}`}>
          
          {students.length === 0 ? (
            <div className={`text-center ${isFullscreen ? 'text-white/50' : 'text-slate-400'}`}>
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-semibold text-lg">No students added yet</p>
              <p className="text-sm mt-1 opacity-70">Go to <strong>Roster</strong> first to add your class list.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full p-8">
              
              {/* Card Flip Mode */}
              {mode === "card" && (
                <div className="relative w-full max-w-lg aspect-video perspective-1000">
                  <motion.div
                    animate={{ rotateY: isPicking ? 180 : selectedStudent ? 0 : 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="w-full h-full relative preserve-3d"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {!selectedStudent && !isPicking && (
                      <div className={`absolute inset-0 backface-hidden rounded-3xl flex items-center justify-center shadow-xl ${isFullscreen ? 'bg-white/10 backdrop-blur-md border border-white/20' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
                        <span className={`text-3xl font-bold ${isFullscreen ? 'text-white' : 'text-white/90'}`}>Who&apos;s Next?</span>
                      </div>
                    )}
                    
                    {isPicking && (
                      <div className={`absolute inset-0 backface-hidden rounded-3xl flex items-center justify-center shadow-xl ${isFullscreen ? 'bg-white/10 backdrop-blur-md border border-white/20' : 'bg-slate-100'}`} style={{ transform: 'rotateY(180deg)' }}>
                         <RotateCcw className={`w-12 h-12 animate-spin ${isFullscreen ? 'text-white' : 'text-purple-500'}`} />
                      </div>
                    )}

                    {selectedStudent && !isPicking && (
                      <motion.div 
                        ref={cardRef}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`absolute inset-0 backface-hidden rounded-3xl flex flex-col items-center justify-center shadow-2xl border-4 px-8 overflow-hidden ${isFullscreen ? 'bg-slate-800 border-purple-500 text-white' : 'bg-white border-purple-500'}`}
                      >
                        <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                          <span 
                            ref={nameRef}
                            className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 text-center whitespace-nowrap block"
                            style={{ fontSize: '96px', lineHeight: 1.1 }}
                          >
                            {selectedStudent.name}
                          </span>
                        </div>
                        <span className={`text-xl font-medium mt-3 ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>You&apos;ve been picked!</span>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              )}

              {/* Roulette Mode */}
              {mode === "roulette" && (
                <div className={`w-full max-w-2xl h-48 overflow-hidden relative rounded-3xl flex items-center justify-center border-4 shadow-inner px-6 ${isFullscreen ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                  {/* Highlight center bar */}
                  <div className={`absolute inset-y-0 left-0 right-0 m-auto h-20 border-y-2 z-10 pointer-events-none ${isFullscreen ? 'border-purple-500 bg-purple-500/20' : 'border-purple-400 bg-purple-500/10'}`}></div>
                  
                  {isPicking ? (
                    <motion.div
                      animate={{ y: [0, -1000] }}
                      transition={{ ease: "linear", duration: 1, repeat: Infinity }}
                      className="flex flex-col items-center space-y-8 absolute top-14"
                    >
                      {/* Fake long list for spinning effect */}
                      {[...students, ...students, ...students, ...students].map((s, i) => (
                        <div key={i} className={`text-4xl font-bold opacity-30 ${isFullscreen ? 'text-white' : 'text-slate-800'}`}>{s.name}</div>
                      ))}
                    </motion.div>
                  ) : selectedStudent ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center px-6 pointer-events-none overflow-hidden">
                      <motion.div
                        ref={rouletteNameRef}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="block whitespace-nowrap text-center font-black leading-none text-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text"
                        style={{ fontSize: '80px', lineHeight: 0.9 }}
                      >
                        {selectedStudent.name}
                      </motion.div>
                    </div>
                  ) : (
                    <div className={`text-3xl font-bold opacity-50 ${isFullscreen ? 'text-white' : 'text-slate-800'}`}>Ready to spin</div>
                  )}
                </div>
              )}

              <div className="mt-12">
                <button 
                  onClick={pickStudent}
                  disabled={isPicking || unpickedStudents.length === 0}
                  className={`px-12 py-5 rounded-full font-black text-2xl tracking-wide uppercase transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${isFullscreen ? 'bg-white text-slate-900 shadow-white/20' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/30'}`}
                >
                  {isPicking ? "Picking..." : "Pick Student"}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
