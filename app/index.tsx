import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, PanResponder, ScrollView, Text, TouchableOpacity, useAnimatedValue, View } from "react-native";
import tw from 'twrnc';
import GradientBackground from "./components/GradientBackground";

export default function Index() {
  const textLanding = ['get started 1', 'get started 2', 'get started 3'];
  const [slide, setSlide] = useState(0);
  const router = useRouter();
  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;

  // Animations
  const windowAnimationValue = useAnimatedValue(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(windowAnimationValue, {
        toValue: slide,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
    setTimeout(() => windowAnimationValue.setValue(slide), 500);
  }, [slide])

  const windowMoving = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.8 * width, 0, -0.8 * width],
    extrapolate: 'clamp'
  });

  const firstSlideScaling = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [1, 0.8, 0.8],
    extrapolate: 'clamp'
  });

  const firstSlideMoving = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 0.05 * width, 0.05 * width],
    extrapolate: 'clamp'
  });

  const secondSlideScaling = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.8, 1, 0.8],
    extrapolate: 'clamp'
  });

  const secondSlideMoving = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [-0.05 * width, 0, 0.05 * width],
    extrapolate: 'clamp'
  });

  const thirdSlideScaling = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.8, 0.8, 1],
    extrapolate: 'clamp'
  });

  const thirdSlideMoving = windowAnimationValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [-0.05 * width, -0.05 * width, 0],
    extrapolate: 'clamp'
  });

  return (
    <GradientBackground>
      {/* Center content - takes up most of the screen */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ScrollView
          horizontal
          pagingEnabled
          snapToInterval={0.85 * width}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            height: 0.6 * height,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.05 * width,
            paddingHorizontal: 0.05 * width,
            marginTop: 0.15 * height,
          }}
          style={{ height: 0.6 * height, width: '100%' }}
          onMomentumScrollEnd={e => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / (0.85 * width));
            setSlide(newIndex);
          }}
          scrollEventThrottle={16}
        >
          <TouchableOpacity
            onPress={() => { setSlide(0); }}
            activeOpacity={1}
            style={{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center' }}
          >
            <Animated.View style={[{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center', transform: [{ scale: firstSlideScaling }] }]}>
              <Image source={require('@/assets/images/default_1.png')} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, borderRadius: 20 }} />
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>{textLanding[0]}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setSlide(1); }}
            activeOpacity={1}
            style={{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center' }}
          >
            <Animated.View style={[{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center', transform: [{ scale: secondSlideScaling }] }]}>
              <Image source={require('@/assets/images/default_2.png')} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, borderRadius: 20 }} />
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>{textLanding[1]}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setSlide(2); }}
            activeOpacity={1}
            style={{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center' }}
          >
            <Animated.View style={[{ width: 0.8 * width, height: '100%', justifyContent: 'center', alignItems: 'center', transform: [{ scale: thirdSlideScaling }] }]}>
              <Image source={require('@/assets/images/default_3.png')} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, borderRadius: 20 }} />
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>{textLanding[2]}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom button(s) - fixed at bottom */}
      <View style={tw`h-20 justify-center`}>
        {slide < 2 ? (
          <TouchableOpacity onPress={() => setSlide(slide + 1)}
            activeOpacity={0.7}
            style={tw`bg-white rounded-full py-2.5 w-full items-center`}>
            <Text
              style={[tw`text-black text-[16px]`,
              { fontFamily: 'Nunito-ExtraBold' }]}>Next
            </Text>
          </TouchableOpacity>
        ) : (
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
