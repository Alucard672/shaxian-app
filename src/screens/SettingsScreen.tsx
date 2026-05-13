import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { NavBar } from '@/components/NavBar';
import { FormField, FormSwitch } from '@/components/FormField';
import { useAuth } from '@/store/useAuth';
import {
  getSystemParams, updateSystemParams, getStoreInfo, updateStoreInfo,
  type SystemParams, type StoreInfo,
} from '@/api/settings';

export function SettingsScreen() {
  const nav = useNavigation<any>();
  const session = useAuth(s => s.session);
  const [params, setParams] = useState<SystemParams>({});
  const [store, setStore] = useState<StoreInfo>({});
  const [loading, setLoading] = useState(true);
  const [savingParams, setSavingParams] = useState(false);
  const [savingStore, setSavingStore] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        getSystemParams(session.sessionId, session.tenantId),
        getStoreInfo(session.sessionId, session.tenantId),
      ]);
      setParams(p || {});
      setStore(s || {});
    } catch (e: any) {
      Alert.alert('加载失败', e.message ?? '请重试');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const saveParams = async (next: SystemParams) => {
    if (!session) return;
    setParams(next);  // optimistic
    setSavingParams(true);
    try {
      await updateSystemParams(session.sessionId, session.tenantId, next);
    } catch (e: any) {
      Alert.alert('保存失败', e.message ?? '已回滚');
      load();
    } finally {
      setSavingParams(false);
    }
  };

  const saveStore = async () => {
    if (!session) return;
    setSavingStore(true);
    try {
      await updateStoreInfo(session.sessionId, session.tenantId, store);
      Alert.alert('已保存', '店铺信息已更新');
    } catch (e: any) {
      Alert.alert('保存失败', e.message ?? '请重试');
    } finally {
      setSavingStore(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
        <NavBar title="系统设置" back onBack={() => nav.goBack()} />
        <View style={styles.center}><ActivityIndicator color={colors.brand700} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title="系统设置" sub={savingParams ? '保存中…' : undefined}
        back onBack={() => nav.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
          {/* 系统参数 */}
          <Text style={styles.groupTitle}>系统参数</Text>
          <View style={styles.card}>
            <FormSwitch
              label="启用染色加工流程"
              hint="开启后销售/采购单支持染色订单"
              value={!!params.enableDyeingProcess}
              onChange={v => saveParams({ ...params, enableDyeingProcess: v })} />
            <FormSwitch
              label="允许负库存出库"
              hint="开启后库存不足时仍可销售"
              value={!!params.allowNegativeStock}
              onChange={v => saveParams({ ...params, allowNegativeStock: v })} />
            <FormSwitch
              label="启用双单位（件数+单重）"
              hint="按件数×单重自动换算总重量"
              value={!!params.enableDualUnit}
              onChange={v => saveParams({ ...params, enableDualUnit: v })} />
            <FormSwitch
              label="启用缸号管理"
              hint="关闭则所有批次合并为「默认」"
              value={!!params.enableBatch}
              onChange={v => saveParams({ ...params, enableBatch: v })} />
            <FormSwitch
              label="启用库位管理"
              hint="按 A-01-03 等库位编码管理商品"
              value={!!params.enableLocation}
              onChange={v => saveParams({ ...params, enableLocation: v })} />
          </View>

          {/* 店铺信息 */}
          <Text style={styles.groupTitle}>店铺信息</Text>
          <View style={styles.card}>
            <FormField label="店铺名称" value={store.name ?? ''}
              onChangeText={v => setStore({ ...store, name: v })}
              placeholder="如：杭州纱线销售大王" />
            <FormField label="店铺编码" value={store.code ?? ''}
              onChangeText={v => setStore({ ...store, code: v })}
              mono placeholder="门店内部编号" />
            <FormField label="店铺地址" value={store.address ?? ''}
              onChangeText={v => setStore({ ...store, address: v })}
              placeholder="用于打印单据抬头" multiline />
            <FormField label="联系电话" value={store.phone ?? ''}
              onChangeText={v => setStore({ ...store, phone: v })}
              keyboardType="phone-pad" mono />
            <FormField label="邮箱" value={store.email ?? ''}
              onChangeText={v => setStore({ ...store, email: v })}
              keyboardType="email-address" autoCapitalize="none" />
            <FormField label="备注" value={store.remark ?? ''}
              onChangeText={v => setStore({ ...store, remark: v })}
              multiline />
          </View>

          <Pressable onPress={saveStore} disabled={savingStore}
            style={[styles.saveBtn, savingStore && { opacity: 0.6 }]}>
            {savingStore ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>保存店铺信息</Text>}
          </Pressable>

          {/* 租户 / 会话信息 */}
          <Text style={styles.groupTitle}>当前会话</Text>
          <View style={styles.card}>
            <InfoRow label="租户名" value={session?.tenantName || '—'} />
            <InfoRow label="租户编码" value={session?.tenantCode || '—'} mono />
            <InfoRow label="租户 ID" value={String(session?.tenantId ?? '—')} mono />
            <InfoRow label="会话 ID"
              value={session?.sessionId ? `${session.sessionId.slice(0, 8)}…` : '—'} mono />
            <InfoRow label="参数更新时间"
              value={params.updatedAt ? new Date(params.updatedAt).toLocaleString('zh-CN') : '—'} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && { fontFamily: fontMono, fontSize: 12 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  groupTitle: {
    fontSize: 11, color: colors.ink500, textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 8, marginTop: 12,
  },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14 },
  saveBtn: {
    height: 44, marginTop: 14,
    backgroundColor: colors.brand700, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  infoRow: {
    flexDirection: 'row', paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: colors.ink50,
    alignItems: 'center',
  },
  infoLabel: { fontSize: 13, color: colors.ink500, width: 110 },
  infoValue: { flex: 1, fontSize: 13, color: colors.ink900, textAlign: 'right' },
});
