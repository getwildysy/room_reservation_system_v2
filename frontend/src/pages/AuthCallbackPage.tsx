import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AuthCallbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 從 URL 查詢參數中讀取 token
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      console.log("從後端接收到的 Token:", token);
      // TODO: 在這裡儲存 Token (例如 localStorage)
      // TODO: 更新應用程式的登入狀態
      // TODO: 將使用者導向回主頁面或之前的頁面
      localStorage.setItem("authToken", token); // 範例：存到 localStorage
      navigate("/"); // 導向回首頁
    } else {
      console.error("未在回呼 URL 中找到 Token");
      // TODO: 處理錯誤情況，例如導向回登入頁並顯示錯誤
      navigate("/login?error=callback_failed");
    }
  }, [location, navigate]);

  return <div>正在處理登入，請稍候...</div>;
};

export default AuthCallbackPage;
