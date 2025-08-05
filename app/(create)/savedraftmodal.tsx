


import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import tw from 'twrnc';

type SaveDraftModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaveDraft: () => void;
  onContinueEditing: () => void;
  onDiscardEvent: () => void;
};

const MODAL_HEIGHT = 280;

const SaveDraftModal: React.FC<SaveDraftModalProps> = ({ visible, onClose, onSaveDraft, onContinueEditing, onDiscardEvent }) => {
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
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
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <View>
                <View style={tw`w-12 h-1.5 bg-gray-500 rounded-full self-center mb-6`} />
                <Text style={[tw`text-white text-[17px] mb-3 text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Save this for later?</Text>
              </View>
              <View style={tw`px-6 pb-8 flex-col gap-2`}>
                <TouchableOpacity
                  style={tw`bg-[#7A5CFA] rounded-full py-3 items-center`}
                  onPress={onSaveDraft}
                  activeOpacity={0.8}
                >
                  <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Save draft</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`bg-white/10 rounded-full py-3 items-center`}
                  onPress={onContinueEditing}
                  activeOpacity={0.8}
                >
                  <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Continue editing</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`py-3 items-center`}
                  onPress={onDiscardEvent}
                  activeOpacity={0.8}
                >
                  <Text style={[tw`text-gray-400 text-[13px]`, { fontFamily: 'Nunito-Medium' }]}>Discard event</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SaveDraftModal;
