import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "r122957101";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 從 Authorization 標頭獲取 token
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (token == null) {
    return res.status(401).json({ message: "未提供 Token" }); // 401 Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Token 無效或已過期" }); // 403 Forbidden
    }

    // (重要) 我們稍後會修改 Express 的 Request 型別
    // (req as any).user = user;

    next(); // Token 有效，繼續下一個中介軟體或路由
  });
};
