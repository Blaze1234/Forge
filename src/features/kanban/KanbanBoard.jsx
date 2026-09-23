import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProjects, useTasks } from '../../hooks';
import { PriorityBadge } from '../../components/ui';
import { formatDate, daysUntil } from '../../utils/data';
import { Plus, CalendarDays, GripVertical, ChevronDown } from 'lucide-react';
import AddTaskModal from '../tasks/AddTaskModal';

const COLUMNS = [
  { id: 'on-hold',       label: 'On Hold',      color: 'var(--text-muted)' },
  { id: 'working-on-it', label: 'Working On It', color: 'var(--accent)' },
  { id: 'completed-it',  label: 'Completed',     color: 'var(--success)' },
];

function TaskCard({ task, isDragging = false }) {
  const due = daysUntil(task.dueDate);
  const isOverdue = due !== null && due < 0 && task.taskStatus !== 'completed-it';
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
      padding: '10px 12px', cursor: 'grab',
      boxShadow: isDragging ? 'var(--shadow-modal)' : 'var(--shadow-card)',
      opacity: isDragging ? 0.9 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
        <GripVertical size={12} color="var(--text-placeholder)" style={{ marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.4 }}>{task.title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: isOverdue ? 'var(--danger)' : 'var(--text-faint)' }}>
            <CalendarDays size={11} />{formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}>
      <TaskCard task={task} />
    </div>
  );
}

function Column({ column, tasks, onAddTask }) {
  return (
    <div style={{ background: 'var(--bg-kanban-col)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
      <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: column.color }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{column.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', background: 'var(--border-med)', borderRadius: 10, padding: '1px 6px' }}>{tasks.length}</span>
        </div>
        <button onClick={onAddTask} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', padding: 3, borderRadius: 4 }}>
          <Plus size={14} />
        </button>
      </div>
      <div style={{ flex: 1, padding: '2px 10px 10px', display: 'flex', flexDirection: 'column', gap: 7, overflowY: 'auto' }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => <SortableTaskCard key={task.id} task={task} />)}
        </SortableContext>
        {tasks.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-placeholder)', fontSize: 12 }}>No tasks</div>}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const { projects, activeProject, setActiveProject } = useProjects();
  const { tasks, updateTask } = useTasks(activeProject?.id);
  const [activeTask, setActiveTask] = useState(null);
  const [addingToStatus, setAddingToStatus] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const findTaskColumn = (id) => tasks.find(t => t.id === id)?.taskStatus;

  const handleDragStart = ({ active }) => setActiveTask(tasks.find(t => t.id === active.id));

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const overColumn   = findTaskColumn(over.id) ?? over.id;
    const activeColumn = findTaskColumn(active.id);
    if (overColumn && COLUMNS.some(c => c.id === overColumn) && overColumn !== activeColumn) {
      updateTask({ id: active.id, taskStatus: overColumn });
    }
  };

  if (!activeProject && projects.length === 0) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 14, background: 'var(--bg-page)' }}>
      No projects yet — create one first.
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-page)' }}>
      {/* Header with project dropdown */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <select
            value={activeProject?.id ?? ''}
            onChange={e => setActiveProject(e.target.value)}
            style={{
              appearance: 'none', background: 'var(--bg-page)', border: '1px solid var(--border-med)',
              color: 'var(--text-primary)', borderRadius: 8, padding: '7px 32px 7px 12px',
              fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
              minWidth: 200,
            }}
          >
            {!activeProject && <option value="" disabled>Select a project…</option>}
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        {activeProject && (
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{tasks.length} tasks</span>
        )}
      </div>

      {!activeProject ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 14 }}>
          Select a project above to view its board.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 16, overflow: 'hidden' }}>
            {COLUMNS.map(col => (
              <Column
                key={col.id}
                column={col}
                tasks={tasks.filter(t => t.taskStatus === col.id)}
                onAddTask={() => setAddingToStatus(col.id)}
              />
            ))}
          </div>
          <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragging /> : null}</DragOverlay>
        </DndContext>
      )}

      <AddTaskModal isOpen={!!addingToStatus} onClose={() => setAddingToStatus(null)} projectId={activeProject?.id} defaultStatus={addingToStatus} />
    </div>
  );
}
