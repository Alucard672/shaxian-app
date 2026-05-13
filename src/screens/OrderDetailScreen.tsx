import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Pressable, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { NavBar } from '@/components/NavBar';
import { Badge, Tone } from '@/components/Badge';
import { getSalesOrder, cancelSalesOrder, SalesOrder } from '@/api/sales';
import { useAuth } from '@/store/useAuth';

function statusTone(status: string): Tone {
  if (status === '待审核' || status === 'PENDING') return 'warn';
  if (status === '已完成' || status === '已审核' || status === 'SHIPPED' || status === 'APPROVED') return 'ok';
  if (status === '已作废' || status === 'CANCELLED') return 'muted';
  return 'info';
}

const STATUS_ZH: Record<string, string> = {
  DRAFT: '草稿', PENDING: '待审核', APPROVED: '已审核', SHIPPED: '已出库', CANCELLED: '已作废',
};

function fmt(n: number | undefined | null): string {
  if (n == null) return '-';
  return `¥${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OrderDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id as number;
  const session = useAuth(s => s.session);

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!session || !id) return;
    try {
      const data = await getSalesOrder(session.sessionId, session.tenantId, id);
      setOrder(data);
    } catch (e: any) {
      Alert.alert('加载失败', e?.message ?? '请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, id]);

  useEffect(() => { load(); }, [load]);

  const onCancel = () => {
    if (!order || !session) return;
    if ((order.paidAmount ?? 0) > 0) {
      Alert.alert('无法作废', '该订单已收过款，请先冲销收款再作废');
      return;
    }
    Alert.alert(
      '确认作废',
      `订单号：${order.orderNumber}\n金额：${fmt(order.totalAmount)}\n\n作废后会还库存 + 冲销关联未收款应收。此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认作废',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelSalesOrder(session.sessionId, session.tenantId, id);
              Alert.alert('已作废', '订单已作废，库存已还回，关联应收已冲销');
              await load();
            } catch (e: any) {
              Alert.alert('作废失败', e?.message ?? '请稍后重试');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <NavBar title="销售单详情" back onBack={() => nav.goBack()} />
        <View style={styles.center}><ActivityIndicator color={colors.brand400} /></View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <NavBar title="销售单详情" back onBack={() => nav.goBack()} />
        <View style={styles.center}><Text style={{ color: colors.ink500 }}>订单不存在</Text></View>
      </View>
    );
  }

  const statusZh = STATUS_ZH[order.status] || order.status;
  const isCancelled = order.status === '已作废' || order.status === 'CANCELLED';
  const canCancel = !isCancelled && (order.paidAmount ?? 0) === 0;

  return (
    <View style={styles.container}>
      <NavBar title="销售单详情" back onBack={() => nav.goBack()} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>

        {/* 头部信息 */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.orderNo}>{order.orderNumber}</Text>
            <View style={{ flex: 1 }} />
            <Badge tone={statusTone(order.status)}>{statusZh}</Badge>
          </View>
          <View style={styles.row}><Text style={styles.label}>客户</Text><Text style={styles.value}>{order.customerName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>销售日期</Text><Text style={styles.value}>{order.salesDate}</Text></View>
          <View style={styles.row}><Text style={styles.label}>操作人</Text><Text style={styles.value}>{order.operator || '-'}</Text></View>
          {order.remark ? (
            <View style={styles.row}><Text style={styles.label}>备注</Text><Text style={styles.value}>{order.remark}</Text></View>
          ) : null}
        </View>

        {/* 金额 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>金额</Text>
          <View style={styles.row}><Text style={styles.label}>总金额</Text><Text style={[styles.value, styles.money]}>{fmt(order.totalAmount)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>已收款</Text><Text style={[styles.value, { color: colors.ok }]}>{fmt(order.paidAmount)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>未收</Text><Text style={[styles.value, { color: colors.danger }]}>{fmt(order.unpaidAmount)}</Text></View>
        </View>

        {/* 商品明细 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>商品明细（{order.items?.length || 0}）</Text>
          {(order.items || []).map((item, idx) => (
            <View key={item.id ?? idx} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.productName} {item.colorName ? `· ${item.colorName}` : ''}</Text>
                <Text style={styles.itemSub}>
                  {item.batchCode ? `${item.batchCode} · ` : ''}{item.quantity} {item.unit || ''} × {fmt(item.price)}
                </Text>
              </View>
              <Text style={styles.itemAmount}>{fmt(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* 操作按钮 */}
        {canCancel && (
          <Pressable
            onPress={onCancel}
            disabled={cancelling}
            style={({ pressed }) => [
              styles.btnDanger,
              pressed && { opacity: 0.85 },
              cancelling && { opacity: 0.5 },
            ]}>
            {cancelling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>作废订单</Text>
            )}
          </Pressable>
        )}

        {!canCancel && !isCancelled && (
          <Text style={styles.hint}>已收过款的订单，需要先冲销收款才能作废</Text>
        )}

        {isCancelled && (
          <Text style={styles.hint}>订单已作废</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.ink900,
    shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  orderNo: { fontSize: 16, fontWeight: '600', color: colors.ink900, fontFamily: fontMono },
  sectionTitle: { fontSize: 13, color: colors.ink500, marginBottom: 12, fontWeight: '600' },

  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ink100,
  },
  label: { width: 80, fontSize: 13, color: colors.ink500 },
  value: { flex: 1, fontSize: 14, color: colors.ink900 },
  money: { fontFamily: fontMono, fontWeight: '600' },

  itemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ink100,
  },
  itemName: { fontSize: 14, color: colors.ink900, fontWeight: '500' },
  itemSub: { fontSize: 12, color: colors.ink500, marginTop: 4, fontFamily: fontMono },
  itemAmount: { fontSize: 14, color: colors.ink900, fontFamily: fontMono, fontWeight: '600' },

  btnDanger: {
    marginTop: 8,
    height: 48,
    backgroundColor: colors.danger,
    borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 1 },

  hint: { fontSize: 12, color: colors.ink500, textAlign: 'center', marginTop: 12 },
});
