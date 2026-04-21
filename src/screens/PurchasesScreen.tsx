import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { NavBar } from '@/components/NavBar';
import { Badge, Tone } from '@/components/Badge';
import { Segment } from '@/components/Segment';
import { listPurchaseOrders, PurchaseOrder } from '@/api/purchase';
import { useAuth } from '@/store/useAuth';

function statusTone(status: string): Tone {
  if (status === '待审核' || status === '草稿') return 'warn';
  if (status === '已入库' || status === '已审核') return 'ok';
  if (status === '在途') return 'info';
  return 'muted';
}

export function PurchasesScreen() {
  const nav = useNavigation<any>();
  const session = useAuth(s => s.session);
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!session) return;
    if (!silent) setLoading(true);
    try {
      const list = await listPurchaseOrders(session.sessionId, session.tenantId, {
        status: tab === 'all' ? undefined : tab,
      });
      setItems(list);
    } catch (e: any) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, tab]);

  useEffect(() => { load(); }, [load]);

  const monthTotal = items.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const unpaidTotal = items.reduce((s, o) => s + (o.unpaidAmount ?? 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title="采购单" sub={`本月 ${items.length} 单`}
        right={
          <Pressable onPress={() => nav.navigate('NewPurchase')}>
            <Text style={{ color: colors.brand700, fontSize: 14 }}>+ 新建</Text>
          </Pressable>
        } />

      <View style={styles.stats}>
        <StatBox label="本月采购额" value={formatMoney(monthTotal)} color={colors.brand700} />
        <StatBox label="待付款" value={formatMoney(unpaidTotal)} color={colors.warn} />
      </View>

      <Segment
        active={tab}
        onChange={setTab}
        items={[
          { k: 'all', label: '全部' },
          { k: '待审核', label: '待审核' },
          { k: '在途', label: '在途' },
          { k: '已入库', label: '已入库' },
        ]}
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand700} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={o => String(o.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={{ color: colors.ink400, textAlign: 'center', marginTop: 40 }}>暂无采购单</Text>}
          renderItem={({ item }) => {
            const tone = statusTone(item.status);
            const borderColor = tone === 'warn' ? colors.warn : tone === 'ok' ? colors.ok : tone === 'info' ? colors.info : colors.ink300;
            return (
              <Pressable onPress={() => Alert.alert('采购单', item.orderNumber)}
                style={[styles.card, { borderLeftColor: borderColor }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.orderNo}>{item.orderNumber}</Text>
                  <View style={{ flex: 1 }} />
                  <Badge tone={tone}>{item.status}</Badge>
                </View>
                <Text style={styles.sup}>{item.supplierName}</Text>
                <Text style={styles.meta}>{item.operator || '-'} · {item.purchaseDate}</Text>
                <View style={styles.divider} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {item.unpaidAmount > 0 && (
                    <Text style={styles.unpaid}>待付 <Text style={styles.unpaidNum}>¥{item.unpaidAmount.toLocaleString()}</Text></Text>
                  )}
                  <View style={{ flex: 1 }} />
                  <Text style={styles.total}>¥{(item.totalAmount ?? 0).toLocaleString()}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function formatMoney(n: number) {
  if (n >= 10_000) return `¥${(n / 1000).toFixed(1)}k`;
  return `¥${Math.round(n).toLocaleString()}`;
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
  sup: { fontSize: 15, fontWeight: '600', color: colors.ink900, marginTop: 6 },
  meta: { fontSize: 12, color: colors.ink500, marginTop: 2, fontFamily: fontMono },
  divider: { height: 1, backgroundColor: colors.ink50, marginVertical: 8 },
  unpaid: { fontSize: 11, color: colors.warn },
  unpaidNum: { fontWeight: '600', fontFamily: fontMono },
  total: { fontSize: 17, fontWeight: '700', fontFamily: fontMono, letterSpacing: -0.4 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
