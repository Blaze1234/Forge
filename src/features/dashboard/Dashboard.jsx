import { useProjects, useStats, useNavigation, useProjectRanking } from '../../hooks';
import { useTasks } from '../../hooks';
import { ProjectStatusBadge, TypeBadge, PriorityBadge, TaskStatusBadge, ProgressBar } from '../../components/ui';
import { daysUntil } from '../../utils/data';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { GripVertical } from 'lucide-react';

// ── Ordinal helper ─────────────────────────────────────────────────────────────
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Rank badge ─────────────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  const isTop = rank === 1;
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
      background: isTop ? 'var(--accent)' : 'var(--bg-card-alt)',
      border: `1px solid ${isTop ? 'var(--accent)' : 'var(--border-med)'}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      lineHeight: 1,
    }}>
      <span style={{ fontSize: isTop ? 13 : 12, fontWeight: 700, color: isTop ? '#fff' : 'var(--text-muted)' }}>
        {rank}
      </span>
      <span style={{ fontSize: 8, color: isTop ? 'rgba(255,255,255,0.75)' : 'var(--text-placeholder)', fontWeight: 500 }}>
        {rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'}
      </span>
    </div>
  );
}

// ── Sortable project card ──────────────────────────────────────────────────────
function SortableProjectCard({ project, rank, onClick }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: project.id });

  const stats = useStats(project.id);
  const due = daysUntil(project.dueDate);
  const isOverdue = due !== null && due < 0 && project.status !== 'completed-it';

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex', alignItems: 'stretch', gap: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${project.color}`,
        borderRadius: 9,
        cursor: 'pointer',
        boxShadow: isDragging ? 'var(--shadow-modal)' : 'var(--shadow-card)',
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
        style={{
          padding: '0 6px 0 10px', display: 'flex', alignItems: 'center',
          cursor: 'grab', color: 'var(--text-placeholder)', flexShrink: 0,
        }}
      >
        <GripVertical size={13} />
      </div>

      {/* Rank badge */}
      <div style={{ padding: '13px 10px 13px 2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <RankBadge rank={rank} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, padding: '13px 14px 13px 4px' }} onClick={onClick}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.name}
            </div>
            {project.description && (
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.description}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
            <ProjectStatusBadge status={project.status} />
          </div>
        </div>

        {/* Progress + meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <ProgressBar value={stats.progress} color={project.color} height={4} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>
            {stats.done}/{stats.total}
          </span>
          {due !== null && (
            <span style={{ fontSize: 11, color: isOverdue ? 'var(--danger)' : 'var(--text-faint)', flexShrink: 0 }}>
              {isOverdue ? `${Math.abs(due)}d over` : due === 0 ? 'Today' : `${due}d`}
            </span>
          )}
        </div>

        {project.statusComment && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 5 }}>
            "{project.statusComment}"
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ghost card shown under pointer during drag ─────────────────────────────────
function DragGhost({ project, rank }) {
  const stats = useStats(project.id);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderLeft: `3px solid ${project.color}`, borderRadius: 9,
      padding: '13px 14px', boxShadow: 'var(--shadow-modal)', opacity: 0.95,
    }}>
      <RankBadge rank={rank} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{project.name}</div>
        <ProgressBar value={stats.progress} color={project.color} height={3} />
      </div>
    </div>
  );
}

// ── Ranked section (Work or Personal) ─────────────────────────────────────────
function RankedSection({ title, type, onOpen }) {
  const { getRankedProjects, reorder } = useProjectRanking();
  const [activeId, setActiveId] = useState(null);

  const projects = getRankedProjects(type);
  const activeProject = projects.find(p => p.id === activeId);
  const activeRank = activeProject ? projects.indexOf(activeProject) + 1 : 1;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIdx = projects.findIndex(p => p.id === active.id);
    const newIdx = projects.findIndex(p => p.id === over.id);
    reorder(type, arrayMove(projects, oldIdx, newIdx));
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <TypeBadge type={type} />
        <span style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '0.05em', fontWeight: 600, textTransform: 'uppercase' }}>{title}</span>
        <span style={{ fontSize: 11, color: 'var(--text-placeholder)', background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 9, padding: '1px 7px' }}>
          {projects.length}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-placeholder)', marginLeft: 4 }}>— drag to reprioritize</span>
      </div>

      {projects.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-placeholder)', padding: '16px 0', fontStyle: 'italic' }}>
          No {type} projects yet
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map((p, i) => (
                <SortableProjectCard
                  key={p.id}
                  project={p}
                  rank={i + 1}
                  onClick={() => onOpen(p.id)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeProject && <DragGhost project={activeProject} rank={activeRank} />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { setActiveProject } = useProjects();
  const { tasks } = useTasks();
  const { setActiveTab } = useNavigation();

  const goToProject = (id) => { setActiveProject(id); setActiveTab('project'); };
  const recent = [...tasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

  return (
    <div style={{ padding: 28, overflowY: 'auto', flex: 1, background: 'var(--bg-page)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 3 }}>Drag projects to set priority order</p>
      </div>

      <RankedSection title="Work Projects"     type="work"     onOpen={goToProject} />
      <RankedSection title="Personal Projects" type="personal" onOpen={goToProject} />

      {/* Recent tasks */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Recent Tasks</span>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
          {recent.length === 0 ? (
            <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text-placeholder)', fontStyle: 'italic' }}>No tasks yet</div>
          ) : (
            recent.map((task, i) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                <PriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.taskStatus} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
