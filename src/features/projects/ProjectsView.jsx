import { useProjects, useTasks, useNavigation } from '../../hooks';
import { ProjectStatusBadge, ProgressBar } from '../../components/ui';
import { formatDate, daysUntil } from '../../utils/data';
import { CalendarDays, ArrowRight } from 'lucide-react';

export default function ProjectsView() {
  const { projects, setActiveProject } = useProjects();
  const { setActiveTab } = useNavigation();
  const { tasks } = useTasks();

  const open = (id) => { setActiveProject(id); setActiveTab('project'); };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg-page)' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Projects</h1>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 3 }}>All projects — click to open</p>
      </div>
      {projects.map(p => {
        const projectTasks = tasks.filter(t => t.projectId === p.id);
        const done = projectTasks.filter(t => t.taskStatus === 'completed-it').length;
        const pct = projectTasks.length === 0 ? 0 : Math.round((done / projectTasks.length) * 100);
        const due = daysUntil(p.dueDate);
        return (
          <div key={p.id} onClick={() => open(p.id)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 12, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 14, letterSpacing: '-0.01em' }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 16 }}>
                <ProjectStatusBadge status={p.status} />
                {p.dueDate && <span style={{ fontSize: 12, color: due !== null && due < 7 ? 'var(--danger)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}><CalendarDays size={11} />{formatDate(p.dueDate)}</span>}
                <ArrowRight size={14} color="var(--text-placeholder)" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}><ProgressBar value={pct} color={p.color} height={3} /></div>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>{done}/{projectTasks.length} tasks</span>
            </div>
            {p.statusComment && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 8 }}>"{p.statusComment}"</div>}
          </div>
        );
      })}
    </div>
  );
}
