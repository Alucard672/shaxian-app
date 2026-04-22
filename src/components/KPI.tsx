import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontMono } from '@/theme';
import { Icon } from './Icon';

interface Props {
  label: string;
  value: string;
  delta?: { dir?: 'up' | 'down'; text: string };
  tone?: 'danger' | 'warn';
}

export function KPI({ label, value, delta, tone }: Props) {
  const danger = tone === 'danger';
  return (
    <View style={[
      styles.card,
      danger && { backgroundColor: '#fff5f5', borderColor: '#f5d3d3' },
    ]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, danger && { color: colors.danger }]}>{value}</Text>
      {delta && (
        <View style={styles.deltaRow}>
          {delta.dir === 'up' && <Icon name="up" size={10} color={colors.ok} strokeWidth={2} />}
          {delta.dir === 'down' && <Icon name="down" size={10} color={colors.danger} strokeWidth={2} />}
          <Text style={[
            styles.delta,
            delta.dir === 'up' && { color: colors.ok },
            delta.dir === 'down' && { color: colors.danger },
          ]}>
            {delta.text}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.ink100,
    minHeight: 88,
  },
  label: { fontSize: 11, color: colors.ink500, letterSpacing: 0.2 },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink900,
    marginTop: 4,
    fontFamily: fontMono,
    letterSpacing: -0.4,
  },
  deltaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  delta: { fontSize: 11, color: colors.ink400, fontFamily: fontMono },
});
