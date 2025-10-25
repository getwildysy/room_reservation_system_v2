import { Router } from "express";
import { prisma } from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken } from "./auth.middleware.js"; // 導入我們上一步建立的中介軟體
import type { Request, Response } from "express";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "r122957101";

// --- 1. 註冊 (Register) ---
router.post("/register", async (req: Request, res: Response) => {
  // vvv 把您所有的程式碼都放進 try 區塊 vvv
  try {
    const { email, password, name } = req.body;

    // (您原本的檢查 Email 邏輯...)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "此 Email 已經被註冊" });
    }

    // (您原本的 Hash 密碼邏輯...)
    const hashedPassword = await bcrypt.hash(password, 10);

    // (您原本的建立使用者邏輯...)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword, // (確保這是您正確的欄位名稱)
        name,
      },
    });

    // (您原本的產生 Token 邏輯...)
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string, // 加上 'as string'
      { expiresIn: "1h" },
    );

    // (您原本的回傳 201 邏輯...)
    // (為了安全，不要在回傳時包含 passwordHash)
    const userWithoutPassword = { ...user };
    // @ts-ignore
    delete userWithoutPassword.passwordHash;

    res.status(201).json({ ...userWithoutPassword, token });
  } catch (error) {
    // vvv 這是關鍵的 catch 區塊 vvv

    // 這裡會把真正的錯誤印在 Jest 終端機上！
    console.error("!!! /register 路由崩潰, 原因:", error);

    // 回傳 500 並附上錯誤訊息
    res.status(500).json({
      message: "伺服器內部錯誤",
      error: (error as Error).message, // 將錯誤訊息回傳
    });
  }
});

// --- 2. 登入 (Login) ---
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email 和密碼為必填" });
  }

  try {
    // 尋找使用者
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Email 或密碼錯誤" }); // 401 Unauthorized
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email 或密碼錯誤" });
    }

    // 產生 JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "1d" }, // Token 有效期限 1 天
    );

    // 回傳 Token 和使用者基本資料 (不含密碼)
    // 建立不含密碼的使用者物件
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
    }; // 回傳扁平的結構 (token 和 user 屬性在同一層)

    res.status(200).json({
      token,
      ...userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ message: "登入時發生錯誤" });
  }
});

// --- 3. (新) 受保護的路由 ---
router.get("/me", authenticateToken, (req: Request, res: Response) => {
  res.status(200).json({ message: "你已成功存取受保護的路由" });
});

export default router;
