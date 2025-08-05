import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import tw from 'twrnc';

interface RSVPDeadlineModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate: Date;
  initialTime: string;
  minDate: Date;
  maxDate: Date;
  onSave: (date: Date, time: string) => void;
}

const MODAL_HEIGHT = 750;

const RSVPDeadlineModal: React.FC<RSVPDeadlineModalProps> = ({ visible, onClose, initialDate, initialTime, minDate, maxDate, onSave }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  // Time picker logic (15-min intervals)
  const getTimeOptions = () => {
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = h % 12 === 0 ? 12 : h % 12;
        const ampm = h < 12 ? 'am' : 'pm';
        const min = m.toString().padStart(2, '0');
        options.push(`${hour}:${min}${ampm}`);
      }
    }
    return options;
  };
  const timeOptions = getTimeOptions();
  // Default to closest future time
  const now = new Date();
  let defaultTime = timeOptions[0];
  for (const t of timeOptions) {
    const match = t.match(/(\d+):(\d+)(am|pm)/i);
    if (!match) continue;
    let [_, hourStr, minStr, ampm] = match;
    let hour = Number(hourStr);
    let minute = Number(minStr);
    if (ampm === 'pm' && hour !== 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    if (hour > now.getHours() || (hour === now.getHours() && minute > now.getMinutes())) {
      defaultTime = t;
      break;
    }
  }
  const [selectedTime, setSelectedTime] = useState(initialTime === '' ? defaultTime : initialTime);
  // Dropdown modal state for time picker
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  // Set minDate to today in local time zone, formatted as 'YYYY-MM-DD'
  const today = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const localTodayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // --- Draggable Modal Logic (from cohost.tsx) ---
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
            { backgroundColor: '#080B32', marginBottom: 0, paddingHorizontal: 0, paddingBottom: 0, height: MODAL_HEIGHT },
            {
              transform: [
                { translateY: Animated.add(slideAnim, pan.y) },
              ],
            },
          ]}
        >
          <TouchableWithoutFeedback accessible={false}>
            <View style={{ flex: 1, flexDirection: 'column'}}>
              <View style={{ flex: 1 }}>
              {/* Draggable area: drag handle, header, tabs, and date picker */}
              <View {...panResponder.panHandlers}>
                <View style={tw`w-12 h-1.5 bg-gray-500 rounded-full self-center mb-3`} />
                {/* <View style={{ flex: 1, flexDirection: 'column' }}> */}
                  <View style={[tw`flex-row items-center mb-4`, { position: 'relative', minHeight: 0 }]}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedDate(initialDate);
                        setSelectedTime(initialTime === '' ? defaultTime : initialTime);
                      }}
                      style={tw`px-4 py-1`}
                      activeOpacity={0.7}
                    >
                      <Text style={[tw`text-[#7A5CFA] text-[13px]`, { fontFamily: 'Nunito-Bold' }]}>Clear</Text>
                    </TouchableOpacity>
                    <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' }}>
                      <Text style={[tw`text-white text-[15px]`, { fontFamily: 'Nunito-ExtraBold', textAlign: 'center' }]}>Set RSVP deadline</Text>
                    </View>
                  </View>
                  <View style={[tw`mx-3 gap-y-2 rounded-xl overflow-hidden`]}>
                    {/* <View {...panResponder.panHandlers}> */}
                    <Calendar
                      current={selectedDate.toISOString().split('T')[0]}
                      onDayPress={day => {
                        // The issue is that new Date(year, month - 1, date) creates a Date in local time,
                        // but Calendar's day.dateString is in 'YYYY-MM-DD' (UTC midnight).
                        // To avoid timezone offset issues, construct the date as UTC:
                        const [year, month, dayNum] = day.dateString.split('-').map(Number);
                        const selected = new Date(Date.UTC(year, month - 1, dayNum));
                        setSelectedDate(selected);
                      }}
                      minDate={localTodayStr}
                      maxDate={maxDate.toISOString().split('T')[0]}
                      markedDates={{
                        [selectedDate.toISOString().split('T')[0]]: {
                          selected: true,
                          selectedColor: '#7A5CFA',
                        },
                      }}
                      theme={{
                        calendarBackground: '#212346',
                        textSectionTitleColor: '#ffffff',
                        selectedDayBackgroundColor: '#7A5CFA',
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: '#7A5CFA',
                        dayTextColor: '#ffffff',
                        textDisabledColor: '#3A4A5A',
                        monthTextColor: '#ffffff',
                        arrowColor: '#7A5CFA',
                        textDayFontFamily: 'Nunito-Medium',
                        textMonthFontFamily: 'Nunito-ExtraBold',
                        textDayHeaderFontFamily: 'Nunito-Medium',
                        textDayFontSize: 13,
                        textMonthFontSize: 14,
                        textDayHeaderFontSize: 13,
                      }}
                      dayComponent={({ date, state, marking, onPress }) => {
                        const isSelected = marking && marking.selected;
                        const isDisabled = state === 'disabled';
                        const cellSize = 28;
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isToday = date && date.dateString === todayStr;
                        return (
                          <TouchableOpacity
                            disabled={isDisabled || !date}
                            onPress={() => {
                              if (onPress && date) onPress(date);
                            }}
                            activeOpacity={0.7}
                            style={[{
                              justifyContent: 'center',
                              alignItems: 'center',
                              alignSelf: 'center',
                              width: cellSize,
                              height: cellSize,
                            },
                            isSelected && {
                              backgroundColor: '#7A5CFA',
                              borderRadius: cellSize / 2,
                            },
                            ]}
                          >
                            {date ? (
                              <Text
                                style={[
                                  { fontFamily: isSelected ? 'Nunito-ExtraBold' : 'Nunito-Medium', fontSize: 13 },
                                  isSelected
                                    ? { color: '#fff' }
                                    : isDisabled
                                      ? { color: '#3A4A5A' }
                                      : isToday
                                        ? { color: '#7A5CFA' }
                                        : { color: '#fff' },
                                  { textAlign: 'center' },
                                ]}
                              >
                                {date.day}
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                </View>
                
                {/* Time Picker - Dropdown Modal */}
              <View style={tw`items-center mt-2 mx-3 bg-white/10 rounded-xl mb-2 p-3`}>
                <Text style={[tw`text-white mb-2`, { fontFamily: 'Nunito-Bold', fontSize: 14 }]}>Select time</Text>
                <TouchableOpacity
                  style={[
                    tw`w-full rounded-lg py-3 px-4 mb-1 flex-row items-center justify-center`,
                    { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: '#7A5CFA' }
                  ]}
                  onPress={() => setShowTimeDropdown(true)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#fff', fontFamily: 'Nunito-ExtraBold', fontSize: 16, marginRight: 8 }}>
                    {selectedTime}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#fff" />
                </TouchableOpacity>
                
                {/* Time Dropdown Modal */}
                <Modal
                  visible={!!showTimeDropdown}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowTimeDropdown(false)}
                >
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={1}
                    onPress={() => setShowTimeDropdown(false)}
                  >
                    <View style={{ width: 260, maxHeight: 350, backgroundColor: '#212346', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 0 }}>
                      <ScrollView showsVerticalScrollIndicator={true}>
                        {timeOptions.map((t) => {
                          const isSelected = selectedTime === t;
                          return (
                            <TouchableOpacity
                              key={t}
                              onPress={() => {
                                setSelectedTime(t);
                                setShowTimeDropdown(false);
                              }}
                              style={{
                                paddingVertical: 12,
                                paddingHorizontal: 24,
                                backgroundColor: isSelected ? '#7A5CFA' : 'transparent',
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ color: '#fff', fontFamily: isSelected ? 'Nunito-ExtraBold' : 'Nunito-Medium', fontSize: 15 }}>{t}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </View>
            </View>
              {/* Custom warning for RSVP deadline not before event start time */}
              {(() => {
                // Calculate RSVP deadline Date object
                const match = selectedTime.match(/(\d+):(\d+)(am|pm)/i);
                let hour = 0, minute = 0;
                if (match) {
                  hour = Number(match[1]);
                  minute = Number(match[2]);
                  const ampm = match[3];
                  if (ampm === 'pm' && hour !== 12) hour += 12;
                  if (ampm === 'am' && hour === 12) hour = 0;
                }
                const combined = new Date(selectedDate);
                combined.setHours(hour, minute, 0, 0);
                return { combined };
              })().combined && (() => {
                // Consider start date unset if maxDate is missing, invalid, epoch, or today
                const isUnsetStart =
                  !maxDate ||
                  isNaN(maxDate.getTime()) ||
                  maxDate.getTime() === 0 ||
                  (maxDate.toDateString && maxDate.toDateString() === new Date().toDateString());
                const match = selectedTime.match(/(\d+):(\d+)(am|pm)/i);
                let hour = 0, minute = 0;
                if (match) {
                  hour = Number(match[1]);
                  minute = Number(match[2]);
                  const ampm = match[3];
                  if (ampm === 'pm' && hour !== 12) hour += 12;
                  if (ampm === 'am' && hour === 12) hour = 0;
                }
                const combined = new Date(selectedDate);
                combined.setHours(hour, minute, 0, 0);
                if (isUnsetStart) {
                  return (
                    <View style={tw`mb-2 w-full px-3`}>
                      <View style={tw`bg-yellow-600 rounded-lg p-2.5 items-center`}>
                        <Text style={[tw`text-white text-[13px]`, { fontFamily: 'Nunito-Bold', textAlign: 'center' }]}>
                          📢 It's recommended you choose the start date first!
                        </Text>
                      </View>
                    </View>
                  );
                }
                if (combined.getTime() > maxDate.getTime()) {
                  return (
                    <View style={tw`mb-2 w-full px-3`}>
                      <View style={tw`bg-rose-600 rounded-lg p-2.5 items-center`}>
                        <Text style={[tw`text-white text-[13px]`, { fontFamily: 'Nunito-Bold', textAlign: 'center' }]}>
                          ⚠️ The deadline must be before the event's start time
                        </Text>
                      </View>
                    </View>
                  );
                }
                return null;
              })()}
              {/* Save/Cancel buttons always at the bottom */}
              <View style={[tw`flex-row px-3 pb-8`, { marginTop: 'auto' }]}>
                <View style={{ flex: 1, flexDirection: 'column' }}>
                  <TouchableOpacity
                    style={[
                      tw`bg-[#7A5CFA] rounded-full py-3 items-center mb-2`,
                      (() => {
                        // Disable and fade if RSVP deadline is after event start time
                        const isUnsetStart =
                          !maxDate ||
                          isNaN(maxDate.getTime()) ||
                          maxDate.getTime() === 0 ||
                          (maxDate.toDateString && maxDate.toDateString() === new Date().toDateString());
                        const match = selectedTime.match(/(\d+):(\d+)(am|pm)/i);
                        let hour = 0, minute = 0;
                        if (match) {
                          hour = Number(match[1]);
                          minute = Number(match[2]);
                          const ampm = match[3];
                          if (ampm === 'pm' && hour !== 12) hour += 12;
                          if (ampm === 'am' && hour === 12) hour = 0;
                        }
                        const combined = new Date(selectedDate);
                        combined.setHours(hour, minute, 0, 0);
                        if (isUnsetStart || combined.getTime() > maxDate.getTime()) {
                          return { opacity: 0.3 };
                        }
                        return {};
                      })(),
                    ]}
                    onPress={() => {
                      // Disable and fade if RSVP deadline is after event start time
                      const isUnsetStart =
                        !maxDate ||
                        isNaN(maxDate.getTime()) ||
                        maxDate.getTime() === 0;
                      const match = selectedTime.match(/(\d+):(\d+)(am|pm)/i);
                      let hour = 0, minute = 0;
                      if (match) {
                        hour = Number(match[1]);
                        minute = Number(match[2]);
                        const ampm = match[3];
                        if (ampm === 'pm' && hour !== 12) hour += 12;
                        if (ampm === 'am' && hour === 12) hour = 0;
                      }
                      const combined = new Date(selectedDate);
                      combined.setHours(hour, minute, 0, 0);
                      if (isUnsetStart || combined.getTime() > maxDate.getTime()) {
                        return;
                      }
                      onSave(combined, selectedTime);
                    }}
                    activeOpacity={0.7}
                    disabled={(() => {
                      const isUnsetStart =
                        !maxDate ||
                        isNaN(maxDate.getTime()) ||
                        maxDate.getTime() === 0;
                      const match = selectedTime.match(/(\d+):(\d+)(am|pm)/i);
                      let hour = 0, minute = 0;
                      if (match) {
                        hour = Number(match[1]);
                        minute = Number(match[2]);
                        const ampm = match[3];
                        if (ampm === 'pm' && hour !== 12) hour += 12;
                        if (ampm === 'am' && hour === 12) hour = 0;
                      }
                      const combined = new Date(selectedDate);
                      combined.setHours(hour, minute, 0, 0);
                      return isUnsetStart || combined.getTime() > maxDate.getTime();
                    })()}
                  >
                    <Text style={[tw`text-white text-center text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[tw`bg-white/5 rounded-full py-3 items-center`]}
                    onPress={() => {
                      setSelectedDate(initialDate);
                      setSelectedTime(initialTime === '' ? defaultTime : initialTime);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[tw`text-white text-center text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default RSVPDeadlineModal;