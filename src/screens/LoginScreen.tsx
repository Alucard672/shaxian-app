import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { login } from '@/api/auth';
import { useAuth } from '@/store/useAuth';
import { getCurrentEnv, subscribeEnv } from '@/config/env';

export function LoginScreen() {
  const nav = useNavigation<any>();
  const setSession = useAuth(s => s.setSession);
  const logoutReason = useAuth(s => s.logoutReason);
  const clearLogoutReason = useAuth(s => s.clearLogoutReason);
  const [phone, setPhone] = useState(__DEV__ ? '13800138000' : '');
  const [password, setPassword] = useState(__DEV__ ? '123456' : '');
  const [loading, setLoading] = useState(false);
  const [env, setEnv] = useState(getCurrentEnv());
  React.useEffect(() => subscribeEnv(() => setEnv(getCurrentEnv())), []);

  // 若是从其它页面被强制登出（顶号 / 到期 / 停用），进入时弹一次提示
  React.useEffect(() => {
    if (logoutReason) {
      Alert.alert('请重新登录', logoutReason);
      clearLogoutReason();
    }
  }, [logoutReason, clearLogoutReason]);

  const onLogin = async () => {
    if (!phone || !password) {
      Alert.alert('提示', '请输入手机号和密码');
      return;
    }
    setLoading(true);
    try {
      const session = await login(phone.replace(/\s/g, ''), password);
      // 移动端只面向租户用户；超管账号请用浏览器进管理后台
      if (session.superAdmin) {
        Alert.alert('无法登录', '该账号是平台超级管理员，请使用浏览器访问管理后台');
        return;
      }
      await setSession(session);
    } catch (e: any) {
      const msg = e?.message ?? '请稍后重试';
      // 区分租户停用 / 到期 / 顶号 / 普通失败
      if (msg.includes('租户已停用')) {
        Alert.alert('租户已停用', '请联系平台运营');
      } else if (msg.includes('租户已到期')) {
        Alert.alert('租户已到期', '请联系平台运营续费');
      } else if (msg.includes('用户不存在')) {
        Alert.alert('该手机号未注册', '请联系平台运营开通账号');
      } else {
        Alert.alert('登录失败', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Top brand header */}
      <LinearGradient
        colors={[colors.ink900, colors.ink800]}
        style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.brand}>
            <Pressable
              style={styles.logoBox}
              onLongPress={() => nav.navigate('EnvPicker')}
              delayLongPress={700}>
              <Text style={styles.logoText}>织</Text>
            </Pressable>
            <View>
              <Text style={styles.brandName}>织云 ERP</Text>
              <Text style={styles.brandSub}>ZHIYUN · v2.4</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Pressable style={{ alignItems: 'flex-end' }} onPress={() => nav.navigate('EnvPicker')}>
              <View style={styles.envPill}>
                <View style={styles.envDot} />
                <Text style={styles.envText}>{env.label}环境</Text>
              </View>
              <Text style={styles.statusSub} numberOfLines={1}>
                {env.apiBase.replace(/^https?:\/\//, '')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.tagline}>
            <Text style={styles.taglineMark}>── SINCE 2018</Text>
            <Text style={styles.taglineHead}>一支纱，一本账</Text>
            <Text style={[styles.taglineHead, { color: colors.brand400 }]}>从仓位到回款</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.formWrap}>
        <View style={styles.card}>
          <Text style={styles.tag}>SIGN IN · 账户登录</Text>
          <Text style={styles.cardTitle}>欢迎使用织云 ERP</Text>
          <Text style={styles.cardSub}>请输入手机号和密码登录系统</Text>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.fieldLabel}>手机号</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.prefix}>+86</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="number-pad"
                style={styles.input}
                placeholder="请输入手机号"
                placeholderTextColor={colors.ink300}
                maxLength={11}
              />
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.fieldLabel}>密码</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.linkText}>忘记密码？</Text>
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={[styles.input, { paddingLeft: 14, letterSpacing: 4 }]}
                placeholder="请输入密码"
                placeholderTextColor={colors.ink300}
              />
            </View>
          </View>

          <Pressable
            onPress={onLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.6 },
            ]}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>登 录 进 入 系 统</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 织云 ERP</Text>
            <Text style={styles.footerText}>·</Text>
            <Text style={styles.footerText}>400-888-6688</Text>
            <Text style={styles.footerText}>·</Text>
            <Text style={[styles.footerText, { fontFamily: fontMono }]}>v2.4.1</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24, paddingBottom: 40,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  logoBox: {
    width: 40, height: 40, backgroundColor: colors.brand700, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  brandName: { color: '#fff', fontSize: 17, fontWeight: '600' },
  brandSub: { color: colors.ink400, fontSize: 10, fontFamily: fontMono, letterSpacing: 1, marginTop: 2 },
  envPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(84,160,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  envDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.brand400 },
  envText: { color: colors.brand400, fontSize: 10, fontWeight: '600', fontFamily: fontMono },
  statusSub: { color: colors.ink500, fontSize: 10, fontFamily: fontMono, marginTop: 3 },
  tagline: { marginTop: 30 },
  taglineMark: { color: colors.brand400, fontSize: 10, fontFamily: fontMono, letterSpacing: 2, marginBottom: 10 },
  taglineHead: { color: '#fff', fontSize: 26, fontWeight: '600', letterSpacing: -0.4, lineHeight: 32 },

  formWrap: { flex: 1, marginTop: -24 },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.ink900,
    shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tag: { fontSize: 10, color: colors.brand500, fontFamily: fontMono, letterSpacing: 2 },
  cardTitle: { fontSize: 22, fontWeight: '600', marginTop: 6, color: colors.ink900, letterSpacing: -0.3 },
  cardSub: { fontSize: 12, color: colors.ink500, marginTop: 4 },

  fieldLabel: { fontSize: 11, color: colors.ink500, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 6, height: 46,
    borderWidth: 1, borderColor: colors.ink200, borderRadius: 6,
    paddingHorizontal: 10,
  },
  prefix: {
    fontSize: 14, color: colors.ink500, paddingRight: 10,
    borderRightWidth: 1, borderColor: colors.ink100, fontFamily: fontMono,
  },
  input: { flex: 1, fontSize: 15, color: colors.ink900, paddingLeft: 10, fontFamily: fontMono },

  linkText: { fontSize: 12, color: colors.brand700 },

  btn: {
    marginTop: 22, height: 48,
    backgroundColor: colors.brand700, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.brand900, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 2 },

  footer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 18 },
  footerText: { fontSize: 10, color: colors.ink400 },
});
