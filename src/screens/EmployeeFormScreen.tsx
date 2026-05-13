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
  createEmployee, updateEmployee, deleteEmployee, type Employee,
} from '@/api/employee';

const POSITION_OPTIONS = ['老板', '销售', '仓管', '司机', '会计', '其他'];
const STATUS_OPTIONS = ['active', 'inactive'] as const;
const STATUS_LABEL: Record<string, string> = { active: '在职', inactive: '停用' };

export function EmployeeFormScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const session = useAuth(s => s.session);
  const existing: Employee | undefined = route.params?.employee;
  const isEdit = !!existing?.id;

  const [name, setName] = useState(existing?.name ?? '');
  const [position, setPosition] = useState(existing?.position ?? '销售');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [role, setRole] = useState(existing?.role ?? '');
  const [status, setStatus] = useState<'active' | 'inactive'>(
    (existing?.status as any) ?? 'active'
  );
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!session) return;
    if (!name.trim()) { Alert.alert('提示', '请填写姓名'); return; }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        position: position.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        role: role.trim() || undefined,
        status,
      };
      if (isEdit) {
        await updateEmployee(session.sessionId, session.tenantId, existing!.id, body);
      } else {
        await createEmployee(session.sessionId, session.tenantId, body);
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
    Alert.alert('删除员工', `确定删除「${existing!.name}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          try {
            await deleteEmployee(session.sessionId, session.tenantId, existing!.id);
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
      <NavBar title={isEdit ? '编辑员工' : '新增员工'} back onBack={() => nav.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 140 }}>
          <View style={styles.card}>
            <FormField label="姓名" required value={name} onChangeText={setName}
              placeholder="如：王小明" />
            <FormField label="联系电话" value={phone} onChangeText={setPhone}
              keyboardType="phone-pad" placeholder="11 位手机号" mono maxLength={20} />
            <FormField label="邮箱" value={email} onChangeText={setEmail}
              keyboardType="email-address" placeholder="选填" autoCapitalize="none" />
          </View>

          <View style={[styles.card, { marginTop: 10 }]}>
            <FormSegment label="职位" value={position} options={POSITION_OPTIONS} onChange={setPosition} />
            <FormField label="角色/权限组" value={role} onChangeText={setRole}
              placeholder="如：超级管理员 / 销售员" />
            <FormSegment
              label="状态"
              value={status}
              options={STATUS_OPTIONS as any}
              onChange={(v) => setStatus(v as any)} />
            <Text style={styles.hint}>
              当前：{STATUS_LABEL[status]}
            </Text>
          </View>

          {isEdit && (
            <Pressable onPress={onDelete} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>删除该员工</Text>
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
  hint: { fontSize: 11, color: colors.ink400, marginTop: -8 },
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
