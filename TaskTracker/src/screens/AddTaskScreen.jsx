import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadTags } from '../storage/Tags';
import { addTask, getTaskById, updateTask } from '../storage/Tasks';
import { hexWithAlpha } from '../utils/colorUtils';
import { getTheme, typography } from '../utils/theme';

const PRIORITY_OPTIONS = [
  {
    value: 'high',
    label: 'High',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    borderColor: '#FECACA',
  },
  {
    value: 'medium',
    label: 'Medium',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    borderColor: '#FDE68A',
  },
  {
    value: 'low',
    label: 'Low',
    backgroundColor: '#DCFCE7',
    color: '#166534',
    borderColor: '#BBF7D0',
  },
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDueDateDisplay(d) {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeDisplay(d) {
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toTimeString(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseDueDateToDate(iso) {
  if (!iso || typeof iso !== 'string') {
    return new Date();
  }
  const parts = iso.split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date();
  }
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function parseDueTimeToDate(timeStr) {
  const d = new Date();
  if (timeStr && /^\d{1,2}:\d{2}$/.test(String(timeStr))) {
    const [hh, mm] = String(timeStr).split(':').map((x) => parseInt(x, 10));
    d.setHours(hh, mm, 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  return d;
}

function defaultDueTime() {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

export default function AddTaskScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = getTheme(isDarkMode);
  const navigation = useNavigation();
  const route = useRoute();
  const rawTaskId = route.params?.taskId;
  const taskId =
    rawTaskId != null && String(rawTaskId) !== '' ? String(rawTaskId) : null;
  const isEdit = taskId != null;
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tags, setTags] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [dueDate, setDueDate] = useState(() => new Date());
  const [dueTime, setDueTime] = useState(defaultDueTime);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [recurrence, setRecurrence] = useState('none');
  const [titleError, setTitleError] = useState('');
  const [tagError, setTagError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bottomPadding = useMemo(
    () => Math.max(insets.bottom, 16),
    [insets.bottom],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function hydrate() {
        const list = await loadTags();
        if (!active) return;
        setTags(list);

        if (!taskId) {
          setTitle('');
          setDescription('');
          setPriority('medium');
          setDueDate(new Date());
          setDueTime(defaultDueTime());
          setRecurrence('none');
          setSelectedTagId(list[0]?.id ?? null);
          setTagError('');
          return;
        }

        const t = await getTaskById(String(taskId));
        if (!active || !t) return;

        setTitle(t.title || '');
        setDescription(t.description || '');
        setPriority(t.priority || 'medium');
        setDueDate(parseDueDateToDate(t.dueDate));
        setDueTime(parseDueTimeToDate(t.dueTime));
        setRecurrence(t.recurrence || 'none');
        setTagError('');

        const byId = t.tagId && list.find((x) => x.id === t.tagId);
        const byName = list.find((x) => x.name === t.category);
        setSelectedTagId(byId?.id ?? byName?.id ?? list[0]?.id ?? null);
      }

      hydrate();
      return () => {
        active = false;
      };
    }, [taskId]),
  );

  const onSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Add a title for this task.');
      return;
    }
    setTitleError('');
    if (tags.length > 0 && !selectedTagId) {
      setTagError('Select a tag.');
      return;
    }
    setTagError('');
    setSubmitting(true);
    try {
      const tag = tags.find((x) => x.id === selectedTagId);
      const payload = {
        title: trimmed,
        description: description.trim(),
        priority,
        tagId: tag ? tag.id : '',
        category: tag ? tag.name : 'General',
        dueDate: toIsoDate(dueDate),
        dueTime: toTimeString(dueTime),
        recurrence,
      };
      if (isEdit) {
        await updateTask(String(taskId), payload);
      } else {
        await addTask(payload);
      }
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textMuted }]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.text,
              },
              titleError ? styles.inputError : null,
            ]}
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              if (titleError) setTitleError('');
            }}
            placeholder="What do you need to do?"
            placeholderTextColor={theme.textSubtle}
            accessibilityLabel="Task title"
          />
          {titleError ? (
            <Text style={styles.errorText}>{titleError}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textMuted }]}>Description</Text>
          <TextInput
            style={[
              styles.input,
              styles.inputMultiline,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional notes…"
            placeholderTextColor={theme.textSubtle}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Task description"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textMuted }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITY_OPTIONS.map((opt) => {
              const selected = priority === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.priorityChip,
                    {
                      backgroundColor: opt.backgroundColor,
                      borderColor: selected ? '#2563EB' : opt.borderColor,
                      borderWidth: selected ? 2 : 1,
                    },
                    pressed && styles.priorityChipPressed,
                  ]}
                  onPress={() => setPriority(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Priority ${opt.label}`}
                >
                  <Text style={[styles.priorityChipText, { color: opt.color }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textMuted }]}>Tag</Text>
          {tags.length === 0 ? (
            <Text style={[styles.tagHint, { color: theme.textSubtle }]}>
              No tags yet. Add some from Manage tags on the home screen.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagPillRow}
            >
              {tags.map((tag) => {
                const selected = selectedTagId === tag.id;
                return (
                  <Pressable
                    key={tag.id}
                    style={({ pressed }) => [
                      styles.tagPill,
                      {
                        backgroundColor: hexWithAlpha(tag.color, 0.22),
                        borderColor: tag.color,
                        borderWidth: selected ? 2 : 1,
                      },
                      pressed && styles.tagPillPressed,
                    ]}
                    onPress={() => {
                      setSelectedTagId(tag.id);
                      if (tagError) setTagError('');
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Tag ${tag.name}`}
                  >
                    <Text style={[styles.tagPillText, { color: tag.color }]}>
                      {tag.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
          {tagError ? <Text style={styles.errorText}>{tagError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Due date & time
          </Text>
          <View style={styles.dateTimeRow}>
            <Pressable
              style={({ pressed }) => [
                styles.dateButton,
                { backgroundColor: theme.card, borderColor: theme.border },
                styles.dateTimeHalf,
                pressed && styles.dateButtonPressed,
              ]}
              onPress={() => setDatePickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose due date"
            >
              <Text style={[styles.dateTimeLabel, { color: theme.textSubtle }]}>
                Date
              </Text>
              <Text style={[styles.dateButtonText, { color: theme.text }]}>
                {formatDueDateDisplay(dueDate)}
              </Text>
              <Text style={[styles.dateHint, { color: theme.textSubtle }]}>
                Tap to change
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.dateButton,
                { backgroundColor: theme.card, borderColor: theme.border },
                styles.dateTimeHalf,
                pressed && styles.dateButtonPressed,
              ]}
              onPress={() => setTimePickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose due time"
            >
              <Text style={[styles.dateTimeLabel, { color: theme.textSubtle }]}>
                Time
              </Text>
              <Text style={[styles.dateButtonText, { color: theme.text }]}>
                {formatTimeDisplay(dueTime)}
              </Text>
              <Text style={[styles.dateHint, { color: theme.textSubtle }]}>
                Tap to change
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textMuted }]}>Recurring</Text>
          <View style={styles.priorityRow}>
            {RECURRENCE_OPTIONS.map((opt) => {
              const selected = recurrence === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.recurrenceChip,
                    {
                      backgroundColor: selected ? theme.primary : theme.card,
                      borderColor: selected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setRecurrence(opt.value)}
                >
                  <Text
                    style={[
                      styles.recurrenceChipText,
                      { color: selected ? theme.onPrimary : theme.textMuted },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: bottomPadding,
            backgroundColor: theme.bg,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            { backgroundColor: theme.primary },
            (pressed || submitting) && styles.submitButtonPressed,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? 'Save changes' : 'Save task'}
        >
          <Text style={[styles.submitLabel, { color: theme.onPrimary }]}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Save task'}
          </Text>
        </Pressable>
      </View>

      <DatePicker
        modal
        open={datePickerOpen}
        date={dueDate}
        mode="date"
        onConfirm={(d) => {
          setDatePickerOpen(false);
          setDueDate(d);
        }}
        onCancel={() => setDatePickerOpen(false)}
      />
      <DatePicker
        modal
        open={timePickerOpen}
        date={dueTime}
        mode="time"
        onConfirm={(d) => {
          setTimePickerOpen(false);
          setDueTime(d);
        }}
        onCancel={() => setTimePickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  field: {
    marginBottom: 22,
  },
  label: {
    ...typography.caption,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E4E7',
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...typography.body,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 14,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeHalf: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputError: {
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  priorityChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  priorityChipPressed: {
    opacity: 0.92,
  },
  priorityChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tagHint: {
    ...typography.body,
    lineHeight: 22,
  },
  tagPillRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 10,
    paddingVertical: 2,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  tagPillPressed: {
    opacity: 0.9,
  },
  tagPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E4E7',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateButtonPressed: {
    backgroundColor: '#FAFAFA',
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
  },
  dateHint: {
    marginTop: 4,
    fontSize: 13,
    color: '#71717A',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitLabel: {
    ...typography.button,
  },
  recurrenceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  recurrenceChipText: {
    ...typography.caption,
  },
});
