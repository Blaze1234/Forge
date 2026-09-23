import { useRef, useState } from 'react';
import { useTheme } from '../../store/ThemeContext';
import { useAppStore } from '../../store/AppContext';
import { useSync } from '../../store/SyncContext';
import { Sun, Moon, Download, Upload, CheckCircle2, AlertTriangle, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';

const STORAGE_KEY = 'forge-pm-state-v2';

// ── Helpers ───────────────────────────────────────────────────────────────────
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getStorageSize() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    return formatBytes(new Blob([raw]).size);
  } catch { return '—'; }
}

// ── Section wrappers ──────────────────────────────────────────────────────────
function SettingSection({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.08em', margin: '0 0 12px', textTransform: 'uppercase' }}>{title}</h2>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: last ? 'none' : '1px solid var(--border)', gap: 16 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: description ? 2 : 0 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

// ── Theme option button ───────────────────────────────────────────────────────
function ThemeOption({ value, label, icon: Icon, current, onClick }) {
  const active = current === value;
  return (
    <button onClick={() => onClick(value)} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontFamily: 'inherit',
      background: active ? 'var(--accent-light)' : 'var(--bg-card-alt)',
      outline: active ? '2px solid var(--accent)' : '2px solid transparent',
      color: active ? 'var(--accent)' : 'var(--text-muted)',
    }}>
      <Icon size={20} />
      <span style={{ fontSize: 12, fontWeight: active ? 600 : 400 }}>{label}</span>
    </button>
  );
}

