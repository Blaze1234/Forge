import { useAppStore, ACTIONS } from '../store/AppContext';
import { getProjectStats, getOverallStats } from '../utils/data';

// ─── Projects ──────────────────────────────────────────────────────────────────
export function useProjects() {
  const { state, dispatch } = useAppStore();
  return {
    projects: state.projects,
    activeProject: state.projects.find(p => p.id === state.activeProjectId) ?? null,
    setActiveProject: (id) => dispatch({ type: ACTIONS.SET_ACTIVE_PROJECT, payload: { id } }),
    addProject:    (data) => dispatch({ type: ACTIONS.ADD_PROJECT,    payload: data }),
    updateProject: (data) => dispatch({ type: ACTIONS.UPDATE_PROJECT, payload: data }),
    deleteProject: (id)   => dispatch({ type: ACTIONS.DELETE_PROJECT, payload: { id } }),
  };
}

// ─── Tasks ─────────────────────────────────────────────────────────────────────
export function useTasks(projectId = null) {
  const { state, dispatch } = useAppStore();
  const tasks = projectId ? state.tasks.filter(t => t.projectId === projectId) : state.tasks;
  return {
    tasks,
    allTasks: state.tasks,
    addTask:    (data) => dispatch({ type: ACTIONS.ADD_TASK,    payload: data }),
    updateTask: (data) => dispatch({ type: ACTIONS.UPDATE_TASK, payload: data }),
    deleteTask: (id)   => dispatch({ type: ACTIONS.DELETE_TASK, payload: { id } }),
    moveTask:   (taskId, newStatus) => dispatch({ type: ACTIONS.MOVE_TASK, payload: { taskId, newStatus } }),
  };
}

// ─── Notes (project-level) ─────────────────────────────────────────────────────
export function useNotes(projectId) {
  const { state, dispatch } = useAppStore();
  const notes = state.notes.filter(n => n.projectId === projectId && !n.taskId);
  return {
    notes,
    addNote:    (data) => dispatch({ type: ACTIONS.ADD_NOTE,    payload: { projectId, ...data } }),
    updateNote: (data) => dispatch({ type: ACTIONS.UPDATE_NOTE, payload: data }),
    deleteNote: (id)   => dispatch({ type: ACTIONS.DELETE_NOTE, payload: { id } }),
  };
}

// ─── Notes (task-level) ────────────────────────────────────────────────────────
export function useTaskNotes(taskId) {
  const { state, dispatch } = useAppStore();
  const notes = state.notes.filter(n => n.taskId === taskId);
  return {
    notes,
    addNote:    (data) => dispatch({ type: ACTIONS.ADD_NOTE,    payload: { taskId, ...data } }),
    updateNote: (data) => dispatch({ type: ACTIONS.UPDATE_NOTE, payload: data }),
    deleteNote: (id)   => dispatch({ type: ACTIONS.DELETE_NOTE, payload: { id } }),
  };
}

// ─── Files & Folders ───────────────────────────────────────────────────────────
export function useFiles(projectId) {
  const { state, dispatch } = useAppStore();
  const folders = state.folders.filter(f => f.projectId === projectId);
  const files   = state.files.filter(f => f.projectId === projectId);
  return {
    folders, files,
    addFolder:    (name)   => dispatch({ type: ACTIONS.ADD_FOLDER,    payload: { projectId, name } }),
    updateFolder: (data)   => dispatch({ type: ACTIONS.UPDATE_FOLDER, payload: data }),
    deleteFolder: (id)     => dispatch({ type: ACTIONS.DELETE_FOLDER, payload: { id } }),
    addFile:      (data)   => dispatch({ type: ACTIONS.ADD_FILE,      payload: { projectId, ...data } }),
    updateFile:   (data)   => dispatch({ type: ACTIONS.UPDATE_FILE,   payload: data }),
    deleteFile:   (id)     => dispatch({ type: ACTIONS.DELETE_FILE,   payload: { id } }),
  };
}

// ─── Time Tracking ─────────────────────────────────────────────────────────────
export function useTimeTracking(projectId) {
  const { state, dispatch } = useAppStore();
  const entries = state.timeEntries.filter(e => e.projectId === projectId);
  const isRunning = state.activeTimer?.projectId === projectId;
  const activeTimer = state.activeTimer;
  return {
    entries, isRunning, activeTimer,
    startTimer:      () => dispatch({ type: ACTIONS.START_TIMER,        payload: { projectId } }),
    stopTimer:       () => dispatch({ type: ACTIONS.STOP_TIMER }),
    addTimeEntry:    (data) => dispatch({ type: ACTIONS.ADD_TIME_ENTRY,    payload: data }),
    updateTimeEntry: (data) => dispatch({ type: ACTIONS.UPDATE_TIME_ENTRY, payload: data }),
    deleteTimeEntry: (id)   => dispatch({ type: ACTIONS.DELETE_TIME_ENTRY, payload: { id } }),
  };
}

// Global time entry hook (no project filter) — used by work log
export function useAllTimeEntries() {
  const { state, dispatch } = useAppStore();
  return {
    timeEntries: state.timeEntries,
    addTimeEntry:    (data) => dispatch({ type: ACTIONS.ADD_TIME_ENTRY,    payload: data }),
    updateTimeEntry: (data) => dispatch({ type: ACTIONS.UPDATE_TIME_ENTRY, payload: data }),
    deleteTimeEntry: (id)   => dispatch({ type: ACTIONS.DELETE_TIME_ENTRY, payload: { id } }),
  };
}

// ─── Project Ranking ──────────────────────────────────────────────────────────
export function useProjectRanking() {
  const { state, dispatch } = useAppStore();

  const getRankedProjects = (type) => {
    const order = type === 'personal'
      ? (state.personalRankOrder ?? [])
      : (state.workRankOrder ?? []);
    const typed = state.projects.filter(p => (p.type ?? 'work') === type);
    // Build ordered list, then append any that aren't in the order array yet
    const ordered = order.map(id => typed.find(p => p.id === id)).filter(Boolean);
    const unranked = typed.filter(p => !order.includes(p.id));
    return [...ordered, ...unranked];
  };

  const reorder = (type, newOrder) =>
    dispatch({ type: ACTIONS.REORDER_PROJECTS, payload: { type, order: newOrder.map(p => p.id) } });

  return { getRankedProjects, reorder };
}


export function useStats(projectId = null) {
  const { state } = useAppStore();
  if (projectId) return getProjectStats(projectId, state.tasks);
  return getOverallStats(state.tasks);
}

// ─── Navigation ────────────────────────────────────────────────────────────────
export function useNavigation() {
  const { state, dispatch } = useAppStore();
  return {
    activeTab: state.activeTab,
    setActiveTab: (tab) => dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: { tab } }),
    projectDetailTab: state.projectDetailTab ?? 'tasks',
    setProjectDetailTab: (tab) => dispatch({ type: ACTIONS.SET_PROJECT_DETAIL_TAB, payload: { tab } }),
  };
}
