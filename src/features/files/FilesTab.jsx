import { useState } from 'react';
import { useFiles } from '../../hooks';
import { Button, Modal, FormField, Input, Select } from '../../components/ui';
import { Plus, Folder, Trash2, ExternalLink, Globe, HardDrive, ChevronDown, ChevronRight, Check, Copy, Pencil } from 'lucide-react';

function AddFileModal({ isOpen, onClose, folderId, onAdd }) {
  const [form, setForm] = useState({ name: '', url: '', isWeb: true });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleUrlChange = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, url: val, isWeb: val.startsWith('http://') || val.startsWith('https://') || val.startsWith('www.') }));
  };
  const handleSubmit = () => {
    if (!form.name.trim() || !form.url.trim()) return;
    onAdd({ folderId, name: form.name, url: form.url, isWeb: form.isWeb });
    setForm({ name: '', url: '', isWeb: true });
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add File / Link">
      <FormField label="Display Name"><Input value={form.name} onChange={set('name')} placeholder="e.g. Wiring Diagram Rev B" /></FormField>
      <FormField label="URL or File Path">
        <Input value={form.url} onChange={handleUrlChange} placeholder="https://... or C:\Users\..." />
        <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 5 }}>
          {form.isWeb ? '🌐 Web link — clicking the file opens it in a new tab' : '📁 Local path — clicking the file copies the path to your clipboard (browsers can\'t open local files directly)'}
        </p>
      </FormField>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Add</Button>
      </div>
    </Modal>
  );
}

