import { app } from "./app"; // 匯入 app 定義
const port = process.env.PORT || 3001; // 我們將前端設為 3000，後端設為 3001

// 啟動伺服器
app.listen(port, () => {
  console.log(`[server]: 伺服器正在 http://localhost:${port} 上運行`);
});
