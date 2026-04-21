import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fontMono } from '@/theme';
import { NavBar } from '@/components/NavBar';
import { ListPicker } from '@/components/Sheet';
import { useAuth } from '@/store/useAuth';
import { listSuppliers, type Supplier } from '@/api/supplier';
import { listProducts, listColors, type Product, type Color } from '@/api/product';
import { createPurchaseOrder } from '@/api/purchase';

interface LineItem {
  key: string;
  productId: number; productName: string; unit: string;
  colorId?: number; colorName?: string; colorValue?: string;
  batchCode: string;
  quantity: number; price: number;
  remark?: string;
}

export function NewPurchaseScreen() {
  const nav = useNavigation<any>();
  const session = useAuth(s => s.session);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [purchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paidAmount, setPaidAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  const [pickingSupplier, setPickingSupplier] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSup, setLoadingSup] = useState(false);

  const [editing, setEditing] = useState<Partial<LineItem> | null>(null);
  const [pickingProduct, setPickingProduct] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [pickingColor, setPickingColor] = useState(false);
  const [colors_, setColors_] = useState<Color[]>([]);

  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const paid = parseFloat(paidAmount) || 0;
  const unpaid = total - paid;

  const openSupplierPicker = async () => {
    if (!session) return;
    setPickingSupplier(true);
    setLoadingSup(true);
    try { setSuppliers(await listSuppliers(session.sessionId, session.tenantId)); }
    finally { setLoadingSup(false); }
  };

  const startAdd = async () => {
    if (!session) return;
    setEditing({ quantity: 0, price: 0, batchCode: '' });
    setPickingProduct(true);
    setProducts(await listProducts(session.sessionId, session.tenantId));
  };

  const onPickProduct = async (p: Product) => {
    if (!session) return;
    setEditing(prev => ({ ...prev, productId: p.id, productName: p.name, unit: p.unit }));
    setPickingColor(true);
    setColors_(await listColors(session.sessionId, session.tenantId, p.id));
  };

  const onPickColor = (c: Color) => {
    setEditing(prev => ({
      ...prev, colorId: c.id, colorName: c.name, colorValue: c.colorValue,
      // Auto-generate batch code suggestion
      batchCode: `G${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`,
    }));
  };

  const confirm = () => {
    const l = editing;
    if (!l?.productId || !l.batchCode || !l.quantity || !l.price) {
      Alert.alert('提示', '请完整填写商品、缸号、数量、单价'); return;
    }
    setItems(prev => [...prev, { ...l, key: `${Date.now()}-${Math.random()}` } as LineItem]);
    setEditing(null);
  };

  const removeLine = (key: string) => setItems(prev => prev.filter(i => i.key !== key));

  const onSave = async () => {
    if (!session) return;
    if (!supplier) { Alert.alert('提示', '请选择供应商'); return; }
    if (!items.length) { Alert.alert('提示', '请添加至少一项商品'); return; }
    setSaving(true);
    try {
      const res = await createPurchaseOrder(session.sessionId, session.tenantId, {
        supplierId: supplier.id,
        purchaseDate,
        paidAmount: paid,
        remark: remark || undefined,
        items: items.map(i => ({
          productId: i.productId, colorId: i.colorId,
          batchCode: i.batchCode, quantity: i.quantity, price: i.price, remark: i.remark,
        })),
      });
      Alert.alert('创建成功', `采购单号 ${res.orderNumber}`, [
        { text: '好', onPress: () => nav.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('保存失败', e.message ?? '请重试');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title="新建采购单" sub={purchaseDate} back onBack={() => nav.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 140 }}>
          <Pressable style={styles.card} onPress={openSupplierPicker}>
            <Text style={styles.fieldLabel}>供应商 · SUPPLIER</Text>
            {supplier ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{supplier.name[0]}</Text></View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.rowName}>{supplier.name}</Text>
                  <Text style={styles.rowSub}>{supplier.contactPerson || '-'} · {supplier.phone || ''} · {supplier.settlementCycle || ''}</Text>
                </View>
                <Text style={{ color: colors.ink300, fontSize: 16 }}>›</Text>
              </View>
            ) : <Text style={styles.placeholder}>点击选择供应商</Text>}
          </Pressable>

          <View style={[styles.card, { marginTop: 10, padding: 0 }]}>
            <View style={styles.cardHead}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600' }}>采购明细</Text>
                <Text style={styles.rowSub}>{items.length} 项</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Pressable onPress={startAdd} style={styles.addBtn}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>+ 添加</Text>
              </Pressable>
            </View>

            {items.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.ink400, padding: 20, fontSize: 12 }}>尚未添加商品</Text>
            ) : items.map(i => (
              <View key={i.key} style={styles.lineItem}>
                <View style={[styles.swatch, { backgroundColor: i.colorValue || '#eee' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName}>{i.productName} · {i.colorName || '-'}</Text>
                  <Text style={styles.lineMeta}>新缸号 {i.batchCode} · {i.quantity}{i.unit} × ¥{i.price}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.lineAmount}>¥{(i.quantity * i.price).toLocaleString()}</Text>
                  <Pressable onPress={() => removeLine(i.key)} hitSlop={8}>
                    <Text style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>删除</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.card, { marginTop: 10 }]}>
            <Text style={styles.fieldLabel}>已付金额 (定金)</Text>
            <TextInput style={styles.input} value={paidAmount} onChangeText={setPaidAmount}
              keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.ink300} />
          </View>
          <View style={[styles.card, { marginTop: 10 }]}>
            <Text style={styles.fieldLabel}>备注</Text>
            <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} multiline
              value={remark} onChangeText={setRemark} placeholder="可选" placeholderTextColor={colors.ink300} />
          </View>
        </ScrollView>

        <View style={styles.sticky}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.ink500, textTransform: 'uppercase' }}>采购总额</Text>
              <Text style={styles.totalBig}>¥{total.toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: colors.ink500 }}>
                已付 <Text style={{ color: colors.ok, fontWeight: '600', fontFamily: fontMono }}>¥{paid.toLocaleString()}</Text>
              </Text>
              <Text style={{ fontSize: 11, color: colors.ink500, marginTop: 2 }}>
                待付 <Text style={{ color: colors.warn, fontWeight: '600', fontFamily: fontMono }}>¥{unpaid.toLocaleString()}</Text>
              </Text>
            </View>
          </View>
          <Pressable onPress={onSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>提交审核</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ListPicker
        visible={pickingSupplier} title="选择供应商"
        items={suppliers} loading={loadingSup}
        keyExtractor={s => String(s.id)}
        searchBy={s => `${s.name} ${s.phone || ''}`}
        placeholder="搜索供应商"
        onClose={() => setPickingSupplier(false)}
        onSelect={s => setSupplier(s)}
        renderRow={s => (
          <View>
            <Text style={{ fontSize: 15, fontWeight: '500' }}>{s.name}</Text>
            <Text style={{ fontSize: 12, color: colors.ink500, marginTop: 2 }}>
              {s.contactPerson || '-'} · {s.phone || ''} · {s.settlementCycle || ''}
            </Text>
          </View>
        )} />

      <ListPicker
        visible={pickingProduct} title="选择商品"
        items={products} keyExtractor={p => String(p.id)}
        searchBy={p => `${p.name} ${p.code}`} placeholder="搜索商品"
        onClose={() => setPickingProduct(false)}
        onSelect={onPickProduct}
        renderRow={p => (
          <View>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>{p.name}</Text>
            <Text style={{ fontSize: 11, color: colors.ink500, fontFamily: fontMono, marginTop: 2 }}>{p.code} · {p.unit}</Text>
          </View>
        )} />

      <ListPicker
        visible={pickingColor} title="选择色号"
        items={colors_} keyExtractor={c => String(c.id)}
        searchBy={c => `${c.name} ${c.code}`} placeholder="搜索色号"
        onClose={() => setPickingColor(false)}
        onSelect={onPickColor}
        renderRow={c => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.swatch, { backgroundColor: c.colorValue || '#eee' }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '500' }}>{c.name}</Text>
              <Text style={{ fontSize: 11, color: colors.ink500, fontFamily: fontMono, marginTop: 2 }}>{c.code}</Text>
            </View>
          </View>
        )} />

      {editing?.colorId && !pickingProduct && !pickingColor && (
        <View style={qstyles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditing(null)} />
          <View style={qstyles.sheet}>
            <Text style={qstyles.title}>{editing.productName} · {editing.colorName}</Text>
            <View style={{ marginTop: 12 }}>
              <Text style={qstyles.label}>新缸号</Text>
              <TextInput style={[qstyles.input, { textAlign: 'left' }]}
                value={editing.batchCode} onChangeText={v => setEditing({ ...editing, batchCode: v })} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={qstyles.label}>数量 ({editing.unit})</Text>
                <TextInput style={qstyles.input} keyboardType="decimal-pad"
                  value={String(editing.quantity || '')}
                  onChangeText={v => setEditing({ ...editing, quantity: parseFloat(v) || 0 })} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={qstyles.label}>采购单价</Text>
                <TextInput style={qstyles.input} keyboardType="decimal-pad"
                  value={String(editing.price || '')}
                  onChangeText={v => setEditing({ ...editing, price: parseFloat(v) || 0 })} />
              </View>
            </View>
            <Text style={qstyles.amount}>小计 ¥{((editing.quantity || 0) * (editing.price || 0)).toLocaleString()}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable style={[qstyles.btn, qstyles.btnGhost]} onPress={() => setEditing(null)}>
                <Text style={{ color: colors.ink700 }}>取消</Text>
              </Pressable>
              <Pressable style={[qstyles.btn, qstyles.btnPrimary]} onPress={confirm}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>加入明细</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14 },
  cardHead: { padding: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: colors.ink100 },
  fieldLabel: { fontSize: 10, color: colors.ink500, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '500' },
  placeholder: { marginTop: 10, color: colors.ink400, fontSize: 14 },
  avatar: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.ok, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '600' },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 11, color: colors.ink500, marginTop: 2 },
  addBtn: { backgroundColor: colors.ok, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  lineItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.ink50 },
  swatch: { width: 16, height: 16, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  lineName: { fontSize: 13, fontWeight: '500' },
  lineMeta: { fontSize: 10, color: colors.ink400, fontFamily: fontMono, marginTop: 2 },
  lineAmount: { fontSize: 14, fontWeight: '600', fontFamily: fontMono },
  input: { marginTop: 6, borderWidth: 1, borderColor: colors.ink200, borderRadius: 6, paddingHorizontal: 10, height: 40, fontSize: 14, color: colors.ink900, fontFamily: fontMono },
  sticky: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: colors.ink100, padding: 14, paddingBottom: 24 },
  totalBig: { fontSize: 24, fontWeight: '700', color: colors.ink900, fontFamily: fontMono, letterSpacing: -0.6 },
  saveBtn: { height: 46, backgroundColor: colors.brand700, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 2 },
});

const qstyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  sheet: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '86%', maxWidth: 400 },
  title: { fontSize: 16, fontWeight: '600', color: colors.ink900 },
  label: { fontSize: 10, color: colors.ink500, textTransform: 'uppercase', fontWeight: '500' },
  input: { marginTop: 6, borderWidth: 1, borderColor: colors.ink200, borderRadius: 6, paddingHorizontal: 10, height: 42, fontSize: 16, fontFamily: fontMono, textAlign: 'right', fontWeight: '600', color: colors.ink900 },
  amount: { marginTop: 14, textAlign: 'right', fontSize: 20, fontWeight: '700', color: colors.ink900, fontFamily: fontMono },
  btn: { flex: 1, height: 42, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  btnGhost: { backgroundColor: colors.ink50 },
  btnPrimary: { backgroundColor: colors.brand700 },
});
