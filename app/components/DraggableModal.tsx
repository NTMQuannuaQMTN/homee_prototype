
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, TouchableOpacity, View, Text, ViewStyle } from 'react-native';
import tw from 'twrnc';


export interface DraggableModalButton {
  label: string;
  onPress: () => void | Promise<void>;
  icon?: React.ReactNode;
  color?: string; // tailwind or hex
  textColor?: string; // tailwind or hex
  style?: any;
  testID?: string;
}

interface DraggableModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  buttons?: DraggableModalButton[];
  children?: React.ReactNode;
  containerStyle?: ViewStyle;
  modalStyle?: ViewStyle;
  backdropStyle?: ViewStyle;
}

const DraggableModal: React.FC<DraggableModalProps> = ({
  visible,
  onClose,
  title,
  buttons,
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
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (!visible && modalContentHeight > 0) {
      Animated.timing(slideAnim, {
        toValue: modalContentHeight,
        duration: 300,
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
            tw`w-full px-0 py-6 rounded-t-2xl`,
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
          <View style={tw`w-12 h-1.5 bg-white/20 rounded-full self-center mb-3`} />
          {title && (
            <Text style={[tw`text-white text-[16px] mb-5 text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>{title}</Text>
          )}
          {buttons && (
            <View style={tw`px-6`}>
              {buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={btn.label + idx}
                  style={[
                    tw`${btn.color || 'bg-white/5'} rounded-xl py-3 mb-2.5 items-center flex-row justify-center`,
                    btn.style,
                  ]}
                  onPress={btn.onPress}
                  activeOpacity={0.7}
                  testID={btn.testID}
                >
                  {btn.icon && <View style={tw`mr-1.5`}>{btn.icon}</View>}
                  <Text style={[
                    tw`${btn.textColor || 'text-white'} text-[15px]`,
                    { fontFamily: 'Nunito-ExtraBold' },
                  ]}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default DraggableModal;
