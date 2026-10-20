import { hp, iconSize, isTablet, wp } from '@/utils/responsive'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/AuthContext'
import { LicenseGuard } from '@/components/LicenseGuard'
import { Colors } from '@/constants/theme'

const ACTIVE_COLOR   = Colors.primary
// Slate-500, not slate-400: inactive icons and labels still need ≥4.5:1 on white
const INACTIVE_COLOR = Colors.textSecondary

type IoniconName = keyof typeof Ionicons.glyphMap

// A single tab icon with a soft "pill" highlight behind it when active.
const TabIcon = ({
  focused,
  activeIcon,
  inactiveIcon,
  size,
}: {
  focused: boolean
  activeIcon: IoniconName
  inactiveIcon: IoniconName
  size: number
}) => (
  <View style={[styles.iconPill, focused && styles.iconPillActive]}>
    <Ionicons
      name={focused ? activeIcon : inactiveIcon}
      size={size}
      color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
    />
  </View>
)

const TabLayout = () => {
  const insets = useSafeAreaInsets()
  const tabBarHeight = isTablet() ? 72 : 64
  const { user } = useAuth()

  // Check if user is staff - use multiple methods
  const isStaff = user?.userType === 'staff' || ('role' in (user || {}))

  return (
    <LicenseGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,
          tabBarLabelStyle: styles.label,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: Colors.border,
            height: tabBarHeight + insets.bottom,
            paddingBottom: insets.bottom + 6,
            paddingTop: 8,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} activeIcon="home" inactiveIcon="home-outline" size={iconSize(22)} />
            ),
          }}
        />

        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            href: isStaff ? null : '/dashboard', // Hide for staff
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} activeIcon="pulse" inactiveIcon="pulse-outline" size={iconSize(22)} />
            ),
          }}
        />

        {/* Add Project - elevated center button; the round button is its own label */}
        <Tabs.Screen
          name="add-project"
          options={{
            title: 'Add Project',
            href: isStaff ? null : '/add-project',
            tabBarLabel: () => null,
            tabBarAccessibilityLabel: 'Add project',
            tabBarIcon: ({ focused }) => (
              <View style={[styles.centerButton, focused && styles.centerButtonFocused]}>
                <Ionicons name="add" size={iconSize(28)} color="#FFFFFF" />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="staff"
          options={{
            title: 'Staff',
            href: isStaff ? null : '/staff', // Hide for staff
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} activeIcon="people" inactiveIcon="people-outline" size={iconSize(22)} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} activeIcon="person-circle" inactiveIcon="person-circle-outline" size={iconSize(23)} />
            ),
          }}
        />
      </Tabs>
    </LicenseGuard>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconPill: {
    width: 52,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconPillActive: {
    backgroundColor: Colors.primaryLight,
  },
  centerButton: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(26),
    marginTop: -hp(22),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: Colors.surface,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  centerButtonFocused: {
    backgroundColor: Colors.primaryDark,
  },
})

export default TabLayout
