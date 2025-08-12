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

export default function CreateAlbum() {
    const { groupId, name } = useLocalSearchParams();
    const [groupID, setGroupID] = useState(groupId ?? '');
    const [groupName, setGroupName] = useState(name ?? '');
    const [title, setTitle] = useState('');
    const [publicEvent, setPublic] = useState(true);
    const imageOptions = defaultImages;
    const [image, setImage] = useState(imageOptions[Math.floor(Math.random() * imageOptions.length)]);
    const [userGroups, setUserGroups] = useState<{ id: string; title: string }[]>([]);
    const [id, setID] = useState('');
    const [imageURL, setImageURL] = useState('');
    const [bio, setBio] = useState('');
    const [showImageModal, setShowImageModal] = useState(false);
    const { user } = useUserStore();

    useEffect(() => {
        const fetchUserGroups = async () => {
            if (!user?.id) return;

            // Get groups where user is creator
            const { data: createdGroups, error: createdError } = await supabase
                .from('groups')
                .select('id, title')
                .eq('creator', user.id);

            // Get group memberships
            const { data: memberships, error: membershipsError } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);

            let joinedGroups: { id: string; title: string }[] = [];
            if (memberships && memberships.length > 0) {
                const groupIds = memberships.map(m => m.group_id);
                const { data: joined, error: joinedError } = await supabase
                    .from('groups')
                    .select('id, title')
                    .in('id', groupIds);

                if (joined) {
                    joinedGroups = joined;
                }
            }

            // Merge and deduplicate groups
            const allGroups = [
                ...(createdGroups || []),
                ...joinedGroups
            ];
            // Remove duplicates by group id
            const uniqueGroups = Array.from(
                new Map(allGroups.map(g => [g.id, g])).values()
            );
            setUserGroups(uniqueGroups);
        };

        fetchUserGroups();
        console.log(userGroups);
    }, [user?.id]);

    const addGroup = async () => {
        console.log('adding');
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

        console.log("Attempting to update event image", { eventId, imgURL });

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
                                {id ? 'Update album' : groupID ? `Create album for group ${groupName}` : 'Create album'}
                            </Text>
                        </View>
                        {/* Done button - absolute right */}
                        {/* Determine if all required fields are filled and if editing */}
                        {(() => {
                            const requiredFilled = title;
                            const isEditing = id;
                            return requiredFilled ? (
                                <TouchableOpacity
                                    style={[tw`absolute right-4 rounded-full px-4 py-1 bg-[#7b61ff]`, { zIndex: 2 }]}
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
                                    style={[tw`absolute right-4 rounded-full px-4 py-1 bg-gray-500/60`, { zIndex: 2 }]}
                                    disabled
                                >
                                    <Text style={[tw`text-white`, { fontFamily: 'Nunito-ExtraBold' }]}>Done</Text>
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
                            placeholder='your album title'
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
                                placeholder="About this album..."
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

                    <View style={tw`px-4 mb-3`}>
                        <View style={tw`bg-white/10 border border-white/20 rounded-xl px-4 pt-3 pb-2`}>
                            <Text style={[tw`text-white text-xs mb-2`, { fontFamily: 'Nunito-Bold' }]}>
                                Choose a group
                            </Text>
                            <View style={tw`bg-white/10 rounded-lg border border-white/20`}>
                                <TouchableOpacity
                                    style={tw`flex-row items-center justify-between px-3 py-2`}
                                    onPress={() => {
                                        // Show a simple picker modal
                                        Alert.alert(
                                            "Select Group",
                                            "",
                                            userGroups.map(g => ({
                                                text: g.title,
                                                onPress: () => {
                                                    setGroupID(g.id);
                                                    setGroupName(g.title);
                                                }
                                            }))
                                        );
                                    }}
                                >
                                    <Text style={[
                                        tw`text-white text-base`,
                                        { fontFamily: groupName ? 'Nunito-Medium' : 'Nunito-Light' }
                                    ]}>
                                        {groupName ? groupName : "Select a group..."}
                                    </Text>
                                    <Ionicons name="chevron-down" size={18} color="#fff" />
                                </TouchableOpacity>
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
                </View>
            </KeyboardAwareScrollView >
        </View>
    );
}