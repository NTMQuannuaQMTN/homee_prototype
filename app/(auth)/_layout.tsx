import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return <SafeAreaProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signup" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="verify" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="register" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="image" options={{ headerShown: false }}></Stack.Screen>
    </Stack>
  </SafeAreaProvider>;
}
