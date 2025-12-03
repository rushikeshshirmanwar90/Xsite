import { hp, iconSize, isTablet, sp, wp } from '@/utils/responsive'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TabLayout = () => {
  const insets = useSafeAreaInsets()
  const tabBarHeight = isTablet() ? hp(70) : hp(60)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // ✅ hides the text labels
        tabBarStyle: {
          backgroundColor: '#fff', // or your theme.bg
          borderTopWidth: 0,
          elevation: 0,
          height: tabBarHeight + insets.bottom, // Responsive height + safe area
          paddingBottom: insets.bottom, // Push content up from bottom
          paddingTop: sp(8), // Responsive top padding
        },
      }}
    >
      {/* 1️⃣ Home */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={iconSize(25)}
              color={focused ? "black" : "gray"}
            />
          ),
        }}
      />

      {/* 2️⃣ Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "pulse-outline" : "pulse-outline"}
              size={iconSize(27)}
              color={focused ? "black" : "gray"}
            />
          ),
        }}
      />


      {/* 3️⃣ Add Project */}
      <Tabs.Screen
        name="add-project"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: wp(38),
                height: wp(38),
                backgroundColor: focused ? "black" : "white",
                borderRadius: wp(100),
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#17151548",
              }}
            >
              <Ionicons
                name="add"
                size={iconSize(30)}
                color={focused ? "white" : "gray"}
              />
            </View>
          ),
        }}
      />

      {/* 4️⃣ Staff */}
      <Tabs.Screen
        name="staff"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={iconSize(30)}
              color={focused ? "black" : "gray"}
            />
          ),
        }}
      />


      {/* 5️⃣ Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={iconSize(30)}
              color={focused ? "black" : "gray"}
            />
          ),
        }}
      />
    </Tabs>
  )
}

export default TabLayout
