import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

export default function ProfileBackgroundWrapper({
  imageUrl,
  children,
  borderRadius = 16,
}: {
  imageUrl?: string;
  children: React.ReactNode;
  borderRadius?: number;
}) {
  if (imageUrl) {
    return (
      <ImageBackground
        source={{ uri: imageUrl }}
        style={{ flex: 1, overflow: 'hidden' }}
        blurRadius={2}
        // imageStyle={{ borderRadius }}
      >
        {/* Black overlay */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.75)',
            borderRadius,
          }}
        />
        <View style={{ flex: 1 }}>{children}</View>
      </ImageBackground>
    );
  }
  // Fallback to linear gradient
  return (
    <LinearGradient
      colors={['#080B32', '#0E1241', '#291C56', '#392465', '#51286A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1, borderRadius }}
    >
      {children}
    </LinearGradient>
  );
}
