import React from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet,
  TextInput, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontMono } from '@/theme';

interface SheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  height?: '50%' | '70%' | '90%';
}

export function Sheet({ visible, title, onClose, children, height = '70%' }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { height: height === '50%' ? '50%' : height === '70%' ? '70%' : '90%' }]}>
          <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Text style={styles.closeText}>关闭</Text>
              </Pressable>
            </View>
            {children}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

interface ListPickerProps<T> {
  visible: boolean;
  title: string;
  items: T[];
  loading?: boolean;
  keyExtractor: (it: T) => string;
  renderRow: (it: T) => React.ReactNode;
  searchBy?: (it: T) => string;
  placeholder?: string;
  onSelect: (it: T) => void;
  onClose: () => void;
}

export function ListPicker<T>({
  visible, title, items, loading, keyExtractor, renderRow, searchBy, placeholder, onSelect, onClose,
}: ListPickerProps<T>) {
  const [kw, setKw] = React.useState('');
  const filtered = React.useMemo(() => {
    if (!searchBy || !kw) return items;
    const q = kw.toLowerCase();
    return items.filter(it => searchBy(it).toLowerCase().includes(q));
  }, [items, kw, searchBy]);

  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      {searchBy && (
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            placeholder={placeholder ?? '搜索'}
            placeholderTextColor={colors.ink300}
            value={kw}
            onChangeText={setKw}
          />
        </View>
      )}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.brand700} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: 12 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.ink400, marginTop: 40 }}>暂无数据</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => { onSelect(item); onClose(); }}>
              {renderRow(item)}
            </Pressable>
          )}
        />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  handle: { width: 36, height: 4, backgroundColor: colors.ink200, borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 6 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: colors.ink100,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.ink900 },
  closeText: { fontSize: 14, color: colors.brand700 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10 },
  search: {
    backgroundColor: colors.ink50, borderRadius: 8,
    paddingHorizontal: 12, height: 38, fontSize: 14, color: colors.ink900,
  },
  row: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: colors.ink50,
  },
});
