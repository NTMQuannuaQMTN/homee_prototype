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
                </View>
            </KeyboardAwareScrollView >
        </View>
    );
}