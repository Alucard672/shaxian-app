import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { NavBar, NavIconButton } from '@/components/NavBar';
import { Badge } from '@/components/Badge';
import { listCustomers, Customer } from '@/api/customer';
import { useAuth } from '@/store/useAuth';

export function CustomersScreen() {
  const nav = useNavigation<any>();
  const session = useAuth(s => s.session);
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!session) return;
    if (!silent) setLoading(true);
    try {
      const list = await listCustomers(session.sessionId, session.tenantId);
      setItems(Array.isArray(list) ? list : (list as any)?.records ?? []);
    } catch (e: any) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(true); }, [load]));

  const totalUnpaid = items.reduce((s, c) => s + (c.unpaidAmount ?? 0), 0);
  const unpaidCount = items.filter(c => (c.unpaidAmount ?? 0) > 0).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title="客户对账" sub={`${items.length} 位客户`}
        back onBack={() => nav.goBack()}
        right={<>
          <NavIconButton name="search" />
          <NavIconButton name="plus" color={colors.brand700}
            onPress={() => nav.navigate('CustomerForm')} />
        </>} />


      <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
        <View style={styles.summary}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.summaryLabel}>应收总额 · TOTAL A/R</Text>
            <View style={{ flex: 1 }} />
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>{unpaidCount} 家未结</Text>
            </View>
          </View>
          <Text style={styles.summaryValue}>¥{totalUnpaid.toLocaleString()}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand700} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={c => String(c.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={{ color: colors.ink400, textAlign: 'center', marginTop: 40 }}>暂无客户</Text>}
          renderItem={({ item }) => {
            const unpaid = item.unpaidAmount ?? 0;
            const avatarColor = unpaid > 0 ? colors.danger : colors.brand700;
            return (
              <Pressable style={styles.card}
                onPress={() => nav.navigate('CustomerForm', { customer: item })}>
                <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                  <Text style={styles.avatarText}>{item.name?.[0] ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    {unpaid > 0 && <Badge tone="danger">有欠款</Badge>}
                  </View>
                  <Text style={styles.sub}>{item.contactPerson || '-'} · {item.phone || ''}</Text>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel}>累计</Text>
                      <Text style={styles.rowValue}>¥{(item.totalAmount ?? 0).toLocaleString()}</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: colors.ink100 }} />
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                      <Text style={styles.rowLabel}>欠款</Text>
                      <Text style={[styles.rowValue, { color: unpaid > 0 ? colors.danger : colors.ok }]}>
                        {unpaid > 0 ? `¥${unpaid.toLocaleString()}` : '已结清'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: '#fff5f5', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#f5d3d3',
  },
  summaryLabel: { fontSize: 10, color: '#9a2929', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '500' },
  summaryBadge: { backgroundColor: colors.dangerBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  summaryBadgeText: { color: colors.danger, fontSize: 10, fontWeight: '600' },
  summaryValue: { fontSize: 26, fontWeight: '700', color: colors.danger, fontFamily: fontMono, marginTop: 4, letterSpacing: -0.6 },

  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    flexDirection: 'row', gap: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 11, color: colors.ink500, marginTop: 2, fontFamily: fontMono },
  row: {
    flexDirection: 'row', marginTop: 10, paddingTop: 10,
    borderTopWidth: 0.5, borderTopColor: colors.ink100, borderStyle: 'dashed',
  },
  rowLabel: { fontSize: 10, color: colors.ink400, textTransform: 'uppercase' },
  rowValue: { fontSize: 14, fontWeight: '600', fontFamily: fontMono, marginTop: 2 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
