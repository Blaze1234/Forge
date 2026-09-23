import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  supabase, TABLES,
  upsertRecord, upsertMany,
  pullSince, pullDeletionsSince, recordDeletion,
  pushMeta, pullAllMeta,
  testConnection,
} from './supabase';
import { useAppStore, ACTIONS, setDeletionRecorder } from './AppContext';

// ── Constants ──────────────────────────────────────────────────────────────────
const CURSOR_KEY   = 'forge-sync-cursor';   // localStorage key for pull cursor
const PUSH_DEBOUNCE_MS = 1500;              // wait 1.5s after last change before pushing
const PULL_INTERVAL_MS = 30_000;            // pull every 30s while app is open

// Map from app state slice name → Supabase table name
const SLICE_TABLE = {
  projects:    TABLES.projects,
  tasks:       TABLES.tasks,
  notes:       TABLES.notes,
  folders:     TABLES.folders,
  files:       TABLES.files,
  timeEntries: TABLES.timeEntries,
};

// Map from Supabase table name → app state slice name (reverse lookup for deletions)
const TABLE_SLICE = Object.fromEntries(Object.entries(SLICE_TABLE).map(([k, v]) => [v, k]));

// ── Helpers ────────────────────────────────────────────────────────────────────
const getCursor = () => parseInt(localStorage.getItem(CURSOR_KEY) ?? '0', 10);
const setCursor = (ts) => localStorage.setItem(CURSOR_KEY, String(ts));

// Deep-merge incoming records into current state slice (newer updatedAt wins)
function mergeSlice(existing, incoming) {
  const map = Object.fromEntries(existing.map(r => [r.id, r]));
  for (const record of incoming) {
    const cur = map[record.id];
    const incomingTs = record.updatedAt ?? record.createdAt ?? 0;
    const currentTs  = cur?.updatedAt  ?? cur?.createdAt  ?? 0;
    if (!cur || incomingTs >= currentTs) {
      map[record.id] = record;
    }
  }
  return Object.values(map);
}

// ── Context ────────────────────────────────────────────────────────────────────
const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const { state, dispatch } = useAppStore();

  const [syncStatus, setSyncStatus]   = useState('idle');   // 'idle'|'pushing'|'pulling'|'error'|'ok'
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncError, setSyncError]     = useState(null);
  const [connected, setConnected]     = useState(null);     // null = unknown

  const pushTimerRef  = useRef(null);
  const prevStateRef  = useRef(null);
  const isSyncingRef  = useRef(false);

  // Register deletion recorder so AppContext can log deletes to Supabase
  useEffect(() => {
    setDeletionRecorder(recordDeletion);
    return () => setDeletionRecorder(null);
  }, []);

  // ── Pull: fetch everything newer than cursor and merge into local state ──────
  const pull = useCallback(async (silent = false) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (!silent) setSyncStatus('pulling');

    try {
      const since = getCursor();
      let newCursor = since;

      // Pull each slice
      const pulled = {};
      for (const [slice, table] of Object.entries(SLICE_TABLE)) {
        const records = await pullSince(table, since);
        if (records.length) pulled[slice] = records;
        for (const r of records) {
          const ts = r.updatedAt ?? r.createdAt ?? 0;
          if (ts > newCursor) newCursor = ts;
        }
      }

      // Pull meta (rank orders)
      const metaRows = await pullAllMeta(since);
      const metaUpdates = {};
      for (const row of metaRows) {
        metaUpdates[row.id] = row.data?.value;
        if (row.updated_at > newCursor) newCursor = row.updated_at;
      }

      // Pull deletions
      const deletions = await pullDeletionsSince(since);
      for (const d of deletions) {
        if (d.deleted_at > newCursor) newCursor = d.deleted_at;
      }

      // Apply everything to state in one dispatch
      if (Object.keys(pulled).length || deletions.length || Object.keys(metaUpdates).length) {
        dispatch({
          type: ACTIONS.APPLY_SYNC,
          payload: { pulled, deletions, metaUpdates },
        });
      }

      if (newCursor > since) setCursor(newCursor);
      setLastSyncedAt(Date.now());
      if (!silent) setSyncStatus('ok');
      setConnected(true);
      setSyncError(null);
    } catch (err) {
      console.error('[sync] pull error:', err);
      setSyncError(err.message);
      if (!silent) setSyncStatus('error');
      setConnected(false);
    } finally {
      isSyncingRef.current = false;
    }
  }, [dispatch]);

  // ── Push: send current state to Supabase ────────────────────────────────────
  const push = useCallback(async (stateSnapshot) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus('pushing');

    try {
      await Promise.all([
        upsertMany(TABLES.projects,    stateSnapshot.projects    ?? []),
        upsertMany(TABLES.tasks,       stateSnapshot.tasks       ?? []),
        upsertMany(TABLES.notes,       stateSnapshot.notes       ?? []),
        upsertMany(TABLES.folders,     stateSnapshot.folders     ?? []),
        upsertMany(TABLES.files,       stateSnapshot.files       ?? []),
        upsertMany(TABLES.timeEntries, stateSnapshot.timeEntries ?? []),
        pushMeta('workRankOrder',     stateSnapshot.workRankOrder     ?? []),
        pushMeta('personalRankOrder', stateSnapshot.personalRankOrder ?? []),
      ]);

      setLastSyncedAt(Date.now());
      setSyncStatus('ok');
      setConnected(true);
      setSyncError(null);
    } catch (err) {
      console.error('[sync] push error:', err);
      setSyncError(err.message);
      setSyncStatus('error');
      setConnected(false);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // ── Debounced push on state change ──────────────────────────────────────────
  useEffect(() => {
    // Skip UI-only state changes (activeTab, activeProjectId, etc.)
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (!prev) return; // first render — don't push, do pull instead

    const dataChanged = (
      prev.projects    !== state.projects    ||
      prev.tasks       !== state.tasks       ||
      prev.notes       !== state.notes       ||
      prev.folders     !== state.folders     ||
      prev.files       !== state.files       ||
      prev.timeEntries !== state.timeEntries ||
      prev.workRankOrder     !== state.workRankOrder ||
      prev.personalRankOrder !== state.personalRankOrder
    );

    if (!dataChanged) return;

    clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => push(state), PUSH_DEBOUNCE_MS);
  }, [state, push]);

  // ── Initial pull on mount ────────────────────────────────────────────────────
  useEffect(() => {
    pull();
  }, []);

  // ── Periodic background pull every 30s ──────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => pull(true), PULL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pull]);

  // ── Pull on tab focus (user switches back to the app) ────────────────────────
  useEffect(() => {
    const onFocus = () => pull(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [pull]);

  const manualSync = useCallback(async () => {
    await push(state);
    await pull();
  }, [push, pull, state]);

  const resetCursor = useCallback(() => {
    setCursor(0);
  }, []);

  return (
    <SyncContext.Provider value={{ syncStatus, lastSyncedAt, syncError, connected, manualSync, resetCursor }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