// ── Edit File Modal ───────────────────────────────────────────────────────────
function EditFileModal({ file, folders, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    name:     file.name,
    url:      file.url,
    isWeb:    file.isWeb,
    folderId: file.folderId ?? '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, url: val, isWeb: val.startsWith('http://') || val.startsWith('https://') || val.startsWith('www.') }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.url.trim()) return;
    onSave({
      id:       file.id,
      name:     form.name.trim(),
      url:      form.url.trim(),
      isWeb:    form.isWeb,
      folderId: form.folderId || null,
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${file.name}"?`)) {
      onDelete(file.id);
      onClose();
    }
  };

  return (
    <Modal isOpen onClose={handleSave} title="Edit File / Link">
      <FormField label="Display Name">
        <Input value={form.name} onChange={set('name')} placeholder="e.g. Wiring Diagram Rev B" autoFocus />
      </FormField>
      <FormField label="URL or File Path">
        <Input value={form.url} onChange={handleUrlChange} placeholder="https://... or C:\Users\..." />
        <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 5 }}>
          {form.isWeb ? '🌐 Web link — clicking the file opens it in a new tab' : '📁 Local path — clicking the file copies the path to your clipboard'}
        </p>
      </FormField>
      <FormField label="Folder">
        <Select value={form.folderId} onChange={set('folderId')}>
          <option value="">— Unfiled —</option>
          {folders.map(fo => <option key={fo.id} value={fo.id}>{fo.name}</option>)}
        </Select>
      </FormField>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 size={13} /> Delete</Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

function FileRow({ file, folders, onUpdate, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleClick = () => {
    if (file.isWeb) {
      window.open(file.url, '_blank', 'noopener,noreferrer');
    } else {
      navigator.clipboard?.writeText(file.url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 4 }}>
        <button
          onClick={handleClick}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
        >
          {file.isWeb
            ? <Globe size={13} color="var(--accent)" style={{ flexShrink: 0 }} />
            : <HardDrive size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          }
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {file.name}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180, flexShrink: 0 }}>
            {file.url}
          </span>
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            {file.isWeb ? (
              <ExternalLink size={13} color="var(--accent)" />
            ) : copied ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--success)', fontWeight: 500 }}>
                <Check size={12} /> Copied!
              </span>
            ) : (
              <Copy size={13} color="var(--text-faint)" />
            )}
          </span>
        </button>

        <button onClick={() => setEditing(true)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', padding: 2, display: 'flex', borderRadius: 3, flexShrink: 0 }}>
          <Pencil size={12} />
        </button>
        <button onClick={() => { if (window.confirm(`Delete "${file.name}"?`)) onDelete(file.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', padding: 2, display: 'flex', borderRadius: 3, flexShrink: 0 }}>
          <Trash2 size={12} />
        </button>
      </div>

      {editing && (
        <EditFileModal
          file={file}
          folders={folders}
          onClose={() => setEditing(false)}
          onSave={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

function FolderSection({ folder, folders, files, onDeleteFolder, onAddFile, onUpdateFile, onDeleteFile }) {
  const [expanded, setExpanded] = useState(true);
  const [showAddFile, setShowAddFile] = useState(false);
  const folderFiles = files.filter(f => f.folderId === folder.id);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-card-alt)', borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <span style={{ color: 'var(--text-placeholder)' }}>{expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
        <Folder size={14} color="var(--warning)" />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', flex: 1 }}>{folder.name}</span>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''}</span>
        <button onClick={e => { e.stopPropagation(); setShowAddFile(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '2px 4px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
          <Plus size={12} /> Add
        </button>
        <button onClick={e => { e.stopPropagation(); onDeleteFolder(folder.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', padding: 2, display: 'flex', borderRadius: 3 }}>
          <Trash2 size={12} />
        </button>
      </div>
      {expanded && (
        <div style={{ marginLeft: 20, marginTop: 4 }}>
          {folderFiles.length === 0 && <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-placeholder)', fontStyle: 'italic' }}>No files — click Add above</div>}
          {folderFiles.map(file => <FileRow key={file.id} file={file} folders={folders} onUpdate={onUpdateFile} onDelete={onDeleteFile} />)}
        </div>
      )}
      <AddFileModal isOpen={showAddFile} onClose={() => setShowAddFile(false)} folderId={folder.id} onAdd={onAddFile} />
    </div>
  );
}

function LooseFiles({ folders, files, onAddFile, onUpdateFile, onDeleteFile }) {
  const [showAdd, setShowAdd] = useState(false);
  const loose = files.filter(f => !f.folderId);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 500, letterSpacing: '0.05em' }}>UNFILED</span>
        <button onClick={() => setShowAdd(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, padding: '2px 4px', borderRadius: 3 }}>
          <Plus size={12} /> Add
        </button>
      </div>
      {loose.map(file => <FileRow key={file.id} file={file} folders={folders} onUpdate={onUpdateFile} onDelete={onDeleteFile} />)}
      <AddFileModal isOpen={showAdd} onClose={() => setShowAdd(false)} folderId={null} onAdd={onAddFile} />
    </div>
  );
}

export default function FilesTab({ projectId }) {
  const { folders, files, addFolder, deleteFolder, addFile, updateFile, deleteFile } = useFiles(projectId);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolder(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>{folders.length} folder{folders.length !== 1 ? 's' : ''}, {files.length} file{files.length !== 1 ? 's' : ''}</span>
        <Button variant="default" size="sm" onClick={() => setShowNewFolder(true)}><Folder size={13} /> New Folder</Button>
      </div>
      {showNewFolder && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '10px 12px', background: 'var(--bg-card-alt)', borderRadius: 8, border: '1px solid var(--border-med)' }}>
          <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFolder()}
            placeholder="Folder name" autoFocus
            style={{ flex: 1, border: '1px solid var(--border-med)', borderRadius: 5, padding: '6px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
          <Button size="sm" variant="primary" onClick={handleAddFolder}>Create</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowNewFolder(false)}>Cancel</Button>
        </div>
      )}
      <LooseFiles folders={folders} files={files} onAddFile={addFile} onUpdateFile={updateFile} onDeleteFile={deleteFile} />
      {folders.map(folder => (
        <FolderSection
          key={folder.id} folder={folder} folders={folders} files={files}
          onDeleteFolder={deleteFolder} onAddFile={addFile} onUpdateFile={updateFile} onDeleteFile={deleteFile}
        />
      ))}
      {folders.length === 0 && files.filter(f => !f.folderId).length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          <Folder size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
          <p style={{ fontSize: 13, margin: 0 }}>No files yet. Create a folder or add a loose file.</p>
        </div>
      )}
    </div>
  );
}
