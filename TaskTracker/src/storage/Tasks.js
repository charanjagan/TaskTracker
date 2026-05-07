import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cancelTaskNotification,
  syncTaskNotification,
} from '../utils/notifications';

const STORAGE_KEY = '@TaskTracker/tasks';

function generateId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDueDateToDate(iso) {
  if (!iso || typeof iso !== 'string') {
    return new Date();
  }
  const [y, m, d] = iso.split('-').map((x) => parseInt(x, 10));
  if ([y, m, d].some((v) => Number.isNaN(v))) {
    return new Date();
  }
  return new Date(y, m - 1, d);
}

function nextDueDate(isoDate, recurrence) {
  const base = parseDueDateToDate(isoDate);
  if (recurrence === 'daily') {
    base.setDate(base.getDate() + 1);
  } else if (recurrence === 'weekly') {
    base.setDate(base.getDate() + 7);
  }
  return toIsoDate(base);
}

/**
 * @param {Record<string, unknown> | null | undefined} raw
 */
export function normalizeTask(raw) {
  if (!raw || typeof raw !== 'object' || raw.id == null) {
    return null;
  }
  return {
    id: String(raw.id),
    title: raw.title != null ? String(raw.title) : '',
    priority: raw.priority != null ? String(raw.priority) : 'medium',
    tagId:
      raw.tagId != null && String(raw.tagId) !== ''
        ? String(raw.tagId)
        : '',
    category: raw.category != null ? String(raw.category) : 'General',
    dueDate: raw.dueDate != null ? String(raw.dueDate) : '',
    dueTime:
      raw.dueTime != null && String(raw.dueTime) !== ''
        ? String(raw.dueTime)
        : '09:00',
    description: raw.description != null ? String(raw.description) : '',
    completed: Boolean(raw.completed),
    recurrence:
      raw.recurrence != null && String(raw.recurrence) !== ''
        ? String(raw.recurrence)
        : 'none',
    createdAt:
      raw.createdAt != null && String(raw.createdAt) !== ''
        ? String(raw.createdAt)
        : new Date().toISOString(),
    completedAt:
      raw.completedAt != null && String(raw.completedAt) !== ''
        ? String(raw.completedAt)
        : '',
  };
}

/**
 * @param {Array<Record<string, unknown>>} tasks
 * @returns {Promise<void>}
 */
export async function saveTasks(tasks) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function loadTasks() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw == null || raw === '') {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeTask).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * @param {Record<string, unknown>} task
 * @returns {Promise<Record<string, unknown>>}
 */
export async function addTask(task) {
  const tasks = await loadTasks();
  const id =
    task.id != null && String(task.id) !== ''
      ? String(task.id)
      : generateId();
  const newTask = normalizeTask({
    title: '',
    priority: 'medium',
    tagId: '',
    category: 'General',
    dueDate: '',
    dueTime: '09:00',
    description: '',
    completed: false,
    recurrence: 'none',
    createdAt: new Date().toISOString(),
    completedAt: '',
    ...task,
    id,
  });
  tasks.push(newTask);
  await saveTasks(tasks);
  await syncTaskNotification(newTask);
  return newTask;
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} updates
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function updateTask(id, updates) {
  const tasks = await loadTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    return null;
  }
  const current = tasks[idx];
  const merged = normalizeTask({
    ...current,
    ...updates,
    completedAt:
      updates.completed === true
        ? current.completedAt || new Date().toISOString()
        : updates.completed === false
          ? ''
          : current.completedAt,
  });
  tasks[idx] = merged;
  await saveTasks(tasks);
  await syncTaskNotification(merged);
  return merged;
}

/**
 * Marks task completed and handles recurring task recreation.
 * @param {string} id
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function completeTask(id) {
  const tasks = await loadTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    return null;
  }
  const current = tasks[idx];
  const completedTask = normalizeTask({
    ...current,
    completed: true,
    completedAt: new Date().toISOString(),
  });
  tasks[idx] = completedTask;

  if (current.recurrence && current.recurrence !== 'none') {
    const nextTask = normalizeTask({
      ...current,
      id: generateId(),
      completed: false,
      completedAt: '',
      createdAt: new Date().toISOString(),
      dueDate: nextDueDate(current.dueDate, current.recurrence),
    });
    tasks.push(nextTask);
    await syncTaskNotification(nextTask);
  }

  await saveTasks(tasks);
  await syncTaskNotification(completedTask);
  return completedTask;
}

/**
 * @param {string} id
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getTaskById(id) {
  const tasks = await loadTasks();
  return tasks.find((t) => t.id === id) ?? null;
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteTask(id) {
  await cancelTaskNotification(String(id));
  const tasks = await loadTasks();
  const next = tasks.filter((t) => t?.id !== id);
  await saveTasks(next);
}

/**
 * Clear tag reference on tasks when a tag is deleted (keeps category label).
 * @param {string} removedTagId
 * @returns {Promise<void>}
 */
export async function clearTagIdFromTasks(removedTagId) {
  const rid = String(removedTagId);
  const tasks = await loadTasks();
  let dirty = false;
  const next = tasks.map((t) => {
    if (t.tagId === rid) {
      dirty = true;
      return normalizeTask({ ...t, tagId: '' });
    }
    return t;
  });
  if (dirty) {
    await saveTasks(next);
  }
}
