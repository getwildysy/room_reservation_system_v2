import React from 'react';
import { Classroom, Reservation } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, CheckCircleIcon } from './Icons';

type SelectedSlot = { date: Date; timeSlot: string };

interface ScheduleCalendarProps {
  classroom: Classroom | undefined;
  date: Date;
  reservations: Reservation[];
  selectedSlots: SelectedSlot[];
  onToggleSlot: (date: Date, timeSlot:string) => void;
  onConfirmBooking: () => void;
  onClearSelection: () => void;
  onDateChange: (newDate: Date) => void;
}

const timeSlots = [
    { period: '第一節' }, { period: '第二節' }, { period: '第三節' }, { period: '第四節' },
    { period: '午休' },
    { period: '第五節' }, { period: '第六節' }, { period: '第七節' }, { period: '第八節' },
    { period: '晚上' },
];

const weekDayLabels = ['一', '二', '三', '四', '五', '六', '日'];

const getWeekDays = (date: Date): Date[] => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
    start.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
        const newDate = new Date(start);
        newDate.setDate(start.getDate() + i);
        return newDate;
    });
};

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ 
  classroom, 
  date, 
  reservations, 
  selectedSlots,
  onToggleSlot,
  onConfirmBooking,
  onClearSelection,
  onDateChange 
}) => {
  if (!classroom) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-lg shadow-md">
        <p className="text-gray-500">請先從左側選擇一間教室</p>
      </div>
    );
  }

  const weekDays = getWeekDays(date);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const formattedWeekRange = `${weekStart.getFullYear()}年 ${weekStart.getMonth() + 1}月 ${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月 ${weekEnd.getDate()}日`;
  
  const changeWeek = (amount: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + amount * 7);
    onDateChange(newDate);
  };

  const classroomReservations = reservations.filter(r => r.classroomId === classroom.id);
  
  const getReservationForSlot = (day: Date, timeSlot: string) => {
      const dateString = `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}`;
      return classroomReservations.find(r => r.date === dateString && r.timeSlot === timeSlot);
  }
  
  const isSlotSelected = (day: Date, timeSlot: string) => {
      return selectedSlots.some(s => s.date.getTime() === day.getTime() && s.timeSlot === timeSlot);
  }

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{classroom.name}</h2>
        </div>
        <div className="flex items-center justify-between sm:justify-end space-x-2 mt-4 sm:mt-0">
          <button onClick={() => changeWeek(-1)} className="p-2 rounded-full hover:bg-gray-200 transition">
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-2 font-semibold text-gray-700 text-sm sm:text-base">
            <CalendarIcon className="w-5 h-5" />
            <span>{formattedWeekRange}</span>
          </div>
          <button onClick={() => changeWeek(1)} className="p-2 rounded-full hover:bg-gray-200 transition">
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {selectedSlots.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between transition-all duration-300">
            <p className="text-blue-800 font-semibold">已選擇 {selectedSlots.length} 個時段</p>
            <div className="space-x-2">
                <button onClick={onClearSelection} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">取消選取</button>
                <button onClick={onConfirmBooking} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">確認預約</button>
            </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-px bg-gray-200">
            <div className="bg-gray-100 p-2 sticky top-0 left-0 z-20"></div>
            {weekDays.map((day, i) => (
                <div key={i} className={`p-2 text-center font-semibold text-sm sticky top-0 z-10 ${isToday(day) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    <div>週{weekDayLabels[i]}</div>
                    <div className="text-xs">{day.getDate()}</div>
                </div>
            ))}
            
            {timeSlots.map((slot) => (
                <React.Fragment key={slot.period}>
                    <div className="bg-gray-100 p-2 text-center text-sm font-semibold text-gray-600 flex items-center justify-center sticky left-0 z-10">
                        {slot.period}
                    </div>
                    {weekDays.map((day, dayIndex) => {
                        const reservation = getReservationForSlot(day, slot.period);
                        const isBooked = !!reservation;
                        const isSelected = isSlotSelected(day, slot.period);
                        
                        return (
                            <div 
                                key={dayIndex} 
                                className={`bg-white p-1 min-h-[80px] flex items-center justify-center text-center transition-colors relative
                                  ${!isBooked && 'cursor-pointer hover:bg-blue-50'}
                                  ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                                `}
                                onClick={!isBooked ? () => onToggleSlot(day, slot.period) : undefined}
                            >
                                {isBooked ? (
                                    <div className="w-full h-full p-2 rounded flex flex-col justify-center" style={{ backgroundColor: `${classroom.color}20`}}>
                                        <p className="font-semibold text-xs break-words" style={{ color: classroom.color }}>{reservation.purpose}</p>
                                        <p className="text-xs text-gray-600 mt-1">{reservation.userName}</p>
                                    </div>
                                ) : (
                                  isSelected ? (
                                      <div className="flex flex-col items-center justify-center text-blue-600">
                                          <CheckCircleIcon className="w-8 h-8"/>
                                          <span className="text-xs font-semibold mt-1">已選取</span>
                                      </div>
                                  ) : (
                                      <span className="text-gray-400 text-sm">可預約</span>
                                  )
                                )}
                            </div>
                        )
                    })}
                </React.Fragment>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;