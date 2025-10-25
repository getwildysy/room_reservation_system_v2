# ---- 1. Builder 階段 ----
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
# 安裝所有依賴 (包含 devDependencies)
RUN npm install
COPY . .
# 在 builder 階段產生 Prisma Client (確保 schema.prisma 已複製)
RUN npx prisma generate
# 編譯 TypeScript
RUN npm run build

# ---- 2. Final (Production) 階段 ----
FROM node:20-alpine AS final
WORKDIR /usr/src/app
COPY package*.json ./
# 只安裝 production 依賴 (@prisma/client 在這裡)
RUN npm install --only=production

# 從 builder 複製編譯好的 dist 目錄
COPY --from=builder /usr/src/app/dist ./dist

# --- vvv (關鍵) 複製 builder 階段產生的 Prisma Client 和引擎 vvv ---
# 這會包含 node_modules/.prisma/client/schema.prisma
# 以及 node_modules/.prisma/client/libquery_engine-... (引擎檔案)
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
# --- ^^^ (關鍵) 複製 builder 階段產生的 Prisma Client 和引擎 ^^^ ---

# (可選但推薦) 複製 schema.prisma 供參考或未來 migrate 使用
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3001
CMD [ "node", "dist/index.js" ]