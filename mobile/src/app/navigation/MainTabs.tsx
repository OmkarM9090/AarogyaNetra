/**
 * MainTabs — the authenticated shell:
 * Home (dashboard) | Scanner | History | Profile
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRoute } from '@react-navigation/native';

import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { ScanPreparationScreen } from '../../features/scanner/screens/ScanPreparationScreen';
import { ScannerScreen } from '../../features/scanner/screens/ScannerScreen';
import { ScanProcessingScreen } from '../../features/scanner/screens/ScanProcessingScreen';
import { PredictionResultScreen } from '../../features/prediction/screens/PredictionResultScreen';
import { DiabetesResultScreen } from '../../features/prediction/screens/DiabetesResultScreen';
import { HypertensionResultScreen } from '../../features/prediction/screens/HypertensionResultScreen';
import { AnemiaResultScreen } from '../../features/prediction/screens/AnemiaResultScreen';
import { RiskEvolutionScreen } from '../../features/risk-evolution/screens/RiskEvolutionScreen';
import { LifestyleSimScreen } from '../../features/lifestyle-sim/screens/LifestyleSimScreen';
import { ScanHistoryScreen } from '../../features/history/screens/ScanHistoryScreen';
import { ScanDetailScreen } from '../../features/history/screens/ScanDetailScreen';
import { ProfileScreen } from '../../features/auth/screens/ProfileScreen';
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen';
import { useLanguage } from '../../shared/i18n';
import { Colors } from '../../shared/theme';
import type {
  HistoryStackParamList,
  HomeStackParamList,
  MainTabParamList,
  ProfileStackParamList,
  ScannerStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ScannerStack = createNativeStackNavigator<ScannerStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: Colors.background },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { fontWeight: '700' as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: Colors.background },
  animation: 'slide_from_right' as const,
};

function ConditionResultRouter() {
  const route = useRoute();
  const condition = (route.params as { condition?: string } | undefined)?.condition;
  if (condition === 'diabetes') return <DiabetesResultScreen />;
  if (condition === 'hypertension') return <HypertensionResultScreen />;
  return <AnemiaResultScreen />;
}

function conditionTitle(params: unknown): string {
  const condition = (params as { condition?: string } | undefined)?.condition;
  if (condition === 'diabetes') return 'Diabetes Result';
  if (condition === 'hypertension') return 'Hypertension Result';
  return 'Anemia Result';
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="Result" component={PredictionResultScreen} options={{ title: 'Scan Result' }} />
      <HomeStack.Screen
        name="ConditionResult"
        component={ConditionResultRouter}
        options={({ route }) => ({ title: conditionTitle(route.params) })}
      />
      <HomeStack.Screen name="RiskEvolution" component={RiskEvolutionScreen} options={{ title: 'Risk Forecast' }} />
      <HomeStack.Screen name="LifestyleSim" component={LifestyleSimScreen} options={{ title: 'What-If Simulation' }} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </HomeStack.Navigator>
  );
}

function ScannerStackNavigator() {
  return (
    <ScannerStack.Navigator screenOptions={stackScreenOptions}>
      <ScannerStack.Screen name="Preparation" component={ScanPreparationScreen} options={{ headerShown: false, title: 'Health Scan' }} />
      <ScannerStack.Screen name="Camera" component={ScannerScreen} options={{ title: 'Eye Scan' }} />
      <ScannerStack.Screen name="Processing" component={ScanProcessingScreen} options={{ headerShown: false }} />
      <ScannerStack.Screen name="Result" component={PredictionResultScreen} options={{ title: 'Scan Result' }} />
      <ScannerStack.Screen
        name="ConditionResult"
        component={ConditionResultRouter}
        options={({ route }) => ({ title: conditionTitle(route.params) })}
      />
    </ScannerStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={stackScreenOptions}>
      <HistoryStack.Screen name="ScanHistory" component={ScanHistoryScreen} options={{ headerShown: false, title: 'Scan History' }} />
      <HistoryStack.Screen name="ScanDetail" component={ScanDetailScreen} options={{ title: 'Scan Report' }} />
      <HistoryStack.Screen
        name="ConditionResult"
        component={ConditionResultRouter}
        options={({ route }) => ({ title: conditionTitle(route.params) })}
      />
    </HistoryStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </ProfileStack.Navigator>
  );
}

// ─── Tab icon ──────────────────────────────────────────
const TabIcon: React.FC<{ emoji: string; focused: boolean; color: string }> = ({ emoji, focused, color }) => (
  <View style={[tabStyles.iconContainer, focused && { backgroundColor: `${color}18` }]}>
    <Text style={{ fontSize: 20 }}>{emoji}</Text>
    {focused && <View style={[tabStyles.activeDot, { backgroundColor: color }]} />}
  </View>
);

const tabStyles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export const MainTabs: React.FC = () => {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 0,
          shadowColor: '#191c1d',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 20,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 0 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: t('tab_home'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} color={Colors.primary} />,
        }}
      />
      <Tab.Screen
        name="ScannerTab"
        component={ScannerStackNavigator}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🩺" focused={focused} color={Colors.secondary} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStackNavigator}
        options={{
          tabBarLabel: t('scan_history'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} color={Colors.warning} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: t('tab_profile'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} color={Colors.accent} />,
        }}
      />
    </Tab.Navigator>
  );
};
