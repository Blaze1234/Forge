import { useState, useEffect } from 'react';
import { useProjects, useNavigation, useTimeTracking, useStats } from '../../hooks';
import { Button, ProjectStatusBadge, TypeBadge, ProgressBar, Modal, FormField, Select, Input, Textarea, PROJECT_STATUS_LABELS } from '../../components/ui';
import { formatDate, daysUntil, formatDuration, getProjectTotalTime, formatRelativeTime, generateId, HARDWARE_PHASE_TEMPLATE } from '../../utils/data';
import { useAppStore } from '../../store/AppContext';
import { Play, Square, CalendarDays, Clock, Settings, Trash2, ChevronUp, ChevronDown, Plus, X, Pencil, StickyNote } from 'lucide-react';
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

// ── Phase management modal ───────────────────────────────────────────────────
function PhaseManageModal({ isOpen, onClose, phases, onSave }) {
  const [list, setList] = useState(phases);
  useEffect(() => { setList(phases); }, [phases, isOpen]);
  const [draft, setDraft] = useState('');

  const add = () => {
    if (!draft.trim()) return;
    setList(l => [...l, { id: generateId(), name: draft.trim(), position: l.length }]);
    setDraft('');
  };
  const remove = (id) => setList(l => l.filter(p => p.id !== id));
  const rename = (id, name) => setList(l => l.map(p => p.id === id ? { ...p, name } : p));
  const move = (idx, dir) => setList(l => {
    const next = [...l];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return l;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    return next.map((p, i) => ({ ...p, position: i }));
  });
  const useTemplate = () => setList(HARDWARE_PHASE_TEMPLATE.map((name, i) => ({ id: generateId(), name, position: i })));

  const save = () => { onSave(list.map((p, i) => ({ ...p, position: i }))); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Phases" width={440}>
      <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '0 0 12px' }}>
        Phases are the macro stages this project moves through (e.g. Research → Schematic → Verification → Layout → Ordered → Bring-up → Iterate). Tasks can optionally belong to one.
      </p>
      {list.length === 0 && (
        <Button variant="default" size="sm" onClick={useTemplate} style={{ marginBottom: 12 }}>Use hardware project template</Button>
      )}
      {list.map((p, i) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => move(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? 'var(--text-placeholder)' : 'var(--text-faint)', padding: 0, display: 'flex' }}><ChevronUp size={13} /></button>
            <button onClick={() => move(i, 1)} disabled={i === list.length - 1} style={{ background: 'none', border: 'none', cursor: i === list.length - 1 ? 'default' : 'pointer', color: i === list.length - 1 ? 'var(--text-placeholder)' : 'var(--text-faint)', padding: 0, display: 'flex' }}><ChevronDown size={13} /></button>
          </div>
          <Input value={p.name} onChange={e => rename(p.id, e.target.value)} style={{ flex: 1 }} />
          <button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', padding: 4, display: 'flex' }}><X size={14} /></button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, marginBottom: 4 }}>
        <Input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Add phase…" />
        <Button size="sm" variant="default" onClick={add}><Plus size={13} /></Button>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={save}>Save</Button>
      </div>
    </Modal>
  );
}

