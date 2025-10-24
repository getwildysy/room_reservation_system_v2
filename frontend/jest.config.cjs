/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  // 執行測試前運行的 setup 檔案
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleNameMapper: {
    // 處理 tsconfig.json 中的路徑別名
    "^@/(.*)$": "<rootDir>/$1",
  },
};
