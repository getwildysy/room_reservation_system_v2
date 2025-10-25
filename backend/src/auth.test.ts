import request from "supertest";
import { app } from "./app.js";
import { prisma } from "./db.js";

describe("Auth API 整合測試 (/api/auth)", () => {
  // 在每次測試前，清空 User 表
  beforeEach(async () => {
    await prisma.reservation.deleteMany({}); // (先清空關聯的)
    await prisma.user.deleteMany({});
  });

  // 在所有測試結束後，斷開資料庫連線
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 測試註冊
  describe("POST /api/auth/register", () => {
    it("應該能成功註冊新使用者 (回傳 201)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "password123",
        name: "測試使用者",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.email).toBe("test@example.com");

      // 驗證資料庫
      const user = await prisma.user.findUnique({
        where: { email: "test@example.com" },
      });
      expect(user).not.toBeNull();
      expect(user?.name).toBe("測試使用者");
    });

    it("註冊已存在的 Email 應該失敗 (回傳 409)", async () => {
      // 先建立一個使用者
      await request(app)
        .post("/api/auth/register")
        .send({ email: "test@example.com", password: "password123" });

      // 嘗試用同一個 email 再次註冊
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "test@example.com", password: "password456" });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe("此 Email 已經被註冊");
    });
  });

  // 測試登入
  describe("POST /api/auth/login", () => {
    // 登入前，先註冊一個使用者
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        email: "login@example.com",
        password: "password123",
        name: "登入測試",
      });
    });

    it("使用正確的密碼登入應該成功 (回傳 200 並取得 Token)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@example.com", password: "password123" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.email).toBe("login@example.com");
    });

    it("使用錯誤的密碼登入應該失敗 (回傳 401)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@example.com", password: "wrongpassword" });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Email 或密碼錯誤");
    });
  });

  // 測試受保護的路由
  describe("GET /api/auth/me", () => {
    // (可選) 也可以更新 describe
    let token = "";

    // ... (beforeEach 保持不變) ...
    it("帶有有效 Token 存取應成功 (回傳 200)", async () => {
      // --- 前置作業 (Setup) ---
      // 1. 註冊一個專門給此測試用的新使用者
      await request(app).post("/api/auth/register").send({
        email: "me-test@example.com",
        password: "password123",
        name: "Me User",
      });

      // 2. 登入該使用者以取得 token
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "me-test@example.com", password: "password123" });

      // 3. 從登入的回應中取得 token (確保是扁平結構)
      const token = loginRes.body.token;

      // --- 執行測試 (Test) ---
      // 4. 使用剛剛取得的 token 去存取受保護的 /me 路由
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`); // 現在 token 絕對有值

      // --- 驗證結果 (Assert) ---
      expect(res.statusCode).toBe(200);
      // vvv Replace this line vvv
      // expect(res.body.message).toBe("你已成功存取受保護的路由");
      // vvv With these lines vvv
      expect(res.body.email).toBe("me-test@example.com"); // Check for email
      expect(res.body.name).toBe("Me User"); // Check for name
      expect(res.body).toHaveProperty("id"); // Check if ID exists
      expect(res.body).not.toHaveProperty("passwordHash"); // Ensure password is NOT returned
    });
  });
});
