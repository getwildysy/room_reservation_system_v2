import request from "supertest";
import { app } from "./app.js"; // 匯入我們的主應用程式實例

describe("GET /api", () => {
  it("應該回傳 200 OK 並包含歡迎訊息", async () => {
    const res = await request(app).get("/api");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("歡迎來到專科教室借用系統 API");
  });
});
