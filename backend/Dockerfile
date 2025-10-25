# ---- 1. Builder 階段 ----
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# 1. (關鍵) 優先複製 Prisma Schema
COPY prisma ./prisma

# 2. 複製 package.json 和 lock 檔案
COPY package*.json ./

# 3. 安裝所有依賴 (包含 devDependencies)
# (npm install 會自動觸發 package.json 中的 "prepare" 腳本，即 prisma generate)
RUN npm install

# 4. 複製所有剩餘的原始碼 (包含 .ts 檔案)
COPY . .

# 5. 執行 TypeScript 編譯 (tsc 會讀取到正確的 Prisma 型別)
RUN npm run build

# ---- 2. Final (Production) 階段 ----
FROM node:20-alpine AS final
WORKDIR /usr/src/app

# 1. (關鍵) 優先複製 Prisma Schema
COPY prisma ./prisma

# 2. 僅複製 production 依賴的 package.json
COPY package*.json ./

# 3. 只安裝 production 依賴 (也會觸發 prisma generate)
RUN npm install --only=production

# 4. 從 'builder' 階段複製編譯好的 'dist' 目錄
COPY --from=builder /usr/src/app/dist ./dist

# 5. (重要) 從 'builder' 階段複製產生好的 Prisma Client
COPY --from=builder /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client

# 後端伺服器運行的 port
EXPOSE 3001

# 容器啟動時執行的指令 (運行編譯後的 JS 檔案)
CMD [ "node", "dist/index.js" ]