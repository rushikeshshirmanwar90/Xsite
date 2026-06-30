import { hp, iconSize, isTablet, sp, wp } from '@/utils/responsive'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Tabs } from 'expo-router'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/AuthContext'
import { LicenseGuard } from '@/components/LicenseGuard'

// Brand palette — kept intentionally restrained (one blue accent + neutral grays)
const ACTIVE_COLOR = '#2E72F0'
const INACTIVE_COLOR = '#94A3B8'

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
  <View style={styles.iconWrap}>
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Ionicons
        name={focused ? activeIcon : inactiveIcon}
        size={size}
        color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
      />
    </View>
  </View>
)

const TabLayout = () => {
  const insets = useSafeAreaInsets()
  const tabBarHeight = isTablet() ? hp(70) : hp(60)
  const { user } = useAuth()

  // Check if user is staff - use multiple methods
  const isStaff = user?.userType === 'staff' || ('role' in (user || {}))

  return (
    <LicenseGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false, // ✅ hides the text labels
          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            height: tabBarHeight + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: sp(10),
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            // Soft floating shadow — large, upward-cast glow
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: -18 },
            shadowOpacity: 0.3,
            shadowRadius: 44,
            elevation: 40,
          },
          tabBarItemStyle: {
            paddingTop: sp(2),
          },
        }}
      >
        {/* 1️⃣ Home */}
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                activeIcon="home"
                inactiveIcon="home-outline"
                size={iconSize(24)}
              />
            ),
          }}
        />

        {/* 2️⃣ Dashboard */}
        <Tabs.Screen
          name="dashboard"
          options={{
            href: isStaff ? null : '/dashboard', // Hide for staff
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                activeIcon="pulse"
                inactiveIcon="pulse-outline"
                size={iconSize(25)}
              />
            ),
          }}
        />

        {/* 3️⃣ Add Project - elevated gradient center button */}
        <Tabs.Screen
          name="add-project"
          options={{
            href: isStaff ? null : '/add-project', // Hide for staff
            tabBarIcon: ({ focused }) => (
              <View style={styles.centerWrap}>
                <LinearGradient
                  colors={focused ? ['#1E40AF', '#2E72F0'] : ['#2E72F0', '#1A54C4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.centerButton}
                >
                  <Ionicons name="add" size={iconSize(30)} color="#FFFFFF" />
                </LinearGradient>
              </View>
            ),
          }}
        />

        {/* 4️⃣ Staff */}
        <Tabs.Screen
          name="staff"
          options={{
            href: isStaff ? null : '/staff', // Hide for staff
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                activeIcon="people"
                inactiveIcon="people-outline"
                size={iconSize(26)}
              />
            ),
          }}
        />

        {/* 5️⃣ Profile */}
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                activeIcon="person-circle"
                inactiveIcon="person-circle-outline"
                size={iconSize(27)}
              />
            ),
          }}
        />
      </Tabs>
    </LicenseGuard>
  )
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    width: wp(46),
    height: wp(34),
    borderRadius: wp(17),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconPillActive: {
    backgroundColor: '#EAF0FE',
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    // Lift the button so it floats above the bar
    marginTop: -hp(18),
  },
  centerButton: {
    width: wp(54),
    height: wp(54),
    borderRadius: wp(27),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#2E72F0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
})

export default TabLayout
