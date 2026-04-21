import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/theme';
import { useAuth } from '@/store/useAuth';
import { LoginScreen } from '@/screens/LoginScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import { NewOrderScreen } from '@/screens/NewOrderScreen';
import { StockScreen } from '@/screens/StockScreen';
import { CustomersScreen } from '@/screens/CustomersScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { PurchasesScreen } from '@/screens/PurchasesScreen';
import { NewPurchaseScreen } from '@/screens/NewPurchaseScreen';
import { SuppliersScreen } from '@/screens/SuppliersScreen';
import { ReportScreen } from '@/screens/ReportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={{ width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 16, opacity: focused ? 1 : 0.55 }}>{label}</Text>
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand700,
        tabBarInactiveTintColor: colors.ink400,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderTopColor: colors.ink100,
          borderTopWidth: 0.5,
          height: 84,
          paddingTop: 6,
          paddingBottom: 24,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}>
      <Tab.Screen name="Dash" component={DashboardScreen}
        options={{ title: '工作台', tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="⊞" /> }} />
      <Tab.Screen name="Orders" component={OrdersScreen}
        options={{ title: '销售', tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="☰" /> }} />
      <Tab.Screen name="Stock" component={StockScreen}
        options={{ title: '库存', tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="▤" /> }} />
      <Tab.Screen name="Customers" component={CustomersScreen}
        options={{ title: '客户', tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="☺" /> }} />
      <Tab.Screen name="Me" component={ProfileScreen}
        options={{ title: '我的', tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="⚙" /> }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { session, loading, hydrate } = useAuth();

  useEffect(() => { hydrate(); }, [hydrate]);

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
            <Stack.Screen name="NewPurchase" component={NewPurchaseScreen} />
            <Stack.Screen name="Purchases" component={PurchasesScreen} />
            <Stack.Screen name="Suppliers" component={SuppliersScreen} />
            <Stack.Screen name="Report" component={ReportScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
