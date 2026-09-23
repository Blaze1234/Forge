import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ecjqqkrwtpdqejuwvorc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TivuQrZboUvSyd-LZumHfg_2UeA1Rky';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Table names ────────────────────────────────────────────────────────────────
// Each entity type maps to its Supabase table.
// All tables share the same shape: id (text PK), data (jsonb), updated_at (bigint)
// Plus a deleted_records table for tracking deletions.
export const TABLES = {
  projects:    'forge_projects',
  tasks:       'forge_tasks',
  notes:       'forge_notes',
  folders:     'forge_folders',
  files:       'forge_files',
  timeEntries: 'forge_time_entries',
  meta:        'forge_meta',         // stores rank orders, lastPushedAt, etc.
  deleted:     'forge_deleted',      // { id, table_name, deleted_at }
};

// ── Upsert a single record ─────────────────────────────────────────────────────
export async function upsertRecord(table, record) {
  const { error } = await supabase
    .from(table)
    .upsert({
      id:         record.id,
      data:       record,
      updated_at: record.updatedAt ?? record.createdAt ?? Date.now(),
    }, { onConflict: 'id' });
  if (error) console.warn(`[sync] upsert ${table}:`, error.message);
  return !error;
}

// ── Upsert many records ────────────────────────────────────────────────────────
export async function upsertMany(table, records) {
  if (!records.length) return true;
  const rows = records.map(r => ({
    id:         r.id,
    data:       r,
    updated_at: r.updatedAt ?? r.createdAt ?? Date.now(),
  }));
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) console.warn(`[sync] upsertMany ${table}:`, error.message);
  return !error;
}

// ── Pull records changed since a cursor ───────────────────────────────────────
export async function pullSince(table, since = 0) {
  const { data, error } = await supabase
    .from(table)
    .select('data, updated_at')
    .gt('updated_at', since)
    .order('updated_at', { ascending: true });
  if (error) { console.warn(`[sync] pull ${table}:`, error.message); return []; }
  return data.map(row => row.data);
}

// ── Record a deletion ──────────────────────────────────────────────────────────
export async function recordDeletion(tableName, id) {
  const { error } = await supabase.from(TABLES.deleted).upsert({
    id:         `${tableName}:${id}`,
    table_name: tableName,
    record_id:  id,
    deleted_at: Date.now(),
  }, { onConflict: 'id' });
  if (error) console.warn(`[sync] delete record:`, error.message);
}

// ── Pull deletions since cursor ────────────────────────────────────────────────
export async function pullDeletionsSince(since = 0) {
  const { data, error } = await supabase
    .from(TABLES.deleted)
    .select('table_name, record_id, deleted_at')
    .gt('deleted_at', since)
    .order('deleted_at', { ascending: true });
  if (error) { console.warn(`[sync] pull deletions:`, error.message); return []; }
  return data;
}

// ── Meta: store rank orders and other shared state ────────────────────────────
export async function pushMeta(key, value) {
  const { error } = await supabase.from(TABLES.meta).upsert({
    id:         key,
    data:       { value },
    updated_at: Date.now(),
  }, { onConflict: 'id' });
  if (error) console.warn(`[sync] meta push ${key}:`, error.message);
}

export async function pullMeta(key) {
  const { data, error } = await supabase
    .from(TABLES.meta)
    .select('data')
    .eq('id', key)
    .single();
  if (error || !data) return null;
  return data.data?.value ?? null;
}

export async function pullAllMeta(since = 0) {
  const { data, error } = await supabase
    .from(TABLES.meta)
    .select('id, data, updated_at')
    .gt('updated_at', since);
  if (error) return [];
  return data;
}

// ── Test connection ────────────────────────────────────────────────────────────
export async function testConnection() {
  const { error } = await supabase.from(TABLES.meta).select('id').limit(1);
  return !error;
}
