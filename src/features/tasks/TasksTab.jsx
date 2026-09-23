import { useState, useEffect } from 'react';
import { useTasks, useTaskNotes } from '../../hooks';
import { Button, PriorityBadge, TaskStatusBadge, Modal, FormField, Input, Select, Textarea, TASK_STATUS_LABELS } from '../../components/ui';
import { RichTextEditor, RichTextRenderer } from '../../components/ui/RichText';
import { formatDate, formatDateTime } from '../../utils/data';
import { Plus, Trash2, CalendarDays, StickyNote, Pencil, FileText, ClipboardList } from 'lucide-react';

const PRIORITIES    = ['low', 'medium', 'high', 'critical'];
const TASK_STATUSES = ['on-hold', 'working-on-it', 'completed-it'];

const tsToDateInput = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// ── Add Task Modal ─────────────────────────────────────────────────────────────
function AddTaskModal({ isOpen, onClose, projectId }) {
  const { addTask } = useTasks();
  const [form, setForm] = useState({ title: '', priority: 'medium', taskStatus: 'working-on-it', dueDate: '', assignee: '', miniNote: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    addTask({ ...form, projectId, dueDate: form.dueDate ? new Date(form.dueDate).getTime() : null });
    setForm({ title: '', priority: 'medium', taskStatus: 'working-on-it', dueDate: '', assignee: '', miniNote: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Task">
      <FormField label="Title *"><Input value={form.title} onChange={set('title')} placeholder="Task title" autoFocus /></FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Priority">
          <Select value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select value={form.taskStatus} onChange={set('taskStatus')}>
            {TASK_STATUSES.map(s => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
          </Select>
        </FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Due Date"><Input type="date" value={form.dueDate} onChange={set('dueDate')} /></FormField>
        <FormField label="Assignee"><Input value={form.assignee} onChange={set('assignee')} placeholder="Name" /></FormField>
      </div>
      <FormField label="Quick Note"><Textarea value={form.miniNote} onChange={set('miniNote')} placeholder="Quick note…" style={{ minHeight: 60 }} /></FormField>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Add Task</Button>
      </div>
    </Modal>
  );
}

// ── Task Notes Panel (inside edit modal) ───────────────────────────────────────
function TaskNoteEditor({ note, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle]     = useState(note.title);
  const [text,  setText]      = useState(note.text);

  const save = () => {
    onUpdate({ id: note.id, title: title || 'Untitled', text });
    setEditing(false);
  };
  const cancel = () => { setTitle(note.title); setText(note.text); setEditing(false); };

  return (
    <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
      {editing ? (
        <>
          <input
            value={title} onChange={e => setTitle(e.target.value)} autoFocus
            style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border-med)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', padding: '0 0 6px', marginBottom: 8, fontFamily: 'inherit', outline: 'none', background: 'transparent', boxSizing: 'border-box' }}
            placeholder="Note title"
          />
          <RichTextEditor
            value={text}
            onChange={setText}
            placeholder="Write your note…"
            minHeight={100}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <Button size="sm" variant="primary" onClick={save}>Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: note.text ? 6 : 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{note.title || 'Untitled'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>{formatDateTime(note.updatedAt)}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
              <button onClick={() => onDelete(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', padding: '3px 5px', borderRadius: 4, display: 'flex' }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          {note.text
            ? <RichTextRenderer text={note.text} />
            : <p style={{ fontSize: 12, color: 'var(--text-placeholder)', margin: 0, fontStyle: 'italic' }}>Empty — click Edit to add content.</p>
          }
        </>
      )}
    </div>
  );
}

function TaskNotesPanel({ taskId }) {
  const { notes, addNote, updateNote, deleteNote } = useTaskNotes(taskId);
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
        <Button size="sm" variant="primary" onClick={() => addNote({ title: 'New Note', text: '' })}>
          <Plus size={12} /> Add Note
        </Button>
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-placeholder)' }}>
          <FileText size={26} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.35 }} />
          <p style={{ fontSize: 13, margin: 0 }}>No notes yet — click Add Note to start.</p>
        </div>
      )}

      {sorted.map(note => (
        <TaskNoteEditor key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} />
      ))}
    </div>
  );
}

