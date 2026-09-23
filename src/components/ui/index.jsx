import { X } from 'lucide-react';

// ─── Badge components — all use CSS vars ───────────────────────────────────────
export const TASK_STATUS_LABELS    = { 'on-hold': 'On Hold', 'working-on-it': 'Working On It', 'completed-it': 'Completed' };
export const PROJECT_STATUS_LABELS = { 'on-hold': 'On Hold', 'working-on-it': 'Working On It', 'completed-it': 'Completed' };

export function PriorityBadge({ priority }) {
  const vars = {
    low:      { bg: 'var(--badge-low-bg)',  color: 'var(--badge-low-text)',  border: 'var(--badge-low-border)' },
    medium:   { bg: 'var(--badge-med-bg)',  color: 'var(--badge-med-text)',  border: 'var(--badge-med-border)' },
    high:     { bg: 'var(--badge-high-bg)', color: 'var(--badge-high-text)', border: 'var(--badge-high-border)' },
    critical: { bg: 'var(--badge-crit-bg)', color: 'var(--badge-crit-text)', border: 'var(--badge-crit-border)' },
  };
  const s = vars[priority] ?? vars.medium;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 4, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {priority}
    </span>
  );
}

export function TaskStatusBadge({ status }) {
  const vars = {
    'on-hold':       { bg: 'var(--badge-on-hold-bg)', color: 'var(--badge-on-hold-text)', border: 'var(--badge-on-hold-border)', dot: 'var(--text-faint)' },
    'working-on-it': { bg: 'var(--badge-working-bg)', color: 'var(--badge-working-text)', border: 'var(--badge-working-border)', dot: 'var(--accent)' },
    'completed-it':  { bg: 'var(--badge-done-bg)',    color: 'var(--badge-done-text)',    border: 'var(--badge-done-border)',    dot: 'var(--success)' },
  };
  const s = vars[status] ?? vars['working-on-it'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {TASK_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function TypeBadge({ type }) {
  const isWork = type === 'work';
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
      letterSpacing: '0.05em', textTransform: 'uppercase',
      background: isWork ? 'var(--accent-light)' : 'var(--success-light)',
      color: isWork ? 'var(--accent)' : 'var(--success)',
      border: `1px solid ${isWork ? 'var(--accent-mid)' : 'var(--success-mid)'}`,
    }}>
      {isWork ? 'Work' : 'Personal'}
    </span>
  );
}

export function ProjectStatusBadge({ status }) {
  const vars = {
    'on-hold':       { bg: 'var(--badge-on-hold-bg)', color: 'var(--badge-on-hold-text)', border: 'var(--badge-on-hold-border)' },
    'working-on-it': { bg: 'var(--badge-working-bg)', color: 'var(--badge-working-text)', border: 'var(--badge-working-border)' },
    'completed-it':  { bg: 'var(--badge-done-bg)',    color: 'var(--badge-done-text)',    border: 'var(--badge-done-border)' },
  };
  const s = vars[status] ?? vars['working-on-it'];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 12, fontWeight: 500, padding: '3px 9px', borderRadius: 5, whiteSpace: 'nowrap' }}>
      {PROJECT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function StatusBadge({ status }) {
  // Kanban compat — maps old todo/in-progress/review/done
  const vars = {
    'todo':        { bg: 'var(--badge-on-hold-bg)', color: 'var(--badge-on-hold-text)', border: 'var(--badge-on-hold-border)' },
    'in-progress': { bg: 'var(--badge-working-bg)', color: 'var(--badge-working-text)', border: 'var(--badge-working-border)' },
    'review':      { bg: 'var(--badge-med-bg)',     color: 'var(--badge-med-text)',     border: 'var(--badge-med-border)' },
    'done':        { bg: 'var(--badge-done-bg)',    color: 'var(--badge-done-text)',    border: 'var(--badge-done-border)' },
  };
  const lbl = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
  const s = vars[status] ?? vars.todo;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 4 }}>
      {lbl[status] ?? status}
    </span>
  );
}

// ─── Button ────────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'default', size = 'md', onClick, style = {}, disabled = false }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', fontWeight: 500, borderRadius: 6, opacity: disabled ? 0.5 : 1,
    transition: 'all 0.12s',
  };
  const sizes = {
    sm: { padding: '5px 10px', fontSize: 12 },
    md: { padding: '7px 14px', fontSize: 13 },
    lg: { padding: '9px 18px', fontSize: 14 },
  };
  const variants = {
    default: { background: 'var(--bg-card)',     color: 'var(--text-secondary)', border: '1px solid var(--border-med)' },
    primary: { background: 'var(--accent)',       color: '#fff',                  border: '1px solid var(--accent)' },
    ghost:   { background: 'transparent',         color: 'var(--text-muted)',     border: '1px solid transparent' },
    danger:  { background: 'var(--danger-light)', color: 'var(--danger)',         border: '1px solid var(--danger-mid)' },
    success: { background: 'var(--success-light)',color: 'var(--success)',        border: '1px solid var(--success-mid)' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = 'var(--accent)', height = 4 }) {
  return (
    <div style={{ background: 'var(--border-med)', borderRadius: height, height, overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: color, borderRadius: height, transition: 'width 0.4s ease' }} />
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, width = 480 }) {
  if (!isOpen) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-med)', borderRadius: 12, width: '100%', maxWidth: width, boxShadow: 'var(--shadow-modal)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, display: 'flex', borderRadius: 4 }}><X size={16} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-med)',
  color: 'var(--text-primary)', borderRadius: 6, padding: '8px 10px',
  fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

export function Input({ ...props }) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}
export function Select({ children, ...props }) {
  return <select {...props} style={{ ...inputStyle, ...props.style }}>{children}</select>;
}
export function Textarea({ ...props }) {
  return <textarea {...props} style={{ ...inputStyle, resize: 'vertical', minHeight: 80, ...props.style }} />;
}
