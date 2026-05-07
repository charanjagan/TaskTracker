import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { loadTags, resolveTagForTask } from '../storage/Tags';
import { completeTask, getTaskById, updateTask } from '../storage/Tasks';
import { hexWithAlpha } from '../utils/colorUtils';
import { formatDueDateTimeLine } from '../utils/taskUtils';
import { getTheme, typography } from '../utils/theme';

const PRIORITY_THEME = {
  high: {
    label: 'High',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    borderColor: '#FECACA',
  },
  medium: {
    label: 'Medium',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    borderColor: '#FDE68A',
  },
  low: {
    label: 'Low',
    backgroundColor: '#DCFCE7',
    color: '#166534',
    borderColor: '#BBF7D0',
  },
};

export default function TaskDetailScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = getTheme(isDarkMode);
  const navigation = useNavigation();
  const route = useRoute();
  const taskId = route.params?.taskId;
  const [task, setTask] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = await getTaskById(String(taskId));
    setTask(t);
    setLoading(false);
  }, [taskId]);

  useFocusEffect(
    useCallback(() => {
      load();
      loadTags().then(setTags);
    }, [load]),
  );

  useLayoutEffect(() => {
    if (!task) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() =>
            navigation.navigate('AddTaskScreen', { taskId: task.id })
          }
          style={styles.headerEdit}
          accessibilityRole="button"
          accessibilityLabel="Edit task"
        >
          <Text style={[styles.headerEditText, { color: theme.headerTint }]}>Edit</Text>
        </Pressable>
      ),
    });
  }, [navigation, task, theme.headerTint]);

  const onToggleCompleted = async () => {
    if (!task) return;
    setToggling(true);
    try {
      if (task.completed) {
        await updateTask(task.id, { completed: false });
      } else {
        await completeTask(task.id);
      }
      await load();
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.missingText, { color: theme.textMuted }]}>Task not found.</Text>
        <Pressable
          style={styles.backLink}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={[styles.backLinkText, { color: theme.primary }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const priority = PRIORITY_THEME[task.priority] ?? PRIORITY_THEME.medium;
  const dueLine = formatDueDateTimeLine(task.dueDate, task.dueTime);
  const tag = resolveTagForTask(task, tags);
  const tagLabel = tag?.name ?? task.category;
  const tagColor = tag?.color ?? '#A1A1AA';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.block}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Title</Text>
        <Text style={[styles.title, { color: theme.text }]}>{task.title}</Text>
      </View>

      <View style={styles.block}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Description</Text>
        <Text style={[styles.description, { color: theme.textMuted }]}>
          {task.description?.trim()
            ? task.description
            : 'No description added.'}
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Priority</Text>
        <View
          style={[
            styles.priorityBadge,
            {
              backgroundColor: priority.backgroundColor,
              borderColor: priority.borderColor,
            },
          ]}
        >
          <Text style={[styles.priorityText, { color: priority.color }]}>
            {priority.label}
          </Text>
        </View>
      </View>

      <View style={styles.block}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Tag</Text>
        <View
          style={[
            styles.categoryPill,
            {
              backgroundColor: hexWithAlpha(tagColor, 0.22),
              borderColor: tagColor,
            },
          ]}
        >
          <Text style={[styles.categoryText, { color: tagColor }]}>
            {tagLabel}
          </Text>
        </View>
      </View>

      <View style={styles.block}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Due date & time</Text>
        <Text style={[styles.value, { color: theme.text }]}>{dueLine}</Text>
      </View>

      <View style={styles.block}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Status</Text>
        <View
          style={[
            styles.statusPill,
            task.completed ? styles.statusDone : styles.statusPending,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              task.completed ? styles.statusTextDone : styles.statusTextPending,
            ]}
          >
            {task.completed ? 'Completed' : 'Pending'}
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.toggleButton,
          { backgroundColor: theme.primary },
          pressed && styles.toggleButtonPressed,
          toggling && styles.toggleButtonDisabled,
        ]}
        onPress={onToggleCompleted}
        disabled={toggling}
        accessibilityRole="button"
        accessibilityLabel={
          task.completed ? 'Mark task as pending' : 'Mark task as completed'
        }
      >
        <Text style={[styles.toggleButtonLabel, { color: theme.onPrimary }]}>
          {task.completed ? 'Mark as pending' : 'Mark as completed'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  missingText: {
    fontSize: 16,
    color: '#52525B',
    marginBottom: 16,
  },
  backLink: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  block: {
    marginBottom: 22,
  },
  label: {
    ...typography.caption,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  title: {
    ...typography.h1,
  },
  description: {
    ...typography.body,
  },
  value: {
    ...typography.bodyStrong,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusDone: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#92400E',
  },
  statusTextDone: {
    color: '#15803D',
  },
  toggleButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  toggleButtonPressed: {
    opacity: 0.9,
  },
  toggleButtonDisabled: {
    opacity: 0.6,
  },
  toggleButtonLabel: {
    ...typography.button,
  },
  headerEdit: {
    marginRight: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerEditText: {
    ...typography.button,
  },
});
