import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ViewStyle, StyleProp, ColorValue } from 'react-native';

interface GoldGradientProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: [ColorValue, ColorValue, ...ColorValue[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

// Default gold gradient colors
const defaultColors: [ColorValue, ColorValue, ...ColorValue[]] = ["#A57C01", "#D4AF37", "#B8860B", "#996515"];
const defaultStart = { x: 0, y: 0 };
const defaultEnd = { x: 1, y: 1 };

export default function GoldGradient({
  children,
  style,
  colors = defaultColors,
  start = defaultStart,
  end = defaultEnd,
}: GoldGradientProps) {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
