import React from 'react';
import { Animated, Easing, Modal, PanResponder, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import tw from 'twrnc';

interface DecisionProps {
    visible: boolean;
    onClose: () => void;
    eventTitle: string;
    maybe: boolean;
    onSelect: (decision: string) => void;
}


export default function DecisionModal({ visible, onClose, eventTitle, maybe, onSelect }: DecisionProps) {
    const [contentHeight, setContentHeight] = React.useState(0);
    const slideAnim = React.useRef(new Animated.Value(0)).current;
    const pan = React.useRef(new Animated.ValueXY()).current;
    const [isModalMounted, setIsModalMounted] = React.useState(false);

    // PanResponder for drag-to-dismiss
    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
                return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 0;
            },
            onPanResponderGrant: () => {
                slideAnim.stopAnimation();
                pan.setOffset({ x: 0, y: (slideAnim as any).__getValue() });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (evt, gestureState) => {
                const clampedDy = Math.max(0, gestureState.dy);
                pan.setValue({ x: 0, y: clampedDy });
            },
            onPanResponderRelease: (evt, gestureState) => {
                pan.flattenOffset();
                const currentPosition = (pan.y as any).__getValue ? (pan.y as any).__getValue() : 0;
                const slideDownThreshold = contentHeight * 0.3;
                const velocityThreshold = 0.5;
                if (currentPosition > slideDownThreshold || gestureState.vy > velocityThreshold) {
                    Animated.timing(slideAnim, {
                        toValue: contentHeight,
                        duration: 250,
                        easing: Easing.in(Easing.cubic),
                        useNativeDriver: true,
                    }).start(() => {
                        onClose();
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
    );

    React.useEffect(() => {
        if (visible && contentHeight > 0) {
            setIsModalMounted(true);
            slideAnim.setValue(contentHeight);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        } else if (!visible && contentHeight > 0) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, contentHeight]);

    if (!isModalMounted && !visible) return null;

    const combinedTranslateY = Animated.add(slideAnim, pan.y);

    return (
        <Modal
            visible={visible || isModalMounted}
            animationType="none"
            transparent
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={tw`flex-1 justify-end items-center`}>
                {/* Backdrop for closing the modal by tapping outside */}
                <TouchableOpacity
                    style={tw`absolute inset-0 bg-black/70`}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <Animated.View
                    style={[
                        tw`w-full px-0 pt-6 pb-0 rounded-t-2xl`,
                        { backgroundColor: '#080B32' },
                        { transform: [{ translateY: combinedTranslateY }] },
                    ]}
                    {...panResponder.current.panHandlers}
                >
                    <TouchableWithoutFeedback>
                        <View
                            style={{ flexDirection: 'column', justifyContent: 'space-between' }}
                            onLayout={e => {
                                const h = e.nativeEvent.layout.height;
                                if (h !== contentHeight) setContentHeight(h);
                            }}
                        >
                            {/* Draggable handle bar */}
                            <View style={tw`w-12 h-1.5 bg-gray-500 rounded-full self-center mb-3`} />
                            <View style={tw`pb-10 pt-1 px-4 gap-y-3`}>
                                {/* Header row: Clear button (left) + Centered title */}
                                <View style={[tw`mb-2`, { position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 28 }]}> 
                                    {/* Absolute Clear button on the left */}
                                    <TouchableOpacity
                                        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, justifyContent: 'center', paddingVertical: 2, paddingHorizontal: 4, zIndex: 2 }}
                                        onPress={() => { onSelect('Not RSVP'); }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[tw`text-[#7A5CFA] text-[13px]`, { fontFamily: 'Nunito-Bold' }]}>Reset</Text>
                                    </TouchableOpacity>
                                    {/* Centered title */}
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={[tw`text-white text-[15px] mx-12`, { fontFamily: 'Nunito-Medium', textAlign: 'center' }]}>Going to <Text style={{ fontFamily: 'Nunito-ExtraBold' }}>{eventTitle}</Text>?</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={tw`bg-green-500 rounded-xl flex-row justify-center py-2.5 items-center`}
                                    onPress={() => {onSelect('Going')}}
                                >
                                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>I'm going 🥳</Text>
                                </TouchableOpacity>
                                {maybe && <TouchableOpacity
                                    style={tw`bg-yellow-600 rounded-xl flex-row justify-center py-2.5 items-center`}
                                    onPress={() => {onSelect('Maybe')}}
                                >
                                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Eh...maybe 🤔</Text>
                                </TouchableOpacity>}
                                <TouchableOpacity
                                    style={tw`bg-rose-600 rounded-xl flex-row justify-center py-2.5 items-center`}
                                    onPress={() => {onSelect('Nope')}}
                                >
                                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>I can't 😭</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </View>
        </Modal>
    );
}