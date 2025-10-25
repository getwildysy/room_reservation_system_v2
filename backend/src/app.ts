import express from "express";
import cors from "cors";
import { prisma } from "./db.js"; // <-- (新) 導入 Prisma Client
import authRouter from "./auth.routes.js"; // <-- (重要) 必須導入 authRouter

// --- 型別 (Types) 導入 ---
import type { Express, Request, Response } from "express";

export const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter); // <-- (重要) 必須掛載 authRouter

// // --- 模擬資料庫 ---
// // 我們使用 'let' 並複製陣列，這樣才能在 POST 請求中修改它
// let classroomsDB: Classroom[] = [...initialClassrooms];
// let reservationsDB: Reservation[] = [...initialReservations];

// 測試路由
app.get("/api", (req: Request, res: Response) => {
  res.status(200).json({ message: "歡迎來到專科教室借用系統 API" });
});

// 1. GET /api/classrooms - (重構)
app.get("/api/classrooms", async (req: Request, res: Response) => {
  try {
    const classrooms = await prisma.classroom.findMany();
    res.status(200).json(classrooms);
  } catch (error) {
    res.status(500).json({ message: "獲取教室資料失敗" });
  }
});

// 2. GET /api/reservations - (重構)
app.get("/api/reservations", async (req: Request, res: Response) => {
  try {
    const reservations = await prisma.reservation.findMany();
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: "獲取預約資料失敗" });
  }
});

// 3. POST /api/reservations - (重構)
app.post("/api/reservations", async (req: Request, res: Response) => {
  const { classroomId, userName, purpose, date, timeSlot } = req.body;

  // 基本驗證
  if (!classroomId || !userName || !purpose || !date || !timeSlot) {
    return res.status(400).json({ message: "缺少必要的欄位" });
  }

  try {
    const newReservation = await prisma.reservation.create({
      data: {
        classroomId: classroomId,
        userName: userName, // 第六步會用 userId 取代
        purpose: purpose,
        date: new Date(date), // (重要) 將 ISO 字串轉換為 Date 物件
        timeSlot: timeSlot,
        // userId: null (目前先不填)
      },
    });
    res.status(201).json(newReservation); // 201 Created
  } catch (error) {
    console.error(error); // 在後端日誌中印出詳細錯誤
    res.status(500).json({ message: "建立預約失敗" });
  }
});
