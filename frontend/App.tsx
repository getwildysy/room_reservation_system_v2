import React, { useState, useMemo, useEffect } from "react";
import { Classroom, Reservation } from "./types";
import Header from "./components/Header";
import ClassroomList from "./components/ClassroomList";
import ScheduleCalendar from "./components/ScheduleCalendar";
import BookingModal from "./components/BookingModal";

// API 基礎 URL (請確保你的後端伺服器在 3001 port)
const API_URL = "http://localhost:3001/api";

type SelectedSlot = { date: Date; timeSlot: string };

const App: React.FC = () => {
  // --- 狀態初始化 ---
  // 將 state 初始化為空陣列
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  // 將 selectedClassroomId 初始化為空字串
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- 新增：資料獲取 (Effect) ---
  useEffect(() => {
    async function fetchData() {
      try {
        const [classroomsRes, reservationsRes] = await Promise.all([
          fetch(`${API_URL}/classrooms`),
          fetch(`${API_URL}/reservations`),
        ]);

        const classroomsData: Classroom[] = await classroomsRes.json();
        const reservationsData: Reservation[] = await reservationsRes.json();

        setClassrooms(classroomsData);
        setReservations(reservationsData);

        // 在資料載入後，預設選擇第一間教室
        if (classroomsData.length > 0) {
          setSelectedClassroomId(classroomsData[0].id);
        }
      } catch (error) {
        console.error("無法從 API 獲取資料:", error);
      }
    }
    fetchData();
  }, []); // 空依賴陣列，僅在 component mount 時執行一次

  // --- useMemo 保持不變 ---
  const selectedClassroom = useMemo(
    () => classrooms.find((c) => c.id === selectedClassroomId),
    [classrooms, selectedClassroomId],
  );

  // --- handleSelectClassroom 保持不變 ---
  const handleSelectClassroom = (id: string) => {
    setSelectedClassroomId(id);
    setSelectedSlots([]);
  };

  // --- handleDateChange 保持不變 ---
  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  // --- handleToggleSlot 保持不變 ---
  const handleToggleSlot = (date: Date, timeSlot: string) => {
    setSelectedSlots((prev) => {
      const exists = prev.some(
        (s) => s.date.getTime() === date.getTime() && s.timeSlot === timeSlot,
      );
      if (exists) {
        return prev.filter(
          (s) =>
            !(s.date.getTime() === date.getTime() && s.timeSlot === timeSlot),
        );
      } else {
        return [...prev, { date, timeSlot }];
      }
    });
  };

  // --- handleClearSelection 保持不變 ---
  const handleClearSelection = () => {
    setSelectedSlots([]);
  };

  // --- handleOpenModal 保持不變 ---
  const handleOpenModal = () => {
    if (selectedSlots.length > 0) {
      setIsModalOpen(true);
    }
  };

  // --- handleCloseModal 保持不變 ---
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // --- 更新：handleAddReservation (改為 POST 請求) ---
  const handleAddReservation = async (details: {
    userName: string;
    purpose: string;
  }) => {
    if (selectedClassroomId && selectedSlots.length > 0) {
      const newReservationPromises = selectedSlots.map((slot) => {
        const { date, timeSlot } = slot;
        const newReservationData = {
          classroomId: selectedClassroomId,
          userName: details.userName,
          purpose: details.purpose,
          date: `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`,
          timeSlot: timeSlot,
        };

        return fetch(`${API_URL}/reservations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReservationData),
        }).then((res) => {
          if (!res.ok) {
            throw new Error("預約失敗");
          }
          return res.json();
        });
      });

      try {
        const createdReservations: Reservation[] = await Promise.all(
          newReservationPromises,
        );

        // 將後端回傳的新預約資料加入到本地 state
        setReservations((prev) => [...prev, ...createdReservations]);
        handleClearSelection();
        handleCloseModal();
      } catch (error) {
        console.error("建立預約時發生錯誤:", error);
        // 可以在此處顯示錯誤訊息給使用者
      }
    }
  };

  // --- JSX (Return) 保持不變 ---
  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="max-w-7xl mx-auto w-full flex-grow min-h-0 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6 h-full">
          <div className="md:w-1/3 lg:w-1/4 flex-shrink-0">
            {/* 新增：在教室資料載入前顯示 loading */}
            {classrooms.length === 0 ? (
              <p>教室列表載入中...</p>
            ) : (
              <ClassroomList
                classrooms={classrooms}
                selectedClassroomId={selectedClassroomId}
                onSelectClassroom={handleSelectClassroom}
              />
            )}
          </div>
          <div className="flex-1 min-h-0 min-w-0">
            <ScheduleCalendar
              classroom={selectedClassroom}
              date={currentDate}
              reservations={reservations}
              selectedSlots={selectedSlots}
              onToggleSlot={handleToggleSlot}
              onConfirmBooking={handleOpenModal}
              onClearSelection={handleClearSelection}
              onDateChange={handleDateChange}
            />
          </div>
        </div>
      </main>
      <BookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddReservation}
        classroom={selectedClassroom}
        selectedSlots={selectedSlots}
      />
    </div>
  );
};

export default App;
