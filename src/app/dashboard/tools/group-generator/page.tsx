"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Upload, Shuffle, Settings, Copy, Trash2, Plus, Crown } from "lucide-react";
import Papa from "papaparse";
import { useClassStore } from "@/store/useClassStore";
import { shuffleArray } from "@/utils/helpers";
import { Student, ClassGroup } from "@/types";

export default function GroupGeneratorPage() {
  const { students, setStudents, groups, setGroups, clearGroups } = useClassStore();
  const [inputText, setInputText] = useState("");
  
  // Settings State
  const [groupType, setGroupType] = useState<"numGroups" | "sizePerGroup">("numGroups");
  const [groupValue, setGroupValue] = useState(4);
  const [isGenderBalanced, setIsGenderBalanced] = useState(false);
  const [autoAssignLeaders, setAutoAssignLeaders] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse Name and Gender from a single string line
  const parseNameAndGender = (line: string): { name: string, gender?: "male" | "female" } => {
    const parts = line.split(/[,\(|]/);
    const name = parts[0].trim();
    let gender: "male" | "female" | undefined = undefined;
    if (parts.length > 1) {
      const rawG = parts[1].replace(/[\)\s]/g, "").toLowerCase();
      if (rawG === "female" || rawG === "f" || rawG === "girl") {
        gender = "female";
      } else if (rawG === "male" || rawG === "m" || rawG === "boy") {
        gender = "male";
      }
    }
    return { name, gender };
  };

  // Handlers for Input
  const handleAddManual = () => {
    if (!inputText.trim()) return;
    const lines = inputText.split("\n").filter(n => n.trim() !== "");
    const newStudents: Student[] = lines.map(line => {
      const { name, gender } = parseNameAndGender(line);
      return {
        id: crypto.randomUUID(),
        name,
        score: 0,
        gender
      };
    });
    setStudents([...students, ...newStudents]);
    setInputText("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const newStudents: Student[] = [];
        results.data.forEach((row: any) => {
          if (Array.isArray(row) && row[0]) {
            const name = String(row[0]).trim();
            if (!name) return;
            let gender: "male" | "female" | undefined = undefined;
            if (row[1]) {
              const gStr = String(row[1]).trim().toLowerCase();
              if (gStr === "female" || gStr === "f" || gStr === "girl") {
                gender = "female";
              } else if (gStr === "male" || gStr === "m" || gStr === "boy") {
                gender = "male";
              }
            }
            newStudents.push({
              id: crypto.randomUUID(),
              name,
              score: 0,
              gender
            });
          }
        });
        setStudents([...students, ...newStudents]);
      }
    });
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearStudents = () => {
    setStudents([]);
    clearGroups();
  };

  // Group Generation Logic
  const generateGroups = () => {
    if (students.length === 0) return;

    const numGroups = groupType === "sizePerGroup" 
      ? Math.max(1, Math.ceil(students.length / groupValue)) 
      : Math.max(1, groupValue);

    let generatedGroups: Student[][] = Array.from({ length: numGroups }, () => []);

    if (isGenderBalanced) {
      // Filter males, females, and unspecified
      const males = shuffleArray(students.filter(s => s.gender === "male"));
      const females = shuffleArray(students.filter(s => s.gender === "female"));
      const unspecified = shuffleArray(students.filter(s => s.gender === undefined));

      // Distribute males
      let idx = 0;
      males.forEach(m => {
        generatedGroups[idx].push(m);
        idx = (idx + 1) % numGroups;
      });

      // Distribute females
      females.forEach(f => {
        generatedGroups[idx].push(f);
        idx = (idx + 1) % numGroups;
      });

      // Distribute unspecified
      unspecified.forEach(u => {
        generatedGroups[idx].push(u);
        idx = (idx + 1) % numGroups;
      });
    } else {
      // Random distribute
      const pool = shuffleArray([...students]);
      pool.forEach((student, index) => {
        generatedGroups[index % numGroups].push(student);
      });
    }

    // Map to ClassGroup type
    const finalGroups = generatedGroups
      .filter(g => g.length > 0) // clear empty groups if any
      .map((groupMembers, i) => {
        // Pick leader if autoAssignLeaders is active
        const leaderId = autoAssignLeaders && groupMembers.length > 0
          ? groupMembers[Math.floor(Math.random() * groupMembers.length)].id
          : undefined;

        return {
          id: crypto.randomUUID(),
          name: `Group ${i + 1}`,
          members: groupMembers,
          leaderId
        };
      });

    setGroups(finalGroups);
  };

  // Pick or assign manual leader inside a group
  const setGroupLeader = (groupId: string, memberId: string) => {
    setGroups(
      groups.map(g => g.id === groupId ? { ...g, leaderId: memberId } : g)
    );
  };

  // Randomly select a leader for a single group
  const pickRandomGroupLeader = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || group.members.length === 0) return;
    const randomMember = group.members[Math.floor(Math.random() * group.members.length)];
    setGroupLeader(groupId, randomMember.id);
  };

  const copyGroupsToClipboard = () => {
    const text = groups.map(g => {
      const leader = g.members.find(m => m.id === g.leaderId);
      const leaderStr = leader ? ` (Leader: ${leader.name})` : "";
      return `${g.name}${leaderStr}:\n${g.members.map(m => `- ${m.name}${m.id === g.leaderId ? " 👑" : ""}`).join("\n")}`;
    }).join("\n\n");
    navigator.clipboard.writeText(text);
    alert("Copied groups to clipboard!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
            <Users className="w-6 h-6" />
          </div>
          <span>Group Generator</span>
        </h1>
        <p className="mt-2 text-lg text-slate-600">Divide your roster into perfectly balanced teams with smart filters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Input & Settings */}
        <div className="space-y-6">
          {/* Roster Input Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex justify-between items-center">
              <span>Roster ({students.length})</span>
              {students.length > 0 && (
                <button onClick={handleClearStudents} className="text-rose-500 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </h2>
            
            <textarea
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all mb-3 text-sm h-32 resize-none"
              placeholder="Paste names (one per line)&#10;Add gender in brackets: e.g. John (M) or Anna (F)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <div className="flex space-x-2">
              <button 
                onClick={handleAddManual}
                className="flex-1 bg-slate-900 text-white py-2 rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Names</span>
              </button>
              
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 bg-slate-100 text-slate-700 py-2 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center"
                title="Upload CSV (Format: Name, Gender)"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-slate-400" />
              <span>Settings</span>
            </h2>

            <div className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setGroupType("numGroups")}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${groupType === "numGroups" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  By # of Groups
                </button>
                <button 
                  onClick={() => setGroupType("sizePerGroup")}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${groupType === "sizePerGroup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  By Group Size
                </button>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {groupType === "numGroups" ? "Number of Groups" : "Students per Group"}
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={groupValue}
                  onChange={(e) => setGroupValue(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isGenderBalanced} 
                    onChange={() => setIsGenderBalanced(!isGenderBalanced)} 
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 accent-blue-500" 
                  />
                  <span className="text-sm text-slate-700 font-medium">Gender Balanced Groups ⚖️</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoAssignLeaders} 
                    onChange={() => setAutoAssignLeaders(!autoAssignLeaders)} 
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 accent-blue-500" 
                  />
                  <span className="text-sm text-slate-700 font-medium">Pick Leaders Automatically 👑</span>
                </label>
              </div>
            </div>

            <button 
              onClick={generateGroups}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2"
            >
              <Shuffle className="w-5 h-5" />
              <span>Generate Groups</span>
            </button>
          </div>
        </div>

        {/* Right Column: Display Area */}
        <div className="lg:col-span-2">
          {groups.length === 0 ? (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/50">
              <Users className="w-16 h-16 mb-4 text-slate-300" />
              <p className="font-medium">No groups generated yet.</p>
              <p className="text-sm mt-1">Add students, choose settings, and click generate.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Generated Groups</h2>
                <button 
                  onClick={copyGroupsToClipboard}
                  className="text-sm flex items-center space-x-2 text-slate-500 hover:text-blue-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy List</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {groups.map((group, index) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <h3 className="font-bold text-slate-800">{group.name}</h3>
                        <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full shrink-0">
                          {group.members.length} members
                        </span>
                      </div>
                      
                      <ul className="space-y-2 mb-4">
                        {group.members.map((member) => {
                          const isLeader = group.leaderId === member.id;
                          return (
                            <li 
                              key={member.id} 
                              onClick={() => setGroupLeader(group.id, member.id)}
                              className={`p-2 rounded-xl text-sm flex items-center justify-between cursor-pointer transition-all ${
                                isLeader 
                                  ? "bg-amber-50 border border-amber-200 text-amber-900 font-bold" 
                                  : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center space-x-2 w-full min-w-0">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLeader ? "bg-amber-400" : "bg-blue-400"}`}></div>
                                <span className="font-medium break-words text-slate-700">{member.name}</span>
                                
                                {/* Only display gender tags if isGenderBalanced is enabled and gender is defined */}
                                {isGenderBalanced && member.gender && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${member.gender === "female" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>
                                    {member.gender === "female" ? "F" : "M"}
                                  </span>
                                )}
                              </div>
                              {isLeader && (
                                <Crown className="w-4 h-4 text-amber-500 shrink-0 fill-amber-500" />
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      {/* Manual Picker Button */}
                      <button
                        onClick={() => pickRandomGroupLeader(group.id)}
                        className="w-full bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700 py-1.5 rounded-lg border border-slate-200/60 font-semibold text-xs transition-colors flex items-center justify-center space-x-1"
                      >
                        <Crown className="w-3 h-3" />
                        <span>Shuffle Leader</span>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
