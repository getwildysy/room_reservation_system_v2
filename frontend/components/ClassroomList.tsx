import React from 'react';
import { Classroom } from '../types';
import { UsersIcon, ComputerIcon } from './Icons';

interface ClassroomListProps {
  classrooms: Classroom[];
  selectedClassroomId: string;
  onSelectClassroom: (id: string) => void;
}

const ClassroomList: React.FC<ClassroomListProps> = ({ classrooms, selectedClassroomId, onSelectClassroom }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">教室列表</h2>
      <ul className="space-y-2">
        {classrooms.map((classroom) => (
          <li key={classroom.id}>
            <button
              onClick={() => onSelectClassroom(classroom.id)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-start space-x-3 ${
                selectedClassroomId === classroom.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-800 hover:bg-blue-100 hover:shadow-md'
              }`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: classroom.color }}>
                 <ComputerIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{classroom.name}</p>
                <div className="text-sm mt-1 flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <UsersIcon className="w-4 h-4" />
                    <span>{classroom.capacity} 人</span>
                  </div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassroomList;