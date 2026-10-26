import React, { useState, useEffect } from 'react';
import { SchedulingConfig, TimeSlot } from '../types';
import { api } from '../services/api';
import { Sliders, Clock, Calendar, CheckCircle2, Save, Plus, Trash2 } from 'lucide-react';

interface ConfigurationPageProps {
  config: SchedulingConfig | null;
  slots: TimeSlot[];
  onConfigUpdated: (config: SchedulingConfig) => void;
  onRefreshSlots: () => Promise<void>;
  addToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const ConfigurationPage: React.FC<ConfigurationPageProps> = ({
  config,
  slots,
  onConfigUpdated,
  onRefreshSlots,
  addToast,
}) => {
  const [formData, setFormData] = useState<SchedulingConfig>({
    name: 'Fall 2026 Examination Period',
    academic_term: 'Autumn 2026-27',
    start_date: '2026-11-16',
    end_date: '2026-11-20',
    dates: ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'],
    weight_gap: 10.0,
    weight_distribution: 5.0,
    weight_utilization: 3.0,
    max_search_seconds: 15.0,
    max_backtracks: 10000,
  });

  const [newDateInput, setNewDateInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New slot inputs
  const [newSlotNumber, setNewSlotNumber] = useState(3);
  const [newSlotName, setNewSlotName] = useState('Evening Session');
  const [newSlotStart, setNewSlotStart] = useState('17:30');
  const [newSlotEnd, setNewSlotEnd] = useState('20:30');

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateConfig(formData);
      onConfigUpdated(updated);
      addToast('success', 'Configuration Saved', 'Scheduling settings updated.');
    } catch (err: any) {
      addToast('error', 'Error Saving Config', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDate = () => {
    if (!newDateInput.trim()) return;
    if (formData.dates.includes(newDateInput.trim())) return;
    setFormData({
      ...formData,
      dates: [...formData.dates, newDateInput.trim()].sort(),
    });
    setNewDateInput('');
  };

  const handleRemoveDate = (dateToRemove: string) => {
    setFormData({
      ...formData,
      dates: formData.dates.filter((d) => d !== dateToRemove),
    });
  };

  const handleCreateSlot = async () => {
    try {
      await api.createSlot({
        slot_number: newSlotNumber,
        name: newSlotName,
        start_time: newSlotStart,
        end_time: newSlotEnd,
        is_active: true,
      });
      addToast('success', 'Slot Added', `Slot ${newSlotNumber} created.`);
      await onRefreshSlots();
      setNewSlotNumber(newSlotNumber + 1);
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    try {
      await api.deleteSlot(slotId);
      addToast('info', 'Slot Removed', 'Time slot deleted.');
      await onRefreshSlots();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <Sliders className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white">Scheduling & Heuristic Configuration</h1>
          <p className="text-xs text-slate-400">
            Tune examination dates, time sessions, soft-constraint penalty weights, and AI search budgets.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Period and Dates Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span>Examination Dates & Term Period</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Period Title</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Term</label>
              <input
                type="text"
                value={formData.academic_term}
                onChange={(e) => setFormData({ ...formData, academic_term: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Permitted Examination Calendar Days ({formData.dates.length} days configured)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.dates.map((date) => (
                <span
                  key={date}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                >
                  <span>{date}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(date)}
                    className="text-indigo-400 hover:text-rose-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="date"
                value={newDateInput}
                onChange={(e) => setNewDateInput(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddDate}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              >
                Add Date
              </button>
            </div>
          </div>
        </div>

        {/* Daily Time Sessions Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>Daily Examination Sessions ({slots.length} active sessions)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-white">
                    Slot {slot.slot_number}: {slot.name}
                  </div>
                  <div className="text-[11px] text-indigo-400 font-mono mt-0.5">
                    {slot.start_time} - {slot.end_time}
                  </div>
                </div>
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Soft Constraint Penalties Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-5">
          <div>
            <h2 className="text-sm font-bold text-white">Soft-Constraint Optimization Weights</h2>
            <p className="text-xs text-slate-400">
              Higher weights penalize undesirable schedule characteristics during value ordering and scoring.
            </p>
          </div>

          <div className="space-y-4">
            {/* Gap Weight */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">
                  Minimum Exam Gap Weight (Avoid Consecutive Days)
                </span>
                <span className="font-mono text-indigo-400 font-bold">{formData.weight_gap}</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={formData.weight_gap}
                onChange={(e) =>
                  setFormData({ ...formData, weight_gap: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-500"
              />
              <span className="text-[11px] text-slate-500">
                Penalizes student groups taking examinations on consecutive days or multiple exams on the same day.
              </span>
            </div>

            {/* Distribution Weight */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">
                  Daily Distribution Variance Weight
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  {formData.weight_distribution}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={formData.weight_distribution}
                onChange={(e) =>
                  setFormData({ ...formData, weight_distribution: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-500"
              />
              <span className="text-[11px] text-slate-500">
                Encourages an even distribution of papers across all calendar days instead of clustering on early days.
              </span>
            </div>

            {/* Utilization Weight */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">
                  Room Utilization Efficiency Weight
                </span>
                <span className="font-mono text-purple-400 font-bold">
                  {formData.weight_utilization}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={formData.weight_utilization}
                onChange={(e) =>
                  setFormData({ ...formData, weight_utilization: parseFloat(e.target.value) })
                }
                className="w-full accent-purple-500"
              />
              <span className="text-[11px] text-slate-500">
                Penalizes assigning small cohorts to massive halls when right-sized rooms are available.
              </span>
            </div>
          </div>
        </div>

        {/* AI Search Budget Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
          <h2 className="text-sm font-bold text-white">CSP Search Budget & Termination Limits</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Search Timeout (seconds)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={formData.max_search_seconds}
                onChange={(e) =>
                  setFormData({ ...formData, max_search_seconds: parseFloat(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500">
                Prevents indefinite search in dense constraint graphs.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Backtrack Iteration Limit
              </label>
              <input
                type="number"
                min={500}
                max={200000}
                step={500}
                value={formData.max_backtracks}
                onChange={(e) =>
                  setFormData({ ...formData, max_backtracks: parseInt(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500">
                Upper bound on backtracking steps before terminating search.
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
