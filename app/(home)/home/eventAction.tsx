import { supabase } from '@/utils/supabase';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import tw from 'twrnc';
// Centralized event actions generator
export function getEventActions({
  event,
  user,
  cohosts,
  push,
  setActionModalVisible,
  onDeleteDraft,
  onDelete,
  onReportEvent,
  fromUpcoming,
  fromExplore,
  fromFriendsEvents,
  fromAllEvents,
}: {
  event: any;
  user: any;
  cohosts: any[];
  push: any;
  setActionModalVisible: (v: boolean) => void;
  onDeleteDraft?: (id: string) => Promise<void>;
  onDelete?: (id: string) => void;
  onReportEvent?: (id: string) => void;
  fromUpcoming?: boolean;
  fromExplore?: boolean;
  fromFriendsEvents?: boolean;
  fromAllEvents?: boolean;
}) {
  if (event.isDraft) {
    return getDraftActions(
      () => {
        setActionModalVisible(false);
        push({ pathname: '/(create)/create', params: { id: event.id } });
      },
      async () => {
        setActionModalVisible(false);
        if (onDeleteDraft) {
          await onDeleteDraft(event.id);
        } else {
          try {
            await supabase.from('events').delete().eq('id', event.id);
          } catch (e) {}
        }
      }
    );
  }
  if (user.id === event.host_id) {
    return [
      {
        label: 'Edit event',
        color: 'bg-[#7A5CFA]',
        onPress: () => {
          setActionModalVisible(false);
          push({ pathname: '/(create)/create', params: { id: event.id } });
        }
      },
      {
        label: 'Delete event',
        destructive: true,
        color: 'bg-rose-600',
        onPress: async () => {
          setActionModalVisible(false);
          try {
            // Delete the event from the database
            await supabase.from('events').delete().eq('id', event.id);
            // Also attempt to remove any images with the name as the event id from storage
            try {
              // Try removing both possible extensions (jpg and png)
              await supabase.storage.from('sizzl-profileimg').remove([
                `event_cover/${event.id}.jpg`,
                `event_cover/${event.id}.jpeg`,
                `event_cover/${event.id}.png`,
                `event_cover/${event.id}`
              ]);
            } catch (err) {
              // Ignore errors for missing files
            }
            
            if (onDelete) {
              onDelete(event.id);
            }
          } catch (e) {}
        }
      }
    ];
  }
  if (Array.isArray(cohosts) && cohosts.indexOf(user.id) >= 0) {
    return [
      {
        label: 'Edit event',
        color: 'bg-[#7A5CFA]',
        onPress: () => {
          setActionModalVisible(false);
          push({ pathname: '/(create)/create', params: { id: event.id } });
        }
      }
    ];
  }
  if (fromUpcoming || fromExplore || fromFriendsEvents || fromAllEvents) {
    return [
      {
        label: 'Report event',
        color: 'bg-rose-600',
        destructive: true,
        onPress: () => {
          setActionModalVisible(false);
          push({ pathname: '/eventreports', params: { eventId: event.id } });
        }
      }
    ];
  }
  return [];
}

export type EventActionModalProps = {
  visible: boolean;
  onClose: () => void;
  actions: Array<{
    label: string;
    onPress: () => void;
    color?: string;
    textStyle?: object;
  }>;
  title?: string;
};

// Helper: preset actions for draft scenario
export function getDraftActions(onContinue: () => void, onDelete: () => void) {
  return [
    {
      label: 'Continue editing',
      onPress: onContinue,
      color: 'bg-[#7A5CFA]'
    },
    {
      label: 'Delete draft',
      onPress: onDelete,
      color: 'bg-rose-600',
      textStyle: { fontFamily: 'Nunito-ExtraBold' }
    }
  ];
}

// Remove fixed modal height

const EventActionModal: React.FC<EventActionModalProps> = ({ visible, onClose, actions, title }) => {
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
          style={[tw`w-full px-0 pt-6 pb-0 rounded-t-2xl`, { backgroundColor: '#080B32', maxHeight: '80%', transform: [{ translateY: combinedTranslateY }] }]}
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={{ flexDirection: 'column', justifyContent: 'space-between' }}
              onLayout={e => setContentHeight(e.nativeEvent.layout.height)}
            >
              <View>
                <View style={tw`w-12 h-1.5 bg-gray-500 rounded-full self-center mb-4`} />
                {title && <Text style={[tw`text-white text-[16px] mb-4 text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>{title}</Text>}
              </View>
              <View style={tw`px-6 pb-8 flex-col gap-2`}>
                {actions.map((action, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={tw`${action.color || 'bg-white/10'} rounded-full py-3 items-center`}
                    onPress={action.onPress}
                    activeOpacity={0.8}
                  >
                    <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }, action.textStyle || {}]}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default EventActionModal;
