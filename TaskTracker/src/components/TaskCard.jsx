import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { formatDueDateTimeLine, isTaskOverdue } from '../utils/taskUtils';

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

/**
 * @param {{
 *   task: Record<string, unknown>;
 *   onDelete?: (id: string) => void;
 *   onToggleComplete?: (id: string) => void;
 *   onPress?: (task: Record<string, unknown>) => void;
 * }} props
 */
export default function TaskCard({
  task,
  onDelete,
  onToggleComplete,
  onPress,
}) {
  const swipeRef = useRef(null);
  const priority = PRIORITY_THEME[task.priority] ?? PRIORITY_THEME.medium;
  const overdue = isTaskOverdue(task);
  const completed = Boolean(task.completed);

  const dueLine = formatDueDateTimeLine(task.dueDate, task.dueTime);

  const renderRightActions = useCallback(
    () => (
      <View style={styles.swipeActions}>
        <Pressable
          style={({ pressed }) => [
            styles.swipeDelete,
            pressed && styles.swipeDeletePressed,
          ]}
          onPress={() => {
            swipeRef.current?.close();
            onDelete?.(task.id);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Delete task: ${task.title}`}
        >
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </Pressable>
      </View>
    ),
    [onDelete, task.id, task.title],
  );

  const cardInner = (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        overdue && styles.cardOverdue,
        completed && styles.cardCompleted,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress?.(task)}
      accessibilityRole="button"
      accessibilityLabel={`Open task: ${task.title}`}
    >
      <View style={styles.topRow}>
        <Text
          style={[styles.title, completed && styles.titleCompleted]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        <View style={styles.topEnd}>
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
          {completed ? (
            <View style={styles.doneIcon} accessibilityLabel="Completed">
              <Text style={styles.doneIconText}>✓</Text>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.completeButton,
                pressed && styles.completeButtonPressed,
              ]}
              onPress={() => onToggleComplete?.(task.id)}
              accessibilityRole="button"
              accessibilityLabel={`Mark complete: ${task.title}`}
              hitSlop={6}
            >
              <Text style={styles.completeButtonIcon}>✓</Text>
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{task.category}</Text>
        </View>
        <View style={styles.dueBlock}>
          <Text style={styles.dueLabel}>Due</Text>
          <Text
            style={[styles.dueDate, overdue && !completed && styles.dueDateOverdue]}
          >
            {dueLine}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      enableTrackpadTwoFingerGesture
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      {cardInner}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeActions: {
    justifyContent: 'center',
    marginBottom: 12,
  },
  swipeDelete: {
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    marginLeft: -1,
  },
  swipeDeletePressed: {
    opacity: 0.92,
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E4E7',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardOverdue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  cardCompleted: {
    opacity: 0.92,
  },
  cardPressed: {
    opacity: 0.96,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#18181B',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#71717A',
  },
  topEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  completeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonPressed: {
    backgroundColor: '#D1FAE5',
  },
  completeButtonIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
    marginTop: -1,
  },
  doneIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15803D',
    marginTop: -1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexShrink: 1,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338CA',
  },
  dueBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexShrink: 0,
    maxWidth: '58%',
  },
  dueLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dueDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3F3F46',
    flexShrink: 1,
  },
  dueDateOverdue: {
    color: '#B91C1C',
  },
});
