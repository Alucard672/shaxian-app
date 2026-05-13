import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { NavBar, NavIconButton } from '@/components/NavBar';
import { Badge } from '@/components/Badge';
import { listEmployees, Employee } from '@/api/employee';
import { useAuth } from '@/store/useAuth';

export function EmployeesScreen() {
  const nav = useNavigation<any>();
  const session = useAuth(s => s.session);
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!session) return;
    if (!silent) setLoading(true);
    try {
      setItems(await listEmployees(session.sessionId, session.tenantId));
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(true); }, [load]));

  const active = items.filter(e => e.status === 'active').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title="员工管理" sub={`共 ${items.length} 人 · 在职 ${active}`}
        back onBack={() => nav.goBack()}
        right={<NavIconButton name="plus" color={colors.brand700}
          onPress={() => nav.navigate('EmployeeForm')} />} />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand700} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={e => String(e.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={{ color: colors.ink400, textAlign: 'center', marginTop: 40 }}>暂无员工</Text>}
          renderItem={({ item }) => {
            const activeE = item.status === 'active';
            return (
              <Pressable style={styles.card}
                onPress={() => nav.navigate('EmployeeForm', { employee: item })}>
                <View style={[styles.avatar, { backgroundColor: activeE ? colors.brand700 : colors.ink400 }]}>
                  <Text style={styles.avatarText}>{item.name?.[0] ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Badge tone={activeE ? 'ok' : 'muted'}>{activeE ? '在职' : '停用'}</Badge>
                  </View>
                  <Text style={styles.sub}>
                    {item.position || '—'}{item.role ? ` · ${item.role}` : ''}
                  </Text>
                  <Text style={styles.meta}>{item.phone || '无联系方式'}</Text>
                </View>
                <Text style={{ color: colors.ink300, fontSize: 16 }}>›</Text>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, color: colors.ink500, marginTop: 2 },
  meta: { fontSize: 11, color: colors.ink400, fontFamily: fontMono, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
