import { Router } from "express";
import { prisma } from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken, AuthRequest } from "./auth.middleware.js"; // 導入我們上一步建立的中介軟體
import passport from "./passport.setup.js";
import type { Request, Response } from "express";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "r122957101";
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables.");
}

// --- 1. 註冊 (Register) ---
// POST /api/auth/register (註冊新使用者)
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // 1. 驗證基本輸入
    if (!email || !password) {
      return res.status(400).json({ message: "Email 和密碼為必填欄位" });
    }

    // 2. 檢查 Email 是否已被註冊
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "此 Email 已經被註冊" });
    }

    // 3. 密碼雜湊
    const hashedPassword = await bcrypt.hash(password, 10); // 10 是 salt 'rounds'

    // 4. 建立新使用者
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword, // 儲存雜湊後的密碼
        name,
      },
    });

    // 5. 產生 JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email }, // Token 包含的資料 (payload)
      JWT_SECRET, // 使用 .env 中的密鑰
      { expiresIn: "1d" }, // Token 有效期限 1 天
    );

    // 6. 移除回傳物件中的密碼
    // (這是一個好習慣，永遠不要把 passwordHash 回傳給前端)
    const userWithoutPassword = { ...user };
    // @ts-ignore (TypeScript 可能會抱怨，但這是安全的)
    delete userWithoutPassword.passwordHash;

    // 7. 回傳 201 Created
    res.status(201).json({ ...userWithoutPassword, token });
  } catch (error) {
    console.error("註冊過程中發生錯誤:", error);
    res.status(500).json({ message: "伺服器內部錯誤" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. 驗證基本輸入
    if (!email || !password) {
      return res.status(400).json({ message: "Email 和密碼為必填" });
    }

    // 2. 尋找使用者
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 3. 如果找不到使用者，或密碼驗證失敗，都回傳相同的錯誤訊息
    //    (避免透露是 Email 不存在還是密碼錯誤)
    if (!user) {
      return res.status(401).json({ message: "Email 或密碼錯誤" }); // 401 Unauthorized
    }

    // 4. 驗證密碼 (使用 bcrypt.compare)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email 或密碼錯誤" });
    }

    // 5. 產生 JWT Token (與註冊時相同)
    const token = jwt.sign(
      { userId: user.id, email: user.email }, // Payload
      JWT_SECRET,
      { expiresIn: "1d" }, // 有效期限
    );

    // 6. 準備回傳的使用者資料 (不含密碼)
    const userWithoutPassword = { ...user };
    // @ts-ignore
    delete userWithoutPassword.passwordHash;

    // 7. 回傳 200 OK
    res.status(200).json({ ...userWithoutPassword, token });
  } catch (error) {
    console.error("登入過程中發生錯誤:", error);
    res.status(500).json({ message: "伺服器內部錯誤" });
  }
});

// GET /api/auth/me (獲取當前使用者資訊 - 受保護)
// 我們將 authenticateToken 中介軟體放在路由處理器之前
router.get(
  "/me",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    // 因為 authenticateToken 成功執行了，
    // 我們可以安全地假設 req.user 存在
    try {
      const userId = req.user?.id;

      if (!userId) {
        // 雖然理論上不該發生，但還是加上
        console.error("錯誤：authenticateToken 通過，但 req.user.id 不存在！");
        return res.status(500).json({ message: "無法識別使用者身份" });
      }

      // (您原本的 prisma.user.findUnique 邏輯...)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, createdAt: true },
      });

      if (!user) {
        // 這個情況應該回傳 404，而不是 500
        return res.status(404).json({ message: "找不到使用者" });
      }

      // (您原本的回傳 200 邏輯...)
      res.status(200).json(user);
    } catch (error) {
      // vvv 這是關鍵的 catch 區塊 vvv

      // 這裡會把真正的錯誤印在 Jest 終端機上！
      console.error("!!! /me 路由崩潰, 原因:", error); // <-- 我們需要看到這個輸出

      // 回傳 500
      res.status(500).json({
        message: "伺服器內部錯誤",
        error: (error as Error).message, // (可選) 附上錯誤訊息
      });
    }
  },
);

// GET /api/auth/google (第一步：重定向到 Google 登入頁面)
// 當前端點擊「使用 Google 登入」按鈕時，應該導向這個 URL
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // 要求權限
    session: false, // 因為我們使用 JWT，不需要 session
  }),
);

// GET /api/auth/google/callback (第二步：Google 驗證後的回呼)
// Google 驗證成功後，會將使用者重導向到這個 URL
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000/login?error=google_failed", // (重要) 驗證失敗時，重導回前端登入頁並帶上錯誤訊息
    session: false, // 同上，不使用 session
  }),
  (req: Request, res: Response) => {
    // 驗證成功！
    // Passport 會將 Google 策略 done() 回呼中傳遞的 { user, token } 附加到 req.user
    const authInfo = req.user as { user: any; token: string };

    if (!authInfo || !authInfo.token) {
      console.error(
        "Google OAuth callback: Missing auth info or token after successful authentication.",
      );
      // 理論上不該發生，但還是重導回前端的錯誤頁面
      return res.redirect(
        "http://localhost:3000/login?error=auth_callback_failed",
      );
    }

    const { token } = authInfo;

    // 成功！我們拿到了 JWT Token
    // 重導向回前端應用程式，並將 token 作為查詢參數
    // 前端需要有一個頁面 (例如 /auth/callback) 來接收這個 token
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
  },
);

export default router;
