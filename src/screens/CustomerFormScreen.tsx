import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '@/theme';
import { NavBar } from '@/components/NavBar';
import { FormField, FormSegment } from '@/components/FormField';
import { useAuth } from '@/store/useAuth';
import {
  createCustomer, updateCustomer, deleteCustomer, type Customer,
} from '@/api/customer';

const TYPE_OPTIONS = ['直客', '经销商', '其他'];
const STATUS_OPTIONS = ['正常', '停用'];

export function CustomerFormScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const session = useAuth(s => s.session);
  const existing: Customer | undefined = route.params?.customer;
  const isEdit = !!existing?.id;

  const [name, setName] = useState(existing?.name ?? '');
  const [contactPerson, setContactPerson] = useState(existing?.contactPerson ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [type, setType] = useState(existing?.type ?? '直客');
  const [status, setStatus] = useState(existing?.status ?? '正常');
  const [creditLimit, setCreditLimit] = useState(
    existing?.creditLimit != null ? String(existing.creditLimit) : ''
  );
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!session) return;
    if (!name.trim()) { Alert.alert('提示', '请填写客户名称'); return; }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        type,
        status,
        creditLimit: creditLimit ? Number(creditLimit) : undefined,
      };
      if (isEdit) {
        await updateCustomer(session.sessionId, session.tenantId, existing!.id, body);
      } else {
        await createCustomer(session.sessionId, session.tenantId, body);
      }
      Alert.alert('已保存', '', [{ text: '好', onPress: () => nav.goBack() }]);
    } catch (e: any) {
      Alert.alert('保存失败', e.message ?? '请重试');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!session || !isEdit) return;
    Alert.alert('删除客户', `确定删除「${existing!.name}」？该操作不可撤销。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomer(session.sessionId, session.tenantId, existing!.id);
            nav.goBack();
          } catch (e: any) {
            Alert.alert('删除失败', e.message ?? '请重试');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title={isEdit ? '编辑客户' : '新增客户'} back onBack={() => nav.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 140 }}>
          <View style={styles.card}>
            <FormField label="客户名称" required value={name} onChangeText={setName}
              placeholder="如：杭州新美纺织" />
            <FormField label="联系人" value={contactPerson} onChangeText={setContactPerson}
              placeholder="如：王老板" />
            <FormField label="联系电话" value={phone} onChangeText={setPhone}
              keyboardType="phone-pad" placeholder="11 位手机号" mono maxLength={20} />
            <FormField label="联系地址" value={address} onChangeText={setAddress}
              placeholder="街道/小区/门牌号" multiline />
          </View>

          <View style={[styles.card, { marginTop: 10 }]}>
            <FormSegment label="客户类型" value={type} options={TYPE_OPTIONS} onChange={setType} />
            <FormField label="信用额度 (元)" value={creditLimit} onChangeText={setCreditLimit}
              keyboardType="decimal-pad" mono placeholder="0" />
            <FormSegment label="状态" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          </View>

          {isEdit && (
            <Pressable onPress={onDelete} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>删除该客户</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.sticky}>
          <Pressable onPress={onSave} disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>保 存</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14 },
  deleteBtn: {
    marginTop: 16, padding: 14, backgroundColor: '#fff', borderRadius: 10,
    alignItems: 'center',
  },
  deleteText: { color: colors.danger, fontSize: 14, fontWeight: '500' },
  sticky: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: colors.ink100,
    padding: 14, paddingBottom: 24,
  },
  saveBtn: {
    height: 46, backgroundColor: colors.brand700, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 2 },
});
