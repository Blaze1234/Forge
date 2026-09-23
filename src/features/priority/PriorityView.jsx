import { useState, useMemo } from 'react';
import { useProjects, useTasks } from '../../hooks';
import { PriorityBadge, TaskStatusBadge, TypeBadge } from '../../components/ui';
import { formatDate } from '../../utils/data';
import { CalendarDays, StickyNote, ArrowUpDown } from 'lucide-react';

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const PRIORITY_SECTIONS = [
  { key: 'critical', label: 'Critical', color: 'var(--danger)' },
  { key: 'high',     label: 'High',     color: 'var(--badge-high-text)' },
  { key: 'medium',   label: 'Medium',   color: 'var(--badge-med-text)' },
  { key: 'low',      label: 'Low',      color: 'var(--success)' },
];

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
        fontSize: 12, fontFamily: 'inherit', fontWeight: active ? 600 : 400,
        background: active ? 'var(--accent)' : 'var(--bg-card)',
        color: active ? '#fff' : 'var(--text-muted)',
        border: active ? '1px solid var(--accent)' : '1px solid var(--border-med)',
        transition: 'all 0.12s',
      }}
    >
      {children}
    </button>
  );
}

function TaskRow({ task, project }) {
  const due = task.dueDate ? Math.ceil((task.dueDate - Date.now()) / 86400000) : null;
  const isOverdue = due !== null && due < 0 && task.taskStatus !== 'completed-it';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Priority indicator bar */}
      <div style={{
        width: 3, height: 32, borderRadius: 2, flexShrink: 0,
        background: task.priority === 'critical' ? 'var(--danger)'
          : task.priority === 'high'     ? 'var(--badge-high-text)'
          : task.priority === 'medium'   ? 'var(--badge-med-text)'
          : 'var(--success)',
      }} />

      {/* Task name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, color: task.taskStatus === 'completed-it' ? 'var(--text-faint)' : 'var(--text-primary)',
          textDecoration: task.taskStatus === 'completed-it' ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </div>
        {task.miniNote && (
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
            <StickyNote size={10} color="var(--warning)" />
            {task.miniNote}
          </div>
        )}
      </div>

      {/* Project tag */}
      {project && (
        <span style={{
          fontSize: 11, color: 'var(--text-faint)', background: 'var(--bg-card-alt)',
          border: '1px solid var(--border)', borderRadius: 4, padding: '2px 7px',
          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, maxWidth: 140,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
          {project.name}
        </span>
      )}

      {/* Due date */}
      {task.dueDate && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: isOverdue ? 'var(--danger)' : 'var(--text-faint)', flexShrink: 0 }}>
          <CalendarDays size={11} />
          {isOverdue ? `${Math.abs(due)}d over` : `${due}d`}
        </span>
      )}

      <TaskStatusBadge status={task.taskStatus} />
    </div>
  );
}

function PrioritySection({ label, color, tasks, projects }) {
  if (tasks.length === 0) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.07em', margin: 0, textTransform: 'uppercase' }}>
          {label}
        </h2>
        <span style={{ fontSize: 11, color: 'var(--text-placeholder)', background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 9, padding: '1px 7px' }}>
          {tasks.length}
        </span>
      </div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
        {tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            project={projects.find(p => p.id === task.projectId)}
          />
        ))}
      </div>
    </div>
  );
}

export default function PriorityView() {
  const { projects } = useProjects();
  const { allTasks } = useTasks();

  // Filter state
  const [typeFilter,    setTypeFilter]    = useState('all');   // 'all' | 'work' | 'personal'
  const [projectFilter, setProjectFilter] = useState('all');   // 'all' | projectId
  const [statusFilter,  setStatusFilter]  = useState('active'); // 'active' | 'all' | 'completed-it'

  const filteredTasks = useMemo(() => {
    let tasks = allTasks;

    // Type filter — resolve through project
    if (typeFilter !== 'all') {
      const projectIds = new Set(projects.filter(p => (p.type ?? 'work') === typeFilter).map(p => p.id));
      tasks = tasks.filter(t => projectIds.has(t.projectId));
    }

    // Project filter
    if (projectFilter !== 'all') {
      tasks = tasks.filter(t => t.projectId === projectFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      tasks = tasks.filter(t => t.taskStatus !== 'completed-it');
    } else if (statusFilter === 'completed-it') {
      tasks = tasks.filter(t => t.taskStatus === 'completed-it');
    }

    return tasks;
  }, [allTasks, projects, typeFilter, projectFilter, statusFilter]);

  // Projects available in current type filter (for project dropdown)
  const availableProjects = useMemo(() => {
    if (typeFilter === 'all') return projects;
    return projects.filter(p => (p.type ?? 'work') === typeFilter);
  }, [projects, typeFilter]);

  // Reset project filter if it's no longer in available projects
  const handleTypeFilter = (val) => {
    setTypeFilter(val);
    setProjectFilter('all');
  };

  const tasksByPriority = (priority) => filteredTasks.filter(t => t.priority === priority);
  const totalShown = filteredTasks.length;

  return (
    <div style={{ padding: 28, overflowY: 'auto', flex: 1, background: 'var(--bg-page)' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Priority</h1>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 3 }}>All tasks sorted by priority</p>
      </div>

      {/* Filter bar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 9, padding: '14px 16px', marginBottom: 22, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>

        {/* Type */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.07em', marginBottom: 6, textTransform: 'uppercase' }}>Type</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <FilterPill active={typeFilter === 'all'}      onClick={() => handleTypeFilter('all')}>All</FilterPill>
            <FilterPill active={typeFilter === 'work'}     onClick={() => handleTypeFilter('work')}>Work</FilterPill>
            <FilterPill active={typeFilter === 'personal'} onClick={() => handleTypeFilter('personal')}>Personal</FilterPill>
          </div>
        </div>

        <div style={{ width: 1, height: 40, background: 'var(--border)', flexShrink: 0 }} />

        {/* Project */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.07em', marginBottom: 6, textTransform: 'uppercase' }}>Project</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <FilterPill active={projectFilter === 'all'} onClick={() => setProjectFilter('all')}>All</FilterPill>
            {availableProjects.map(p => (
              <FilterPill key={p.id} active={projectFilter === p.id} onClick={() => setProjectFilter(p.id)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  {p.name}
                </span>
              </FilterPill>
            ))}
          </div>
        </div>

        <div style={{ width: 1, height: 40, background: 'var(--border)', flexShrink: 0 }} />

        {/* Status */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.07em', marginBottom: 6, textTransform: 'uppercase' }}>Tasks</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <FilterPill active={statusFilter === 'active'}       onClick={() => setStatusFilter('active')}>Active</FilterPill>
            <FilterPill active={statusFilter === 'all'}          onClick={() => setStatusFilter('all')}>All</FilterPill>
            <FilterPill active={statusFilter === 'completed-it'} onClick={() => setStatusFilter('completed-it')}>Done</FilterPill>
          </div>
        </div>

        {/* Count */}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-faint)' }}>
          {totalShown} task{totalShown !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Priority sections */}
      {PRIORITY_SECTIONS.map(section => (
        <PrioritySection
          key={section.key}
          label={section.label}
          color={section.color}
          tasks={tasksByPriority(section.key)}
          projects={projects}
        />
      ))}

      {totalShown === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-placeholder)' }}>
          <ArrowUpDown size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: 13, margin: 0 }}>No tasks match the current filters</p>
        </div>
      )}
    </div>
  );
}
