import React, { useEffect } from 'react';
import { Animated, useAnimatedValue, View } from 'react-native';
import tw from 'twrnc';

export default function Loader() {
    const panAnimation = useAnimatedValue(0);
    const beefAnimation = useAnimatedValue(0);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(panAnimation, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(panAnimation, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(beefAnimation, {
                    toValue: 2,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(beefAnimation, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const panRotate = panAnimation.interpolate({
        inputRange: [0, 0.1, 1],
        outputRange: ['20deg', '40deg', '-30deg'],
        extrapolate: 'clamp',
    });

    const beefRotate = beefAnimation.interpolate({
        inputRange: [0, 1, 2],
        outputRange: ['0deg', '270deg', '540deg'],
        extrapolate: 'clamp',
    });

    const beefVertical = beefAnimation.interpolate({
        inputRange: [0, 0.1, 1, 1.9, 2],
        outputRange: [10, 15, -100, 18, 10],
        extrapolate: 'clamp',
    });

    return (
        <View style={tw`flex-1 h-100 items-center justify-center`}>
            <Animated.View style={[tw`absolute ml-22 items-center justify-center w-40 h-40`, {
                transform: [
                    { translateY: beefVertical },
                ]
            }]}>
                <Animated.View
                    style={[
                        tw`items-center justify-center w-16 h-4 absolute bg-[#FF0000]`,
                        {
                            transform: [
                                { rotate: beefRotate }
                            ]
                        }
                    ]}
                >
                </Animated.View>
            </Animated.View>
            <Animated.View style={[
                tw`items-center justify-center flex-row`,
                { transform: [{ rotate: panRotate }] }
            ]}>
                <View style={tw`bg-black w-20 h-4 rounded-l-lg`}></View>
                <View style={tw`bg-gray-500 w-20 h-8 rounded-b-lg mt-4`}></View>
            </Animated.View>
        </View>
    );
}
