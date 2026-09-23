import { useState } from 'react';
import { useProjects, useNavigation, useTimeTracking, useStats } from '../../hooks';
import { Button, ProjectStatusBadge, TypeBadge, ProgressBar, Modal, FormField, Select, Input, PROJECT_STATUS_LABELS } from '../../components/ui';
import { formatDate, daysUntil, formatDuration, getProjectTotalTime } from '../../utils/data';
import { useAppStore } from '../../store/AppContext';
import { Play, Square, CalendarDays, Clock, Settings, Trash2 } from 'lucide-react';
import TasksTab from '../tasks/TasksTab';
import NotesTab from '../notes/NotesTab';
import FilesTab from '../files/FilesTab';
import TimeTab from '../time/TimeTab';

const PROJECT_STATUSES = ['on-hold', 'working-on-it', 'completed-it'];
const TABS = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Notes' },
  { id: 'files', label: 'Files' },
  { id: 'time',  label: 'Time'  },
];

function StatusModal({ isOpen, onClose, project, onUpdate }) {
  const [form, setForm] = useState({
    status: project.status,
    statusComment: project.statusComment || '',
    type: project.type ?? 'work',
  });
  const handleSave = () => { onUpdate({ id: project.id, ...form }); onClose(); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project" width={420}>
      <FormField label="Type">
        <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
        </Select>
      </FormField>
      <FormField label="Status">
        <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
          {PROJECT_STATUSES.map(s => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
        </Select>
      </FormField>
      <FormField label="Status Comment">
        <Input value={form.statusComment} onChange={e => setForm(f => ({ ...f, statusComment: e.target.value }))} placeholder="Add context..." />
      </FormField>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save</Button>
      </div>
    </Modal>
  );
}

function TimerButton({ projectId }) {
  const { isRunning, startTimer, stopTimer } = useTimeTracking(projectId);
  const { state } = useAppStore();
  const timerBelongsToOther = state.activeTimer && state.activeTimer.projectId !== projectId;
  return isRunning ? (
    <Button variant="danger" size="sm" onClick={stopTimer}><Square size={13} /> Stop Timer</Button>
  ) : (
    <Button variant="success" size="sm" onClick={startTimer} disabled={timerBelongsToOther}><Play size={13} /> Working On It</Button>
  );
}

export default function ProjectDetail() {
  const { activeProject, updateProject, deleteProject } = useProjects();
  const { projectDetailTab, setProjectDetailTab, setActiveTab } = useNavigation();
  const stats = useStats(activeProject?.id);
  const { state } = useAppStore();
  const [showStatusModal, setShowStatusModal] = useState(false);

  if (!activeProject) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 14, background: 'var(--bg-page)' }}>
      Select a project from the sidebar.
    </div>
  );

  const handleDelete = () => {
    if (window.confirm(`Delete "${activeProject.name}"? This will permanently remove all its tasks, notes, files, and time entries.`)) {
      deleteProject(activeProject.id);
      setActiveTab('dashboard');
    }
  };

  const totalTime = getProjectTotalTime(activeProject.id, state.timeEntries);
  const due = daysUntil(activeProject.dueDate);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-page)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '16px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: activeProject.color, flexShrink: 0 }} />
              <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeProject.name}
              </h1>
            </div>
            {activeProject.description && (
              <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '0 0 8px 20px' }}>{activeProject.description}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 20, flexWrap: 'wrap' }}>
              <TypeBadge type={activeProject.type ?? 'work'} />
              <ProjectStatusBadge status={activeProject.status} />
              {activeProject.statusComment && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>"{activeProject.statusComment}"</span>}
              <button onClick={() => setShowStatusModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 11, padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Settings size={11} /> Edit
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 16 }}>
            <TimerButton projectId={activeProject.id} />
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginLeft: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, maxWidth: 200 }}>
            <ProgressBar value={stats.progress} color={activeProject.color} height={5} />
            <span style={{ fontSize: 12, color: 'var(--text-faint)', flexShrink: 0 }}>{stats.done}/{stats.total}</span>
          </div>
          {activeProject.dueDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: due !== null && due < 7 ? 'var(--danger)' : 'var(--text-faint)' }}>
              <CalendarDays size={12} />
              {due !== null && due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? 'Due today' : `${due}d left`}
            </span>
          )}
          {totalTime > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-faint)' }}>
              <Clock size={12} />{formatDuration(totalTime)} logged
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', flexShrink: 0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setProjectDetailTab(tab.id)} style={{
            padding: '10px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: 'transparent', fontSize: 13,
            fontWeight: projectDetailTab === tab.id ? 500 : 400,
            color: projectDetailTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: projectDetailTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {projectDetailTab === 'tasks' && <TasksTab projectId={activeProject.id} />}
        {projectDetailTab === 'notes' && <NotesTab projectId={activeProject.id} />}
        {projectDetailTab === 'files' && <FilesTab projectId={activeProject.id} />}
        {projectDetailTab === 'time'  && <TimeTab  projectId={activeProject.id} />}
      </div>

      <StatusModal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} project={activeProject} onUpdate={updateProject} />
    </div>
  );
}
