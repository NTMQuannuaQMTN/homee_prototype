import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import tw from 'twrnc';
interface EventDoneModalProps {
  visible: boolean;
  onClose: () => void;
  onPublish: () => void;
  onContinueEdit: () => void;
}

const MODAL_HEIGHT = 290;

export default function EventDoneModal({ visible, onClose, onPublish, onContinueEdit }: EventDoneModalProps) {
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const [isModalMounted, setIsModalMounted] = useState(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt: any, gestureState: any) => Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        slideAnim.stopAnimation();
        pan.setOffset({ x: 0, y: (slideAnim as any).__getValue() });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_evt: any, gestureState: any) => {
        const clampedDy = Math.max(0, gestureState.dy);
        pan.setValue({ x: 0, y: clampedDy });
      },
      onPanResponderRelease: (_evt: any, gestureState: any) => {
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
        toValue: MODAL_HEIGHT,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsModalMounted(false);
        pan.setValue({ x: 0, y: 0 });
      });
    }
  }, [visible]);
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
        <TouchableOpacity
          style={tw`absolute inset-0 bg-black/70`}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[tw`w-full px-0 pt-6 pb-0 rounded-t-2xl`, { backgroundColor: '#080B32', height: MODAL_HEIGHT }, { transform: [{ translateY: combinedTranslateY }] }]}
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <View>
                <View style={tw`w-12 h-1.5 bg-gray-500 rounded-full self-center mb-6`} />
                <Text style={[tw`text-white text-[17px] text-center mb-2`, { fontFamily: 'Nunito-ExtraBold' }]}>Ready to throw your event?</Text>
                </View>
              <View style={tw`px-6 pb-8 gap-2`}> 
                <TouchableOpacity
                  style={tw`bg-[#7A5CFA] rounded-full py-3 items-center`}
                  onPress={onPublish}
                  activeOpacity={0.85}
                >
                  <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Publish event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`bg-white/10 rounded-full py-3 items-center`}
                  onPress={onContinueEdit}
                  activeOpacity={0.85}
                >
                  <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Continue editing</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
}
