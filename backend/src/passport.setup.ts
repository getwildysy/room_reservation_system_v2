import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { prisma } from "./db.js"; // 匯入 Prisma Client
import jwt from "jsonwebtoken";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !JWT_SECRET) {
  throw new Error("Google OAuth 或 JWT 環境變數未設定");
}

// 設定 Passport Google OAuth 2.0 策略
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      // (重要) 這個回呼 URL 必須與您在 Google Cloud Console 中設定的完全一致
      callbackURL: "/api/auth/google/callback", // 根據我們的路由規劃
      scope: ["profile", "email"], // 要求獲取使用者的基本資料和 email
    },
    async (
      accessToken: string,
      refreshToken: string | undefined, // refreshToken 可能不存在
      profile: Profile, // 使用導入的 Profile 型別
      done: VerifyCallback, // 使用導入的 VerifyCallback 型別
    ) => {
      // 這個函式會在 Google 成功驗證使用者後被呼叫
      // profile 物件包含了從 Google 獲取的用戶資訊
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        // const googleId = profile.id; // Google 的使用者唯一 ID (可選儲存)

        if (!email) {
          return done(new Error("無法從 Google 獲取 Email"), undefined);
        }

        // 1. 嘗試尋找是否已有此 Email 的使用者
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // 2. 如果使用者不存在，就建立一個新使用者
          // 注意：因為是 Google 登入，我們需要處理 passwordHash 欄位
          // 方案 A：如果 passwordHash 在 schema.prisma 是可選的 (String?)
          // 則不需要特別處理 passwordHash
          // 方案 B：如果 passwordHash 是必填的 (String)
          // 則需要給一個特殊值，表示此帳號是透過 OAuth 建立的
          user = await prisma.user.create({
            data: {
              email: email,
              name: name,
              // googleId: googleId, // 如果您在 User model 加入 googleId 欄位
              // 根據您的 schema.prisma, passwordHash 是必填
              passwordHash: `GOOGLE_AUTH_${Date.now()}`, // 給一個特殊值
            },
          });
        }
        // 3. (可選) 如果使用者已存在，但 passwordHash 是特殊值，您可以更新 name (如果 Google 提供了新的)
        // else if (user.passwordHash.startsWith('GOOGLE_AUTH_')) {
        //   // Potentially update user.name if it changed in Google profile
        // }
        // 4. (可選) 如果使用者已存在且有 passwordHash (代表是 Email/密碼註冊的帳號)
        // else {
        //   // 您可以選擇允許同一個 Email 透過不同方式登入
        //   // 或者在這裡回傳錯誤，提示使用者應使用 Email/密碼登入
        // }

        // 5. 為找到的或新建立的使用者產生 JWT Token
        const tokenPayload = { userId: user.id, email: user.email };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" });

        // 6. 將使用者資料和 token 傳遞給 Passport (會附加到 req.user)
        // 我們傳遞 token，這樣 callback 路由可以直接使用
        return done(null, { user, token });
      } catch (error) {
        return done(error, undefined);
      }
    },
  ),
);

// (可選) 設定序列化和反序列化使用者
// 對於 JWT 為主的 API 驗證，這通常不是必需的
// passport.serializeUser((user, done) => {
//   done(null, (user as any).user.id); // 注意這裡的結構是 { user, token }
// });
// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await prisma.user.findUnique({ where: { id: id as string } });
//     done(null, user); // 只回傳 user 物件
//   } catch (error) {
//     done(error, null);
//   }
// });

export default passport; // 導出設定好的 passport 實例
