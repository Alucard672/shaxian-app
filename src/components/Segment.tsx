import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fontMono } from '@/theme';

interface Item { k: string; label: string; count?: number | string; }
interface Props {
  items: Item[];
  active: string;
  onChange: (k: string) => void;
}

export function Segment({ items, active, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {items.map(it => {
        const on = it.k === active;
        return (
          <Pressable key={it.k} onPress={() => onChange(it.k)}
            style={[styles.item, on && styles.itemActive]}>
            <Text style={[styles.label, on && styles.labelActive]}>{it.label}</Text>
            {it.count !== undefined && (
              <Text style={[styles.count, on && { color: colors.brand700 }]}>{it.count}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.ink50,
    borderRadius: 8,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  item: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  itemActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  label: { fontSize: 12, color: colors.ink500 },
  labelActive: { color: colors.ink900, fontWeight: '600' },
  count: { fontSize: 10, color: colors.ink400, fontFamily: fontMono },
});
