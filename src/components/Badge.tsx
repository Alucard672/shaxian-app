import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'muted';

const toneMap: Record<Tone, { bg: string; fg: string; dot: string }> = {
  ok: { bg: colors.okBg, fg: '#0e6a3e', dot: colors.ok },
  warn: { bg: colors.warnBg, fg: '#a35b0e', dot: colors.warn },
  danger: { bg: colors.dangerBg, fg: '#9a2929', dot: colors.danger },
  info: { bg: colors.infoBg, fg: '#1b4d78', dot: colors.info },
  muted: { bg: colors.ink50, fg: colors.ink500, dot: colors.ink400 },
};

export function Badge({ tone = 'muted', children }: { tone?: Tone; children: React.ReactNode }) {
  const t = toneMap[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <View style={[styles.dot, { backgroundColor: t.dot }]} />
      <Text style={[styles.text, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  text: { fontSize: 11, fontWeight: '500' },
});
