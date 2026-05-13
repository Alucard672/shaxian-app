import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { useAuth } from '@/store/useAuth';

function maskPhone(p?: string) {
  return p ? `${p.slice(0, 3)}****${p.slice(-4)}` : '';
}
function pickName(session: any) {
  if (session?.username) return session.username;
  if (session?.tenantName && !/^\d+$/.test(session.tenantName)) return session.tenantName;
  if (session?.phone) return maskPhone(session.phone);
  return '未命名用户';
}

export function ProfileScreen() {
  const nav = useNavigation<any>();
  const session = useAuth(s => s.session);
  const doLogout = useAuth(s => s.logout);
  const displayName = pickName(session);

  const menuGroups: { l: string; r?: string; nav?: string; params?: any }[][] = [
    [
      { l: '采购单', nav: 'Purchases' },
      { l: '销售报表', nav: 'Report' },
    ],
    [
      { l: '客户管理', nav: 'Customers' },
      { l: '供应商管理', nav: 'Suppliers' },
      { l: '新增客户', nav: 'CustomerForm' },
      { l: '新增供应商', nav: 'SupplierForm' },
    ],
    [
      { l: '员工管理', nav: 'Employees' },
      { l: '打印模板' },
      { l: '库存预警' },
    ],
    [
      { l: '系统设置', nav: 'Settings' },
      { l: '环境切换', nav: 'EnvPicker' },
      { l: '关于纱线通', r: 'v2.4.1' },
    ],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {displayName}
              {session?.role ? ` · ${session.role}` : ''}
            </Text>
            <Text style={styles.phone}>{session?.phone ?? ''}</Text>
            <Text style={styles.tenant}>
              {session?.tenantName ?? ''}
              {session?.tenantCode ? ` · ${session.tenantCode}` : ''}
            </Text>
          </View>
        </View>

        {menuGroups.map((grp, gi) => (
          <View key={gi} style={styles.group}>
            {grp.map((item, i) => (
              <Pressable key={item.l}
                onPress={() => {
                  if (item.nav) nav.navigate(item.nav);
                  else Alert.alert(item.l, '功能开发中');
                }}
                style={[styles.row, i < grp.length - 1 && styles.rowBorder]}>
                <Text style={styles.rowLabel}>{item.l}</Text>
                <View style={{ flex: 1 }} />
                {item.r && <Text style={styles.rowRight}>{item.r}</Text>}
                <Text style={styles.chev}>›</Text>
              </Pressable>
            ))}
          </View>
        ))}

        <Pressable
          onPress={() => {
            Alert.alert('退出登录', '确定要退出当前账号吗？', [
              { text: '取消', style: 'cancel' },
              { text: '退出', style: 'destructive', onPress: doLogout },
            ]);
          }}
          style={styles.logoutBtn}>
          <Text style={styles.logoutText}>退出登录</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', margin: 14, padding: 16, borderRadius: 12,
  },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: colors.brand700, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  name: { fontSize: 17, fontWeight: '600', color: colors.ink900 },
  phone: { fontSize: 12, color: colors.ink500, fontFamily: fontMono, marginTop: 2 },
  tenant: { fontSize: 11, color: colors.ink400, marginTop: 4 },
  group: { backgroundColor: '#fff', marginHorizontal: 14, marginTop: 12, borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.ink50 },
  rowLabel: { fontSize: 14, color: colors.ink900 },
  rowRight: { fontSize: 12, color: colors.ink400, marginRight: 8 },
  chev: { fontSize: 16, color: colors.ink300 },
  logoutBtn: {
    marginHorizontal: 14, marginTop: 24, height: 48,
    backgroundColor: '#fff', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '500' },
});
