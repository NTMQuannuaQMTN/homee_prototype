import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { ViewStyle } from "react-native";

interface GradientBackgroundProps {
  children: ReactNode;
  style?: ViewStyle;
}

export default function GradientBackground({ children, style }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={['#080B32', '#0E1241', '#291C56', '#392465', '#51286A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[{ flex: 1, padding: 20 }, style]}
    >
      {children}
    </LinearGradient>
  );
}
