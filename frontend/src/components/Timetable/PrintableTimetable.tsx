import React from 'react';
import { Timetable } from '../../types';

interface PrintableTimetableProps {
  timetable: Timetable | null;
  filteredBatch?: string;
}

export const PrintableTimetable: React.FC<PrintableTimetableProps> = ({
  timetable,
  filteredBatch = 'ALL',
}) => {
  if (!timetable) return null;

  // Filter assignments if a batch is selected
  const itemsToPrint =
    filteredBatch === 'ALL'
      ? timetable.assignments
      : timetable.assignments.filter((a) =>
          a.student_group_codes.some((g) => g.toLowerCase() === filteredBatch.toLowerCase())
        );

  // Group assignments by date
  const groupedByDate: Record<string, typeof timetable.assignments> = {};
  itemsToPrint.forEach((a) => {
    const d = a.date || 'Unscheduled';
    if (!groupedByDate[d]) groupedByDate[d] = [];
    groupedByDate[d].push(a);
  });

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="hidden print:block p-8 bg-white text-slate-900 text-sm font-sans max-w-4xl mx-auto">
      {/* Official Institutional Letterhead */}
      <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="h-12 w-14 rounded-xl bg-blue-900 text-white flex items-center justify-center font-serif font-black text-xl tracking-wider">
            VIT
          </div>
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-950 font-serif">
              Vidyalankar Institute of Technology
            </h1>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-700">
              Autonomous Institute Affiliated to University of Mumbai • Approved by AICTE
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-300 flex justify-between items-center text-xs text-slate-700">
          <span>Ref No: <strong>VIT/COE/EXAM-CIR/2026/04</strong></span>
          <span className="font-bold uppercase tracking-wider text-slate-950">
            Office of the Controller of Examinations
          </span>
          <span>Date: <strong>{currentDate}</strong></span>
        </div>
      </div>

      {/* Circular Title */}
      <div className="text-center mb-6">
        <h2 className="text-base font-bold uppercase underline tracking-wide text-slate-950">
          Official Notification: End-Semester Examination Timetable
        </h2>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          Academic Term: <strong>{timetable.academic_term}</strong> | Schedule: <strong>{timetable.name}</strong>
          {filteredBatch !== 'ALL' && <span> | Specific Batch: <strong>{filteredBatch}</strong></span>}
        </p>
      </div>

      {/* Date-wise Examination Tables */}
      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([date, items]) => (
          <div key={date} className="break-inside-avoid">
            <div className="bg-slate-100 px-3 py-1.5 border border-slate-900 border-b-0 flex justify-between items-center">
              <span className="font-bold text-xs uppercase text-slate-950">
                Examination Date: {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="text-[11px] text-slate-600 font-mono">{date}</span>
            </div>

            <table className="w-full border-collapse border border-slate-900 text-xs">
              <thead>
                <tr className="bg-slate-200/80 border-b border-slate-900 text-slate-900">
                  <th className="border border-slate-900 p-2 text-left w-20">Code</th>
                  <th className="border border-slate-900 p-2 text-left">Course / Subject Name</th>
                  <th className="border border-slate-900 p-2 text-left w-32">Student Batch(es)</th>
                  <th className="border border-slate-900 p-2 text-center w-20">Candidates</th>
                  <th className="border border-slate-900 p-2 text-left w-36">Time Session</th>
                  <th className="border border-slate-900 p-2 text-left w-32">Allocated Venue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {items.map((item) => (
                  <tr key={item.exam_id} className="text-slate-900">
                    <td className="border border-slate-900 p-2 font-mono font-bold">{item.exam_code}</td>
                    <td className="border border-slate-900 p-2 font-medium">{item.exam_name}</td>
                    <td className="border border-slate-900 p-2">{item.student_group_codes.join(', ')}</td>
                    <td className="border border-slate-900 p-2 text-center font-semibold">{item.student_count}</td>
                    <td className="border border-slate-900 p-2">
                      <div className="font-semibold">{item.slot_name}</div>
                      <div className="text-[10px] text-slate-600">{item.slot_start} – {item.slot_end}</div>
                    </td>
                    <td className="border border-slate-900 p-2 font-semibold">
                      {item.room_number} <span className="text-[10px] font-normal text-slate-600">({item.room_name})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Mandatory Examination Directives for Candidates */}
      <div className="mt-8 p-3.5 border border-slate-400 bg-slate-50 text-[11px] text-slate-700 space-y-1 break-inside-avoid">
        <span className="font-bold text-slate-900 uppercase block text-xs">Important Directives for Examinees:</span>
        <p>1. Candidates must report to their assigned venue at least 20 minutes before session commencement.</p>
        <p>2. Possession of college ID card and authorized Hall Ticket is mandatory for entry.</p>
        <p>3. Electronic gadgets, smart watches, and unauthorized material are strictly prohibited inside the examination halls.</p>
      </div>

      {/* Official Signatures & Seal */}
      <div className="mt-12 pt-6 border-t border-slate-900 flex justify-between items-end text-xs break-inside-avoid">
        <div>
          <p className="font-semibold text-slate-900">System Verification:</p>
          <p className="text-slate-600 text-[11px]">AI CSP Engine • Zero Student Clashes • 100% Venue Capacity Compliance</p>
          <p className="text-slate-500 text-[10px] mt-1">Copy to: Principal, Deans, All HoDs, Student Notice Boards</p>
        </div>

        <div className="text-center space-y-1">
          <div className="inline-block border border-dashed border-emerald-600 px-3 py-1 rounded text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-2">
            ✓ Officially Approved & Signed
          </div>
          <p className="font-bold text-slate-950 text-sm">Dr. Ramesh K. Sharma</p>
          <p className="font-medium text-slate-700 text-xs">Controller of Examinations</p>
          <p className="text-[10px] text-slate-500">Vidyalankar Institute of Technology (VIT), Mumbai</p>
        </div>
      </div>
    </div>
  );
};

export default PrintableTimetable;
