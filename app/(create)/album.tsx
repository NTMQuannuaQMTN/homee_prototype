import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from "expo-image-picker";
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
import { useImageStore } from '../store/imageStore';

export default function CreateAlbum() {
    const { groupId, name, img } = useLocalSearchParams();
    const [groupID, setGroupID] = useState(groupId ?? '');
    const [groupName, setGroupName] = useState(name ?? '');
    const [groupImage, setGroupImage] = useState(img ?? '');
    const [title, setTitle] = useState('');
    const [userGroups, setUserGroups] = useState<{ id: string; title: string; group_image: string; }[]>([]);
    const [id, setID] = useState('');
    const [bio, setBio] = useState('');
    const [showImageModal, setShowImageModal] = useState(false);
    const { user } = useUserStore();
    const { images, setImages } = useImageStore();

    const width = Dimensions.get('window').width;

    useEffect(() => {
        const fetchUserGroups = async () => {
            if (!user?.id) return;

            // Get groups where user is creator
            const { data: createdGroups, error: createdError } = await supabase
                .from('groups')
                .select('id, title, group_image')
                .eq('creator', user.id);

            // Get group memberships
            const { data: memberships, error: membershipsError } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);

            let joinedGroups: { id: string; title: string; group_image: string; }[] = [];
            if (memberships && memberships.length > 0) {
                const groupIds = memberships.map(m => m.group_id);
                const { data: joined, error: joinedError } = await supabase
                    .from('groups')
                    .select('id, title, group_image')
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
        setImages([]);
    }, [user?.id]);

    const addAlbum = async () => {
        // Check if event title, date, RSVP deadline, and location are available
        if (!title) {
            Alert.alert('Please fill in all required fields, including location.');
            return null;
        }

        let draftErr;
        let dataEvent;

        if (id === '') {
            // Insert new event if id is empty
            ({ data: dataEvent, error: draftErr } = await supabase.from('albums')
                .insert([{
                    title: title, bio: bio,
                    group: groupID, creator: user.id
                }])
                .select('id') // Request the id of the inserted event
            );
        } else {
            // Update existing event if id is not empty
            ({ error: draftErr } = await supabase.from('albums')
                .update({
                    title: title, bio: bio,
                    group: groupID, creator: user.id
                })
                .eq('id', id));
        }

        // Check if event meets all conditions
        const isValid = title !== '';
        if (isValid && !draftErr) {
            setShowSuccessToast(true);
            if (dataEvent) {
                setID(dataEvent[0].id);
            }
            router.back();
        } else {
            Alert.alert('error bitch');
            return null;
        }
    }

    const addImages = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
                allowsMultipleSelection: true,
                selectionLimit: 0, // 0 means unlimited in Expo SDK 49+
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImages([
                    ...images,
                    ...result.assets.map(asset => ({
                        uri: asset.uri,
                        caption: "",
                    }))
                ]);
                console.log(...result.assets.map(asset => ({
                    uri: asset.uri,
                    caption: "",
                })));
            }
        } catch (e) {
            // handle error
        }
    }

    const [showEventDoneModal, setShowEventDoneModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastAnim] = useState(new Animated.Value(1));

    return (
        <View style={tw`w-full h-full`}>
            {/* Background image and overlay */}
            <Image
                source={typeof groupImage === 'string' ? { uri: groupImage } : undefined}
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
                                {id ? 'Update album' : groupID ? `Create album` : 'Create album'}
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
                                            addAlbum();
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
                            placeholder='your album title...'
                            placeholderTextColor={'#9ca3af'}
                            multiline={false}
                            maxLength={60}
                            returnKeyType="done"
                        />
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
                                                    setGroupImage(g.group_image);
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

                    <View style={tw`px-4 mb-3`}>
                        <View style={tw`bg-white/10 border border-white/20 rounded-xl px-4 pt-3 pb-2`}>
                            <Text style={[tw`text-white text-xs mb-2`, { fontFamily: 'Nunito-Bold' }]}>
                                Upload images
                            </Text>
                            <TouchableOpacity
                                style={[tw`rounded-xl w-full`, { aspectRatio: 1 / 1 }]}
                                onPress={() => {
                                    if (images && images.length > 0) {
                                        // If no images, go to image_album (navigate to image_album screen)
                                        router.push('/(create)/image_album');
                                    } else {
                                        addImages();
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={tw`flex-1 justify-end`}>
                                    {[0, 1, 2].map(idx => {
                                        const img = images[idx];
                                        if (img) {
                                            return (
                                                <Image
                                                    key={idx}
                                                    source={typeof img === 'string' ? { uri: img } : img}
                                                    style={[
                                                        tw`absolute rounded-lg shadow-xl`,
                                                        idx === 0 && { left: '65%', top: '35%', width: width / 2, height: width / 2, transform: [{ translateX: '-50%' }, { translateY: '-50%' }, { rotateZ: '10deg' }] },
                                                        idx === 1 && { left: '35%', top: '45%', width: width / 2, height: width / 2, transform: [{ translateX: '-50%' }, { translateY: '-50%' }, { rotateZ: '-10deg' }] },
                                                        idx === 2 && { left: '50%', top: '60%', width: width / 2, height: width / 2, transform: [{ translateX: '-50%' }, { translateY: '-50%' }] },
                                                    ]}
                                                />
                                            );
                                        } else {
                                            return (
                                                <View
                                                    key={idx}
                                                    style={[
                                                        tw`absolute rounded-lg shadow-xl bg-gray-700 items-center justify-center`,
                                                        idx === 0 && { left: '65%', top: '35%', width: width / 2, height: width / 2, transform: [{ translateX: '-50%' }, { translateY: '-50%' }, { rotateZ: '10deg' }] },
                                                        idx === 1 && { left: '35%', top: '45%', width: width / 2, height: width / 2, transform: [{ translateX: '-50%' }, { translateY: '-50%' }, { rotateZ: '-10deg' }] },
                                                        idx === 2 && { left: '50%', top: '60%', width: width / 2, height: width / 2, transform: [{ translateX: '-50%' }, { translateY: '-50%' }] },
                                                    ]}
                                                >
                                                    {idx === 2 && <Text style={[tw`text-white text-[30] -mt-2`, { fontFamily: 'Nunito-ExtraBold' }]}>
                                                        +
                                                    </Text>}
                                                </View>
                                            );
                                        }
                                    })}
                                </View>
                            </TouchableOpacity>
                        </View>
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
                                placeholder="About this album..."
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

                    <EventDoneModal
                        visible={showEventDoneModal}
                        onClose={() => setShowEventDoneModal(false)}
                        onPublish={async () => {
                            setShowEventDoneModal(false);
                            setToastVisible(true);
                            addAlbum();
                        }}
                        onContinueEdit={() => setShowEventDoneModal(false)}
                    />
                </KeyboardAwareScrollView>
            </View>
        </View>
    );
}