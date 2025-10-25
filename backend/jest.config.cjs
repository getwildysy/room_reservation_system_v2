/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // 1. 使用 ts-jest 的 *預設* preset，而不是 ESM preset
  preset: "ts-jest",

  testEnvironment: "node",

  // 2. 配置 ts-jest 的轉換器
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        // 3. (關鍵) 覆寫 tsconfig.json 的設定，
        //    強制 ts-jest 為測試編譯出 CommonJS 模組
        tsconfig: {
          module: "commonjs",
          esModuleInterop: true, // 允許 'import request from "supertest"' 這種 CJS 導入
        },
      },
    ],
  },

  // 4. (仍然需要) 處理我們在程式碼中寫的 '.js' 擴充檔名
  //    這會將 'import { app } from ./app.js' 映射到 './app'
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
