import { useState, useEffect } from 'react';
import { LayoutDashboard, Kanban, FolderKanban, Plus, Trash2, Circle, FolderOpen, Settings, Sun, Moon, ArrowUpDown, BookOpen } from 'lucide-react';
import { useProjects, useNavigation } from '../../hooks';
import { useAppStore } from '../../store/AppContext';
import { useTheme } from '../../store/ThemeContext';
import { useSync } from '../../store/SyncContext';
import { useStats } from '../../hooks';
import { ProgressBar } from '../ui';
import { formatDuration } from '../../utils/data';
import AddProjectModal from '../../features/projects/AddProjectModal';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'kanban',    label: 'Board',     icon: Kanban },
  { id: 'projects',  label: 'Projects',  icon: FolderKanban },
  { id: 'project',   label: 'Project',   icon: FolderOpen },
  { id: 'priority',  label: 'Priority',  icon: ArrowUpDown },
  { id: 'worklog',   label: 'Work Log',  icon: BookOpen },
];

function LiveTimerDot({ startedAt }) {
  const [elapsed, setElapsed] = useState(Date.now() - startedAt);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'monospace', background: 'var(--accent-light)', padding: '1px 5px', borderRadius: 3 }}>
      {formatDuration(elapsed)}
    </span>
  );
}

function ProjectItem({ project, isActive, onClick, onDelete }) {
  const stats = useStats(project.id);
  const { state } = useAppStore();
  const isTimerRunning = state.activeTimer?.projectId === project.id;

  return (
    <div onClick={onClick} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: 7, background: isActive ? 'var(--bg-hover)' : 'transparent', marginBottom: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <Circle size={7} fill={project.color} color={project.color} />
        <span style={{ fontSize: 12, color: isActive ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: isActive ? 500 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.name}
        </span>
        {isTimerRunning && <LiveTimerDot startedAt={state.activeTimer.startedAt} />}
        <button onClick={e => { e.stopPropagation(); onDelete(project.id); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', padding: 2, display: 'flex', opacity: 0 }} className="delete-btn">
          <Trash2 size={11} />
        </button>
      </div>
      <ProgressBar value={stats.progress} color={project.color} height={3} />
      <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 3 }}>{stats.done} of {stats.total} tasks</div>
    </div>
  );
}

function SyncDot() {
  const { syncStatus } = useSync();
  const color = syncStatus === 'ok' ? 'var(--success)'
    : syncStatus === 'pushing' || syncStatus === 'pulling' ? 'var(--warning)'
    : syncStatus === 'error' ? 'var(--danger)'
    : 'var(--text-placeholder)';
  const title = syncStatus === 'ok' ? 'Synced' : syncStatus === 'pushing' ? 'Pushing...' : syncStatus === 'pulling' ? 'Pulling...' : syncStatus === 'error' ? 'Sync error' : 'Not synced';
  return (
    <span title={title} style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, marginLeft: 'auto' }} />
  );
}

// ── Work / Personal toggle ─────────────────────────────────────────────────────
function ProjectTypeToggle({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bg-page)', borderRadius: 8,
      padding: 3, border: '1px solid var(--border)', gap: 2,
    }}>
      {['work', 'personal'].map(type => {
        const active = value === type;
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            style={{
              flex: 1, padding: '4px 0', borderRadius: 6, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: active ? 600 : 400,
              background: active ? 'var(--bg-card)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-faint)',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
              letterSpacing: '0.01em',
            }}
          >
            {type === 'work' ? 'Work' : 'Personal'}
          </button>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const { projects, activeProject, setActiveProject, deleteProject } = useProjects();
  const { activeTab, setActiveTab } = useNavigation();
  const { isDark, toggleTheme } = useTheme();
  const [showAddProject, setShowAddProject] = useState(false);

  // Persist the toggle selection across refreshes
  const [projectType, setProjectType] = useState(
    () => localStorage.getItem('forge-sidebar-type') ?? 'work'
  );

  const handleTypeChange = (type) => {
    setProjectType(type);
    localStorage.setItem('forge-sidebar-type', type);
  };

  const handleProjectClick = (id) => { setActiveProject(id); setActiveTab('project'); };

  const visibleProjects = projects.filter(p =>
    (p.type ?? 'work') === projectType && p.status === 'working-on-it'
  );

  return (
    <>
      <aside style={{ width: 216, background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: '20px 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 26, height: 26, background: 'var(--accent)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>F</span>
            </div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Forge</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '4px 8px' }}>
          {NAV_ITEMS.filter(n => n.id !== 'project').map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeTab === id ? 'var(--bg-hover)' : 'transparent',
              color: activeTab === id ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 13, fontFamily: 'inherit', fontWeight: activeTab === id ? 500 : 400,
              marginBottom: 1, textAlign: 'left',
            }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </nav>

        <div style={{ margin: '10px 16px 10px', borderTop: '1px solid var(--border)' }} />

        {/* Projects section */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Toggle + add button */}
          <div style={{ padding: '0 10px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <ProjectTypeToggle value={projectType} onChange={handleTypeChange} />
              </div>
              <button
                onClick={() => setShowAddProject(true)}
                title="Add project"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, display: 'flex', borderRadius: 4, flexShrink: 0 }}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Project list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
            {visibleProjects.length === 0 ? (
              <div style={{ padding: '16px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--text-placeholder)', margin: '0 0 8px', fontStyle: 'italic' }}>
                  No active {projectType} projects
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-placeholder)', margin: '0 0 8px' }}>
                  On hold &amp; completed projects are hidden
                </p>
                <button
                  onClick={() => setShowAddProject(true)}
                  style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}
                >
                  Add one
                </button>
              </div>
            ) : (
              visibleProjects.map(p => (
                <ProjectItem
                  key={p.id} project={p}
                  isActive={activeProject?.id === p.id && activeTab === 'project'}
                  onClick={() => handleProjectClick(p.id)}
                  onDelete={deleteProject}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer — settings + theme toggle */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setActiveTab('settings')} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderRadius: 6,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            background: activeTab === 'settings' ? 'var(--bg-hover)' : 'transparent',
            color: activeTab === 'settings' ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: activeTab === 'settings' ? 500 : 400, textAlign: 'left',
          }}>
            <Settings size={14} /> Settings
            <SyncDot />
          </button>

          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 7, border: '1px solid var(--border-med)',
              background: 'var(--bg-card-alt)', cursor: 'pointer',
              color: 'var(--text-muted)', flexShrink: 0,
            }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </aside>

      <AddProjectModal isOpen={showAddProject} onClose={() => setShowAddProject(false)} />
      <style>{`div:hover > .delete-btn { opacity: 1 !important; }`}</style>
    </>
  );
}
