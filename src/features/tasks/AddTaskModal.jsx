import { useState } from 'react';
import { useTasks } from '../../hooks';
import { Modal, FormField, Input, Select, Textarea, Button } from '../../components/ui';
import { PRIORITIES, TASK_STATUSES, STATUS_LABELS, PRIORITY_LABELS } from '../../types';

export default function AddTaskModal({ isOpen, onClose, projectId, defaultStatus = 'todo' }) {
  const { addTask } = useTasks();
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: defaultStatus, dueDate: '', assignee: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    addTask({ ...form, projectId, status: form.status || defaultStatus, dueDate: form.dueDate ? new Date(form.dueDate).getTime() : null });
    setForm({ title: '', description: '', priority: 'medium', status: defaultStatus, dueDate: '', assignee: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Task">
      <FormField label="Title *"><Input value={form.title} onChange={set('title')} placeholder="Task title" /></FormField>
      <FormField label="Description"><Textarea value={form.description} onChange={set('description')} placeholder="Optional details" /></FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Status">
          <Select value={form.status} onChange={set('status')}>
            {TASK_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </Select>
        </FormField>
        <FormField label="Priority">
          <Select value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </Select>
        </FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Due Date"><Input type="date" value={form.dueDate} onChange={set('dueDate')} /></FormField>
        <FormField label="Assignee"><Input value={form.assignee} onChange={set('assignee')} placeholder="Name" /></FormField>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Add Task</Button>
      </div>
    </Modal>
  );
}
