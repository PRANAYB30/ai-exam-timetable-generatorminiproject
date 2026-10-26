import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Layout/Sidebar';
import { TopNav } from './components/Layout/TopNav';
import { ToastContainer, ToastMessage } from './components/Common/Toast';

import { DashboardPage } from './pages/DashboardPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { TimetableViewerPage } from './pages/TimetableViewerPage';
import { ConflictsPage } from './pages/ConflictsPage';
import { AIAnalyticsPage } from './pages/AIAnalyticsPage';
import { ExamsPage } from './pages/ExamsPage';
import { GroupsPage } from './pages/GroupsPage';
import { RoomsPage } from './pages/RoomsPage';
import { ConfigurationPage } from './pages/ConfigurationPage';

import { api } from './services/api';
import {
  Exam,
  Room,
  StudentGroup,
  TimeSlot,
  SchedulingConfig,
  Timetable,
  DashboardData,
} from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [config, setConfig] = useState<SchedulingConfig | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const addToast = (
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message?: string
  ) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dash, ex, rm, gr, sl, cfg, tts] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getExams().catch(() => []),
        api.getRooms().catch(() => []),
        api.getGroups().catch(() => []),
        api.getSlots().catch(() => []),
        api.getConfig().catch(() => null),
        api.getTimetables().catch(() => []),
      ]);

      setDashboardData(dash);
      setExams(ex);
      setRooms(rm);
      setGroups(gr);
      setSlots(sl);
      setConfig(cfg);

      if (tts && tts.length > 0) {
        setTimetable(tts[0]);
      } else if (ex.length === 0) {
        // If empty DB, auto-seed demo data
        console.log('Database empty. Loading sample dataset...');
        await handleLoadDemo();
      }
    } catch (err: any) {
      console.error('Failed to load initial data', err);
      addToast('error', 'Connection Error', 'Ensure FastAPI backend is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoadDemo = async () => {
    setIsLoading(true);
    try {
      const res = await api.loadDemoData(true);
      addToast('success', 'Demo Data Loaded', 'College dataset and timetable initialized.');
      await loadData();
      if (res.timetable_id) {
        const tt = await api.getTimetable(res.timetable_id);
        setTimetable(tt);
      }
    } catch (err: any) {
      addToast('error', 'Error Loading Demo', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = async () => {
    setIsLoading(true);
    try {
      await api.resetDatabase();
      setTimetable(null);
      setExams([]);
      setRooms([]);
      setGroups([]);
      setSlots([]);
      setDashboardData(null);
      addToast('info', 'Database Reset', 'All records cleared.');
      await loadData();
    } catch (err: any) {
      addToast('error', 'Reset Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const dates = config?.dates || ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'];
  const conflictCount = timetable ? timetable.hard_violations_count : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        conflictCount={conflictCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          currentTabName={activeTab.replace('_', ' ')}
          onLoadDemo={handleLoadDemo}
          onResetData={handleResetData}
          isLoading={isLoading}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              data={dashboardData}
              onNavigate={(tab) => setActiveTab(tab)}
              onLoadDemo={handleLoadDemo}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'generator' && (
            <GeneratorPage
              exams={exams}
              rooms={rooms}
              slots={slots}
              onTimetableGenerated={(newTt) => {
                setTimetable(newTt);
                loadData();
              }}
              onNavigate={(tab) => setActiveTab(tab)}
              addToast={addToast}
            />
          )}

          {activeTab === 'viewer' && (
            <TimetableViewerPage
              timetable={timetable}
              rooms={rooms}
              slots={slots}
              groups={groups}
              dates={dates}
              onTimetableUpdated={(updated) => {
                setTimetable(updated);
                loadData();
              }}
              onNavigate={(tab) => setActiveTab(tab)}
              addToast={addToast}
            />
          )}

          {activeTab === 'conflicts' && (
            <ConflictsPage
              timetable={timetable}
              onTimetableUpdated={(updated) => {
                setTimetable(updated);
                loadData();
              }}
              onNavigate={(tab) => setActiveTab(tab)}
              addToast={addToast}
            />
          )}

          {activeTab === 'analytics' && (
            <AIAnalyticsPage
              timetable={timetable}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'exams' && (
            <ExamsPage
              exams={exams}
              groups={groups}
              rooms={rooms}
              onRefresh={loadData}
              addToast={addToast}
            />
          )}

          {activeTab === 'groups' && (
            <GroupsPage
              groups={groups}
              onRefresh={loadData}
              addToast={addToast}
            />
          )}

          {activeTab === 'rooms' && (
            <RoomsPage
              rooms={rooms}
              onRefresh={loadData}
              addToast={addToast}
            />
          )}

          {activeTab === 'config' && (
            <ConfigurationPage
              config={config}
              slots={slots}
              onConfigUpdated={(cfg) => setConfig(cfg)}
              onRefreshSlots={loadData}
              addToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
export default App;
