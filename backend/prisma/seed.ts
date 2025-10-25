import { PrismaClient } from "@prisma/client";

// 建立 Prisma Client 實例
const prisma = new PrismaClient();

// 這些資料來自我們最一開始的 frontend/App.tsx
const initialClassrooms = [
  { id: "c1", name: "電腦教室 (A)", capacity: 40, color: "#3b82f6" },
  { id: "c2", name: "物理實驗室", capacity: 30, color: "#10b981" },
  { id: "c3", name: "音樂教室", capacity: 50, color: "#8b5cf6" },
  { id: "c4", name: "美術教室", capacity: 35, color: "#ef4444" },
  { id: "c5", name: "語言教室", capacity: 40, color: "#f97316" },
];

async function main() {
  console.log(`開始填充資料...`);

  // 我們使用 upsert (update or insert)
  // 這能確保如果 seed 腳本重複執行，也不會建立重複的資料
  for (const c of initialClassrooms) {
    const classroom = await prisma.classroom.upsert({
      where: { id: c.id }, // 根據 ID 尋找
      update: c, // 如果找到了，就用新資料更新
      create: c, // 如果沒找到，就建立新資料
    });
    console.log(`建立或更新教室 id: ${classroom.id} (${classroom.name})`);
  }

  console.log(`資料填充完成。`);
}

// 執行 main 函式並處理錯誤
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // 結束時斷開資料庫連線
    await prisma.$disconnect();
  });
