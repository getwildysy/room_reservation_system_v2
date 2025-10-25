import React, { useState, useMemo, useEffect } from "react";
import { Classroom, Reservation } from "../types"; //
import ClassroomList from "../components/ClassroomList"; //
import ScheduleCalendar from "../components/ScheduleCalendar"; //
import BookingModal from "../components/BookingModal"; //

const API_URL = "http://localhost:3001/api";

type SelectedSlot = { date: Date; timeSlot: string };

const HomePage: React.FC = () => {
  // --- vvv 將 App.tsx 的 state 搬過來 vvv ---
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // --- ^^^ 將 App.tsx 的 state 搬過來 ^^^ ---

  // --- vvv 將 App.tsx 的 useEffect 搬過來 vvv ---
  useEffect(() => {
    async function fetchData() {
      try {
        const [classroomsRes, reservationsRes] = await Promise.all([
          fetch(`${API_URL}/classrooms`),
          fetch(`${API_URL}/reservations`),
        ]);

        if (!classroomsRes.ok || !reservationsRes.ok) {
          throw new Error("Network response was not ok");
        }

        const classroomsData: Classroom[] = await classroomsRes.json();
        const reservationsData: Reservation[] = await reservationsRes.json();

        setClassrooms(classroomsData);
        setReservations(reservationsData);

        if (classroomsData.length > 0 && !selectedClassroomId) {
          setSelectedClassroomId(classroomsData[0].id);
        }
      } catch (error) {
        console.error("無法從 API 獲取資料:", error);
        // TODO: Add user-facing error handling
      }
    }
    fetchData();
  }, [selectedClassroomId]); // 依賴 selectedClassroomId，確保在初次設定後觸發
  // --- ^^^ 將 App.tsx 的 useEffect 搬過來 ^^^ ---

  // --- vvv 將 App.tsx 的 useMemo 和 handlers 搬過來 vvv ---
  const selectedClassroom = useMemo(
    () => classrooms.find((c) => c.id === selectedClassroomId),
    [classrooms, selectedClassroomId],
  );

  const handleSelectClassroom = (id: string) => {
    setSelectedClassroomId(id);
    setSelectedSlots([]);
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

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

  const handleClearSelection = () => {
    setSelectedSlots([]);
  };

  const handleOpenModal = () => {
    if (selectedSlots.length > 0) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddReservation = async (details: {
    userName: string;
    purpose: string;
  }) => {
    if (selectedClassroomId && selectedSlots.length > 0) {
      // TODO: 在這裡加上驗證，檢查使用者是否已登入
      // 如果未登入，可能需要導向到登入頁面
      // const token = localStorage.getItem('authToken');
      // if (!token) { /* redirect to login */ return; }

      const newReservationPromises = selectedSlots.map((slot) => {
        const { date, timeSlot } = slot;
        const newReservationData = {
          classroomId: selectedClassroomId,
          userName: details.userName, // TODO: 之後應從登入狀態取得 userName 或 userId
          purpose: details.purpose,
          date: date.toISOString(), // 使用 ISO 格式傳遞給後端
          timeSlot: timeSlot,
        };

        return fetch(`${API_URL}/reservations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${token}` // TODO: 加入 Token
          },
          body: JSON.stringify(newReservationData),
        }).then(async (res) => {
          // 改為 async
          if (!res.ok) {
            const errorData = await res.json(); // 嘗試讀取錯誤訊息
            console.error("預約失敗:", errorData);
            throw new Error(errorData.message || "預約失敗");
          }
          return res.json();
        });
      });

      try {
        const createdReservations: Reservation[] = await Promise.all(
          newReservationPromises,
        );
        setReservations((prev) => [...prev, ...createdReservations]);
        handleClearSelection();
        handleCloseModal();
        alert(`成功預約 ${createdReservations.length} 個時段！`); // 簡單提示
      } catch (error) {
        console.error("建立預約時發生錯誤:", error);
        alert(`預約失敗: ${(error as Error).message}`); // 顯示錯誤訊息
      }
    }
  };
  // --- ^^^ 將 App.tsx 的 useMemo 和 handlers 搬過來 ^^^ ---

  // --- vvv 將 App.tsx 的 JSX 結構搬過來 vvv ---
  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 h-full">
        <div className="md:w-1/3 lg:w-1/4 flex-shrink-0">
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
      <BookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddReservation}
        classroom={selectedClassroom}
        selectedSlots={selectedSlots}
      />
    </>
  );
  // --- ^^^ 將 App.tsx 的 JSX 結構搬過來 ^^^ ---
};

export default HomePage;
