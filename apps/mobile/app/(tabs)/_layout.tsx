import { Tabs } from 'expo-router'
import { useTheme } from 'tamagui'
import { BarChart2, Home, Settings, Trophy } from 'app/components'
import { useHeaderOptions } from '@/components/headerOptions'

// Bottom tabs replace the web header's Home / Results / Statistics / Settings
// links (Phase 6). The game is a root-stack route pushed above the tabs so
// the tab bar stays out of the way while playing. Each route's ScreenFrame
// owns `title` (the header), so the tab labels are set with `tabBarLabel`,
// which `title` would otherwise feed.
export default function TabLayout() {
  const theme = useTheme()
  const { contentStyle: _unused, ...headerOptions } = useHeaderOptions()
  const paper = theme.editorialPaper?.get() as string
  const rule = theme.editorialRule?.get() as string
  const accent = theme.editorialAccent?.get() as string
  const muted = theme.editorialMuted?.get() as string

  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        sceneStyle: { backgroundColor: paper },
        tabBarStyle: { backgroundColor: paper, borderTopColor: rule },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color as string} strokeWidth={1.5} />
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          tabBarLabel: 'Results',
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color as string} strokeWidth={1.5} />
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          tabBarLabel: 'Statistics',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 size={size} color={color as string} strokeWidth={1.5} />
          )
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color as string} strokeWidth={1.5} />
        }}
      />
    </Tabs>
  )
}
