export const generateId = () => Math.random().toString(36).slice(2, 10);

export const formatDate = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateTime = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const daysUntil = (ts) => {
  if (!ts) return null;
  return Math.ceil((ts - Date.now()) / 86400000);
};

export const formatDuration = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

// Returns YYYY-MM-DD string in local time
export const toDateKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export const formatDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const dayLabel = (key) => {
  if (toDateKey(Date.now()) === key) return 'Today';
  if (toDateKey(Date.now() - 86400000) === key) return 'Yesterday';
  return formatDateKey(key);
};

/**
 * Build work log days: each day has time sessions grouped by project + tasks completed that day.
 * Sessions spanning midnight are split at midnight into both days.
 */
export const buildWorkLog = (timeEntries, tasks) => {
  const dayMap = {};
  const ensure = (key) => { if (!dayMap[key]) dayMap[key] = { dateKey: key, sessions: [], completedTaskIds: new Set() }; return dayMap[key]; };

  for (const e of timeEntries) {
    const sk = toDateKey(e.startedAt), ek = toDateKey(e.stoppedAt);
    if (sk === ek) {
      // Same day — pass through all fields so id, note, taskId etc. are preserved
      ensure(sk).sessions.push({ ...e, duration: e.stoppedAt - e.startedAt });
    } else {
      // Spans midnight — split into two sessions, keep original id + fields on both
      const midnight = new Date(e.stoppedAt); midnight.setHours(0,0,0,0);
      const ms = midnight.getTime();
      ensure(sk).sessions.push({ ...e, stoppedAt: ms, duration: ms - e.startedAt, originalStoppedAt: e.stoppedAt });
      ensure(ek).sessions.push({ ...e, startedAt: ms, duration: e.stoppedAt - ms, originalStartedAt: e.startedAt });
    }
  }

  for (const t of tasks) {
    if (t.taskStatus === 'completed-it' && t.completedAt) ensure(toDateKey(t.completedAt)).completedTaskIds.add(t.id);
  }

  return Object.values(dayMap).map(day => {
    const byProject = {};
    for (const s of day.sessions) byProject[s.projectId] = (byProject[s.projectId] ?? 0) + s.duration;
    return {
      dateKey: day.dateKey,
      sessions: day.sessions.sort((a, b) => a.startedAt - b.startedAt),
      byProject,
      totalMs: day.sessions.reduce((s, e) => s + e.duration, 0),
      completedTasks: tasks.filter(t => day.completedTaskIds.has(t.id)),
    };
  }).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
};


export const getProjectTotalTime = (projectId, timeEntries) => {
  return timeEntries
    .filter(e => e.projectId === projectId)
    .reduce((sum, e) => sum + (e.stoppedAt - e.startedAt), 0);
};

export const getProjectStats = (projectId, tasks) => {
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const done = projectTasks.filter(t => t.taskStatus === 'completed-it').length;
  const total = projectTasks.length;
  return { total, done, progress: total === 0 ? 0 : Math.round((done / total) * 100) };
};

export const getOverallStats = (tasks) => {
  const total = tasks.length;
  const done = tasks.filter(t => t.taskStatus === 'completed-it').length;
  const inProgress = tasks.filter(t => t.taskStatus === 'working-on-it').length;
  const overdue = tasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.taskStatus !== 'completed-it').length;
  return { total, done, inProgress, overdue };
};

// Relative time for staleness cues (e.g. status note "updated 2 days ago")
export const formatRelativeTime = (ts) => {
  if (!ts) return 'never';
  const diff = Date.now() - ts;
  const min = 60000, hr = 3600000, day = 86400000;
  if (diff < min) return 'just now';
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  const days = Math.floor(diff / day);
  if (days < 30) return `${days}d ago`;
  return formatDate(ts);
};

// Starter phase template for hardware-style projects (stage-gate workflow)
export const HARDWARE_PHASE_TEMPLATE = [
  'Research', 'Schematic', 'Verification', 'Layout', 'Ordered', 'Bring-up', 'Iterate',
];

export const PROJECT_STATUSES = ['on-hold', 'working-on-it', 'completed-it'];
export const TASK_STATUSES_NEW = ['on-hold', 'working-on-it', 'completed-it'];
export const STATUS_LABELS_NEW = { 'on-hold': 'On Hold', 'working-on-it': 'Working On It', 'completed-it': 'Completed' };

