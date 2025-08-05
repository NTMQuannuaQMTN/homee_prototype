import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { createContext, useContext, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useUserStore } from './store/userStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Theme configuration
export const theme = {
  colors: {
    // Gradient colors
    gradient1: '#080B32',
    gradient2: '#0E1241',
    gradient3: '#291C56',
    gradient4: '#392465',
    gradient5: '#51286A',

    // Functional colors
    gray400: '#9CA3AF',
    red1: '#FF1769',
    red2: '#E11D48',
    rsvp: '#7A5CFA',
    going: '#22C55E',
    maybe: '#CA8A04',
    notgoing: '#E11D48',
    viewevent: '#CAE6DF',
    hostevent: '#0A66C2',

    // Opacity colors
    white5: 'rgba(255, 255, 255, 0.05)',
    white10: 'rgba(255, 255, 255, 0.1)',
  },
  fonts: {
    regular: 'Nunito-Regular',
    bold: 'Nunito-Bold',
    extraBold: 'Nunito-ExtraBold',
    semiBold: 'Nunito-SemiBold',
    medium: 'Nunito-Medium',
  },
  gradients: {
    background: ['#080B32', '#0E1241', '#291C56', '#392465', '#51286A'],
  }
};

// Global styles
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    fontFamily: 'Nunito-Regular',
  },
  textBold: {
    fontFamily: 'Nunito-Bold',
  },
  textSemiBold: {
    fontFamily: 'Nunito-SemiBold',
  },
  textExtraBold: {
    fontFamily: 'Nunito-ExtraBold',
  },
  // Background gradient container
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#080B32', // Fallback color
  },
  // Common button styles
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRsvp: {
    backgroundColor: '#7A5CFA',
  },
  buttonGoing: {
    backgroundColor: '#22C55E',
  },
  buttonMaybe: {
    backgroundColor: '#CA8A04',
  },
  buttonNotGoing: {
    backgroundColor: '#E11D48',
  },
  buttonViewEvent: {
    backgroundColor: '#CAE6DF',
  },
  buttonHostEvent: {
    backgroundColor: '#0A66C2',
  },
});

// Theme context for easy access throughout the app
const ThemeContext = createContext(theme);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export default function RootLayout() {
  const [loaded] = useFonts({
    'Nunito-ExtraBold': require('../assets/fonts/Nunito-ExtraBold.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Medium': require('../assets/fonts/Nunito-Medium.ttf'),
  });

  const { user } = useUserStore();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* {user != null || <Stack.Screen name="index" options={{ headerShown: false }}></Stack.Screen>}
          {user != null || <Stack.Screen name="(auth)" options={{ headerShown: false }}></Stack.Screen>} */}
          <Stack.Screen name="(home)" options={{ headerShown: false }}></Stack.Screen>
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}