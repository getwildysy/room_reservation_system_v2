# ---- 1. Build 階段 ----
FROM node:20-alpine AS build

WORKDIR /app

# 複製 package.json 和 lock 檔案
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製所有原始碼
COPY . .

# 執行 Vite build
RUN npm run build

# ---- 2. Serve 階段 ----
FROM nginx:stable-alpine

# 從 'build' 階段複製建置好的靜態檔案到 Nginx 的預設目錄
COPY --from=build /app/dist /usr/share/nginx/html

# 複製 Nginx 設定檔 (我們下一步會建立它)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx 運行的 port
EXPOSE 80

# 啟動 Nginx
CMD ["nginx", "-g", "daemon off;"]