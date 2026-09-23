import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { generateId, generateSeedData } from '../utils/data';

const buildInitialState = () => {
  const saved = localStorage.getItem('forge-pm-state-v2');
  if (saved) {
    try { return JSON.parse(saved); }
    catch { /* fall through */ }
  }
  return generateSeedData();
};

export const ACTIONS = {
  // Projects
  ADD_PROJECT:    'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',

  // Tasks
  ADD_TASK:    'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  MOVE_TASK:   'MOVE_TASK',

  // Notes
  ADD_NOTE:    'ADD_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',

  // Files & Folders
  ADD_FOLDER:    'ADD_FOLDER',
  UPDATE_FOLDER: 'UPDATE_FOLDER',
  DELETE_FOLDER: 'DELETE_FOLDER',
  ADD_FILE:      'ADD_FILE',
  UPDATE_FILE:   'UPDATE_FILE',
  DELETE_FILE:   'DELETE_FILE',

  // Time Tracking
  START_TIMER:       'START_TIMER',
  STOP_TIMER:        'STOP_TIMER',
  ADD_TIME_ENTRY:    'ADD_TIME_ENTRY',
  UPDATE_TIME_ENTRY: 'UPDATE_TIME_ENTRY',
  DELETE_TIME_ENTRY: 'DELETE_TIME_ENTRY',

  // Sync
  APPLY_SYNC: 'APPLY_SYNC',

  // UI
  SET_ACTIVE_PROJECT:      'SET_ACTIVE_PROJECT',
  SET_ACTIVE_TAB:          'SET_ACTIVE_TAB',
  SET_PROJECT_DETAIL_TAB:  'SET_PROJECT_DETAIL_TAB',
  REORDER_PROJECTS:        'REORDER_PROJECTS',
};

