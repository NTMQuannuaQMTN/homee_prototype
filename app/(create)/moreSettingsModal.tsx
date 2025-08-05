
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, Switch, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import tw from 'twrnc';

interface MoreSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  list: { public: boolean; maybe: boolean };
  setList: (list: { public: boolean; maybe: boolean }) => void;
}


const MoreSettingsModal: React.FC<MoreSettingsModalProps> = ({ visible, onClose, list, setList }) => {

  // Draggable modal logic (from cohost.tsx)
  const MODAL_HEIGHT = 400;
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const [isModalMounted, setIsModalMounted] = useState(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 0;
      },
      onPanResponderGrant: (evt, gestureState) => {
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
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback accessible={false}>
            <View style={{ flex: 1, flexDirection: 'column', height: '100%' }}>
              {/* Handle bar */}
              <View style={tw`w-12 h-1.5 bg-gray-500 rounded-full self-center mb-3`} />
              {/* ...existing code... */}

              {/* Title row with centered title and reset button */}
              <View style={[tw`flex-row items-center mb-4`, { position: 'relative', minHeight: 0 }]}> 
                {/* Reset button on the left */}
                <TouchableOpacity
                  onPress={() => setList({ public: false, maybe: false })}
                  style={tw`px-4 py-1`}
                  activeOpacity={0.7}
                >
                  <Text style={[tw`text-[#7A5CFA] text-[13px]`, { fontFamily: 'Nunito-Bold' }]}>Reset</Text>
                </TouchableOpacity>
                {/* Centered title */}
                <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' }}>
                  <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>More settings</Text>
                </View>
              </View>

              {/* Public List Toggle */}
              <View style={tw`flex-row items-center justify-between mb-2 mx-4 bg-white/10 rounded-xl px-4 py-3`}>
                <View style={tw`flex-1`}> 
                  <Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-Bold' }]}>Make "Guest List" public 👀</Text>
                  <Text style={[tw`text-gray-400 text-xs mt-1 leading-[1.2]`, { fontFamily: 'Nunito-Regular' }]}>Even non-RSVP'ed people can see who's attending your event</Text>
                </View>
                <Switch
                  value={list.public}
                  onValueChange={v => setList({ ...list, public: v })}
                  trackColor={{ false: '#ccc', true: '#7A5CFA' }}
                  thumbColor={list.public ? '#ffffff' : '#f4f3f4'}
                />
              </View>

              {/* Maybe List Toggle */}
              <View style={tw`flex-row items-center justify-between mb-4 mx-4 bg-white/10 rounded-xl px-4 py-3`}>
                <View style={tw`flex-1`}> 
                  <Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-Bold' }]}>Guests can respond "Maybe" 🤔</Text>
                  <Text style={[tw`text-gray-400 text-xs mt-1 leading-[1.2]`, { fontFamily: 'Nunito-Regular' }]}>Your guests can be a lil indecisive with their decisions</Text>
                </View>
                <Switch
                  value={list.maybe}
                  onValueChange={v => setList({ ...list, maybe: v })}
                  trackColor={{ false: '#ccc', true: '#7A5CFA' }}
                  thumbColor={list.maybe ? '#ffffff' : '#f4f3f4'}
                />
              </View>

              {/* Close button always at the bottom */}
              <View style={[tw`px-4 pb-8`, { marginTop: 'auto' }]}> 
                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    tw`bg-[#7A5CFA] rounded-full py-3 items-center`,
                    { opacity: 1 }
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default MoreSettingsModal; 