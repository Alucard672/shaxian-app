import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme';
import { Icon, IconName } from './Icon';
import { useBadges } from '@/store/useBadges';

// Custom bottom tab bar — matches prototype with raised center FAB.
// Order: Dash / Orders / [FAB +] / Stock / Me
const TABS: { name: string; label: string; icon: IconName; badgeKey?: 'orders' | 'stock' }[] = [
  { name: 'Dash', label: '工作台', icon: 'dash' },
  { name: 'Orders', label: '销售', icon: 'order', badgeKey: 'orders' },
  { name: 'Stock', label: '库存', icon: 'stock', badgeKey: 'stock' },
  { name: 'Me', label: '我的', icon: 'cust' },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const badges = useBadges();
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  const renderTab = (tab: typeof TABS[0]) => {
    const idx = state.routes.findIndex(r => r.name === tab.name);
    const focused = state.index === idx;
    const color = focused ? colors.brand700 : colors.ink400;
    const badge = tab.badgeKey ? badges[tab.badgeKey] : 0;
    return (
      <Pressable
        key={tab.name}
        onPress={() => navigation.navigate(tab.name)}
        style={styles.tab}>
        <View>
          <Icon name={tab.icon} size={22} color={color} strokeWidth={focused ? 1.9 : 1.5} />
          {badge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.label, { color, fontWeight: focused ? '600' : '400' }]}>{tab.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      {left.map(renderTab)}

      {/* Center FAB — navigates into NewOrder stack screen */}
      <View style={styles.fabSlot}>
        <Pressable
          onPress={() => navigation.getParent()?.navigate('NewOrder')}
          style={({ pressed }) => [styles.fabBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] }]}>
          <LinearGradient
            colors={[colors.brand500, colors.brand900]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={styles.fabBg}>
            <Icon name="plus" size={22} color="#fff" strokeWidth={2.4} />
          </LinearGradient>
        </Pressable>
      </View>

      {right.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 0.5,
    borderTopColor: colors.ink100,
    paddingTop: 8,
    paddingBottom: 22,
    paddingHorizontal: 4,
    ...Platform.select({
      ios: { shadowColor: colors.ink900, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
      android: { elevation: 8 },
    }),
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 10, marginTop: 2 },
  badge: {
    position: 'absolute', top: -3, right: -8,
    minWidth: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.danger, paddingHorizontal: 3,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  fabSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  fabBtn: { marginTop: -20 },
  fabBg: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.brand900, shadowOpacity: 0.4,
        shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 8 },
    }),
  },
});
