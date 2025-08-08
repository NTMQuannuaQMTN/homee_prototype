import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, PanResponder, ScrollView, Text, TouchableOpacity, useAnimatedValue, View } from "react-native";
import tw from 'twrnc';
import GradientBackground from "./components/GradientBackground";

import Logo from '@/assets/logo/icon.svg';

export default function Index() {
  const textLanding = ['get started 1', 'get started 2', 'get started 3'];
  const [slide, setSlide] = useState(0);
  const router = useRouter();
  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;

  // Animations
  const splashAnimationValue = useAnimatedValue(1);
  const windowAnimationValue = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(splashAnimationValue, {
      toValue: 0,
      duration: 500,
      delay: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(windowAnimationValue, {
        toValue: slide,
        duration: 0,
        useNativeDriver: false,
      }),
    ]).start();
    setTimeout(() => windowAnimationValue.setValue(slide), 0);
  }, [slide])

  const windowMoving = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.8 * width, 0, -0.8 * width],
    extrapolate: 'clamp'
  });

  const firstSlideScaling = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [1, 0.9, 0.8],
    extrapolate: 'clamp'
  });

  const firstSlideMoving = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 0.05 * width, 0.1 * width],
    extrapolate: 'clamp'
  });

  const secondSlideScaling = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.9, 1, 0.9],
    extrapolate: 'clamp'
  });

  const secondSlideMoving = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [-0.05 * width, 0, 0.05 * width],
    extrapolate: 'clamp'
  });

  const thirdSlideScaling = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.8, 0.9, 1],
    extrapolate: 'clamp'
  });

  const thirdSlideMoving = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [-0.1 * width, -0.05 * width, 0],
    extrapolate: 'clamp'
  });

  return (
    <GradientBackground>
      <Animated.View style={{width: width, height: height, position: 'absolute', top: 0, left: 0, zIndex: 2, opacity: splashAnimationValue }}>
        <GradientBackground>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Logo width={0.3 * width}></Logo>
          </View>
        </GradientBackground>
      </Animated.View>
      {/* Center content - takes up most of the screen */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.FlatList
          data={[0, 1, 2]}
          keyExtractor={item => item.toString()}
          horizontal
          pagingEnabled
          snapToInterval={0.8 * width}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            height: 0.6 * height,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0 * width,
            paddingHorizontal: 0.1 * width,
            marginTop: slide < 2 ? 0.2 * height : 0.15 * height,
          }}
          style={{ height: 0.6 * height, width: width }}
          onScroll={e => {
            // Optionally, update slide index for UI logic (not for animation)
            const x = e.nativeEvent.contentOffset.x;
            setSlide(x / (0.8 * width));
          }}
          scrollEventThrottle={16}
          renderItem={({ item }) => {
            // Choose scaling and image for each slide
            let scale, img, text;
            if (item === 0) {
              scale = firstSlideScaling;
              img = require('@/assets/images/default_1.png');
              text = textLanding[0];
            } else if (item === 1) {
              scale = secondSlideScaling;
              img = require('@/assets/images/default_2.png');
              text = textLanding[1];
            } else {
              scale = thirdSlideScaling;
              img = require('@/assets/images/default_3.png');
              text = textLanding[2];
            }
            return (
              <TouchableOpacity
                onPress={() => { setSlide(item); }}
                activeOpacity={1}
                style={{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center' }}
              >
                <Animated.View style={[{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center', transform: [{ scale }] }]}>
                  <Image source={img} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, borderRadius: 20 }} />
                  <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 20 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>{text}</Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Bottom button(s) - fixed at bottom */}
      <View style={tw`h-20 justify-center`}>
        {slide >= 2 && (
          <>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.7}
              style={[tw`rounded-full py-2.5 w-full items-center mb-3 -mt-8`, { backgroundColor: '#ffffff' }]}
            >
              <Text style={[tw`text-black text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/(auth)/signup')}
              activeOpacity={0.7}
              style={tw`w-full items-center`}
            >
              <Text style={[tw`text-white text-[13px]`, { fontFamily: 'Nunito-Medium' }]}>
                First time to Homee? <Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </GradientBackground>
  );
}
