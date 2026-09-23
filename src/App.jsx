import { AppProvider } from './store/AppContext';
import { ThemeProvider } from './store/ThemeContext';
import { SyncProvider } from './store/SyncContext';
import { useNavigation } from './hooks';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './features/dashboard/Dashboard';
import KanbanBoard from './features/kanban/KanbanBoard';
import ProjectsView from './features/projects/ProjectsView';
import ProjectDetail from './features/project-detail/ProjectDetail';
import PriorityView from './features/priority/PriorityView';
import WorkLogView from './features/worklog/WorkLogView';
import SettingsTab from './features/settings/SettingsTab';

const TAB_VIEWS = {
  dashboard: Dashboard,
  kanban:    KanbanBoard,
  projects:  ProjectsView,
  project:   ProjectDetail,
  priority:  PriorityView,
  worklog:   WorkLogView,
  settings:  SettingsTab,
};

function MainContent() {
  const { activeTab } = useNavigation();
  const View = TAB_VIEWS[activeTab] ?? Dashboard;
  return <View />;
}

function AppShell() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-page)', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <MainContent />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <SyncProvider>
          <AppShell />
        </SyncProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
