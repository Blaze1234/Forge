import { useRef, useCallback } from 'react';
import { Bold, List, ListOrdered } from 'lucide-react';

// ── Renderer: markdown-lite → React elements ───────────────────────────────────
// Supports: **bold**, - bullet lists, 1. numbered lists
// Everything else renders as plain text.
export function RichTextRenderer({ text, style = {} }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  const parseLine = (line) => {
    // Bold: split on **...**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={idx} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    // Bullet list item
    if (/^- /.test(line) || /^• /.test(line)) {
      const listItems = [];
      while (i < lines.length && (/^- /.test(lines[i]) || /^• /.test(lines[i]))) {
        listItems.push(
          <li key={i} style={{ marginBottom: 2 }}>{parseLine(lines[i].replace(/^[-•] /, ''))}</li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '4px 0', paddingLeft: 18, listStyleType: 'disc' }}>
          {listItems}
        </ul>
      );
      continue;
    }

    // Numbered list item
    if (/^\d+\. /.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        listItems.push(
          <li key={i} style={{ marginBottom: 2 }}>{parseLine(lines[i].replace(/^\d+\. /, ''))}</li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: '4px 0', paddingLeft: 18 }}>
          {listItems}
        </ol>
      );
      continue;
    }

    // Empty line → spacer
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
      i++;
      continue;
    }

    // Normal paragraph line
    elements.push(
      <div key={i} style={{ lineHeight: 1.6 }}>{parseLine(line)}</div>
    );
    i++;
  }

  return (
    <div style={{ fontSize: 13, color: 'var(--text-secondary)', ...style }}>
      {elements}
    </div>
  );
}

// ── Toolbar button ─────────────────────────────────────────────────────────────
function ToolbarBtn({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}  // preventDefault keeps textarea focus
      title={label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 26, borderRadius: 5, border: 'none', cursor: 'pointer',
        background: active ? 'var(--accent-light)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
      }}
    >
      <Icon size={14} />
    </button>
  );
}

// ── Rich text editor with formatting toolbar ───────────────────────────────────
export function RichTextEditor({ value, onChange, placeholder = 'Write here…', minHeight = 120, autoFocus = false }) {
  const textareaRef = useRef(null);

  // Insert or wrap text at cursor
  const insertAt = useCallback((before, after = '', defaultContent = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = value.slice(start, end) || defaultContent;
    const newText = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newText);
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      const newCursor = start + before.length + selected.length + after.length;
      ta.setSelectionRange(newCursor, newCursor);
    });
  }, [value, onChange]);

  // Wrap selected text in **bold**
  const handleBold = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = value.slice(start, end);

    // Toggle: if already bold, unwrap
    if (selected.startsWith('**') && selected.endsWith('**') && selected.length > 4) {
      const unwrapped = selected.slice(2, -2);
      const newText = value.slice(0, start) + unwrapped + value.slice(end);
      onChange(newText);
      requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start, start + unwrapped.length); });
    } else {
      insertAt('**', '**', 'bold text');
    }
  }, [value, onChange, insertAt]);

  // Insert a bullet list item on the current line
  const handleBullet = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineContent = value.slice(lineStart, start);

    if (lineContent.startsWith('- ')) {
      // Remove bullet prefix
      const newText = value.slice(0, lineStart) + lineContent.slice(2) + value.slice(start);
      onChange(newText);
      requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start - 2, start - 2); });
    } else {
      // Add bullet prefix or insert new bullet line
      const prefix = (start === 0 || value[start - 1] === '\n') ? '- ' : '\n- ';
      insertAt(prefix, '', '');
    }
  }, [value, onChange, insertAt]);

  // Insert a numbered list item
  const handleNumbered = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineContent = value.slice(lineStart, start);

    if (/^\d+\. /.test(lineContent)) {
      // Remove number prefix
      const stripped = lineContent.replace(/^\d+\. /, '');
      const newText = value.slice(0, lineStart) + stripped + value.slice(start);
      onChange(newText);
      requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(lineStart + stripped.length, lineStart + stripped.length); });
    } else {
      // Count existing numbered items above cursor to determine next number
      const textBefore = value.slice(0, start);
      const matches = textBefore.match(/^\d+\./gm) ?? [];
      const nextNum = matches.length + 1;
      const prefix = (start === 0 || value[start - 1] === '\n') ? `${nextNum}. ` : `\n${nextNum}. `;
      insertAt(prefix, '', '');
    }
  }, [value, onChange, insertAt]);

  // Auto-continue lists on Enter
  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Enter') return;
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineContent = value.slice(lineStart, start);

    // Continue bullet list
    if (/^- /.test(lineContent)) {
      if (lineContent.trim() === '-') {
        // Empty bullet — exit list
        e.preventDefault();
        const newText = value.slice(0, lineStart) + '\n' + value.slice(start);
        onChange(newText);
        requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(lineStart + 1, lineStart + 1); });
      } else {
        e.preventDefault();
        insertAt('\n- ', '', '');
      }
      return;
    }

    // Continue numbered list
    const numberedMatch = lineContent.match(/^(\d+)\. /);
    if (numberedMatch) {
      if (lineContent.trim() === `${numberedMatch[1]}.`) {
        // Empty item — exit list
        e.preventDefault();
        const newText = value.slice(0, lineStart) + '\n' + value.slice(start);
        onChange(newText);
        requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(lineStart + 1, lineStart + 1); });
      } else {
        e.preventDefault();
        const next = parseInt(numberedMatch[1]) + 1;
        insertAt(`\n${next}. `, '', '');
      }
      return;
    }
  }, [value, onChange, insertAt]);

  // Detect if cursor is on a bold selection (for toolbar active state)
  const isBoldActive = useCallback(() => {
    if (!textareaRef.current) return false;
    const start = textareaRef.current.selectionStart;
    const end   = textareaRef.current.selectionEnd;
    const sel = value.slice(start, end);
    return sel.startsWith('**') && sel.endsWith('**');
  }, [value]);

  return (
    <div style={{ border: '1px solid var(--border-med)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px',
        background: 'var(--bg-card-alt)', borderBottom: '1px solid var(--border)',
      }}>
        <ToolbarBtn icon={Bold}        label="Bold (Ctrl+B)"          onClick={handleBold}    />
        <div style={{ width: 1, height: 16, background: 'var(--border-med)', margin: '0 4px' }} />
        <ToolbarBtn icon={List}        label="Bullet list"            onClick={handleBullet}  />
        <ToolbarBtn icon={ListOrdered} label="Numbered list"          onClick={handleNumbered}/>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-placeholder)', paddingRight: 4 }}>
          **bold** · - bullet · 1. list
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        placeholder={placeholder}
        style={{
          width: '100%', minHeight, resize: 'vertical',
          background: 'var(--bg-input)', border: 'none', outline: 'none',
          color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
          lineHeight: 1.6, padding: '10px 12px', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}
