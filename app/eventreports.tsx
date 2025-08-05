import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import tw from 'twrnc';
import { useUserStore } from '../app/store/userStore';
import { supabase } from '../utils/supabase';

import CheckIcon from '@/assets/icons/accepted.svg';
import BackIcon from '@/assets/icons/back.svg';
import { useLocalSearchParams, useRouter } from 'expo-router';

const reasonList = [
  {
    label: 'Inappropriate Content',
    description: 'Event contains offensive, explicit, or inappropriate material.'
  },
  {
    label: 'Harassment or Safety Concerns',
    description: 'Event promotes harassment, threats, or unsafe behavior.'
  },
  {
    label: 'Scam or Spam',
    description: 'Event is misleading, fraudulent, or spammy.'
  },
  {
    label: 'Illegal or Underage Activity',
    description: 'Event involves illegal activities or underage participation.'
  },
  {
    label: 'Fake or Duplicate Event',
    description: 'Event is fake, copied, or duplicated.'
  },
  {
    label: 'Wrong or Missing Info',
    description: 'Event details are incorrect or missing important information.'
  },
  {
    label: 'Other',
    description: 'Other issues not listed above. Tell us more...'
  },
];

const EventReports = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUserStore();
  const [eventId, setEventId] = useState('');
  const [eventName, setEventName] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const detailsInputRef = useRef(null);
  let scrollRef: any = null;
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (params.eventId && typeof params.eventId === 'string') {
      setEventId(params.eventId);
    }
  }, [params.eventId]);

  useEffect(() => {
    const fetchEventName = async () => {
      if (eventId) {
        const { data, error } = await supabase
          .from('events')
          .select('title')
          .eq('id', eventId)
          .single();
        if (data && data.title) {
          setEventName(data.title);
        } else {
          setEventName('');
        }
      }
    };
    fetchEventName();
  }, [eventId]);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select a reason before submitting.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('eventreports').insert([
      {
        eventid: eventId,
        reason: selectedReason,
        reasondetail: details,
        reporter: user.id,
      },
    ]);
    setSubmitting(false);
    if (error) {
      Alert.alert('Failed to submit report.', error.message || 'Unknown error');
    } else {
      setShowSuccessModal(true);
      setSelectedReason('');
      setDetails('');
    }
  };

  return (
    <LinearGradient
      colors={['#080B32', '#0E1241', '#291C56', '#392465', '#51286A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[{ flex: 1 }, tw`px-4 pt-8`]}
    >
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black/60`}>
          <View style={tw`bg-[#1B1D3A] rounded-2xl px-6 py-8 items-center w-72`}>
            <CheckIcon width={48} height={48} style={tw`mb-4`} />
            <Text style={[tw`text-white text-xl mb-2`, { fontFamily: 'Nunito-ExtraBold' }]}>Report submitted</Text>
            <Text style={[tw`text-white text-center mb-6`, { fontFamily: 'Nunito-Medium' }]}>Thank you for helping keep Sizzl safe. We'll keep you updated!</Text>
            <TouchableOpacity
              style={tw`bg-green-600 px-6 py-2 rounded-full`}
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
            >
              <Text style={[tw`text-white text-base`, { fontFamily: 'Nunito-Bold' }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={tw`pt-6 pb-8`}
        showsVerticalScrollIndicator={false}
        innerRef={ref => { scrollRef = ref; }}
      >
        <View style={tw`flex-row items-center mb-3 justify-between`}>
          <TouchableOpacity onPress={() => router.back()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
          <View style={tw`flex-1 items-center`}>
            <Text style={[tw`text-base text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Report event</Text>
          </View>
          {/* Spacer for symmetry */}
          <View style={tw`w-7`} />
        </View>
        {eventName ? (
          <Text style={[tw`text-white text-[15px] text-center mb-4`, { fontFamily: 'Nunito-Medium' }]}>
            You are reporting <Text style={[{ fontFamily: 'Nunito-ExtraBold' }]}>{eventName}</Text>
          </Text>
        ) : null}

        {reasonList.map((reason) => (
          <TouchableOpacity
            key={reason.label}
            onPress={() => setSelectedReason(reason.label)}
            style={tw`mb-2 p-3 rounded-xl border ${selectedReason === reason.label ? 'border-rose-500 bg-rose-900/40' : 'border-white/10 bg-white/5'}`}
          >
            <Text style={[tw`text-[15px] text-white`, { fontFamily: 'Nunito-Bold' }]}>{reason.label}</Text>
            <Text style={[tw`text-[13px] text-gray-400 mt-0.5`, { fontFamily: 'Nunito-Medium' }]}>{reason.description}</Text>
          </TouchableOpacity>
        ))}
        {selectedReason === 'Other' && (
          <TextInput
            ref={detailsInputRef}
            style={[
              tw`mt-1 h-24 border border-white/30 rounded-xl p-2 text-white bg-white/10 text-top`,
              { fontFamily: 'Nunito-Medium', textAlignVertical: 'top' }
            ]}
            placeholder="Additional details (required)"
            value={details}
            onChangeText={setDetails}
            multiline={true}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholderTextColor="#9ca3af"
            onFocus={() => {
              if (detailsInputRef.current && scrollRef) {
                scrollRef.scrollToFocusedInput(detailsInputRef.current);
              }
            }}
          />
        )}
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.7}
          disabled={submitting}
          style={tw`mt-6 bg-rose-600 py-3 rounded-full`}
        >
          <Text style={[tw`text-white text-center text-[15px]`, { fontFamily: 'Nunito-ExtraBold' }]}>
            {submitting ? 'Submitting...' : 'Submit report'}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
};

export default EventReports;
