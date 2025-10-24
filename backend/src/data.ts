// 來自 frontend/types.ts
export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  color: string;
}

export interface Reservation {
  id: string;
  classroomId: string;
  userName: string;
  purpose: string;
  date: string; // YYYY-MM-DD format
  timeSlot: string; // e.g., "第一節"
}

// 來自 frontend/App.tsx
export const initialClassrooms: Classroom[] = [
  { id: "c1", name: "電腦教室 (A)", capacity: 40, color: "#3b82f6" },
  { id: "c2", name: "物理實驗室", capacity: 30, color: "#10b981" },
  { id: "c3", name: "音樂教室", capacity: 50, color: "#8b5cf6" },
  { id: "c4", name: "美術教室", capacity: 35, color: "#ef4444" },
  { id: "c5", name: "語言教室", capacity: 40, color: "#f97316" },
];

// 我們暫時只使用 App.tsx 中的靜態預約資料
export const initialReservations: Reservation[] = [
  {
    id: "r1",
    classroomId: "c1",
    userName: "王老師",
    purpose: "程式設計課程",
    date: "2024-07-28",
    timeSlot: "第二節",
  },
  {
    id: "r2",
    classroomId: "c2",
    userName: "陳同學",
    purpose: "光學實驗",
    date: "2024-07-28",
    timeSlot: "第六節",
  },
  {
    id: "r3",
    classroomId: "c1",
    userName: "李同學",
    purpose: "專題討論",
    date: "2024-07-29",
    timeSlot: "第三節",
  },
];
