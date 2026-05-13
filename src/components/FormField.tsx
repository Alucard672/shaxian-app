import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, Pressable } from 'react-native';
import { colors, fontMono } from '@/theme';

interface Props extends TextInputProps {
  label: string;
  required?: boolean;
  hint?: string;
  mono?: boolean;
}

export function FormField({ label, required, hint, mono, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, mono && { fontFamily: fontMono }, style]}
        placeholderTextColor={colors.ink300}
        {...rest}
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

interface SegmentProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

export function FormSegment({ label, value, options, onChange }: SegmentProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.seg}>
        {options.map(opt => {
          const active = opt === value;
          return (
            <Pressable key={opt} onPress={() => onChange(opt)}
              style={[styles.segItem, active && styles.segItemActive]}>
              <Text style={[styles.segText, active && styles.segTextActive]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface SwitchProps {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function FormSwitch({ label, hint, value, onChange }: SwitchProps) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.switchLabel}>{label}</Text>
        {hint && <Text style={styles.switchHint}>{hint}</Text>}
      </View>
      <View style={[styles.switchTrack, value && styles.switchTrackOn]}>
        <View style={[styles.switchKnob, value && styles.switchKnobOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 11, color: colors.ink500, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '500', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.ink200, borderRadius: 6,
    paddingHorizontal: 12, height: 42, fontSize: 14, color: colors.ink900,
    backgroundColor: '#fff',
  },
  hint: { fontSize: 11, color: colors.ink400, marginTop: 4 },
  seg: { flexDirection: 'row', backgroundColor: colors.ink50, borderRadius: 6, padding: 3 },
  segItem: { flex: 1, paddingVertical: 7, borderRadius: 4, alignItems: 'center' },
  segItemActive: { backgroundColor: '#fff' },
  segText: { fontSize: 13, color: colors.ink500 },
  segTextActive: { color: colors.ink900, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, gap: 14,
    borderBottomWidth: 0.5, borderBottomColor: colors.ink50,
  },
  switchLabel: { fontSize: 14, color: colors.ink900, fontWeight: '500' },
  switchHint: { fontSize: 11, color: colors.ink500, marginTop: 2 },
  switchTrack: {
    width: 46, height: 28, borderRadius: 14,
    backgroundColor: colors.ink100,
    justifyContent: 'center', padding: 2,
  },
  switchTrackOn: { backgroundColor: colors.brand500 },
  switchKnob: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  switchKnobOn: { alignSelf: 'flex-end' },
});
