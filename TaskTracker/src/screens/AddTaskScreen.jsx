import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addTask } from '../storage/Tasks';

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

export default function AddTaskScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date());
  const [dueTime, setDueTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bottomPadding = useMemo(
    () => Math.max(insets.bottom, 16),
    [insets.bottom],
  );

  const onSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Add a title for this task.');
      return;
    }
    setTitleError('');
    setSubmitting(true);
    try {
      await addTask({
        title: trimmed,
        description: description.trim(),
        priority,
        category: category.trim() || 'General',
        dueDate: toIsoDate(dueDate),
        dueTime: toTimeString(dueTime),
      });
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
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
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={[styles.input, titleError ? styles.inputError : null]}
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              if (titleError) setTitleError('');
            }}
            placeholder="What do you need to do?"
            placeholderTextColor="#A1A1AA"
            accessibilityLabel="Task title"
          />
          {titleError ? (
            <Text style={styles.errorText}>{titleError}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional notes…"
            placeholderTextColor="#A1A1AA"
            multiline
            textAlignVertical="top"
            accessibilityLabel="Task description"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
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
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Work, Personal"
            placeholderTextColor="#A1A1AA"
            accessibilityLabel="Category"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Due date & time</Text>
          <View style={styles.dateTimeRow}>
            <Pressable
              style={({ pressed }) => [
                styles.dateButton,
                styles.dateTimeHalf,
                pressed && styles.dateButtonPressed,
              ]}
              onPress={() => setDatePickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose due date"
            >
              <Text style={styles.dateTimeLabel}>Date</Text>
              <Text style={styles.dateButtonText}>
                {formatDueDateDisplay(dueDate)}
              </Text>
              <Text style={styles.dateHint}>Tap to change</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.dateButton,
                styles.dateTimeHalf,
                pressed && styles.dateButtonPressed,
              ]}
              onPress={() => setTimePickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose due time"
            >
              <Text style={styles.dateTimeLabel}>Time</Text>
              <Text style={styles.dateButtonText}>
                {formatTimeDisplay(dueTime)}
              </Text>
              <Text style={styles.dateHint}>Tap to change</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPadding }]}>
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            (pressed || submitting) && styles.submitButtonPressed,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Save task"
        >
          <Text style={styles.submitLabel}>
            {submitting ? 'Saving…' : 'Save task'}
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
    backgroundColor: '#F4F4F5',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
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
    fontSize: 16,
    color: '#18181B',
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
    backgroundColor: '#F4F4F5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
  },
  submitButton: {
    backgroundColor: '#2563EB',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