export const generateSeedData = () => {
  const now = Date.now();
  const day = 86400000;

  const projects = [
    { id: 'p1', name: 'MESH Palletizer Config Tool', color: '#2563eb', createdAt: now - 30 * day, dueDate: now + 60 * day, description: 'Standalone config UI for palletizing patterns without TIA Portal or Studio 5000 licenses.', status: 'working-on-it', statusComment: 'Backend nearly done, frontend in progress.', type: 'work' },
    { id: 'p2', name: 'KNP014 Robot Cell', color: '#16a34a', createdAt: now - 14 * day, dueDate: now + 20 * day, description: 'Yaskawa HC10DTP integration, TCP socket comms, E-Stop safety circuit.', status: 'working-on-it', statusComment: '', type: 'work' },
    { id: 'p3', name: 'Client Portal', color: '#7c3aed', createdAt: now - 7 * day, dueDate: now + 90 * day, description: 'Customer-facing project status and documentation portal.', status: 'on-hold', statusComment: 'Waiting on client approval.', type: 'work' },
  ];

  const tasks = [
    { id: 't1', projectId: 'p1', title: 'FastAPI backend scaffold', priority: 'high', createdAt: now - 20 * day, dueDate: now - 5 * day, assignee: 'Riley', taskStatus: 'completed-it', statusComment: 'Merged to main.', miniNote: '' },
    { id: 't2', projectId: 'p1', title: 'OPC-UA integration for Siemens', priority: 'high', createdAt: now - 15 * day, dueDate: now + 7 * day, assignee: 'Riley', taskStatus: 'working-on-it', statusComment: '', miniNote: 'Check asyncua library docs for subscription model.' },
    { id: 't3', projectId: 'p1', title: 'EtherNet/IP for Allen-Bradley', priority: 'high', createdAt: now - 15 * day, dueDate: now + 14 * day, assignee: 'Riley', taskStatus: 'on-hold', statusComment: 'Blocked on hardware availability.', miniNote: '' },
    { id: 't4', projectId: 'p1', title: 'React frontend – pallet visualizer', priority: 'medium', createdAt: now - 10 * day, dueDate: now + 21 * day, assignee: 'Riley', taskStatus: 'working-on-it', statusComment: '', miniNote: 'Isometric renderer needs z-sorting fix.' },
    { id: 't5', projectId: 'p1', title: 'Packing algorithm port to JS', priority: 'medium', createdAt: now - 8 * day, dueDate: now + 5 * day, assignee: 'Riley', taskStatus: 'working-on-it', statusComment: '', miniNote: '' },
    { id: 't6', projectId: 'p2', title: 'TCP socket documentation', priority: 'medium', createdAt: now - 12 * day, dueDate: now - 3 * day, assignee: 'Riley', taskStatus: 'completed-it', statusComment: '', miniNote: '' },
    { id: 't7', projectId: 'p2', title: 'E-Stop M12 wiring diagram', priority: 'critical', createdAt: now - 6 * day, dueDate: now + 2 * day, assignee: 'Riley', taskStatus: 'working-on-it', statusComment: '', miniNote: 'Verify pin-out against M12 A-coded connector spec.' },
    { id: 't8', projectId: 'p2', title: 'Safety circuit TÜV review', priority: 'critical', createdAt: now - 4 * day, dueDate: now + 10 * day, assignee: 'Riley', taskStatus: 'on-hold', statusComment: 'Awaiting TÜV appointment.', miniNote: '' },
  ];

  const notes = [
    { id: 'n1', projectId: 'p1', title: 'Architecture decisions', text: 'Decided on FastAPI + asyncua for OPC-UA. EtherNet/IP will use pycomm3. Frontend stays in React with Vite.', createdAt: now - 18 * day, updatedAt: now - 18 * day },
    { id: 'n2', projectId: 'p1', title: 'Customer requirements call', text: 'Customer needs pattern config to export as JSON. Must support mixed-case palletizing. Layer limit: 8 layers max per pallet.', createdAt: now - 10 * day, updatedAt: now - 5 * day },
    { id: 'n3', projectId: 'p2', title: 'Site visit notes', text: 'Robot positioned at station 3. E-Stop loop runs through safety relay Pilz PNOZ. Wiring runs ~12m to panel.', createdAt: now - 8 * day, updatedAt: now - 8 * day },
  ];

  const folders = [
    { id: 'f1', projectId: 'p1', name: 'Specs & Datasheets' },
    { id: 'f2', projectId: 'p1', name: 'Code References' },
    { id: 'f3', projectId: 'p2', name: 'Electrical Drawings' },
  ];

  const files = [
    { id: 'fi1', projectId: 'p1', folderId: 'f1', name: 'OPC-UA Spec v1.04', url: 'https://opcfoundation.org/developer-tools/specifications-unified-architecture', isWeb: true },
    { id: 'fi2', projectId: 'p1', folderId: 'f2', name: 'asyncua GitHub', url: 'https://github.com/FreeOpcUa/opcua-asyncio', isWeb: true },
    { id: 'fi3', projectId: 'p2', folderId: 'f3', name: 'MOH186 Wiring Diagram', url: 'C:\\Users\\Riley\\Documents\\KNP014\\MOH186_wiring.pdf', isWeb: false },
  ];

  const timeEntries = [
    { id: 'te1', projectId: 'p1', startedAt: now - 3 * day, stoppedAt: now - 3 * day + 2 * 3600000 },
    { id: 'te2', projectId: 'p1', startedAt: now - 1 * day, stoppedAt: now - 1 * day + 1.5 * 3600000 },
    { id: 'te3', projectId: 'p2', startedAt: now - 2 * day, stoppedAt: now - 2 * day + 3 * 3600000 },
  ];

  return {
    projects, tasks, notes, folders, files, timeEntries,
    activeProjectId: 'p1',
    activeTab: 'dashboard',
    activeTimer: null,
    projectDetailTab: 'tasks',
    workRankOrder:     ['p1', 'p2', 'p3'],
    personalRankOrder: [],
  };
};
