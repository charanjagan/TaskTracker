import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { resolveTagForTask } from '../storage/Tags';
import { hexWithAlpha } from '../utils/colorUtils';
import { formatDueDateTimeLine, isTaskOverdue } from '../utils/taskUtils';
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

/**
 * @param {{
 *   task: Record<string, unknown>;
 *   onDelete?: (id: string) => void;
 *   onToggleComplete?: (id: string) => void;
 *   onPress?: (task: Record<string, unknown>) => void;
 *   tags?: Array<{ id: string; name: string; color: string }>;
 * }} props
 */
export default function TaskCard({
  task,
  onDelete,
  onToggleComplete,
  onPress,
  tags = [],
}) {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = getTheme(isDarkMode);
  const swipeRef = useRef(null);
  const entered = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(1)).current;
  const priority = PRIORITY_THEME[task.priority] ?? PRIORITY_THEME.medium;
  useEffect(() => {
    Animated.timing(entered, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [entered]);

  useEffect(() => {
    if (!completed) {
      return;
    }
    checkScale.setValue(0.7);
    Animated.sequence([
      Animated.timing(checkScale, {
        toValue: 1.18,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkScale, completed]);

  const animateDelete = useCallback(() => {
    Animated.timing(exit, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
      easing: Easing.in(Easing.quad),
    }).start(({ finished }) => {
      if (finished) {
        onDelete?.(task.id);
      }
    });
  }, [exit, onDelete, task.id]);

  const animateComplete = useCallback(() => {
    Animated.sequence([
      Animated.timing(checkScale, {
        toValue: 1.2,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start(() => onToggleComplete?.(task.id));
  }, [checkScale, onToggleComplete, task.id]);

  const overdue = isTaskOverdue(task);
  const completed = Boolean(task.completed);

  const dueLine = formatDueDateTimeLine(task.dueDate, task.dueTime);
  const tag = resolveTagForTask(task, tags);
  const tagLabel = tag?.name ?? task.category;
  const tagColor = tag?.color ?? '#A1A1AA';

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
              animateDelete();
            }}
          accessibilityRole="button"
          accessibilityLabel={`Delete task: ${task.title}`}
        >
          <Text style={[styles.swipeDeleteText, { color: theme.onPrimary }]}>
            Delete
          </Text>
        </Pressable>
      </View>
    ),
    [onDelete, task.id, task.title],
  );

  const cardInner = (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: '#000000',
        },
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
          style={[
            styles.title,
            { color: theme.text },
            completed && styles.titleCompleted,
            completed && { color: theme.textSubtle },
          ]}
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
            <Animated.View
              style={[
                styles.doneIcon,
                {
                  backgroundColor: theme.successBg,
                  borderColor: theme.borderStrong,
                  transform: [{ scale: checkScale }],
                },
              ]}
              accessibilityLabel="Completed"
            >
              <Text style={styles.doneIconText}>✓</Text>
            </Animated.View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.completeButton,
                {
                  backgroundColor: isDarkMode ? '#052e2b' : '#ECFDF5',
                  borderColor: isDarkMode ? '#065f46' : '#6EE7B7',
                },
                pressed && styles.completeButtonPressed,
              ]}
              onPress={animateComplete}
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
        <View style={styles.dueBlock}>
          <Text style={[styles.dueLabel, { color: theme.textSubtle }]}>Due</Text>
          <Text
            style={[
              styles.dueDate,
              { color: theme.textMuted },
              overdue && !completed && styles.dueDateOverdue,
            ]}
          >
            {dueLine}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <Animated.View
      style={{
        opacity: Animated.multiply(entered, exit),
        transform: [
          {
            translateY: entered.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
        ],
      }}
    >
      <Swipeable
      ref={swipeRef}
      friction={2}
      enableTrackpadTwoFingerGesture
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      {cardInner}
    </Swipeable>
    </Animated.View>
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
    ...typography.bodyStrong,
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
    opacity: 0.9,
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
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 1,
  },
  categoryText: {
    ...typography.caption,
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
    ...typography.caption,
    flexShrink: 1,
  },
  dueDateOverdue: {
    color: '#B91C1C',
  },
});
