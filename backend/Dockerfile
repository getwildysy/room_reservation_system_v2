# ---- 1. Builder 階段 ----
# 使用 'builder' 這個名稱
FROM node:20-alpine AS builder

# 設定工作目錄
WORKDIR /usr/src/app

# 複製 package.json 和 lock 檔案
COPY package*.json ./

# 安裝所有依賴 (包含 devDependencies)
RUN npm install

# 複製所有原始碼
COPY . .

# (新) 在執行 build 或 test 之前，必須先產生 Prisma Client
RUN npx prisma generate

# 執行 TypeScript 編譯
RUN npm run build

# ---- 2. Final (Production) 階段 ----
# 使用 'final' 這個名稱
FROM node:20-alpine AS final

WORKDIR /usr/src/app

# 僅複製 production 依賴的 package.json
COPY package*.json ./

# 只安裝 production 依賴
RUN npm install --only=production

# 從 'builder' 階段複製編譯好的 'dist' 目錄
COPY --from=builder /usr/src/app/dist ./dist

# 後端伺服器運行的 port
EXPOSE 3001

# 容器啟動時執行的指令 (運行編譯後的 JS 檔案)
CMD [ "node", "dist/index.js" ]