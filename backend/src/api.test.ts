import request from "supertest";
import { app } from "./app";
// 雖然我們在這裡不直接用，但匯入它可以幫助 ts-jest 識別型別
import { Classroom, Reservation } from "./data";

describe("專科教室 API 整合測試", () => {
  // 測試 GET /api/classrooms
  describe("GET /api/classrooms", () => {
    it("應該回傳 200 OK 並包含教室列表", async () => {
      const res = await request(app).get("/api/classrooms");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty("id");
      expect(res.body[0]).toHaveProperty("name");
    });
  });

  // 測試 GET /api/reservations
  describe("GET /api/reservations", () => {
    it("應該回傳 200 OK 並包含預約列表", async () => {
      const res = await request(app).get("/api/reservations");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // 根據 data.ts，初始應該有 3 筆預約
      expect(res.body.length).toBe(3);
    });
  });

  // 測試 POST /api/reservations
  describe("POST /api/reservations", () => {
    it("應該能成功建立一筆新預約並回傳 201", async () => {
      const newReservation = {
        classroomId: "c1",
        userName: "測試者",
        purpose: "測試用",
        date: "2025-10-30",
        timeSlot: "第一節",
      };

      const res = await request(app)
        .post("/api/reservations")
        .send(newReservation);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.userName).toBe("測試者");
    });

    it("建立預約後，GET /api/reservations 應該多一筆資料", async () => {
      // 注意：這個測試依賴於前一個測試的執行狀態
      // （因為我們用的是記憶體陣列，在 Step 4 換成資料庫會改善）
      const res = await request(app).get("/api/reservations");
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(4); // 3 (初始) + 1 (上個測試)
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
