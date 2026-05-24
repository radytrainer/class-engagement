export interface Student {
  id: string;
  name: string;
  score: number;
  avatarUrl?: string;
  gender?: "male" | "female";
}

export interface ClassGroup {
  id: string;
  name: string;
  members: Student[];
  leaderId?: string;
}

export interface Settings {
  darkMode: boolean;
  soundEffects: boolean;
  defaultGroupSize: number;
}
