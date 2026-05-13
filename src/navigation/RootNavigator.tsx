import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/theme';
import { useAuth } from '@/store/useAuth';
import { hydrateEnv } from '@/config/env';
import { registerLogoutHandler } from '@/api/client';
import { TabBar } from '@/components/TabBar';
import { EnvPickerScreen } from '@/screens/EnvPickerScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import { NewOrderScreen } from '@/screens/NewOrderScreen';
import { OrderDetailScreen } from '@/screens/OrderDetailScreen';
import { StockScreen } from '@/screens/StockScreen';
import { CustomersScreen } from '@/screens/CustomersScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { PurchasesScreen } from '@/screens/PurchasesScreen';
import { NewPurchaseScreen } from '@/screens/NewPurchaseScreen';
import { SuppliersScreen } from '@/screens/SuppliersScreen';
import { ReportScreen } from '@/screens/ReportScreen';
import { CustomerFormScreen } from '@/screens/CustomerFormScreen';
import { SupplierFormScreen } from '@/screens/SupplierFormScreen';
import { EmployeesScreen } from '@/screens/EmployeesScreen';
import { EmployeeFormScreen } from '@/screens/EmployeeFormScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dash" component={DashboardScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Stock" component={StockScreen} />
      <Tab.Screen name="Me" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { session, loading, hydrate } = useAuth();

  useEffect(() => {
    // 注册 401 全局处理：分类原因后清登录态 + 路由自动切到 LoginScreen
    registerLogoutHandler((reason) => {
      useAuth.getState().logout(reason);
    });
    (async () => {
      await hydrateEnv();
      await hydrate();
    })();
  }, [hydrate]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.ink900 }}>
        <ActivityIndicator color={colors.brand400} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Home" component={HomeTabs} />
            <Stack.Screen name="NewOrder" component={NewOrderScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="NewPurchase" component={NewPurchaseScreen} />
            <Stack.Screen name="Purchases" component={PurchasesScreen} />
            <Stack.Screen name="Suppliers" component={SuppliersScreen} />
            <Stack.Screen name="Customers" component={CustomersScreen} />
            <Stack.Screen name="Report" component={ReportScreen} />
            <Stack.Screen name="CustomerForm" component={CustomerFormScreen} />
            <Stack.Screen name="SupplierForm" component={SupplierFormScreen} />
            <Stack.Screen name="Employees" component={EmployeesScreen} />
            <Stack.Screen name="EmployeeForm" component={EmployeeFormScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EnvPicker" component={EnvPickerScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="EnvPicker" component={EnvPickerScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
