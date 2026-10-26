import React, { useState } from 'react';
import { StudentGroup } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Common/Modal';
import { Badge } from '../components/Common/Badge';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  ShieldAlert,
  CheckCircle2,
  Network,
} from 'lucide-react';

interface GroupsPageProps {
  groups: StudentGroup[];
  onRefresh: () => Promise<void>;
  addToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const GroupsPage: React.FC<GroupsPageProps> = ({ groups, onRefresh, addToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudentGroup | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [studentCount, setStudentCount] = useState(60);
  const [sharedConflicts, setSharedConflicts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingGroup(null);
    setCode('');
    setName('');
    setStudentCount(60);
    setSharedConflicts([]);
    setIsModalOpen(true);
  };

  const openEditModal = (group: StudentGroup) => {
    setEditingGroup(group);
    setCode(group.code);
    setName(group.name);
    setStudentCount(group.student_count);
    setSharedConflicts(group.shared_conflict_groups || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      addToast('error', 'Validation Error', 'Group code and name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGroup) {
        await api.updateGroup(editingGroup.id, {
          code: code.trim(),
          name: name.trim(),
          student_count: Number(studentCount),
          shared_conflict_groups: sharedConflicts,
        });
        addToast('success', 'Group Updated', `Batch ${code} updated.`);
      } else {
        await api.createGroup({
          code: code.trim(),
          name: name.trim(),
          student_count: Number(studentCount),
          shared_conflict_groups: sharedConflicts,
        });
        addToast('success', 'Group Created', `Batch ${code} added.`);
      }
      await onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, grpCode: string) => {
    if (!confirm(`Delete student group ${grpCode}?`)) return;
    try {
      await api.deleteGroup(id);
      addToast('info', 'Group Deleted', `Group ${grpCode} removed.`);
      await onRefresh();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Student Groups & Batches</h1>
            <p className="text-xs text-slate-400">
              Configure student cohorts, class sizes, and mutual elective conflict relationships.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Student Group</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-sm text-white">{group.code}</span>
                  <h3 className="text-xs text-slate-300 font-medium mt-0.5">{group.name}</h3>
                </div>
                <Badge variant="primary" size="sm">
                  {group.student_count} Students
                </Badge>
              </div>

              {/* Shared Conflicts */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-2">
                  <Network className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Shared Student Conflict Batches:</span>
                </div>
                {group.shared_conflict_groups && group.shared_conflict_groups.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {group.shared_conflict_groups.map((conflictCode) => (
                      <span
                        key={conflictCode}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      >
                        ⚡ Conflicting with {conflictCode}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">
                    Independent cohort (no shared students)
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end gap-2">
              <button
                onClick={() => openEditModal(group)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(group.id, group.code)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? `Edit Group: ${editingGroup.code}` : 'Create Student Group'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Group Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS-Y3"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Student Enrollment
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Group Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Science & Eng - Year 3"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mutual Conflict Groups (Shared Students)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Select other groups that share students with this group. The AI CSP scheduler will never schedule examinations for these groups simultaneously.
            </p>
            <div className="flex flex-wrap gap-2 p-2.5 bg-slate-800/60 border border-slate-700 rounded-lg max-h-32 overflow-y-auto">
              {groups
                .filter((g) => g.code !== code)
                .map((grp) => {
                  const isSelected = sharedConflicts.includes(grp.code);
                  return (
                    <button
                      type="button"
                      key={grp.id}
                      onClick={() => {
                        if (isSelected) {
                          setSharedConflicts(sharedConflicts.filter((c) => c !== grp.code));
                        } else {
                          setSharedConflicts([...sharedConflicts, grp.code]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {grp.code}
                    </button>
                  );
                })}
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
              <span>{isSubmitting ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
