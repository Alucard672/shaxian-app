import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontMono } from '@/theme';
import { NavBar } from '@/components/NavBar';
import { Badge } from '@/components/Badge';
import { listSuppliers, Supplier } from '@/api/supplier';
import { useAuth } from '@/store/useAuth';

export function SuppliersScreen() {
  const session = useAuth(s => s.session);
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!session) return;
    if (!silent) setLoading(true);
    try {
      setItems(await listSuppliers(session.sessionId, session.tenantId));
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const totalUnpaid = items.reduce((s, c) => s + (c.unpaidAmount ?? 0), 0);
  const unpaidCount = items.filter(c => (c.unpaidAmount ?? 0) > 0).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title="供应商对账" sub={`${items.length} 家供应商`} />

      <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
        <View style={styles.summary}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.summaryLabel}>应付总额 · TOTAL A/P</Text>
            <View style={{ flex: 1 }} />
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>{unpaidCount} 家待付</Text>
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
          keyExtractor={s => String(s.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={{ color: colors.ink400, textAlign: 'center', marginTop: 40 }}>暂无供应商</Text>}
          renderItem={({ item }) => {
            const unpaid = item.unpaidAmount ?? 0;
            return (
              <Pressable style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: unpaid > 0 ? colors.warn : colors.ok }]}>
                  <Text style={styles.avatarText}>{item.name?.[0] ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.settlementCycle && <Badge tone="muted">{item.settlementCycle}</Badge>}
                  </View>
                  <Text style={styles.sub}>{item.contactPerson || '-'} · {item.phone || ''}</Text>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel}>累计</Text>
                      <Text style={styles.rowValue}>¥{(item.totalAmount ?? 0).toLocaleString()}</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: colors.ink100 }} />
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                      <Text style={styles.rowLabel}>待付款</Text>
                      <Text style={[styles.rowValue, { color: unpaid > 0 ? colors.warn : colors.ok }]}>
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
    backgroundColor: '#fff9f0', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#f5e3c3',
  },
  summaryLabel: { fontSize: 10, color: '#a35b0e', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '500' },
  summaryBadge: { backgroundColor: colors.warnBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  summaryBadgeText: { color: '#a35b0e', fontSize: 10, fontWeight: '600' },
  summaryValue: { fontSize: 26, fontWeight: '700', color: colors.warn, fontFamily: fontMono, marginTop: 4, letterSpacing: -0.6 },

  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, flexDirection: 'row', gap: 10 },
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
