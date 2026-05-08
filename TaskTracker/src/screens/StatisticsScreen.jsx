import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadTasks } from '../storage/Tasks';
import { getTheme, typography } from '../utils/theme';

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function StatisticsScreen() {
  const theme = getTheme();
  const [tasks, setTasks] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadTasks().then(setTasks);
    }, []),
  );

  const stats = useMemo(() => {
    const weekStart = startOfWeek();
    const completed = tasks.filter((t) => t.completed);
    const completedThisWeek = completed.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= weekStart,
    );
    const completionRate = tasks.length
      ? Math.round((completed.length / tasks.length) * 100)
      : 0;

    const tagCounts = new Map();
    completed.forEach((t) => {
      const key = t.category || 'General';
      tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
    });
    let mostUsedTag = '-';
    let max = 0;
    tagCounts.forEach((count, tag) => {
      if (count > max) {
        max = count;
        mostUsedTag = tag;
      }
    });

    const durations = completed
      .filter((t) => t.createdAt && t.completedAt)
      .map((t) => new Date(t.completedAt) - new Date(t.createdAt))
      .filter((n) => Number.isFinite(n) && n > 0);
    const avgHours = durations.length
      ? (durations.reduce((a, b) => a + b, 0) / durations.length / 36e5).toFixed(
          1,
        )
      : '0.0';

    return {
      completedThisWeek: completedThisWeek.length,
      completionRate,
      mostUsedTag,
      avgHours,
    };
  }, [tasks]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Text style={[styles.heading, { color: theme.text }]}>Statistics</Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.metricLabel, { color: theme.textSubtle }]}>
          Tasks completed this week
        </Text>
        <Text style={[styles.metricValue, { color: theme.text }]}>
          {stats.completedThisWeek}
        </Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.metricLabel, { color: theme.textSubtle }]}>
          Completion rate
        </Text>
        <Text style={[styles.metricValue, { color: theme.text }]}>
          {stats.completionRate}%
        </Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.metricLabel, { color: theme.textSubtle }]}>
          Most used tag
        </Text>
        <Text style={[styles.metricValue, { color: theme.text }]}>
          {stats.mostUsedTag}
        </Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.metricLabel, { color: theme.textSubtle }]}>
          Average completion time
        </Text>
        <Text style={[styles.metricValue, { color: theme.text }]}>
          {stats.avgHours} hrs
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  heading: {
    ...typography.h1,
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  metricLabel: {
    ...typography.caption,
    marginBottom: 8,
  },
  metricValue: {
    ...typography.h2,
  },
});
