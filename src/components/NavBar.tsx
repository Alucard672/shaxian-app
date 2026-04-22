import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fontMono } from '@/theme';
import { Icon } from './Icon';

interface Props {
  title: string;
  sub?: string;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  dark?: boolean;
}

export function NavBar({ title, sub, back, onBack, right, dark }: Props) {
  const fg = dark ? '#fff' : colors.ink900;
  return (
    <View style={styles.wrap}>
      {back && (
        <Pressable onPress={onBack} style={styles.back} hitSlop={10}>
          <Icon name="arrowL" size={20} color={fg} strokeWidth={1.8} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: fg }]} numberOfLines={1}>{title}</Text>
        {sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
      {right && <View style={styles.rightWrap}>{right}</View>}
    </View>
  );
}

export function NavIconButton({ name, onPress, color = colors.ink700 }: {
  name: any; onPress?: () => void; color?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.iconBtn} hitSlop={6}>
      <Icon name={name} size={18} color={color} strokeWidth={1.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 4,
    minHeight: 44,
  },
  back: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, marginLeft: 4 },
  sub: { fontSize: 11, color: colors.ink400, fontFamily: fontMono, marginTop: 1, marginLeft: 4 },
  rightWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
});
