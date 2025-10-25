import type { Request, Response, NextFunction } from "express"; // <-- 加入 type
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET as string;

// 定義一個擴充的 Request 型別，包含 user 屬性
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    // 之後可以加入 role 等更多資訊
  };
}

// JWT 驗證中介軟體
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  // 1. 從 Authorization 標頭獲取 token
  const authHeader = req.headers["authorization"];
  // 標頭格式通常是 "Bearer TOKEN"
  const token = authHeader && authHeader.split(" ")[1];

  // 2. 如果沒有 token，回傳 401 Unauthorized
  if (token == null) {
    return res.status(401).json({ message: "未提供授權 Token" });
  }

  try {
    // 3. 驗證 Token
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      iat: number;
      exp: number;
    };

    // 4. (可選但推薦) 檢查使用者是否存在於資料庫中
    // 這可以防止使用已被刪除的使用者的舊 Token
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true }, // 只選取必要的欄位
    });

    if (!user) {
      return res.status(403).json({ message: "無效的 Token (使用者不存在)" }); // 403 Forbidden
    }
    // console.log("Middleware: User found in DB:", user); // 印出從 Prisma 拿到的 user
    // console.log("Middleware: Assigning user ID:", user.id); // 確認 user.id 是否存在
    // 5. 將解析出的使用者資訊附加到 req 物件上
    req.user = user;

    // 6. 呼叫 next() 讓請求繼續流向路由處理器
    next();
  } catch (err) {
    // 7. 如果 jwt.verify 失敗 (例如 Token 過期或無效)，回傳 403 Forbidden
    console.error("Token 驗證失敗:", err);
    return res.status(403).json({ message: "無效或過期的 Token" });
  }
};
