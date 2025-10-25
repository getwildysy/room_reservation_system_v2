# 專案測試除錯紀錄 (debug.md)

這份文件紀錄了將一個 Node.js + TypeScript + Prisma 專案的 Jest 測試從 0 通過到 100% 通過的完整除錯過程。

## 階段一：解決 Jest 無法辨識 TypeScript 的問題

**初始錯誤：** `SyntaxError: Cannot use import statement outside a module` (發生在 `app.test.ts`)

**根本原因：** Jest 原生只看得懂 JavaScript (CommonJS)，它看不懂 TypeScript (`.ts`) 的 `import` 語法。

**解決步驟：**

1.  **安裝 `ts-jest`**：安裝 `ts-jest` 和 `@types/jest`，讓 Jest 獲得處理 `.ts` 檔案的能力。
    ```bash
    npm install --save-dev ts-jest @types/jest
    ```
2.  **建立 `jest.config.js`**：在 `backend` 根目錄建立 `jest.config.js`。
    ```javascript
    /** @type {import('ts-jest').JestConfigWithTsJest} */
    module.exports = {
      preset: "ts-jest",
      testEnvironment: "node",
    };
    ```
3.  **再次失敗 (同樣錯誤)**：錯誤依舊是 `SyntaxError`。
4.  **分析**：`ts-jest` 雖然啟動了，但它可能預設遵循了 `tsconfig.json` 中的 `"module": "ESNext"` 設定。Jest 在 Node.js 環境中執行，需要 `CommonJS` 模組。
5.  **修正 `jest.config.js`**：強制 `ts-jest` 在測試時將 TypeScript 轉譯為 `CommonJS`。
    `javascript
    /** @type {import('ts-jest').JestConfigWithTsJest} */
    module.exports = {
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: { // <-- 新增 transform
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: {
              module: 'commonjs', // <-- 強制使用 commonjs
            },
          },
        ],
      },
    };
    `
    **結果：** `SyntaxError` 解決。

---

## 階段二：解決 `npm run build` 和 `npm test` 的模組衝突

**新錯誤 (來自 `npm test`)：** `Cannot find module './app.js' from 'src/api.test.ts'`

**根本原因：**

1.  **`npm run build` (tsc)**：根據 `tsconfig.json` 的 `"moduleResolution": "node16"` (或 `nodenext`)，**強制**要求 `import` 必須包含 `.js` 副檔名 (例如 `import './app.js'`)。
2.  **`npm test` (ts-jest)**：在我們上一步的 `commonjs` 模式下，它會去 `src` 目錄尋找真正的 `.js` 檔案，但只找到了 `.ts`，因此失敗。

**解決步驟 (兩面手法)：**

1.  **修正程式碼**：將 `src` 目錄下**所有**的相對路徑 `import` 都**加上 `.js` 副檔名**。

    ```typescript
    // 例如：src/app.ts
    import authRouter from "./auth.routes.js"; // <-- 加上 .js
    import { prisma } from "./db.js"; // <-- 加上 .js
    ```

    - **結果**：`npm run build` **通過**。

2.  **修正 `jest.config.js`**：欺騙 Jest。告訴它當看到 `.js` 匯入時，實際上要去尋找 `.ts` 檔案。
    ```javascript
    /\*_ @type {import('ts-jest').JestConfigWithTsJest} _/
    module.exports = {
    // ... (preset, testEnvironment, transform)
          // vvv 新增 moduleNameMapper vvv
          moduleNameMapper: {
            '^(\\.{1,2}/.*)\\.js$': '$1', // 將 ./file.js 轉譯為 ./file
          },
        };
        ```
    **結果：** `npm run build` 和 `npm test` 都能正確解析模組。

---

## 階段三：解決環境與依賴問題

**新錯誤 (來自 `npm test`)：**

1.  `Cannot find module 'bcryptjs'`
2.  `Cannot find module 'jsonwebtoken'`

**根本原因：** 專案缺少執行 `auth.routes.ts` 所需的核心依賴。

**解決步驟：**

1.  安裝 `bcryptjs` 及其型別：
    ```bash
    npm install bcryptjs
    npm install --save-dev @types/bcryptjs
    ```
2.  安裝 `jsonwebtoken` 及其型別：
    `bash
    npm install jsonwebtoken
    npm install --save-dev @types/jsonwebtoken
    `
    **結果：** 依賴問題解決。

---

## 階段四：解決資料庫連線

