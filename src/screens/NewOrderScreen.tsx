import React, { useState, useEffect } from 'react';
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
import { listCustomers, type Customer } from '@/api/customer';
import { listProducts, listColors, listBatches, type Product, type Color, type Batch } from '@/api/product';
import { createSalesOrder } from '@/api/sales';

interface LineItem {
  key: string;
  productId: number; productName: string; unit: string;
  colorId?: number; colorName?: string; colorValue?: string;
  batchId?: number; batchCode?: string;
  quantity: number; price: number;
  stockQty?: number;
  remark?: string;
}

export function NewOrderScreen() {
  const nav = useNavigation<any>();
  const session = useAuth(s => s.session);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [salesDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paidAmount, setPaidAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  // picker state
  const [pickingCustomer, setPickingCustomer] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCust, setLoadingCust] = useState(false);

  const [editingLine, setEditingLine] = useState<Partial<LineItem> | null>(null);
  const [pickingProduct, setPickingProduct] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [pickingColor, setPickingColor] = useState(false);
  const [colors_, setColors_] = useState<Color[]>([]);
  const [pickingBatch, setPickingBatch] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);

  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const paid = parseFloat(paidAmount) || 0;
  const unpaid = total - paid;

  const openCustomerPicker = async () => {
    if (!session) return;
    setPickingCustomer(true);
    setLoadingCust(true);
    try { setCustomers(await listCustomers(session.sessionId, session.tenantId)); }
    finally { setLoadingCust(false); }
  };

  const startAddLine = async () => {
    if (!session) return;
    setEditingLine({ quantity: 0, price: 0 });
    setPickingProduct(true);
    setProducts(await listProducts(session.sessionId, session.tenantId));
  };

  const onPickProduct = async (p: Product) => {
    if (!session) return;
    setEditingLine(prev => ({ ...prev, productId: p.id, productName: p.name, unit: p.unit }));
    setPickingColor(true);
    setColors_(await listColors(session.sessionId, session.tenantId, p.id));
  };

  const onPickColor = async (c: Color) => {
    if (!session) return;
    setEditingLine(prev => ({ ...prev, colorId: c.id, colorName: c.name, colorValue: c.colorValue }));
    setPickingBatch(true);
    setBatches(await listBatches(session.sessionId, session.tenantId, c.id));
  };

  const onPickBatch = (b: Batch) => {
    setEditingLine(prev => ({
      ...prev, batchId: b.id, batchCode: b.code, stockQty: Number(b.stockQuantity),
      price: prev?.price || Number(b.purchasePrice) || 0,
    }));
  };

  const confirmAddLine = () => {
    const l = editingLine;
    if (!l?.productId || !l.quantity || l.quantity <= 0 || !l.price || l.price <= 0) {
      Alert.alert('提示', '请选择商品并填写数量和单价');
      return;
    }
    if (l.stockQty !== undefined && l.quantity > l.stockQty) {
      Alert.alert('库存不足', `当前库存 ${l.stockQty}${l.unit}，无法出库 ${l.quantity}${l.unit}`);
      return;
    }
    setItems(prev => [...prev, { ...l, key: `${Date.now()}-${Math.random()}` } as LineItem]);
    setEditingLine(null);
  };

  const removeLine = (key: string) => setItems(prev => prev.filter(i => i.key !== key));

  const onSave = async () => {
    if (!session) return;
    if (!customer) { Alert.alert('提示', '请选择客户'); return; }
    if (!items.length) { Alert.alert('提示', '请添加至少一个商品'); return; }

    setSaving(true);
    try {
      const res = await createSalesOrder(session.sessionId, session.tenantId, {
        customerId: customer.id,
        salesDate,
        paidAmount: paid,
        remark: remark || undefined,
        items: items.map(i => ({
          productId: i.productId,
          colorId: i.colorId,
          batchId: i.batchId,
          quantity: i.quantity,
          price: i.price,
          remark: i.remark,
        })),
      });
      Alert.alert('创建成功', `销售单号 ${res.orderNumber}`, [
        { text: '好', onPress: () => nav.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('保存失败', e.message ?? '请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <NavBar title="新建销售单" sub={salesDate} back onBack={() => nav.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 140 }}>
          {/* Customer */}
          <Pressable style={styles.card} onPress={openCustomerPicker}>
            <Text style={styles.fieldLabel}>客户 · CUSTOMER</Text>
            {customer ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{customer.name[0]}</Text></View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.rowName}>{customer.name}</Text>
                  <Text style={styles.rowSub}>{customer.contactPerson || '-'} · {customer.phone || ''}</Text>
                </View>
                <Text style={{ color: colors.ink300, fontSize: 16 }}>›</Text>
              </View>
            ) : (
              <Text style={styles.placeholder}>点击选择客户</Text>
            )}
            {customer && (customer.unpaidAmount ?? 0) > 0 && (
              <View style={styles.warnBar}>
                <Text style={styles.warnText}>
                  ⚠ 该客户欠款 ¥{(customer.unpaidAmount ?? 0).toLocaleString()}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Items */}
          <View style={[styles.card, { marginTop: 10, padding: 0 }]}>
            <View style={styles.cardHead}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600' }}>商品明细</Text>
                <Text style={styles.rowSub}>
                  {items.length} 项 · {items.reduce((s, i) => s + i.quantity, 0)}
                  {items[0]?.unit || 'kg'}
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              <Pressable onPress={startAddLine} style={styles.addBtn}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>+ 添加商品</Text>
              </Pressable>
            </View>

            {items.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.ink400, padding: 20, fontSize: 12 }}>
                尚未添加商品
              </Text>
            ) : items.map(i => (
              <View key={i.key} style={styles.lineItem}>
                <View style={[styles.swatch, { backgroundColor: i.colorValue || '#eee' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName}>{i.productName} · {i.colorName || '-'}</Text>
                  <Text style={styles.lineMeta}>
                    缸号 {i.batchCode || '-'} · {i.quantity}{i.unit} × ¥{i.price}
                  </Text>
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

          {/* Payment */}
          <View style={[styles.card, { marginTop: 10 }]}>
            <Text style={styles.fieldLabel}>已收金额</Text>
            <TextInput
              style={styles.input}
              value={paidAmount}
              onChangeText={setPaidAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.ink300}
            />
          </View>

          <View style={[styles.card, { marginTop: 10 }]}>
            <Text style={styles.fieldLabel}>备注</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              multiline
              value={remark}
              onChangeText={setRemark}
              placeholder="如：三色分开打包"
              placeholderTextColor={colors.ink300}
            />
          </View>
        </ScrollView>

        {/* Sticky summary */}
        <View style={styles.sticky}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.ink500, textTransform: 'uppercase' }}>合计</Text>
              <Text style={styles.totalBig}>¥{total.toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: colors.ink500 }}>
                已收 <Text style={[styles.summaryNum, { color: colors.ok }]}>¥{paid.toLocaleString()}</Text>
              </Text>
              <Text style={{ fontSize: 11, color: colors.ink500, marginTop: 2 }}>
                欠款 <Text style={[styles.summaryNum, { color: colors.danger }]}>¥{unpaid.toLocaleString()}</Text>
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onSave}
            disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>保存并出库</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Pickers */}
      <ListPicker
        visible={pickingCustomer}
        title="选择客户"
        items={customers}
        loading={loadingCust}
        keyExtractor={c => String(c.id)}
        searchBy={c => `${c.name} ${c.phone || ''} ${c.contactPerson || ''}`}
        placeholder="搜索客户名/电话/联系人"
        onClose={() => setPickingCustomer(false)}
        onSelect={c => { setCustomer(c); }}
        renderRow={c => (
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '500' }}>{c.name}</Text>
              <Text style={{ fontSize: 12, color: colors.ink500, marginTop: 2 }}>
                {c.contactPerson || '-'} · {c.phone || ''}
              </Text>
            </View>
            {(c.unpaidAmount ?? 0) > 0 && (
              <Text style={{ color: colors.danger, fontSize: 12, fontFamily: fontMono }}>
                欠 ¥{(c.unpaidAmount ?? 0).toLocaleString()}
              </Text>
            )}
          </View>
        )}
      />

      <ListPicker
        visible={pickingProduct}
        title="选择商品"
        items={products}
        keyExtractor={p => String(p.id)}
        searchBy={p => `${p.name} ${p.code}`}
        placeholder="搜索商品名称或编码"
        onClose={() => setPickingProduct(false)}
        onSelect={onPickProduct}
        renderRow={p => (
          <View>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>{p.name}</Text>
            <Text style={{ fontSize: 11, color: colors.ink500, fontFamily: fontMono, marginTop: 2 }}>
              {p.code} · {p.unit}
            </Text>
          </View>
        )}
      />

      <ListPicker
        visible={pickingColor}
        title="选择色号"
        items={colors_}
        keyExtractor={c => String(c.id)}
        searchBy={c => `${c.name} ${c.code}`}
        placeholder="搜索色号"
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
        )}
      />

      <ListPicker
        visible={pickingBatch}
        title="选择缸号（库存）"
        items={batches}
        keyExtractor={b => String(b.id)}
        onClose={() => {
          setPickingBatch(false);
          // After batch picked, show quantity/price input inline in editingLine
          if (editingLine?.batchId) {
            // Inline edit sheet
            promptQty();
          }
        }}
        onSelect={onPickBatch}
        renderRow={b => {
          const low = Number(b.stockQuantity) < 100;
          return (
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', fontFamily: fontMono }}>{b.code}</Text>
                <Text style={{ fontSize: 11, color: colors.ink500, marginTop: 2 }}>
                  库存 {b.stockQuantity} · 进价 ¥{b.purchasePrice || 0}
                </Text>
              </View>
              {low && <Text style={{ color: colors.warn, fontSize: 11 }}>库存不足</Text>}
            </View>
          );
        }}
      />

      {/* Quantity / Price input modal — shown when batch chosen */}
      {editingLine?.batchId && !pickingBatch && !pickingColor && !pickingProduct && (
        <QtyPriceSheet
          editingLine={editingLine}
          setEditingLine={setEditingLine}
          onCancel={() => setEditingLine(null)}
          onConfirm={confirmAddLine}
        />
      )}
    </SafeAreaView>
  );

  function promptQty() { /* noop — inline modal below handles it */ }
}

