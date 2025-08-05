// Helper to format RSVP deadline as 'wed, jul 16, 2025'
function formatRSVPDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.toLocaleDateString('en-US', { day: '2-digit' });
  const year = date.toLocaleDateString('en-US', { year: 'numeric' });
  const dayNum = String(Number(day));
  return `${weekday}, ${month} ${dayNum}, ${year}`;
}
// Helper to format date as 'Tuesday, Jul 15, 2025'
function formatFullDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.toLocaleDateString('en-US', { day: '2-digit' });
  const year = date.toLocaleDateString('en-US', { year: 'numeric' });
  // Remove any leading zero from day
  const dayNum = String(Number(day));
  return `${weekday}, ${month} ${dayNum}, ${year}`;
}

import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import tw from 'twrnc';
import { useUserStore } from '../store/userStore';

import Back from '../../assets/icons/back.svg';
import Camera from '../../assets/icons/camera_icon.svg';
import Host from '../../assets/icons/host.svg';
import HostWhite from '../../assets/icons/hostwhite-icon.svg';
import Location from '../../assets/icons/location.svg';
import LocationWhite from '../../assets/icons/locationwhite-icon.svg';
import PfpDefault from '../../assets/icons/pfpdefault.svg';
import Private from '../../assets/icons/private.svg';
import Public from '../../assets/icons/public.svg';
import RSVP from '../../assets/icons/time.svg';
import RSVPWhite from '../../assets/icons/timewhite.svg';
import CohostModal from './cohost';
import DateTimeModal from './dateTimeModal';
import defaultImages from './defaultimage';
import EventDoneModal from './eventdonemodal';
import ImageModal from './imageModal';
import LocationModal from './location';
import MoreSettingsModal from './moreSettingsModal';
import RSVPDeadlineModal from './rsvpDeadlineModal';
import SaveDraftModal from './savedraftmodal';
// Define Friend and Cohost types locally
interface Friend {
  id: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  profile_image?: string;
}

