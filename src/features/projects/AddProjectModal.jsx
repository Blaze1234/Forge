import { useState } from 'react';
import { useProjects } from '../../hooks';
import { Modal, FormField, Input, Textarea, Select, Button } from '../../components/ui';

const PRESET_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#d97706', '#0891b2', '#db2777', '#65a30d'];

export default function AddProjectModal({ isOpen, onClose }) {
  const { addProject } = useProjects();
  const [form, setForm] = useState({
    name: '', description: '', color: '#2563eb', dueDate: '',
    status: 'working-on-it', statusComment: '', type: 'work',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    addProject({ ...form, dueDate: form.dueDate ? new Date(form.dueDate).getTime() : null });
    setForm({ name: '', description: '', color: '#2563eb', dueDate: '', status: 'working-on-it', statusComment: '', type: 'work' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Project">
      <FormField label="Project Name *">
        <Input value={form.name} onChange={set('name')} placeholder="e.g. Robot Cell KNP015" autoFocus />
      </FormField>
      <FormField label="Description">
        <Textarea value={form.description} onChange={set('description')} placeholder="What is this project about?" style={{ minHeight: 60 }} />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Type">
          <Select value={form.type} onChange={set('type')}>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
          </Select>
        </FormField>
        <FormField label="Due Date">
          <Input type="date" value={form.dueDate} onChange={set('dueDate')} />
        </FormField>
      </div>

      <FormField label="Status">
        <Select value={form.status} onChange={set('status')}>
          <option value="working-on-it">Working On It</option>
          <option value="on-hold">On Hold</option>
          <option value="completed-it">Completed</option>
        </Select>
      </FormField>

      <FormField label="Color">
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
              style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
            />
          ))}
        </div>
      </FormField>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Create Project</Button>
      </div>
    </Modal>
  );
}
