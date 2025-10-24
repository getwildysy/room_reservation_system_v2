import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ClassroomList from "./ClassroomList";
import { Classroom } from "../types";

// 模擬 (Mock) Icons 元件，避免 SVG 相關錯誤
jest.mock("./Icons", () => ({
  ComputerIcon: () => <svg data-testid="computer-icon" />,
  UsersIcon: () => <svg data-testid="users-icon" />,
}));

// 準備模擬資料
const mockClassrooms: Classroom[] = [
  { id: "c1", name: "電腦教室 (A)", capacity: 40, color: "#3b82f6" },
  { id: "c2", name: "物理實驗室", capacity: 30, color: "#10b981" },
];

describe("ClassroomList Component", () => {
  it("應該正確渲染教室列表並處理點擊事件", () => {
    // 建立一個 Jest 模擬函式
    const handleSelectMock = jest.fn();

    render(
      <ClassroomList
        classrooms={mockClassrooms}
        selectedClassroomId="c1" // 預設選取 c1
        onSelectClassroom={handleSelectMock}
      />,
    );

    // 1. 驗證所有教室名稱都已渲染
    expect(screen.getByText("電腦教室 (A)")).toBeInTheDocument();
    expect(screen.getByText("物理實驗室")).toBeInTheDocument();

    // 2. 驗證容量已渲染
    expect(screen.getByText("40 人")).toBeInTheDocument();

    // 3. 驗證 'c1' (已選取) 具有正確的樣式
    const selectedButton = screen.getByText("電腦教室 (A)").closest("button");
    expect(selectedButton).toHaveClass("bg-blue-600 text-white");

    // 4. 驗證 'c2' (未選取) 具有正確的樣式
    const notSelectedButton = screen.getByText("物理實驗室").closest("button");
    expect(notSelectedButton).toHaveClass("bg-gray-100 text-gray-800");

    // 5. 模擬點擊 'c2' (未選取的按鈕)
    fireEvent.click(notSelectedButton);

    // 6. 驗證 onSelectClassroom 函式被呼叫，且參數為 'c2'
    expect(handleSelectMock).toHaveBeenCalledTimes(1);
    expect(handleSelectMock).toHaveBeenCalledWith("c2");
  });
});
