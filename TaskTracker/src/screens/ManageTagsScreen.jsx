import React, { Fragment, useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TAG_COLOR_PRESETS,
  addTag,
  deleteTag,
  loadTags,
} from '../storage/Tags';
import { clearTagIdFromTasks } from '../storage/Tasks';
import { hexWithAlpha } from '../utils/colorUtils';

export default function ManageTagsScreen() {
  const insets = useSafeAreaInsets();
  const [tags, setTags] = useState([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLOR_PRESETS[0]);
  const [customHex, setCustomHex] = useState('');
  const [addError, setAddError] = useState('');

  const refresh = useCallback(async () => {
    setTags(await loadTags());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const effectiveColor = () => {
    const c = customHex.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(c)) {
      return c;
    }
    return newColor;
  };

  const onAddTag = async () => {
    const name = newName.trim();
    if (!name) {
      setAddError('Enter a tag name.');
      return;
    }
    setAddError('');
    const color = effectiveColor();
    const created = await addTag({ name, color });
    if (!created) {
      setAddError('A tag with that name already exists.');
      return;
    }
    setNewName('');
    setCustomHex('');
    setNewColor(TAG_COLOR_PRESETS[0]);
    await refresh();
  };

  const onDeleteTag = (item) => {
    Alert.alert(
      'Delete tag',
      `Remove “${item.name}”? Tasks keep the name but lose this color.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTag(item.id);
            await clearTagIdFromTasks(item.id);
            await refresh();
          },
        },
      ],
    );
  };

  const renderTag = ({ item }) => (
    <View style={styles.tagRow}>
      <View
        style={[
          styles.tagPill,
          {
            backgroundColor: hexWithAlpha(item.color, 0.2),
            borderColor: item.color,
          },
        ]}
      >
        <Text style={[styles.tagPillText, { color: item.color }]}>
          {item.name}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.deleteBtn,
          pressed && styles.deleteBtnPressed,
        ]}
        onPress={() => onDeleteTag(item)}
        accessibilityRole="button"
        accessibilityLabel={`Delete tag ${item.name}`}
      >
        <Text style={styles.deleteBtnText}>Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>New tag</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={(v) => {
            setNewName(v);
            if (addError) setAddError('');
          }}
          placeholder="e.g. Errands"
          placeholderTextColor="#A1A1AA"
          accessibilityLabel="New tag name"
        />

        <Text style={[styles.label, styles.labelSpaced]}>Color</Text>
        <View style={styles.colorGrid}>
          {TAG_COLOR_PRESETS.map((c) => {
            const selected = newColor === c && !customHex.trim();
            return (
              <Pressable
                key={c}
                style={({ pressed }) => [
                  styles.colorSwatch,
                  { backgroundColor: c },
                  selected && styles.colorSwatchSelected,
                  pressed && styles.colorSwatchPressed,
                ]}
                onPress={() => {
                  setNewColor(c);
                  setCustomHex('');
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Color ${c}`}
              />
            );
          })}
        </View>

        <Text style={[styles.label, styles.labelSpaced]}>Custom hex (optional)</Text>
        <TextInput
          style={styles.input}
          value={customHex}
          onChangeText={(v) => setCustomHex(v)}
          placeholder="#7C3AED"
          placeholderTextColor="#A1A1AA"
          autoCapitalize="none"
          accessibilityLabel="Custom color hex"
        />

        {addError ? <Text style={styles.errorText}>{addError}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={onAddTag}
          accessibilityRole="button"
          accessibilityLabel="Add tag"
        >
          <Text style={styles.addButtonLabel}>Add tag</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, styles.listSection]}>Your tags</Text>
        {tags.length === 0 ? (
          <Text style={styles.emptyList}>No tags yet. Add one above.</Text>
        ) : (
          tags.map((item) => (
            <Fragment key={item.id}>{renderTag({ item })}</Fragment>
          ))
        )}
      </ScrollView>
    </View>
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
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  listSection: {
    marginTop: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
    marginBottom: 8,
  },
  labelSpaced: {
    marginTop: 16,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#18181B',
    borderWidth: 3,
  },
  colorSwatchPressed: {
    opacity: 0.85,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  addButton: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonPressed: {
    opacity: 0.9,
  },
  addButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyList: {
    fontSize: 15,
    color: '#71717A',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E4E7',
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 1,
    marginRight: 12,
  },
  tagPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteBtnPressed: {
    opacity: 0.8,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
});
