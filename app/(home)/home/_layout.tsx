import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function HomeStackLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="homepage" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
