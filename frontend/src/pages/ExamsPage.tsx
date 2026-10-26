import React, { useState } from 'react';
import { Exam, StudentGroup, Room } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Common/Modal';
import { Badge } from '../components/Common/Badge';
import {
  BookOpen,
  Plus,
  Search,
  Upload,
  Trash2,
  Edit,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ExamsPageProps {
  exams: Exam[];
  groups: StudentGroup[];
  rooms: Room[];
  onRefresh: () => Promise<void>;
  addToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const ExamsPage: React.FC<ExamsPageProps> = ({
  exams,
  groups,
  rooms,
  onRefresh,
  addToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [studentCount, setStudentCount] = useState(50);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [roomType, setRoomType] = useState<string>('');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvErrors, setCsvErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [isImporting, setIsImporting] = useState(false);

  const openCreateModal = () => {
    setEditingExam(null);
    setCode('');
    setName('');
    setStudentCount(50);
    setSelectedGroups([groups[0]?.code || 'CS-Y3']);
    setRoomType('');
    setFacilities([]);
    setIsModalOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setCode(exam.code);
    setName(exam.name);
    setStudentCount(exam.student_count);
    setSelectedGroups(exam.student_group_codes);
    setRoomType(exam.required_room_type || '');
    setFacilities(exam.required_facilities || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      addToast('error', 'Validation Error', 'Code and name are required.');
      return;
    }
    if (selectedGroups.length === 0) {
      addToast('error', 'Validation Error', 'Select at least one student group.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExam) {
        await api.updateExam(editingExam.id, {
          code: code.trim(),
          name: name.trim(),
          student_count: Number(studentCount),
          student_group_codes: selectedGroups,
          required_room_type: roomType || null,
          required_facilities: facilities,
        });
        addToast('success', 'Exam Updated', `Subject ${code} updated successfully.`);
      } else {
        await api.createExam({
          code: code.trim(),
          name: name.trim(),
          student_count: Number(studentCount),
          student_group_codes: selectedGroups,
          duration_slots: 1,
          permitted_dates: [],
          permitted_slots: [],
          required_room_type: roomType || null,
          required_facilities: facilities,
        });
        addToast('success', 'Exam Created', `Subject ${code} added to inventory.`);
      }
      await onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, examCode: string) => {
    if (!confirm(`Are you sure you want to delete exam ${examCode}?`)) return;
    try {
      await api.deleteExam(id);
      addToast('info', 'Exam Deleted', `Exam ${examCode} removed.`);
      await onRefresh();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setIsImporting(true);
    setCsvErrors([]);
    try {
      const res = await api.importCsv('exams', csvFile);
      if (res.success) {
        addToast('success', 'Import Successful', `Imported ${res.imported_count} examinations.`);
        await onRefresh();
        setIsCsvModalOpen(false);
      } else {
        setCsvErrors(res.errors);
        addToast('warning', 'Row Errors Found', `${res.errors.length} rows had errors.`);
      }
    } catch (err: any) {
      addToast('error', 'Import Failed', err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredExams = exams.filter((e) => {
    const q = searchTerm.toLowerCase();
    return (
      e.code.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.student_group_codes.some((g) => g.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Examination Registry</h1>
            <p className="text-xs text-slate-400">
              Manage curriculum subjects, student batches, capacities, and venue requirements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700 transition-all"
          >
            <Upload className="h-3.5 w-3.5 text-indigo-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Examination</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search code, name, or student group..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-400">
          Total: <strong className="text-white">{filteredExams.length}</strong> examinations
        </span>
      </div>

      {/* Exams Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase">
              <th className="p-4">Code</th>
              <th className="p-4">Subject Title</th>
              <th className="p-4">Student Groups</th>
              <th className="p-4">Students</th>
              <th className="p-4">Required Venue</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredExams.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No examinations found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-bold text-white tracking-wide">{exam.code}</td>
                  <td className="p-4 font-medium text-slate-200">{exam.name}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {exam.student_group_codes.map((g) => (
                        <Badge key={g} size="sm" variant="primary">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-slate-300">
                    {exam.student_count} candidates
                  </td>
                  <td className="p-4">
                    {exam.required_room_type ? (
                      <span className="text-indigo-400 font-semibold">
                        {exam.required_room_type}
                      </span>
                    ) : (
                      <span className="text-slate-500">Any Venue</span>
                    )}
                    {exam.required_facilities && exam.required_facilities.length > 0 && (
                      <div className="text-[10px] text-cyan-400 mt-0.5">
                        Requires: {exam.required_facilities.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(exam)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exam.id, exam.code)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Exam Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExam ? `Edit Exam: ${editingExam.code}` : 'Register New Examination'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS301"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Candidate Count
              </label>
              <input
                type="number"
                required
                min={1}
                value={studentCount}
                onChange={(e) => setStudentCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Course Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design & Analysis of Algorithms"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Student Groups (Multi-select)
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-slate-800/60 border border-slate-700 rounded-lg max-h-32 overflow-y-auto">
              {groups.map((grp) => {
                const isSelected = selectedGroups.includes(grp.code);
                return (
                  <button
                    type="button"
                    key={grp.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedGroups(selectedGroups.filter((g) => g !== grp.code));
                      } else {
                        setSelectedGroups([...selectedGroups, grp.code]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {grp.code}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Required Room Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Any Room</option>
                <option value="Lecture Hall">Lecture Hall</option>
                <option value="Computer Lab">Computer Lab</option>
                <option value="Auditorium">Auditorium</option>
                <option value="Classroom">Classroom</option>
                <option value="Seminar Hall">Seminar Hall</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Required Facilities
              </label>
              <div className="flex gap-3 pt-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={facilities.includes('Computers')}
                    onChange={(e) => {
                      if (e.target.checked) setFacilities([...facilities, 'Computers']);
                      else setFacilities(facilities.filter((f) => f !== 'Computers'));
                    }}
                    className="rounded bg-slate-700 text-indigo-600"
                  />
                  <span>Computers</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={facilities.includes('Projector')}
                    onChange={(e) => {
                      if (e.target.checked) setFacilities([...facilities, 'Projector']);
                      else setFacilities(facilities.filter((f) => f !== 'Projector'));
                    }}
                    className="rounded bg-slate-700 text-indigo-600"
                  />
                  <span>Projector</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : editingExam ? 'Update Subject' : 'Add Subject'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Examinations from CSV"
        subtitle="Upload a .csv file containing Subject Code, Subject Name, Student Groups, and Student Count"
      >
        <form onSubmit={handleCsvImport} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-white">Expected CSV Format Header:</span>
            <code className="block p-2 bg-slate-900 rounded font-mono text-[11px] text-indigo-300">
              code,name,student_groups,student_count,required_room_type,required_facilities
            </code>
            <p className="text-[11px] text-slate-400">
              Example: CS301,Operating Systems,CS-Y3,60,Lecture Hall,
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              required
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
            />
          </div>

          {/* Row Errors */}
          {csvErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1 max-h-32 overflow-y-auto">
              <span className="font-bold block">Validation Errors:</span>
              {csvErrors.map((err, i) => (
                <div key={i} className="text-[11px]">
                  Row {err.row}: {err.error}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCsvModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isImporting || !csvFile}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              <span>{isImporting ? 'Importing...' : 'Upload & Import'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
