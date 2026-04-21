import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { KPI } from '@/components/KPI';
import { useAuth } from '@/store/useAuth';
import { loadDashboardSummary, DashboardSummary } from '@/api/dashboard';

function formatMoney(n: number) {
  if (n >= 1_000_000) return `¥${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `¥${(n / 1000).toFixed(1)}k`;
  return `¥${Math.round(n).toLocaleString()}`;
}

export function DashboardScreen() {
  const nav = useNavigation<any>();
  const session = useAuth(s => s.session);
  const [sum, setSum] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!session) return;
    if (!silent) setLoading(true);
    try {
      const s = await loadDashboardSummary(session.sessionId, session.tenantId);
      setSum(s);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const todayDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' });

  const quickActions = [
    { k: 'NewOrder', l: '开销售单', c: colors.brand500 },
    { k: 'NewPurchase', l: '开采购单', c: colors.ok },
    { k: 'Stock', l: '库存查询', c: colors.warn },
    { k: 'Customers', l: '客户对账', c: colors.info },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <LinearGradient colors={[colors.ink900, colors.ink800]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerMeta}>{session?.tenantName ?? ''} · {todayDate}</Text>
              <Text style={styles.headerTitle}>下午好，{session?.username || '李总'}</Text>
            </View>
            <View style={styles.bell}>
              <Text style={{ fontSize: 16, color: '#fff' }}>🔔</Text>
              {(sum?.pendingApprovalCount ?? 0) > 0 && <View style={styles.bellDot} />}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, marginTop: -20 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}>

        {loading && !sum ? (
          <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={colors.brand700} /></View>
        ) : (
          <>
            <View style={[styles.row, { paddingHorizontal: 14 }]}>
              <KPI label="今日销售"
                value={formatMoney(sum?.todaySales ?? 0)}
                delta={{ text: `${sum?.todayOrderCount ?? 0} 单` }} />
              <View style={{ width: 10 }} />
              <KPI label="本月销售"
                value={formatMoney(sum?.monthSales ?? 0)}
                delta={{ text: `${sum?.monthOrderCount ?? 0} 单` }} />
            </View>
            <View style={[styles.row, { paddingHorizontal: 14, marginTop: 10 }]}>
              <KPI label="应收欠款"
                value={formatMoney(sum?.receivableTotal ?? 0)}
                tone={sum?.overdueCount ? 'danger' : undefined}
                delta={{ dir: 'down', text: `${sum?.overdueCount ?? 0} 笔逾期` }} />
              <View style={{ width: 10 }} />
              <KPI label="库存总值"
                value={formatMoney(sum?.stockTotal ?? 0)}
                delta={{ text: `${sum?.productCount ?? 0} 种 · ${sum?.lowStockCount ?? 0} 低库存` }} />
            </View>

            <View style={styles.quick}>
              {quickActions.map(a => (
                <Pressable key={a.k} onPress={() => nav.navigate(a.k)} style={styles.quickItem}>
                  <View style={[styles.quickIcon, { backgroundColor: a.c + '22' }]}>
                    <View style={[styles.quickIconDot, { backgroundColor: a.c }]} />
                  </View>
                  <Text style={styles.quickLabel}>{a.l}</Text>
                </Pressable>
              ))}
            </View>

            {/* 待办 */}
            <View style={{ marginHorizontal: 14, marginTop: 12 }}>
              <View style={styles.sectionTitle}>
                <Text style={{ fontSize: 13, fontWeight: '600' }}>待处理事项</Text>
                {((sum?.pendingApprovalCount ?? 0) + (sum?.lowStockCount ?? 0) + (sum?.overdueCount ?? 0)) > 0 && (
                  <View style={styles.badge4}><Text style={styles.badge4Text}>
                    {(sum?.pendingApprovalCount ?? 0) + (sum?.lowStockCount ?? 0) + (sum?.overdueCount ?? 0)}
                  </Text></View>
                )}
              </View>
              <View style={styles.feedCard}>
                {(sum?.pendingApprovalCount ?? 0) > 0 && (
                  <FeedItem
                    color={colors.danger} mark="D"
                    title={`${sum?.pendingApprovalCount} 张销售单待审核`}
                    sub="点击查看详情并审核"
                    onPress={() => nav.navigate('Orders')}
                  />
                )}
                {(sum?.lowStockItems ?? []).map((it, i) => (
                  <FeedItem key={`l${i}`} color={colors.warn} mark="W"
                    title={`${it.productName} ${it.colorName} 库存不足`}
                    sub={`剩余 ${it.quantity}${it.unit}`}
                    onPress={() => nav.navigate('Stock')} />
                ))}
                {(sum?.overdueReceivables ?? []).map((it, i) => (
                  <FeedItem key={`o${i}`} color={colors.danger} mark="i"
                    title={`${it.customerName} 欠款逾期`}
                    sub={`¥${it.unpaidAmount.toLocaleString()} · 逾期 ${it.overdueDays ?? 0} 天`}
                    onPress={() => nav.navigate('Customers')} />
                ))}
                {!(sum?.pendingApprovalCount) && !(sum?.lowStockItems?.length) && !(sum?.overdueReceivables?.length) && (
                  <Text style={{ padding: 20, textAlign: 'center', color: colors.ink400, fontSize: 12 }}>
                    ✓ 暂无待办事项
                  </Text>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function FeedItem({ color, mark, title, sub, onPress }: {
  color: string; mark: string; title: string; sub: string; onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.feedItem}>
      <View style={[styles.feedIco, { backgroundColor: color }]}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{mark}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.feedTitle}>{title}</Text>
        <Text style={styles.feedSub}>{sub}</Text>
      </View>
      <Text style={{ color: colors.ink300, fontSize: 14 }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 36 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  headerMeta: { color: colors.ink300, fontSize: 11, fontFamily: fontMono, letterSpacing: 0.4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '600', marginTop: 2 },
  bell: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  bellDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, position: 'absolute', top: 8, right: 8 },
  row: { flexDirection: 'row' },
  quick: { flexDirection: 'row', marginHorizontal: 14, marginTop: 12, backgroundColor: '#fff', borderRadius: 10, padding: 10 },
  quickItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  quickIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickIconDot: { width: 16, height: 16, borderRadius: 4 },
  quickLabel: { fontSize: 11, color: colors.ink700, marginTop: 6 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8 },
  badge4: { backgroundColor: colors.dangerBg, paddingHorizontal: 6, borderRadius: 10, marginLeft: 6 },
  badge4Text: { color: colors.danger, fontSize: 10, fontWeight: '700' },
  feedCard: { backgroundColor: '#fff', borderRadius: 10 },
  feedItem: {
    flexDirection: 'row', gap: 10, padding: 12, alignItems: 'center',
    borderBottomWidth: 0.5, borderBottomColor: colors.ink50,
  },
  feedIco: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  feedTitle: { fontSize: 13, fontWeight: '500', color: colors.ink900 },
  feedSub: { fontSize: 10, color: colors.ink400, fontFamily: fontMono, marginTop: 2 },
});
