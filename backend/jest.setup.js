// V2/backend/jest.setup.js

// 引入 dotenv
const dotenv = require("dotenv");

// 引入 path 來處理檔案路徑
const path = require("path");

// 明確地載入 .env 檔案
// __dirname 指的是 'jest.setup.js' 所在的目錄 (也就是 V2/backend)
// path.resolve 會組合出完整的絕對路徑
const envPath = path.resolve(__dirname, ".env");

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Error loading .env file for Jest:", result.error);
}

// (可選) 檢查 JWT_SECRET 是否真的被載入了
// console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
