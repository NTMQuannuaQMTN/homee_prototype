import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import tw from 'twrnc';

interface LogoutModalProps {
    visible: boolean;
    onLogout: () => void;
    onCancel: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ visible, onLogout, onCancel }) => {
    const [contentHeight, setContentHeight] = useState(0);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const pan = useRef(new Animated.ValueXY()).current;
    const [isModalMounted, setIsModalMounted] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderGrant: () => {
                slideAnim.stopAnimation();
                pan.setOffset({ x: 0, y: (slideAnim as any)._value });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (evt, gestureState) => {
                const clampedDy = Math.max(0, gestureState.dy);
                pan.setValue({ x: 0, y: clampedDy });
            },
            onPanResponderRelease: (evt, gestureState) => {
                pan.flattenOffset();
                const currentPosition = (pan.y as any)._value;
                const slideDownThreshold = contentHeight * 0.3;
                const velocityThreshold = 0.5;
                if (currentPosition > slideDownThreshold || gestureState.vy > velocityThreshold) {
                    Animated.timing(slideAnim, {
                        toValue: contentHeight,
                        duration: 250,
                        easing: Easing.in(Easing.cubic),
                        useNativeDriver: true,
                    }).start(() => {
                        onCancel();
                        pan.setValue({ x: 0, y: 0 });
                    });
                } else {
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 0,
                        speed: 10,
                    }).start(() => {
                        pan.setValue({ x: 0, y: 0 });
                    });
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            setIsModalMounted(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: contentHeight,
                duration: 250,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(() => {
                setIsModalMounted(false);
                pan.setValue({ x: 0, y: 0 });
            });
        }
    }, [visible, contentHeight]);

    if (!isModalMounted) return null;
    const combinedTranslateY = Animated.add(slideAnim, pan.y);

    // Handler for logout button
    const handleLogout = async () => {
        await onLogout();
        router.replace('/(auth)/login');
    };

    return (
        <Modal
            visible={visible || isModalMounted}
            animationType="none"
            transparent
            onRequestClose={onCancel}
            statusBarTranslucent
        >
            <View style={tw`flex-1 justify-end items-center`}>
                <TouchableOpacity
                    style={tw`absolute inset-0 bg-black/70`}
                    activeOpacity={1}
                    onPress={onCancel}
                />
                <Animated.View
                    style={[tw`w-full px-0 pt-6 pb-0 rounded-t-2xl`, { backgroundColor: '#080B32', maxHeight: '80%', transform: [{ translateY: combinedTranslateY }] }]}
                    {...panResponder.panHandlers}
                >
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View
                            style={{ flexDirection: 'column', justifyContent: 'space-between' }}
                            onLayout={e => setContentHeight(e.nativeEvent.layout.height)}
                        >
                            <View>
                                <View style={tw`w-12 h-1.5 bg-white/20 rounded-full self-center mb-4`} />
                                <Text style={[tw`text-white text-lg mb-4 text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Are you sure you want to log out?</Text>
                            </View>
                            <View style={tw`px-6 pb-8 flex-col gap-2`}>
                                <TouchableOpacity
                                    style={tw`bg-rose-600 rounded-full py-3 items-center`}
                                    onPress={handleLogout}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Log out</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={tw`bg-white/10 rounded-full py-3 items-center`}
                                    onPress={onCancel}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Not now</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default LogoutModal;
