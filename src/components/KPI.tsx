import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontMono } from '@/theme';

interface Props {
  label: string;
  value: string;
  delta?: { dir?: 'up' | 'down'; text: string };
  tone?: 'danger' | 'warn';
}

export function KPI({ label, value, delta, tone }: Props) {
  const danger = tone === 'danger';
  return (
    <View style={[styles.card, danger && { backgroundColor: '#fff5f5', borderColor: '#f5d3d3' }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, danger && { color: colors.danger }]}>{value}</Text>
      {delta && (
        <Text
          style={[
            styles.delta,
            delta.dir === 'up' && { color: colors.ok },
            delta.dir === 'down' && { color: colors.danger },
          ]}>
          {delta.dir === 'up' ? '↑' : delta.dir === 'down' ? '↓' : ''} {delta.text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.ink100,
  },
  label: {
    fontSize: 10,
    color: colors.ink500,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink900,
    marginTop: 2,
    fontFamily: fontMono,
    letterSpacing: -0.4,
  },
  delta: {
    fontSize: 10,
    marginTop: 4,
    color: colors.ink400,
    fontFamily: fontMono,
  },
});
