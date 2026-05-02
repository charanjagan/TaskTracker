/**
 * @param {{ dueDate?: string; dueTime?: string }} task
 * @returns {number} ms since epoch for local due date/time
 */
export function getTaskDueTimestamp(task) {
  if (!task?.dueDate) {
    return Number.MAX_SAFE_INTEGER;
  }
  const parts = String(task.dueDate).trim().split('-');
  if (parts.length !== 3) {
    return Number.MAX_SAFE_INTEGER;
  }
  const [y, m, d] = parts.map((p) => parseInt(p, 10));
  if ([y, m, d].some((n) => Number.isNaN(n))) {
    return Number.MAX_SAFE_INTEGER;
  }
  const timeStr =
    task.dueTime && /^\d{1,2}:\d{2}$/.test(String(task.dueTime))
      ? String(task.dueTime)
      : '09:00';
  const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

/**
 * @param {{ completed?: boolean; dueDate?: string; dueTime?: string }} task
 */
export function isTaskOverdue(task) {
  if (!task || task.completed) {
    return false;
  }
  return Date.now() > getTaskDueTimestamp(task);
}

/**
 * @param {string} dueDate YYYY-MM-DD
 * @param {string} [dueTime] HH:mm
 */
export function formatDueDateTimeLine(dueDate, dueTime) {
  if (!dueDate) return '—';
  const d = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dueDate;
  const datePart = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const t =
    dueTime && /^\d{1,2}:\d{2}$/.test(String(dueTime))
      ? String(dueTime)
      : '09:00';
  const [h, min] = t.split(':').map((x) => parseInt(x, 10));
  const timeD = new Date(2000, 0, 1, h, min, 0, 0);
  const timePart = timeD.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} · ${timePart}`;
}
