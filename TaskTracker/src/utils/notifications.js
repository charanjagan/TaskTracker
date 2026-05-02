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

/**
 * Schedule a local notification on the task's due date (default 9:00 device local time).
 * Uses the task `id` as the Notifee notification id so the same task updates/replaces a pending trigger.
 *
 * @param {{ id: string; title: string; dueDate: string; dueTime?: string; category?: string }} task
 * @param {{ hour?: number; minute?: number }} [options] — override time on the due date (defaults to task.dueTime or 9:00)
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

  const parsed = parseDueDateLocal(task.dueDate);
  if (!parsed) {
    throw new Error(
      'scheduleTaskDueReminder: dueDate must be a YYYY-MM-DD date string',
    );
  }

  const { authorizationStatus } = await notifee.requestPermission();
  if (authorizationStatus === AuthorizationStatus.DENIED) {
    return { scheduled: false, reason: 'permission_denied' };
  }

  await ensureTaskReminderChannel();

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

  const subtitleParts = [`Due ${task.dueDate}`];
  if (task.category) {
    subtitleParts.push(task.category);
  }

  await notifee.createTriggerNotification(
    {
      id: String(task.id),
      title: 'Task reminder',
      body: `${task.title} — ${subtitleParts.join(' · ')}`,
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
