import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TaskCard from '../components/TaskCard';
import { deleteTask, loadTasks, updateTask } from '../storage/Tasks';
import { getTaskDueTimestamp } from '../utils/taskUtils';

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState([]);

  const bottomPadding = useMemo(
    () => Math.max(insets.bottom, 16),
    [insets.bottom],
  );

  const sections = useMemo(() => {
    const pending = tasks
      .filter((t) => !t.completed)
      .sort((a, b) => getTaskDueTimestamp(a) - getTaskDueTimestamp(b));
    const completed = tasks
      .filter((t) => t.completed)
      .sort((a, b) => getTaskDueTimestamp(b) - getTaskDueTimestamp(a));
    return [
      {
        title: 'Pending',
        data: pending.length > 0 ? pending : [null],
        count: pending.length,
      },
      {
        title: 'Completed',
        data: completed,
        count: completed.length,
      },
    ];
  }, [tasks]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const list = await loadTasks();
        if (active) {
          setTasks(list);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const refresh = useCallback(async () => {
    setTasks(await loadTasks());
  }, []);

  const handleDeleteTask = useCallback(
    async (id) => {
      await deleteTask(id);
      await refresh();
    },
    [refresh],
  );

  const handleToggleComplete = useCallback(
    async (id) => {
      await updateTask(id, { completed: true });
      await refresh();
    },
    [refresh],
  );

  const openTask = useCallback(
    (task) => {
      navigation.navigate('TaskDetailScreen', { taskId: task.id });
    },
    [navigation],
  );

  const renderSectionHeader = useCallback(
    ({ section }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{section.count}</Text>
        </View>
      </View>
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item, section }) => {
      if (item == null && section.title === 'Pending') {
        return (
          <View style={styles.caughtUpWrap}>
            <Text style={styles.caughtUpText}>All caught up! 🎉</Text>
          </View>
        );
      }
      if (item == null) {
        return null;
      }
      return (
        <TaskCard
          task={item}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
          onPress={openTask}
        />
      );
    },
    [handleDeleteTask, handleToggleComplete, openTask],
  );

  const keyExtractor = useCallback((item, index) => {
    if (item == null) {
      return `empty-pending-${index}`;
    }
    return item.id;
  }, []);

  const listEmpty =
    tasks.length === 0 ? (
      <View style={styles.globalEmpty}>
        <Text style={styles.globalEmptyText}>No tasks yet.</Text>
        <Text style={styles.globalEmptyHint}>Add one to get started.</Text>
      </View>
    ) : null;

  return (
    <View style={styles.screen}>
      {tasks.length === 0 ? (
        <View style={styles.emptyScreen}>{listEmpty}</View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      <View style={[styles.footer, { paddingBottom: bottomPadding }]}>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => navigation.navigate('AddTaskScreen')}
          accessibilityRole="button"
          accessibilityLabel="Add a new task"
        >
          <Text style={styles.addButtonLabel}>Add task</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F4F5',
  },
  emptyScreen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  globalEmpty: {
    alignItems: 'center',
  },
  globalEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3F3F46',
    marginBottom: 8,
  },
  globalEmptyHint: {
    fontSize: 15,
    color: '#71717A',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
    letterSpacing: 0.2,
  },
  countBadge: {
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52525B',
  },
  caughtUpWrap: {
    paddingVertical: 28,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  caughtUpText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#52525B',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F4F4F5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    opacity: 0.9,
  },
  addButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
