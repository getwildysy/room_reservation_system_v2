import request from "supertest";
import { app } from "./app.js";
import { prisma } from "./db.js"; // 匯入我們的 Prisma client

describe("專科教室 API 整合測試 (使用資料庫)", () => {
  // 在所有測試開始前，連接資料庫
  beforeAll(async () => {
    await prisma.$connect();
  });

  // 在每次測試前，清空 Reservation 表
  // (我們不清空 Classroom，因為那是 seed 資料)
  beforeEach(async () => {
    await prisma.reservation.deleteMany({});
  });

  // 在所有測試結束後，斷開資料庫連線
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 測試 GET /api/classrooms
  describe("GET /api/classrooms", () => {
    it("應該回傳 200 OK 並包含教室列表 (來自 Seed)", async () => {
      const res = await request(app).get("/api/classrooms");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(5); // 應該等於我們 seed.ts 中的 5 筆
      expect(res.body[0].name).toBe("電腦教室 (A)");
    });
  });

  // 測試 GET /api/reservations
  describe("GET /api/reservations", () => {
    it("在清空後，應該回傳 200 OK 且預約列表為空", async () => {
      const res = await request(app).get("/api/reservations");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0); // 應為 0 (已被 beforeEach 清空)
    });
  });

  // 測試 POST /api/reservations
  describe("POST /api/reservations", () => {
    it("應該能成功建立一筆新預約並回傳 201", async () => {
      const newReservation = {
        classroomId: "c1", // 必須是 seed.ts 中存在的 ID
        userName: "測試者",
        purpose: "測試用",
        date: "2025-10-30T00:00:00.000Z", // 使用 ISO 8601 格式
        timeSlot: "第一節",
      };

      const res = await request(app)
        .post("/api/reservations")
        .send(newReservation);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.userName).toBe("測試者");

      // (驗證) 檢查資料庫中是否真的多了一筆
      const dbReservations = await prisma.reservation.findMany({});
      expect(dbReservations.length).toBe(1);
      expect(dbReservations[0].purpose).toBe("測試用");
    });

    it("當缺少必要欄位時，應該回傳 400 錯誤", async () => {
      const badReservation = {
        classroomId: "c2",
        userName: "訪客",
        // 缺少 purpose, date, timeSlot
      };

      const res = await request(app)
        .post("/api/reservations")
        .send(badReservation);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("缺少必要的欄位");
    });
  });
});
