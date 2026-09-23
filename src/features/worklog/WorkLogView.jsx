import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/AppContext';
import { useProjects, useAllTimeEntries } from '../../hooks';
import { buildWorkLog, dayLabel, formatDuration, toDateKey } from '../../utils/data';
import { PriorityBadge } from '../../components/ui';
import { Clock, CheckCircle2, ChevronDown, ChevronUp, Calendar, Search, X, Plus, Trash2, Pencil, Check } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────
function ProjectChip({ project }) {
  if (!project) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-faint)', background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 7px' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
      {project.name}
    </span>
  );
}

function ProjectTimeBar({ project, ms, totalMs }) {
  const pct = totalMs > 0 ? (ms / totalMs) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: project?.color ?? '#888', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project?.name ?? 'Unknown'}</span>
      <div style={{ width: 80, height: 4, background: 'var(--border-med)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: project?.color ?? 'var(--accent)', borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: 48, textAlign: 'right' }}>{formatDuration(ms)}</span>
    </div>
  );
}

// ── Manual Entry Form ──────────────────────────────────────────────────────────
function ManualEntryForm({ dateKey, projects, tasks, onAdd, onClose }) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const defaultStart = `${pad(now.getHours() - 1)}:${pad(now.getMinutes())}`;
  const defaultEnd   = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [form, setForm] = useState({
    projectId: projects[0]?.id ?? '',
    taskId:    '',
    startTime: defaultStart,
    endTime:   defaultEnd,
    note:      '',
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Tasks filtered to selected project
  const projectTasks = useMemo(
    () => tasks.filter(t => t.projectId === form.projectId),
    [tasks, form.projectId]
  );

  // When project changes, reset task
  const handleProjectChange = (e) => {
    setForm(f => ({ ...f, projectId: e.target.value, taskId: '' }));
  };

  // Parse "HH:MM" on the given dateKey into a timestamp
  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const [y, mo, d] = dateKey.split('-').map(Number);
    return new Date(y, mo - 1, d, h, m, 0, 0).getTime();
  };

  const handleSubmit = () => {
    if (!form.projectId || !form.startTime || !form.endTime) return;
    const startedAt = parseTime(form.startTime);
    const stoppedAt = parseTime(form.endTime);
    if (stoppedAt <= startedAt) { alert('End time must be after start time.'); return; }
    onAdd({
      projectId: form.projectId,
      taskId:    form.taskId   || null,
      note:      form.note.trim() || null,
      startedAt,
      stoppedAt,
    });
    onClose();
  };

  const inputStyle = {
    background: 'var(--bg-input)', border: '1px solid var(--border-med)',
    color: 'var(--text-primary)', borderRadius: 6, padding: '7px 9px',
    fontSize: 12, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 10, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, display: 'block' };

  return (
    <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-med)', borderRadius: 8, padding: '14px 16px', margin: '8px 14px 12px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Add Manual Entry</div>

      {/* Project + Task row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Project *</label>
          <select value={form.projectId} onChange={handleProjectChange} style={inputStyle}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Task (optional)</label>
          <select value={form.taskId} onChange={set('taskId')} style={inputStyle}>
            <option value="">— No specific task —</option>
            {projectTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      </div>

      {/* Time row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Start Time *</label>
          <input type="time" value={form.startTime} onChange={set('startTime')} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>End Time *</label>
          <input type="time" value={form.endTime} onChange={set('endTime')} style={inputStyle} />
        </div>
      </div>

      {/* Duration preview */}
      {form.startTime && form.endTime && (() => {
        const start = parseTime(form.startTime);
        const end   = parseTime(form.endTime);
        const diff  = end - start;
        if (diff <= 0) return <div style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 8 }}>⚠ End time must be after start time</div>;
        return <div style={{ fontSize: 11, color: 'var(--success)', marginBottom: 8 }}>Duration: {formatDuration(diff)}</div>;
      })()}

      {/* Note */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Note (optional)</label>
        <input
          type="text"
          value={form.note}
          onChange={set('note')}
          placeholder="What were you working on?"
          style={inputStyle}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-med)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
        <button onClick={handleSubmit} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          Add Entry
        </button>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function tsToTimeInput(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function applyTimeToTs(existingTs, timeStr) {
  // Keep the same date as the existing timestamp, just change hours/minutes
  const d = new Date(existingTs);
  const [h, m] = timeStr.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

// ── Editable Session Row ───────────────────────────────────────────────────────
function SessionRow({ session, project, task, projects, allTasks, onUpdate, onDelete }) {
  const [editing, setEditing]   = useState(false);
  const [startVal, setStartVal] = useState('');
  const [endVal,   setEndVal]   = useState('');
  const [noteVal,  setNoteVal]  = useState('');
  const [projId,   setProjId]   = useState('');
  const [taskId,   setTaskId]   = useState('');

  const start = new Date(session.startedAt);
  const end   = new Date(session.stoppedAt);
  const fmt   = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const isManual = !!session.note || !!session.taskId;

  const openEdit = () => {
    // For midnight-split sessions, show the original entry's times not the clipped ones
    const displayStart = session.originalStartedAt ?? session.startedAt;
    const displayEnd   = session.originalStoppedAt ?? session.stoppedAt;
    setStartVal(tsToTimeInput(displayStart));
    setEndVal(tsToTimeInput(displayEnd));
    setNoteVal(session.note ?? '');
    setProjId(session.projectId ?? '');
    setTaskId(session.taskId ?? '');
    setEditing(true);
  };

  const projectTasks = allTasks.filter(t => t.projectId === projId);

  // Use original timestamps as base so midnight-split sessions edit correctly
  const baseStart = session.originalStartedAt ?? session.startedAt;
  const baseEnd   = session.originalStoppedAt ?? session.stoppedAt;
  const newStart = startVal ? applyTimeToTs(baseStart, startVal) : baseStart;
  const newEnd   = endVal   ? applyTimeToTs(baseEnd,   endVal)   : baseEnd;
  const newDuration = newEnd - newStart;
  const valid = newDuration > 0;

  const save = () => {
    if (!valid) { alert('End time must be after start time.'); return; }
    onUpdate({ id: session.id, startedAt: newStart, stoppedAt: newEnd, projectId: projId, taskId: taskId || null, note: noteVal.trim() || null });
    setEditing(false);
  };

  const inputStyle = {
    background: 'var(--bg-input)', border: '1px solid var(--border-med)',
    color: 'var(--text-primary)', borderRadius: 5, padding: '5px 8px',
    fontSize: 12, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 10, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3, display: 'block' };

  if (editing) {
    return (
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card-alt)' }}>
        {/* Project + Task */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Project</label>
            <select value={projId} onChange={e => { setProjId(e.target.value); setTaskId(''); }} style={inputStyle}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Task (optional)</label>
            <select value={taskId} onChange={e => setTaskId(e.target.value)} style={inputStyle}>
              <option value="">— None —</option>
              {projectTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        </div>

        {/* Times */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          <div>
            <label style={labelStyle}>Start</label>
            <input type="time" value={startVal} onChange={e => setStartVal(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>End</label>
            <input type="time" value={endVal} onChange={e => setEndVal(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Duration preview */}
        <div style={{ fontSize: 11, color: valid ? 'var(--success)' : 'var(--danger)', marginBottom: 8 }}>
          {valid ? `Duration: ${formatDuration(newDuration)}` : '⚠ End must be after start'}
        </div>

        {/* Note */}
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Note (optional)</label>
          <input type="text" value={noteVal} onChange={e => setNoteVal(e.target.value)} placeholder="What were you working on?" style={inputStyle} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Check size={12} /> Save
          </button>
          <button onClick={() => setEditing(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-med)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            <X size={12} /> Cancel
          </button>
          <button onClick={() => { if (window.confirm('Delete this session?')) { onDelete(session.id); } }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--danger-mid)', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
      <Clock size={12} color={isManual ? 'var(--accent)' : 'var(--text-placeholder)'} style={{ flexShrink: 0 }} title={isManual ? 'Manual entry' : 'Timer entry'} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, minWidth: 130 }}>{fmt(start)} → {fmt(end)}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
        <ProjectChip project={project} />
        {task && (
          <span style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent-light)', border: '1px solid var(--accent-mid)', borderRadius: 4, padding: '2px 7px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.title}
          </span>
        )}
        {session.note && (
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
            {session.note}
          </span>
        )}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace', flexShrink: 0 }}>{formatDuration(session.duration)}</span>
      <button onClick={openEdit} title="Edit entry" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', padding: '2px 4px', display: 'flex', borderRadius: 4, flexShrink: 0 }}>
        <Pencil size={12} />
      </button>
    </div>
  );
}

// ── Day Card ──────────────────────────────────────────────────────────────────
function DayCard({ day, projects, allTasks, highlighted, forceExpanded, onAddEntry, onUpdateEntry, onDeleteEntry }) {
  const [manualExpanded, setManualExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const expanded = manualExpanded !== null ? manualExpanded : (forceExpanded || false);
  const cardRef  = useRef(null);

  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [highlighted]);

  const projectsWorked = Object.entries(day.byProject)
    .sort((a, b) => b[1] - a[1])
    .map(([id, ms]) => ({ project: projects.find(p => p.id === id), ms }));

  const hasContent = day.sessions.length > 0 || day.completedTasks.length > 0;

  return (
    <div ref={cardRef} style={{
      background: 'var(--bg-card)',
      border: highlighted ? '2px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: 10, marginBottom: 14, overflow: 'hidden',
      boxShadow: highlighted ? '0 0 0 3px var(--accent-light)' : 'none',
      transition: 'box-shadow 0.3s, border-color 0.3s',
    }}>
      {/* Header */}
      <div
        onClick={() => setManualExpanded(e => e === null ? !forceExpanded : !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', borderBottom: expanded ? '1px solid var(--border)' : 'none' }}
      >
        <div style={{ minWidth: 110 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: highlighted ? 'var(--accent)' : 'var(--text-primary)' }}>{dayLabel(day.dateKey)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{day.dateKey}</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {projectsWorked.length > 0
            ? projectsWorked.map(({ project, ms }) => <ProjectTimeBar key={project?.id ?? ms} project={project} ms={ms} totalMs={day.totalMs} />)
            : <span style={{ fontSize: 12, color: 'var(--text-placeholder)', fontStyle: 'italic' }}>No time recorded</span>
          }
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Add entry button — stops propagation so it doesn't toggle expand */}
          <button
            onClick={e => { e.stopPropagation(); setManualExpanded(true); setShowForm(true); }}
            title="Add manual time entry"
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-med)', background: 'var(--bg-card-alt)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
          >
            <Plus size={12} /> Add
          </button>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{formatDuration(day.totalMs)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''} · {day.completedTasks.length} done
            </div>
          </div>
          <span style={{ color: 'var(--text-placeholder)' }}>{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <>
          {/* Manual entry form */}
          {showForm && (
            <ManualEntryForm
              dateKey={day.dateKey}
              projects={projects}
              tasks={allTasks}
              onAdd={onAddEntry}
              onClose={() => setShowForm(false)}
            />
          )}

          {/* Time sessions */}
          {day.sessions.length > 0 && (
            <div>
              <div style={{ padding: '10px 18px 6px', fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Time Sessions
              </div>
              {day.sessions.map((s, i) => (
                <SessionRow
                  key={s.id ?? i}
                  session={s}
                  project={projects.find(p => p.id === s.projectId)}
                  task={s.taskId ? allTasks.find(t => t.id === s.taskId) : null}
                  projects={projects}
                  allTasks={allTasks}
                  onUpdate={onUpdateEntry}
                  onDelete={onDeleteEntry}
                />
              ))}
            </div>
          )}

          {/* Completed tasks */}
          {day.completedTasks.length > 0 && (
            <div style={{ borderTop: day.sessions.length > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ padding: '10px 18px 6px', fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Completed Tasks
              </div>
              {day.completedTasks.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                return (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
                    <CheckCircle2 size={13} color="var(--success)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    <ProjectChip project={project} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state — still show add hint */}
          {!hasContent && !showForm && (
            <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-placeholder)', fontStyle: 'italic', flex: 1 }}>No time or tasks recorded for this day.</span>
              <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={12} /> Add time
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Empty Day Card ─────────────────────────────────────────────────────────────
function EmptyDayCard({ dateKey, projects, allTasks, onAddEntry }) {
  const [showForm, setShowForm] = useState(false);
  const cardRef = useRef(null);
  useEffect(() => { cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, []);

  return (
    <div ref={cardRef} style={{ background: 'var(--bg-card)', border: '2px solid var(--accent)', borderRadius: 10, marginBottom: 14, boxShadow: '0 0 0 3px var(--accent-light)' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 2 }}>{dayLabel(dateKey)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{dateKey}</div>
          <div style={{ fontSize: 13, color: 'var(--text-placeholder)', fontStyle: 'italic', marginTop: 6 }}>No entries for this date.</div>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={12} /> Add entry
        </button>
      </div>
      {showForm && (
        <ManualEntryForm
          dateKey={dateKey}
          projects={projects}
          tasks={allTasks}
          onAdd={onAddEntry}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// ── Work Log View ─────────────────────────────────────────────────────────────
export default function WorkLogView() {
  const { state }                           = useAppStore();
  const { projects }                        = useProjects();
  const { timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry } = useAllTimeEntries();
  const [projectFilter, setProjectFilter]   = useState('all');
  const [lookupDate,    setLookupDate]      = useState('');
  const [searchedDate,  setSearchedDate]    = useState('');

  const allTasks = state.tasks ?? [];

  const allDays = useMemo(
    () => buildWorkLog(timeEntries, allTasks),
    [timeEntries, allTasks]
  );

  const days = useMemo(() => {
    if (projectFilter === 'all') return allDays;
    return allDays
      .map(day => ({
        ...day,
        sessions:       day.sessions.filter(s => s.projectId === projectFilter),
        byProject:      Object.fromEntries(Object.entries(day.byProject).filter(([id]) => id === projectFilter)),
        totalMs:        day.sessions.filter(s => s.projectId === projectFilter).reduce((s, e) => s + e.duration, 0),
        completedTasks: day.completedTasks.filter(t => t.projectId === projectFilter),
      }))
      .filter(day => day.sessions.length > 0 || day.completedTasks.length > 0);
  }, [allDays, projectFilter]);

  const grandTotal    = days.reduce((s, d) => s + d.totalMs, 0);
  const totalSessions = days.reduce((s, d) => s + d.sessions.length, 0);
  const totalDone     = days.reduce((s, d) => s + d.completedTasks.length, 0);

  const searchedDayExists = searchedDate ? days.some(d => d.dateKey === searchedDate) : false;
  const searchedDayInAll  = searchedDate ? allDays.some(d => d.dateKey === searchedDate) : false;

  const handleLookup  = () => { if (lookupDate) setSearchedDate(lookupDate); };
  const clearSearch   = () => { setLookupDate(''); setSearchedDate(''); };

  // Today's date key — always show a card for today even if empty
  const todayKey = toDateKey(Date.now());
  const hasTodayCard = days.some(d => d.dateKey === todayKey);

  return (
    <div style={{ padding: 28, overflowY: 'auto', flex: 1, background: 'var(--bg-page)' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Work Log</h1>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 3 }}>Daily breakdown of time and completed tasks — click <strong>Add</strong> on any day to log time manually</p>
      </div>

      {/* Date lookup */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 9, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Calendar size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>Jump to date</span>
        <input
          type="date" value={lookupDate} onChange={e => setLookupDate(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
          max={todayKey}
          style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-med)', color: 'var(--text-primary)', borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
        <button onClick={handleLookup} disabled={!lookupDate} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: lookupDate ? 'pointer' : 'not-allowed', background: lookupDate ? 'var(--accent)' : 'var(--bg-card-alt)', color: lookupDate ? '#fff' : 'var(--text-placeholder)', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 }}>
          <Search size={13} /> Go
        </button>
        {searchedDate && (
          <button onClick={clearSearch} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-med)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0 }}>
            <X size={12} /> Clear
          </button>
        )}
        {searchedDate && (
          <span style={{ fontSize: 12, color: searchedDayExists ? 'var(--success)' : 'var(--text-faint)', flexShrink: 0 }}>
            {searchedDayExists ? `↓ Found — ${dayLabel(searchedDate)}` : searchedDayInAll ? 'No data (try clearing filter)' : 'No data for this date'}
          </span>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Time',      value: formatDuration(grandTotal), color: 'var(--accent)' },
          { label: 'Sessions',        value: totalSessions,              color: 'var(--text-muted)' },
          { label: 'Tasks Completed', value: totalDone,                  color: 'var(--success)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 9, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Project filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {[{ id: 'all', name: 'All Projects', color: null }, ...projects].map(p => (
          <button key={p.id} onClick={() => setProjectFilter(p.id)} style={{
            padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12,
            fontFamily: 'inherit', fontWeight: projectFilter === p.id ? 600 : 400,
            background: projectFilter === p.id ? 'var(--accent)' : 'var(--bg-card)',
            color: projectFilter === p.id ? '#fff' : 'var(--text-muted)',
            border: projectFilter === p.id ? '1px solid var(--accent)' : '1px solid var(--border-med)',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {p.color && <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }} />}
            {p.name}
          </button>
        ))}
      </div>

      {/* Today card always visible if no entries yet */}
      {!hasTodayCard && !searchedDate && (
        <EmptyDayCard
          dateKey={todayKey}
          projects={projects}
          allTasks={allTasks}
          onAddEntry={addTimeEntry}
        />
      )}

      {/* Day cards */}
      {days.length === 0 && !searchedDate && hasTodayCard ? null : null}

      {/* Searched date placeholder */}
      {searchedDate && !searchedDayExists && (
        <EmptyDayCard
          dateKey={searchedDate}
          projects={projects}
          allTasks={allTasks}
          onAddEntry={addTimeEntry}
        />
      )}

      {days.map(day => (
        <DayCard
          key={day.dateKey}
          day={day}
          projects={projects}
          allTasks={allTasks}
          highlighted={searchedDate === day.dateKey}
          forceExpanded={searchedDate === day.dateKey}
          onAddEntry={addTimeEntry}
          onUpdateEntry={updateTimeEntry}
          onDeleteEntry={deleteTimeEntry}
        />
      ))}

      {days.length === 0 && !searchedDate && !hasTodayCard && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-placeholder)' }}>
          <Calendar size={36} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: 14, margin: '0 0 6px' }}>No work sessions yet</p>
          <p style={{ fontSize: 13, margin: 0 }}>Start a timer on a project, or use the card above to log time manually.</p>
        </div>
      )}
    </div>
  );
}
