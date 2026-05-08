import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TaskCard from '../components/TaskCard';
import { loadTags } from '../storage/Tags';
import { completeTask, deleteTask, loadTasks } from '../storage/Tasks';
import { getTaskDueTimestamp, isTaskOverdue } from '../utils/taskUtils';
import { getTheme, typography } from '../utils/theme';

export default function HomeScreen() {
  const theme = getTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const bottomPadding = useMemo(
    () => Math.max(insets.bottom, 18),
    [insets.bottom],
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 16 ? 'Good morning' : 'Good evening';
  }, []);

  const statCounts = useMemo(() => {
    const pending = tasks.filter((t) => !t.completed).length;
    const done = tasks.filter((t) => t.completed).length;
    const overdue = tasks.filter((t) => !t.completed && isTaskOverdue(t)).length;
    return { pending, done, overdue };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesTitle = q ? task.title.toLowerCase().includes(q) : true;
      if (!matchesTitle) {
        return false;
      }
      if (activeFilter === 'all') {
        return true;
      }
      if (activeFilter.startsWith('priority:')) {
        return task.priority === activeFilter.replace('priority:', '');
      }
      if (activeFilter.startsWith('tag:')) {
        return task.tagId === activeFilter.replace('tag:', '');
      }
      return true;
    });
  }, [activeFilter, query, tasks]);

  const sections = useMemo(() => {
    const pending = filteredTasks
      .filter((t) => !t.completed)
      .sort((a, b) => getTaskDueTimestamp(a) - getTaskDueTimestamp(b));
    const completed = filteredTasks
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
  }, [filteredTasks]);

  const filterPills = useMemo(
    () => [
      { key: 'all', label: 'All' },
      { key: 'priority:high', label: 'High' },
      { key: 'priority:medium', label: 'Medium' },
      { key: 'priority:low', label: 'Low' },
      ...tags.map((tag) => ({ key: `tag:${tag.id}`, label: tag.name })),
    ],
    [tags],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [list, tagList] = await Promise.all([loadTasks(), loadTags()]);
        if (active) {
          setTasks(list);
          setTags(tagList);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const refresh = useCallback(async () => {
    const [list, tagList] = await Promise.all([loadTasks(), loadTags()]);
    setTasks(list);
    setTags(tagList);
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
      await completeTask(id);
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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {section.title}
        </Text>
        <View style={[styles.countBadge, { backgroundColor: theme.surface }]}>
          <Text style={[styles.countBadgeText, { color: theme.textMuted }]}>
            {section.count}
          </Text>
        </View>
      </View>
    ),
    [theme],
  );

  const renderItem = useCallback(
    ({ item, section }) => {
      if (item == null && section.title === 'Pending') {
        return (
          <View style={styles.caughtUpWrap}>
            <Text style={[styles.caughtUpText, { color: theme.textMuted }]}>
              All caught up! 🎉
            </Text>
          </View>
        );
      }
      if (item == null) {
        return null;
      }
      return (
        <TaskCard
          task={item}
          tags={tags}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
          onPress={openTask}
        />
      );
    },
    [handleDeleteTask, handleToggleComplete, openTask, tags, theme.textMuted],
  );

  const keyExtractor = useCallback((item, index) => {
    if (item == null) {
      return `empty-pending-${index}`;
    }
    return item.id;
  }, []);

  const listEmpty =
    filteredTasks.length === 0 ? (
      <View style={styles.globalEmpty}>
        <Text style={[styles.globalEmptyText, { color: theme.textMuted }]}>
          No matching tasks.
        </Text>
        <Text style={[styles.globalEmptyHint, { color: theme.textSubtle }]}>
          Try a different search or filter.
        </Text>
      </View>
    ) : null;

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <View style={styles.headerWrap}>
        <Text style={[styles.greetingTitle, { color: theme.text }]}>{greeting}</Text>
        <View style={styles.statPillRow}>
          <View style={[styles.statPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statPillLabel, { color: theme.textSubtle }]}>Pending</Text>
            <Text style={[styles.statPillValue, { color: theme.text }]}>{statCounts.pending}</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statPillLabel, { color: theme.textSubtle }]}>Done</Text>
            <Text style={[styles.statPillValue, { color: theme.text }]}>{statCounts.done}</Text>
          </View>
          <View
            style={[
              styles.statPill,
              { backgroundColor: theme.overdueBg, borderColor: theme.overdueBorder },
            ]}
          >
            <Text style={[styles.statPillLabel, { color: '#fda4af' }]}>Overdue</Text>
            <Text style={[styles.statPillValue, { color: '#fecdd3' }]}>{statCounts.overdue}</Text>
          </View>
        </View>
      </View>
      <View style={styles.searchWrap}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search tasks"
          placeholderTextColor={theme.textSubtle}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {filterPills.map((pill) => {
            const selected = activeFilter === pill.key;
            return (
              <Pressable
                key={pill.key}
                onPress={() => setActiveFilter(pill.key)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: selected ? theme.primary : theme.card,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: selected ? theme.onPrimary : theme.textMuted },
                  ]}
                >
                  {pill.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      {filteredTasks.length === 0 ? (
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
      <View
        style={[
          styles.footer,
          {
            paddingBottom: bottomPadding,
            backgroundColor: 'transparent',
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.primary },
            pressed && styles.addButtonPressed,
          ]}
          onPress={() =>
            navigation.navigate('AddTaskScreen', { taskId: undefined })
          }
          accessibilityRole="button"
          accessibilityLabel="Add a new task"
        >
          <Text style={[styles.addButtonLabel, { color: theme.onPrimary }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 10,
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  greetingTitle: {
    ...typography.h1,
    letterSpacing: -0.3,
  },
  statPillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statPillLabel: {
    ...typography.caption,
    marginBottom: 4,
  },
  statPillValue: {
    ...typography.bodyStrong,
  },
  searchInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...typography.body,
  },
  pillRow: {
    gap: 8,
    paddingBottom: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    ...typography.caption,
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
    ...typography.h2,
    marginBottom: 8,
  },
  globalEmptyHint: {
    ...typography.body,
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
    ...typography.caption,
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
    ...typography.caption,
  },
  caughtUpWrap: {
    paddingVertical: 28,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  caughtUpText: {
    ...typography.bodyStrong,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    right: 18,
    bottom: 10,
  },
  addButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 7,
  },
  addButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
  },
  addButtonLabel: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '500',
    marginTop: -2,
  },
});
