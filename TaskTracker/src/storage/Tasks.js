import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@TaskTracker/tasks';

function generateId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
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
    category: raw.category != null ? String(raw.category) : 'General',
    dueDate: raw.dueDate != null ? String(raw.dueDate) : '',
    dueTime:
      raw.dueTime != null && String(raw.dueTime) !== ''
        ? String(raw.dueTime)
        : '09:00',
    description: raw.description != null ? String(raw.description) : '',
    completed: Boolean(raw.completed),
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
    category: 'General',
    dueDate: '',
    dueTime: '09:00',
    description: '',
    completed: false,
    ...task,
    id,
  });
  tasks.push(newTask);
  await saveTasks(tasks);
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
  const merged = normalizeTask({ ...tasks[idx], ...updates });
  tasks[idx] = merged;
  await saveTasks(tasks);
  return merged;
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
  const tasks = await loadTasks();
  const next = tasks.filter((t) => t?.id !== id);
  await saveTasks(next);
}
