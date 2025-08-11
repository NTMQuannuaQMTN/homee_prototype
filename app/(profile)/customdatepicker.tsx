
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

interface CustomDatePickerProps {
  initialDate?: Date;
  onDateChange?: (date: Date) => void;
  onCancel?: () => void;
  onSave?: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  setPickerActive?: (active: boolean) => void;
  panHandlers?: any;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  initialDate = new Date(),
  onDateChange,
  onCancel,
  onSave,
  minimumDate,
  maximumDate,
  textColor = '#FFFFFF',
  style = {},
  setPickerActive,
  panHandlers,
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  // Generate arrays for months, days, and years
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Calculate year range based on min/max dates
  const currentYear = new Date().getFullYear();
  const minYear = minimumDate ? minimumDate.getFullYear() : currentYear - 100;
  const maxYear = maximumDate ? maximumDate.getFullYear() : currentYear;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  
  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const [selectedMonth, setSelectedMonth] = useState(selectedDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(selectedDate.getDate());
  const [selectedYear, setSelectedYear] = useState(selectedDate.getFullYear());
  
  const days = Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1);
  
  const monthScrollRef = useRef<ScrollView | null>(null);
  const dayScrollRef = useRef<ScrollView | null>(null);
  const yearScrollRef = useRef<ScrollView | null>(null);
  
  const ITEM_HEIGHT = 50;
  
  useEffect(() => {
    // Validate the date against min/max constraints
    let newDate = new Date(selectedYear, selectedMonth, selectedDay);
    
    // Check if date is within bounds
    if (minimumDate && newDate < minimumDate) {
      newDate = new Date(minimumDate);
      setSelectedYear(newDate.getFullYear());
      setSelectedMonth(newDate.getMonth());
      setSelectedDay(newDate.getDate());
    } else if (maximumDate && newDate > maximumDate) {
      newDate = new Date(maximumDate);
      setSelectedYear(newDate.getFullYear());
      setSelectedMonth(newDate.getMonth());
      setSelectedDay(newDate.getDate());
    }
    
    setSelectedDate(newDate);
    onDateChange && onDateChange(newDate);
  }, [selectedMonth, selectedDay, selectedYear]);
  const renderPickerItem = (
    item: string | number,
    index: number,
    isSelected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      key={index}
      style={{
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: isSelected ? 1 : 0.4,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={{
        color: textColor,
        fontSize: isSelected ? 16 : 13,
        fontFamily: isSelected ? 'Nunito-ExtraBold' : 'Nunito-Medium',
      }}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderPicker = (
    data: (string | number)[],
    selectedValue: string | number,
    onValueChange: (value: any) => void,
    scrollRef: RefObject<ScrollView | null>
  ) => {
    // Track scroll position to avoid off-by-one error
    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      // Use Math.round to avoid off-by-one error (center the item)
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      onValueChange(data[clampedIndex]);
      // Snap to the correct position with animation for smoothness
      scrollRef.current?.scrollTo({ y: clampedIndex * ITEM_HEIGHT, animated: true });
      if (typeof setPickerActive === 'function') setPickerActive(false);
    };
    return (
      <View style={{ flex: 1, height: 250 }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          // snapToInterval removed for smoother scroll
          decelerationRate={0.95} // slower, smoother deceleration
          contentContainerStyle={{
            paddingVertical: 100,
          }}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollBeginDrag={() => { if (typeof setPickerActive === 'function') setPickerActive(true); }}
          onScrollEndDrag={() => { if (typeof setPickerActive === 'function') setPickerActive(false); }}
        >
          {data.map((item, index) =>
            renderPickerItem(
              item,
              index,
              item === selectedValue,
              () => {
                onValueChange(item);
                scrollRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
                if (typeof setPickerActive === 'function') setPickerActive(false);
              }
            )
          )}
        </ScrollView>

        {/* Selection indicator */}
        <View style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: textColor,
          opacity: 0.3,
        }} />
      </View>
    );
  };
  
  // Initialize scroll positions when component mounts
  useEffect(() => {
    setTimeout(() => {
      const monthIndex = selectedMonth;
      const dayIndex = selectedDay - 1;
      const yearIndex = years.indexOf(selectedYear);
      
      monthScrollRef.current?.scrollTo({ y: monthIndex * ITEM_HEIGHT, animated: false });
      dayScrollRef.current?.scrollTo({ y: dayIndex * ITEM_HEIGHT, animated: false });
      yearScrollRef.current?.scrollTo({ y: yearIndex * ITEM_HEIGHT, animated: false });
    }, 100);
  }, []);
  
  // Update days when month or year changes
  useEffect(() => {
    const newDaysCount = getDaysInMonth(selectedMonth, selectedYear);
    if (selectedDay > newDaysCount) {
      setSelectedDay(newDaysCount);
    }
  }, [selectedMonth, selectedYear]);
  
  return (
    <View
      style={[ 
        tw`flex-col bg-[#080B32] rounded-2xl px-4 pb-10 pt-6`
      ]}
    >
      {/* Draggable bar/header - only this area is draggable */}
      <View style={{ alignItems: 'center', marginBottom: 12 }} {...(panHandlers ? panHandlers : {})}>
        <View style={tw`w-12 h-1.5 bg-white/20 rounded-full self-center mb-3`} />
        <Text style={[tw`text-white text-[16px] mb-3 text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Set your birthday</Text>
      </View>
      <View style={tw`flex-row justify-between px-10`}>
        {/* Month Picker */}
        <View style={tw`items-center`}>
          <Text style={[tw`text-[13px] mb-2`, { color: textColor, fontFamily: 'Nunito-Bold', opacity: 0.7 }]}>MONTH</Text>
          {renderPicker(
            months,
            months[selectedMonth],
            (month) => {
              const monthIndex = months.indexOf(month);
              setSelectedMonth(monthIndex);
            },
            monthScrollRef
          )}
        </View>

        {/* Day Picker */}
        <View style={tw`items-center`}>
          <Text style={[tw`text-[13px] mb-2`, { color: textColor, fontFamily: 'Nunito-Bold', opacity: 0.7 }]}>DAY</Text>
          {renderPicker(
            days,
            selectedDay,
            setSelectedDay,
            dayScrollRef
          )}
        </View>

        {/* Year Picker */}
        <View style={tw`items-center`}>
          <Text style={[tw`text-[13px] mb-2`, { color: textColor, fontFamily: 'Nunito-Bold', opacity: 0.7 }]}>YEAR</Text>
          {renderPicker(
            years,
            selectedYear,
            setSelectedYear,
            yearScrollRef
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={tw`flex-row justify-center mt-4 gap-2`}> 
        <TouchableOpacity
          onPress={onCancel}
          style={tw`py-2.5 flex-1 rounded-xl bg-white/5`}
        >
          <Text style={[tw`text-[15px] text-center`, { color: textColor, fontFamily: 'Nunito-ExtraBold' }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSave && onSave(new Date(selectedYear, selectedMonth, selectedDay))}
          style={tw`py-2.5 flex-1 rounded-xl bg-[#7A5CFA]`}
        >
          <Text style={[tw`text-[15px] text-white text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomDatePicker;