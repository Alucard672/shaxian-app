import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fontMono } from '@/theme';

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
        <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
          <Text style={{ color: fg, fontSize: 22 }}>‹</Text>
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: fg }]} numberOfLines={1}>{title}</Text>
        {sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
    minHeight: 44,
  },
  back: { width: 32, height: 32, marginLeft: -8, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  sub: { fontSize: 11, color: colors.ink400, fontFamily: fontMono, marginTop: 1 },
});
