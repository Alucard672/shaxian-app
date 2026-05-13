import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { NavBar } from '@/components/NavBar';
import { Icon } from '@/components/Icon';
import {
  ENVS, EnvKey, getCurrentEnv, switchEnv, subscribeEnv,
} from '@/config/env';

export function EnvPickerScreen() {
  const nav = useNavigation<any>();
  const [current, setCurrent] = useState(getCurrentEnv());

  useEffect(() => {
    return subscribeEnv(() => setCurrent(getCurrentEnv()));
  }, []);

  const pick = async (k: EnvKey) => {
    await switchEnv(k);
    Alert.alert('已切换环境', `${ENVS[k].label} · ${ENVS[k].apiBase}`, [
      { text: '好' },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title="环境切换" sub="切换后需要重新登录" back onBack={() => nav.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        <View style={styles.currentCard}>
          <Text style={styles.currentLabel}>当前 API BASE</Text>
          <Text style={styles.currentValue}>{current.apiBase}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{current.label}</Text>
          </View>
        </View>

        <Text style={styles.groupTitle}>选择环境</Text>
        {(Object.keys(ENVS) as EnvKey[]).map(k => {
          const env = ENVS[k];
          const active = current.key === k;
          return (
            <Pressable key={k} onPress={() => pick(k)} style={[styles.envRow, active && styles.envRowActive]}>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.envLabel}>{env.label}</Text>
                  <Text style={styles.envKey}>· {env.key.toUpperCase()}</Text>
                </View>
                <Text style={styles.envUrl}>{env.apiBase}</Text>
                {env.note && <Text style={styles.envNote}>{env.note}</Text>}
              </View>
              {active && <Icon name="chevR" size={10} color={colors.brand700} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  currentCard: {
    backgroundColor: colors.ink900, borderRadius: 10, padding: 16,
    marginBottom: 16,
  },
  currentLabel: { color: colors.ink300, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  currentValue: { color: '#fff', fontSize: 15, fontWeight: '600', fontFamily: fontMono, marginTop: 6 },
  tag: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(84,160,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 8,
  },
  tagText: { color: colors.brand400, fontSize: 11, fontWeight: '600' },

  groupTitle: {
    fontSize: 11, color: colors.ink500, textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 8, marginTop: 4,
  },
  envRow: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 8, borderWidth: 1, borderColor: 'transparent',
  },
  envRowActive: { borderColor: colors.brand500 },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: colors.ink200,
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: colors.brand500 },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand500 },
  envLabel: { fontSize: 15, fontWeight: '600', color: colors.ink900 },
  envKey: { fontSize: 11, color: colors.ink400, fontFamily: fontMono, marginLeft: 4 },
  envUrl: { fontSize: 12, color: colors.ink500, fontFamily: fontMono, marginTop: 2 },
  envNote: { fontSize: 11, color: colors.ink400, marginTop: 2 },
});
