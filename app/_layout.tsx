import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="nofari"
          options={{
            gestureEnabled: false, // ⛔ disable swipe-back ONLY here
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
