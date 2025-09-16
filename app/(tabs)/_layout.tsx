
import TabBar from '@/components/TabBar'
import { Tabs } from 'expo-router'
import React from 'react'

const TabLayout = () => {
  return (
    <Tabs tabBar={props => <TabBar {...props} />}>
      <Tabs.Screen name='index' options={{ title: "Home", headerShown: false }} />
      <Tabs.Screen name='profile' options={{ title: "profile", headerShown: false }} />
      <Tabs.Screen name='staff' options={{ title: "staff", headerShown: false }} />
    </Tabs>
  )
}

export default TabLayout