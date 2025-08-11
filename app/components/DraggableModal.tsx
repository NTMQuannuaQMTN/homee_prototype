import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import tw from 'twrnc';

interface DraggableModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  modalStyle?: ViewStyle;
  backdropStyle?: ViewStyle;
}

const DraggableModal: React.FC<DraggableModalProps> = ({
  visible,
  onClose,
  children,
  containerStyle,
  modalStyle,
  backdropStyle,
}) => {
  const [modalContentHeight, setModalContentHeight] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
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
        const slideDownThreshold = modalContentHeight * 0.3;
        const velocityThreshold = 0.5;
        if (currentPosition > slideDownThreshold || gestureState.vy > velocityThreshold) {
          Animated.timing(slideAnim, {
            toValue: modalContentHeight,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            onClose();
            setIsMounted(false);
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
    if (visible && modalContentHeight > 0) {
      setIsMounted(true);
      slideAnim.setValue(modalContentHeight);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (!visible && modalContentHeight > 0) {
      Animated.timing(slideAnim, {
        toValue: modalContentHeight,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsMounted(false);
        pan.setValue({ x: 0, y: 0 });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, modalContentHeight]);

  if (!visible && !isMounted) return null;

  return (
    <Modal
      visible={visible || isMounted}
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[tw`flex-1 justify-end items-center`, containerStyle]}> 
        {/* Backdrop */}
        <TouchableOpacity
          style={[tw`absolute inset-0 bg-black/50`, backdropStyle]}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            tw`w-full px-0 pt-6 pb-10 rounded-t-2xl`,
            { backgroundColor: '#080B32' },
            modalStyle,
            {
              transform: [{ translateY: Animated.add(slideAnim, pan.y) }],
            },
          ]}
          {...panResponder.panHandlers}
          onLayout={e => {
            const h = e.nativeEvent.layout.height;
            if (h !== modalContentHeight && h > 0) setModalContentHeight(h);
          }}
        >
          {/* Drag handle */}
          <View style={tw`w-12 h-1.5 bg-gray-500 rounded-full self-center mb-3`} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default DraggableModal;
