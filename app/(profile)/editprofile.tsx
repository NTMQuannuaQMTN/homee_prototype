// Handle "Save changes" button press: confirm avatar and background image, and update all fields
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, GestureResponderEvent, PanResponderGestureState } from 'react-native';
// No fixed modal height; will measure content dynamically
let BG_MODAL_HEIGHT = 0;
import tw from 'twrnc';
import DraggableModal from '../components/DraggableModal';
import { Ionicons } from '@expo/vector-icons';
import UploadIcon from '../../assets/icons/uploadwhite-icon.svg';
import { useUserStore } from '../store/userStore';
import CustomDatePicker from './customdatepicker';

import { supabase } from '@/utils/supabase';
import Camera from '../../assets/icons/camera_icon.svg';

import ProfileBackgroundWrapper from './background_wrapper';

const bggreenmodal = '#22C55E';

export default function EditProfile() {
  // Draggable modal state
  const [showBgModal, setShowBgModal] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  // Focus state for each input
  const [focus, setFocus] = useState({
    name: false,
    username: false,
    bio: false,
    instagram_url: false,
    tiktok_url: false,
    snapchat_url: false,
    facebook_url: false,
    birthday: false,
  });
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [input, setInput] = useState({
    name: user?.name || null,
    username: user?.username || null,
    bio: user?.bio || null,
    facebook_url: user?.facebook_url || null,
    instagram_url: user?.instagram_url || null,
    snapchat_url: user?.snapchat_url || null,
    tiktok_url: user?.tiktok_url || null,
  });
  const [dob, setDOB] = useState(user?.birthday ? new Date(user?.birthday) : new Date());
  const [dobInput, setDOBInput] = useState(user?.birthday ? new Date(user?.birthday) : new Date());
  const [dobAvail, setDOBAvail] = useState(user?.birthday ? true : false);
  const [dobOpen, setDOBOpen] = useState(false);
  const [bgInput, setBgInput] = useState(user?.background_image || '');
  const [avtInput, setAvtInput] = useState(user?.profile_image || '');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // For modal picker, just set dobInput on change
  const onChangeDOB = (
    event: { type: string },
    date?: Date | undefined
  ) => {
    if (event.type === 'set' && date) {
      setDOBInput(date);
    } else {
      setDOBOpen(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    let d = date;
    if (typeof date === 'string') {
      d = new Date(date);
    }
    if (!(d instanceof Date) || isNaN(d.getTime())) return '';
    let year = d.getFullYear();
    let month = d.getMonth();
    let day = d.getDate();

    const monthToWord = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    return `${monthToWord[month]} ${day}, ${year}`;
  };

  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    });
    if (!result.canceled) {
      setAvtInput(result.assets[0].uri);
    }
  };

  const pickBackground = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1
    });
    if (!result.canceled) {
      setBgInput(result.assets[0].uri);
    }
  };

  const handleSave = async () => {

    setLoading(true);
    setNameError(null);
    setUsernameError(null);
    try {
      const usernameRegex = /^[a-z0-9_.]{4,}$/;
      let hasError = false;
      let usernameErr = null;
      // Username validation (now inline)
      if (!usernameRegex.test(input.username)) {
        usernameErr = 'Username can only contain a-z, 0-9, "_", ".", and has at least 4 letters.';
        hasError = true;
      } else {
        const { error } = await supabase.from('users').select('*')
          .eq('username', input.username).single();
        if (!error && user.username !== input.username) {
          usernameErr = 'Dang someone has got this username already, too bad!';
          hasError = true;
        }
      }

      const nameRegex = /^[a-zA-Z\s]{1,}$/;
      let nameErr = null;
      if (!nameRegex.test(input.name.trim())) {
        nameErr = 'The name must be at least one letters and no other symbols than alphabets.';
        hasError = true;
      }
      setNameError(nameErr);
      setUsernameError(usernameErr);
      if (hasError) {
        setLoading(false);
        return false;
      }

      const userID = user?.user_id || user?.id;
      if (!userID) throw new Error('User ID not found');

      // Prepare avatar and background upload promises
      const avatarNeedsUpload = avtInput && avtInput !== user?.profile_image && avtInput.startsWith('file');
      const backgroundNeedsUpload = bgInput && bgInput !== user?.background_image && bgInput.startsWith('file');

      // Helper for uploading an image
      const uploadImage = async (fileUri: string, type: 'avatar' | 'background') => {
        const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${type === 'avatar' ? 'avatar' : 'background'}/${userID}.${fileExtension}`;
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
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('homee-img')
          .upload(fileName, uint8Array, {
            contentType: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
            upsert: true,
          });
        if (uploadError) throw uploadError;
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('homee-img')
          .getPublicUrl(fileName);
        if (!urlData?.publicUrl) throw new Error(`Failed to get ${type} public URL`);
        return urlData.publicUrl;
      };

      // Run uploads in parallel
      const [avatarResult, backgroundResult] = await Promise.allSettled([
        avatarNeedsUpload ? uploadImage(avtInput, 'avatar') : Promise.resolve(avtInput),
        backgroundNeedsUpload ? uploadImage(bgInput, 'background') : Promise.resolve(bgInput),
      ]);

      let profileImageUrl = avtInput;
      let backgroundUrl = bgInput;

      if (avatarResult.status === 'rejected') {
        Alert.alert('Avatar Upload Error', avatarResult.reason?.message || 'Failed to upload avatar image.');
        setLoading(false);
        return;
      } else if (avatarResult.status === 'fulfilled') {
        profileImageUrl = avatarResult.value;
      }

      if (backgroundResult.status === 'rejected') {
        Alert.alert('Background Upload Error', backgroundResult.reason?.message || 'Failed to upload background image.');
        setLoading(false);
        return;
      } else if (backgroundResult.status === 'fulfilled') {
        backgroundUrl = backgroundResult.value;
      }

      // 3. Update user fields in Supabase
      // Ensure birthdate is a string in YYYY-MM-DD format for Supabase date type (local, not UTC)
      let birthdate: string | null = null;
      if (dob instanceof Date && !isNaN(dob.getTime()) && dobAvail) {
        // Format as YYYY-MM-DD using local time to avoid timezone shift
        const year = dob.getFullYear();
        const month = String(dob.getMonth() + 1).padStart(2, '0');
        const day = String(dob.getDate()).padStart(2, '0');
        birthdate = `${year}-${month}-${day}`;
      } else if (typeof dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dob) && dobAvail) {
        birthdate = dob;
      } else {
        birthdate = null;
      }

      const updateFields = {
        name: input.name,
        username: input.username,
        bio: input.bio,
        facebook_url: input.facebook_url,
        instagram_url: input.instagram_url,
        snapchat_url: input.snapchat_url,
        tiktok_url: input.tiktok_url,
        birthday: birthdate,
        profile_image: profileImageUrl,
        background_image: backgroundUrl,
      };
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', userID)
        .select();
      if (updateError) throw updateError;

      // 4. Update local user store
      setUser({
        ...user,
        ...updateFields,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.replace({ pathname: '/(profile)/profile', params: { user_id: user?.id } });
      }, 1200);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = (selectedDate: Date) => {
    setDOBInput(selectedDate);
    setDOBAvail(true);
  };

  return (
    <>
      <ProfileBackgroundWrapper imageUrl={bgInput}>
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            if (dobOpen) {
              setDOB(dobInput);
              setDOBOpen(false);
            }
          }}
          accessible={false}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: Object.values(focus).some(Boolean) ? 20 : 0 }}
            >
              <View style={{ marginTop: 50, paddingTop: 3, marginHorizontal: 'auto', width: '90%', paddingBottom: 10 }}>
                <Text style={[tw`w-full text-center text-white text-[16px] mb-4`, { fontFamily: 'Nunito-ExtraBold' }]}>Edit profile</Text>
                {/* Change background button */}
                <TouchableOpacity
                  style={[ 
                    tw`flex-row rounded-xl items-center justify-center mb-4 bg-white p-2.5`
                  ]}
                  onPress={() => setShowBgModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={tw`flex-row gap-2 items-center`}>
                    <Camera />
                    <Text style={[tw`text-black`, { fontFamily: 'Nunito-ExtraBold', fontSize: 15 }]}>Change background</Text>
                  </View>
                </TouchableOpacity>
      {/* Draggable Modal for background actions */}
      <DraggableModal
        visible={showBgModal}
        onClose={() => setShowBgModal(false)}
        title="Background options"
        buttons={[
          {
            label: 'Upload new background',
            onPress: async () => {
              await pickBackground();
              setShowBgModal(false);
            },
            icon: <UploadIcon width={20} height={20} style={tw`mr-1.5`} />,
            color: 'bg-green-500',
            textColor: 'text-white',
            testID: 'upload-bg-btn',
          },
          {
            label: 'Remove background',
            onPress: () => {
              setBgInput('');
              setShowBgModal(false);
            },
            icon: <Ionicons name="trash-outline" size={20} color="white" style={tw`mr-1.5`} />,
            color: 'bg-rose-600',
            textColor: 'text-white',
            testID: 'remove-bg-btn',
          },
          {
            label: 'Not now',
            onPress: () => setShowBgModal(false),
            color: 'bg-white/5',
            textColor: 'text-white',
            testID: 'notnow-bg-btn',
          },
        ]}
      />
                {/* Profile picture */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 120, height: 120, position: 'relative' }}>
                    <TouchableOpacity
                      style={[tw`rounded-full border-2 border-white`, { width: 120, height: 120, overflow: 'hidden', backgroundColor: '#222' }]}
                      onPress={pickAvatar}
                      activeOpacity={0.7}
                    >
                      {/* Fast loading profile image with fallback and cache busting */}
                      {avtInput ? (
                        <Image
                          source={{ uri: avtInput + (avtInput.startsWith('file') ? '' : `?cb=${user?.id || ''}`) }}
                          style={{ width: 120, height: 120 }}
                          resizeMode="cover"
                          defaultSource={require('../../assets/icons/pfpdefault.svg')}
                          onError={() => { }}
                        />
                      ) : (
                        <Image
                          source={require('../../assets/icons/pfpdefault.svg')}
                          style={{ width: 120, height: 120 }}
                          resizeMode="cover"
                        />
                      )}
                    </TouchableOpacity>
                    {/* Camera icon absolutely positioned OVER the border and image */}
                    <TouchableOpacity
                      onPress={pickAvatar}
                      activeOpacity={0.7}
                      style={{ position: 'absolute', bottom: 1, right: 1, backgroundColor: 'white', borderRadius: 999, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, zIndex: 10 }}
                    >
                      <Camera width={18} height={18} />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Input fields */}
                <View style={{ width: '100%' }}>
                  <View style={tw`flex-row mb-2`}>
                    {/* First name */}
                    <View style={tw`flex-1`}>
                      <ImageBackground
                        source={require('../../assets/images/galaxy.jpg')}
                        imageStyle={{ borderRadius: 8, opacity: focus.name ? 0.3 : 0 }}
                        style={{ borderRadius: 8 }}
                      >
                        <TextInput
                          style={[
                            tw`px-4 py-2.5 text-center text-[15px]`,
                            {
                              fontFamily: 'Nunito-ExtraBold',
                              color: input.name && input.name.trim() ? '#fff' : '#fff',
                              borderWidth: 1,
                              borderColor: focus.name ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                              backgroundColor: focus.name ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                              borderRadius: 8,
                            }
                          ]}
                          placeholder='Name'
                          value={input.name}
                          onChangeText={(newName) => {
                            setInput(input => ({ ...input, name: newName }));
                            if (nameError) setNameError(null);
                          }}
                          placeholderTextColor={'#9CA3AF'}
                          onFocus={() => setFocus(f => ({ ...f, name: true }))}
                          onBlur={() => setFocus(f => ({ ...f, name: false }))}
                        />
                      </ImageBackground>
                      {nameError && (
                        <Text style={[tw`text-rose-500 text-xs mt-1 leading-1.2`, { fontFamily: 'Nunito-Medium' }]}>{nameError}</Text>
                      )}
                    </View>
                  </View>
                  <View style={tw`mb-2`}>
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.username ? 0.3 : 0 }}
                      style={{ borderRadius: 8 }}
                    >
                      <TextInput
                        style={[
                          tw`px-4 py-2.5 text-center text-[15px]`,
                          {
                            fontFamily: 'Nunito-ExtraBold',
                            color: input.username && input.username.trim() ? '#fff' : '#fff',
                            borderWidth: 1,
                            borderColor: focus.username ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                            backgroundColor: focus.username ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                          }
                        ]}
                        placeholder='Username'
                        value={input.username}
                        onChangeText={(newName) => {
                          setInput(input => ({ ...input, username: newName }));
                          if (usernameError) setUsernameError(null);
                        }}
                        placeholderTextColor={'#9CA3AF'}
                        onFocus={() => setFocus(f => ({ ...f, username: true }))}
                        onBlur={() => setFocus(f => ({ ...f, username: false }))}
                      />
                    </ImageBackground>
                    {usernameError && (
                      <Text style={[tw`text-rose-500 text-xs mt-1 leading-1.2`, { fontFamily: 'Nunito-Medium' }]}>{usernameError}</Text>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setDOBOpen(true)}
                    style={tw`mb-2`}
                    accessibilityRole="button"
                    accessibilityLabel="Add your birthday"
                  >
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.birthday ? 0.3 : 0 }}
                      style={{ borderRadius: 8 }}
                    >
                      <TextInput
                        style={[
                          tw`px-4 py-2.5 text-center text-[15px]`,
                          {
                            fontFamily: 'Nunito-ExtraBold',
                            color: dobAvail && dob ? '#fff' : '#fff',
                            borderWidth: 1,
                            borderColor: focus.birthday ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                            backgroundColor: focus.birthday ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                          }
                        ]}
                        placeholder='Add your birthday (optional)'
                        value={dobAvail ? formatDate(dob) : ''}
                        editable={false}
                        pointerEvents="none"
                        placeholderTextColor={'#9CA3AF'}
                        onFocus={() => setFocus(f => ({ ...f, birthday: true }))}
                        onBlur={() => setFocus(f => ({ ...f, birthday: false }))}
                      />
                    </ImageBackground>
                  </TouchableOpacity>

                  <View style={tw`mb-1`}>
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.bio ? 0.3 : 0 }}
                      style={{ borderRadius: 8 }}
                    >
                      <TextInput
                        style={[
                          tw`px-4 py-2.5 text-[15px]`,
                          {
                            fontFamily: 'Nunito-ExtraBold',
                            color: input.bio && input.bio.trim() ? '#fff' : '#fff',
                            borderWidth: 1,
                            borderColor: focus.bio ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                            backgroundColor: focus.bio ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            textAlignVertical: 'center',
                            minHeight: 40,
                          },
                        ]}
                        placeholder='Add a bio (optional)'
                        value={input.bio}
                        maxLength={100}
                        onChangeText={(newInp) => setInput(input => ({ ...input, bio: newInp }))}
                        placeholderTextColor={'#9CA3AF'}
                        onFocus={() => setFocus(f => ({ ...f, bio: true }))}
                        onBlur={() => setFocus(f => ({ ...f, bio: false }))}
                        multiline={false}
                        scrollEnabled={true}
                        textAlign="center"
                      />
                    </ImageBackground>
                    <View style={{ alignItems: 'flex-end', marginRight: 4, marginTop: 4 }}>
                      <Text
                        style={[
                          tw`${(input.bio?.length || 0) === 100 ? 'text-rose-600' : 'text-gray-400'} text-[10px]`,
                          { fontFamily: 'Nunito-Medium' }
                        ]}
                      >
                        {(input.bio?.length || 0)}/100
                      </Text>
                    </View>
                  </View>

                  <Text style={[tw`text-white mb-2.5`, { fontFamily: 'Nunito-ExtraBold', fontSize: 15 }]}>
                    Your social media (optional)
                  </Text>
                  <View style={{ gap: 8, marginBottom: 16 }}>
                    {/* Instagram */}
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.instagram_url ? 0.3 : 0 }}
                      style={{ borderRadius: 8, marginBottom: 0 }}
                    >
                      <View
                        style={[
                          tw`flex-row items-center`,
                          {
                            borderWidth: 1,
                            borderColor: focus.instagram_url ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                            backgroundColor: focus.instagram_url ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            height: 48,
                            paddingHorizontal: 12,
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <Ionicons name="logo-instagram" size={20} color="#fff" style={{ marginRight: 8, zIndex: 1 }} />
                        <TextInput
                          style={[
                            tw`flex-1 text-left px-2 text-[15px]`,
                            {
                              fontFamily: 'Nunito-Bold',
                              color: input.instagram_url && input.instagram_url.trim() ? '#fff' : '#fff',
                              backgroundColor: 'transparent',
                              borderWidth: 0,
                              height: 40,
                              textAlignVertical: 'center',
                              paddingVertical: 0,
                              zIndex: 1,
                            },
                          ]}
                          placeholder="username"
                          value={input.instagram_url}
                          onChangeText={(newInp) => setInput(input => ({ ...input, instagram_url: newInp }))}
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => setFocus(f => ({ ...f, instagram_url: true }))}
                          onBlur={() => setFocus(f => ({ ...f, instagram_url: false }))}
                        />
                      </View>
                    </ImageBackground>
                    {/* TikTok (using Ionicons logo-tiktok) */}
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.tiktok_url ? 0.3 : 0 }}
                      style={{ borderRadius: 8, marginBottom: 0 }}
                    >
                      <View
                        style={[
                          tw`flex-row items-center`,
                          {
                            borderWidth: 1,
                            borderColor: focus.tiktok_url ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                            backgroundColor: focus.tiktok_url ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            height: 48,
                            paddingHorizontal: 12,
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <Ionicons name="logo-tiktok" size={20} color="#fff" style={{ marginRight: 8, zIndex: 1 }} />
                        <TextInput
                          style={[ 
                            tw`flex-1 text-left px-2 text-[15px]`,
                            {
                              fontFamily: 'Nunito-Bold',
                              color: input.tiktok_url && input.tiktok_url.trim() ? '#fff' : '#fff',
                              backgroundColor: 'transparent',
                              borderWidth: 0,
                              height: 40,
                              textAlignVertical: 'center',
                              paddingVertical: 0,
                              zIndex: 1,
                            },
                          ]}
                          placeholder="username"
                          value={input.tiktok_url}
                          onChangeText={(newInp) => setInput(input => ({ ...input, tiktok_url: newInp }))}
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => setFocus(f => ({ ...f, tiktok_url: true }))}
                          onBlur={() => setFocus(f => ({ ...f, tiktok_url: false }))}
                        />
                      </View>
                    </ImageBackground>
                    {/* Snapchat (using Ionicons logo-snapchat) */}
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.snapchat_url ? 0.3 : 0 }}
                      style={{ borderRadius: 8, marginBottom: 0 }}
                    >
                      <View
                        style={[
                          tw`flex-row items-center`,
                          {
                            borderWidth: 1,
                            borderColor: focus.snapchat_url ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                            backgroundColor: focus.snapchat_url ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            height: 48,
                            paddingHorizontal: 12,
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <Ionicons name="logo-snapchat" size={20} color="#fff" style={{ marginRight: 8, zIndex: 1 }} />
                        <TextInput
                          style={[ 
                            tw`flex-1 text-left px-2 text-[15px]`,
                            {
                              fontFamily: 'Nunito-Bold',
                              color: input.snapchat_url && input.snapchat_url.trim() ? '#fff' : '#fff',
                              backgroundColor: 'transparent',
                              borderWidth: 0,
                              height: 40,
                              textAlignVertical: 'center',
                              paddingVertical: 0,
                              zIndex: 1,
                            },
                          ]}
                          placeholder="username"
                          value={input.snapchat_url}
                          onChangeText={(newInp) => setInput(input => ({ ...input, snapchat_url: newInp }))}
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => setFocus(f => ({ ...f, snapchat_url: true }))}
                          onBlur={() => setFocus(f => ({ ...f, snapchat_url: false }))}
                        />
                      </View>
                    </ImageBackground>
                    {/* Facebook (using Ionicons logo-facebook) */}
                    <ImageBackground
                      source={require('../../assets/images/galaxy.jpg')}
                      imageStyle={{ borderRadius: 8, opacity: focus.facebook_url ? 0.3 : 0 }}
                      style={{ borderRadius: 8, marginBottom: 0 }}
                    >
                      <View
                        style={[
                          tw`flex-row items-center`,
                          {
                            borderWidth: 1,
                            borderColor: focus.facebook_url ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                            backgroundColor: focus.facebook_url ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            height: 48,
                            paddingHorizontal: 12,
                            alignItems: 'center',
                          },
                        ]}
                      >
                        <Ionicons name="logo-facebook" size={20} color="#fff" style={{ marginRight: 8, zIndex: 1 }} />
                        <TextInput
                          style={[ 
                            tw`flex-1 text-left px-2 text-[15px]`,
                            {
                              fontFamily: 'Nunito-Bold',
                              color: input.facebook_url && input.facebook_url.trim() ? '#fff' : '#fff',
                              backgroundColor: 'transparent',
                              borderWidth: 0,
                              height: 40,
                              textAlignVertical: 'center',
                              paddingVertical: 0,
                              zIndex: 1,
                            },
                          ]}
                          placeholder="username"
                          value={input.facebook_url}
                          onChangeText={(newInp) => setInput(input => ({ ...input, facebook_url: newInp }))}
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => setFocus(f => ({ ...f, facebook_url: true }))}
                          onBlur={() => setFocus(f => ({ ...f, facebook_url: false }))}
                        />
                      </View>
                    </ImageBackground>
                  </View>
                  {/* Save/Not now buttons moved below */}
                </View>
              </View>
              <View style={{ paddingHorizontal: '5%' }}>
                <TouchableOpacity
                  style={[
                    tw`bg-white rounded-full py-2.5 w-full items-center`,
                    (!(input.name && input.name.trim() && input.username && input.username.trim()) || loading) && tw`opacity-50`
                  ]}
                  onPress={handleSave}
                  activeOpacity={input.name && input.name.trim() && input.username && input.username.trim() && !loading ? 0.85 : 1}
                  disabled={!(input.name && input.name.trim() && input.username && input.username.trim()) || loading}
                >
                  <Text style={[tw`text-black text-[16px]`, { fontFamily: 'Nunito-ExtraBold', opacity: input.name && input.name.trim() && input.username && input.username.trim() && !loading ? 1 : 0.5 }]}>
                    {loading ? 'Saving...' : 'Save changes'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    tw`bg-white/5 rounded-full py-2.5 w-full items-center mt-2.5`,
                  ]}
                  onPress={() => router.replace({ pathname: '/(profile)/profile', params: { user_id: user?.id } })}
                  activeOpacity={0.85}
                >
                  <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Not now</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            {/* Success Toast Modal */}
            {showSuccess && (
              <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999,
              }}
              pointerEvents="none"
              >
              <View style={[tw`px-6 py-2 rounded-full shadow-lg`, { backgroundColor: bggreenmodal, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <Text style={[tw`text-white text-[16px]`, { fontFamily: 'Nunito-ExtraBold' }]}>Profile updated successfully 🥳</Text>
              </View>
              </View>
            )}
            {/* Overlay for date picker (iOS & Android) */}
            {dobOpen && (
              <View style={tw`w-full h-full flex-col-reverse absolute top-0 left-0 bg-black bg-opacity-60 z-[99]`} pointerEvents="box-none">
                <TouchableWithoutFeedback
                  onPress={() => {
                    Keyboard.dismiss();
                    setDOBOpen(false);
                  }}
                  accessible={false}
                >
                  <View style={tw`w-full h-full`} />
                </TouchableWithoutFeedback>
                {/* Animated Date Picker Modal */}
                <AnimatedDatePickerModal
                  visible={dobOpen}
                  onCancel={() => {
                    setDOBInput(dob);
                    setDOBOpen(false);
                  }}
                  onSave={async (date) => {
                    setDOB(date);
                    setDOBAvail(true);
                    setDOBOpen(false);
                    // Update birthdate in database immediately
                    try {
                      const userID = user?.user_id || user?.id;
                      if (!userID) throw new Error('User ID not found');
                      const birthdate = date instanceof Date && !isNaN(date.getTime())
                        ? date.toISOString().split('T')[0]
                        : null;
                      if (birthdate) {
                        await supabase
                          .from('users')
                          .update({ birthdate })
                          .eq('id', userID);
                        setUser({ ...user, birthdate });
                      }
                    } catch (err) {
                      // Optionally show error
                      Alert.alert('Error', 'Failed to update birthdate.');
                    }
                  }}
                  initialDate={dob}
                  onDateChange={setDOBInput}
                  textColor="#FFFFFF"
                  maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 15))}
                  minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))}
                />
              </View>
            )}
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback >
      </ProfileBackgroundWrapper>
    </>
  );
}

// AnimatedDatePickerModal: wrapper for CustomDatePicker with slide-up animation and overlay fade

const AnimatedDatePickerModal = ({
  visible,
  onCancel,
  onSave,
  initialDate,
  onDateChange,
  textColor,
  maximumDate,
  minimumDate
}: {
  visible: boolean;
  onCancel: () => void;
  onSave: (date: Date) => void;
  initialDate: Date;
  onDateChange: (date: Date) => void;
  textColor?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}) => {
  const modalHeight = 370;
  const slideAnim = useRef(new Animated.Value(1)).current; // always start hidden
  const overlayAnim = useRef(new Animated.Value(0)).current; // overlay opacity
  const pan = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  // PanResponder for drag-to-dismiss
  const PanResponder = require('react-native').PanResponder;
  // Track if a picker is being interacted with
  const [pickerActive, setPickerActive] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !pickerActive,
      onMoveShouldSetPanResponder: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => !pickerActive && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        slideAnim.stopAnimation();
        pan.setOffset((slideAnim as any).__getValue ? (slideAnim as any).__getValue() : 0);
        pan.setValue(0);
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const clampedDy = Math.max(0, gestureState.dy);
        pan.setValue(clampedDy);
      },
      onPanResponderRelease: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        pan.flattenOffset();
        const currentPosition = (pan as any).__getValue ? (pan as any).__getValue() : 0;
        const slideDownThreshold = modalHeight * 0.3;
        const velocityThreshold = 0.5;
        if (currentPosition > slideDownThreshold || gestureState.vy > velocityThreshold) {
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            setShouldRender(false);
            pan.setValue(0);
            onCancel();
          });
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 10,
          }).start(() => {
            pan.setValue(0);
          });
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      slideAnim.setValue(1);
      pan.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => setShouldRender(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!shouldRender) return null;

  // Helper to animate slide down before closing
  // Helper to animate slide down before closing
  const handleAnimatedClose = () => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShouldRender(false);
      pan.setValue(0);
      onCancel();
    });
  };

  // Pass this to CustomDatePicker so Cancel animates
  const handleCancel = () => {
    handleAnimatedClose();
  };

  return (
    <Animated.View style={[tw`w-full h-full flex-col-reverse absolute top-0 left-0 z-[99]`, { opacity: overlayAnim }]} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableWithoutFeedback
        onPress={handleAnimatedClose}
        accessible={false}
      >
        <View style={tw`w-full h-full`} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          tw`w-full flex-col absolute left-0`,
          {
            bottom: 0,
            transform: [
              {
                translateY: Animated.add(
                  slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, modalHeight],
                  }),
                  pan
                ),
              },
            ],
            zIndex: 100,
          },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableWithoutFeedback onPress={() => { }}>
          <View>
            {/* Only the header in CustomDatePicker is draggable */}
            <CustomDatePicker
              initialDate={initialDate}
              onDateChange={onDateChange}
              onCancel={handleCancel}
              onSave={onSave}
              textColor={textColor}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              setPickerActive={setPickerActive}
              panHandlers={panResponder.panHandlers}
            />
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Animated.View>
  );
};