function appReducer(state, action) {
  switch (action.type) {

    // ── Projects ───────────────────────────────────────────────────────────────
    case ACTIONS.ADD_PROJECT: {
      const project = {
        id: generateId(), createdAt: Date.now(),
        status: 'working-on-it', statusComment: '',
        type: 'work',
        ...action.payload,
      };
      // Append to end of appropriate rank order
      const rankKey = project.type === 'personal' ? 'personalRankOrder' : 'workRankOrder';
      return {
        ...state,
        projects: [...state.projects, project],
        [rankKey]: [...(state[rankKey] ?? []), project.id],
      };
    }
    case ACTIONS.UPDATE_PROJECT: {
      const existing = state.projects.find(p => p.id === action.payload.id);
      const updated  = { ...existing, ...action.payload };
      // If type changed, move between rank arrays
      if (existing && existing.type !== updated.type) {
        const oldKey = existing.type === 'personal' ? 'personalRankOrder' : 'workRankOrder';
        const newKey = updated.type  === 'personal' ? 'personalRankOrder' : 'workRankOrder';
        return {
          ...state,
          projects: state.projects.map(p => p.id === action.payload.id ? updated : p),
          [oldKey]: (state[oldKey] ?? []).filter(id => id !== action.payload.id),
          [newKey]: [...(state[newKey] ?? []), action.payload.id],
        };
      }
      return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? updated : p) };
    }
    case ACTIONS.DELETE_PROJECT: {
      const proj = state.projects.find(p => p.id === action.payload.id);
      const rankKey = proj?.type === 'personal' ? 'personalRankOrder' : 'workRankOrder';
      return {
        ...state,
        projects:    state.projects.filter(p => p.id !== action.payload.id),
        tasks:       state.tasks.filter(t => t.projectId !== action.payload.id),
        notes:       state.notes.filter(n => n.projectId !== action.payload.id),
        files:       state.files.filter(f => f.projectId !== action.payload.id),
        folders:     state.folders.filter(f => f.projectId !== action.payload.id),
        timeEntries: state.timeEntries.filter(e => e.projectId !== action.payload.id),
        activeTimer: state.activeTimer?.projectId === action.payload.id ? null : state.activeTimer,
        activeProjectId: state.activeProjectId === action.payload.id ? null : state.activeProjectId,
        [rankKey]: (state[rankKey] ?? []).filter(id => id !== action.payload.id),
      };
    }

    case ACTIONS.REORDER_PROJECTS:
      // payload: { type: 'work'|'personal', order: [id, id, ...] }
      return action.payload.type === 'personal'
        ? { ...state, personalRankOrder: action.payload.order }
        : { ...state, workRankOrder: action.payload.order };

    // ── Tasks ──────────────────────────────────────────────────────────────────
    case ACTIONS.ADD_TASK: {
      const task = {
        id: generateId(), createdAt: Date.now(),
        status: 'todo', priority: 'medium',
        taskStatus: 'working-on-it', statusComment: '', miniNote: '',
        ...action.payload,
      };
      return { ...state, tasks: [...state.tasks, task] };
    }
    case ACTIONS.UPDATE_TASK: {
      const updated = { ...state.tasks.find(t => t.id === action.payload.id), ...action.payload };
      // Stamp completedAt when first marked done
      if (action.payload.taskStatus === 'completed-it' && !updated.completedAt) {
        updated.completedAt = Date.now();
      }
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? updated : t) };
    }
    case ACTIONS.DELETE_TASK:
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload.id) };
    case ACTIONS.MOVE_TASK:
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.taskId ? { ...t, status: action.payload.newStatus } : t) };

    // ── Notes ──────────────────────────────────────────────────────────────────
    case ACTIONS.ADD_NOTE: {
      const note = { id: generateId(), createdAt: Date.now(), updatedAt: Date.now(), title: 'Untitled Note', text: '', ...action.payload };
      return { ...state, notes: [...state.notes, note] };
    }
    case ACTIONS.UPDATE_NOTE:
      return { ...state, notes: state.notes.map(n => n.id === action.payload.id ? { ...n, ...action.payload, updatedAt: Date.now() } : n) };
    case ACTIONS.DELETE_NOTE:
      return { ...state, notes: state.notes.filter(n => n.id !== action.payload.id) };

    // ── Folders ────────────────────────────────────────────────────────────────
    case ACTIONS.ADD_FOLDER: {
      const folder = { id: generateId(), createdAt: Date.now(), ...action.payload };
      return { ...state, folders: [...state.folders, folder] };
    }
    case ACTIONS.UPDATE_FOLDER:
      return { ...state, folders: state.folders.map(f => f.id === action.payload.id ? { ...f, ...action.payload } : f) };
    case ACTIONS.DELETE_FOLDER:
      return {
        ...state,
        folders: state.folders.filter(f => f.id !== action.payload.id),
        files:   state.files.filter(f => f.folderId !== action.payload.id),
      };

    // ── Files ──────────────────────────────────────────────────────────────────
    case ACTIONS.ADD_FILE: {
      const file = { id: generateId(), createdAt: Date.now(), ...action.payload };
      return { ...state, files: [...state.files, file] };
    }
    case ACTIONS.UPDATE_FILE:
      return { ...state, files: state.files.map(f => f.id === action.payload.id ? { ...f, ...action.payload, updatedAt: Date.now() } : f) };
    case ACTIONS.DELETE_FILE:
      return { ...state, files: state.files.filter(f => f.id !== action.payload.id) };

    // ── Time Tracking ──────────────────────────────────────────────────────────
    case ACTIONS.START_TIMER: {
      // Stop any existing timer first and save its entry
      let newEntries = [...state.timeEntries];
      if (state.activeTimer) {
        newEntries.push({ id: generateId(), projectId: state.activeTimer.projectId, startedAt: state.activeTimer.startedAt, stoppedAt: Date.now(), updatedAt: Date.now() });
      }
      return { ...state, timeEntries: newEntries, activeTimer: { projectId: action.payload.projectId, startedAt: Date.now() } };
    }
    case ACTIONS.STOP_TIMER: {
      if (!state.activeTimer) return state;
      const entry = { id: generateId(), projectId: state.activeTimer.projectId, startedAt: state.activeTimer.startedAt, stoppedAt: Date.now(), updatedAt: Date.now() };
      return { ...state, timeEntries: [...state.timeEntries, entry], activeTimer: null };
    }
    case ACTIONS.ADD_TIME_ENTRY: {
      // payload: { projectId, taskId?, startedAt, stoppedAt, note? }
      const entry = { id: generateId(), updatedAt: Date.now(), ...action.payload };
      return { ...state, timeEntries: [...state.timeEntries, entry] };
    }
    case ACTIONS.UPDATE_TIME_ENTRY:
      return { ...state, timeEntries: state.timeEntries.map(e => e.id === action.payload.id ? { ...e, ...action.payload, updatedAt: Date.now() } : e) };
    case ACTIONS.DELETE_TIME_ENTRY:
      return { ...state, timeEntries: state.timeEntries.filter(e => e.id !== action.payload.id) };

    // ── Sync: merge pulled records from Supabase ──────────────────────────────
    case ACTIONS.APPLY_SYNC: {
      const { pulled = {}, deletions = [], metaUpdates = {} } = action.payload;

      // Helper: merge by ID, newer updatedAt/createdAt wins
      const merge = (existing, incoming) => {
        if (!incoming?.length) return existing;
        const map = Object.fromEntries(existing.map(r => [r.id, r]));
        for (const r of incoming) {
          const cur = map[r.id];
          const inTs  = r.updatedAt  ?? r.createdAt  ?? 0;
          const curTs = cur?.updatedAt ?? cur?.createdAt ?? 0;
          if (!cur || inTs >= curTs) map[r.id] = r;
        }
        return Object.values(map);
      };

      // Apply deletions: remove by ID from the right slice
      const DELETED_TABLE_MAP = {
        forge_projects:     'projects',
        forge_tasks:        'tasks',
        forge_notes:        'notes',
        forge_folders:      'folders',
        forge_files:        'files',
        forge_time_entries: 'timeEntries',
      };
      let next = { ...state };
      for (const d of deletions) {
        const slice = DELETED_TABLE_MAP[d.table_name];
        if (slice && next[slice]) {
          next[slice] = next[slice].filter(r => r.id !== d.record_id);
        }
      }

      // Merge pulled records
      return {
        ...next,
        projects:    merge(next.projects,    pulled.projects),
        tasks:       merge(next.tasks,       pulled.tasks),
        notes:       merge(next.notes,       pulled.notes),
        folders:     merge(next.folders,     pulled.folders),
        files:       merge(next.files,       pulled.files),
        timeEntries: merge(next.timeEntries, pulled.timeEntries),
        // Meta overrides from remote if present
        ...(metaUpdates.workRankOrder     !== undefined && { workRankOrder:     metaUpdates.workRankOrder }),
        ...(metaUpdates.personalRankOrder !== undefined && { personalRankOrder: metaUpdates.personalRankOrder }),
      };
    }

    // ── UI ─────────────────────────────────────────────────────────────────────
    case ACTIONS.SET_ACTIVE_PROJECT:
      return { ...state, activeProjectId: action.payload.id };
    case ACTIONS.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload.tab };
    case ACTIONS.SET_PROJECT_DETAIL_TAB:
      return { ...state, projectDetailTab: action.payload.tab };

    default:
      return state;
  }
}

const AppContext = createContext(null);

// Dynamically import to avoid circular deps — sync calls recordDeletion
let _recordDeletion = null;
export function setDeletionRecorder(fn) { _recordDeletion = fn; }

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, buildInitialState);

  // Intercept deletes to record them in Supabase
  const wrappedDispatch = useCallback((action) => {
    dispatch(action);
    if (_recordDeletion) {
      const TABLE_MAP = {
        [ACTIONS.DELETE_PROJECT]:    ['forge_projects',     action.payload?.id],
        [ACTIONS.DELETE_TASK]:       ['forge_tasks',        action.payload?.id],
        [ACTIONS.DELETE_NOTE]:       ['forge_notes',        action.payload?.id],
        [ACTIONS.DELETE_FOLDER]:     ['forge_folders',      action.payload?.id],
        [ACTIONS.DELETE_FILE]:       ['forge_files',        action.payload?.id],
        [ACTIONS.DELETE_TIME_ENTRY]: ['forge_time_entries', action.payload?.id],
      };
      const entry = TABLE_MAP[action.type];
      if (entry) _recordDeletion(entry[0], entry[1]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('forge-pm-state-v2', JSON.stringify(state));
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch: wrappedDispatch }}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
