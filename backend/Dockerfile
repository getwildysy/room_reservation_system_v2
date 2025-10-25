# ---- 1. Builder 階段 ----
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
# (重要) 安裝 *所有* 依賴，包含 devDependencies 以便執行 build
RUN npm install
COPY . .
# (移除) 不在這裡 generate
# RUN npx prisma generate
RUN npm run build

# ---- 2. Final (Production) 階段 ----
FROM node:20-alpine AS final
WORKDIR /usr/src/app
COPY package*.json ./
# 只安裝 production 依賴 (現在包含 prisma CLI 了)
RUN npm install --only=production

# 從 'builder' 階段複製編譯好的 'dist' 目錄
COPY --from=builder /usr/src/app/dist ./dist

# (移除) 不從 builder 複製 .prisma
# COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# 複製 Prisma schema 到 production 映像檔中
COPY --from=builder /usr/src/app/prisma ./prisma

# --- vvv 請新增這一行 vvv ---
# 在 final 階段、安裝完 production 依賴後，產生 Prisma Client
RUN npx prisma generate
# --- ^^^ 請新增這一行 ^^^ ---

EXPOSE 3001
CMD [ "node", "dist/index.js" ]