**新錯誤 (來自 `npm test`)：** `PrismaClientInitializationError: Can't reach database server at localhost:5432`

**根本原因：** 整合測試 (Integration Tests) 需要連線到**真實**的資料庫，但資料庫伺服器 (PostgreSQL) 沒有在執行。

**解決步驟：**

1.  使用者確認資料庫 (透過 Docker) 處於停止狀態。
2.  使用者啟動資料庫容器。

**結果：** 資料庫連線成功。`src/api.test.ts` **全數通過 (PASS)**。

---

## 階段五：解決 `500` 伺服器內部錯誤

**新錯誤 (來自 `src/auth.test.ts`)：**

- `POST /register`：預期 `201`，收到 `500`。
- `POST /login`：預期 `200`，收到 `500`。

**根本原因：** `500` 錯誤代表伺服器程式碼 (API 路由) 發生了未被捕捉的崩潰 (Crash)。

**解決步驟 (逐層深入)：**

1.  **猜測 1：`JWT_SECRET` 未定義。**

    - **方法**：檢查 `.env` 檔案。
    - **結果**：使用者回報 `.env` 檔案中**有** `JWT_SECRET`。

2.  **猜測 2：`dotenv` 在 `npm test` 時未載入。**

    - **方法**：建立 `jest.setup.js` 檔案，並在 `jest.config.js` 中設定 `setupFiles: ['./jest.setup.js']`，以強制 Jest 在啟動時讀取 `.env`。
    - **結果**：Jest 成功載入 (2) 個環境變數，但 `500` 錯誤依舊。

3.  **猜測 3：`500` 錯誤與 `JWT_SECRET` 無關，是其他原因導致的崩潰。**
    - **方法**：修改 `src/auth.routes.ts`，將 `/register` 路由的**所有**程式碼用 `try...catch` 包裹，並在 `catch` 區塊中 `console.error(error)`。
    - **結果**：`try...catch` 成功捕捉到**真正的錯誤**！

**新錯誤 (來自 `console.error`)：**
`PrismaClientKnownRequestError: ... The column \`User.passwordHash\` does not exist in the current database.`

**根本原因：** 專案的「藍圖 (`schema.prisma`)」和「實際的資料庫」不同步。`schema.prisma` 中有 `passwordHash` 欄位，但資料庫的 `User` 表中沒有。

**解決步驟：**

1.  執行 Prisma 遷移指令，將 `schema.prisma` 的變更套用到資料庫。
    ```bash
    npx prisma migrate dev
    ```
2.  為遷移命名 (例如：`add_password_hash`) 並執行。

**結果：** 資料庫結構更新。**所有 `500` 錯誤消失。**

---

## 階段六：解決最後的 API 邏輯錯誤

**新錯誤 (來自 `src/auth.test.ts`)：**

1.  `POST /register`：`Expected: "test@example.com", Received: undefined` (第 27 行)
2.  `GET /me`：`Expected: 200, Received: 401` (第 96 行)

**根本原因：**

1.  **錯誤 1**：API 回傳的是「巢狀」JSON (`{ user: { email: ... } }`)，但測試期望「扁平」JSON (`{ email: ... }`)。
2.  **錯誤 2**：`GET /me` 測試依賴 `POST /login` 測試先執行並設定共用 `token` 變數。但 Jest 不保證順序，導致 `token` 是 `undefined`，API 正確回傳 `401` (未授權)。

**解決步驟：**

1.  **修正 API 回應**：修改 `src/auth.routes.ts` 中的 `/register` 和 `/login` 路由，使用 `...` 展開運算子回傳**扁平**的 JSON 結構。

    ```typescript
    // 修改前: res.json({ token, user: { ... } });
    // 修改後:
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    res.json({ token, ...userWithoutPassword });
    ```

    - **結果**：錯誤 1 解決。

2.  **修正測試獨立性**：重寫 `GET /me` 測試，使其「各自獨立」。該測試現在會在內部自己執行「註冊」和「登入」來取得 `token`，不再依賴其他測試。
    ```typescript
    it("帶有有效 Token 存取應成功 (回傳 200)", async () => {
      // 1. 在此測試內部註冊
      await request(app).post("/api/auth/register")...
      // 2. 在此測試內部登入
      const loginRes = await request(app).post("/api/auth/login")...
      const token = loginRes.body.token; // <-- 確保能拿到 token
      // 3. 執行 /me 測試
      const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
      // 4. 驗證
      expect(res.statusCode).toBe(200);
    });
    ```

## 最終結果