function QtyPriceSheet({ editingLine, setEditingLine, onCancel, onConfirm }: any) {
  return (
    <View style={qstyles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      <View style={qstyles.sheet}>
        <Text style={qstyles.title}>{editingLine.productName} · {editingLine.colorName}</Text>
        <Text style={qstyles.sub}>缸号 {editingLine.batchCode} · 库存 {editingLine.stockQty}{editingLine.unit}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={qstyles.label}>数量 ({editingLine.unit})</Text>
            <TextInput
              style={qstyles.input}
              keyboardType="decimal-pad"
              value={String(editingLine.quantity || '')}
              onChangeText={v => setEditingLine({ ...editingLine, quantity: parseFloat(v) || 0 })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={qstyles.label}>单价</Text>
            <TextInput
              style={qstyles.input}
              keyboardType="decimal-pad"
              value={String(editingLine.price || '')}
              onChangeText={v => setEditingLine({ ...editingLine, price: parseFloat(v) || 0 })}
            />
          </View>
        </View>
        <Text style={qstyles.amount}>小计 ¥{((editingLine.quantity || 0) * (editingLine.price || 0)).toLocaleString()}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Pressable style={[qstyles.btn, qstyles.btnGhost]} onPress={onCancel}>
            <Text style={{ color: colors.ink700 }}>取消</Text>
          </Pressable>
          <Pressable style={[qstyles.btn, qstyles.btnPrimary]} onPress={onConfirm}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>加入明细</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14 },
  cardHead: {
    padding: 14, flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 0.5, borderBottomColor: colors.ink100,
  },
  fieldLabel: { fontSize: 10, color: colors.ink500, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '500' },
  placeholder: { marginTop: 10, color: colors.ink400, fontSize: 14 },
  avatar: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.brand700, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '600' },
  rowName: { fontSize: 15, fontWeight: '600', color: colors.ink900 },
  rowSub: { fontSize: 11, color: colors.ink500, marginTop: 2 },
  warnBar: {
    marginTop: 10, padding: 8, backgroundColor: colors.dangerBg, borderRadius: 6,
  },
  warnText: { color: '#9a2929', fontSize: 11 },

  addBtn: {
    backgroundColor: colors.brand700, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 4,
  },

  lineItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    borderBottomWidth: 0.5, borderBottomColor: colors.ink50,
  },
  swatch: { width: 16, height: 16, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  lineName: { fontSize: 13, fontWeight: '500' },
  lineMeta: { fontSize: 10, color: colors.ink400, fontFamily: fontMono, marginTop: 2 },
  lineAmount: { fontSize: 14, fontWeight: '600', fontFamily: fontMono },

  input: {
    marginTop: 6, borderWidth: 1, borderColor: colors.ink200, borderRadius: 6,
    paddingHorizontal: 10, height: 40, fontSize: 14, color: colors.ink900, fontFamily: fontMono,
  },

  sticky: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: colors.ink100,
    padding: 14, paddingBottom: 24,
  },
  totalBig: {
    fontSize: 24, fontWeight: '700', color: colors.danger,
    fontFamily: fontMono, letterSpacing: -0.6,
  },
  summaryNum: { fontWeight: '600', fontFamily: fontMono },
  saveBtn: {
    height: 46, backgroundColor: colors.brand700, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 2 },
});

const qstyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 1000,
  },
  sheet: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    width: '86%', maxWidth: 400,
  },
  title: { fontSize: 16, fontWeight: '600', color: colors.ink900 },
  sub: { fontSize: 11, color: colors.ink500, marginTop: 4, fontFamily: fontMono },
  label: { fontSize: 10, color: colors.ink500, textTransform: 'uppercase', fontWeight: '500' },
  input: {
    marginTop: 6, borderWidth: 1, borderColor: colors.ink200, borderRadius: 6,
    paddingHorizontal: 10, height: 44, fontSize: 18, fontFamily: fontMono, textAlign: 'right',
    fontWeight: '600', color: colors.ink900,
  },
  amount: {
    marginTop: 14, textAlign: 'right', fontSize: 20, fontWeight: '700',
    color: colors.ink900, fontFamily: fontMono,
  },
  btn: { flex: 1, height: 42, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  btnGhost: { backgroundColor: colors.ink50 },
  btnPrimary: { backgroundColor: colors.brand700 },
});