// ── Main settings ─────────────────────────────────────────────────────────────
export default function SettingsTab() {
  const { theme, setLight, setDark, isDark, toggleTheme } = useTheme();
  const { state } = useAppStore();
  const { syncStatus, lastSyncedAt, syncError, connected, manualSync, resetCursor } = useSync();
  const fileInputRef = useRef(null);

  const [importStatus, setImportStatus] = useState(null);
  const [importMsg,    setImportMsg]    = useState('');
  const [syncing,      setSyncing]      = useState(false);

  const setTheme = (val) => val === 'dark' ? setDark() : setLight();

  const handleExport = () => {
    const ts = new Date().toISOString().slice(0, 10);
    downloadJson({ version: 2, exportedAt: Date.now(), state }, `forge-backup-${ts}.json`);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const incoming = parsed.state ?? parsed;
        if (!incoming.projects || !incoming.tasks) throw new Error('File does not look like a Forge backup.');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
        setImportStatus('success');
        setImportMsg('Backup loaded — reloading now…');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        setImportStatus('error');
        setImportMsg(err.message ?? 'Could not read backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleManualSync = async () => {
    setSyncing(true);
    await manualSync();
    setSyncing(false);
  };

  const handleFullResync = async () => {
    if (!window.confirm('This resets the sync cursor and re-uploads all local data to Supabase. Continue?')) return;
    resetCursor();
    setSyncing(true);
    await manualSync();
    setSyncing(false);
  };

  const storageSize   = getStorageSize();
  const projectCount  = state.projects?.length ?? 0;
  const taskCount     = state.tasks?.length ?? 0;

  const syncStatusLabel = syncing || syncStatus === 'pushing' ? 'Pushing…'
    : syncStatus === 'pulling' ? 'Pulling…'
    : syncStatus === 'ok' ? 'Synced'
    : syncStatus === 'error' ? 'Sync error'
    : 'Idle';

  const syncColor = (syncing || syncStatus === 'pushing' || syncStatus === 'pulling') ? 'var(--warning)'
    : syncStatus === 'ok' ? 'var(--success)'
    : syncStatus === 'error' ? 'var(--danger)'
    : 'var(--text-faint)';

  const lastSyncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
    : 'Never';

  return (
    <div style={{ padding: 28, overflowY: 'auto', flex: 1, background: 'var(--bg-page)' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 3 }}>Appearance, sync, and data</p>
      </div>

      {/* ── Appearance ────────────────────────────────────────────────────── */}
      <SettingSection title="Appearance">
        <div style={{ padding: '18px 18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>Theme</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 16 }}>Your preference is saved automatically.</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <ThemeOption value="light" label="Light" icon={Sun}  current={theme} onClick={setTheme} />
            <ThemeOption value="dark"  label="Dark"  icon={Moon} current={theme} onClick={setTheme} />
          </div>
          <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Quick toggle</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Switch themes without opening settings</div>
            </div>
            <button onClick={toggleTheme} style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: isDark ? 'var(--accent)' : 'var(--border-strong)', position: 'relative' }}>
              <span style={{ position: 'absolute', top: 3, left: isDark ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        </div>
      </SettingSection>

      {/* ── Cloud Sync ────────────────────────────────────────────────────── */}
      <SettingSection title="Cloud Sync">
        {/* Status row */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: connected === false ? 'var(--danger-light)' : 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {connected === false
              ? <WifiOff size={18} color="var(--danger)" />
              : <Wifi size={18} color="var(--success)" />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {connected === false ? 'Disconnected' : connected ? 'Connected to Supabase' : 'Connecting…'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: syncColor, flexShrink: 0 }} />
              {syncStatusLabel}
              {lastSyncedAt && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 4 }}>
                  <Clock size={10} /> Last synced {lastSyncLabel}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-med)', background: 'var(--bg-card-alt)', color: 'var(--text-secondary)', cursor: syncing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: syncing ? 0.6 : 1 }}
          >
            <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            Sync Now
          </button>
        </div>

        {syncError && (
          <div style={{ padding: '10px 18px', background: 'var(--danger-light)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={13} color="var(--danger)" />
            <span style={{ fontSize: 12, color: 'var(--danger)' }}>{syncError}</span>
          </div>
        )}

        <SettingRow label="How sync works" description="Changes push automatically 1.5s after you make them. The app also pulls fresh data on load, every 30 seconds, and when you switch back to this tab.">
          <span style={{ fontSize: 11, color: 'var(--text-faint)', background: 'var(--bg-card-alt)', padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Supabase</span>
        </SettingRow>

        <SettingRow label="Full re-sync" description="Resets sync state and re-uploads all local data. Use if another machine seems out of date." last>
          <button
            onClick={handleFullResync}
            disabled={syncing}
            style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-med)', background: 'var(--bg-card-alt)', color: 'var(--text-secondary)', cursor: syncing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            Re-sync
          </button>
        </SettingRow>
      </SettingSection>

      {/* ── Data & Backups ────────────────────────────────────────────────── */}
      <SettingSection title="Local Backup">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24 }}>
          {[
            { label: 'Projects', value: projectCount },
            { label: 'Tasks',    value: taskCount },
            { label: 'Storage',  value: storageSize },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{value}</div>
            </div>
          ))}
        </div>

        <SettingRow label="Export backup" description="Download everything as a JSON file — useful before major changes.">
          <button onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--accent)', background: 'var(--accent-light)', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download size={13} /> Export
          </button>
        </SettingRow>

        <SettingRow label="Import backup" description="Restore from a backup file. Replaces all local data then re-syncs.">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <button onClick={() => { setImportStatus(null); fileInputRef.current?.click(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-med)', background: 'var(--bg-card-alt)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Upload size={13} /> Import
            </button>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
            {importStatus && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: importStatus === 'success' ? 'var(--success)' : 'var(--danger)' }}>
                {importStatus === 'success' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {importMsg}
              </div>
            )}
          </div>
        </SettingRow>

        <SettingRow label="Reset all data" description="Deletes everything locally. Cloud data in Supabase is unaffected." last>
          <button onClick={() => { if (window.confirm('Delete local Forge data? Cloud data stays intact.')) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); } }} style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 6, border: '1px solid var(--danger-mid)', background: 'var(--danger-light)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>
            Reset Local
          </button>
        </SettingRow>
      </SettingSection>

      {/* ── About ─────────────────────────────────────────────────────────── */}
      <SettingSection title="About">
        <SettingRow label="Version" last>
          <span style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'monospace' }}>v1.0.0</span>
        </SettingRow>
      </SettingSection>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
