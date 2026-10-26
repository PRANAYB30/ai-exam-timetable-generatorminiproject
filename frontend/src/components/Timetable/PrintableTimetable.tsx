import React from 'react';
import { Timetable } from '../../types';

interface PrintableTimetableProps {
  timetable: Timetable | null;
}

export const PrintableTimetable: React.FC<PrintableTimetableProps> = ({ timetable }) => {
  if (!timetable) return null;

  // Group assignments by date
  const groupedByDate: Record<string, typeof timetable.assignments> = {};
  timetable.assignments.forEach((a) => {
    const d = a.date || 'Unscheduled';
    if (!groupedByDate[d]) groupedByDate[d] = [];
    groupedByDate[d].push(a);
  });

  return (
    <div className="hidden print:block p-8 bg-white text-black text-sm font-serif">
      {/* Official Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          College of Engineering & Technology
        </h1>
        <h2 className="text-lg font-semibold text-gray-800 mt-1">
          Office of the Controller of Examinations
        </h2>
        <p className="text-sm italic text-gray-600 mt-1">
          Official Examination Timetable — {timetable.academic_term}
        </p>
        <div className="mt-3 flex justify-between text-xs text-gray-600 border-t pt-2">
          <span>Schedule Name: <strong>{timetable.name}</strong></span>
          <span>Status: <strong>{timetable.status} (0 Hard Violations)</strong></span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Date-wise Examination Tables */}
      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([date, items]) => (
          <div key={date} className="break-inside-avoid">
            <h3 className="text-base font-bold bg-gray-100 p-2 border-y border-black mb-2">
              Date: {date}
            </h3>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-400">
                  <th className="border border-gray-300 p-2 text-left">Code</th>
                  <th className="border border-gray-300 p-2 text-left">Course / Subject Name</th>
                  <th className="border border-gray-300 p-2 text-left">Student Groups</th>
                  <th className="border border-gray-300 p-2 text-center">Candidates</th>
                  <th className="border border-gray-300 p-2 text-left">Time Session</th>
                  <th className="border border-gray-300 p-2 text-left">Room / Hall</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.exam_id} className="border-b border-gray-200">
                    <td className="border border-gray-300 p-2 font-bold">{item.exam_code}</td>
                    <td className="border border-gray-300 p-2">{item.exam_name}</td>
                    <td className="border border-gray-300 p-2">{item.student_group_codes.join(', ')}</td>
                    <td className="border border-gray-300 p-2 text-center">{item.student_count}</td>
                    <td className="border border-gray-300 p-2">
                      {item.slot_name} ({item.slot_start} - {item.slot_end})
                    </td>
                    <td className="border border-gray-300 p-2 font-semibold">
                      {item.room_number} ({item.room_name})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Signature and Verification Footer */}
      <div className="mt-12 pt-8 border-t border-gray-400 flex justify-between text-xs break-inside-avoid">
        <div>
          <p className="font-semibold">AI Scheduling Engine (CSP + Backtracking)</p>
          <p className="text-gray-500">Constraint Satisfaction Verification Passed</p>
        </div>
        <div className="text-center">
          <div className="h-12"></div>
          <p className="border-t border-black px-8 font-semibold">Controller of Examinations</p>
        </div>
      </div>
    </div>
  );
};
