import React from "react";
// --- vvv 請新增導入 vvv ---
import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage"; // 導入頁面元件
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
// --- ^^^ 請新增導入 ^^^ ---
import Header from "./components/Header"; // Header 保持全域顯示

const App: React.FC = () => {
  // --- vvv 移除所有原本的 state 和 useEffect vvv ---
  // const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  // ... (移除所有其他的 state 和 useEffect) ...
  // --- ^^^ 移除所有原本的 state 和 useEffect ^^^ ---

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <Header />
      {/* 暫時的導覽列 */}
      <nav className="bg-gray-200 p-2 text-center">
        <Link to="/" className="mr-4">
          首頁
        </Link>
        <Link to="/login" className="mr-4">
          登入
        </Link>
        <Link to="/register">註冊</Link>
      </nav>

      {/* --- vvv 設定路由 vvv --- */}
      <main className="max-w-7xl mx-auto w-full flex-grow min-h-0 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          {/* 之後可以加入 404 Not Found 路由 */}
        </Routes>
      </main>
      {/* --- ^^^ 設定路由 ^^^ --- */}

      {/* --- vvv 移除 BookingModal (它應該屬於 HomePage) vvv --- */}
      {/* <BookingModal ... /> */}
      {/* --- ^^^ 移除 BookingModal ^^^ --- */}
    </div>
  );
};

export default App;