export default function CreatePage() {
  // ...existing code...
  const [draftLoaded, setDraftLoaded] = useState(false);
  const params = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [publicEvent, setPublic] = useState(true);
  const [date, setDate] = useState({
    start: new Date(),
    end: new Date(),
    startTime: '12:00am',
    endTime: '12:00am',
    endSet: false,
    dateChosen: false,
  });
  const imageOptions = defaultImages;
  const [image, setImage] = useState(imageOptions[Math.floor(Math.random() * imageOptions.length)]);
  const [id, setID] = useState('');
  const [imageURL, setImageURL] = useState('');

  const { user } = useUserStore();
  const [host, setHost] = useState<Friend>({
    id: '',
    firstname: '',
    lastname: '',
    username: '',
    profile_image: '',
  });
  const [cohosts, setCohosts] = useState<(Friend | string)[]>([]);
  const [bio, setBio] = useState('');
  const [special, setSpecial] = useState({
    cash: '',
    food: '',
    merch: '',
    coolPrize: '',
  });
  const [specialBox, setSpecialBox] = useState({
    cash: false,
    food: false,
    merch: false,
    coolPrize: false,
  });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [location, setLocation] = useState({
    search: '',
    selected: '',
    rsvpFirst: false,
    name: '',
    aptSuite: '',
    notes: '',
  });
  const [rsvpDL, setRSVPDL] = useState<Date | null>(null);
  const [rsvpDLTime, setRSVPDLTime] = useState<string | null>(null);
  // Load draft event if id param is present
  useEffect(() => {
    async function fetchDraft() {
      if (params.id) {
        const { data, error } = await supabase.from('events').select('*').eq('id', params.id).single();
        if (!error && data) {
          setID(data.id);
          setTitle(data.title || '');
          setPublic(data.public ?? true);
          setBio(data.bio || '');
          setLocation({
            search: '',
            selected: data.location_add || '',
            rsvpFirst: data.rsvpfirst || false,
            name: data.location_name || '',
            aptSuite: data.location_more || '',
            notes: data.location_note || '',
          });
          setRSVPDL(data.rsvp_deadline ? new Date(data.rsvp_deadline) : null);
          // Parse RSVP time if available
          if (data.rsvp_deadline) {
            const rsvpDate = new Date(data.rsvp_deadline);
            setRSVPDLTime(rsvpDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
          setSpecial({
            cash: data.cash_prize || '',
            food: data.free_food || '',
            merch: data.free_merch || '',
            coolPrize: data.cool_prize || '',
          });
          setSpecialBox({
            cash: data.cash_prize != null ? true : false,
            food: data.free_food != null ? true : false,
            merch: data.free_merch != null ? true : false,
            coolPrize: data.cool_prize != null ? true : false,
          });
          setDate(prev => ({
            ...prev,
            start: data.start ? new Date(data.start) : new Date(),
            end: data.end ? new Date(data.end) : new Date(),
            startTime: data.start ? new Date(data.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '') : '12:00am',
            endTime: data.end ? new Date(data.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '') : '12:00am',
            endSet: !!data.end,
            dateChosen: !!data.start,
          }));
          // Image
          if (data.image) {
            if (typeof data.image === 'string' && data.image.startsWith('default_')) {
              // e.g. 'default_3'
              const idx = parseInt(data.image.replace('default_', ''), 10) - 1;
              if (!isNaN(idx) && idx >= 0 && idx < imageOptions.length) {
                setImage(imageOptions[idx]);
              } else {
                setImage(imageOptions[0]);
              }
            } else if (typeof data.image === 'string') {
              setImage(data.image);
            } else {
              setImage(imageOptions[0]);
            }
          }

          // Fetch all cohosts (hosts table) for this event, by user id or username
          if (data.id) {
            // Get all hosts for this event
            const { data: cohostRows, error: cohostError } = await supabase
              .from('hosts')
              .select('user_id, name')
              .eq('event_id', data.id);

            if (!cohostError && cohostRows) {
              // cohosts can be selected by user_id or username
              // Store as array of user_ids and usernames
              const cohostIds = cohostRows.map(row => row.user_id).filter(Boolean);
              const { data: cohostUsers, error: cohUsErr } = await supabase.from('users')
                .select('*').in('id', cohostIds);
              const { data: hostUsers, error: hosUsErr } = await supabase.from('users')
                .select('id, firstname, lastname, username, profile_image').eq('id', data.host_id).single();
              const cohostUsernames = cohostRows.map(row => row.name).filter(Boolean);
              if (cohostUsers) {
                setCohosts([...cohostUsers, ...cohostUsernames]);
              } else {
                setCohosts([...cohostUsernames]);
              }
              if (hostUsers) {
                setHost(hostUsers);
              }
            }
          }

          setDraftLoaded(true);
        }
      }
    }
    fetchDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);
  const [showCohostModal, setShowCohostModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  useEffect(() => {
    console.log(date);
  }, [showDateTimeModal]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [showMoreSettingsModal, setShowMoreSettingsModal] = useState(false);
  const [list, setList] = useState({
    public: true,
    maybe: true,
  })
  const [locations, setLocations] = useState<{ address: string; city: string }[]>([]);

  const [friends, setFriends] = useState<Friend[]>([]);

  const addEvent = async () => {
    console.log('adding');
    // Check if event title, date, RSVP deadline, and location are available
    if (!title || !date.dateChosen || !rsvpDL || !(location.name || location.selected)) {
      Alert.alert('Please fill in all required fields, including location.');
      return null;
    }
    // Combine start date and start time into a single Date object for 'start'
    const startDateTime = new Date(
      date.start.getFullYear(),
      date.start.getMonth(),
      date.start.getDate(),
      (() => {
        // Parse hour and minute from date.startTime (e.g., "7:15pm")
        const match = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(date.startTime);
        if (!match) return 0;
        let hour = parseInt(match[1], 10);
        const ampm = match[3];
        if (ampm.toLowerCase() === 'pm' && hour !== 12) hour += 12;
        if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
        return hour;
      })(),
      (() => {
        const match = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(date.startTime);
        if (!match) return 0;
        return parseInt(match[2], 10);
      })(),
      0,
      0
    );

    // Combine end date and end time into a single Date object for 'end'
    const endDateTime = new Date(
      date.end.getFullYear(),
      date.end.getMonth(),
      date.end.getDate(),
      (() => {
        // Parse hour and minute from date.endTime (e.g., "7:15pm")
        const match = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(date.endTime);
        if (!match) return 0;
        let hour = parseInt(match[1], 10);
        const ampm = match[3];
        if (ampm.toLowerCase() === 'pm' && hour !== 12) hour += 12;
        if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
        return hour;
      })(),
      (() => {
        const match = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(date.endTime);
        if (!match) return 0;
        return parseInt(match[2], 10);
      })(),
      0,
      0
    );

    console.log(startDateTime, endDateTime);

    let draftErr;
    let dataEvent;

    if (id === '') {
      // Insert new event if id is empty
      ({ data: dataEvent, error: draftErr } = await supabase.from('events')
        .insert([{
          title: title, public: publicEvent,
          start: (date.dateChosen ? startDateTime : null),
          end: (date.endSet ? endDateTime : null),
          location_add: location.selected || '',
          location_name: location.name || location.selected || '',
          location_more: location.aptSuite || '',
          location_note: location.notes || '',
          rsvpfirst: location.rsvpFirst, rsvp_deadline: rsvpDL,
          bio: bio, cash_prize: specialBox.cash ? special.cash : null,
          free_food: specialBox.food ? special.food : null,
          free_merch: specialBox.merch ? special.merch : null,
          cool_prize: specialBox.coolPrize ? special.coolPrize : null,
          host_id: user.id, public_list: list.public, maybe: list.maybe,
          done: !(title === '' || !date.dateChosen || !rsvpDL || !(location.name || location.selected)),
          school_id: user.school_id
        }])
        .select('id') // Request the id of the inserted event
      );
    } else {
      // Update existing event if id is not empty
      ({ error: draftErr } = await supabase.from('events')
        .update({
          title: title, public: publicEvent,
          start: (date.dateChosen ? startDateTime : null),
          end: (date.endSet ? endDateTime : null),
          location_add: location.selected || '',
          location_name: location.name || location.selected || '',
          location_more: location.aptSuite || '',
          location_note: location.notes || '',
          rsvpfirst: location.rsvpFirst, rsvp_deadline: rsvpDL,
          bio: bio, cash_prize: specialBox.cash ? special.cash : null,
          free_food: specialBox.food ? special.food : null,
          free_merch: specialBox.merch ? special.merch : null,
          cool_prize: specialBox.coolPrize ? special.coolPrize : null,
          host_id: host.id === '' ? user.id : host.id, public_list: list.public, maybe: list.maybe,
          done: !(title === '' || !date.dateChosen || !rsvpDL || !(location.name || location.selected)),
        })
        .eq('id', id));
    }

    // Check if event meets all conditions
    const isValid = title !== '' && date.dateChosen && rsvpDL;
    if (isValid && !draftErr) {
      setShowSuccessToast(true);
      if (dataEvent) {
        setID(dataEvent[0].id);
        console.log(dataEvent[0].id);
        return dataEvent[0].id; // <-- return the new id
      }
      return id;
    } else {
      Alert.alert('error bitch');
      return null;
    }
  }

  const updateImage = async (eventId: string) => {

    console.log('updating');
    let imgURL = '';
    if (image && typeof image !== 'number') {
      // If image is already a URL, just use it
      if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
        setImageURL(image);
        imgURL = image;
      } else {
        try {
          // Get file info and determine file extension
          const fileUri = image;
          const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `event_cover/${eventId}.${fileExtension}`;

          // Read file as ArrayBuffer for proper binary upload
          const fileArrayBuffer = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Convert base64 to Uint8Array
          const byteCharacters = atob(fileArrayBuffer);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const uint8Array = new Uint8Array(byteNumbers);

          const { error: uploadError } = await supabase.storage
            .from('sizzl-profileimg')
            .upload(fileName, uint8Array, {
              contentType: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
              upsert: true
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            return;
          }

          const { data: urlData } = await supabase.storage
            .from('sizzl-profileimg')
            .getPublicUrl(fileName);

          const publicUrl = urlData?.publicUrl;
          setImageURL(publicUrl);
          imgURL = publicUrl;
        } catch (err) {
          console.error('Image upload exception:', err);
          Alert.alert('Image upload failed');
        }
      }
    } else {
      setImageURL(`default_${image - 28}`);
      imgURL = `default_${image - 28}`;
    }

    // Now, after all awaits above, update the event image
    // Why I check and there is no update?
    // The update may not happen if imageURL is undefined/null, or if the id is wrong, or if the value is the same as before.
    // Let's log more details for debugging:
    console.log("Attempting to update event image", { eventId, imageURL });

    if (!eventId) {
      console.error("No event id provided for update.");
    } else if (!imgURL) {
      console.error("No imageURL provided for update.");
    } else {
      const { data: checkData, error: setAvatarError } = await supabase
        .from('events')
        .update({ image: imgURL })
        .eq('id', eventId)
        .select();

      if (setAvatarError) {
        console.error("Set error:", setAvatarError);
      } else if (!checkData || checkData.length === 0) {
        console.warn("Update succeeded but no rows returned. Possible reasons: id not found, or image value unchanged.");
      } else {
        console.log("Update result:", checkData);
      }
    }
  }

  const addCohost = async (eventId: string) => {
    // Remove all previous co-host
    console.log('Prev coh');
    const { error: remErr } = await supabase
      .from('hosts')
      .delete()
      .eq('event_id', eventId);

    if (remErr) { Alert.alert('Can\'t remove'); return; }

    if (Array.isArray(cohosts) && cohosts.length > 0) {
      for (const cohost of cohosts) {
        // cohost could be an id or an object; adjust as needed
        if (typeof cohost === 'string') {
          const { error: addHostErr } = await supabase.from('hosts')
            .insert([
              { event_id: eventId, name: cohost }
            ])
          if (addHostErr) {
            console.log('Can\'t add'); return;
          }
        } else {
          const { error: addHostErr } = await supabase.from('hosts')
            .insert([
              { event_id: eventId, user_id: cohost.id }
            ])
          if (addHostErr) {
            console.log('Can\'t add'); return;
          }
        }
      }
    }
  }

  useEffect(() => {
    // Example async fetch function, replace with your actual API/database call
    async function fetchFriends() {
      try {
        let idFriend: readonly any[] | undefined = [];
        const { data: idGet, error: idErr } = await supabase
          .from('friends')
          .select('friend').eq('user_id', user.id);
        idFriend = (idGet?.map(f => f.friend));

        const { data, error } = await supabase
          .from('users')
          .select('id, firstname, lastname, username, profile_image')
          .in('id', Array.isArray(idFriend) ? idFriend : []);
        if (!data) throw new Error('No data returned');
        setFriends(data);
      } catch (err) {
        console.error('Failed to fetch friends:', err);
      }
    }
    if (!showCohostModal) fetchFriends();
  }, [showCohostModal]);

  const [showEventDoneModal, setShowEventDoneModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastAnim] = useState(new Animated.Value(1));
  // Draft Saved Modal
  const [showDraftSavedModal, setShowDraftSavedModal] = useState(false);

  return (
    <View style={tw`w-full h-full`}>
      {/* Success Toast Modal (Animated overlay, styled like profile.tsx) */}
      {
        (showSuccessToast || toastVisible) && (
          <Animated.View
            style={[
              tw`absolute left-0 top-0 w-full h-full z-100`,
              { opacity: toastAnim, justifyContent: 'center', alignItems: 'center', display: 'flex' }
            ]}
          >
            <View style={[tw`absolute w-full h-full left-0 top-0`, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
            <View style={[tw`bg-[#22C55E] px-0 pb-4 pt-6 rounded-2xl shadow-lg shadow-black/30 items-center`, { width: 320, maxWidth: '90%' }]}>
              <ExpoImage
                source={require('../../assets/gifs/happycat.gif')}
                style={{ width: 120, height: 120, borderRadius: 10, marginBottom: 20, resizeMode: 'cover' }}
              />
              <View style={tw`flex-row items-center justify-center`}>
                <Text style={[tw`text-white text-[15px] text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Loading...</Text>
                <Text style={[tw`text-white text-[15px] text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>
                  (your event is published lfg 🥳)
                </Text>
              </View>
            </View>
          </Animated.View>
        )
      }
      {/* Draft Saved Modal (custom UI) */}
      {showDraftSavedModal && (
        <Animated.View
          style={[
            tw`absolute left-0 top-0 w-full h-full z-100`,
            { opacity: toastAnim, justifyContent: 'center', alignItems: 'center', display: 'flex' }
          ]}
        >
          <View style={[tw`absolute w-full h-full left-0 top-0`, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
          <View style={[tw`bg-yellow-600 py-2.5 px-4 rounded-full shadow-lg shadow-black/30 items-center`]}>
            <Text style={[tw`text-white text-[15px] text-center`, { fontFamily: 'Nunito-ExtraBold' }]}>Draft saved!</Text>
          </View>
        </Animated.View>
      )}

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={0}
        showsVerticalScrollIndicator={false}
        resetScrollToCoords={{ x: 0, y: 0 }}
        scrollEnabled={!showImageModal}
      >

        {/* Background image and overlay */}
        <Image
          source={
            typeof image === 'string'
              ? (image.startsWith('file://') || image.startsWith('content://')
                ? { uri: image }
                : { uri: image })
              : image && image.uri
                ? { uri: image.uri }
                : image
          }
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            bottom: 0,
            height: undefined,
            minHeight: '100%',
            resizeMode: 'cover',
            zIndex: 0,
          }}
          blurRadius={8}
          onError={e => {
            console.log('Background image failed to load:', e.nativeEvent);
          }}
        />
        <View style={tw`w-full h-full pt-3 bg-black bg-opacity-60`}>
          {/* Top bar */}
          <View style={tw`relative flex-row items-center px-4 mt-10 mb-2 h-10`}>
            {/* Back button - absolute left */}
            <TouchableOpacity
              onPress={() => router.replace('/(home)/home/homepage')}
              style={[tw`absolute left-3`, { zIndex: 2 }]}
            >
              <Back />
            </TouchableOpacity>
            {/* Centered title */}
            <View style={tw`flex-1 items-center justify-center`}>
              <Text style={[tw`text-white text-base`, { fontFamily: 'Nunito-ExtraBold' }]}>
                {id && draftLoaded ? 'Update event' : 'Create event'}
              </Text>
            </View>
            {/* Done button - absolute right */}
            {/* Determine if all required fields are filled and if editing */}
            {(() => {
              const requiredFilled = title && date.dateChosen && rsvpDL && (location.name || location.selected);
              const isEditing = id && draftLoaded;
              return requiredFilled ? (
                <TouchableOpacity
                  style={[tw`absolute right-4 rounded-full px-4 py-1 bg-[#7b61ff]`, { zIndex: 2 }]}
                  onPress={async () => {
                    if (isEditing) {
                      // Directly publish the updated event
                      setToastVisible(true);
                      const newId = await addEvent();
                      if (newId) {
                        await updateImage(newId);
                        await addCohost(newId);
                        setTimeout(() => {
                          router.replace('/home/homepage');
                        }, 250);
                      }
                    } else {
                      setShowEventDoneModal(true);
                    }
                  }}
                >
                  <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>{isEditing ? 'Update' : 'Done'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[tw`absolute right-4 rounded-full px-4 py-1 bg-gray-500/60`, { zIndex: 2 }]}
                  onPress={() => setShowDraftModal(true)}
                >
                  <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Draft</Text>
                </TouchableOpacity>
              );
            })()}
          </View>

          {/* Title input */}
          <View style={[tw`px-4 mb-4 items-center`]}>
            <TextInput
              style={[
                tw`text-white text-[24px] w-full`,
                {
                  fontFamily: 'Nunito-ExtraBold',
                  lineHeight: 28,
                  paddingTop: 4,
                  textAlign: 'center',
                  textAlignVertical: 'top',
                }
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder='your event title'
              placeholderTextColor={'#9ca3af'}
              multiline={false}
              maxLength={60}
              returnKeyType="done"
            />
          </View>

          <View style={tw`flex-row items-center mx-4 mb-2.5`}>
            <TouchableOpacity style={tw`flex-row items-center gap-2 justify-center bg-[#064B55] ${publicEvent ? 'border border-white/10' : 'opacity-30'} rounded-full px-2 py-0.5 mr-1`}
              onPress={() => { setPublic(true) }}>
              <Public />
              <Text style={[tw`text-[13px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Public</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tw`flex-row items-center gap-2 justify-center bg-[#080B32] ${publicEvent ? 'opacity-30' : 'border border-purple-900'} rounded-full px-2 py-0.5`}
              onPress={() => { setPublic(false) }}>
              <Private />
              <Text style={[tw`text-[13px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Private</Text>
            </TouchableOpacity>
          </View>

          {/* Image picker */}
          <View style={tw`px-4 mb-2`}>
            <TouchableOpacity style={[tw`rounded-xl overflow-hidden w-full items-center justify-center relative`, { aspectRatio: 410 / 279 }]}
              onPress={() => { setShowImageModal(true) }}>
              <Image
                source={
                  typeof image === 'string'
                    ? { uri: image }
                    : image && image.uri
                      ? { uri: image.uri }
                      : image
                }
                style={{ width: '100%', height: '100%' }}
                resizeMode={
                  typeof image === 'string' && imageOptions.includes(image)
                    ? 'contain'
                    : 'cover'
                }
              />
              {/* Placeholder for event image */}
              <View style={tw`flex-row gap-1.5 absolute top-2.5 right-2.5 bg-white rounded-lg px-2 py-1 shadow-md`}>
                <Camera width={14} height={14} />
                <Text style={[tw`text-xs text-black`, { fontFamily: 'Nunito-ExtraBold' }]}>{'Choose image'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Set date and time */}
          <View style={tw`px-4 mb-2`}>
            {/* Placeholder for date/time picker */}
            <TouchableOpacity style={tw`bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex items-start`}
              onPress={() => setShowDateTimeModal(true)}
              activeOpacity={0.7}
            >
              {(!date.dateChosen) ? (
                <Text style={[tw`text-gray-400 text-[18px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Set date and time</Text>
              ) : date.endSet ? (
                (() => {
                  const startDateStr = formatFullDate(date.start);
                  const endDateStr = formatFullDate(date.end);
                  if (startDateStr === endDateStr) {
                    // Same day: show date on first line, times on second line
                    return (
                      <Text style={[tw`text-white text-[18px]`, { fontFamily: 'Nunito-ExtraBold' }]}>
                        {startDateStr}{"\n"}
                        {date.startTime} - {date.endTime}
                      </Text>
                    );
                  } else {
                    // Different days: show both date and time on each line
                    return (
                      <Text style={[tw`text-white text-[18px]`, { fontFamily: 'Nunito-ExtraBold' }]}>
                        {startDateStr}, {date.startTime} -{"\n"}
                        {endDateStr}, {date.endTime}
                      </Text>
                    );
                  }
                })()
              ) : (
                <Text style={[tw`text-white text-[18px]`, { fontFamily: 'Nunito-ExtraBold' }]}>
                  {formatFullDate(date.start)}{"\n"}
                  {date.startTime}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Hosted by */}
          <View style={tw`px-4 mb-2`}>
            <TouchableOpacity
              style={tw`bg-white/10 border border-white/20 rounded-xl px-4 py-3`}
              onPress={() => setShowCohostModal(true)}
              activeOpacity={0.8}
            >
              <View style={tw`flex-row gap-2 items-start`}>
                {cohosts.length > 0 ? (
                  <HostWhite width={14} height={14} style={tw`mt-0.5`} />
                ) : (
                  <Host width={14} height={14} style={tw`mt-0.5`} />
                )}
                <Text
                  style={[
                    tw`${cohosts.length > 0 ? 'text-white' : 'text-gray-400'} text-[13px] mb-2`,
                    { fontFamily: 'Nunito-ExtraBold', textAlignVertical: 'center' }
                  ]}
                >
                  Hosted by{' '}
                  {cohosts.filter(c => typeof c === 'string').slice(0, 2).join(', ')}
                  {cohosts.filter(c => typeof c === 'string').length > 2 &&
                    ` and ${cohosts.filter(c => typeof c === 'string').length - 2} more`}
                </Text>
              </View>
              <View style={tw`flex-row items-center gap-1.5`}>
                {/* Host avatar */}
                {host.id !== '' ? <View style={tw`flex-row items-center gap-1.5 bg-white/10 border border-white/20 px-2 py-2 rounded-xl`}>
                  <View style={[tw`rounded-full border border-white/20 items-center justify-center bg-white/10`, { width: 30, height: 30, overflow: 'hidden' }]}>
                    {host?.profile_image !== '' ? (
                      <Image
                        source={{ uri: host.profile_image }}
                        style={{ width: 30, height: 30, borderRadius: 60 }}
                        defaultSource={require('../../assets/icons/pfpdefault.svg')}
                        onError={() => { }}
                      />
                    ) : (
                      <PfpDefault width={30} height={30} />
                    )}
                  </View>
                  <Text style={[tw`text-white`, { fontFamily: 'Nunito-Bold' }]}>{host.firstname}</Text>
                </View> : <View style={tw`flex-row items-center gap-1.5 bg-white/10 border border-white/20 px-2 py-2 rounded-xl`}>
                  <View style={[tw`rounded-full border border-white/20 items-center justify-center bg-white/10`, { width: 30, height: 30, overflow: 'hidden' }]}>
                    {user?.profile_image ? (
                      <Image
                        source={{ uri: user.profile_image }}
                        style={{ width: 30, height: 30, borderRadius: 60 }}
                        defaultSource={require('../../assets/icons/pfpdefault.svg')}
                        onError={() => { }}
                      />
                    ) : (
                      <PfpDefault width={30} height={30} />
                    )}
                  </View>
                  <Text style={[tw`text-white`, { fontFamily: 'Nunito-Bold' }]}>{user.firstname}</Text>
                </View>}

                {cohosts.filter(c => typeof c === 'object').slice(0, 2).map((cohost, idx) => {
                  console.log(cohost);
                  return (
                    <View key={cohost.id} style={tw`flex-row items-center gap-1.5 bg-white/10 border border-white/20 px-2 py-2 rounded-xl`}>
                      <View style={[tw`rounded-full border border-white/20 items-center justify-center bg-white/10`, { width: 30, height: 30, overflow: 'hidden' }]}>
                        <Image
                          source={cohost.profile_image ? { uri: cohost.profile_image } : require('../../assets/icons/pfpdefault.svg')}
                          style={{ width: 30, height: 30, borderRadius: 60 }}
                          resizeMode="cover"
                          defaultSource={require('../../assets/icons/pfpdefault.svg')}
                        />
                      </View>
                      <Text style={[tw`text-white`, { fontFamily: 'Nunito-Bold' }]}>{cohost.firstname}</Text>
                    </View>
                  );
                })}

                {cohosts.filter(c => typeof c === 'object').length > 2 &&
                  <View style={tw`flex-row items-center bg-[#000000] rounded-full px-3 py-2 gap-1.5`}>
                    <Text style={tw`text-white`}>+{cohosts.filter(c => typeof c === 'object').length - 2}</Text>
                  </View>}
              </View>
              <TouchableOpacity
                onPress={() => setShowCohostModal(true)}
                activeOpacity={0.8}
                style={tw`self-start`}
              >
                <Text style={[tw`rounded-lg text-white text-xs bg-white/10 border border-white/20 mt-2 -mb-1 py-1 px-2.5`, { fontFamily: 'Nunito-ExtraBold' }]}>
                  Add cohosts (optional)
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={tw`px-4 mb-2`}>
            <TouchableOpacity
              style={tw`bg-white/10 border border-white/20 flex-row items-center gap-2 rounded-xl px-4 py-3`}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.7}
            >
              {location.name || location.selected
                ? <LocationWhite width={14} height={14} />
                : <Location width={14} height={14} />}
              <Text style={[tw`${(location.name || location.selected) ? 'text-white' : 'text-gray-400'} text-[13px]`, { fontFamily: 'Nunito-ExtraBold' }]}>
                {location.name ? location.name : (location.selected ? location.selected : 'Set location')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* RSVP deadline */}
          <TouchableOpacity style={tw`px-4 mb-2`}
            activeOpacity={0.7}
            onPress={() => setShowRSVPModal(true)}
          >
            <View style={tw`bg-white/10 border border-white/20 flex-row items-center gap-2 rounded-xl px-4 py-3`}>
              {rsvpDL ? (
                <RSVPWhite width={14} height={14} />
              ) : (
                <RSVP width={14} height={14} />
              )}
              <Text
                style={[
                  tw`${rsvpDL ? 'text-white' : 'text-gray-400'} text-[13px]`,
                  { fontFamily: 'Nunito-ExtraBold' }
                ]}
              >
                {rsvpDL
                  ? `RSVP deadline: ${formatRSVPDate(rsvpDL)}${rsvpDLTime ? ", " + rsvpDLTime : ''}`
                  : 'Set RSVP deadline'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* About this event */}
          <View style={tw`px-4 mb-3`}>
            <View style={tw`bg-white/10 border border-white/20 rounded-xl px-4 pt-3 pb-2`}>
              <TextInput
                style={[
                  tw`text-white text-[13px] px-0 py-0 text-left leading-[1.25]`,
                  {
                    fontFamily: bio ? 'Nunito-Medium' : 'Nunito-ExtraBold',
                    minHeight: 60,
                    textAlignVertical: 'top'
                  }
                ]}
                placeholder="About this event..."
                placeholderTextColor="#9ca3af"
                multiline={true}
                value={bio}
                onChangeText={text => {
                  if (text.length <= 200) setBio(text);
                }}
                blurOnSubmit={true}
                returnKeyType="done"
                maxLength={200}
              />
              <View style={tw`flex-row justify-end items-center mt-0.5 -mr-1`}>
                <Text
                  style={[
                    tw`text-[11px] mr-0.5`,
                    { fontFamily: 'Nunito-Medium' },
                    bio.length >= 200 ? tw`text-rose-600` : tw`text-gray-400`
                  ]}
                >
                  {bio.length}/200
                </Text>
                {bio.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setBio('')}
                    style={tw`pl-1.5`}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* What's special? */}
          <View style={tw`px-4.5 mb-2`}>
            <Text style={[tw`text-white text-[15px] mb-2`, { fontFamily: 'Nunito-ExtraBold' }]}>What's special?</Text>
            {/* Special event perks selection UI */}
            <View style={tw`gap-2.5`}>
              {/* Selected: Cash prize */}
              <View style={tw`gap-1.5`}>
                <TouchableOpacity style={tw`flex-row items-center gap-2.5`}
                  onPress={() => setSpecialBox((sp) => ({ ...sp, cash: !specialBox.cash }))}
                  activeOpacity={0.7}
                >
                  <View style={[tw`w-4 h-4 rounded border border-gray-400 items-center justify-center ${specialBox.cash ? 'bg-[#7A5CFA]' : 'bg-white/10'}`]}>
                    {/* Unchecked: no checkmark */}
                  </View>
                  <View style={tw`flex-row items-center bg-yellow-200 px-3 py-1.5 rounded-full`}>
                    <Text style={tw`text-[14px] mr-1.5`}>💸</Text>
                    <Text style={[tw`text-black text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Cash prize</Text>
                  </View>
                </TouchableOpacity>

                {/* Custom text input for "What's special?" */}
                {specialBox.cash && (
                  <View style={[tw`pl-6.5`, { position: 'relative' }]}>
                    <TextInput
                      style={[
                        tw`items-center text-white bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-[13px] pr-8`,
                        { fontFamily: 'Nunito-Medium' }
                      ]}
                      placeholder="Add details (optional)"
                      placeholderTextColor="#9ca3af"
                      value={special.cash}
                      onChangeText={text => setSpecial(sp => ({ ...sp, cash: text }))}
                    />
                    {special.cash.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSpecial(sp => ({ ...sp, cash: '' }))}
                        style={{ position: 'absolute', right: 8, top: 0, bottom: 0, justifyContent: 'center' }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Other options */}
              <View style={tw`gap-1.5`}>
                <TouchableOpacity style={tw`flex-row items-center gap-2.5`}
                  onPress={() => setSpecialBox((sp) => ({ ...sp, food: !specialBox.food }))}
                  activeOpacity={0.7}
                >
                  <View style={[tw`w-4 h-4 rounded border border-gray-400 items-center justify-center ${specialBox.food ? 'bg-[#7A5CFA]' : 'bg-white/10'}`]}>
                    {/* Unchecked: no checkmark */}
                  </View>
                  <View style={tw`flex-row items-center bg-sky-200 px-3 py-1.5 rounded-full`}>
                    <Text style={tw`text-[14px] mr-1.5`}>🍕</Text>
                    <Text style={[tw`text-gray-900 text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Free food</Text>
                  </View>
                </TouchableOpacity>
                {/* Custom text input for "What's special?" */}
                {specialBox.food && (
                  <View style={[tw`pl-6.5`, { position: 'relative' }]}>
                    <TextInput
                      style={[
                        tw`items-center text-white bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-[13px] pr-8`,
                        { fontFamily: 'Nunito-Medium' }
                      ]}
                      placeholder="Add details (optional)"
                      placeholderTextColor="#9ca3af"
                      value={special.food}
                      onChangeText={text => setSpecial(sp => ({ ...sp, food: text }))}
                    />
                    {special.food.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSpecial(sp => ({ ...sp, food: '' }))}
                        style={{ position: 'absolute', right: 8, top: 0, bottom: 0, justifyContent: 'center' }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              <View style={tw`gap-1.5`}>
                <TouchableOpacity style={tw`flex-row items-center gap-2.5`}
                  onPress={() => setSpecialBox((sp) => ({ ...sp, merch: !specialBox.merch }))}
                  activeOpacity={0.7}
                >
                  <View style={[tw`w-4 h-4 rounded border border-gray-400 items-center justify-center ${specialBox.merch ? 'bg-[#7A5CFA]' : 'bg-white/10'}`]}>
                    {/* Unchecked: no checkmark */}
                  </View>
                  <View style={tw`flex-row items-center bg-pink-200/90 px-3 py-1.5 rounded-full`}>
                    <Text style={tw`text-[14px] mr-1.5`}>👕</Text>
                    <Text style={[tw`text-gray-900 text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Free merch</Text>
                  </View>
                </TouchableOpacity>
                {/* Custom text input for "What's special?" */}
                {specialBox.merch && (
                  <View style={[tw`pl-6.5`, { position: 'relative' }]}>
                    <TextInput
                      style={[
                        tw`items-center text-white bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-[13px] pr-8`,
                        { fontFamily: 'Nunito-Medium' }
                      ]}
                      placeholder="Add details (optional)"
                      placeholderTextColor="#9ca3af"
                      value={special.merch}
                      onChangeText={text => setSpecial(sp => ({ ...sp, merch: text }))}
                    />
                    {special.merch.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSpecial(sp => ({ ...sp, merch: '' }))}
                        style={{ position: 'absolute', right: 8, top: 0, bottom: 0, justifyContent: 'center' }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              <View style={tw`gap-1.5`}>
                <TouchableOpacity style={tw`flex-row items-center gap-2.5`}
                  onPress={() => setSpecialBox((sp) => ({ ...sp, coolPrize: !specialBox.coolPrize }))}
                  activeOpacity={0.7}
                >
                  <View style={[tw`w-4 h-4 rounded border border-gray-400 items-center justify-center ${specialBox.coolPrize ? 'bg-[#7A5CFA]' : 'bg-white/10'}`]}>
                    {/* Unchecked: no checkmark */}
                  </View>
                  <View style={tw`flex-row items-center bg-green-200/90 px-3 py-1.5 rounded-full`}>
                    <Text style={tw`text-[14px] mr-1.5`}>🎟️</Text>
                    <Text style={[tw`text-gray-900 text-[14px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Cool prizes</Text>
                  </View>
                </TouchableOpacity>
                {/* Custom text input for "What's special?" */}
                {specialBox.coolPrize && (
                  <View style={[tw`pl-6.5`, { position: 'relative' }]}>
                    <TextInput
                      style={[
                        tw`items-center text-white bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-[13px] pr-8`,
                        { fontFamily: 'Nunito-Medium' }
                      ]}
                      placeholder="Add details (optional)"
                      placeholderTextColor="#9ca3af"
                      value={special.coolPrize}
                      onChangeText={text => setSpecial(sp => ({ ...sp, coolPrize: text }))}
                    />
                    {special.coolPrize.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSpecial(sp => ({ ...sp, coolPrize: '' }))}
                        style={{ position: 'absolute', right: 8, top: 0, bottom: 0, justifyContent: 'center' }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* More settings modal */}
          <View style={tw`px-4 mb-16`}>
            <TouchableOpacity
              style={tw`flex-row items-center justify-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 mt-2`}
              onPress={() => setShowMoreSettingsModal(true)}
              activeOpacity={0.7}
            >
              <Text style={[tw`text-white text-[13px]`, { fontFamily: 'Nunito-ExtraBold' }]}>More settings</Text>
              <Ionicons name="chevron-down" size={13} color="#fff" style={tw`mt-0.5`} />
            </TouchableOpacity>
          </View>
          {/* </KeyboardAwareScrollView > */}

          <CohostModal
            visible={showCohostModal}
            onClose={() => setShowCohostModal(false)}
            friends={friends}
            cohosts={cohosts}
            onSave={setCohosts}
          />
          <SaveDraftModal
            visible={showDraftModal}
            onClose={() => setShowDraftModal(false)}
            onSaveDraft={async () => {
              setShowDraftModal(false);
              setShowEventDoneModal(false);
              // Save as draft (done: false)
              let draftErr, dataEvent;
              let draftImage = null;
              if (typeof image === 'string') {
                if (image.startsWith('file://') || image.startsWith('content://') || image.startsWith('http://') || image.startsWith('https://')) {
                  draftImage = image;
                } else if (image.startsWith('default_')) {
                  draftImage = image;
                } else {
                  draftImage = image;
                }
              } else if (typeof image === 'number') {
                const idx = imageOptions.findIndex(opt => opt === image);
                draftImage = idx >= 0 ? `default_${idx + 1}` : 'default_1';
              } else if (image && image.uri) {
                draftImage = image.uri;
              }
              if (id) {
                ({ data: dataEvent, error: draftErr } = await supabase.from('events')
                  .update({
                    title: title,
                    public: publicEvent,
                    start: (date.dateChosen ? date.start : null),
                    end: (date.endSet ? date.end : null),
                    location_add: location.selected || '',
                    location_name: location.name || location.selected || '',
                    location_more: location.aptSuite || '',
                    location_note: location.notes || '',
                    rsvpfirst: location.rsvpFirst,
                    rsvp_deadline: rsvpDL,
                    bio: bio,
                    cash_prize: specialBox.cash ? special.cash : null,
                    free_food: specialBox.food ? special.food : null,
                    free_merch: specialBox.merch ? special.merch : null,
                    cool_prize: specialBox.coolPrize ? special.coolPrize : null,
                    host_id: user.id,
                    public_list: list.public,
                    maybe: list.maybe,
                    done: false,
                    school_id: user.school_id,
                    image: draftImage
                  })
                  .eq('id', id)
                  .select('id'));
                if (!draftErr && dataEvent && dataEvent[0]?.id) {
                  setID(dataEvent[0].id);
                  setShowDraftSavedModal(true);
                  setTimeout(() => {
                    setShowDraftSavedModal(false);
                    router.replace('/home/homepage');
                  }, 500);
                } else {
                  Alert.alert('Failed to update draft');
                }
              } else {
                ({ data: dataEvent, error: draftErr } = await supabase.from('events')
                  .insert([{
                    title: title,
                    public: publicEvent,
                    start: (date.dateChosen ? date.start : null),
                    end: (date.endSet ? date.end : null),
                    location_add: location.selected || '',
                    location_name: location.name || location.selected || '',
                    location_more: location.aptSuite || '',
                    location_note: location.notes || '',
                    rsvpfirst: location.rsvpFirst,
                    rsvp_deadline: rsvpDL,
                    bio: bio,
                    cash_prize: specialBox.cash ? special.cash : null,
                    free_food: specialBox.food ? special.food : null,
                    free_merch: specialBox.merch ? special.merch : null,
                    cool_prize: specialBox.coolPrize ? special.coolPrize : null,
                    host_id: user.id,
                    public_list: list.public,
                    maybe: list.maybe,
                    done: false,
                    school_id: user.school_id,
                    image: draftImage
                  }])
                  .select('id'));
                if (!draftErr && dataEvent && dataEvent[0]?.id) {
                  setID(dataEvent[0].id);
                  setShowDraftSavedModal(true);
                  setTimeout(() => {
                    setShowDraftSavedModal(false);
                    router.replace('/home/homepage');
                  }, 1200);
                } else {
                  Alert.alert('Failed to save draft');
                }
              }
            }}
            onContinueEditing={() => setShowDraftModal(false)}
            onDiscardEvent={() => {
              setShowDraftModal(false);
              setTitle('');
              setBio('');
              setLocation({ search: '', selected: '', rsvpFirst: false, name: '', aptSuite: '', notes: '' });
              setRSVPDL(null);
              setRSVPDLTime(null);
              setSpecial({ cash: '', food: '', merch: '', coolPrize: '' });
              setSpecialBox({ cash: false, food: false, merch: false, coolPrize: false });
              setDate({
                start: new Date(),
                end: new Date(),
                startTime: '12:00am',
                endTime: '12:00am',
                endSet: false,
                dateChosen: false,
              });
              setImage(imageOptions[Math.floor(Math.random() * imageOptions.length)]);
              setID('');
              setCohosts([]);
              // No alert for event discarded
              setTimeout(() => {
                router.replace('/home/homepage');
              }, 0);
            }}
          />
          <LocationModal
            visible={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            location={location}
            setLocation={setLocation}
            locations={Array.isArray(locations) ? locations : []}
          />
          <DateTimeModal
            visible={showDateTimeModal}
            onClose={() => {
              setShowDateTimeModal(false);
            }}
            startDate={date.start}
            startTime={date.startTime}
            endSet={date.endSet}
            endDate={date.end || new Date()}
            endTime={date.endTime || '12:00am'}
            onSave={({ start, end, startTime, endTime, endSet }) => {
              // Helper to combine date and time string into a Date object
              function combineDateAndTime(dateObj: Date, timeStr: string): Date {
                const match = timeStr.match(/(\d+):(\d+)(am|pm)/i);
                if (!match) return new Date(dateObj);
                let [_, hourStr, minStr, ampm] = match;
                let hour = Number(hourStr);
                let minute = Number(minStr);
                if (ampm.toLowerCase() === 'pm' && hour !== 12) hour += 12;
                if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
                const newDate = new Date(dateObj);
                newDate.setHours(hour, minute, 0, 0);
                return newDate;
              }

              const now = new Date();
              const startDateTime = combineDateAndTime(start, String(startTime));
              const endDateTime = combineDateAndTime(end, String(endTime || '12:00am'));

              // 1. Start must not be before now
              if (startDateTime.getTime() < now.getTime()) {
                alert("Start date and time must not be before the current time.");
                return;
              }

              // 2. End must be at least 30 minutes after start
              if (endSet && endDateTime.getTime() - startDateTime.getTime() < 30 * 60 * 1000) {
                alert("End date and time must be at least 30 minutes after the start.");
                return;
              }

              // If valid, update date state and close modal
              setDate((prev) => ({
                ...prev,
                start: start,
                startTime: String(startTime),
                end: end,
                endTime: String(endTime),
                endSet: endSet,
                dateChosen: true,
              }));
              setShowDateTimeModal(false);
            }}
          />
          <ImageModal
            visible={showImageModal}
            onClose={() => { setShowImageModal(false) }}
            imageOptions={imageOptions}
            onSelect={(img) => { setImage(img) }}
          />
          <MoreSettingsModal
            visible={showMoreSettingsModal}
            onClose={() => setShowMoreSettingsModal(false)}
            list={list}
            setList={setList}
          />
          <RSVPDeadlineModal
            visible={showRSVPModal}
            onClose={() => setShowRSVPModal(false)}
            initialDate={rsvpDL ?? new Date()}
            initialTime={rsvpDLTime ?? ''}
            maxDate={date.start}
            minDate={(() => {
              const start = new Date(date.start);
              const min = new Date(start);
              min.setDate(min.getDate() - 7);
              const now = new Date();
              // minDate cannot be before today
              if (min < now) return now;
              return min;
            })()}
            onSave={(rsvpDate, rsvpTime) => {
              // Check if the selected date is within 7 days before the event start date
              const startDate = new Date(date.start);
              const selectedDate = new Date(rsvpDate);
              const diffMs = startDate.getTime() - selectedDate.getTime();
              const diffDays = diffMs / (1000 * 60 * 60 * 24);
              setRSVPDL(rsvpDate);
              setRSVPDLTime(rsvpTime);
              setShowRSVPModal(false);

            }}
          />
          <EventDoneModal
            visible={showEventDoneModal}
            onClose={() => setShowEventDoneModal(false)}
            onPublish={async () => {
              setShowEventDoneModal(false);
              setToastVisible(true);
              const newId = await addEvent();
              if (newId) {
                await updateImage(newId);
                await addCohost(newId);

                setTimeout(() => {
                  router.replace('/home/homepage');
                }, 500);
              }
            }}
            onSaveDraft={async () => {
              setShowEventDoneModal(false);
              // Save as draft (done: false)
              let draftErr, dataEvent;
              let draftImage = null;
              if (typeof image === 'string') {
                if (image.startsWith('file://') || image.startsWith('content://') || image.startsWith('http://') || image.startsWith('https://')) {
                  draftImage = image;
                } else if (image.startsWith('default_')) {
                  draftImage = image;
                } else {
                  draftImage = image;
                }
              } else if (typeof image === 'number') {
                const idx = imageOptions.findIndex(opt => opt === image);
                draftImage = idx >= 0 ? `default_${idx + 1}` : 'default_1';
              } else if (image && image.uri) {
                draftImage = image.uri;
              }
              if (id) {
                ({ data: dataEvent, error: draftErr } = await supabase.from('events')
                  .update({
                    title: title,
                    public: publicEvent,
                    start: (date.dateChosen ? date.start : null),
                    end: (date.endSet ? date.end : null),
                    location_add: location.selected || '',
                    location_name: location.name || location.selected || '',
                    location_more: location.aptSuite || '',
                    location_note: location.notes || '',
                    rsvpfirst: location.rsvpFirst,
                    rsvp_deadline: rsvpDL,
                    bio: bio,
                    cash_prize: specialBox.cash ? special.cash : null,
                    free_food: specialBox.food ? special.food : null,
                    free_merch: specialBox.merch ? special.merch : null,
                    cool_prize: specialBox.coolPrize ? special.coolPrize : null,
                    host_id: user.id,
                    public_list: list.public,
                    maybe: list.maybe,
                    done: false,
                    school_id: user.school_id,
                    image: draftImage
                  })
                  .eq('id', id)
                  .select('id'));
                if (!draftErr && dataEvent && dataEvent[0]?.id) {
                  setID(dataEvent[0].id);
                  Alert.alert('Draft updated!');
                  setTimeout(() => {
                    router.replace('/home/homepage');
                  }, 250);
                } else {
                  Alert.alert('Failed to update draft');
                }
              } else {
                ({ data: dataEvent, error: draftErr } = await supabase.from('events')
                  .insert([{
                    title: title,
                    public: publicEvent,
                    start: (date.dateChosen ? date.start : null),
                    end: (date.endSet ? date.end : null),
                    location_add: location.selected || '',
                    location_name: location.name || location.selected || '',
                    location_more: location.aptSuite || '',
                    location_note: location.notes || '',
                    rsvpfirst: location.rsvpFirst,
                    rsvp_deadline: rsvpDL,
                    bio: bio,
                    cash_prize: specialBox.cash ? special.cash : null,
                    free_food: specialBox.food ? special.food : null,
                    free_merch: specialBox.merch ? special.merch : null,
                    cool_prize: specialBox.coolPrize ? special.coolPrize : null,
                    host_id: user.id,
                    public_list: list.public,
                    maybe: list.maybe,
                    done: false,
                    school_id: user.school_id,
                    image: draftImage
                  }])
                  .select('id'));
                if (!draftErr && dataEvent && dataEvent[0]?.id) {
                  setID(dataEvent[0].id);
                  Alert.alert('Draft saved!');
                  setTimeout(() => {
                    router.replace('/home/homepage');
                  }, 250);
                } else {
                  Alert.alert('Failed to save draft');
                }
              }
            }}
            onContinueEdit={() => setShowEventDoneModal(false)}
          />
        </View>
      </KeyboardAwareScrollView >
    </View>
  );
}