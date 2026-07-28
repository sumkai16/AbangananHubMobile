import { Tabs } from 'expo-router';
import { Bell, FileText, Home, LayoutGrid, MessageCircle } from 'lucide-react-native';

// SDK 54 uses the classic (stable) expo-router Tabs API — the newer
// `expo-router/unstable-native-tabs` used by the SDK 57 default template
// doesn't exist in this SDK's expo-router version. Swapped for Expo Go
// compatibility (only SDK 54 is installed on the test device); revisit once
// the app moves to a dev build and a newer SDK.
//
// Colors match context/DESIGN.md §2 directly rather than going through
// `constants/theme.ts`'s `Colors` — that's leftover template greyscale
// (dark.background is literal black), not the brand palette.
//
// Order and labels (Browse / Messages / Notifications / Reservations /
// More) — revised 2026-07-27, dropping Saved as its own tab in favor of
// Notifications. Saved listings move to a MenuRow in the More hub
// (src/app/saved.tsx, pushed from account.tsx) since favoriting is a
// secondary action, not a screen tenants live in day to day.
export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#156F8C',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E2E8F0' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, size, focused }) => (
            <Home size={size} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size, focused }) => (
            <MessageCircle size={size} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size, focused }) => (
            <Bell size={size} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Reservations',
          tabBarIcon: ({ color, size, focused }) => (
            <FileText size={size} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      {/* "More", not "Profile" — this tab is the hub for everything that
          doesn't have its own tab slot: profile summary at the top, then
          a punch list of named-but-unbuilt pages (notifications, reviews,
          reports) as the app grows past what five tabs can hold. */}
      <Tabs.Screen
        name="account"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size, focused }) => (
            <LayoutGrid size={size} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
    </Tabs>
  );
}
