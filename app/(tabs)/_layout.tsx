import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { View } from 'react-native'

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // ✅ hides the text labels
        tabBarStyle: {
          backgroundColor: '#fff', // or your theme.bg
          borderTopWidth: 0,
          elevation: 0,
          height: 48
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
              size={25}
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
              size={27}
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
                width: 38,
                height: 38,
                backgroundColor: focused ? "black" : "white",
                borderRadius: 100,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#17151548",
              }}
            >
              <Ionicons
                name="add"
                size={30}
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
              size={30}
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
              size={30}
              color={focused ? "black" : "gray"}
            />
          ),
        }}
      />
    </Tabs>
  )
}

export default TabLayout
