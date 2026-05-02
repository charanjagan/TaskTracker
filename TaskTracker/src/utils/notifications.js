import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
} from '@notifee/react-native';

const TASK_REMINDER_CHANNEL_ID = 'task-due-reminders';

let channelReady = false;

async function ensureTaskReminderChannel() {
  if (channelReady) {
    return;
  }
  await notifee.createChannel({
    id: TASK_REMINDER_CHANNEL_ID,
    name: 'Task due reminders',
    importance: AndroidImportance.DEFAULT,
    vibration: true,
    sound: 'default',
  });
  channelReady = true;
}

function parseDueDateLocal(dueDate) {
  const trimmed = String(dueDate).trim();
  const parts = trimmed.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return null;
  }
  const [year, month, day] = parts;
  return { year, month, day };
}

function parseDueTimeFromTask(dueTime) {
  if (dueTime == null || String(dueTime) === '') {
    return { hour: 9, minute: 0 };
  }
  const m = String(dueTime).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) {
    return { hour: 9, minute: 0 };
  }
  return { hour: parseInt(m[1], 10), minute: parseInt(m[2], 10) };
}

async function canPostNotifications() {
  const settings = await notifee.getNotificationSettings();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Call once on app launch — prompts for permission and creates the Android channel.
 */
export async function requestNotificationPermissionsOnLaunch() {
  await notifee.requestPermission();
  await ensureTaskReminderChannel();
}

/**
 * Cancel scheduled/displayed notification for a task (same id as trigger notification).
 * @param {string} taskId
 */
export async function cancelTaskNotification(taskId) {
  if (taskId == null || String(taskId) === '') {
    return;
  }
  await notifee.cancelNotification(String(taskId));
}

function buildNotificationBody(task) {
  const desc = task.description != null ? String(task.description).trim() : '';
  if (desc) {
    return desc.length > 220 ? `${desc.slice(0, 217)}…` : desc;
  }
  const timeBits = [task.dueDate, task.dueTime].filter(Boolean).join(' · ');
  const extra = [task.category, timeBits ? `Due ${timeBits}` : '']
    .filter(Boolean)
    .join(' · ');
  return extra || 'Task reminder';
}

/**
 * Schedule (or replace) a trigger notification at the task due date/time.
 * Does not call requestPermission — use {@link requestNotificationPermissionsOnLaunch} at startup.
 *
 * @param {{ id: string; title: string; dueDate: string; dueTime?: string; description?: string; category?: string }} task
 * @param {{ hour?: number; minute?: number }} [options]
 * @returns {Promise<{ scheduled: boolean; reason?: string; triggerAt?: number }>}
 */
export async function scheduleTaskDueReminder(task, options = {}) {
  const fromTask = parseDueTimeFromTask(task.dueTime);
  const hour = options.hour ?? fromTask.hour;
  const minute = options.minute ?? fromTask.minute;

  if (!task?.id || !task?.title || !task?.dueDate) {
    throw new Error(
      'scheduleTaskDueReminder: task must include id, title, and dueDate',
    );
  }

  if (!(await canPostNotifications())) {
    return { scheduled: false, reason: 'permission_denied' };
  }

  await ensureTaskReminderChannel();

  const parsed = parseDueDateLocal(task.dueDate);
  if (!parsed) {
    throw new Error(
      'scheduleTaskDueReminder: dueDate must be a YYYY-MM-DD date string',
    );
  }

  const triggerAt = new Date(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    hour,
    minute,
    0,
    0,
  ).getTime();

  if (triggerAt <= Date.now()) {
    return { scheduled: false, reason: 'past_due' };
  }

  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: triggerAt,
    alarmManager: {
      allowWhileIdle: true,
    },
  };

  const title = String(task.title).trim() || 'Task';
  const body = buildNotificationBody(task);

  await notifee.createTriggerNotification(
    {
      id: String(task.id),
      title,
      body,
      android: {
        channelId: TASK_REMINDER_CHANNEL_ID,
        pressAction: {
          id: 'default',
        },
      },
      ios: {
        sound: 'default',
      },
    },
    trigger,
  );

  return { scheduled: true, triggerAt };
}

/**
 * Cancels notification when completed; otherwise schedules/updates for pending tasks.
 * @param {Record<string, unknown>} task normalized task
 */
export async function syncTaskNotification(task) {
  if (!task?.id) {
    return;
  }
  if (task.completed) {
    await cancelTaskNotification(String(task.id));
    return;
  }
  await scheduleTaskDueReminder(task);
}
