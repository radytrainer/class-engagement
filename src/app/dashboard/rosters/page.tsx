"use client";

import { useState } from "react";
import { Users, UserPlus, Trash2, Edit2, Save, X, ClipboardList } from "lucide-react";
import { useClassStore } from "@/store/useClassStore";
import { Student } from "@/types";

export default function RosterPage() {
  const { students, addStudent, removeStudent, setStudents } = useClassStore();
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGender, setNewStudentGender] = useState<"male" | "female" | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState<"male" | "female" | undefined>(undefined);

  // Bulk paste state
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    addStudent({
      id: crypto.randomUUID(),
      name: newStudentName.trim(),
      score: 0,
      gender: newStudentGender
    });
    setNewStudentName("");
    setNewStudentGender(undefined);
  };

  const handleBulkAdd = () => {
    const names = bulkText
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    names.forEach((name) => {
      addStudent({ id: crypto.randomUUID(), name, score: 0, gender: undefined });
    });
    setBulkText("");
    setShowBulk(false);
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
    setEditGender(student.gender);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    setStudents(students.map(s => s.id === editingId ? { ...s, name: editName.trim(), gender: editGender } : s));
    setEditingId(null);
  };

  const clearAll = () => {
    if (confirm("Remove all students from the roster?")) {
      setStudents([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
            <Users className="w-6 h-6" />
          </div>
          <span>Your Students</span>
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Add your students once — they'll be available in every tool automatically.
        </p>
      </div>

      {/* Add Students Card */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">

        {/* Single Add Form */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">
            ➕ Add a student
          </label>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Student's full name..."
              className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-lg transition-all"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 shrink-0"
            >
              <UserPlus className="w-5 h-5" />
              <span>Add</span>
            </button>
          </form>

          {/* Optional gender (only shown after typing a name) */}
          {newStudentName.trim().length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">Optional: gender (for balanced group splitting)</p>
              <div className="flex gap-2">
                {([undefined, "male", "female"] as const).map((g) => (
                  <button
                    key={String(g)}
                    type="button"
                    onClick={() => setNewStudentGender(g)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      newStudentGender === g
                        ? g === "male" ? "bg-blue-500 text-white border-blue-500"
                          : g === "female" ? "bg-pink-500 text-white border-pink-500"
                          : "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {g === undefined ? "No gender" : g === "male" ? "♂ Male" : "♀ Female"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider with bulk option */}
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-sm text-slate-400 font-medium">or</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* Bulk Paste */}
        {!showBulk ? (
          <button
            onClick={() => setShowBulk(true)}
            className="w-full flex items-center justify-center space-x-2 p-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all font-semibold"
          >
            <ClipboardList className="w-5 h-5" />
            <span>📋 Paste a whole class list at once</span>
          </button>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">
              📋 Paste your class list — one name per line
            </label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"John Smith\nSara Lee\nMaria Garcia\n..."}
              rows={6}
              autoFocus
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all resize-none font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={handleBulkAdd}
                disabled={!bulkText.trim()}
                className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                ✅ Add {bulkText.split("\n").filter(n => n.trim()).length || ""} Students
              </button>
              <button
                onClick={() => { setShowBulk(false); setBulkText(""); }}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Student List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              👥 Class List ({students.length} students)
            </h2>
            {students.length > 0 && (
              <button onClick={clearAll} className="text-rose-500 hover:text-rose-600 text-sm font-medium flex items-center space-x-1">
                <Trash2 className="w-4 h-4" />
                <span>Remove all</span>
              </button>
            )}
          </div>

          {students.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-slate-200 rounded-2xl">
              <span className="text-5xl mb-4 block">👋</span>
              <p className="text-slate-500 font-semibold text-lg">No students yet</p>
              <p className="text-slate-400 text-sm mt-1">Add names above to get started</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {students.map((student, index) => (
                <li key={student.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                  {editingId === student.id ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full sm:flex-1 p-2 border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        autoFocus
                      />
                      <div className="flex gap-1 text-xs font-bold">
                        {([undefined, "male", "female"] as const).map((g) => (
                          <button
                            key={String(g)}
                            type="button"
                            onClick={() => setEditGender(g)}
                            className={`px-3 py-1.5 rounded-lg border transition-all ${
                              editGender === g
                                ? g === "male" ? "bg-blue-500 text-white border-blue-500"
                                  : g === "female" ? "bg-pink-500 text-white border-pink-500"
                                  : "bg-slate-800 text-white border-slate-800"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {g === undefined ? "—" : g === "male" ? "♂" : "♀"}
                          </button>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={saveEdit} className="text-emerald-600 p-2 hover:bg-emerald-50 rounded-lg font-bold text-sm">
                          <Save className="w-5 h-5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-slate-500 p-2 hover:bg-slate-200 rounded-lg">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-800 text-lg">{student.name}</span>
                        {student.gender && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${student.gender === "female" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>
                            {student.gender === "female" ? "♀" : "♂"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => startEdit(student)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit name">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeStudent(student.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Remove student">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
