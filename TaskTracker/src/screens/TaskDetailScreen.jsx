import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { loadTags, resolveTagForTask } from '../storage/Tags';
import { getTaskById, updateTask } from '../storage/Tasks';
import { hexWithAlpha } from '../utils/colorUtils';
import { formatDueDateTimeLine } from '../utils/taskUtils';

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
          <Text style={styles.headerEditText}>Edit</Text>
        </Pressable>
      ),
    });
  }, [navigation, task]);

  const onToggleCompleted = async () => {
    if (!task) return;
    setToggling(true);
    try {
      await updateTask(task.id, { completed: !task.completed });
      await load();
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text style={styles.missingText}>Task not found.</Text>
        <Pressable
          style={styles.backLink}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.backLinkText}>Go back</Text>
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
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.block}>
        <Text style={styles.label}>Title</Text>
        <Text style={styles.title}>{task.title}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Description</Text>
        <Text style={styles.description}>
          {task.description?.trim()
            ? task.description
            : 'No description added.'}
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Priority</Text>
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
        <Text style={styles.label}>Tag</Text>
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
        <Text style={styles.label}>Due date & time</Text>
        <Text style={styles.value}>{dueLine}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Status</Text>
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
        <Text style={styles.toggleButtonLabel}>
          {task.completed ? 'Mark as pending' : 'Mark as completed'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F4F5',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: '#F4F4F5',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#18181B',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3F3F46',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
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
    backgroundColor: '#2563EB',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerEdit: {
    marginRight: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerEditText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
});
