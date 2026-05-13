import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { NavBar, NavIconButton } from '@/components/NavBar';
import { Icon } from '@/components/Icon';
import { Badge, Tone } from '@/components/Badge';
import { Segment } from '@/components/Segment';
import { listSalesOrders, SalesOrder } from '@/api/sales';
import { useAuth } from '@/store/useAuth';

const PAGE_SIZE = 20;

function statusTone(status: string): Tone {
  if (status === '待审核') return 'warn';
  if (status === '已完成' || status === '已审核') return 'ok';
  if (status === '已作废') return 'muted';
  return 'info';
}

function formatMoney(n: number) {
  if (n >= 10_000) return `¥${(n / 1000).toFixed(1)}k`;
  return `¥${Math.round(n).toLocaleString()}`;
}

export function OrdersScreen() {
  const nav = useNavigation<any>();
  const session = useAuth(s => s.session);
  const [tab, setTab] = useState('all');
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  const load = useCallback(async (reset: boolean) => {
    if (!session) return;
    if (reset) {
      setLoading(orders.length === 0);
      pageRef.current = 1;
    } else {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    }
    try {
      const page = reset ? 1 : pageRef.current + 1;
      const res = await listSalesOrders(session.sessionId, session.tenantId, {
        status: tab === 'all' ? undefined : tab,
        pageNo: page, pageSize: PAGE_SIZE,
      });
      const list = Array.isArray(res) ? res : (res as any)?.records ?? [];
      pageRef.current = page;
      setHasMore(list.length >= PAGE_SIZE);
      setOrders(reset ? list : [...orders, ...list]);
    } catch (e: any) {
      if (reset) Alert.alert('加载失败', e.message ?? '请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, tab, orders, hasMore, loadingMore]);

  useEffect(() => { load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [session, tab]);

  const monthTotal = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const monthUnpaid = orders.reduce((s, o) => s + (o.unpaidAmount ?? 0), 0);
  const pendingCount = orders.filter(o => o.status === '待审核').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title="销售单" sub={`${orders.length}${hasMore ? '+' : ''} 单`}
        right={<>
          <NavIconButton name="search" />
          <NavIconButton name="filter" />
        </>} />

      <View style={styles.stats}>
        <StatBox label="累计销售额" value={formatMoney(monthTotal)} color={colors.brand700} />
        <StatBox label="待审核" value={String(pendingCount)} color={colors.warn} />
        <StatBox label="待收款" value={formatMoney(monthUnpaid)} color={colors.danger} />
      </View>

      <Segment
        active={tab}
        onChange={setTab}
        items={[
          { k: 'all', label: '全部' },
          { k: '待审核', label: '待审核' },
          { k: '已完成', label: '已完成' },
          { k: '已作废', label: '已作废' },
        ]}
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand700} /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => String(o.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
          contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          onEndReached={() => load(false)}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<Text style={{ color: colors.ink400, textAlign: 'center', marginTop: 40 }}>暂无销售单</Text>}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 16, alignItems: 'center' }}><ActivityIndicator color={colors.brand500} /></View>
            ) : orders.length > 0 && !hasMore ? (
              <Text style={{ textAlign: 'center', color: colors.ink400, padding: 16, fontSize: 11 }}>— 到底了 —</Text>
            ) : null
          }
          renderItem={({ item }) => {
            const tone = statusTone(item.status);
            const borderColor = tone === 'warn' ? colors.warn : tone === 'ok' ? colors.ok : colors.ink300;
            return (
              <Pressable onPress={() => nav.navigate('OrderDetail', { id: item.id })}
                style={[styles.card, { borderLeftColor: borderColor }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.orderNo}>{item.orderNumber}</Text>
                  <View style={{ flex: 1 }} />
                  <Badge tone={tone}>{item.status}</Badge>
                </View>
                <Text style={styles.custName}>{item.customerName}</Text>
                <Text style={styles.operator}>{item.operator || '-'} · {item.salesDate}</Text>
                <View style={styles.divider} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {item.unpaidAmount > 0 && (
                    <Text style={styles.unpaid}>
                      欠 <Text style={styles.unpaidNum}>¥{item.unpaidAmount.toLocaleString()}</Text>
                    </Text>
                  )}
                  <View style={{ flex: 1 }} />
                  <Text style={styles.total}>¥{(item.totalAmount ?? 0).toLocaleString()}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => nav.navigate('NewOrder')}>
        <Icon name="plus" size={22} color="#fff" strokeWidth={2.4} />
      </Pressable>
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10 },
  statLabel: { fontSize: 10, color: colors.ink500, textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 16, fontWeight: '700', fontFamily: fontMono, marginTop: 2, letterSpacing: -0.4 },

  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, borderLeftWidth: 3 },
  orderNo: { fontSize: 11, color: colors.ink500, fontFamily: fontMono, fontWeight: '500' },
  custName: { fontSize: 15, fontWeight: '600', color: colors.ink900, marginTop: 6 },
  operator: { fontSize: 12, color: colors.ink500, marginTop: 2, fontFamily: fontMono },
  divider: { height: 1, backgroundColor: colors.ink50, marginVertical: 8 },
  unpaid: { fontSize: 11, color: colors.danger },
  unpaidNum: { fontWeight: '600', fontFamily: fontMono },
  total: { fontSize: 17, fontWeight: '700', fontFamily: fontMono, letterSpacing: -0.4, color: colors.ink900 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  fab: {
    position: 'absolute', bottom: 32, right: 22,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.brand700,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.brand900, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
