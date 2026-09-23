import { useState } from 'react';
import { useNotes } from '../../hooks';
import { Button } from '../../components/ui';
import { RichTextEditor, RichTextRenderer } from '../../components/ui/RichText';
import { formatDateTime } from '../../utils/data';
import { Plus, Trash2, FileText } from 'lucide-react';

function NoteEditor({ note, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(note.text === '' && note.title === 'New Note');
  const [title, setTitle]     = useState(note.title);
  const [text,  setText]      = useState(note.text);

  const save   = () => { onUpdate({ id: note.id, title: title || 'Untitled Note', text }); setEditing(false); };
  const cancel = () => { setTitle(note.title); setText(note.text); setEditing(false); };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginBottom: 12 }}>
      {editing ? (
        <>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border-med)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', padding: '0 0 8px', marginBottom: 10, fontFamily: 'inherit', outline: 'none', background: 'transparent', boxSizing: 'border-box' }}
            placeholder="Note title"
          />
          <RichTextEditor
            value={text}
            onChange={setText}
            placeholder="Write your note here…"
            minHeight={140}
            autoFocus={false}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Button size="sm" variant="primary" onClick={save}>Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>{note.title || 'Untitled Note'}</h3>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{formatDateTime(note.updatedAt)}</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
              <button onClick={() => onDelete(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', padding: '4px 6px', borderRadius: 4, display: 'flex' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          {note.text
            ? <RichTextRenderer text={note.text} />
            : <p style={{ fontSize: 13, color: 'var(--text-placeholder)', margin: 0, fontStyle: 'italic' }}>Empty — click Edit to add content.</p>
          }
        </>
      )}
    </div>
  );
}

export default function NotesTab({ projectId }) {
  const { notes, addNote, updateNote, deleteNote } = useNotes(projectId);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
        <Button variant="primary" size="sm" onClick={() => addNote({ title: 'New Note', text: '' })}>
          <Plus size={13} /> Quick Note
        </Button>
      </div>
      {notes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-placeholder)' }}>
          <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
          <p style={{ fontSize: 13, margin: 0 }}>No notes yet. Hit Quick Note to start.</p>
        </div>
      )}
      {[...notes].sort((a, b) => b.updatedAt - a.updatedAt).map(note => (
        <NoteEditor key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} />
      ))}
    </div>
  );
}
