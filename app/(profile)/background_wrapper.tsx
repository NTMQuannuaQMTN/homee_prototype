import GradientBackground from '@/app/components/GradientBackground';
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
        imageStyle={{ borderRadius }}
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
  // Fallback to shared gradient background
  return (
    <View style={{ flex: 1, borderRadius, overflow: 'hidden' }}>
      <GradientBackground>
        <View style={{ flex: 1 }}>{children}</View>
      </GradientBackground>
    </View>
  );
}
