import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontMono } from '@/theme';
import { NavBar } from '@/components/NavBar';
import { Badge } from '@/components/Badge';
import { Segment } from '@/components/Segment';
import { listStock, StockItem } from '@/api/stock';
import { useAuth } from '@/store/useAuth';

export function StockScreen() {
  const session = useAuth(s => s.session);
  const [seg, setSeg] = useState('all');
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!session) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const all = await listStock(session.sessionId, session.tenantId);
      const list = seg === 'low' ? all.filter(i => i.lowStock) : all;
      setItems(list);
    } catch (e: any) {
      setError(e.message ?? '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, seg]);

  useEffect(() => { load(); }, [load]);

  const totalValue = items.reduce((s, i) => s + (i.totalValue ?? i.quantity * i.price ?? 0), 0);
  const lowCount = items.filter(i => i.lowStock || i.quantity < 100).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title="库存管理" sub={`${items.length} 项 · 本仓`} />

      <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
        <LinearGradient
          colors={[colors.ink900, colors.ink800]}
          style={styles.summary}>
          <Text style={styles.summaryLabel}>库存总值 · A/R</Text>
          <Text style={styles.summaryValue}>¥{totalValue.toLocaleString()}</Text>
          <View style={styles.summaryRow}>
            <SummaryStat label="种类" value={String(items.length)} />
            <SummaryStat label="低库存" value={String(lowCount)} color={colors.warn} />
            <SummaryStat label="本月出库" value="3,200kg" />
          </View>
        </LinearGradient>
      </View>

      <Segment
        active={seg}
        onChange={setSeg}
        items={[
          { k: 'all', label: '全部' },
          { k: 'low', label: '低库存' },
          { k: 'yarn', label: '纱线' },
          { k: 'wool', label: '羊毛' },
        ]}
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand700} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>
          <Pressable onPress={() => load()} style={styles.retry}><Text style={{ color: colors.brand700 }}>重试</Text></Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={it => `${it.batchId}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={{ color: colors.ink400, textAlign: 'center', marginTop: 40 }}>暂无库存数据</Text>}
          renderItem={({ item }) => {
            const low = item.lowStock || item.quantity < 100;
            return (
              <View style={styles.card}>
                <View style={[styles.swatch, { backgroundColor: item.colorValue || '#eee' }]} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.name}>{item.productName}</Text>
                    {low && <Badge tone="warn">低库存</Badge>}
                  </View>
                  <Text style={styles.color}>{item.colorName || '—'}</Text>
                  <Text style={styles.meta}>缸号 {item.batchCode} · ¥{item.price}/{item.unit}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.qty, low && { color: colors.danger }]}>{item.quantity}</Text>
                  <Text style={styles.qtyUnit}>{item.unit}</Text>
                  <Text style={styles.value}>¥{(item.totalValue ?? item.quantity * item.price).toLocaleString()}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function SummaryStat({ label, value, color = '#fff' }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.ink300, fontSize: 10 }}>{label}</Text>
      <Text style={{ color, fontSize: 15, fontWeight: '600', fontFamily: fontMono, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: 10, padding: 16 },
  summaryLabel: { color: colors.ink300, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryValue: { color: '#fff', fontSize: 26, fontWeight: '700', fontFamily: fontMono, marginTop: 4, letterSpacing: -0.6 },
  summaryRow: {
    flexDirection: 'row', marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },

  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  swatch: { width: 16, height: 16, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  name: { fontSize: 14, fontWeight: '600' },
  color: { fontSize: 12, color: colors.ink500, marginTop: 2 },
  meta: { fontSize: 10, color: colors.ink400, fontFamily: fontMono, marginTop: 3 },
  qty: { fontSize: 18, fontWeight: '700', fontFamily: fontMono, color: colors.ink900, letterSpacing: -0.4 },
  qtyUnit: { fontSize: 10, color: colors.ink400, fontFamily: fontMono },
  value: { fontSize: 11, color: colors.ink500, fontFamily: fontMono, marginTop: 4 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retry: { paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: colors.brand500, borderRadius: 4 },
});