// ── Edit Task Modal ────────────────────────────────────────────────────────────
function EditTaskModal({ task, onClose, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState('details');
  const { notes } = useTaskNotes(task.id);

  const [form, setForm] = useState({
    title:         task.title         ?? '',
    priority:      task.priority      ?? 'medium',
    taskStatus:    task.taskStatus    ?? 'working-on-it',
    statusComment: task.statusComment ?? '',
    dueDate:       tsToDateInput(task.dueDate),
    assignee:      task.assignee      ?? '',
    miniNote:      task.miniNote      ?? '',
  });

  useEffect(() => {
    setForm({
      title:         task.title         ?? '',
      priority:      task.priority      ?? 'medium',
      taskStatus:    task.taskStatus    ?? 'working-on-it',
      statusComment: task.statusComment ?? '',
      dueDate:       tsToDateInput(task.dueDate),
      assignee:      task.assignee      ?? '',
      miniNote:      task.miniNote      ?? '',
    });
  }, [task.id]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onUpdate({ id: task.id, ...form, dueDate: form.dueDate ? new Date(form.dueDate).getTime() : null });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${task.title}"?`)) { onDelete(task.id); onClose(); }
  };

  const TABS = [
    { id: 'details', label: 'Details',  icon: ClipboardList },
    { id: 'notes',   label: `Notes${notes.length ? ` (${notes.length})` : ''}`, icon: FileText },
  ];

  return (
    <Modal isOpen onClose={activeTab === 'details' ? handleSave : onClose} title={form.title || 'Edit Task'} width={540}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, margin: '-4px -20px 16px', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', border: 'none', cursor: 'pointer',
              background: 'transparent', fontFamily: 'inherit', fontSize: 13,
              fontWeight: activeTab === tab.id ? 500 : 400,
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {activeTab === 'details' && (
        <>
          <FormField label="Title">
            <Input value={form.title} onChange={set('title')} autoFocus style={{ fontSize: 14, fontWeight: 500 }} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Status">
              <Select value={form.taskStatus} onChange={set('taskStatus')}>
                {TASK_STATUSES.map(s => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Status Comment">
            <Input value={form.statusComment} onChange={set('statusComment')} placeholder="e.g. Blocked on hardware delivery…" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Due Date"><Input type="date" value={form.dueDate} onChange={set('dueDate')} /></FormField>
            <FormField label="Assignee"><Input value={form.assignee} onChange={set('assignee')} placeholder="Name" /></FormField>
          </div>
          <FormField label="Quick Note">
            <Textarea value={form.miniNote} onChange={set('miniNote')} placeholder="One-liner note shown on the task row…" style={{ minHeight: 70 }} />
          </FormField>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 size={13} /> Delete</Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </>
      )}

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <TaskNotesPanel taskId={task.id} />
      )}
    </Modal>
  );
}

// ── Task Row ───────────────────────────────────────────────────────────────────
function TaskRow({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const { notes } = useTaskNotes(task.id);

  const due = task.dueDate ? Math.ceil((task.dueDate - Date.now()) / 86400000) : null;
  const isOverdue = due !== null && due < 0 && task.taskStatus !== 'completed-it';

  return (
    <>
      <div
        onClick={() => setEditing(true)}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
          marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', cursor: 'pointer',
        }}
      >
        {/* Complete toggle */}
        <div
          onClick={e => {
            e.stopPropagation();
            onUpdate({ id: task.id, taskStatus: task.taskStatus === 'completed-it' ? 'working-on-it' : 'completed-it' });
          }}
          title={task.taskStatus === 'completed-it' ? 'Mark incomplete' : 'Mark complete'}
          style={{
            width: 17, height: 17, borderRadius: '50%', flexShrink: 0,
            border: task.taskStatus === 'completed-it' ? '2px solid var(--success)' : '2px solid var(--border-strong)',
            background: task.taskStatus === 'completed-it' ? 'var(--success)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {task.taskStatus === 'completed-it' && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Title */}
        <span style={{
          fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: task.taskStatus === 'completed-it' ? 'var(--text-faint)' : 'var(--text-primary)',
          textDecoration: task.taskStatus === 'completed-it' ? 'line-through' : 'none',
        }}>
          {task.title}
        </span>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {task.statusComment && (
            <span style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.statusComment}
            </span>
          )}
          {/* Notes count badge */}
          {notes.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--accent)', background: 'var(--accent-light)', border: '1px solid var(--accent-mid)', borderRadius: 4, padding: '1px 6px', fontWeight: 500 }}>
              <FileText size={10} /> {notes.length}
            </span>
          )}
          {task.miniNote && <StickyNote size={12} color="var(--warning)" title={task.miniNote} />}
          {task.dueDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: isOverdue ? 'var(--danger)' : 'var(--text-faint)' }}>
              <CalendarDays size={11} />{formatDate(task.dueDate)}
            </span>
          )}
          <TaskStatusBadge status={task.taskStatus} />
          <PriorityBadge priority={task.priority} />
          <Pencil size={12} color="var(--text-placeholder)" />
        </div>
      </div>

      {editing && (
        <EditTaskModal task={task} onClose={() => setEditing(false)} onUpdate={onUpdate} onDelete={onDelete} />
      )}
    </>
  );
}

// ── Tasks Tab ──────────────────────────────────────────────────────────────────
export default function TasksTab({ projectId }) {
  const { tasks, updateTask, deleteTask } = useTasks(projectId);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter]   = useState('all');

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.taskStatus === filter);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all', 'All'], ['on-hold', 'On Hold'], ['working-on-it', 'Working'], ['completed-it', 'Done']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12,
              fontFamily: 'inherit', background: filter === val ? 'var(--accent)' : 'transparent',
              color: filter === val ? '#fff' : 'var(--text-faint)', fontWeight: filter === val ? 500 : 400,
            }}>
              {label}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={13} /> Add Task
        </Button>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)', fontSize: 13 }}>No tasks here</div>
      )}

      {filtered.map(task => (
        <TaskRow key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
      ))}

      <AddTaskModal isOpen={showAdd} onClose={() => setShowAdd(false)} projectId={projectId} />
    </div>
  );
}
