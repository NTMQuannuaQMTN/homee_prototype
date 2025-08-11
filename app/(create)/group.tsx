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
import Private from '../../assets/icons/private.svg';
import Public from '../../assets/icons/public.svg';
import defaultImages from './defaultimage';
import EventDoneModal from './eventdonemodal';
import ImageModal from './imageModal';

export default function CreateGroup() {
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
    const [bio, setBio] = useState('');
    const [showImageModal, setShowImageModal] = useState(false);

    // const addEvent = async () => {
    //     console.log('adding');
    //     // Check if event title, date, RSVP deadline, and location are available
    //     if (!title || !date.dateChosen || !rsvpDL || !(location.name || location.selected)) {
    //         Alert.alert('Please fill in all required fields, including location.');
    //         return null;
    //     }
    //     // Combine start date and start time into a single Date object for 'start'
    //     const startDateTime = new Date(
    //         date.start.getFullYear(),
    //         date.start.getMonth(),
    //         date.start.getDate(),
    //         (() => {
    //             // Parse hour and minute from date.startTime (e.g., "7:15pm")
    //             const match = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(date.startTime);
    //             if (!match) return 0;
    //             let hour = parseInt(match[1], 10);
    //             const ampm = match[3];
    //             if (ampm.toLowerCase() === 'pm' && hour !== 12) hour += 12;
    //             if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
    //             return hour;
    //         })(),
    //         (() => {
    //             const match = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(date.startTime);
    //             if (!match) return 0;
    //             return parseInt(match[2], 10);
    //         })(),
    //         0,
    //         0
    //     );

    //     // Combine end date and end time into a single Date object for 'end'
    //     const endDateTime = new Date(
    //         date.end.getFullYear(),
    //         date.end.getMonth(),
    //         date.end.getDate(),
    //         (() => {
    //             // Parse hour and minute from date.endTime (e.g., "7:15pm")
    //             const match = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(date.endTime);
    //             if (!match) return 0;
    //             let hour = parseInt(match[1], 10);
    //             const ampm = match[3];
    //             if (ampm.toLowerCase() === 'pm' && hour !== 12) hour += 12;
    //             if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
    //             return hour;
    //         })(),
    //         (() => {
    //             const match = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(date.endTime);
    //             if (!match) return 0;
    //             return parseInt(match[2], 10);
    //         })(),
    //         0,
    //         0
    //     );

    //     console.log(startDateTime, endDateTime);

    //     let draftErr;
    //     let dataEvent;

    //     if (id === '') {
    //         // Insert new event if id is empty
    //         ({ data: dataEvent, error: draftErr } = await supabase.from('events')
    //             .insert([{
    //                 title: title, public: publicEvent,
    //                 start: (date.dateChosen ? startDateTime : null),
    //                 end: (date.endSet ? endDateTime : null),
    //                 location_add: location.selected || '',
    //                 location_name: location.name || location.selected || '',
    //                 location_more: location.aptSuite || '',
    //                 location_note: location.notes || '',
    //                 rsvpfirst: location.rsvpFirst, rsvp_deadline: rsvpDL,
    //                 bio: bio, cash_prize: specialBox.cash ? special.cash : null,
    //                 free_food: specialBox.food ? special.food : null,
    //                 free_merch: specialBox.merch ? special.merch : null,
    //                 cool_prize: specialBox.coolPrize ? special.coolPrize : null,
    //                 host_id: user.id, public_list: list.public, maybe: list.maybe,
    //                 done: !(title === '' || !date.dateChosen || !rsvpDL || !(location.name || location.selected)),
    //                 school_id: user.school_id
    //             }])
    //             .select('id') // Request the id of the inserted event
    //         );
    //     } else {
    //         // Update existing event if id is not empty
    //         ({ error: draftErr } = await supabase.from('events')
    //             .update({
    //                 title: title, public: publicEvent,
    //                 start: (date.dateChosen ? startDateTime : null),
    //                 end: (date.endSet ? endDateTime : null),
    //                 location_add: location.selected || '',
    //                 location_name: location.name || location.selected || '',
    //                 location_more: location.aptSuite || '',
    //                 location_note: location.notes || '',
    //                 rsvpfirst: location.rsvpFirst, rsvp_deadline: rsvpDL,
    //                 bio: bio, cash_prize: specialBox.cash ? special.cash : null,
    //                 free_food: specialBox.food ? special.food : null,
    //                 free_merch: specialBox.merch ? special.merch : null,
    //                 cool_prize: specialBox.coolPrize ? special.coolPrize : null,
    //                 done: !(title === '' || !date.dateChosen || !rsvpDL || !(location.name || location.selected)),
    //             })
    //             .eq('id', id));
    //     }

    //     // Check if event meets all conditions
    //     const isValid = title !== '' && date.dateChosen && rsvpDL;
    //     if (isValid && !draftErr) {
    //         setShowSuccessToast(true);
    //         if (dataEvent) {
    //             setID(dataEvent[0].id);
    //             console.log(dataEvent[0].id);
    //             return dataEvent[0].id; // <-- return the new id
    //         }
    //         return id;
    //     } else {
    //         Alert.alert('error bitch');
    //         return null;
    //     }
    // }

    // const updateImage = async (eventId: string) => {
    //     console.log('updating');
    //     let imgURL = '';
    //     if (image && typeof image !== 'number') {
    //         // If image is already a URL, just use it
    //         if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
    //             setImageURL(image);
    //             imgURL = image;
    //         } else {
    //             try {
    //                 // Get file info and determine file extension
    //                 const fileUri = image;
    //                 const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
    //                 const fileName = `event_cover/${eventId}.${fileExtension}`;

    //                 // Read file as ArrayBuffer for proper binary upload
    //                 const fileArrayBuffer = await FileSystem.readAsStringAsync(fileUri, {
    //                     encoding: FileSystem.EncodingType.Base64,
    //                 });

    //                 // Convert base64 to Uint8Array
    //                 const byteCharacters = atob(fileArrayBuffer);
    //                 const byteNumbers = new Array(byteCharacters.length);
    //                 for (let i = 0; i < byteCharacters.length; i++) {
    //                     byteNumbers[i] = byteCharacters.charCodeAt(i);
    //                 }
    //                 const uint8Array = new Uint8Array(byteNumbers);

    //                 const { error: uploadError } = await supabase.storage
    //                     .from('sizzl-profileimg')
    //                     .upload(fileName, uint8Array, {
    //                         contentType: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
    //                         upsert: true
    //                     });

    //                 if (uploadError) {
    //                     console.error('Upload error:', uploadError);
    //                     return;
    //                 }

    //                 const { data: urlData } = await supabase.storage
    //                     .from('sizzl-profileimg')
    //                     .getPublicUrl(fileName);

    //                 const publicUrl = urlData?.publicUrl;
    //                 setImageURL(publicUrl);
    //                 imgURL = publicUrl;
    //             } catch (err) {
    //                 console.error('Image upload exception:', err);
    //                 Alert.alert('Image upload failed');
    //             }
    //         }
    //     } else {
    //         setImageURL(`default_${image - 28}`);
    //         imgURL = `default_${image - 28}`;
    //     }

    //     // Now, after all awaits above, update the event image
    //     // Why I check and there is no update?
    //     // The update may not happen if imageURL is undefined/null, or if the id is wrong, or if the value is the same as before.
    //     // Let's log more details for debugging:
    //     console.log("Attempting to update event image", { eventId, imageURL });

    //     if (!eventId) {
    //         console.error("No event id provided for update.");
    //     } else if (!imgURL) {
    //         console.error("No imageURL provided for update.");
    //     } else {
    //         const { data: checkData, error: setAvatarError } = await supabase
    //             .from('events')
    //             .update({ image: imgURL })
    //             .eq('id', eventId)
    //             .select();

    //         if (setAvatarError) {
    //             console.error("Set error:", setAvatarError);
    //         } else if (!checkData || checkData.length === 0) {
    //             console.warn("Update succeeded but no rows returned. Possible reasons: id not found, or image value unchanged.");
    //         } else {
    //             console.log("Update result:", checkData);
    //         }
    //     }
    // }

    const [showEventDoneModal, setShowEventDoneModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastAnim] = useState(new Animated.Value(1));

    return (
        <View style={tw`w-full h-full`}>
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
                            onPress={() => router.back()}
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
                            const requiredFilled = title && date.dateChosen;
                            const isEditing = id && draftLoaded;
                            return requiredFilled ? (
                                <TouchableOpacity
                                    style={[tw`absolute right-4 rounded-full px-4 py-1 bg-[#7b61ff]`, { zIndex: 2 }]}
                                    onPress={async () => {
                                        if (isEditing) {
                                            // Directly publish the updated event
                                            setToastVisible(true);
                                            // const newId = await addEvent();
                                            if (true 
                                                // newId
                                            ) {
                                                // await updateImage(newId);
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
                                    // onPress={() => setShowDraftModal(true)}
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
                        <TouchableOpacity style={[tw`rounded-xl overflow-hidden w-full items-center justify-center relative`, { aspectRatio: 1 / 1 }]}
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

                    <ImageModal
                        visible={showImageModal}
                        onClose={() => { setShowImageModal(false) }}
                        imageOptions={imageOptions}
                        onSelect={(img) => { setImage(img) }}
                    />
                    <EventDoneModal
                        visible={showEventDoneModal}
                        onClose={() => setShowEventDoneModal(false)}
                        onPublish={async () => {
                            setShowEventDoneModal(false);
                            setToastVisible(true);
                            // const newId = await addEvent();
                            // if (newId) {
                            //     await updateImage(newId);

                            //     setTimeout(() => {
                            //         router.replace('/home/homepage');
                            //     }, 500);
                            // }
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