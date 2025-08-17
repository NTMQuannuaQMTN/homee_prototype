import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Animated, Easing, Image, Modal, PanResponder, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import tw from 'twrnc';

import UploadIcon from '../../assets/icons/uploadwhite-icon.svg';

interface ImageModalProps {
    visible: boolean;
    onClose: () => void;
    imageOptions: any[];
    onSelect: (img: any) => void;
}


export default function ImageModal({ visible, onClose, imageOptions, onSelect }: ImageModalProps) {
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1
        });
        if (!result.canceled) {
            onSelect(result.assets[0].uri);
            onClose();
        }
    };

    // Shuffle function
    function shuffleArray<T>(array: T[]): T[] {
        const arr = array.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }


    // --- Draggable Modal Logic (from cohost.tsx) ---
    const MODAL_HEIGHT = 750;
    const slideAnim = React.useRef(new Animated.Value(MODAL_HEIGHT)).current;
    const pan = React.useRef(new Animated.ValueXY()).current;
    const [isModalMounted, setIsModalMounted] = React.useState(false);
    const [shuffledImages, setShuffledImages] = React.useState(imageOptions);

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
                const slideDownThreshold = MODAL_HEIGHT * 0.3;
                const velocityThreshold = 0.5;
                if (currentPosition > slideDownThreshold || gestureState.vy > velocityThreshold) {
                    Animated.timing(slideAnim, {
                        toValue: MODAL_HEIGHT,
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
    ).current;

    React.useEffect(() => {
        if (visible) {
            setShuffledImages(shuffleArray(imageOptions));
            setIsModalMounted(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: MODAL_HEIGHT,
                duration: 250,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(() => {
                setIsModalMounted(false);
                pan.setValue({ x: 0, y: 0 });
            });
        }
    }, [visible, imageOptions]);

    // ...existing code...
    if (!isModalMounted) return null;

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
                    style={tw`absolute inset-0 bg-black/50`}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <Animated.View
                    style={[
                        tw`w-full px-0 pt-6 pb-0 rounded-t-2xl`,
                        { backgroundColor: '#080B32', height: MODAL_HEIGHT },
                        { transform: [{ translateY: combinedTranslateY }] },
                    ]}
                >
                    <TouchableWithoutFeedback>
                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                            {/* Drag handle (draggable only here) */}
                            <View
                                style={tw`w-12 h-1.5 bg-white/20 rounded-full self-center mb-3`}
                                {...panResponder.panHandlers}
                            />
                            <View {...panResponder.panHandlers}>
                                <Text style={[tw`text-white text-[16px] mb-4`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>Choose a theme for your group 🔥</Text>
                            </View>
                            <View style={{ flex: 1, minHeight: 0, width: '100%' }}>
                                <ScrollView
                                    contentContainerStyle={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                        marginBottom: 0,
                                        width: '100%',
                                    }}
                                    keyboardShouldPersistTaps="handled"
                                    nestedScrollEnabled={true}
                                    scrollEnabled={true}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {/* First square: Upload your own */}
                                    <TouchableOpacity
                                        onPress={pickImage}
                                        style={{
                                            margin: 6,
                                            borderRadius: 12,
                                            overflow: 'hidden',
                                            borderWidth: 2,
                                            borderColor: '#7A5CFA',
                                            width: '45%',
                                            aspectRatio: 1,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: '#1A1A40',
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <UploadIcon width={32} height={32} />
                                        <Text style={{ color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 16, marginTop: 8, textAlign: 'center' }}>
                                            Upload your image
                                        </Text>
                                    </TouchableOpacity>
                                    {shuffledImages.map((img, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => { onSelect(img); onClose(); }}
                                            style={{
                                                margin: 6,
                                                borderRadius: 10,
                                                overflow: 'hidden',
                                                borderWidth: 0,
                                                borderColor: 'transparent',
                                                width: '45%',
                                                aspectRatio: 1, // square aspect ratio
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Image
                                                source={img}
                                                style={{ width: '100%', height: '100%', borderRadius: 10 }}
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            <View style={tw`pb-8 pt-4 px-4`}>
                                <TouchableOpacity
                                    style={tw`bg-[#7A5CFA] rounded-full flex-row justify-center py-2.5 items-center gap-1.5`}
                                    onPress={pickImage}
                                >
                                    <UploadIcon width={20} height={20} />
                                    <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Upload your image</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={tw`bg-white/5 rounded-full py-2.5 items-center mt-2`}
                                    onPress={onClose}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </View>
        </Modal>
    );
}