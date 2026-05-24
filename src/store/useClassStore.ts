import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, ClassGroup } from '@/types';

interface ClassState {
  students: Student[];
  groups: ClassGroup[];
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  removeStudent: (id: string) => void;
  setGroups: (groups: ClassGroup[]) => void;
  clearGroups: () => void;
}

export const useClassStore = create<ClassState>()(
  persist(
    (set) => ({
      students: [],
      groups: [],
      setStudents: (students) => set({ students }),
      addStudent: (student) => set((state) => ({ students: [...state.students, student] })),
      removeStudent: (id) => set((state) => ({ 
        students: state.students.filter((s) => s.id !== id) 
      })),
      setGroups: (groups) => set({ groups }),
      clearGroups: () => set({ groups: [] }),
    }),
    {
      name: 'classspark-roster-store',
    }
  )
);
