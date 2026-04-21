import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontMono } from '@/theme';
import { login } from '@/api/auth';
import { useAuth } from '@/store/useAuth';

export function LoginScreen() {
  const setSession = useAuth(s => s.setSession);
  const [phone, setPhone] = useState('13800138000');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!phone || !password) {
      Alert.alert('提示', '请输入手机号和密码');
      return;
    }
    setLoading(true);
    try {
      const session = await login(phone.replace(/\s/g, ''), password);
      await setSession(session);
    } catch (e: any) {
      Alert.alert('登录失败', e.message ?? '请稍后重试');
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
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>纱</Text>
            </View>
            <View>
              <Text style={styles.brandName}>纱线通</Text>
              <Text style={styles.brandSub}>YARN ERP · v2.4</Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statusDot}>● ONLINE</Text>
              <Text style={styles.statusSub}>萧山仓 · 18ms</Text>
            </View>
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
          <Text style={styles.cardTitle}>欢迎使用纱线通</Text>
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
            <Text style={styles.footerText}>© 2025 纱线通</Text>
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
  statusDot: { color: colors.ok, fontSize: 10, fontFamily: fontMono, letterSpacing: 1 },
  statusSub: { color: colors.ink500, fontSize: 10, fontFamily: fontMono, marginTop: 2 },
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
