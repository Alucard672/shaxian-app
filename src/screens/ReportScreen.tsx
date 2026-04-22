import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, Pressable,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/store/useAuth';
import { listSalesOrders, SalesOrder } from '@/api/sales';

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year';

function startOfPeriod(p: Period): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  switch (p) {
    case 'today': return d;
    case 'week': { const day = d.getDay() || 7; d.setDate(d.getDate() - (day - 1)); return d; }
    case 'month': return new Date(d.getFullYear(), d.getMonth(), 1);
    case 'quarter': { const q = Math.floor(d.getMonth() / 3) * 3; return new Date(d.getFullYear(), q, 1); }
    case 'year': return new Date(d.getFullYear(), 0, 1);
  }
}

export function ReportScreen() {
  const nav = useNavigation<any>();
  const session = useAuth(s => s.session);
  const [period, setPeriod] = useState<Period>('month');
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!session) return;
    if (!silent) setLoading(true);
    try {
      setOrders(await listSalesOrders(session.sessionId, session.tenantId));
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => {
    const start = startOfPeriod(period);
    const filtered = orders.filter(o => o.salesDate && new Date(o.salesDate) >= start);
    const total = filtered.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const paid = filtered.reduce((s, o) => s + (o.paidAmount || 0), 0);
    const unpaid = filtered.reduce((s, o) => s + (o.unpaidAmount || 0), 0);
    const count = filtered.length;
    const avg = count ? total / count : 0;

    // Build daily series for chart
    const days = Math.max(1, Math.ceil((Date.now() - start.getTime()) / (1000 * 3600 * 24)) + 1);
    const series = new Array(Math.min(days, 31)).fill(0);
    for (const o of filtered) {
      const d = new Date(o.salesDate);
      const idx = Math.floor((d.getTime() - start.getTime()) / (1000 * 3600 * 24));
      if (idx >= 0 && idx < series.length) series[idx] += o.totalAmount || 0;
    }

    // Top customers
    const byCustomer = new Map<string, number>();
    for (const o of filtered) {
      byCustomer.set(o.customerName, (byCustomer.get(o.customerName) || 0) + (o.totalAmount || 0));
    }
    const topCustomers = [...byCustomer.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount).slice(0, 5);

    return { total, paid, unpaid, count, avg, series, topCustomers };
  }, [orders, period]);

  const max = Math.max(1, ...summary.series);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title="销售报表" sub={new Date().toLocaleDateString('zh-CN')}
        back onBack={() => nav.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}>

        <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['today', 'week', 'month', 'quarter', 'year'] as Period[]).map(p => (
                <Pressable key={p} onPress={() => setPeriod(p)} style={[
                  styles.pill,
                  period === p && { backgroundColor: colors.ink900, borderColor: colors.ink900 },
                ]}>
                  <Text style={[styles.pillText, period === p && { color: '#fff' }]}>
                    {p === 'today' ? '今日' : p === 'week' ? '本周' : p === 'month' ? '本月' : p === 'quarter' ? '本季' : '本年'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={colors.brand700} /></View>
        ) : (
          <>
            <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
              <View style={styles.card}>
                <Text style={styles.bigLabel}>销售总额</Text>
                <Text style={styles.bigValue}>¥{summary.total.toLocaleString()}</Text>
                <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
                  <Text style={styles.metaNum}>{summary.count} 单</Text>
                  <Text style={styles.metaNum}>客单价 ¥{Math.round(summary.avg).toLocaleString()}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.statRow, { marginBottom: 10 }]}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>已收款</Text>
                <Text style={[styles.statValue, { color: colors.ok }]}>¥{(summary.paid / 1000).toFixed(1)}k</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>待收款</Text>
                <Text style={[styles.statValue, { color: colors.danger }]}>¥{(summary.unpaid / 1000).toFixed(1)}k</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>订单数</Text>
                <Text style={styles.statValue}>{summary.count}</Text>
              </View>
            </View>

            <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
              <View style={[styles.card, { padding: 14 }]}>
                <Text style={styles.cardTitle}>销售趋势</Text>
                <Text style={styles.cardSub}>最高 ¥{Math.round(max).toLocaleString()}</Text>
                <View style={{ height: 120, marginTop: 14 }}>
                  <Svg width="100%" height="100%" viewBox="0 0 320 120" preserveAspectRatio="none">
                    <Defs>
                      <SvgGrad id="rgrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={colors.brand500} stopOpacity="0.3" />
                        <Stop offset="1" stopColor={colors.brand500} stopOpacity="0" />
                      </SvgGrad>
                    </Defs>
                    {(() => {
                      const pts = summary.series.map((v, i) =>
                        `${(i / Math.max(1, summary.series.length - 1)) * 320},${120 - (v / max) * 110}`
                      );
                      const path = 'M ' + pts.join(' L ');
                      const area = path + ' L 320,120 L 0,120 Z';
                      return (
                        <>
                          <Path d={area} fill="url(#rgrad)" />
                          <Path d={path} fill="none" stroke={colors.brand500} strokeWidth="2" />
                          <Circle cx={320} cy={120 - (summary.series[summary.series.length - 1] / max) * 110} r="4" fill={colors.brand700} stroke="#fff" strokeWidth="2" />
                        </>
                      );
                    })()}
                  </Svg>
                </View>
              </View>
            </View>

            <View style={{ paddingHorizontal: 14 }}>
              <Text style={[styles.cardTitle, { paddingHorizontal: 4, paddingBottom: 8 }]}>客户销售 TOP 5</Text>
              <View style={styles.card}>
                {summary.topCustomers.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: colors.ink400, padding: 16, fontSize: 12 }}>暂无数据</Text>
                ) : summary.topCustomers.map((c, i) => {
                  const pc = summary.topCustomers[0].amount > 0 ? c.amount / summary.topCustomers[0].amount : 0;
                  return (
                    <View key={c.name} style={styles.rankRow}>
                      <View style={[styles.rank, i < 3 && { backgroundColor: colors.brand700 }]}>
                        <Text style={[styles.rankText, i < 3 && { color: '#fff' }]}>{i + 1}</Text>
                      </View>
                      <Text style={styles.rankName}>{c.name}</Text>
                      <View style={styles.rankBar}>
                        <View style={[styles.rankBarFill, { width: `${pc * 100}%` }]} />
                      </View>
                      <Text style={styles.rankAmount}>¥{(c.amount / 1000).toFixed(1)}k</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.ink100,
  },
  pillText: { fontSize: 12, color: colors.ink700 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  bigLabel: { fontSize: 10, color: colors.ink500, textTransform: 'uppercase', letterSpacing: 0.6 },
  bigValue: { fontSize: 30, fontWeight: '700', color: colors.ink900, fontFamily: fontMono, marginTop: 4, letterSpacing: -0.6 },
  metaNum: { fontSize: 11, color: colors.ink500, fontFamily: fontMono },

  statRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12 },
  statLabel: { fontSize: 10, color: colors.ink500, textTransform: 'uppercase' },
  statValue: { fontSize: 17, fontWeight: '700', fontFamily: fontMono, marginTop: 4, letterSpacing: -0.4 },

  cardTitle: { fontSize: 13, fontWeight: '600', color: colors.ink900 },
  cardSub: { fontSize: 10, color: colors.ink400, fontFamily: fontMono, marginTop: 2 },

  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14 },
  rank: { width: 20, height: 20, borderRadius: 4, backgroundColor: colors.ink100, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 11, fontWeight: '700', color: colors.ink500, fontFamily: fontMono },
  rankName: { flex: 1, fontSize: 13, fontWeight: '500', marginLeft: 10 },
  rankBar: { width: 80, height: 3, backgroundColor: colors.ink50, borderRadius: 2, marginHorizontal: 10, overflow: 'hidden' },
  rankBarFill: { height: '100%', backgroundColor: colors.brand500 },
  rankAmount: { width: 70, textAlign: 'right', fontSize: 13, fontWeight: '600', fontFamily: fontMono },
});
