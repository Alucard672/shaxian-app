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
import { Icon, IconName } from '@/components/Icon';
import { useAuth } from '@/store/useAuth';
import { useBadges } from '@/store/useBadges';
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

  const setBadges = useBadges(s => s.setBadges);

  const load = useCallback(async (silent = false) => {
    if (!session) return;
    if (!silent) setLoading(true);
    try {
      const s = await loadDashboardSummary(session.sessionId, session.tenantId);
      setSum(s);
      setBadges({ orders: s.pendingApprovalCount, stock: s.lowStockCount });
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, setBadges]);

  useEffect(() => { load(); }, [load]);

  // Greeting — time-aware + name priority: username > tenantName > phone-masked
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 6 ? '凌晨好' :
    hour < 9 ? '早上好' :
    hour < 12 ? '上午好' :
    hour < 14 ? '中午好' :
    hour < 18 ? '下午好' :
    hour < 22 ? '晚上好' : '夜深了';

  const maskPhone = (p?: string) => p ? `${p.slice(0, 3)}****${p.slice(-4)}` : '';
  const displayName = (() => {
    if (session?.username) return session.username;
    if (session?.tenantName && !/^\d+$/.test(session.tenantName)) return session.tenantName;
    if (session?.phone) return maskPhone(session.phone);
    return '老板';
  })();

  const tenantMeta = session?.tenantName && !/^\d+$/.test(session.tenantName)
    ? session.tenantName
    : maskPhone(session?.phone) || '';
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
  const todayMeta = `${tenantMeta} · ${now.toLocaleDateString('zh-CN')} ${weekday}`;

  const quickRow1: { k: string; l: string; icon: IconName; c: string }[] = [
    { k: 'NewOrder', l: '开销售单', icon: 'order', c: colors.brand500 },
    { k: 'NewPurchase', l: '开采购单', icon: 'purchase', c: colors.ok },
    { k: 'Stock', l: '库存查询', icon: 'stock', c: colors.warn },
    { k: 'Customers', l: '客户对账', icon: 'cust', c: colors.info },
  ];
  const quickRow2: { k: string; l: string; icon: IconName; c: string }[] = [
    { k: 'Pay', l: '收付款', icon: 'pay', c: colors.brand700 },
    { k: 'Scan', l: '扫码入库', icon: 'scan', c: colors.ink600 },
    { k: 'Print', l: '打印', icon: 'print', c: colors.ink500 },
    { k: 'More', l: '更多', icon: 'chev', c: colors.ink500 },
  ];

  // Today's hourly shipping — aggregated server-side via loadDashboardSummary
  const hourly = sum?.hourlyKg ?? new Array(24).fill(0);
  const maxH = Math.max(...hourly, 1);
  const todayShippedKg = sum?.todayKg ?? 0;
  const currentHour = new Date().getHours();
  // Highlight the most-recent hour that has data; fall back to current hour.
  const lastNonZero = hourly.map((v, i) => v > 0 ? i : -1).filter(i => i >= 0).pop();
  const hourActive = lastNonZero ?? currentHour;
  const hasData = todayShippedKg > 0;

  const todoCount = (sum?.pendingApprovalCount ?? 0) + (sum?.lowStockCount ?? 0) + (sum?.overdueCount ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <LinearGradient colors={[colors.ink900, colors.ink800]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerMeta}>{todayMeta}</Text>
              <Text style={styles.headerTitle}>{greeting}，{displayName}</Text>
            </View>
            <Pressable style={styles.bell}>
              <Icon name="bell" size={16} color="#fff" strokeWidth={1.8} />
              {todoCount > 0 && <View style={styles.bellDot} />}
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, marginTop: -20 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}>

        {loading && !sum ? (
          <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={colors.brand700} /></View>
        ) : (
          <>
            {/* KPI 2×2 */}
            <View style={[styles.row, { paddingHorizontal: 14 }]}>
              <KPI label="今日销售"
                value={formatMoney(sum?.todaySales ?? 0)}
                delta={{ dir: 'up', text: `${sum?.todayOrderCount ?? 0} 单` }} />
              <View style={{ width: 10 }} />
              <KPI label="本月销售"
                value={formatMoney(sum?.monthSales ?? 0)}
                delta={{ dir: 'up', text: `${sum?.monthOrderCount ?? 0} 单` }} />
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

            {/* Quick actions 4×2 */}
            <View style={styles.quickWrap}>
              <View style={styles.quickRow}>
                {quickRow1.map(a => (
                  <Pressable key={a.k} onPress={() => nav.navigate(a.k)} style={styles.quickItem}>
                    <View style={[styles.quickIcon, { backgroundColor: a.c + '1A' }]}>
                      <Icon name={a.icon} size={22} color={a.c} strokeWidth={1.6} />
                    </View>
                    <Text style={styles.quickLabel}>{a.l}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.quickRow}>
                {quickRow2.map(a => (
                  <Pressable key={a.k} style={styles.quickItem}>
                    <View style={[styles.quickIcon, { backgroundColor: a.c + '1A' }]}>
                      <Icon name={a.icon} size={22} color={a.c} strokeWidth={1.6} />
                    </View>
                    <Text style={styles.quickLabel}>{a.l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Today shipping chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHead}>
                <View>
                  <Text style={styles.cardTitle}>今日出货量</Text>
                  <Text style={styles.cardSub}>
                    {hasData ? `累计 ${todayShippedKg.toLocaleString()} kg · 实时` : '今日暂无出货'}
                  </Text>
                </View>
                <View style={{ flex: 1 }} />
                <Text style={styles.bigNum}>
                  {todayShippedKg.toLocaleString()}
                  <Text style={{ fontSize: 11, color: colors.ink400, fontWeight: '400' }}>  kg</Text>
                </Text>
              </View>

              {hasData ? (
                <>
                  <View style={styles.chart}>
                    {hourly.map((v, i) => {
                      const h = maxH > 0 ? (v / maxH) * 100 : 0;
                      const active = i === hourActive;
                      return (
                        <View key={i} style={styles.barCol}>
                          {active && v > 0 && (
                            <Text style={styles.barTip}>{Math.round(v)}kg</Text>
                          )}
                          <View style={{
                            width: '70%', height: `${h}%`, minHeight: v > 0 ? 2 : 0,
                            backgroundColor: active ? colors.brand700 : v > 0 ? colors.brand500 : 'transparent',
                            borderTopLeftRadius: 2, borderTopRightRadius: 2,
                          }} />
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.hourAxis}>
                    {['0时', '6时', '12时', '18时', '24时'].map(t => (
                      <Text key={t} style={styles.hourTick}>{t}</Text>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.emptyChart}>
                  <Text style={{ color: colors.ink400, fontSize: 12 }}>今日还没有销售单出货</Text>
                  <Pressable onPress={() => nav.navigate('NewOrder')} style={styles.emptyBtn}>
                    <Text style={{ color: colors.brand700, fontSize: 12, fontWeight: '500' }}>+ 开单</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* 待处理 */}
            <View style={{ marginHorizontal: 14, marginTop: 14 }}>
              <View style={styles.sectionTitle}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink900 }}>待处理事项</Text>
                {todoCount > 0 && (
                  <View style={styles.badgeN}>
                    <Text style={styles.badgeNText}>{todoCount}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => nav.navigate('Orders')}>
                  <Text style={styles.seeAll}>全部 →</Text>
                </Pressable>
              </View>
              <View style={styles.feedCard}>
                {(sum?.pendingApprovalCount ?? 0) > 0 && (
                  <FeedItem color={colors.danger} mark="D"
                    title={`${sum?.pendingApprovalCount} 张销售单待审核`}
                    sub="点击查看详情并审核"
                    onPress={() => nav.navigate('Orders')} />
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
                  <View style={styles.empty}>
                    <Text style={{ color: colors.ok, fontSize: 14 }}>✓</Text>
                    <Text style={{ color: colors.ink400, fontSize: 12, marginLeft: 6 }}>暂无待办事项</Text>
                  </View>
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
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', fontFamily: fontMono }}>{mark}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.feedTitle}>{title}</Text>
        <Text style={styles.feedSub}>{sub}</Text>
      </View>
      <Icon name="chevR" size={10} color={colors.ink300} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 36 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  headerMeta: { color: colors.ink300, fontSize: 11, fontFamily: fontMono, letterSpacing: 0.4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '600', marginTop: 2 },
  bell: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  bellDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, position: 'absolute', top: 8, right: 8 },
  row: { flexDirection: 'row' },

  quickWrap: {
    marginHorizontal: 14, marginTop: 14,
    backgroundColor: '#fff', borderRadius: 10, paddingVertical: 8,
  },
  quickRow: { flexDirection: 'row' },
  quickItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  quickIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  quickLabel: { fontSize: 12, color: colors.ink700, marginTop: 8 },

  chartCard: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 16, marginHorizontal: 14, marginTop: 14,
  },
  chartHead: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '600', color: colors.ink900 },
  cardSub: { fontSize: 11, color: colors.ink400, fontFamily: fontMono, marginTop: 2 },
  bigNum: { fontSize: 20, fontWeight: '700', color: colors.brand700, fontFamily: fontMono, letterSpacing: -0.3 },

  chart: { height: 110, flexDirection: 'row', alignItems: 'flex-end', marginTop: 18 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barTip: {
    position: 'absolute', top: -16,
    fontSize: 10, fontWeight: '600', color: colors.ink900, fontFamily: fontMono,
    width: 48, textAlign: 'center', left: -12,
  },
  hourAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 },
  hourTick: { fontSize: 10, color: colors.ink400, fontFamily: fontMono },

  sectionTitle: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8 },
  badgeN: { backgroundColor: colors.dangerBg, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 10, marginLeft: 6 },
  badgeNText: { color: colors.danger, fontSize: 10, fontWeight: '700', fontFamily: fontMono },
  seeAll: { fontSize: 12, color: colors.brand700 },

  feedCard: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  feedItem: {
    flexDirection: 'row', gap: 10, padding: 14, alignItems: 'center',
    borderBottomWidth: 0.5, borderBottomColor: colors.ink50,
  },
  feedIco: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  feedTitle: { fontSize: 13, fontWeight: '500', color: colors.ink900 },
  feedSub: { fontSize: 11, color: colors.ink400, fontFamily: fontMono, marginTop: 2 },

  empty: { padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  emptyChart: {
    height: 120, justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  emptyBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.brand500, borderRadius: 4,
  },
});
