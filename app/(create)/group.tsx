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
    const params = useLocalSearchParams();
    const [title, setTitle] = useState('');
    const [publicEvent, setPublic] = useState(true);
    const imageOptions = defaultImages;
    const [image, setImage] = useState(imageOptions[Math.floor(Math.random() * imageOptions.length)]);
    const [id, setID] = useState('');
    const [imageURL, setImageURL] = useState('');

    const { user } = useUserStore();
    const [bio, setBio] = useState('');
    const [showImageModal, setShowImageModal] = useState(false);

    const addGroup = async () => {
        // Check if event title, date, RSVP deadline, and location are available
        if (!title) {
            Alert.alert('Please fill in all required fields, including location.');
            return null;
        }

        let draftErr;
        let dataEvent;

        if (id === '') {
            // Insert new event if id is empty
            ({ data: dataEvent, error: draftErr } = await supabase.from('groups')
                .insert([{
                    title: title, public: publicEvent,
                    creator: user.id, bio: bio,
                }])
                .select('id') // Request the id of the inserted event
            );
        } else {
            // Update existing event if id is not empty
            ({ error: draftErr } = await supabase.from('groups')
                .update({
                    title: title, public: publicEvent,
                    creator: user.id, bio: bio,
                })
                .eq('id', id));
        }

        // Check if event meets all conditions
        const isValid = title !== '';
        if (isValid && !draftErr) {
            setShowSuccessToast(true);
            if (dataEvent) {
                setID(dataEvent[0].id);
                return dataEvent[0].id; // <-- return the new id
            }
            return id;
        } else {
            Alert.alert('error bitch');
            return null;
        }
    }

    const updateImage = async (eventId: string) => {
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
                    const fileName = `group/${eventId}.${fileExtension}`;

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
                        .from('homee-img')
                        .upload(fileName, uint8Array, {
                            contentType: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
                            upsert: true
                        });

                    if (uploadError) {
                        console.error('Upload error:', uploadError);
                        return;
                    }

                    const { data: urlData } = await supabase.storage
                        .from('homee-img')
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
            setImageURL(`default`);
            imgURL = `default`;
        }

        if (!eventId) {
            console.error("No event id provided for update.");
        } else if (!imgURL) {
            console.error("No imageURL provided for update.");
        } else {
            const { error: setAvatarError } = await supabase
                .from('groups')
                .update({ group_image: imgURL })
                .eq('id', eventId)
                .select();

            if (setAvatarError) {
                console.error("Set error:", setAvatarError);
            } else {
                console.log("Update result");
            }
        }
    }

    const [showEventDoneModal, setShowEventDoneModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastAnim] = useState(new Animated.Value(1));

    return (
        <View style={tw`w-full h-full`}>
            {/* Background image, absolutely positioned, does not scroll */}
            <Image
                source={
                    typeof image === 'string'
                        ? { uri: image }
                        : image && image.uri
                            ? { uri: image.uri }
                            : image
                }
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                    zIndex: 0,
                }}
                blurRadius={8}
                onError={e => {
                    console.log('Background image failed to load:', e.nativeEvent);
                }}
            />
            {/* Foreground content scrolls, background does not */}
            <View style={tw`w-full h-full pt-3 bg-black bg-opacity-60`}>
                <KeyboardAwareScrollView
                    style={{ flex: 1, zIndex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    enableOnAndroid={true}
                    extraScrollHeight={0}
                    showsVerticalScrollIndicator={false}
                    resetScrollToCoords={{ x: 0, y: 0 }}
                    scrollEnabled={!showImageModal}
                >
                    
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
                        <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>
                            {id ? 'Update group' : 'Create group'}
                        </Text>
                    </View>
                    {/* Done button - absolute right */}
                    {/* Determine if all required fields are filled and if editing */}
                    {(() => {
                        const requiredFilled = title;
                        const isEditing = id;
                        return requiredFilled ? (
                            <TouchableOpacity
                                style={[tw`absolute right-4 rounded-full px-4 py-1 bg-[#7A5CFA]`, { zIndex: 2 }]}
                                onPress={async () => {
                                    if (isEditing) {
                                        setToastVisible(true);
                                        const newId = await addGroup();
                                        if (newId) {
                                            await updateImage(newId);
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
                                style={[tw`absolute right-4 rounded-full px-4 py-1 bg-[#7A5CFA] opacity-50`, { zIndex: 2 }]}
                                disabled
                            >
                                <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Done</Text>
                            </TouchableOpacity>
                        );
                    })()}
                </View>

                {/* Title input */}
                <View style={[tw`px-4 py-3 mx-4 mb-3 items-center border border-white/10 rounded-xl bg-white/5`]}>
                    <TextInput
                        style={[
                            tw`text-white text-[24px] w-full`,
                            {
                                fontFamily: 'Nunito-ExtraBold',
                                textAlign: 'left',
                                textAlignVertical: 'center',
                            }
                        ]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder='your group title...'
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
                        <Text style={[tw`text-[13px] text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Invite only</Text>
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
                            <Camera width={16} height={16} style={tw`mt-0.2`} />
                            <Text style={[tw`text-[13px] text-black`, { fontFamily: 'Nunito-ExtraBold' }]}>{'Choose image'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* About this event */}
                <View style={tw`px-4 mb-3`}>
                    <View style={tw`bg-white/10 border border-white/10 rounded-xl px-4 pt-3 pb-2`}>
                        <TextInput
                            style={[
                                tw`text-white text-[15px] px-0 py-0 text-left leading-[1.4]`,
                                {
                                    fontFamily: bio ? 'Nunito-ExtraBold' : 'Nunito-ExtraBold',
                                    minHeight: 60,
                                    textAlignVertical: 'top'
                                }
                            ]}
                            placeholder="About this group..."
                            placeholderTextColor="#9ca3af"
                            multiline={true}
                            value={bio}
                            onChangeText={text => {
                                if (text.length <= 100) setBio(text);
                            }}
                            blurOnSubmit={true}
                            returnKeyType="done"
                            maxLength={100}
                        />
                        <View style={tw`flex-row justify-end items-center mt-0.5 -mr-1`}>
                            <Text
                                style={[
                                    tw`text-[12px] mr-0.5`,
                                    { fontFamily: 'Nunito-Medium' },
                                    bio.length >= 100 ? tw`text-rose-600` : tw`text-gray-400`
                                ]}
                            >
                            {bio.length}/100
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
                        const newId = await addGroup();
                        if (newId) {
                            await updateImage(newId);

                            setTimeout(() => {
                                router.replace('/home/homepage');
                            }, 500);
                        }
                    }}
                    onContinueEdit={() => setShowEventDoneModal(false)}
                />
                </KeyboardAwareScrollView>
            </View>
        </View>
    );
}