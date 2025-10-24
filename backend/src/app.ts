import express, { Express, Request, Response } from "express";
import cors from "cors";
import {
  initialClassrooms,
  initialReservations,
  Classroom,
  Reservation,
} from "./data";

export const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- 模擬資料庫 ---
// 我們使用 'let' 並複製陣列，這樣才能在 POST 請求中修改它
let classroomsDB: Classroom[] = [...initialClassrooms];
let reservationsDB: Reservation[] = [...initialReservations];

// 測試路由
app.get("/api", (req: Request, res: Response) => {
  res.status(200).json({ message: "歡迎來到專科教室借用系統 API" });
});

// 1. GET /api/classrooms - 獲取所有教室
app.get("/api/classrooms", (req: Request, res: Response) => {
  res.status(200).json(classroomsDB);
});

// 2. GET /api/reservations - 獲取所有預約
app.get("/api/reservations", (req: Request, res: Response) => {
  res.status(200).json(reservationsDB);
});

// 3. POST /api/reservations - 建立新預約
app.post("/api/reservations", (req: Request, res: Response) => {
  const { classroomId, userName, purpose, date, timeSlot } = req.body;

  // 基本驗證
  if (!classroomId || !userName || !purpose || !date || !timeSlot) {
    return res.status(400).json({ message: "缺少必要的欄位" });
  }

  const newReservation: Reservation = {
    id: `r${Date.now()}`, // 簡單生成一個唯一的 ID
    classroomId,
    userName,
    purpose,
    date,
    timeSlot,
  };

  reservationsDB.push(newReservation);

  res.status(201).json(newReservation); // 201 Created
});
