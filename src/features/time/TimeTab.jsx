import { useState, useEffect } from 'react';
import { useTimeTracking } from '../../hooks';
import { Button } from '../../components/ui';
import { formatDuration, formatDateTime } from '../../utils/data';
import { Play, Square, Clock, Timer, Pencil, Trash2, Check, X } from 'lucide-react';

function LiveTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState(Date.now() - startedAt);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.02em' }}>
      {formatDuration(elapsed)}
    </span>
  );
}

// ── Convert timestamp to "YYYY-MM-DDThh:mm" for datetime-local input ───────────
function tsToInput(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inputToTs(str) {
  if (!str) return null;
  return new Date(str).getTime();
}

// ── Editable session row ───────────────────────────────────────────────────────
function SessionRow({ entry, isLast, onUpdate, onDelete }) {
  const [editing, setEditing]     = useState(false);
  const [startVal, setStartVal]   = useState('');
  const [endVal,   setEndVal]     = useState('');
  const [noteVal,  setNoteVal]    = useState('');

  const openEdit = () => {
    setStartVal(tsToInput(entry.startedAt));
    setEndVal(tsToInput(entry.stoppedAt));
    setNoteVal(entry.note ?? '');
    setEditing(true);
  };

  const save = () => {
    const newStart = inputToTs(startVal);
    const newEnd   = inputToTs(endVal);
    if (!newStart || !newEnd) return;
    if (newEnd <= newStart) { alert('End time must be after start time.'); return; }
    onUpdate({ id: entry.id, startedAt: newStart, stoppedAt: newEnd, note: noteVal.trim() || null });
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  const duration = (editing ? (inputToTs(endVal) ?? 0) - (inputToTs(startVal) ?? 0) : entry.stoppedAt - entry.startedAt);
  const durationValid = !editing || (inputToTs(endVal) > inputToTs(startVal));

  const inputStyle = {
    background: 'var(--bg-input)', border: '1px solid var(--border-med)',
    color: 'var(--text-primary)', borderRadius: 5, padding: '5px 8px',
    fontSize: 12, fontFamily: 'inherit', outline: 'none',
  };

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      {editing ? (
        /* ── Edit mode ── */
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>START</div>
              <input type="datetime-local" value={startVal} onChange={e => setStartVal(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>END</div>
              <input type="datetime-local" value={endVal} onChange={e => setEndVal(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Duration preview */}
          <div style={{ fontSize: 12, color: durationValid ? 'var(--success)' : 'var(--danger)' }}>
            {durationValid && duration > 0
              ? `Duration: ${formatDuration(duration)}`
              : 'End time must be after start time'}
          </div>

          {/* Note */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>NOTE (optional)</div>
            <input
              type="text" value={noteVal} onChange={e => setNoteVal(e.target.value)}
              placeholder="What were you working on?"
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Check size={12} /> Save
            </button>
            <button onClick={cancel} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-med)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              <X size={12} /> Cancel
            </button>
            <button onClick={() => { if (window.confirm('Delete this session?')) onDelete(entry.id); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--danger-mid)', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      ) : (
        /* ── View mode ── */
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
          <Clock size={13} color="var(--text-faint)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateTime(entry.startedAt)}</span>
              <span style={{ fontSize: 12, color: 'var(--text-placeholder)' }}>→</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateTime(entry.stoppedAt)}</span>
            </div>
            {entry.note && (
              <div style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.note}
              </div>
            )}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'monospace', flexShrink: 0 }}>
            {formatDuration(entry.stoppedAt - entry.startedAt)}
          </span>
          <button
            onClick={openEdit}
            title="Edit session"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', padding: '3px 5px', display: 'flex', borderRadius: 4, flexShrink: 0 }}
          >
            <Pencil size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Time Tab ──────────────────────────────────────────────────────────────────
export default function TimeTab({ projectId }) {
  const { entries, isRunning, activeTimer, startTimer, stopTimer, updateTimeEntry, deleteTimeEntry } = useTimeTracking(projectId);
  const totalMs = entries.reduce((sum, e) => sum + (e.stoppedAt - e.startedAt), 0);
  const sorted  = [...entries].sort((a, b) => b.startedAt - a.startedAt);

  return (
    <div>
      {/* Timer control */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, marginBottom: 16, textAlign: 'center' }}>
        {isRunning ? (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 6 }}>Session running</div>
            <LiveTimer startedAt={activeTimer.startedAt} />
            <div style={{ marginTop: 16 }}>
              <Button variant="danger" onClick={stopTimer}><Square size={14} /> Stop</Button>
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Timer size={22} color="var(--accent)" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Track time spent on this project</div>
            <Button variant="primary" onClick={startTimer}><Play size={14} /> Working On It</Button>
          </>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 500, marginBottom: 4 }}>TOTAL TIME</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{formatDuration(totalMs)}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 500, marginBottom: 4 }}>SESSIONS</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{entries.length}</div>
        </div>
      </div>

      {/* Session history */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Session History</span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Click <Pencil size={11} style={{ verticalAlign: 'middle' }} /> to edit</span>
        </div>
        {sorted.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-placeholder)', fontSize: 13 }}>No sessions recorded yet</div>
        ) : (
          sorted.map((entry, i) => (
            <SessionRow
              key={entry.id}
              entry={entry}
              isLast={i === sorted.length - 1}
              onUpdate={updateTimeEntry}
              onDelete={deleteTimeEntry}
            />
          ))
        )}
      </div>
    </div>
  );
}