// ── Phase strip ───────────────────────────────────────────────────────────────
function PhaseStrip({ project, phaseFilter, setPhaseFilter, onSavePhases }) {
  const [manageOpen, setManageOpen] = useState(false);
  const phases = project.phases ?? [];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', flexWrap: 'wrap' }}>
      {phases.length === 0 ? (
        <button onClick={() => setManageOpen(true)} style={{ background: 'none', border: '1px dashed var(--border-strong)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-faint)', fontSize: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Plus size={12} /> Set up project phases
        </button>
      ) : (
        <>
          <button onClick={() => setPhaseFilter(null)} style={{
            padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
            background: phaseFilter === null ? 'var(--accent)' : 'transparent',
            color: phaseFilter === null ? '#fff' : 'var(--text-faint)', fontWeight: phaseFilter === null ? 500 : 400,
          }}>
            All
          </button>
          {phases.map(ph => (
            <button key={ph.id} onClick={() => setPhaseFilter(ph.id)} style={{
              padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
              background: phaseFilter === ph.id ? 'var(--accent)' : 'transparent',
              color: phaseFilter === ph.id ? '#fff' : 'var(--text-faint)', fontWeight: phaseFilter === ph.id ? 500 : 400,
              whiteSpace: 'nowrap',
            }}>
              {ph.name}
            </button>
          ))}
          <button onClick={() => setManageOpen(true)} title="Manage phases" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', padding: 5, display: 'flex', marginLeft: 4 }}>
            <Settings size={13} />
          </button>
        </>
      )}
      <PhaseManageModal isOpen={manageOpen} onClose={() => setManageOpen(false)} phases={phases} onSave={onSavePhases} />
    </div>
  );
}

// ── Pinned status note ───────────────────────────────────────────────────────
function StatusNoteCard({ project, onSave }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(project.statusNote ?? '');
  useEffect(() => { setText(project.statusNote ?? ''); }, [project.id]);

  const save = () => { onSave(text); setEditing(false); };
  const cancel = () => { setText(project.statusNote ?? ''); setEditing(false); };

  return (
    <div style={{ margin: '14px 24px 0', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <StickyNote size={11} /> Status
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-placeholder)' }}>
          {project.statusNoteUpdatedAt ? `updated ${formatRelativeTime(project.statusNoteUpdatedAt)}` : 'not set'}
          {!editing && (
            <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 2, display: 'flex' }}>
              <Pencil size={11} />
            </button>
          )}
        </span>
      </div>
      {editing ? (
        <>
          <Textarea
            value={text} onChange={e => setText(e.target.value)} autoFocus
            placeholder="Current phase/gate, next physical action, what's blocking…"
            style={{ minHeight: 60, fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
            <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
            <Button size="sm" variant="primary" onClick={save}>Save</Button>
          </div>
        </>
      ) : (
        project.statusNote
          ? <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{project.statusNote}</p>
          : <p onClick={() => setEditing(true)} style={{ fontSize: 12, color: 'var(--text-placeholder)', margin: 0, fontStyle: 'italic', cursor: 'pointer' }}>Click to set current phase, next action, and blockers…</p>
      )}
    </div>
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
  const { activeProject, updateProject, deleteProject, setProjectPhases, setStatusNote } = useProjects();
  const { projectDetailTab, setProjectDetailTab, setActiveTab } = useNavigation();
  const stats = useStats(activeProject?.id);
  const { state } = useAppStore();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [phaseFilter, setPhaseFilter] = useState(null);

  useEffect(() => { setPhaseFilter(null); }, [activeProject?.id]);

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

      {/* Phase strip (stage-gate workflow) */}
      <PhaseStrip
        project={activeProject}
        phaseFilter={phaseFilter}
        setPhaseFilter={setPhaseFilter}
        onSavePhases={(phases) => setProjectPhases(activeProject.id, phases)}
      />

      {/* Pinned status note */}
      <StatusNoteCard project={activeProject} onSave={(note) => setStatusNote(activeProject.id, note)} />

      {/* Tab bar */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', flexShrink: 0, marginTop: 14 }}>
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
        {projectDetailTab === 'tasks' && <TasksTab projectId={activeProject.id} phaseFilter={phaseFilter} />}
        {projectDetailTab === 'notes' && <NotesTab projectId={activeProject.id} />}
        {projectDetailTab === 'files' && <FilesTab projectId={activeProject.id} />}
        {projectDetailTab === 'time'  && <TimeTab  projectId={activeProject.id} />}
      </div>

      <StatusModal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} project={activeProject} onUpdate={updateProject} />
    </div>
  );
}
