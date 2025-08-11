import { LinearGradient } from "expo-linear-gradient";
import React, { ReactNode, useEffect, useRef } from "react";
import { ViewStyle, Animated, Easing, View } from "react-native";


interface GradientBackgroundProps {
  children: ReactNode;
  style?: ViewStyle;
}


export default function GradientBackground({ children, style }: GradientBackgroundProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        })
      ])
    ).start();
  }, [anim]);

  return (
    <>
      <LinearGradient
        colors={["#000000", "#0E1241", "#291C56", "#392465", "#181A2A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[{ flex: 1, padding: 20, position: 'absolute', width: '100%', height: '100%' }, style]}
      />
      <Animated.View
        style={{
          ...(style || {}),
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: anim,
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#6d0280ff", "#181A2A", "#080B32", "#291C56", "#0E1241", "#030f68ff"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1, padding: 20 }}
        />
      </Animated.View>
      <View style={{ flex: 1 }}>{children}</View>
    </>
  );
}
