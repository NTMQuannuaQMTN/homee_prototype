import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Keyboard, Modal, PanResponder, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import tw from 'twrnc';

import Host from '../../assets/icons/host.svg'; // Assuming this SVG is correctly linked

interface Friend {
  id: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  profile_image?: string;
}

type Cohost = Friend | string;

interface CohostModalProps {
  visible: boolean;
  onClose: () => void;
  friends: Friend[];
  cohosts: Cohost[];
  onSave: (cohosts: Cohost[]) => void;
}

// Define a fixed height for the modal for consistent drag behavior.
// Adjust this value based on the actual content height you expect.
const MODAL_HEIGHT = 600; // This is the expected full height of the modal content when open

export default function CohostModal({ visible, onClose, friends, cohosts, onSave }: CohostModalProps) {
  const [localCohosts, setLocalCohosts] = useState<Cohost[]>(cohosts || []);
  const [input, setInput] = useState('');

  // Animated value for overall modal position (0 = fully open, MODAL_HEIGHT = fully closed/off-screen)
  // This will primarily drive the initial open/close animation.
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;

  // Animated.ValueXY for tracking drag gesture.
  // We'll add this to slideAnim to get the final translateY.
  const pan = useRef(new Animated.ValueXY()).current;

  // State to control when the Modal component is mounted/unmounted from the DOM
  const [isModalMounted, setIsModalMounted] = useState(false);

  // --- PanResponder Logic for Draggability ---
  const panResponder = useRef(
    PanResponder.create({
      // Aggressively claim the responder on touch start
      onStartShouldSetPanResponder: () => true,
      // Allow parent to intercept if it needs to (e.g., if content is scrollable)
      onStartShouldSetPanResponderCapture: () => false, // Set to false to allow children (like TextInput) to get responder first on tap
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only activate if the user is dragging vertically (more dy than dx)
        // and only if dragging downwards (gestureState.dy > 0) or slightly upwards from bottom
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // This is key: if the drag is predominantly vertical, capture it immediately.
        // This ensures the drag works from the handle and other parts of the modal.
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 0;
      },
      onPanResponderGrant: (evt, gestureState) => {
        slideAnim.stopAnimation();
        pan.setOffset({ x: 0, y: (slideAnim as any).__getValue() }); // Capture the current animated position as offset
        pan.setValue({ x: 0, y: 0 }); // Start pan from 0,0 relative to the offset
      },
      onPanResponderMove: (evt, gestureState) => {
        const clampedDy = Math.max(0, gestureState.dy);
        pan.setValue({ x: 0, y: clampedDy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset(); // Clear the offset, so future animations work from the new absolute position

        const currentPosition = (pan.y as any).__getValue ? (pan.y as any).__getValue() : 0; // This is the final drag position from start of drag
        const slideDownThreshold = MODAL_HEIGHT * 0.3; // Dismiss if dragged down 30% of modal height
        const velocityThreshold = 0.5; // Velocity for a quick flick for dismissal

        // If the user dragged down enough or swiped quickly
        if (currentPosition > slideDownThreshold || gestureState.vy > velocityThreshold) {
          // Animate to fully closed
          Animated.timing(slideAnim, { // Animate slideAnim to fully closed
            toValue: MODAL_HEIGHT,
            duration: 250,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            onClose(); // Trigger the parent's onClose to set visible=false
            pan.setValue({ x: 0, y: 0 }); // Reset pan position
          });
        } else {
          // Snap back to the fully open position if not dismissed
          Animated.spring(slideAnim, { // Animate slideAnim back to 0
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 10,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 }); // Reset pan position
          });
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setIsModalMounted(true); // Mount the Modal component
      Animated.timing(slideAnim, {
        toValue: 0, // Slide up to fully open position
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT, // Slide down to fully closed position
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsModalMounted(false); // Unmount Modal after animation completes
        pan.setValue({ x: 0, y: 0 }); // Ensure pan is reset when hidden
      });
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setLocalCohosts(cohosts || []);
    }
  }, [visible, cohosts]);

  const handleAddCohost = (friend: Friend) => {
    if (!localCohosts.some(c => typeof c !== 'string' && c.id === friend.id)) {
      setLocalCohosts([...localCohosts, friend]);
    }
  };

  const handleRemoveCohost = (cohostToRemove: Cohost) => {
    setLocalCohosts(prevCohosts =>
      prevCohosts.filter(cohost => {
        if (typeof cohostToRemove === 'string' && typeof cohost === 'string') {
          return cohost !== cohostToRemove;
        } else if (typeof cohostToRemove !== 'string' && typeof cohost !== 'string') {
          return cohost.id !== cohostToRemove.id;
        }
        return true; // Keep if types don't match or other cases
      })
    );
  };

  const handleCancel = () => {
    setLocalCohosts(cohosts || []); // Revert changes
    onClose(); // Trigger the parent's onClose, which will initiate the closing animation
  };

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
            {
              backgroundColor: '#080B32',
              height: MODAL_HEIGHT,
            },
            {
              transform: [{ translateY: combinedTranslateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <View>
                <View style={tw`w-12 h-1.5 bg-gray-500 rounded-full self-center mb-3`} />

                {/* Row: Clear button (left) + Manage hosts (center) */}
                <View style={[tw`mx-3 mb-4`, { position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 28 }]}> 
                  {/* Absolute Clear button on the left */}
                  <TouchableOpacity
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, justifyContent: 'center', paddingVertical: 2, paddingHorizontal: 4, zIndex: 2 }}
                    onPress={() => setLocalCohosts([])}
                    activeOpacity={0.7}
                  >
                    <Text style={[tw`text-[#7A5CFA] text-[13px]`, { fontFamily: 'Nunito-Bold' }]}>Clear</Text>
                  </TouchableOpacity>
                  {/* Centered title */}
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>Manage hosts</Text>
                  </View>
                </View>

                {/* Cohost input section */}
                <View style={tw`mb-3 mx-3 bg-white/10 rounded-xl px-3 py-4`}>
                  <View style={tw`flex-row justify-start items-center gap-2`}>
                    <Host style={tw`-mt-0.5`} width={12} height={12} />
                    <TextInput
                      style={[tw`text-white text-[13px] w-full`, { fontFamily: 'Nunito-Medium' }]}
                      placeholder='Cohosts (club, organization, person, etc.)'
                      placeholderTextColor={'#9CA3AF'}
                      value={input}
                      onChangeText={setInput}
                      onSubmitEditing={e => {
                        if (input !== '') {
                          setLocalCohosts([...localCohosts, input]);
                        }
                        setInput('');
                      }}
                    />
                  </View>
                  {localCohosts.length > 0 ? (
                    <View style={tw`mt-2 flex-row flex-wrap gap-1.5`}>
                      {localCohosts.map((cohost, idx) => {
                        if (typeof cohost === 'string') {
                          return (
                            <TouchableOpacity
                              key={`cohost-string-${idx}`}
                              style={tw`flex-row items-center bg-yellow-600 rounded-full px-3 py-2 gap-2`}
                              onPress={() => handleRemoveCohost(cohost)}
                              activeOpacity={0.7}
                            >
                              <Text style={[tw`text-white`, { fontFamily: 'Nunito-Bold' }]}>
                                <Ionicons name="close" size={14} color="#fff" />
                              </Text>
                              <Text style={[tw`text-white`, { fontFamily: 'Nunito-Bold' }]}>{cohost}</Text>
                            </TouchableOpacity>
                          );
                        } else if (cohost && typeof cohost === 'object') {
                          return (
                            <TouchableOpacity
                              key={cohost.id}
                              style={tw`flex-row items-center bg-yellow-600 rounded-full px-3 py-2 gap-2`}
                              onPress={() => handleRemoveCohost(cohost)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="close" size={14} color="#fff" />
                              <Image
                                source={cohost.profile_image ? { uri: cohost.profile_image } : require('../../assets/icons/pfpdefault.svg')}
                                style={{ width: 24, height: 24, borderRadius: 12 }}
                                resizeMode="cover"
                                defaultSource={require('../../assets/icons/pfpdefault.svg')}
                              />
                              <Text style={[tw`text-white`, { fontFamily: 'Nunito-Bold' }]}>{cohost.firstname}</Text>
                            </TouchableOpacity>
                          );
                        } else {
                          return null;
                        }
                      })}
                    </View>
                  ) : null}
                </View>

                {/* Friends list section */}
                <Text style={[tw`mx-3 text-white mb-2.5`, { fontFamily: 'Nunito-ExtraBold' }]}>Your friends</Text>
                <View style={tw`mb-4 mx-3`}>
                  {friends && friends.length > 0 ? friends.map((friend: Friend) => (
                    <View
                      key={friend?.id}
                      style={tw`flex-row items-center bg-white/10 rounded-xl mb-2.5 p-3`}
                    >
                      <Image
                        source={
                          friend?.profile_image
                            ? { uri: friend.profile_image }
                            : require('../../assets/icons/pfpdefault.svg')
                        }
                        style={tw`w-10 h-10 rounded-full mr-2.5`}
                        resizeMode="cover"
                        defaultSource={require('../../assets/icons/pfpdefault.svg')}
                      />
                      <View style={tw`flex-1`}>
                        <Text style={[tw`text-white text-[15px] -mb-0.5`, { fontFamily: 'Nunito-ExtraBold' }]}>
                          {friend?.firstname} {friend?.lastname}
                        </Text>
                        <Text style={[tw`text-gray-400 text-[13px]`, { fontFamily: 'Nunito-Medium' }]}>
                          @{friend?.username}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={tw`bg-[#7A5CFA] rounded-full px-4 py-2`}
                        onPress={() => handleAddCohost(friend)}
                      >
                        <Text style={[tw`text-white text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Add cohost</Text>
                      </TouchableOpacity>
                    </View>
                  )) : (
                    <Text style={[tw`bg-rose-600/70 text-white text-[13px] text-center p-2 rounded-xl mt-2 mb-2 leading-[1.2]`, { fontFamily: 'Nunito-Medium' }]}>Oops, you gotta add some friends before having them cohort events with you 🫠</Text>
                  )}
                </View>
              </View>
              {/* Save and Cancel buttons always at the bottom */}
              <View style={tw`px-3 pb-8`}> 
                <TouchableOpacity
                  style={[
                    tw`bg-[#7A5CFA] rounded-full py-3 items-center mb-2`,
                    { opacity: JSON.stringify(localCohosts) === JSON.stringify(cohosts) ? 0.2 : 1 }
                  ]}
                  onPress={() => { onSave(localCohosts); onClose(); }}
                  activeOpacity={0.8}
                  disabled={JSON.stringify(localCohosts) === JSON.stringify(cohosts)}
                >
                  <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[tw`bg-white/5 rounded-full py-3 items-center`, { opacity: 1 }]}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
}