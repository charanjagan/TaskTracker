import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@TaskTracker/tags';

export const TAG_COLOR_PRESETS = [
  '#2563EB',
  '#9333EA',
  '#059669',
  '#DC2626',
  '#D97706',
  '#E11D48',
  '#0891B2',
  '#4F46E5',
  '#CA8A04',
  '#0D9488',
  '#EA580C',
  '#7C3AED',
  '#16A34A',
  '#DB2777',
  '#475569',
  '#1E293B',
];

const DEFAULT_TAGS = [
  { id: 'tag-default-work', name: 'Work', color: '#2563EB' },
  { id: 'tag-default-personal', name: 'Personal', color: '#9333EA' },
  { id: 'tag-default-learning', name: 'Learning', color: '#059669' },
  { id: 'tag-default-health', name: 'Health', color: '#DC2626' },
  { id: 'tag-default-finance', name: 'Finance', color: '#D97706' },
];

function generateId() {
  return `tag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {Record<string, unknown> | null | undefined} raw
 */
export function normalizeTag(raw) {
  if (!raw || typeof raw !== 'object' || raw.id == null) {
    return null;
  }
  const color = raw.color != null ? String(raw.color).trim() : '#64748B';
  const name = raw.name != null ? String(raw.name).trim() : '';
  if (!name) return null;
  return {
    id: String(raw.id),
    name,
    color: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#64748B',
  };
}

/**
 * @returns {Promise<Array<{ id: string; name: string; color: string }>>}
 */
export async function loadTags() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw == null || raw === '') {
    const initial = DEFAULT_TAGS.map((t) => normalizeTag(t)).filter(Boolean);
    await saveTags(initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('invalid');
    }
    if (parsed.length === 0) {
      return [];
    }
    return parsed.map(normalizeTag).filter(Boolean);
  } catch {
    const initial = DEFAULT_TAGS.map((t) => normalizeTag(t)).filter(Boolean);
    await saveTags(initial);
    return initial;
  }
}

/**
 * @param {Record<string, unknown>} task
 * @param {Array<{ id: string; name: string; color: string }>} tags
 */
export function resolveTagForTask(task, tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return null;
  }
  if (task.tagId) {
    return tags.find((t) => t.id === task.tagId) ?? null;
  }
  return tags.find((t) => t.name === task.category) ?? null;
}

/**
 * @param {Array<{ id: string; name: string; color: string }>} tags
 */
export async function saveTags(tags) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
}

/**
 * @param {{ name: string; color: string }} input
 * @returns {Promise<{ id: string; name: string; color: string } | null>} null if duplicate name
 */
export async function addTag(input) {
  const name = String(input.name ?? '').trim();
  const color = String(input.color ?? '#64748B').trim();
  if (!name) {
    return null;
  }
  const hex = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#64748B';
  const tags = await loadTags();
  const lower = name.toLowerCase();
  if (tags.some((t) => t.name.toLowerCase() === lower)) {
    return null;
  }
  const tag = normalizeTag({ id: generateId(), name, color: hex });
  tags.push(tag);
  await saveTags(tags);
  return tag;
}

/**
 * @param {string} id
 * @returns {Promise<boolean>} true if a tag was removed
 */
export async function deleteTag(id) {
  const tags = await loadTags();
  const next = tags.filter((t) => t.id !== id);
  if (next.length === tags.length) {
    return false;
  }
  await saveTags(next);
  return true;
}
