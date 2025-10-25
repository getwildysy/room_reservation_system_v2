/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["./jest.setup.js"],
  // 1. 這是為了解決 'import' 語法 (SyntaxError)
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
        },
      },
    ],
  },

  // 2. 這是為了解決 "Cannot find module './app.js'"
  //    (告訴 Jest 如何處理 .js 副檔名)
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
